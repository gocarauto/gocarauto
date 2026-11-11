import fs from 'fs';
import path from 'path';
import sqlite3Lib from 'sqlite3';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../database/gocar_auto.db');
const BACKUP_DIR = path.join(__dirname, '../backups/db');

// 1. Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 2. Take a non-destructive safety backup before any sync
if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `gocar_auto_pre_tidb_sync_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[SafeGuard] Automated pre-sync backup created: ${backupPath}`);
}

async function syncFromTiDB() {
    console.log('[Sync] Connecting to TiDB Cloud (gocar_auto)...');
    const tidb = await mysql.createConnection({
        host: process.env.DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
        port: parseInt(process.env.DB_PORT, 10) || 4000,
        user: process.env.DB_USER || 'xLLXdNdGnsJaRoN.root',
        password: process.env.DB_PASSWORD || 'YgZZMTCaarW3fqIg',
        database: process.env.DB_NAME || 'gocar_auto',
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    console.log('[Sync] Successfully connected to TiDB Cloud.');

    const sqlite = new sqlite3Lib.Database(DB_PATH);

    const runSqlite = (sql, params = []) => new Promise((resolve, reject) => {
        sqlite.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const querySqlite = (sql, params = []) => new Promise((resolve, reject) => {
        sqlite.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    // Check which tables exist in SQLite
    const sqliteTablesResult = await querySqlite("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const sqliteTables = new Set(sqliteTablesResult.map(r => r.name));

    // Order tables to respect foreign keys during sync
    const syncTables = [
        'users',
        'clients',
        'vehicles',
        'service_items',
        'service_requests',
        'service_records',
        'financial_transactions',
        'service_reminders',
        'customer_documents',
        'consignment_requests',
        'consignment_listings',
        'service_request_comments',
        'external_services',
        'vehicle_maintenance_ledger',
        'service_history',
        'notification_logs'
    ];

    await runSqlite('PRAGMA foreign_keys = OFF');

    const summary = {};

    for (const table of syncTables) {
        if (!sqliteTables.has(table)) {
            console.log(`[Sync] Skipping ${table} (not in SQLite schema)`);
            continue;
        }

        try {
            const [rows] = await tidb.query(`SELECT * FROM \`${table}\``);
            if (!rows || rows.length === 0) {
                console.log(`[Sync] ${table}: 0 rows in TiDB (keeping clean)`);
                continue;
            }

            console.log(`[Sync] Syncing ${table} (${rows.length} rows from TiDB)...`);

            // Clear SQLite table
            await runSqlite(`DELETE FROM \`${table}\``);

            // Fetch columns present in SQLite table
            const tableCols = await querySqlite(`PRAGMA table_info(\`${table}\`)`);
            const colNames = new Set(tableCols.map(c => c.name));

            // Filter columns to only those existing in SQLite
            const sampleRow = rows[0];
            const validCols = Object.keys(sampleRow).filter(col => colNames.has(col));

            const placeholders = validCols.map(() => '?').join(', ');
            const insertSql = `INSERT OR REPLACE INTO \`${table}\` (${validCols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

            await runSqlite('BEGIN TRANSACTION');
            for (const row of rows) {
                const values = validCols.map(col => {
                    let val = row[col];
                    if (val instanceof Date) {
                        val = val.toISOString().replace('T', ' ').replace('Z', '');
                    }
                    return val === undefined ? null : val;
                });
                await runSqlite(insertSql, values);
            }
            await runSqlite('COMMIT');

            const [countCheck] = await querySqlite(`SELECT COUNT(*) as count FROM \`${table}\``);
            summary[table] = countCheck.count;
            console.log(`[Sync] ✓ ${table}: successfully synced ${countCheck.count} rows`);
        } catch (err) {
            console.error(`[Sync] Error syncing ${table}:`, err.message);
            try { await runSqlite('ROLLBACK'); } catch (_) {}
        }
    }

    // Post-sync FK integrity reconciliation
    // 1. Ensure user ID 1 exists so service_records.user_id = 1 foreign keys resolve
    await runSqlite(`
        INSERT OR IGNORE INTO users (id, name, role, email, mobile, password_hash, created_at, updated_at)
        VALUES (1, 'Admin', 'Admin', 'admin@gocarauto.com', '+201067800008',
                (SELECT password_hash FROM users WHERE id = 30002 LIMIT 1),
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // 2. Ensure request ID 0 exists so legacy unlinked walk-in service records resolve
    await runSqlite(`
        INSERT OR IGNORE INTO service_requests (id, client_id, vehicle_id, request_date, status, client_name, vehicle_info, notes)
        VALUES (0, 1, 1, '2025-11-26', 'Completed', 'Direct Walk-in', 'Service Direct', 'Legacy Walk-in Service')
    `);

    await runSqlite('PRAGMA foreign_keys = ON');

    console.log('\n=============================================');
    console.log('       SYNC FROM TIDB CLOUD COMPLETE         ');
    console.log('=============================================');
    for (const [t, cnt] of Object.entries(summary)) {
        console.log(`  • ${t.padEnd(28)} : ${cnt} rows`);
    }

    // Verify key accounts
    const users = await querySqlite('SELECT id, name, email, role, mobile FROM users');
    console.log('\n[Local Accounts Verified]');
    console.log('Staff Users:');
    users.forEach(u => console.log(`  - ID: ${u.id} | ${u.name} (${u.role}) | Email: ${u.email} | Mobile: ${u.mobile}`));

    const clientsWithEmail = await querySqlite('SELECT id, full_name, email, phone FROM clients WHERE email IS NOT NULL AND email != ""');
    console.log('Registered Client Accounts:');
    clientsWithEmail.forEach(c => console.log(`  - ID: ${c.id} | ${c.full_name} | Email: ${c.email} | Phone: ${c.phone}`));

    await tidb.end();
    sqlite.close();
}

syncFromTiDB().catch((err) => {
    console.error('[Sync Fatal Error]:', err);
    process.exit(1);
});
