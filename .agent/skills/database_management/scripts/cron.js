const cron = require('node-cron');
const database = require('../database/db');
const notificationService = require('../utils/notification-service');

// Schedule tasks to be run on the server.
// Runs every day at 08:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running Elite Maintenance Scanner...');

    try {
        // Find services due today or within a 1-day margin
        // We track by next_due_date from the maintenance ledger
        const dueSoon = await database.query(`
            SELECT 
                l.*, 
                v.make, v.model, v.license_plate, 
                c.full_name as client_name, c.email as client_email, c.phone as client_phone
            FROM vehicle_maintenance_ledger l
            JOIN vehicles v ON l.vehicle_id = v.id
            JOIN clients c ON v.client_id = c.id
            WHERE l.next_due_date <= date('now')
            AND l.next_due_date > date('now', '-7 days')
        `);

        let notifiedCount = 0;

        for (const item of dueSoon) {
            // Check if we already notified for this point/vehicle in the last 30 days
            const alreadyNotified = await database.get(
                `SELECT id FROM notification_logs 
                 WHERE vehicle_id = ? AND tracking_point = ? 
                 AND sent_date > date('now', '-30 days')`,
                [item.vehicle_id, item.tracking_point]
            );

            if (alreadyNotified) {
                console.log(`[SCANNER] Skip: Already notified for ${item.tracking_point} on Vehicle ${item.vehicle_id}`);
                continue;
            }

            // Construct Elite Message
            let message = "";
            const vehicleStr = `${item.make} ${item.model} (${item.license_plate})`;

            if (item.tracking_point === 'ENGINE_OIL') {
                message = `Hello ${item.client_name}, it has been some time since your last Engine Oil change for your ${vehicleStr}. Even if you haven't driven much, oil degrades over time. If you have reached ${item.next_due_mileage ? item.next_due_mileage.toLocaleString() : '10,000'} km, it's definitely time for a visit!`;
            } else if (item.tracking_point === 'TRANS_OIL') {
                message = `Hello ${item.client_name}, your ${vehicleStr} is due for a Transmission Oil check/change (recommended every 2.5 years). Please book an appointment to ensure your gearbox stays in peak mission readiness.`;
            } else {
                message = `Hello ${item.client_name}, your ${vehicleStr} is due for ${item.tracking_point.replace('_', ' ')} maintenance. Book now to keep your vehicle in top condition.`;
            }

            // Send via Notification Service
            if (item.client_email) {
                await notificationService.sendEmail(item.client_email, 'GoCar Auto - Maintenance Reminder', message);
            }

            // Log the notification
            await database.run(
                `INSERT INTO notification_logs (vehicle_id, tracking_point, notification_type, sent_date, channel, status)
                 VALUES (?, ?, 'MaintenanceDue', CURRENT_DATE, 'Email/WhatsApp', 'Sent')`,
                [item.vehicle_id, item.tracking_point]
            );

            console.log(`[SCANNER] Notified ${item.client_name} about ${item.tracking_point}`);
            notifiedCount++;
        }

        console.log(`Maintenance Scanner finished. Sent ${notifiedCount} notifications.`);
    } catch (error) {
        console.error('Error running maintenance scanner:', error);
    }
});
