import database from '../database/db.js';

/**
 * Customer Portal Controller
 * Manages the self-service interface and restricted data access for vehicle owners.
 */
const customerPortalController = {
    /**
     * Retrieve a localized dashboard summary for the authenticated customer.
     */
    getDashboard: async (req, res) => {
        try {
            const customerId = req.user.id;

            const stats = await database.get(
                `SELECT 
                    COUNT(DISTINCT v.id) as totalVehicles,
                    COUNT(DISTINCT sr.id) as totalServices,
                    (SELECT COALESCE(SUM(total_amount_due), 0) FROM financial_transactions 
                     WHERE request_id IN (SELECT id FROM service_requests WHERE client_id = ?)) as totalSpent
                 FROM clients c
                 LEFT JOIN vehicles v ON c.id = v.client_id
                 LEFT JOIN service_requests sr ON v.id = sr.vehicle_id
                 WHERE c.id = ? GROUP BY c.id`,
                [customerId, customerId]
            );

            const upcomingService = await database.query(
                `SELECT * FROM vehicles WHERE client_id = ? 
                 ORDER BY next_service_due ASC NULLS LAST, id DESC LIMIT 3`,
                [customerId]
            );

            res.json({
                success: true,
                data: {
                    stats: stats || { totalVehicles: 0, totalServices: 0, totalSpent: 0 },
                    upcomingService
                }
            });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to synchronize portal data' });
        }
    },

    /**
     * Retrieve the comprehensive service history for the customer's fleet.
     */
    getServiceHistory: async (req, res) => {
        try {
            const customerId = req.user.id;
            const history = await database.query(
                'SELECT * FROM service_history WHERE client_id = ? ORDER BY service_date DESC',
                [customerId]
            );
            res.json({ success: true, data: history });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to access service records' });
        }
    },

    /**
     * Retrieve all financial transactions/invoices for the customer.
     */
    getInvoices: async (req, res) => {
        try {
            const customerId = req.user.id;
            const invoices = await database.query(
                `SELECT ft.*, sr.service_type, v.make, v.model, v.license_plate
                 FROM financial_transactions ft
                 JOIN service_requests sr ON ft.request_id = sr.id
                 JOIN vehicles v ON sr.vehicle_id = v.id
                 WHERE sr.client_id = ?
                 ORDER BY ft.created_at DESC`,
                [customerId]
            );
            res.json({ success: true, data: invoices });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to retrieve invoice history' });
        }
    },

    /**
     * Retrieve detailed information for all vehicles in the customer's garage.
     */
    getVehicles: async (req, res) => {
        try {
            const customerId = req.user.id;
            const vehicles = await database.query(
                'SELECT * FROM vehicles WHERE client_id = ? ORDER BY last_service_date DESC',
                [customerId]
            );
            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to synchronize garage data' });
        }
    },

    /**
     * Retrieve upcoming service appointments (scheduled service requests).
     */
    getAppointments: async (req, res) => {
        try {
            const customerId = req.user.id;
            const appointments = await database.query(
                `SELECT sr.id, sr.service_type, sr.status, sr.scheduled_date, sr.scheduled_time, sr.notes,
                        v.make, v.model, v.year, v.license_plate
                 FROM service_requests sr
                 JOIN vehicles v ON sr.vehicle_id = v.id
                 WHERE v.client_id = ?
                   AND sr.scheduled_date IS NOT NULL
                 ORDER BY sr.scheduled_date ASC`,
                [customerId]
            );
            res.json({ success: true, data: appointments });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to retrieve appointments' });
        }
    },

    /**
     * Retrieve pending service reminders for the customer's vehicles.
     */
    getReminders: async (req, res) => {
        try {
            const customerId = req.user.id;
            const reminders = await database.query(
                `SELECT r.id, r.service_type, r.due_date, r.notes, r.status,
                        r.interval_km, r.interval_months,
                        v.make, v.model, v.year, v.license_plate
                 FROM service_reminders r
                 JOIN vehicles v ON r.vehicle_id = v.id
                 WHERE r.client_id = ? AND r.status = 'Pending'
                 ORDER BY r.due_date ASC
                 LIMIT 5`,
                [customerId]
            );
            res.json({ success: true, data: reminders });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to retrieve reminders' });
        }
    },

    /**
     * Update customer profile intelligence.
     */
    updateProfile: async (req, res) => {
        try {
            const customerId = req.user.id;
            const { full_name, email, phone } = req.body;

            await database.run(
                'UPDATE clients SET full_name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [full_name, email, phone, customerId]
            );

            res.json({ success: true, message: 'Profile updated successfully' });
        } catch (error) {
            console.error('SERVER_PORTAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    },

    /**
     * Submit a request to sell a customer's registered vehicle (Used Car Consignment).
     */
    createSellRequest: async (req, res) => {
        try {
            const customerId = req.user.id;
            const { vehicleId, askingPrice, currentMileage, notes } = req.body;

            if (!vehicleId) {
                return res.status(400).json({ success: false, error: 'Vehicle ID is required' });
            }

            // Verify the vehicle belongs to this authenticated customer
            const vehicle = await database.get(
                'SELECT * FROM vehicles WHERE id = ? AND client_id = ?',
                [vehicleId, customerId]
            );

            if (!vehicle) {
                return res.status(404).json({ success: false, error: 'Vehicle not found or does not belong to you' });
            }

            const mileage = currentMileage !== undefined && currentMileage !== null && currentMileage !== ''
                ? parseInt(currentMileage, 10)
                : vehicle.current_mileage;

            const price = askingPrice ? parseFloat(askingPrice) : null;

            const result = await database.run(
                `INSERT INTO consignment_requests (client_id, vehicle_id, asking_price, current_mileage, notes, status)
                 VALUES (?, ?, ?, ?, ?, 'New')`,
                [customerId, vehicleId, price, mileage, notes || null]
            );

            res.status(201).json({
                success: true,
                message: 'Sale request submitted successfully. GoCar team will contact you shortly.',
                data: { id: result.id, vehicleId, status: 'New' }
            });
        } catch (error) {
            console.error('SERVER_PORTAL_SELL_REQUEST_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to submit sale request' });
        }
    },

    /**
     * Get active sell requests for the authenticated customer.
     */
    getSellRequests: async (req, res) => {
        try {
            const customerId = req.user.id;
            const requests = await database.query(
                `SELECT cr.*, v.make, v.model, v.year, v.license_plate
                 FROM consignment_requests cr
                 JOIN vehicles v ON cr.vehicle_id = v.id
                 WHERE cr.client_id = ?
                 ORDER BY cr.created_at DESC`,
                [customerId]
            );
            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('SERVER_PORTAL_GET_SELL_REQUESTS_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve sale requests' });
        }
    }
};

export default customerPortalController;
