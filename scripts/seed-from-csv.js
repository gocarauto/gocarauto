import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import sqlite3Lib from 'sqlite3';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Lib.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..');
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
            if (err) reject(err);
            else resolve(this);
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
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (s.length === 8 && /^\d+$/.test(s)) {
        return `${s.substring(4, 8)}-${s.substring(2, 4)}-${s.substring(0, 2)}`;
    }
    return s;
}

async function importData() {
    console.log('--- STARTING DATA IMPORT ---');
    const customerMap = new Map();
    const vehicleMap = new Map();
    const requestMap = new Map();
    const itemMap = new Map();
    const requestMeta = new Map();

    try {
        await runQuery('BEGIN TRANSACTION');
        const historyRaw = fs.existsSync(path.join(BASE_DIR, FILES.history)) ? parse(fs.readFileSync(path.join(BASE_DIR, FILES.history)), { columns: true, skip_empty_lines: true }) : [];
        const recordsRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.records)), { columns: true, skip_empty_lines: true });

        for (const row of historyRaw) {
            const reqID = row.RequestID?.trim();
            const date = formatDate(row.ServiceDate);
            if (!reqID || !date) continue;
            requestMeta.set(reqID, { date, mileage: 0 });
        }

        for (const row of recordsRaw) {
            const reqID = row.RequestID?.trim();
            const date = formatDate(row.ServiceDate);
            const mileage = parseInt(row.Mileage || 0);
            if (!reqID) continue;
            const existing = requestMeta.get(reqID) || { date: date, mileage: mileage };
            if (date && (!existing.date || date > existing.date)) existing.date = date;
            if (mileage > existing.mileage) existing.mileage = mileage;
            requestMeta.set(reqID, existing);
        }

        const customersRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.customers)), { columns: true, skip_empty_lines: true });
        for (const row of customersRaw) {
            const oldID = row.CustomerID.trim();
            const name = row.Name.trim();
            const res = await runQuery(
                `INSERT INTO clients (full_name, email, phone, address, join_date, referral_source, notes, total_spent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, row.Email?.trim() || null, row.Mobile.trim(), row.Address?.trim() || null, formatDate(row.JoinDate), row.ReferralSource?.trim() || null, row.Notes?.trim() || null, 0]
            );
            customerMap.set(oldID, { newID: res.lastID, name: name });
        }

        const vehiclesRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.vehicles)), { columns: true, skip_empty_lines: true });
        for (const row of vehiclesRaw) {
            const oldVehID = row.VehicleID.trim();
            const cust = customerMap.get((row.CustomerID || "").trim());
            if (!cust) continue;
            const res = await runQuery(
                `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage, last_service_date, last_service_mileage, next_service_due, services_count, total_spent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [cust.newID, cust.name, row.Make?.trim(), row.Model?.trim(), parseInt(row.Year) || null, row.LicensePlate?.trim() || null, row.Vin?.trim() || null, parseInt(row.CurrentMileage) || 0, formatDate(row.LastServiceDate), parseInt(row.LastServiceMileage) || 0, formatDate(row.NextServiceDue), parseInt(row.ServicesCount) || 0, 0]
            );
            vehicleMap.set(oldVehID, res.lastID);
        }

        const requestsRaw = parse(fs.readFileSync(path.join(BASE_DIR, FILES.requests)), { columns: true, skip_empty_lines: true });
        for (const row of requestsRaw) {
            const oldReqID = row.RequestID.trim();
            const cust = customerMap.get((row.CustomerID || "").trim());
            const newVehID = vehicleMap.get((row.VehicleID || "").trim());
            if (!cust || !newVehID) continue;
            const meta = requestMeta.get(oldReqID);
            const reqDate = meta?.date || formatDate(row.RequestDate) || new Date().toISOString().split('T')[0];
            const mileage = meta?.mileage || 0;
            const res = await runQuery(
                `INSERT INTO service_requests (client_id, vehicle_id, request_date, service_type, status, client_name, vehicle_info, notes, mileage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [cust.newID, newVehID, reqDate, row.ServiceType?.trim() || null, 'Paid', cust.name, row.VehicleInfo?.trim() || "Vehicle", null, mileage]
            );
            requestMap.set(oldReqID, res.lastID);
        }

        for (const row of recordsRaw) {
            const newReqID = requestMap.get(row.RequestID.trim());
            if (!newReqID) continue;
            const itemName = (row.ItemName || row.ItemNameAr || "Item").trim();
            const unitPrice = parseFloat(row.UnitPrice || 0);
            const qty = parseFloat(row.Quantity || 1);
            const total = parseFloat(row.TotalPrice || (unitPrice * qty));

            let itemID = itemMap.get(itemName);
            if (!itemID) {
                const existing = await getRow(`SELECT id FROM service_items WHERE item_name = ?`, [itemName]);
                if (existing) itemID = existing.id;
                else {
                    const iRes = await runQuery(`INSERT INTO service_items (item_name, item_name_ar, category, sale_price) VALUES (?, ?, ?, ?)`, [itemName, (row.ItemNameAr || itemName).trim(), (row.Category || "Parts").trim(), unitPrice]);
                    itemID = iRes.lastID;
                }
                itemMap.set(itemName, itemID);
            }

            await runQuery(
                `INSERT INTO service_records (request_id, service_date, mileage, item_id, quantity, unit_price, total_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [newReqID, formatDate(row.ServiceDate), parseInt(row.Mileage) || 0, itemID, qty, unitPrice, total, row.Notes || null]
            );
        }

        await runQuery('COMMIT');
        console.log(`--- IMPORT COMPLETED ---`);
    } catch (err) {
        await runQuery('ROLLBACK').catch(() => {});
        console.error('SERVER_SEED_ERROR:', err);
    } finally {
        db.close();
    }
}
importData();
