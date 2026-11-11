import database from '../database/db.js';

/**
 * Service Request Controller
 * Manages the lifecycle of vehicle service requests, from creation to completion.
 */
const serviceRequestController = {
    /**
     * Retrieve all service requests with complex joins and filtering.
     */
    getAllRequests: async (req, res) => {
        try {
            const { status, clientId, vehicleId } = req.query;
            const isMySQL = process.env.DB_TYPE === 'mysql';
            const vehicleConcat = isMySQL
                ? "CONCAT(COALESCE(v.make, ''), ' ', COALESCE(v.model, ''), ' (', COALESCE(v.year, ''), ')')"
                : "(COALESCE(v.make, '') || ' ' || COALESCE(v.model, '') || ' (' || COALESCE(v.year, '') || ')')";

            let query = `
                SELECT 
                    sr.*,
                    c.full_name as client_name_joined,
                    ${vehicleConcat} as vehicle_name_joined,
                    v.license_plate,
                    ft.invoice_number,
                    ft.total_amount_due as total_amount,
                    (SELECT COALESCE(SUM(total_price), 0) FROM service_records WHERE request_id = sr.id) as running_total
                FROM service_requests sr
                LEFT JOIN clients c ON sr.client_id = c.id
                LEFT JOIN vehicles v ON sr.vehicle_id = v.id
                LEFT JOIN financial_transactions ft ON sr.id = ft.request_id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND sr.status = ?';
                params.push(status);
            }

            if (clientId) {
                query += ' AND sr.client_id = ?';
                params.push(clientId);
            }

            if (vehicleId) {
                query += ' AND sr.vehicle_id = ?';
                params.push(vehicleId);
            }

            query += ' ORDER BY sr.request_date DESC';

            const requests = await database.query(query, params);
            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch requests' });
        }
    },

    /**
     * Get real-time stats for Service Ops widgets.
     */
    getStats: async (req, res) => {
        try {
            const recurringVehicles = await database.get('SELECT COUNT(*) as count FROM (SELECT vehicle_id FROM service_requests GROUP BY vehicle_id HAVING COUNT(id) > 1)');
            const recurringClients = await database.get('SELECT COUNT(*) as count FROM (SELECT client_id FROM service_requests GROUP BY client_id HAVING COUNT(id) > 1)');
            
            res.json({ 
                success: true, 
                data: { 
                    recurringVehicles: recurringVehicles ? recurringVehicles.count : 0, 
                    recurringClients: recurringClients ? recurringClients.count : 0 
                } 
            });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch ops stats' });
        }
    },

    /**
     * Get a detailed service request by ID, including records and ledger.
     */
    getRequestById: async (req, res) => {
        try {
            const request = await database.get(
                `SELECT sr.*, ft.id as invoice_id, ft.invoice_number, ft.total_amount_due, ft.service_fee, ft.spare_parts_markup, ft.tax_rate
                 FROM service_requests sr
                 LEFT JOIN financial_transactions ft ON sr.id = ft.request_id
                 WHERE sr.id = ?`,
                [req.params.id]
            );

            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }

            if (request.invoice_id) {
                request.invoice = {
                    id: request.invoice_id,
                    invoice_number: request.invoice_number
                };
            } else {
                request.invoice = null;
            }
            delete request.invoice_id;
            delete request.invoice_number;

            const records = await database.query(
                `SELECT sr.*, si.item_name, si.item_name_ar, si.category
                 FROM service_records sr
                 LEFT JOIN service_items si ON sr.item_id = si.id
                 WHERE sr.request_id = ?`,
                [req.params.id]
            );

            let maintenanceLedger = [];
            try {
                if (request.vehicle_id) {
                    maintenanceLedger = await database.query(
                        'SELECT * FROM vehicle_maintenance_ledger WHERE vehicle_id = ?',
                        [request.vehicle_id]
                    );
                }
            } catch (ledgerErr) {
                console.warn('vehicle_maintenance_ledger query non-critical error:', ledgerErr.message);
                maintenanceLedger = [];
            }

            res.json({
                success: true,
                data: { ...request, records: records || [], maintenanceLedger: maintenanceLedger || [] }
            });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch request' });
        }
    },

    /**
     * Create a new service request record.
     */
    createRequest: async (req, res) => {
        try {
            // GOCAR-SEC-05: Require valid authenticated session with staff or customer role
            const isCustomerUser = req.user && req.user.userType === 'customer';
            const isStaffUser = req.user && (req.user.userType === 'staff' || ['Admin', 'Operator'].includes(req.user.role));

            if (!isCustomerUser && !isStaffUser) {
                return res.status(403).json({ error: 'Access denied: Valid customer or staff session required' });
            }

            const { clientId, vehicleId, serviceType, notes, mileage, requestDate, scheduledDate, scheduledTime, source } = req.body;

            let targetClientId = clientId;
            if (isCustomerUser) {
                targetClientId = req.user.id;
            }

            if (!targetClientId || !vehicleId) {
                return res.status(400).json({ error: 'Client ID and Vehicle ID are required' });
            }

            const client = await database.get('SELECT full_name FROM clients WHERE id = ?', [targetClientId]);
            const vehicle = await database.get('SELECT client_id, make, model, year, license_plate FROM vehicles WHERE id = ?', [vehicleId]);

            if (!client || !vehicle) {
                return res.status(404).json({ error: 'Client or vehicle not found' });
            }

            if (req.user && req.user.userType === 'customer' && vehicle.client_id !== req.user.id) {
                return res.status(403).json({ error: 'Unauthorized: You do not own this vehicle' });
            }

            const vehicleInfo = `${vehicle.make} ${vehicle.model} ${vehicle.year}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`;

            const result = await database.run(
                `INSERT INTO service_requests (
                    client_id, vehicle_id, service_type, client_name, vehicle_info, 
                    notes, mileage, request_date, scheduled_date, scheduled_time, source
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    targetClientId, 
                    vehicleId, 
                    serviceType, 
                    client.full_name, 
                    vehicleInfo, 
                    notes, 
                    mileage || 0, 
                    requestDate || new Date().toISOString(),
                    scheduledDate || null,
                    scheduledTime || null,
                    source || (req.user?.userType === 'customer' ? 'PORTAL' : 'STAFF')
                ]
            );

            res.status(201).json({
                success: true,
                message: 'Service request created successfully',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to create request' });
        }
    },

    /**
     * Update the status of a service request.
     */
    updateStatus: async (req, res) => {
        try {
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            const validStatuses = ['Open', 'In Progress', 'Complete', 'Completed', 'Invoiced', 'Paid', 'Parts Ordered', 'Waiting for Parts'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const result = await database.run(
                `UPDATE service_requests 
                 SET status = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [status, req.params.id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }

            if (['Complete', 'Completed', 'Paid'].includes(status)) {
                const { updateMaintenanceLedger } = await import('../utils/maintenance-helper.js');
                await updateMaintenanceLedger(req.params.id);
            }

            res.json({ success: true, message: 'Status updated successfully' });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to update status' });
        }
    },

    /**
     * Delete a service request record.
     */
    deleteRequest: async (req, res) => {
        try {
            const result = await database.run('DELETE FROM service_requests WHERE id = ?', [req.params.id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }

            res.json({ success: true, message: 'Service request deleted successfully' });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete request' });
        }
    },

    /**
     * Update mileage for an existing service request.
     */
    updateMileage: async (req, res) => {
        const requestId = req.params.id;
        const { mileage } = req.body;

        try {
            const numericMileage = parseInt(mileage);
            if (isNaN(numericMileage)) {
                return res.status(400).json({ error: 'Valid mileage is required' });
            }

            const tx = await database.beginTransaction();

            try {
                await database.run(
                    'UPDATE service_requests SET mileage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [numericMileage, requestId],
                    tx
                );

                await database.run(
                    'UPDATE service_records SET mileage = ?, updated_at = CURRENT_TIMESTAMP WHERE request_id = ?',
                    [numericMileage, requestId],
                    tx
                );

                await database.commit(tx);
                res.json({ success: true, message: 'Mileage updated successfully' });
            } catch (dbError) {
                await database.rollback(tx);
                throw dbError;
            }
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to update mileage' });
        }
    },

    /**
     * Assign a technician to a service request.
     */
    assignTechnician: async (req, res) => {
        try {
            const { technicianId } = req.body;

            if (!technicianId) {
                return res.status(400).json({ error: 'Technician ID is required' });
            }

            const user = await database.get('SELECT name FROM users WHERE id = ?', [technicianId]);
            if (!user) {
                return res.status(404).json({ error: 'Technician not found' });
            }

            const result = await database.run(
                `UPDATE service_requests 
                 SET assigned_to_id = ?, assigned_to_name = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [technicianId, user.name, req.params.id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }

            res.json({ success: true, message: 'Technician assigned successfully', data: { assigned_to_name: user.name } });
        } catch (error) {
            console.error('SERVER_REQUEST_ERROR:', error);
            res.status(500).json({ error: 'Failed to assign technician' });
        }
    }
};

export default serviceRequestController;
