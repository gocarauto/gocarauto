import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';

describe('Slice 10.2: Used Car Consignment & Sell Requests', () => {
    let testClientId;
    let testVehicleId;
    let otherClientId;
    let otherVehicleId;
    let testRequestId;

    before(async () => {
        await database.connect();

        // Create test client 1
        const c1 = await database.run(
            "INSERT INTO clients (full_name, phone, email) VALUES ('Consignment Seller 1', '01011112222', 'seller1@test.com')"
        );
        testClientId = c1.id;

        // Create test vehicle 1
        const v1 = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, current_mileage) 
             VALUES (?, 'Consignment Seller 1', 'Honda', 'Civic', 2018, 'CON-1111', 85000)`,
            [testClientId]
        );
        testVehicleId = v1.id;

        // Create test client 2
        const c2 = await database.run(
            "INSERT INTO clients (full_name, phone, email) VALUES ('Other Client 2', '01033334444', 'other2@test.com')"
        );
        otherClientId = c2.id;

        // Create test vehicle 2
        const v2 = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, current_mileage) 
             VALUES (?, 'Other Client 2', 'BMW', '320i', 2021, 'CON-2222', 45000)`,
            [otherClientId]
        );
        otherVehicleId = v2.id;
    });

    after(async () => {
        // Cleanup test data
        if (testClientId) {
            await database.run('DELETE FROM consignment_requests WHERE client_id IN (?, ?)', [testClientId, otherClientId]);
            await database.run('DELETE FROM vehicles WHERE client_id IN (?, ?)', [testClientId, otherClientId]);
            await database.run('DELETE FROM clients WHERE id IN (?, ?)', [testClientId, otherClientId]);
        }
    });

    test('Consignment requests table and indexes exist', async () => {
        const table = await database.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name = 'consignment_requests'"
        );
        assert.ok(table, 'consignment_requests table must exist');

        const indexes = await database.query(
            "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name = 'consignment_requests'"
        );
        const indexNames = indexes.map(i => i.name);
        assert.ok(indexNames.includes('idx_consignment_requests_client'), 'Client index must exist');
        assert.ok(indexNames.includes('idx_consignment_requests_vehicle'), 'Vehicle index must exist');
        assert.ok(indexNames.includes('idx_consignment_requests_status'), 'Status index must exist');
    });

    test('Customer can create a consignment request for their own vehicle', async () => {
        const askingPrice = 650000;
        const currentMileage = 86000;
        const notes = 'Minor scratches on rear bumper, fully serviced with GoCar';

        const result = await database.run(
            `INSERT INTO consignment_requests (client_id, vehicle_id, asking_price, current_mileage, notes, status)
             VALUES (?, ?, ?, ?, ?, 'New')`,
            [testClientId, testVehicleId, askingPrice, currentMileage, notes]
        );

        assert.ok(result.id, 'Must return insert ID');
        testRequestId = result.id;

        const request = await database.get(
            'SELECT * FROM consignment_requests WHERE id = ?',
            [testRequestId]
        );
        assert.equal(request.client_id, testClientId);
        assert.equal(request.vehicle_id, testVehicleId);
        assert.equal(request.asking_price, 650000);
        assert.equal(request.current_mileage, 86000);
        assert.equal(request.status, 'New');
    });

    test('Staff query retrieves consignment requests with joined client and vehicle info', async () => {
        const query = `
            SELECT cr.*, 
                   c.full_name as client_name, c.phone as client_phone,
                   v.make, v.model, v.year, v.license_plate
            FROM consignment_requests cr
            JOIN clients c ON cr.client_id = c.id
            JOIN vehicles v ON cr.vehicle_id = v.id
            WHERE cr.id = ?
        `;
        const item = await database.get(query, [testRequestId]);
        assert.ok(item, 'Must retrieve joined record');
        assert.equal(item.client_name, 'Consignment Seller 1');
        assert.equal(item.make, 'Honda');
        assert.equal(item.model, 'Civic');
        assert.equal(item.year, 2018);
        assert.equal(item.license_plate, 'CON-1111');
    });

    test('Staff can update status through the consignment workflow', async () => {
        const statuses = ['Contacted', 'Inspected', 'Listed', 'Sold'];

        for (const status of statuses) {
            await database.run(
                'UPDATE consignment_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, testRequestId]
            );

            const updated = await database.get(
                'SELECT status FROM consignment_requests WHERE id = ?',
                [testRequestId]
            );
            assert.equal(updated.status, status, `Status should be updated to ${status}`);
        }
    });

    test('Summary stats correctly count consignment requests by status', async () => {
        const stats = await database.query(
            `SELECT status, COUNT(*) as count 
             FROM consignment_requests 
             WHERE id = ? 
             GROUP BY status`,
            [testRequestId]
        );
        assert.ok(stats.length > 0);
        assert.equal(stats[0].status, 'Sold');
        assert.equal(stats[0].count, 1);
    });
});
