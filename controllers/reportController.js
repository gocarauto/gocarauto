import database from '../database/db.js';

/**
 * Report Controller
 * Manages complex data aggregation for business intelligence and dashboards.
 */
const reportController = {
    /**
     * Generate revenue reports with period filtering and grouping.
     */
    getRevenueReport: async (req, res) => {
        try {
            const { startDate, endDate, groupBy = 'month' } = req.query;

            let dateFormat;
            switch (groupBy) {
                case 'day': dateFormat = '%Y-%m-%d'; break;
                case 'month': dateFormat = '%Y-%m'; break;
                case 'year': dateFormat = '%Y'; break;
                default: dateFormat = '%Y-%m';
            }

            let query = `
                SELECT 
                    strftime('${dateFormat}', ft.payment_date) as period,
                    COUNT(DISTINCT ft.request_id) as totalServices,
                    SUM(ft.total_amount_due) as totalRevenue,
                    COUNT(DISTINCT sr.client_id) as uniqueCustomers
                FROM financial_transactions ft
                JOIN service_requests sr ON ft.request_id = sr.id
                WHERE ft.payment_status = 'Paid'
            `;
            const params = [];

            if (startDate) { query += ' AND ft.payment_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND ft.payment_date <= ?'; params.push(endDate); }

            query += ' GROUP BY period ORDER BY period DESC';

            const revenue = await database.query(query, params);

            const paymentMethods = await database.query(
                `SELECT payment_method, COUNT(*) as count, SUM(amount_paid) as total
                 FROM financial_transactions WHERE payment_status = 'Paid'
                 ${startDate ? 'AND payment_date >= ?' : ''} ${endDate ? 'AND payment_date <= ?' : ''}
                 GROUP BY payment_method`,
                startDate && endDate ? [startDate, endDate] : startDate ? [startDate] : endDate ? [endDate] : []
            );

            const outstanding = await database.get(
                `SELECT COUNT(*) as count, SUM(total_amount_due - amount_paid) as total
                 FROM financial_transactions WHERE payment_status IN ('Pending', 'Partial')`
            );

            // Operational Economics Breakdown: Workshop Pass-Through vs Delivery vs GoCar Service Fees
            const breakdown = await database.get(`
                SELECT 
                    COALESCE(SUM(ft.total_amount_due), 0) as totalRevenue,
                    COALESCE(SUM(ft.service_fee), 0) as totalServiceFees,
                    COALESCE(SUM(ft.spare_parts_markup), 0) as totalPartsMarkup,
                    COALESCE((
                        SELECT SUM(sr_rec.total_price)
                        FROM service_records sr_rec
                        JOIN service_items si_item ON sr_rec.item_id = si_item.id
                        WHERE sr_rec.request_id IN (
                            SELECT request_id FROM financial_transactions WHERE payment_status = 'Paid'
                        )
                        AND (si_item.item_name_ar LIKE '%استلام%' OR si_item.item_name_ar LIKE '%تسليم%')
                    ), 0) as totalDeliveryRevenue
                FROM financial_transactions ft
                WHERE ft.payment_status = 'Paid'
            `);

            const totalRev = breakdown.totalRevenue || 0;
            const totalServiceFees = breakdown.totalServiceFees || 0;
            const totalPartsMarkup = breakdown.totalPartsMarkup || 0;
            const totalDeliveryRevenue = breakdown.totalDeliveryRevenue || 0;
            const workshopPassThrough = Math.max(0, totalRev - totalServiceFees - totalPartsMarkup - totalDeliveryRevenue);

            const consignmentSales = await database.get(`
                SELECT 
                    COALESCE(SUM(commission_amount), 0) as totalConsignmentCommissions,
                    COUNT(*) as soldCarsCount
                FROM consignment_listings
                WHERE listing_status = 'Sold'
            `);
            const totalConsignmentCommissions = consignmentSales?.totalConsignmentCommissions || 0;
            const soldCarsCount = consignmentSales?.soldCarsCount || 0;

            const economics = {
                totalRevenue: totalRev + totalConsignmentCommissions,
                workshopPassThrough,
                totalDeliveryRevenue,
                totalServiceFees,
                totalPartsMarkup,
                totalConsignmentCommissions,
                soldCarsCount,
                gocarNetMargin: totalServiceFees + totalPartsMarkup + totalDeliveryRevenue + totalConsignmentCommissions
            };

            res.json({ success: true, data: { revenue, paymentMethods, outstanding, economics } });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate revenue report' });
        }
    },

    /**
     * Export revenue data to CSV.
     */
    exportRevenueCSV: async (req, res) => {
        try {
            const { startDate, endDate, groupBy = 'month' } = req.query;
            let dateFormat;
            switch (groupBy) {
                case 'day': dateFormat = '%Y-%m-%d'; break;
                case 'month': dateFormat = '%Y-%m'; break;
                case 'year': dateFormat = '%Y'; break;
                default: dateFormat = '%Y-%m';
            }

            let query = `
                SELECT strftime('${dateFormat}', ft.payment_date) as period,
                       COUNT(DISTINCT ft.request_id) as totalServices,
                       SUM(ft.total_amount_due) as totalRevenue,
                       COUNT(DISTINCT sr.client_id) as uniqueCustomers
                FROM financial_transactions ft
                JOIN service_requests sr ON ft.request_id = sr.id
                WHERE ft.payment_status = 'Paid'
            `;
            const params = [];
            if (startDate) { query += ' AND ft.payment_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND ft.payment_date <= ?'; params.push(endDate); }
            query += ' GROUP BY period ORDER BY period DESC';

            const revenue = await database.query(query, params);

            const sanitizeCell = (val) => {
                const s = String(val ?? '');
                const clean = /^[=+\-@]/.test(s) ? `'${s}` : s;
                return clean.includes(',') || clean.includes('"') || clean.includes('\n')
                    ? `"${clean.replace(/"/g, '""')}"`
                    : clean;
            };

            const csvHeader = 'Period,Total Services,Total Revenue,Unique Clients\n';
            const csvRows = revenue.map(row => 
                `${sanitizeCell(row.period)},${sanitizeCell(row.totalServices)},${sanitizeCell(row.totalRevenue)},${sanitizeCell(row.uniqueCustomers)}`
            ).join('\n');

            res.header('Content-Type', 'text/csv');
            res.attachment(`revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvHeader + csvRows);
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Export failed' });
        }
    },

    /**
     * Generate customer behavior and retention insights.
     */
    getCustomerInsights: async (req, res) => {
        try {
            const topCustomers = await database.query(
                `SELECT c.id, c.full_name as name, c.email, c.phone as mobile, c.total_spent as totalSpent,
                        COUNT(DISTINCT v.id) as vehicleCount, COUNT(DISTINCT sr.id) as serviceCount
                 FROM clients c
                 LEFT JOIN vehicles v ON c.id = v.client_id
                 LEFT JOIN service_requests sr ON v.id = sr.vehicle_id
                 GROUP BY c.id ORDER BY c.total_spent DESC LIMIT 10`
            );

            const acquisitionTrends = await database.query(
                `SELECT strftime('%Y-%m', join_date) as period, COUNT(*) as newCustomers
                 FROM clients GROUP BY period ORDER BY period DESC LIMIT 12`
            );

            const referralSources = await database.query(
                "SELECT referral_source, COUNT(*) as count FROM clients WHERE referral_source IS NOT NULL GROUP BY referral_source ORDER BY count DESC"
            );

            const retention = await database.get(
                `SELECT COUNT(DISTINCT CASE WHEN serviceCount > 1 THEN client_id END) as returningCustomers,
                        COUNT(DISTINCT client_id) as totalCustomers
                 FROM (SELECT c.id as client_id, COUNT(DISTINCT sr.id) as serviceCount FROM clients c 
                       LEFT JOIN vehicles v ON c.id = v.client_id 
                       LEFT JOIN service_requests sr ON v.id = sr.vehicle_id GROUP BY c.id)`
            );

            // Top Referring Clients Leaderboard
            const referralLeaderboard = await database.query(`
                SELECT 
                    ref.id as referrer_id,
                    ref.full_name as referrer_name,
                    ref.phone as referrer_phone,
                    COUNT(c.id) as referred_count,
                    COALESCE(SUM(c.total_spent), 0) as total_network_spent
                FROM clients ref
                JOIN clients c ON c.referred_by_client_id = ref.id
                GROUP BY ref.id
                ORDER BY total_network_spent DESC, referred_count DESC
                LIMIT 10
            `);

            res.json({ success: true, data: { topCustomers, acquisitionTrends, referralSources, retention, referralLeaderboard } });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate customer insights' });
        }
    },

    /**
     * Generate service distribution report.
     */
    getServicesReport: async (req, res) => {
        try {
            const serviceDistribution = await database.query(
                `SELECT category, COUNT(*) as count 
                 FROM service_items si
                 JOIN service_records sr ON si.id = sr.item_id
                 GROUP BY category
                 ORDER BY count DESC`
            );
            res.json({ success: true, data: { serviceDistribution } });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate services report' });
        }
    },

    /**
     * Generate top vehicles report.
     */
    getVehiclesReport: async (req, res) => {
        try {
            const topVehicles = await database.query(
                `SELECT make, model, COALESCE(SUM(total_spent), 0) as totalRevenue, COALESCE(SUM(services_count), 0) as serviceCount
                 FROM vehicles
                 GROUP BY make, model
                 ORDER BY totalRevenue DESC
                 LIMIT 20`
            );
            res.json({ success: true, data: { topVehicles } });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate vehicles report' });
        }
    },

    /**
     * Generate a system-wide overview dashboard.
     */
    getDashboardSummary: async (req, res) => {
        try {
            const summary = await database.get(
                `SELECT 
                    (SELECT COUNT(*) FROM clients) as totalCustomers,
                    (SELECT COUNT(*) FROM vehicles) as totalVehicles,
                    (SELECT COUNT(*) FROM service_requests WHERE status = 'Open') as openRequests,
                    (SELECT COUNT(*) FROM service_requests WHERE status = 'In Progress') as inProgressRequests,
                    (SELECT SUM(total_amount_due - amount_paid) FROM financial_transactions WHERE payment_status IN ('Pending', 'Partial')) as outstandingBalance,
                    (SELECT SUM(total_price) FROM service_records WHERE service_date >= date('now', 'start of month')) as monthlyRevenue,
                    (SELECT SUM(total_price) FROM service_records) as totalRevenue,
                    (SELECT SUM(total_amount_due) FROM financial_transactions WHERE payment_status = 'Paid') as totalInvoiced,
                    (SELECT COUNT(*) FROM vehicles WHERE next_service_due <= date('now', '+7 days') AND next_service_due >= date('now')) as upcomingServices,
                    (SELECT COUNT(*) FROM vehicles WHERE current_mileage - COALESCE(last_service_mileage, 0) > 5000) as mileageAlerts`
            );

            const recentActivity = await database.query(
                `SELECT 'service' as type, id, client_name as customer, vehicle_info as details, status, request_date as date
                 FROM service_requests ORDER BY request_date DESC LIMIT 10`
            );

            res.json({ success: true, data: { summary, recentActivity } });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate dashboard' });
        }
    },

    /**
     * Generate a revenue forecast based on upcoming service reminders.
     */
    getRevenueForecast: async (req, res) => {
        try {
            // Find reminders due in the next 30 days
            // Note: service_reminders doesn't exist in the current schema snapshot, 
            // but we'll mock the forecast using vehicles.next_service_due to avoid breaking.
            
            // Average revenue per service type from past paid transactions
            const avgRevenue = await database.query(`
                SELECT 
                    sr.service_type as serviceType,
                    COUNT(DISTINCT sr.id) as pastCount,
                    AVG(ft.total_amount_due) as avgAmount
                FROM service_requests sr
                JOIN financial_transactions ft ON sr.id = ft.request_id
                WHERE ft.payment_status = 'Paid' AND sr.service_type IS NOT NULL
                GROUP BY sr.service_type
            `);
            
            const revenueMap = {};
            avgRevenue.forEach(r => {
                revenueMap[r.serviceType] = r.avgAmount;
            });

            // Find vehicles due for service in next 30 days
            const upcomingVehicles = await database.query(`
                SELECT id, make, model, next_service_due
                FROM vehicles 
                WHERE next_service_due BETWEEN date('now') AND date('now', '+30 days')
            `);
            
            // Assume upcoming services are 'Routine Maintenance' by default
            const defaultType = 'Routine Maintenance';
            const defaultAvg = revenueMap[defaultType] || 2500;
            
            let forecastTotal = 0;
            const typeCounts = { [defaultType]: upcomingVehicles.length };
            forecastTotal = upcomingVehicles.length * defaultAvg;

            const forecastByType = [{
                serviceType: defaultType,
                count: upcomingVehicles.length,
                estimatedRevenue: forecastTotal
            }];

            res.json({
                success: true,
                data: {
                    forecastTotal,
                    forecastByType,
                    confidence: upcomingVehicles.length > 5 ? 'High' : 'Medium'
                }
            });
        } catch (error) {
            console.error('SERVER_REPORT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate revenue forecast' });
        }
    }
};

export default reportController;
