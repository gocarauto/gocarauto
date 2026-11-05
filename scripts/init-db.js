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

if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Deleted existing database');
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error('Error creating database:', err); process.exit(1); }
    console.log('Created new database');
});

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

db.exec(schema, (err) => {
    if (err) { console.error('Error executing schema:', err); process.exit(1); }
    console.log('Schema created successfully');

    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seed, (err) => {
        if (err) { console.error('Error executing seed data:', err); process.exit(1); }
        console.log('Seed data inserted successfully');

        db.close((err) => {
            if (err) { console.error('Error closing database:', err); }
            else { console.log('Database initialized successfully!'); }
        });
    });
});
