import sqlite3Lib from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Lib.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../database/gocar_auto.db');
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');
const SEED_PATH = path.join(__dirname, '../database/seed.sql');
const BACKUP_DIR = path.join(__dirname, '../backups/db');

// ValdoZ Zero-Destructive Database Discipline:
// NEVER delete an existing database without explicit user confirmation flag AND an automated backup.
const isForceReset = process.argv.includes('--force-reset');

if (fs.existsSync(DB_PATH)) {
    if (!isForceReset) {
        console.error(`
================================================================================
 [VALDOZ SAFETY GATE BLOCKED]: PREVENTED UNINTENDED DATABASE DESTRUCTION
================================================================================
 An active database was found at:
   ${DB_PATH}

 Re-initializing without a backup would result in catastrophic data loss.
 If you genuinely intend to reset the local database, you MUST pass --force-reset:
   node scripts/init-db.js --force-reset

 Alternatively, to synchronize real data from cloud:
   npm run sync:db
================================================================================
`);
        process.exit(1);
    }

    // Ensure backups directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Create an immutable timestamped safety backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `gocar_auto_pre_reset_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[SafeGuard] Automated pre-reset backup saved to: ${backupPath}`);

    // Clean up DB and sidecars safely
    fs.unlinkSync(DB_PATH);
    console.log('Cleared existing database for re-initialization.');

    const walPath = DB_PATH + '-wal';
    const shmPath = DB_PATH + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error('Error creating database:', err); process.exit(1); }
    console.log('Created fresh database instance.');
});

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

db.exec(schema, (err) => {
    if (err) { console.error('Error executing schema:', err); process.exit(1); }
    console.log('Schema applied successfully.');

    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seed, (err) => {
        if (err) { console.error('Error executing seed data:', err); process.exit(1); }
        console.log('Initial seed data inserted successfully.');

        db.close((err) => {
            if (err) { console.error('Error closing database:', err); }
            else {
                console.log('Database initialized successfully.');
                console.log('Tip: Run "npm run sync:db" to populate with real production cloud data.');
            }
        });
    });
});
