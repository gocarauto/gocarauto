import database from '../database/db.js';
import { canonicalizeServiceType } from '../utils/maintenance-helper.js';

/**
 * Reminder Controller
 * Manages service reminders and automated notifications.
 */
const reminderController = {
    /**
     * Get all reminders for a specific client.
     */
    getClientReminders: async (req, res) => {
        try {
            const { clientId } = req.params;
            const query = `
                SELECT r.*, v.make, v.model, v.license_plate 
                FROM service_reminders r
                JOIN vehicles v ON r.vehicle_id = v.id
                WHERE r.client_id = ?
                ORDER BY r.due_date ASC
            `;
            const reminders = await database.query(query, [clientId]);
            res.json({ success: true, data: reminders });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reminders' });
        }
    },

    /**
     * Get reminders globally (filtered by status or all).
     */
    getAllReminders: async (req, res) => {
        try {
            const { status } = req.query;
            let query = `
                SELECT r.*, v.make, v.model, v.license_plate, c.full_name as client_name, c.phone as client_phone
                FROM service_reminders r
                JOIN vehicles v ON r.vehicle_id = v.id
                JOIN clients c ON r.client_id = c.id
            `;
            const params = [];
            if (status && status !== 'all') {
                query += ` WHERE r.status = ?`;
                params.push(status);
            } else if (!status) {
                // Default to Pending if no status specified for backward compatibility
                query += ` WHERE r.status = 'Pending'`;
            }
            query += ` ORDER BY r.due_date ASC, r.id DESC`;

            const reminders = await database.query(query, params);

            // Defensive deduplication by vehicle_id + canonical service type for pending list
            const seen = new Set();
            const deduplicated = [];
            for (const rem of reminders) {
                const canon = canonicalizeServiceType(rem.service_type);
                const dedupeKey = rem.status === 'Pending' ? `${rem.vehicle_id}:::${canon}` : `${rem.id}`;
                if (!seen.has(dedupeKey)) {
                    seen.add(dedupeKey);
                    deduplicated.push({
                        ...rem,
                        service_type: canon
                    });
                }
            }

            res.json({ success: true, data: deduplicated });
        } catch (error) {
            console.error('SERVER_REMINDER_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch reminders' });
        }
    },

    /**
     * Check if an active reminder already exists for a vehicle + service type (duplicate guard).
     */
    checkDuplicate: async (req, res) => {
        try {
            const { vehicleId, serviceType } = req.query;
            if (!vehicleId || !serviceType) {
                return res.json({ success: true, data: { exists: false } });
            }
            const canonicalType = canonicalizeServiceType(serviceType);
            const existing = await database.get(
                `SELECT id FROM service_reminders 
                 WHERE vehicle_id = ? AND (service_type = ? OR service_type = ?) AND status = 'Pending'`,
                [vehicleId, canonicalType, serviceType]
            );
            res.json({ success: true, data: { exists: !!existing, id: existing?.id } });
        } catch (error) {
            console.error('SERVER_REMINDER_ERROR:', error);
            res.status(500).json({ error: 'Failed to check reminder' });
        }
    },

    /**
     * Create a new service reminder.
     * Includes duplicate guard — will not create if active reminder already exists for vehicle + service type.
     */
    createReminder: async (req, res) => {
        try {
            const { clientId, vehicleId, serviceType, dueDate, notes, status = 'Pending', intervalKm, intervalMonths } = req.body;

            if (!clientId || !vehicleId || !serviceType || !dueDate) {
                return res.status(400).json({ error: 'Missing required reminder fields' });
            }

            const canonicalType = canonicalizeServiceType(serviceType);

            // Duplicate guard
            const existing = await database.get(
                `SELECT id FROM service_reminders 
                 WHERE vehicle_id = ? AND (service_type = ? OR service_type = ?) AND status = 'Pending'`,
                [vehicleId, canonicalType, serviceType]
            );
            if (existing) {
                return res.json({
                    success: true,
                    message: 'Reminder already exists — skipped duplicate',
                    data: { id: existing.id, duplicate: true }
                });
            }

            const result = await database.run(
                `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, notes, status, interval_km, interval_months)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [clientId, vehicleId, canonicalType, dueDate, notes || '', status, intervalKm || null, intervalMonths || null]
            );

            res.status(201).json({
                success: true,
                message: 'Reminder created successfully',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_REMINDER_ERROR:', error);
            res.status(500).json({ error: 'Failed to create reminder' });
        }
    },

    /**
     * Update an existing reminder.
     */
    updateReminder: async (req, res) => {
        try {
            const { id } = req.params;
            const { serviceType, dueDate, notes, status, intervalKm, intervalMonths } = req.body;

            const result = await database.run(
                `UPDATE service_reminders 
                 SET service_type = ?, due_date = ?, notes = ?, status = ?,
                     interval_km = ?, interval_months = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [serviceType, dueDate, notes, status, intervalKm || null, intervalMonths || null, id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Reminder not found' });
            }

            res.json({ success: true, message: 'Reminder updated successfully' });
        } catch (error) {
            console.error('SERVER_REMINDER_ERROR:', error);
            res.status(500).json({ error: 'Failed to update reminder' });
        }
    },

    /**
     * Delete a reminder.
     */
    deleteReminder: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await database.run('DELETE FROM service_reminders WHERE id = ?', [id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Reminder not found' });
            }

            res.json({ success: true, message: 'Reminder deleted successfully' });
        } catch (error) {
            console.error('SERVER_REMINDER_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete reminder' });
        }
    },

    /**
     * Smart Scan — Cross-references all service records to auto-generate/update reminders.
     * Finds the LATEST service date per vehicle per tracking_point and upserts reminders.
     */
    runSmartScan: async (req, res) => {
        try {
            // Step 1: Query raw candidates that have tracking points or oil keywords
            const rawRecords = await database.query(`
                SELECT
                    v.id as vehicle_id,
                    v.make, v.model, v.license_plate,
                    c.id as client_id,
                    c.full_name as client_name,
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

            // Group by vehicle_id + classified type to find latest done
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
                        make: row.make,
                        model: row.model,
                        license_plate: row.license_plate,
                        client_id: row.client_id,
                        client_name: row.client_name,
                        type,
                        service_date: row.service_date,
                        mileage: row.mileage,
                        km_interval: row.km_interval || (type === 'ENGINE_OIL' ? 10000 : 30000),
                        month_interval: row.month_interval || (type === 'ENGINE_OIL' ? 8 : 30),
                        service_name_ar: type === 'ENGINE_OIL' ? 'تغيير زيت الموتور' : 'تغيير زيت الفتيس'
                    };
                }
            }

            let created = 0, updated = 0, skipped = 0;
            const latestServices = Object.values(grouped);

            for (const item of latestServices) {
                if (!item.service_date || !item.month_interval) {
                    skipped++;
                    continue;
                }

                // Calculate next due date
                const lastDate = new Date(item.service_date);
                const nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + item.month_interval);
                const dueDateStr = nextDate.toISOString().split('T')[0];

                const notes = `Last done: ${item.service_date}${item.mileage ? ' | Mileage: ' + item.mileage.toLocaleString() + ' km' : ''}`;
                // Use canonical, localized Arabic label for service type
                const rawServiceType = item.service_name_ar || (item.type === 'ENGINE_OIL' ? 'تغيير زيت الموتور' : 'تغيير زيت الفتيس');
                const serviceType = canonicalizeServiceType(rawServiceType);

                // Check for existing pending reminder matching vehicle and canonical label or raw variants
                const existing = await database.get(
                    `SELECT id FROM service_reminders
                     WHERE vehicle_id = ? AND (service_type = ? OR service_type = ? OR service_type = ?) AND status = 'Pending'`,
                    [item.vehicle_id, serviceType, item.type, rawServiceType]
                );

                if (existing) {
                    await database.run(
                        `UPDATE service_reminders
                         SET service_type = ?, due_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ?`,
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

            // Step 2: Find prospect vehicles (registered but no oil service history)
            const prospects = await database.query(`
                SELECT v.id, v.make, v.model, v.license_plate, c.full_name, c.phone,
                       julianday('now') - julianday(v.created_at) as days_since_registered
                FROM vehicles v
                JOIN clients c ON v.client_id = c.id
                WHERE v.id NOT IN (
                    SELECT DISTINCT sreq.vehicle_id
                    FROM service_records sr
                    JOIN service_requests sreq ON sr.request_id = sreq.id
                    JOIN service_items si ON sr.item_id = si.id
                    WHERE si.tracking_point IN ('ENGINE_OIL', 'TRANS_OIL')
                       OR si.item_name LIKE '%زيت%'
                       OR si.item_name_ar LIKE '%زيت%'
                       OR si.item_name LIKE '%oil%'
                       OR si.item_name_ar LIKE '%oil%'
                )
                AND (julianday('now') - julianday(v.created_at)) > 60
            `);

            res.json({
                success: true,
                data: {
                    scanned: latestServices.length,
                    created,
                    updated,
                    skipped,
                    prospects_count: prospects.length,
                    prospects
                }
            });
        } catch (error) {
            console.error('SERVER_SMART_SCAN_ERROR:', error);
            res.status(500).json({ error: 'Smart scan failed' });
        }
    }
};

export default reminderController;
