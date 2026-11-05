import database from '../database/db.js';

/**
 * External Service Controller
 * Manages service records performed by 3rd party workshops.
 */
const externalServiceController = {
    /**
     * Get all external services for a specific vehicle.
     */
    getVehicleExternalServices: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            const query = 'SELECT * FROM external_services WHERE vehicle_id = ? ORDER BY service_date DESC';
            const services = await database.query(query, [vehicleId]);
            res.json({ success: true, data: services });
        } catch (error) {
            console.error('SERVER_EXTERNAL_SERVICE_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch external services' });
        }
    },

    /**
     * Add a record for an external workshop service.
     */
    createExternalService: async (req, res) => {
        try {
            const { vehicleId, workshopName, serviceType, serviceDate, mileage, totalAmount, notes } = req.body;

            if (!vehicleId || !workshopName || !serviceDate) {
                return res.status(400).json({ error: 'Missing required external service fields' });
            }

            const vehicle = await database.get('SELECT id FROM vehicles WHERE id = ?', [vehicleId]);
            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            const result = await database.run(
                `INSERT INTO external_services (vehicle_id, workshop_name, service_type, service_date, mileage, total_amount, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [vehicleId, workshopName, serviceType, serviceDate, mileage, totalAmount, notes]
            );

            res.status(201).json({
                success: true,
                message: 'External service record added',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_EXTERNAL_SERVICE_ERROR:', error);
            res.status(500).json({ error: 'Failed to create external service record' });
        }
    },

    /**
     * Delete an external service record.
     */
    deleteExternalService: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await database.run('DELETE FROM external_services WHERE id = ?', [id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Record not found' });
            }

            res.json({ success: true, message: 'Record deleted successfully' });
        } catch (error) {
            console.error('SERVER_EXTERNAL_SERVICE_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete record' });
        }
    }
};

export default externalServiceController;
