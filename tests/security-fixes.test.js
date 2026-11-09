import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import database from '../database/db.js';
import vehicleController from '../controllers/vehicleController.js';
import consignmentController from '../controllers/consignmentController.js';
import userController from '../controllers/userController.js';
import financialController from '../controllers/financialController.js';
import { verifyToken, isCustomer } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { sendEmail } from '../utils/notification-service.js';

describe('Security Audit Regression & Fixes Verification', () => {
    let testClientId;
    let testVehicleId;
    let testListingId;
    let testStaffId;

    before(async () => {
        await database.connect();

        // Clean up any stale records from interrupted prior runs
        await database.run(`DELETE FROM clients WHERE email = 'sec@test.com'`);
        await database.run(`DELETE FROM users WHERE email = 'secadmin@gocarauto.com'`);

        // Seed test client and vehicle
        const clientRes = await database.run(
            `INSERT INTO clients (full_name, phone, email) VALUES ('Sec Test User', '01011112222', 'sec@test.com')`
        );
        testClientId = clientRes.id;

        const vehicleRes = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage)
             VALUES (?, 'Sec Test User', 'BMW', '320i', 2021, 'SEC-1010', 'WBA320ISEC1010999', 45000)`,
            [testClientId]
        );
        testVehicleId = vehicleRes.id;

        // Seed consignment listing
        const listingRes = await database.run(
            `INSERT INTO consignment_listings (client_id, vehicle_id, asking_price, listing_status)
             VALUES (?, ?, 950000, 'Listed')`,
            [testClientId, testVehicleId]
        );
        testListingId = listingRes.id;

        // Seed staff user
        const staffRes = await database.run(
            `INSERT INTO users (name, email, role, mobile, password_hash)
             VALUES ('Sec Admin', 'secadmin@gocarauto.com', 'Admin', '01000000001', 'hashed_pass')`
        );
        testStaffId = staffRes.id;
    });

    after(async () => {
        if (testStaffId) {
            await database.run('DELETE FROM users WHERE id = ?', [testStaffId]);
        }
        if (testListingId) {
            await database.run('DELETE FROM consignment_listings WHERE id = ?', [testListingId]);
        }
        if (testVehicleId) {
            await database.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
        }
        if (testClientId) {
            await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
        }
        await database.close();
    });

    test('GOCAR-SEC-01: Public pedigree rejects small integer IDs to prevent sequential scraping', async () => {
        let statusCode = 200;
        let responseData = null;

        const req = {
            params: { identifier: '1' }
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; }
        };

        await vehicleController.getPublicPassport(req, res);
        assert.equal(statusCode, 400);
        assert.equal(responseData.success, false);
        assert.match(responseData.error, /Valid VIN or License Plate is required/i);
    });

    test('GOCAR-SEC-01: Public pedigree allows legitimate VIN lookup', async () => {
        let statusCode = 200;
        let responseData = null;

        const req = {
            params: { identifier: 'WBA320ISEC1010999' }
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; }
        };

        await vehicleController.getPublicPassport(req, res);
        assert.equal(statusCode, 200);
        assert.equal(responseData.success, true);
        assert.equal(responseData.data.vehicle.vin, 'WBA320ISEC1010999');
    });

    test('GOCAR-SEC-04: verifyToken rejects query ?token= on mutating requests (POST)', () => {
        let statusCode = 200;
        let responseData = null;

        const validToken = jwt.sign({ id: 1, userType: 'staff', role: 'Admin' }, process.env.JWT_SECRET || 'test_secret');
        const req = {
            method: 'POST',
            path: '/api/users',
            originalUrl: '/api/users?token=' + validToken,
            query: { token: validToken },
            headers: {},
            cookies: {}
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; }
        };

        let nextCalled = false;
        verifyToken(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false, 'Should reject token in query on POST request');
        assert.equal(statusCode, 403);
    });

    test('GOCAR-SEC-04: verifyToken permits query ?token= on safe GET PDF download routes', () => {
        const validToken = jwt.sign({ id: 1, userType: 'staff', role: 'Admin' }, process.env.JWT_SECRET || 'test_secret');
        const req = {
            method: 'GET',
            path: '/1/pdf',
            originalUrl: '/api/financial/1/pdf?token=' + validToken,
            query: { token: validToken },
            headers: {},
            cookies: {}
        };
        const res = {
            status: () => res,
            json: () => {}
        };

        let nextCalled = false;
        verifyToken(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, true, 'Should accept token in query on safe GET /pdf routes');
        assert.equal(req.user.id, 1);
    });

    test('GOCAR-SEC-05: isCustomer blocks non-customer tokens from customer vault routes', () => {
        let statusCode = 200;
        let responseData = null;

        const req = {
            user: { id: testStaffId, userType: 'staff', role: 'Admin' }
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { responseData = data; }
        };

        let nextCalled = false;
        isCustomer(req, res, () => { nextCalled = true; });

        assert.equal(nextCalled, false, 'Staff token must not pass isCustomer middleware');
        assert.equal(statusCode, 403);
    });

    test('GOCAR-SEC-06: settleListing rejects re-settling an already Sold listing', async () => {
        // First settlement
        const req1 = {
            params: { id: testListingId },
            body: { soldPrice: 940000, commissionRate: 2.5 }
        };
        const res1 = {
            status: () => res1,
            json: () => {}
        };
        await consignmentController.settleListing(req1, res1);

        // Second settlement attempt must return 409 Conflict
        let statusCode = 200;
        let responseData = null;
        const req2 = {
            params: { id: testListingId },
            body: { soldPrice: 900000, commissionRate: 5.0 }
        };
        const res2 = {
            status: (code) => { statusCode = code; return res2; },
            json: (data) => { responseData = data; }
        };

        await consignmentController.settleListing(req2, res2);
        assert.equal(statusCode, 409, 'Duplicate settlement must be rejected with 409');
        assert.equal(responseData.success, false);
    });

    test('GOCAR-SEC-08: Staff updateUser preserves existing attributes during partial update', async () => {
        const req = {
            params: { id: testStaffId },
            body: { role: 'Operator' } // Notice: name, email, mobile are omitted
        };
        const res = {
            status: () => res,
            json: () => {}
        };

        await userController.updateUser(req, res);

        const updated = await database.get('SELECT * FROM users WHERE id = ?', [testStaffId]);
        assert.equal(updated.role, 'Operator', 'Role should be updated to Operator');
        assert.equal(updated.name, 'Sec Admin', 'Name should NOT be nullified');
        assert.equal(updated.email, 'secadmin@gocarauto.com', 'Email should NOT be nullified');
        assert.equal(updated.mobile, '01000000001', 'Mobile should NOT be nullified');
    });

    test('GOCAR-SEC-09: IDOR protection blocks customer from viewing invoices belonging to other clients', async () => {
        const uniqueSuffix = Date.now();
        let otherClient, otherVehicle, otherReq, otherInvoice;
        try {
            // Create another client's request & financial transaction
            otherClient = await database.run(
                `INSERT INTO clients (full_name, phone, email) VALUES ('Victim User', ?, ?)`,
                [`0109${String(uniqueSuffix).slice(-7)}`, `victim-${uniqueSuffix}@test.com`]
            );
            otherVehicle = await database.run(
                `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate)
                 VALUES (?, 'Victim User', 'Audi', 'A6', 2022, ?)`,
                [otherClient.id, `VIC-${String(uniqueSuffix).slice(-5)}`]
            );
            otherReq = await database.run(
                `INSERT INTO service_requests (client_id, client_name, vehicle_id, vehicle_info, service_type, status)
                 VALUES (?, 'Victim User', ?, 'Audi A6 2022', 'Maintenance', 'Completed')`,
                [otherClient.id, otherVehicle.id]
            );
            otherInvoice = await database.run(
                `INSERT INTO financial_transactions (request_id, invoice_number, total_amount_due, payment_status)
                 VALUES (?, ?, 5000, 'Paid')`,
                [otherReq.id, `INV-SEC-${uniqueSuffix}`]
            );

            let statusCode = 200;
            let errorMsg = '';
            const req = {
                params: { id: otherInvoice.id },
                user: { id: testClientId, userType: 'customer' } // Attacking user has different client ID
            };
            const res = {
                status: (code) => { statusCode = code; return res; },
                json: (data) => { errorMsg = data.error; }
            };

            await financialController.getInvoicePDF(req, res);
            assert.equal(statusCode, 403, 'Should reject with 403 Forbidden for unauthorized customer');
            assert.match(errorMsg, /Access denied/i);
        } finally {
            // Always clean up
            if (otherInvoice?.id) await database.run('DELETE FROM financial_transactions WHERE id = ?', [otherInvoice.id]);
            if (otherReq?.id) await database.run('DELETE FROM service_requests WHERE id = ?', [otherReq.id]);
            if (otherVehicle?.id) await database.run('DELETE FROM vehicles WHERE id = ?', [otherVehicle.id]);
            if (otherClient?.id) await database.run('DELETE FROM clients WHERE id = ?', [otherClient.id]);
        }
    });

    test('GOCAR-SEC-10: IDOR protection blocks customer from accessing vehicle history of vehicles they do not own', async () => {
        let statusCode = 200;
        let errorMsg = '';
        const req = {
            params: { id: testVehicleId },
            user: { id: 999999, userType: 'customer' } // Different customer
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (data) => { errorMsg = data.error; }
        };

        await vehicleController.getServiceHistory(req, res);
        assert.equal(statusCode, 403, 'Should return 403 for unauthorized vehicle history access');
        assert.match(errorMsg, /Access denied/i);
    });

    test('GOCAR-PERF-01: Performance indexes eliminate full table scans on customer_documents and service_reminders', async () => {
        const planDocs = await database.query('EXPLAIN QUERY PLAN SELECT * FROM customer_documents WHERE client_id = ?', [testClientId]);
        const planDocsStr = JSON.stringify(planDocs);
        assert.match(planDocsStr, /idx_customer_documents_client/i, 'customer_documents query must use index idx_customer_documents_client');
        assert.doesNotMatch(planDocsStr, /SCAN customer_documents\b/i, 'Must not perform full table scan on customer_documents');

        const planReminders = await database.query('EXPLAIN QUERY PLAN SELECT * FROM service_reminders WHERE client_id = ? AND status = "Pending"', [testClientId]);
        const planRemindersStr = JSON.stringify(planReminders);
        assert.match(planRemindersStr, /idx_service_reminders_client/i, 'service_reminders query must use index idx_service_reminders_client');
    });
});
