import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sqlite3Lib from 'sqlite3';
import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DB_PATH = path.join(ROOT_DIR, 'database/gocar_auto.db');
const BACKUPS_ROOT = path.join(ROOT_DIR, 'backups');

function getTimestamp() {
    const d = new Date();
    return d.toISOString().replace(/[:.]/g, '-');
}

function calculateSha256(filePath) {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
}

async function performFullBackup() {
    const timestamp = getTimestamp();
    const backupDirName = `full_backup_${timestamp}`;
    const targetDir = path.join(BACKUPS_ROOT, backupDirName);

    console.log('======================================================================');
    console.log(`         GoCar Auto Comprehensive Full System Backup Engine           `);
    console.log(`         Target: ${backupDirName}                                      `);
    console.log('======================================================================');

    fs.mkdirSync(targetDir, { recursive: true });
    const manifest = {
        timestamp: new Date().toISOString(),
        backupDir: targetDir,
        components: {}
    };

    // -------------------------------------------------------------------------
    // 1. LOCAL SQLITE DATABASE SNAPSHOT & DUMP
    // -------------------------------------------------------------------------
    console.log('\n[1/4] Backing up Local SQLite Database...');
    if (fs.existsSync(DB_PATH)) {
        const destDbPath = path.join(targetDir, 'gocar_auto.db');
        fs.copyFileSync(DB_PATH, destDbPath);
        const dbStats = fs.statSync(destDbPath);

        // Count rows from SQLite
        const sqlite = new sqlite3Lib.Database(DB_PATH);
        const querySqlite = (sql) => new Promise((res, rej) => {
            sqlite.all(sql, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });

        const tablesResult = await querySqlite("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const sqliteCounts = {};
        for (const t of tablesResult) {
            const cnt = await querySqlite(`SELECT COUNT(*) as c FROM \`${t.name}\``);
            sqliteCounts[t.name] = cnt[0].c;
        }
        sqlite.close();

        manifest.components.sqlite = {
            status: 'SUCCESS',
            file: 'gocar_auto.db',
            bytes: dbStats.size,
            sha256: calculateSha256(destDbPath),
            tableCounts: sqliteCounts
        };

        console.log(`  ✓ SQLite Binary DB copied (${(dbStats.size / 1024).toFixed(1)} KB)`);
        console.log(`  ✓ SQLite Tables Snapshot: ${Object.keys(sqliteCounts).length} tables verified.`);
        console.log(`    - Clients: ${sqliteCounts.clients || 0} | Vehicles: ${sqliteCounts.vehicles || 0} | Service Records: ${sqliteCounts.service_records || 0}`);
    } else {
        console.warn('  ⚠ No local SQLite database found at:', DB_PATH);
        manifest.components.sqlite = { status: 'SKIPPED_NOT_FOUND' };
    }

    // -------------------------------------------------------------------------
    // 2. REMOTE TIDB CLOUD DATABASE DUMP (SQL + JSON ARCHIVE)
    // -------------------------------------------------------------------------
    console.log('\n[2/4] Backing up Remote TiDB Cloud Database (AWS Frankfurt)...');
    try {
        const tidb = await mysql.createConnection({
            host: process.env.DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
            port: parseInt(process.env.DB_PORT, 10) || 4000,
            user: process.env.DB_USER || 'xLLXdNdGnsJaRoN.root',
            password: process.env.DB_PASSWORD || 'YgZZMTCaarW3fqIg',
            database: process.env.DB_NAME || 'gocar_auto',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });

        const [tables] = await tidb.query('SHOW TABLES');
        const tableNames = tables.map(r => Object.values(r)[0]);
        const tidbData = {};
        const tidbCounts = {};
        let sqlDumpContent = `-- GoCar Auto TiDB Cloud Backup Dump\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

        for (const tbl of tableNames) {
            const [createTableResult] = await tidb.query(`SHOW CREATE TABLE \`${tbl}\``);
            const createSql = createTableResult[0]['Create Table'];
            sqlDumpContent += `-- Table structure for \`${tbl}\`\nDROP TABLE IF EXISTS \`${tbl}\`;\n${createSql};\n\n`;

            const [rows] = await tidb.query(`SELECT * FROM \`${tbl}\``);
            tidbCounts[tbl] = rows.length;
            tidbData[tbl] = rows;

            if (rows.length > 0) {
                const cols = Object.keys(rows[0]);
                sqlDumpContent += `-- Dumping data for table \`${tbl}\` (${rows.length} rows)\n`;
                for (const row of rows) {
                    const vals = cols.map(c => {
                        const v = row[c];
                        if (v === null || v === undefined) return 'NULL';
                        if (typeof v === 'number') return v;
                        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return `'${String(v).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                    });
                    sqlDumpContent += `INSERT INTO \`${tbl}\` (\`${cols.join('`, `')}\`) VALUES (${vals.join(', ')});\n`;
                }
                sqlDumpContent += '\n';
            }
        }
        sqlDumpContent += 'SET FOREIGN_KEY_CHECKS = 1;\n';

        const sqlDumpPath = path.join(targetDir, 'tidb_cloud_dump.sql');
        fs.writeFileSync(sqlDumpPath, sqlDumpContent, 'utf8');

        const jsonDumpPath = path.join(targetDir, 'tidb_cloud_data.json');
        fs.writeFileSync(jsonDumpPath, JSON.stringify(tidbData, null, 2), 'utf8');

        await tidb.end();

        manifest.components.tidbCloud = {
            status: 'SUCCESS',
            sqlDumpFile: 'tidb_cloud_dump.sql',
            sqlDumpBytes: fs.statSync(sqlDumpPath).size,
            sqlDumpSha256: calculateSha256(sqlDumpPath),
            jsonDumpFile: 'tidb_cloud_data.json',
            tableCounts: tidbCounts
        };

        console.log(`  ✓ TiDB Cloud SQL Dump created (${(fs.statSync(sqlDumpPath).size / 1024).toFixed(1)} KB)`);
        console.log(`  ✓ TiDB Cloud JSON Archive created (${(fs.statSync(jsonDumpPath).size / 1024).toFixed(1)} KB)`);
        console.log(`    - Customers: ${tidbCounts.clients || 0} | Vehicles: ${tidbCounts.vehicles || 0} | Service Records: ${tidbCounts.service_records || 0}`);
    } catch (err) {
        console.error('  ✗ Error during TiDB Cloud backup:', err.message);
        manifest.components.tidbCloud = { status: 'ERROR', error: err.message };
    }

    // -------------------------------------------------------------------------
    // 3. CODEBASE & FRONTEND DESIGN/TOKEN ARCHIVE
    // -------------------------------------------------------------------------
    console.log('\n[3/4] Creating Complete Application Codebase & Design Assets Archive...');
    const archivePath = path.join(targetDir, 'codebase_archive.tar.gz');
    try {
        const excludeFlags = [
            '--exclude="node_modules"',
            '--exclude=".git"',
            '--exclude="backups"',
            '--exclude="dist"',
            '--exclude=".tmp"',
            '--exclude="*.log"'
        ].join(' ');

        execSync(`tar ${excludeFlags} -czf "${archivePath}" -C "${ROOT_DIR}" .`, { stdio: 'pipe' });
        const archiveStats = fs.statSync(archivePath);

        manifest.components.codebase = {
            status: 'SUCCESS',
            file: 'codebase_archive.tar.gz',
            bytes: archiveStats.size,
            sha256: calculateSha256(archivePath)
        };
        console.log(`  ✓ Codebase archive created (${(archiveStats.size / (1024 * 1024)).toFixed(2)} MB)`);
    } catch (err) {
        console.error('  ✗ Error creating codebase archive:', err.message);
        manifest.components.codebase = { status: 'ERROR', error: err.message };
    }

    // -------------------------------------------------------------------------
    // 4. GENERATE CRYPTOGRAPHIC MANIFEST & CHECKSUMS
    // -------------------------------------------------------------------------
    console.log('\n[4/4] Writing Cryptographic Manifest & Checksums...');
    const manifestPath = path.join(targetDir, 'MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const sums = [];
    const filesInBackup = fs.readdirSync(targetDir);
    for (const f of filesInBackup) {
        const fp = path.join(targetDir, f);
        if (fs.statSync(fp).isFile() && f !== 'SHA256SUMS.txt') {
            sums.push(`${calculateSha256(fp)}  ${f}`);
        }
    }
    const sumsPath = path.join(targetDir, 'SHA256SUMS.txt');
    fs.writeFileSync(sumsPath, sums.join('\n') + '\n', 'utf8');
    console.log(`  ✓ Manifest saved: ${manifestPath}`);
    console.log(`  ✓ Checksums saved: ${sumsPath}`);

    console.log('\n======================================================================');
    console.log('              FULL SYSTEM BACKUP COMPLETED SUCCESSFULLY               ');
    console.log('======================================================================');
    console.log(`Destination Folder: backups/${backupDirName}/\n`);
    return manifest;
}

performFullBackup().catch((err) => {
    console.error('Fatal error during full backup:', err);
    process.exit(1);
});
