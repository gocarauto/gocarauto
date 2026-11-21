import fs from 'fs';
import path from 'path';
import sqlite3Lib from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'database/gocar_auto.db');

export async function migrateVehicleArchival(customDbPath = null) {
    const targetDbPath = customDbPath || DB_PATH;
    if (!fs.existsSync(targetDbPath)) {
        console.log(`Database at ${targetDbPath} does not exist, skipping vehicle archival migration.`);
        return;
    }

    const sqlite3 = sqlite3Lib.verbose();
    const db = new sqlite3.Database(targetDbPath);

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all('PRAGMA table_info(vehicles)', (err, columns) => {
                if (err) {
                    db.close();
                    return reject(err);
                }

                if (!columns || columns.length === 0) {
                    db.close();
                    return resolve({ migrated: false, reason: 'table_missing' });
                }

                const existingCols = new Set(columns.map(c => c.name));
                const alterStatements = [];

                if (!existingCols.has('is_archived')) {
                    alterStatements.push('ALTER TABLE vehicles ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0');
                }
                if (!existingCols.has('archive_reason')) {
                    alterStatements.push('ALTER TABLE vehicles ADD COLUMN archive_reason TEXT');
                }
                if (!existingCols.has('archive_notes')) {
                    alterStatements.push('ALTER TABLE vehicles ADD COLUMN archive_notes TEXT');
                }
                if (!existingCols.has('archived_at')) {
                    alterStatements.push('ALTER TABLE vehicles ADD COLUMN archived_at DATETIME');
                }
                if (!existingCols.has('archived_by')) {
                    alterStatements.push('ALTER TABLE vehicles ADD COLUMN archived_by INTEGER');
                }

                if (alterStatements.length === 0) {
                    console.log('✓ Vehicle archival columns already exist in vehicles table.');
                    db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_archived ON vehicles (is_archived)', (idxErr) => {
                        db.close();
                        if (idxErr) return reject(idxErr);
                        resolve({ migrated: true, newlyAdded: 0 });
                    });
                    return;
                }

                console.log(`Applying ${alterStatements.length} additive columns to vehicles table...`);
                let completed = 0;
                for (const sql of alterStatements) {
                    db.run(sql, (alterErr) => {
                        if (alterErr) {
                            console.error(`Error running ${sql}:`, alterErr);
                            db.close();
                            return reject(alterErr);
                        }
                        completed++;
                        if (completed === alterStatements.length) {
                            db.run('CREATE INDEX IF NOT EXISTS idx_vehicles_archived ON vehicles (is_archived)', (idxErr) => {
                                db.close();
                                if (idxErr) return reject(idxErr);
                                console.log('✓ Successfully migrated vehicles table with archival columns & index.');
                                resolve({ migrated: true, newlyAdded: alterStatements.length });
                            });
                        }
                    });
                }
            });
        });
    });
}

// Direct execution CLI support
export async function migrateVehicleArchivalMySQL(pool) {
    if (!pool) return;
    try {
        const [cols] = await pool.query('SHOW COLUMNS FROM vehicles');
        if (!cols || cols.length === 0) return;
        const existingCols = new Set(cols.map(c => c.Field));
        if (!existingCols.has('is_archived')) {
            await pool.query('ALTER TABLE vehicles ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
        }
        if (!existingCols.has('archive_reason')) {
            await pool.query('ALTER TABLE vehicles ADD COLUMN archive_reason VARCHAR(255) NULL');
        }
        if (!existingCols.has('archive_notes')) {
            await pool.query('ALTER TABLE vehicles ADD COLUMN archive_notes TEXT NULL');
        }
        if (!existingCols.has('archived_at')) {
            await pool.query('ALTER TABLE vehicles ADD COLUMN archived_at DATETIME NULL');
        }
        if (!existingCols.has('archived_by')) {
            await pool.query('ALTER TABLE vehicles ADD COLUMN archived_by INT NULL');
        }
        const [indexes] = await pool.query('SHOW INDEX FROM vehicles WHERE Key_name = "idx_vehicles_archived"');
        if (indexes.length === 0) {
            await pool.query('ALTER TABLE vehicles ADD INDEX idx_vehicles_archived (is_archived)');
        }
        console.log('✓ Vehicle archival columns verified in MySQL vehicles table.');
    } catch (err) {
        console.warn('MySQL vehicle archival migration check notice:', err.message);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    migrateVehicleArchival()
        .then(res => {
            console.log('Migration finished:', res);
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}
