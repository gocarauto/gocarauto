import database from '../database/db.js';
import { generateServicePassportPDF } from '../utils/pdf-generator.js';

/**
 * Vehicle Controller
 * Manages vehicle fleet data, ownership associations, and service history.
 */
const vehicleController = {
    /**
     * Retrieve all vehicles with optional client filtering and search.
     */
    getAllVehicles: async (req, res) => {
        try {
            const { clientId, search } = req.query;

            let query = 'SELECT * FROM vehicles WHERE 1=1';
            const params = [];

            if (clientId) {
                query += ' AND client_id = ?';
                params.push(clientId);
            }

            if (search) {
                query += ' AND (make LIKE ? OR model LIKE ? OR license_plate LIKE ? OR vin LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY client_name, make, model';

            const vehicles = await database.query(query, params);
            
            // Feature 1 & 6: Compute km_since_last_service and health_score
            for (const v of vehicles) {
                const lastMileage = v.last_service_mileage || 0;
                v.km_since_last_service = v.current_mileage - lastMileage;
                
                let score = 100;
                const isOverdueByDate = v.next_service_due && new Date(v.next_service_due) < new Date();
                
                if (isOverdueByDate) score -= 40;
                
                if (v.km_since_last_service > 10000) {
                    score -= 40;
                } else if (v.km_since_last_service > 5000) {
                    score -= 20;
                }
                
                // Count open service requests for this vehicle
                const openReqs = await database.get(
                    "SELECT COUNT(*) as count FROM service_requests WHERE vehicle_id = ? AND status NOT IN ('Complete', 'Completed', 'Invoiced', 'Paid')",
                    [v.id]
                );
                const openCount = openReqs ? openReqs.count : 0;
                score -= Math.min(openCount, 2) * 20;
                
                v.health_score = Math.max(0, score);
            }

            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch vehicles' });
        }
    },

    /**
     * Get a specific vehicle by ID.
     */
    getVehicleById: async (req, res) => {
        try {
            const vehicle = await database.get(
                'SELECT * FROM vehicles WHERE id = ?',
                [req.params.id]
            );

            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            // Fetch mileage history
            const mileageHistory = await database.query(
                'SELECT request_date as date, mileage FROM service_requests WHERE vehicle_id = ? AND mileage > 0 ORDER BY request_date DESC',
                [req.params.id]
            );
            
            // Computed fields for Feature 1
            const lastMileage = vehicle.last_service_mileage || 0;
            vehicle.km_since_last_service = vehicle.current_mileage - lastMileage;
            
            const isOverdueByKm = vehicle.km_since_last_service >= 5000;
            const isOverdueByDate = vehicle.next_service_due && new Date(vehicle.next_service_due) < new Date();
            vehicle.is_interval_overdue = isOverdueByKm || isOverdueByDate;
            
            vehicle.mileage_history = mileageHistory;

            res.json({ success: true, data: vehicle });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch vehicle' });
        }
    },

    /**
     * Register a new vehicle for a client.
     */
    createVehicle: async (req, res) => {
        try {
            const { clientId, make, model, year, licensePlate, vin, currentMileage } = req.body;

            if (!clientId || !make || !model) {
                return res.status(400).json({ error: 'Client ID, Make, and Model are required' });
            }

            const client = await database.get(
                'SELECT full_name FROM clients WHERE id = ?',
                [clientId]
            );

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            const finalLicensePlate = licensePlate && licensePlate.trim() !== '' ? licensePlate.trim() : null;
            const finalVin = vin && vin.trim() !== '' ? vin.trim() : null;

            const result = await database.run(
                `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [clientId, client.full_name, make, model, year, finalLicensePlate, finalVin, currentMileage || 0]
            );

            res.status(201).json({
                success: true,
                message: 'Vehicle created successfully',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            if (error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'License plate or VIN already exists' });
            }
            res.status(500).json({ error: 'Failed to create vehicle' });
        }
    },

    /**
     * Update an existing vehicle's data.
     */
    updateVehicle: async (req, res) => {
        try {
            const { make, model, year, licensePlate, vin, currentMileage } = req.body;
            const finalLicensePlate = licensePlate && licensePlate.trim() !== '' ? licensePlate.trim() : null;
            const finalVin = vin && vin.trim() !== '' ? vin.trim() : null;

            const result = await database.run(
                `UPDATE vehicles 
                 SET make = ?, model = ?, year = ?, license_plate = ?, vin = ?, current_mileage = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [make, model, year, finalLicensePlate, finalVin, currentMileage, req.params.id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            res.json({ success: true, message: 'Vehicle updated successfully' });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to update vehicle' });
        }
    },

    /**
     * Delete a vehicle record.
     */
    deleteVehicle: async (req, res) => {
        try {
            const result = await database.run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            res.json({ success: true, message: 'Vehicle deleted successfully' });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete vehicle' });
        }
    },

    /**
     * Get the full service history of a vehicle.
     */
    getServiceHistory: async (req, res) => {
        try {
            if (req.user && req.user.userType === 'customer') {
                const vehicle = await database.get('SELECT client_id FROM vehicles WHERE id = ?', [req.params.id]);
                if (!vehicle || vehicle.client_id !== req.user.id) {
                    return res.status(403).json({ error: 'Access denied: You do not own this vehicle' });
                }
            }

            const history = await database.query(
                `SELECT * FROM service_history 
                 WHERE vehicle_id = ? 
                 ORDER BY service_date DESC`,
                [req.params.id]
            );

            res.json({ success: true, data: history });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    },

    /**
     * Retrieve vehicles with upcoming service due dates.
     */
    getUpcomingService: async (req, res) => {
        try {
            const { days = 7 } = req.query;

            const vehicles = await database.query(
                `SELECT v.*, c.email, c.phone
                 FROM vehicles v
                 JOIN clients c ON v.client_id = c.id
                 WHERE v.next_service_due IS NOT NULL 
                 AND v.next_service_due <= date('now', '+' || ? || ' days')
                 AND v.next_service_due >= date('now')
                 ORDER BY v.next_service_due ASC`,
                [days]
            );

            res.json({ success: true, data: vehicles });
        } catch (error) {
            console.error('SERVER_VEHICLE_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch reminders' });
        }
    },

    /**
     * Transfer a vehicle to a new owner.
     * Moves all service requests and pending reminders to the new client.
     * Historical records remain linked via the vehicle ID.
     */
    transferVehicle: async (req, res) => {
        try {
            const vehicleId = req.params.id;
            const { newClientId } = req.body;

            if (!newClientId) {
                return res.status(400).json({ error: 'New client ID is required' });
            }

            // Verify vehicle exists
            const vehicle = await database.get('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            // Verify new client exists
            const newClient = await database.get('SELECT id, full_name FROM clients WHERE id = ?', [newClientId]);
            if (!newClient) {
                return res.status(404).json({ error: 'New client not found' });
            }

            const previousClientId = vehicle.client_id;

            if (parseInt(newClientId) === previousClientId) {
                return res.status(400).json({ error: 'Vehicle is already owned by this client' });
            }

            const tx = await database.beginTransaction();
            try {
                // 1. Transfer the vehicle itself
                await database.run(
                    `UPDATE vehicles
                     SET client_id = ?, client_name = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [newClientId, newClient.full_name, vehicleId],
                    tx
                );

                // 2. Transfer all service requests for this vehicle to the new client
                await database.run(
                    `UPDATE service_requests 
                     SET client_id = ?, client_name = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE vehicle_id = ?`,
                    [newClientId, newClient.full_name, vehicleId],
                    tx
                );

                // 3. Transfer all pending/active service reminders to new client
                await database.run(
                    `UPDATE service_reminders
                     SET client_id = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE vehicle_id = ? AND status IN ('Pending', 'Active')`,
                    [newClientId, vehicleId],
                    tx
                );

                await database.commit(tx);
            } catch (err) {
                await database.rollback(tx);
                throw err;
            }

            res.json({
                success: true,
                message: `Vehicle transferred to ${newClient.full_name} successfully`,
                data: {
                    vehicleId,
                    previousClientId,
                    newClientId: newClient.id,
                    newClientName: newClient.full_name
                }
            });
        } catch (error) {
            console.error('SERVER_VEHICLE_TRANSFER_ERROR:', error);
            res.status(500).json({ error: 'Failed to transfer vehicle ownership' });
        }
    },

    /**
     * Generate certified Vehicle Service Passport PDF (Redacted for buyer resale proof).
     */
    getServicePassportPDF: async (req, res) => {
        try {
            const { id } = req.params;

            const vehicle = await database.get('SELECT * FROM vehicles WHERE id = ?', [id]);
            if (!vehicle) {
                return res.status(404).json({ success: false, error: 'Vehicle not found' });
            }

            // If user is a customer, verify ownership
            if (req.user?.userType === 'customer' && vehicle.client_id !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Access denied: You do not own this vehicle' });
            }

            // Fetch chronologic service records for this vehicle
            const records = await database.query(
                `SELECT sr.service_date, sr.mileage, sr.notes,
                        si.item_name, si.item_name_ar, si.category
                 FROM service_records sr
                 JOIN service_requests sreq ON sr.request_id = sreq.id
                 JOIN service_items si ON sr.item_id = si.id
                 WHERE sreq.vehicle_id = ?
                 ORDER BY sr.service_date DESC, sr.id DESC`,
                [id]
            );

            const passportId = `GCP-${vehicle.id}-${(vehicle.vin || vehicle.license_plate || 'AUT').replace(/[^a-zA-Z0-9]/g, '').slice(-4)}-${new Date().getFullYear()}`;
            const verificationUrl = `${req.protocol}://${req.get('host')}/api/public/passport/${encodeURIComponent(vehicle.vin || vehicle.license_plate || vehicle.id)}`;

            const pdfBuffer = await generateServicePassportPDF({
                vehicle,
                records,
                passportId,
                verificationUrl
            });

            const cleanPlate = (vehicle.license_plate || vehicle.id).toString().replace(/[^a-zA-Z0-9]/g, '-');
            const filename = `GoCar-Service-Passport-${cleanPlate}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('SERVER_SERVICE_PASSPORT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to generate service passport PDF' });
        }
    },

    /**
     * Public endpoint to verify vehicle maintenance pedigree (No sensitive personal client data).
     * Protected against database enumeration/scraping by requiring valid VIN or License Plate.
     */
    getPublicPassport: async (req, res) => {
        try {
            const { identifier } = req.params;
            const cleanIdentifier = String(identifier || '').trim();

            // GOCAR-SEC-01: Reject short numerical IDs to prevent sequential scraping of all vehicles
            if (!cleanIdentifier || (/^\d+$/.test(cleanIdentifier) && cleanIdentifier.length < 6)) {
                return res.status(400).json({ success: false, error: 'Valid VIN or License Plate is required' });
            }

            const vehicle = await database.get(
                'SELECT id, make, model, year, license_plate, vin, current_mileage, last_service_date, services_count FROM vehicles WHERE UPPER(vin) = UPPER(?) OR UPPER(REPLACE(license_plate, " ", "")) = UPPER(REPLACE(?, " ", "")) OR license_plate = ?',
                [cleanIdentifier, cleanIdentifier, cleanIdentifier]
            );

            if (!vehicle) {
                return res.status(404).json({ success: false, error: 'Vehicle pedigree not found' });
            }

            const records = await database.query(
                `SELECT sr.service_date, sr.mileage,
                        si.item_name, si.item_name_ar, si.category
                 FROM service_records sr
                 JOIN service_requests sreq ON sr.request_id = sreq.id
                 JOIN service_items si ON sr.item_id = si.id
                 WHERE sreq.vehicle_id = ?
                 ORDER BY sr.service_date DESC, sr.id DESC`,
                [vehicle.id]
            );

            res.json({
                success: true,
                data: {
                    status: 'Authenticated by GoCar Auto',
                    vehicle,
                    recordsCount: records.length,
                    verifiedMileage: vehicle.current_mileage,
                    pedigree: 'Verified Service Record',
                    records
                }
            });
        } catch (error) {
            console.error('SERVER_PUBLIC_PASSPORT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve vehicle pedigree' });
        }
    }
};

export default vehicleController;
