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
                    connectionLimit: 10,
                    maxIdle: 10,
                    idleTimeout: 60000,
                    enableKeepAlive: true,
                    keepAliveInitialDelay: 10000,
                    queueLimit: 0,
                };
                if (process.env.DB_SSL === 'true') {
                    poolConfig.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
                }
                this.client = await mysql.createPool(poolConfig);
                console.log('Connected to MySQL database');
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
