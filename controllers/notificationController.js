import database from '../database/db.js';
import { sendNotification } from '../utils/notification-service.js';

/**
 * Notification Controller
 * Manages outgoing communication and automated triggers.
 */
const notificationController = {
    /**
     * Retrieve all notification logs with optional filtering.
     */
    getLogs: async (req, res) => {
        try {
            const { clientId, type } = req.query;

            let query = 'SELECT * FROM notification_logs WHERE 1=1';
            const params = [];

            if (clientId) {
                query += ' AND client_id = ?';
                params.push(clientId);
            }

            if (type) {
                query += ' AND notification_type = ?';
                params.push(type);
            }

            query += ' ORDER BY sent_at DESC LIMIT 100';

            const logs = await database.query(query, params);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error('SERVER_NOTIFICATION_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch logs' });
        }
    },

    /**
     * Dispatch automated maintenance reminders based on due dates.
     */
    sendServiceReminders: async (req, res) => {
        try {
            const { days = 7 } = req.body;
            const daysNum = parseInt(days, 10) || 7;
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const maxDate = new Date(now.getTime() + daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const vehicles = await database.query(
                `SELECT v.*, c.email, c.phone, c.full_name as customer_name
                 FROM vehicles v
                 JOIN clients c ON v.client_id = c.id
                 WHERE v.next_service_due IS NOT NULL 
                 AND v.next_service_due <= ?
                 AND v.next_service_due >= ?`,
                [maxDate, today]
            );

            const results = [];

            for (const vehicle of vehicles) {
                const message = `Dear ${vehicle.customer_name}, your ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) is due for service on ${new Date(vehicle.next_service_due).toLocaleDateString()}. Please contact us. - GoCar Auto`;

                try {
                    await sendNotification({
                        customerId: vehicle.client_id,
                        vehicleId: vehicle.id,
                        type: 'NextServiceDue',
                        message,
                        email: vehicle.email
                    });

                    await database.run(
                        `INSERT INTO notification_logs (client_id, vehicle_id, notification_type, message, status)
                         VALUES (?, ?, ?, ?, ?)`,
                        [vehicle.client_id, vehicle.id, 'NextServiceDue', message, 'Sent']
                    );

                    results.push({ vehicleId: vehicle.id, status: 'sent' });
                } catch (error) {
                    results.push({ vehicleId: vehicle.id, status: 'failed', error: error.message });
                }
            }

            res.json({ success: true, message: `Sent ${results.filter(r => r.status === 'sent').length} notifications`, data: results });
        } catch (error) {
            console.error('SERVER_NOTIFICATION_ERROR:', error);
            res.status(500).json({ error: 'Failed to dispatch reminders' });
        }
    },

    /**
     * Notify customer that an ordered part has arrived.
     */
    sendPartArrival: async (req, res) => {
        try {
            const { requestId } = req.body;

            if (!requestId) {
                return res.status(400).json({ error: 'requestId required' });
            }

            const request = await database.get(
                `SELECT sr.*, c.email, c.phone, c.full_name as customer_name, v.make, v.model, v.license_plate
                 FROM service_requests sr
                 JOIN clients c ON sr.client_id = c.id
                 JOIN vehicles v ON sr.vehicle_id = v.id
                 WHERE sr.id = ?`,
                [requestId]
            );

            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }

            const message = `Dear ${request.customer_name}, the part for your ${request.make} ${request.model} (${request.license_plate}) has arrived. Please contact us. - GoCar Auto`;

            await sendNotification({
                customerId: request.client_id,
                vehicleId: request.vehicle_id,
                type: 'PartArrival',
                message,
                email: request.email
            });

            await database.run(
                `INSERT INTO notification_logs (client_id, vehicle_id, notification_type, message, status)
                 VALUES (?, ?, ?, ?, ?)`,
                [request.client_id, request.vehicle_id, 'PartArrival', message, 'Sent']
            );

            await database.run("UPDATE service_requests SET status = 'Parts Ordered' WHERE id = ?", [requestId]);

            res.json({ success: true, message: 'Part arrival notification sent' });
        } catch (error) {
            console.error('SERVER_NOTIFICATION_ERROR:', error);
            res.status(500).json({ error: 'Failed to notify arrival' });
        }
    },

    /**
     * Dispatch a custom communication message to a client.
     */
    sendCustom: async (req, res) => {
        try {
            const { clientId, message } = req.body;

            if (!clientId || !message) {
                return res.status(400).json({ error: 'Client ID and message required' });
            }

            const client = await database.get('SELECT * FROM clients WHERE id = ?', [clientId]);

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            await sendNotification({ customerId: clientId, type: 'Other', message, email: client.email });

            await database.run(
                `INSERT INTO notification_logs (client_id, notification_type, message, status)
                 VALUES (?, ?, ?, ?)`,
                [clientId, 'Other', message, 'Sent']
            );

            res.json({ success: true, message: 'Custom notification sent' });
        } catch (error) {
            console.error('SERVER_NOTIFICATION_ERROR:', error);
            res.status(500).json({ error: 'Failed to send custom notification' });
        }
    }
};

export default notificationController;
