import sqlite3Lib from 'sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const sqlite3 = sqlite3Lib.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'gocar_auto.db');
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

/**
 * Database Wrapper Class
 * Provides a consistent async/await API for both SQLite and MySQL.
 */
class Database {
    constructor() {
        this.db = null;
        this.client = null;
        this.activeConnection = null;
    }

    /**
     * Initialize database connection.
     */
    async connect() {
        if (DB_TYPE === 'mysql') {
            try {
                const poolConfig = {
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT, 10) || 3306,
                    user: process.env.DB_USER || 'gocar_user',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'gocar_auto',
                    waitForConnections: true,
                    connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 20,
                    maxIdle: parseInt(process.env.DB_POOL_MAX_IDLE, 10) || 10,
                    idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 60000,
                    enableKeepAlive: true,
                    keepAliveInitialDelay: 10000,
                    queueLimit: 0,
                    timezone: '+00:00',
                    dateStrings: true
                };
                if (process.env.DB_SSL === 'true') {
                    poolConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
                }
                this.client = await mysql.createPool(poolConfig);
                console.log('Connected to MySQL database with Releem-tuned connection pool');
            } catch (err) {
                console.error('Error connecting to MySQL database:', err);
                throw err;
            }
        } else {
            return new Promise((resolve, reject) => {
                this.db = new sqlite3.Database(DB_PATH, (err) => {
                    if (err) {
                        console.error('Error connecting to database:', err);
                        reject(err);
                    } else {
                        console.log('Connected to SQLite database');
                        this.db.serialize(() => {
                            this.db.run('PRAGMA foreign_keys = ON');
                            this.db.run('PRAGMA journal_mode = WAL');
                            this.db.run('PRAGMA synchronous = NORMAL');
                            this.db.run('PRAGMA cache_size = -64000'); // 64MB memory page cache
                            this.db.run('PRAGMA temp_store = MEMORY');  // In-memory temp tables & sorts
                            this.db.run('PRAGMA mmap_size = 268435456'); // 256MB memory-mapped I/O
                            this.db.run('PRAGMA busy_timeout = 5000', (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    }
                });
            });
        }
    }

    /**
     * Check if database tables have been initialized.
     */
    async isInitialized() {
        try {
            if (DB_TYPE === 'mysql') {
                const rows = await this.query("SHOW TABLES LIKE 'users'");
                return rows && rows.length > 0;
            } else {
                const rows = await this.query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
                return rows && rows.length > 0;
            }
        } catch (err) {
            console.warn('Database initialization check failed or tables missing:', err.message);
            return false;
        }
    }

    /**
     * Initialize database schema.
     */
    async initSchema() {
        if (DB_TYPE === 'mysql') {
            const mysqlSchemaPath = path.join(__dirname, 'schema.mysql.sql');
            if (fs.existsSync(mysqlSchemaPath)) {
                const schema = fs.readFileSync(mysqlSchemaPath, 'utf8');
                const statements = schema
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));
                for (const statement of statements) {
                    await this.client.query(statement);
                }
                console.log('MySQL database schema initialized successfully');
            } else {
                console.log("MySQL schema initialization requires manual processing or database/schema.mysql.sql.");
            }
            return Promise.resolve();
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing schema:', err);
                    reject(err);
                } else {
                    console.log('Database schema initialized successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Ensure all required operational tables and views exist across both MySQL and SQLite.
     * Runs idempotently (CREATE TABLE IF NOT EXISTS) so existing data is never disturbed.
     */
    async ensureTables() {
        if (DB_TYPE === 'mysql') {
            const tableQueries = [
                `CREATE TABLE IF NOT EXISTS customer_documents (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    title VARCHAR(255) NULL,
                    document_type VARCHAR(100) NOT NULL,
                    file_url VARCHAR(500) NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_cd_client (client_id),
                    INDEX idx_cd_file_url (file_url)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS service_reminders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    vehicle_id INT NOT NULL,
                    service_type VARCHAR(100) NOT NULL,
                    due_date VARCHAR(50) NULL,
                    notes TEXT,
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    interval_km INT NULL,
                    interval_months INT NULL,
                    INDEX idx_srem_vehicle (vehicle_id),
                    INDEX idx_srem_client (client_id),
                    INDEX idx_srem_status (status),
                    INDEX idx_srem_status_due (status, due_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS consignment_requests (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    vehicle_id INT NOT NULL,
                    asking_price DECIMAL(12,2) NOT NULL,
                    current_mileage INT DEFAULT 0,
                    notes TEXT,
                    status VARCHAR(50) DEFAULT 'Submitted',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_cr_client (client_id),
                    INDEX idx_cr_vehicle (vehicle_id),
                    INDEX idx_cr_status (status),
                    INDEX idx_cr_status_created (status, created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS consignment_listings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    request_id INT NULL,
                    vehicle_id INT NOT NULL,
                    client_id INT NOT NULL,
                    asking_price DECIMAL(12,2) NOT NULL,
                    sold_price DECIMAL(12,2) NULL,
                    commission_type VARCHAR(50) NULL,
                    commission_rate DECIMAL(5,2) DEFAULT 2.50,
                    commission_amount DECIMAL(10,2) DEFAULT 0.00,
                    listing_status VARCHAR(50) DEFAULT 'Active',
                    fb_marketplace_url VARCHAR(500) NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_cl_request (request_id),
                    INDEX idx_cl_vehicle (vehicle_id),
                    INDEX idx_cl_client (client_id),
                    INDEX idx_cl_status (listing_status),
                    INDEX idx_cl_status_created (listing_status, created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS vehicle_maintenance_ledger (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_id INT NOT NULL,
                    tracking_point VARCHAR(255) NOT NULL,
                    last_service_id INT NULL,
                    last_mileage INT NULL,
                    last_date VARCHAR(50) NULL,
                    next_due_mileage INT NULL,
                    next_due_date VARCHAR(50) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_veh_tracking (vehicle_id, tracking_point),
                    INDEX idx_vml_vehicle (vehicle_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS service_request_comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    request_id INT NOT NULL,
                    author_name VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_src_request (request_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS external_services (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    vehicle_id INT NOT NULL,
                    workshop_name VARCHAR(255) NOT NULL,
                    service_type VARCHAR(100) NULL,
                    service_date VARCHAR(50) NOT NULL,
                    mileage INT NULL,
                    total_amount DECIMAL(10,2) NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_ext_vehicle (vehicle_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE TABLE IF NOT EXISTS notification_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL,
                    vehicle_id INT NULL,
                    notification_type VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    sent_via VARCHAR(50) DEFAULT 'Both',
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'Sent',
                    INDEX idx_nl_client (client_id),
                    INDEX idx_nl_vehicle (vehicle_id),
                    INDEX idx_nl_status_sent (status, sent_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

                `CREATE OR REPLACE VIEW service_history AS
                SELECT 
                    sr.id AS record_id,
                    sr.service_date,
                    c.id AS client_id,
                    c.full_name AS client_name,
                    c.email AS client_email,
                    c.phone AS client_mobile,
                    v.id AS vehicle_id,
                    CONCAT(v.make, ' ', v.model, ' (', COALESCE(v.year, ''), ')') AS vehicle_info,
                    v.license_plate,
                    v.vin,
                    sr.mileage,
                    si.item_name,
                    si.item_name_ar,
                    si.category,
                    sr.quantity,
                    sr.unit_price,
                    sr.total_price,
                    u.name AS serviced_by,
                    sreq.id AS request_id,
                    sreq.status AS request_status,
                    ft.id AS invoice_id,
                    ft.invoice_number,
                    ft.payment_status,
                    ft.service_fee,
                    ft.spare_parts_markup,
                    ft.total_amount_due
                FROM service_records sr
                JOIN service_requests sreq ON sr.request_id = sreq.id
                JOIN clients c ON sreq.client_id = c.id
                JOIN vehicles v ON sreq.vehicle_id = v.id
                JOIN service_items si ON sr.item_id = si.id
                LEFT JOIN users u ON sr.user_id = u.id
                LEFT JOIN financial_transactions ft ON sreq.id = ft.request_id`
            ];

            for (const query of tableQueries) {
                try {
                    await this.client.query(query);
                } catch (e) {
                    console.warn('ensureTables warning on MySQL:', e.message);
                }
            }
        }
    }

    /**
     * Load seed data (SQLite only).
     */
    async loadSeedData() {
        if (DB_TYPE === 'mysql') return Promise.resolve();

        const seedPath = path.join(__dirname, 'seed.sql');
        const seedData = fs.readFileSync(seedPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(seedData, (err) => {
                if (err) {
                    console.error('Error loading seed data:', err);
                    reject(err);
                } else {
                    console.log('Seed data loaded successfully');
                    resolve();
                }
            });
        });
    }

    /**
     * Run a query (SELECT multiple).
     */
    async query(sql, params = [], tx = null) {
        if (DB_TYPE === 'mysql') {
            const client = tx || this.client;
            const [rows] = await client.execute(sql, params);
            return rows;
        }

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Query error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get a single row.
     */
    async get(sql, params = [], tx = null) {
        if (DB_TYPE === 'mysql') {
            const client = tx || this.client;
            const [rows] = await client.execute(sql, params);
            return rows[0] || undefined;
        }

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Run a command (INSERT, UPDATE, DELETE).
     */
    async run(sql, params = [], tx = null) {
        if (DB_TYPE === 'mysql') {
            const client = tx || this.client;
            const [result] = await client.execute(sql, params);
            return { id: result.insertId, changes: result.affectedRows };
        }

        return new Promise((resolve, reject) => {
            const self = this;
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Begin transaction.
     */
    async beginTransaction() {
        if (DB_TYPE === 'mysql') {
            const connection = await this.client.getConnection();
            await connection.beginTransaction();
            return connection;
        }
        await this.run('BEGIN TRANSACTION');
        return null;
    }

    /**
     * Commit transaction.
     */
    async commit(tx = null) {
        if (DB_TYPE === 'mysql' && tx) {
            await tx.commit();
            tx.release();
            return;
        }
        return this.run('COMMIT');
    }

    /**
     * Rollback transaction.
     */
    async rollback(tx = null) {
        if (DB_TYPE === 'mysql' && tx) {
            await tx.rollback();
            tx.release();
            return;
        }
        return this.run('ROLLBACK');
    }

    /**
     * Close connection.
     */
    async close() {
        if (DB_TYPE === 'mysql') {
            if (this.client) {
                await this.client.end();
                console.log('MySQL connection closed');
            }
            return;
        }

        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('SQLite database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

const database = new Database();
export default database;
