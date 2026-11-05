const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'gocar_auto.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'database', 'seed.sql');

// Delete existing database if it exists
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Deleted existing database');
}

// Create new database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    console.log('Created new database');
});

// Read schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error executing schema:', err);
        process.exit(1);
    }
    console.log('Schema created successfully');

    // Read seed data
    const seed = fs.readFileSync(SEED_PATH, 'utf8');

    // Execute seed data
    db.exec(seed, (err) => {
        if (err) {
            console.error('Error executing seed data:', err);
            process.exit(1);
        }
        console.log('Seed data inserted successfully');

        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database initialized successfully!');
            }
        });
    });
});
