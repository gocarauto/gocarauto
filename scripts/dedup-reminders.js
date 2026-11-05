import database from '../database/db.js';
import { canonicalizeServiceType } from '../utils/maintenance-helper.js';

/**
 * Deduplicate active/pending service reminders in the database
 * and enforce a unique partial index on (vehicle_id, service_type) for status = 'Pending'.
 */
export async function runDeduplication() {
    console.log('🔄 Starting Service Reminders Deduplication...');
    await database.connect();

    const pendingReminders = await database.query(
        `SELECT * FROM service_reminders WHERE status = 'Pending' ORDER BY due_date DESC, id DESC`
    );

    console.log(`📋 Found ${pendingReminders.length} pending reminder rows.`);

    const groups = {};
    for (const rem of pendingReminders) {
        const canonical = canonicalizeServiceType(rem.service_type);
        const key = `${rem.vehicle_id}:::${canonical}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push({ ...rem, canonical });
    }

    let deletedCount = 0;
    let updatedCount = 0;

    for (const [key, items] of Object.entries(groups)) {
        const primary = items[0];

        // Ensure canonical label is set on primary record
        if (primary.service_type !== primary.canonical) {
            await database.run(
                `UPDATE service_reminders SET service_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [primary.canonical, primary.id]
            );
            updatedCount++;
        }

        // Delete redundant duplicate rows
        for (let i = 1; i < items.length; i++) {
            await database.run(`DELETE FROM service_reminders WHERE id = ?`, [items[i].id]);
            deletedCount++;
        }
    }

    console.log(`🗑️ Deleted ${deletedCount} redundant duplicate reminder rows.`);
    console.log(`✨ Standardized ${updatedCount} reminder labels to canonical names.`);

    // Also canonicalize any non-pending rows (Sent, Completed, etc.)
    const nonPending = await database.query(
        `SELECT id, service_type FROM service_reminders WHERE status != 'Pending'`
    );
    for (const r of nonPending) {
        const canon = canonicalizeServiceType(r.service_type);
        if (r.service_type !== canon) {
            await database.run(`UPDATE service_reminders SET service_type = ? WHERE id = ?`, [canon, r.id]);
        }
    }

    // Apply unique partial index for Pending reminders (SQLite)
    try {
        await database.run(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_vehicle_service 
            ON service_reminders(vehicle_id, service_type) 
            WHERE status = 'Pending'
        `);
        console.log('🔒 Unique index idx_unique_pending_vehicle_service verified/created.');
    } catch (idxError) {
        console.warn('⚠️ Index creation note:', idxError.message);
    }

    const remaining = await database.query(
        `SELECT count(*) as count FROM service_reminders WHERE status = 'Pending'`
    );
    console.log(`✅ Deduplication complete. Clean active pending reminders: ${remaining[0].count}`);
    return {
        initialCount: pendingReminders.length,
        deletedCount,
        updatedCount,
        finalCount: remaining[0].count
    };
}

if (process.argv[1] && process.argv[1].endsWith('dedup-reminders.js')) {
    runDeduplication()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Deduplication failed:', err);
            process.exit(1);
        });
}
