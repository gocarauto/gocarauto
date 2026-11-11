#!/usr/bin/env node
/**
 * GoCar Auto - Database Performance & SQL Optimization Audit
 * Inspired by EverSQL / SQL Auto-Optimization principles for Postgres/MySQL/MariaDB/Aurora & SQLite.
 *
 * Verifies:
 * 1. Foreign Key Index Coverage (referential integrity without table locks)
 * 2. High-Performance Composite & Filter Indexes
 * 3. Query Plan Verification (EXPLAIN QUERY PLAN - zero unintended table scans)
 * 4. Cross-dialect Schema Parity between SQLite and MySQL/Postgres/Aurora
 */

import database from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
    console.log('='.repeat(70));
    console.log('   GoCar Auto Database Optimization & Performance Audit');
    console.log('='.repeat(70));

    await database.connect();

    // 1. Audit Existing Indexes
    console.log('\n[1/4] Auditing Database Indexes...');
    const indexes = await database.query(`
        SELECT name, tbl_name, sql 
        FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex_%'
        ORDER BY tbl_name, name
    `);
    console.log(`Found ${indexes.length} custom performance indexes:`);
    const indexNames = new Set(indexes.map(i => i.name));

    const criticalExpectedIndexes = [
        'idx_clients_phone',
        'idx_clients_join_date',
        'idx_clients_referred_by',
        'idx_vehicles_client',
        'idx_vehicles_license',
        'idx_vehicles_vin',
        'idx_vehicles_next_service_due',
        'idx_vehicles_client_make_model',
        'idx_service_items_category',
        'idx_service_items_tracking',
        'idx_service_requests_client',
        'idx_service_requests_vehicle',
        'idx_service_requests_status',
        'idx_service_requests_request_date',
        'idx_service_requests_client_date',
        'idx_service_requests_vehicle_date',
        'idx_service_requests_status_date',
        'idx_service_requests_assigned',
        'idx_service_records_request',
        'idx_service_records_item',
        'idx_service_records_service_date',
        'idx_service_records_req_item',
        'idx_service_records_user',
        'idx_financial_transactions_request',
        'idx_financial_transactions_invoice',
        'idx_financial_transactions_status',
        'idx_financial_transactions_created_at',
        'idx_financial_transactions_status_date',
        'idx_financial_transactions_status_created',
        'idx_customer_documents_client',
        'idx_customer_documents_file_url',
        'idx_service_reminders_vehicle',
        'idx_service_reminders_client',
        'idx_service_reminders_status',
        'idx_service_reminders_status_due',
        'idx_consignment_requests_client',
        'idx_consignment_requests_vehicle',
        'idx_consignment_requests_status',
        'idx_consignment_requests_status_created',
        'idx_consignment_listings_status',
        'idx_consignment_listings_vehicle',
        'idx_consignment_listings_client',
        'idx_consignment_listings_status_created',
        'idx_notification_logs_client',
        'idx_notification_logs_vehicle',
        'idx_notification_logs_status_sent'
    ];

    let missingCritical = 0;
    for (const expected of criticalExpectedIndexes) {
        if (indexNames.has(expected)) {
            console.log(`  ✓ ${expected}`);
        } else {
            console.log(`  ✗ MISSING: ${expected}`);
            missingCritical++;
        }
    }

    if (missingCritical > 0) {
        console.error(`\n[FAIL] Missing ${missingCritical} recommended performance indexes.`);
    } else {
        console.log(`\n[PASS] All ${criticalExpectedIndexes.length} recommended performance indexes are active.`);
    }

    // 2. Query Plan Execution & Table Scan Detection (EXPLAIN QUERY PLAN)
    console.log('\n[2/4] Testing Query Plans on Production Workloads (Zero Table Scans)...');
    const workloads = [
        {
            name: 'Customer Phone Lookup',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM clients WHERE phone = ?',
            params: ['01011112222'],
            expectedIndex: 'idx_clients_phone'
        },
        {
            name: 'Vehicle VIN Lookup',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM vehicles WHERE vin = ?',
            params: ['WBA1234567890'],
            expectedIndex: 'idx_vehicles_vin',
            alternateIndex: 'sqlite_autoindex_vehicles_2'
        },
        {
            name: 'Customer Secure Document Access',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM customer_documents WHERE file_url = ?',
            params: ['/uploads/customer_documents/doc.pdf'],
            expectedIndex: 'idx_customer_documents_file_url'
        },
        {
            name: 'Client Upcoming Services Queue',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM vehicles WHERE client_id = ? ORDER BY next_service_due ASC',
            params: [1],
            expectedIndex: 'idx_vehicles_client'
        },
        {
            name: 'Customer Service Request Timeline',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_requests WHERE client_id = ? ORDER BY request_date DESC',
            params: [1],
            expectedIndex: 'idx_service_requests_client_date'
        },
        {
            name: 'Operations Board Status Filter & Sorting',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_requests WHERE status = ? ORDER BY request_date DESC',
            params: ['Open'],
            expectedIndex: 'idx_service_requests_status_date'
        },
        {
            name: 'Technician Assigned Active Queue',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_requests WHERE assigned_to_id = ? AND status = ?',
            params: [1, 'In Progress'],
            expectedIndex: 'idx_service_requests_assigned'
        },
        {
            name: 'Itemized Service Record Retrieval',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_records WHERE request_id = ? AND item_id = ?',
            params: [1, 2],
            expectedIndex: 'idx_service_records_req_item'
        },
        {
            name: 'Chronological Service Records History',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_records ORDER BY service_date DESC LIMIT 50',
            params: [],
            expectedIndex: 'idx_service_records_service_date'
        },
        {
            name: 'Revenue Reconciliation by Status and Date Range',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM financial_transactions WHERE payment_status = ? AND payment_date >= ?',
            params: ['Paid', '2026-01-01'],
            expectedIndex: 'idx_financial_transactions_status_date'
        },
        {
            name: 'Unpaid / Pending Invoice Worklist',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM financial_transactions WHERE payment_status = ? ORDER BY created_at DESC',
            params: ['Pending'],
            expectedIndex: 'idx_financial_transactions_status_created'
        },
        {
            name: 'Automated Service Reminders Daily Dispatcher',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_reminders WHERE status = ? AND due_date <= CURRENT_DATE',
            params: ['Pending'],
            expectedIndex: 'idx_service_reminders_status_due'
        },
        {
            name: 'Consignment Pipeline Status Filter & Reverse Order',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM consignment_requests WHERE status = ? ORDER BY created_at DESC',
            params: ['New'],
            expectedIndex: 'idx_consignment_requests_status_created'
        },
        {
            name: 'Consignment Marketplace Workspace Status Feed',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM consignment_listings WHERE listing_status = ? ORDER BY created_at DESC',
            params: ['Active'],
            expectedIndex: 'idx_consignment_listings_status_created'
        },
        {
            name: 'Active Catalog Parts Filter',
            sql: 'EXPLAIN QUERY PLAN SELECT * FROM service_items WHERE category = ? AND is_active = 1',
            params: ['Parts'],
            expectedIndex: 'idx_service_items_category'
        }
    ];

    let queryFailures = 0;
    for (const wl of workloads) {
        const plan = await database.query(wl.sql, wl.params);
        const planStr = JSON.stringify(plan);
        const usesIndex = planStr.includes(wl.expectedIndex) || (wl.alternateIndex && planStr.includes(wl.alternateIndex));
        const matchedIndex = planStr.includes(wl.expectedIndex) ? wl.expectedIndex : wl.alternateIndex;

        if (usesIndex) {
            console.log(`  ✓ ${wl.name.padEnd(50)} [INDEX: ${matchedIndex}]`);
        } else {
            console.log(`  ✗ ${wl.name.padEnd(50)} [NOT USING ${wl.expectedIndex}]: ${planStr}`);
            queryFailures++;
        }
    }

    if (queryFailures === 0) {
        console.log('\n[PASS] All primary workloads utilize dedicated B-Tree indexes (0 full table scans).');
    } else {
        console.error(`\n[FAIL] ${queryFailures} workloads failed index utilization.`);
    }

    // 3. Foreign Key Integrity Audit
    console.log('\n[3/4] Auditing Foreign Key Integrity...');
    const fkViolations = await database.query('PRAGMA foreign_key_check');
    if (fkViolations.length === 0) {
        console.log('  ✓ 0 foreign key violations detected across all database relationships.');
    } else {
        console.error(`  ✗ ${fkViolations.length} foreign key violations found:`, fkViolations);
    }

    // 4. Cross-dialect Schema Parity Audit (SQLite vs MySQL/Postgres/Aurora)
    console.log('\n[4/4] Auditing Cross-Dialect Schema Parity...');
    const sqliteSchema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    const mysqlSchema = fs.readFileSync(path.join(__dirname, '../database/schema.mysql.sql'), 'utf8');

    const tablesToCheck = [
        'users', 'clients', 'vehicles', 'service_items', 'service_requests',
        'service_records', 'financial_transactions', 'customer_documents',
        'service_reminders', 'consignment_requests', 'consignment_listings',
        'vehicle_maintenance_ledger', 'service_request_comments',
        'external_services', 'notification_logs'
    ];

    let parityErrors = 0;
    for (const t of tablesToCheck) {
        const hasSqlite = sqliteSchema.includes(`CREATE TABLE IF NOT EXISTS ${t}`) || sqliteSchema.includes(`CREATE TABLE ${t}`);
        const hasMysql = mysqlSchema.includes(`CREATE TABLE IF NOT EXISTS ${t}`) || mysqlSchema.includes(`CREATE TABLE ${t}`);
        if (hasSqlite && hasMysql) {
            console.log(`  ✓ Table '${t}' present in both SQLite and MySQL/Postgres/Aurora.`);
        } else {
            console.error(`  ✗ Parity mismatch for table '${t}': SQLite=${hasSqlite}, MySQL=${hasMysql}`);
            parityErrors++;
        }
    }

    console.log('\n' + '='.repeat(70));
    const allPassed = missingCritical === 0 && queryFailures === 0 && fkViolations.length === 0 && parityErrors === 0;
    if (allPassed) {
        console.log('  Database Optimization & Performance Audit: ALL CHECKS PASSED (100% HEALTHY)');
    } else {
        console.log('  Database Optimization & Performance Audit: ISSUES FOUND');
    }
    console.log('='.repeat(70) + '\n');

    await database.close();
    process.exit(allPassed ? 0 : 1);
}

runAudit().catch(err => {
    console.error('Audit failed with unhandled error:', err);
    process.exit(1);
});
