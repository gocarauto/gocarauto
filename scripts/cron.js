import cron from 'node-cron';
import database from '../database/db.js';
import * as notificationService from '../utils/notification-service.js';
import { canonicalizeServiceType } from '../utils/maintenance-helper.js';

/**
 * Smart Maintenance Scanner
 * Runs daily at 09:00 AM — finds the latest oil service per vehicle and upserts reminders.
 */
cron.schedule('0 9 * * *', async () => {
    console.log('Running Smart Maintenance Scanner...');
    try {
        const rawRecords = await database.query(`
            SELECT
                v.id as vehicle_id,
                v.make, v.model,
                c.id as client_id,
                si.tracking_point,
                si.item_name,
                si.item_name_ar,
                sr.service_date,
                sr.mileage,
                si.km_interval,
                si.month_interval
            FROM service_records sr
            JOIN service_requests sreq ON sr.request_id = sreq.id
            JOIN vehicles v ON sreq.vehicle_id = v.id
            JOIN clients c ON v.client_id = c.id
            JOIN service_items si ON sr.item_id = si.id
            WHERE si.tracking_point IN ('ENGINE_OIL', 'TRANS_OIL')
               OR si.item_name LIKE '%زيت%'
               OR si.item_name_ar LIKE '%زيت%'
               OR si.item_name LIKE '%oil%'
               OR si.item_name_ar LIKE '%oil%'
        `);

        const grouped = {};
        for (const row of rawRecords) {
            let type = null;
            if (row.tracking_point === 'ENGINE_OIL') {
                type = 'ENGINE_OIL';
            } else if (row.tracking_point === 'TRANS_OIL') {
                type = 'TRANS_OIL';
            } else {
                const name = ((row.item_name || '') + ' ' + (row.item_name_ar || '')).toLowerCase();
                if (name.includes('موتور') || name.includes('محرك') || name.includes('engine') || name.includes('motor') || name.includes('10000') || name.includes('5000')) {
                    type = 'ENGINE_OIL';
                } else if (name.includes('فتيس') || name.includes('جير') || name.includes('transmission') || name.includes('gear') || name.includes('ناقل')) {
                    type = 'TRANS_OIL';
                }
            }
            if (!type) continue;

            const key = `${row.vehicle_id}_${type}`;
            const recordDate = new Date(row.service_date);
            
            if (!grouped[key] || new Date(grouped[key].service_date) < recordDate) {
                grouped[key] = {
                    vehicle_id: row.vehicle_id,
                    client_id: row.client_id,
                    type,
                    service_date: row.service_date,
                    mileage: row.mileage,
                    km_interval: row.km_interval || (type === 'ENGINE_OIL' ? 10000 : 30000),
                    month_interval: row.month_interval || (type === 'ENGINE_OIL' ? 8 : 30),
                    service_name_ar: type === 'ENGINE_OIL' ? 'تغيير زيت الموتور' : 'تغيير زيت الفتيس'
                };
            }
        }

        let created = 0, updated = 0;
        const latestServices = Object.values(grouped);

        for (const item of latestServices) {
            if (!item.service_date || !item.month_interval) continue;

            const lastDate = new Date(item.service_date);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + item.month_interval);
            const dueDateStr = nextDate.toISOString().split('T')[0];

            const notes = `Last done: ${item.service_date}${item.mileage ? ' | Mileage: ' + item.mileage.toLocaleString() + ' km' : ''}`;

            const serviceType = canonicalizeServiceType(item.service_name_ar || item.type);
            const existing = await database.get(
                `SELECT id FROM service_reminders
                 WHERE vehicle_id = ? AND (service_type = ? OR service_type = ? OR service_type = ?) AND status = 'Pending'`,
                [item.vehicle_id, serviceType, item.type, item.service_name_ar]
            );

            if (existing) {
                await database.run(
                    `UPDATE service_reminders SET service_type = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [serviceType, dueDateStr, notes, existing.id]
                );
                updated++;
            } else {
                await database.run(
                    `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, notes, status, interval_km, interval_months)
                     VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
                    [item.client_id, item.vehicle_id, serviceType, dueDateStr, notes, item.km_interval || null, item.month_interval || null]
                );
                created++;
            }
        }

        console.log(`Smart Scanner done. Created: ${created}, Updated: ${updated}`);
    } catch (error) {
        console.error('SERVER_CRON_ERROR:', error);
    }
});

/**
 * Service Reminders Dispatcher (service_reminders table)
 * Runs daily at 09:30 AM to send reminders set by staff.
 */
cron.schedule('30 9 * * *', async () => {
    console.log('Running Service Reminders Dispatcher...');

    try {
        const activeReminders = await database.query(`
            SELECT r.*, v.make, v.model, v.license_plate, 
                   c.full_name as client_name, c.email as client_email, c.phone as client_phone
            FROM service_reminders r
            JOIN vehicles v ON r.vehicle_id = v.id
            JOIN clients c ON r.client_id = c.id
            WHERE r.status = 'Pending' AND r.due_date <= date('now')
        `);

        let sentCount = 0;

        for (const rem of activeReminders) {
            const vehicleStr = `${rem.make} ${rem.model} (${rem.license_plate || 'No Plate'})`;
            const message = `Hello ${rem.client_name}, this is a reminder from GoCar Auto that your ${vehicleStr} is due for: ${rem.service_type}.${rem.notes ? `\nNotes: ${rem.notes}` : ''}\nPlease contact us to book your appointment.`;

            if (rem.client_email) {
                await notificationService.sendEmail(rem.client_email, `GoCar Auto - Service Reminder: ${rem.service_type}`, message);
            }

            // Log notification adhering to schema constraints
            const channel = rem.client_email ? 'Email' : 'SMS';
            await database.run(
                `INSERT INTO notification_logs (client_id, vehicle_id, notification_type, message, sent_via, sent_at, status)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Sent')`,
                [rem.client_id, rem.vehicle_id, 'NextServiceDue', message, channel]
            );

            // Update reminder status
            await database.run(
                `UPDATE service_reminders SET status = 'Sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [rem.id]
            );

            sentCount++;
        }

        console.log(`Service Reminders Dispatcher finished. Sent ${sentCount} reminders.`);
    } catch (error) {
        console.error('SERVER_CRON_ERROR:', error);
    }
});
