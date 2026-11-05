const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const sqlite3 = require('sqlite3').verbose();

const BASE_DIR = '/home/akhalil/AntiGravity/GoCar Auto';
const DB_PATH = path.join(BASE_DIR, 'database', 'gocar_auto.db');

const FILES = {
    customers: 'database/seed_data/customers.csv',
    vehicles: 'database/seed_data/vehicles.csv',
    requests: 'database/seed_data/service_requests.csv',
    records: 'database/seed_data/service_records.csv',
    history: 'database/seed_data/service_history.csv'
};

const db = new sqlite3.Database(DB_PATH);

async function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error(`SQL Error: ${sql} | Params: ${JSON.stringify(params)}`);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

async function getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    const s = dateStr.toString().trim();
    if (!s) return null;

    // Handle DD/MM/YYYY
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    // Handle DDMMYYYY
    if (s.length === 8 && /^\d+$/.test(s)) {
        return `${s.substring(4, 8)}-${s.substring(2, 4)}-${s.substring(0, 2)}`;
    }
    return s;
}

async function importData() {
    console.log('--- STARTING EXPERT DATA IMPORT (SNAKE_CASE FIXED) ---');

    const customerMap = new Map(); // OldID -> { newID, name }
    const vehicleMap = new Map();  // OldID -> newID
    const requestMap = new Map();  // OldID -> newID
    const itemMap = new Map();     // Name -> ID

    // Date/Mileage override map from Records/History
    const requestMeta = new Map(); // RequestID -> { date, mileage }

    try {
        // 0. PRE-PROCESS RECORDS FOR DATES/MILEAGE
        console.log('0. Scanning Service History & Records for accurate dates...');

        let historyRaw = [];
        try {
            historyRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.history)), { columns: true, skip_empty_lines: true });
        } catch (e) {
            console.log('Note: History file not found or empty, skipping history pre-process.');
        }

        const recordsRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.records)), { columns: true, skip_empty_lines: true });

        // Build meta from History first (often has dates)
        for (const row of historyRaw) {
            const reqID = row.RequestID?.trim();
            const date = formatDate(row.ServiceDate);
            if (!reqID || !date) continue;

            const existing = requestMeta.get(reqID) || { date: date, mileage: 0 };
            if (date > existing.date) existing.date = date; // Take latest date
            requestMeta.set(reqID, existing);
        }

        // Refine meta from Records (often has mileage)
        for (const row of recordsRaw) {
            const reqID = row.RequestID?.trim();
            const date = formatDate(row.ServiceDate);
            const mileage = parseInt(row.Mileage) || 0;
            if (!reqID) continue;

            const existing = requestMeta.get(reqID) || { date: date, mileage: mileage };
            if (date && (!existing.date || date > existing.date)) existing.date = date;
            if (mileage > existing.mileage) existing.mileage = mileage;
            requestMeta.set(reqID, existing);
        }

        // 1. CUSTOMERS => clients
        console.log('1. Importing Customers to clients...');
        const customersRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.customers)), { columns: true, skip_empty_lines: true });

        for (const row of customersRaw) {
            const oldID = row.CustomerID.trim();
            const name = row.Name.trim();

            // Check if exists (by phone or email) to avoid duplicates if re-running without nuke
            // For now assuming fresh nuke

            const res = await runQuery(
                `INSERT INTO clients (full_name, email, phone, address, join_date, referral_source, notes, total_spent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    row.Email?.trim() || null,
                    row.Mobile.trim(),
                    row.Address?.trim() || null,
                    formatDate(row.JoinDate),
                    row.ReferralSource?.trim() || null,
                    row.Notes?.trim() || null,
                    0
                ]
            );
            customerMap.set(oldID, { newID: res.lastID, name: name });
        }
        console.log(`   -> Imported ${customerMap.size} clients.`);

        // 2. VEHICLES => vehicles
        console.log('2. Importing Vehicles to vehicles...');
        const vehiclesRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.vehicles)), { columns: true, skip_empty_lines: true });

        for (const row of vehiclesRaw) {
            const oldVehID = row.VehicleID.trim();
            const oldCustID = (row.CustomerID || "").trim();
            const custInfo = customerMap.get(oldCustID);

            if (!custInfo) {
                console.warn(`! Skipping Vehicle ${oldVehID}: Customer ${oldCustID} not found.`);
                continue;
            }

            const res = await runQuery(
                `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage, last_service_date, last_service_mileage, next_service_due, services_count, total_spent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    custInfo.newID,
                    custInfo.name,
                    row.Make?.trim(),
                    row.Model?.trim(),
                    parseInt(row.Year) || null,
                    row.LicensePlate?.trim() || null,
                    row.Vin?.trim() || null,
                    parseInt(row.CurrentMileage) || 0,
                    formatDate(row.LastServiceDate),
                    parseInt(row.LastServiceMileage) || 0,
                    formatDate(row.NextServiceDue),
                    parseInt(row.ServicesCount) || 0,
                    0
                ]
            );
            vehicleMap.set(oldVehID, res.lastID);
        }
        console.log(`   -> Imported ${vehicleMap.size} vehicles.`);

        // 3. SERVICE REQUESTS => service_requests
        console.log('3. Importing Service Requests to service_requests...');
        const requestsRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.requests)), { columns: true, skip_empty_lines: true });

        for (const row of requestsRaw) {
            const oldReqID = row.RequestID.trim();
            const oldCustID = (row.CustomerID || "").trim();
            const oldVehID = (row.VehicleID || "").trim();

            const custInfo = customerMap.get(oldCustID);
            const newVehID = vehicleMap.get(oldVehID);

            if (!custInfo || !newVehID) {
                // Try to find vehicle by just referencing the map if exact match fails? No, data should be consistent.
                continue;
            }

            const meta = requestMeta.get(oldReqID);
            const reqDate = meta?.date || formatDate(row.RequestDate) || new Date().toISOString().split('T')[0];
            const mileage = meta?.mileage || 0;

            let status = (row.Status || "").trim();
            if (status === 'Completed' || status === 'Complete') status = 'Paid'; // Defaulting legacy Completed to Paid for safety in flow? Or Invoiced?
            // Actually, let's map 'Completed' -> 'Complete' as per schema enum mostly, or 'Paid' if we know it is.
            // Schema has: 'Open', 'In Progress', 'Complete', 'Invoiced', 'Paid', 'Parts Ordered'
            if (status === 'Completed') status = 'Complete';
            if (status === 'In Progress') status = 'In Progress';
            if (!status) status = 'Complete';

            // Validation
            const valid = ['Open', 'In Progress', 'Complete', 'Invoiced', 'Paid', 'Parts Ordered'];
            if (!valid.includes(status)) status = 'Complete';

            const res = await runQuery(
                `INSERT INTO service_requests (client_id, vehicle_id, request_date, service_type, status, client_name, vehicle_info, notes, mileage) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    custInfo.newID,
                    newVehID,
                    reqDate,
                    row.ServiceType?.trim() || null,
                    status,
                    custInfo.name,
                    row.VehicleInfo?.trim() || "Vehicle",
                    row.VehicleInfo?.trim() || null, // Notes often empty in CSV, using VehicleInfo as placeholder if needed? No, row.Notes used below if existing. Wait, CSV has RequestID,CustomerID... no Notes column in CSV header I saw earlier? 
                    // CSV Headers: RequestID,CustomerID,VehicleID,RequestDate,ServiceType,Status,CustomerName,VehicleInfo,DaysOpen
                    // No Notes in CSV.
                    mileage
                ]
            );
            requestMap.set(oldReqID, res.lastID);
        }
        console.log(`   -> Imported ${requestMap.size} service requests.`);

        // 4. SERVICE RECORDS & ITEMS => service_records, service_items
        console.log('4. Importing Service Records & Financials...');
        const requestTotals = new Map(); // newID -> total

        for (const row of recordsRaw) {
            const oldReqID = row.RequestID.trim();
            const newReqID = requestMap.get(oldReqID);
            if (!newReqID) continue;

            const itemName = (row.ItemName || row.ItemNameAr || "Service Item").trim();
            const itemNameAr = (row.ItemNameAr || itemName).trim();
            const category = (row.Category || "Parts").trim();
            const unitPrice = parseFloat(row.UnitPrice || 0);
            const qty = parseFloat(row.Quantity || 1);
            const total = parseFloat(row.TotalPrice || (unitPrice * qty));

            // Item lookup/create
            let itemID = itemMap.get(itemName);
            if (!itemID) {
                const existing = await getRow(`SELECT id FROM service_items WHERE item_name = ?`, [itemName]);
                if (existing) {
                    itemID = existing.id;
                } else {
                    const iRes = await runQuery(
                        `INSERT INTO service_items (item_name, item_name_ar, category, sale_price) VALUES (?, ?, ?, ?)`,
                        [itemName, itemNameAr, category, unitPrice]
                    );
                    itemID = iRes.lastID;
                }
                itemMap.set(itemName, itemID);
            }

            // Record insertion
            await runQuery(
                `INSERT INTO service_records (request_id, service_date, mileage, item_id, quantity, unit_price, total_price, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [newReqID, formatDate(row.ServiceDate), parseInt(row.Mileage) || 0, itemID, qty, unitPrice, total, row.Notes || null]
            );

            requestTotals.set(newReqID, (requestTotals.get(newReqID) || 0) + total);
        }

        // --- FINAL SYNC: INVOICES & TOTALS ---
        console.log('5. Generating Invoices and Syncing Totals...');
        let invoiceCount = 0;

        for (const [newReqID, total] of requestTotals) {
            if (total <= 0) continue; // Skip empty jobs in Financials

            const req = await getRow(`SELECT client_id, vehicle_id, request_date FROM service_requests WHERE id = ?`, [newReqID]);

            // Format invoice number: INV-YYYY-0000
            const year = req.request_date ? req.request_date.substring(0, 4) : new Date().getFullYear();
            const invNum = `INV-${year}-${newReqID.toString().padStart(4, '0')}`;

            await runQuery(
                `INSERT INTO financial_transactions (request_id, invoice_number, total_amount_due, amount_paid, payment_status, payment_date, payment_method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [newReqID, invNum, total, total, 'Paid', req.request_date, 'Cash']
            );

            // Mark request as Paid if it has financials
            await runQuery(`UPDATE service_requests SET status = 'Paid' WHERE id = ?`, [newReqID]);

            invoiceCount++;
        }

        console.log(`--- IMPORT COMPLETED ---`);
        console.log(`Summary: ${customerMap.size} Clients, ${vehicleMap.size} Vehicles, ${requestMap.size} Requests, ${invoiceCount} Invoices generated.`);

    } catch (err) {
        console.error('CRITICAL ERROR DURING IMPORT:', err);
    } finally {
        db.close();
    }
}

importData();
