import bcrypt from 'bcrypt';
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
                 ORDER BY CASE WHEN next_service_due IS NULL THEN 1 ELSE 0 END, next_service_due ASC, id DESC LIMIT 3`,
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
     * Combines itemized service records with invoiced service requests to ensure
     * a complete digital ledger is always returned even if raw item records are missing.
     */
    getServiceHistory: async (req, res) => {
        try {
            const customerId = req.user.id;
            const isMySQL = process.env.DB_TYPE === 'mysql';
            const vehicleConcat = isMySQL
                ? "CONCAT(COALESCE(v.make, ''), ' ', COALESCE(v.model, ''), ' (', COALESCE(v.year, ''), ')')"
                : "(COALESCE(v.make, '') || ' ' || COALESCE(v.model, '') || ' (' || COALESCE(v.year, '') || ')')";

            // 1. Fetch all itemized service records
            let records = await database.query(`
                SELECT 
                    sr.id AS record_id,
                    sr.service_date,
                    c.id AS client_id,
                    c.full_name AS client_name,
                    c.email AS client_email,
                    c.phone AS client_mobile,
                    v.id AS vehicle_id,
                    ${vehicleConcat} AS vehicle_info,
                    v.license_plate,
                    v.vin,
                    COALESCE(sr.mileage, sreq.mileage, v.current_mileage, 0) as mileage,
                    COALESCE(si.item_name, sreq.service_type, 'Service') AS item_name,
                    COALESCE(si.item_name_ar, sreq.service_type, 'صيانة') AS item_name_ar,
                    COALESCE(si.category, 'Service') AS category,
                    sr.quantity,
                    sr.unit_price,
                    sr.total_price,
                    u.name AS serviced_by,
                    sreq.id AS request_id,
                    sreq.service_type,
                    sreq.status AS request_status,
                    ft.id AS invoice_id,
                    ft.invoice_number,
                    ft.payment_status,
                    ft.service_fee,
                    ft.spare_parts_markup,
                    ft.total_amount_due
                FROM service_records sr
                JOIN service_requests sreq ON sr.request_id = sreq.id
                JOIN clients c ON sreq.client_id = c.id
                JOIN vehicles v ON sreq.vehicle_id = v.id
                LEFT JOIN service_items si ON sr.item_id = si.id
                LEFT JOIN users u ON sr.user_id = u.id
                LEFT JOIN financial_transactions ft ON sreq.id = ft.request_id
                WHERE c.id = ?
                ORDER BY sr.service_date DESC, sr.id DESC
            `, [customerId]);

            if (!Array.isArray(records)) {
                records = [];
            }

            // 2. Also retrieve any invoiced requests that do not have itemized service_records
            //    (guarantees customer sees log entries for all invoiced services)
            const recordedRequestIds = new Set(records.map(r => r.request_id));

            const invoicedRequests = await database.query(`
                SELECT 
                    sreq.id * 10000 AS record_id,
                    COALESCE(ft.payment_date, sreq.scheduled_date, sreq.request_date) AS service_date,
                    c.id AS client_id,
                    c.full_name AS client_name,
                    c.email AS client_email,
                    c.phone AS client_mobile,
                    v.id AS vehicle_id,
                    ${vehicleConcat} AS vehicle_info,
                    v.license_plate,
                    v.vin,
                    COALESCE(sreq.mileage, v.current_mileage, 0) as mileage,
                    COALESCE(sreq.service_type, 'General Service') AS item_name,
                    COALESCE(sreq.service_type, 'صيانة عامة') AS item_name_ar,
                    'Service' AS category,
                    1 AS quantity,
                    ft.total_amount_due AS unit_price,
                    ft.total_amount_due AS total_price,
                    sreq.assigned_to_name AS serviced_by,
                    sreq.id AS request_id,
                    sreq.service_type,
                    sreq.status AS request_status,
                    ft.id AS invoice_id,
                    ft.invoice_number,
                    ft.payment_status,
                    ft.service_fee,
                    ft.spare_parts_markup,
                    ft.total_amount_due
                FROM service_requests sreq
                JOIN clients c ON sreq.client_id = c.id
                JOIN vehicles v ON sreq.vehicle_id = v.id
                JOIN financial_transactions ft ON sreq.id = ft.request_id
                WHERE c.id = ?
            `, [customerId]);

            if (Array.isArray(invoicedRequests)) {
                for (const invReq of invoicedRequests) {
                    if (!recordedRequestIds.has(invReq.request_id)) {
                        records.push(invReq);
                    }
                }
            }

            // Sort combined list descending by date
            records.sort((a, b) => new Date(b.service_date || 0) - new Date(a.service_date || 0));

            res.json({ success: true, data: records });
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
                `SELECT sr.id, sr.vehicle_id, sr.service_type, sr.status, sr.scheduled_date, sr.scheduled_time, sr.notes,
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
                `SELECT r.id, r.vehicle_id, r.service_type, r.due_date, r.notes, r.status,
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
     * Update customer self-service password.
     */
    changePassword: async (req, res) => {
        try {
            const customerId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current password and new password are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            const customer = await database.get('SELECT password_hash FROM clients WHERE id = ?', [customerId]);
            if (!customer || !customer.password_hash) {
                return res.status(400).json({ error: 'Account does not have a set password' });
            }

            const isValid = await bcrypt.compare(currentPassword, customer.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            await database.run('UPDATE clients SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, customerId]);

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('SERVER_PORTAL_PASSWORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to update password' });
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
