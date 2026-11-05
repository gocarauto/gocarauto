import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';

describe('Database Schema & Trigger Integrity', () => {
    before(async () => {
        await database.connect();
    });

    test('All required tables exist in database', async () => {
        const requiredTables = [
            'users',
            'clients',
            'vehicles',
            'service_items',
            'service_requests',
            'service_records',
            'financial_transactions',
            'notification_logs',
            'vehicle_maintenance_ledger',
            'service_reminders',
            'external_services',
            'customer_documents',
            'service_request_comments'
        ];

        for (const tableName of requiredTables) {
            const result = await database.get(
                "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
                [tableName]
            );
            assert.ok(result, `Table ${tableName} must exist in the database`);
        }
    });

    test('Service record triggers update and maintain vehicle total_spent on insert, update, and delete', async () => {
        // 1. Create a dummy client
        const clientRes = await database.run(
            "INSERT INTO clients (full_name, phone) VALUES ('Test Trigger Client', '01099999999')"
        );
        const clientId = clientRes.id;

        // 2. Create a dummy vehicle
        const vehicleRes = await database.run(
            "INSERT INTO vehicles (client_id, client_name, make, model, year) VALUES (?, 'Test Trigger Client', 'Toyota', 'Yaris', 2020)",
            [clientId]
        );
        const vehicleId = vehicleRes.id;

        // 3. Create a dummy service item
        const itemRes = await database.run(
            "INSERT INTO service_items (item_name, item_name_ar, category, sale_price) VALUES ('Test Oil', 'زيت تجريبي', 'Oil', 500)"
        );
        const itemId = itemRes.id;

        // 4. Create a dummy service request
        const reqRes = await database.run(
            "INSERT INTO service_requests (client_id, vehicle_id, client_name, vehicle_info, status) VALUES (?, ?, 'Test Trigger Client', 'Toyota Yaris 2020', 'Open')",
            [clientId, vehicleId]
        );
        const requestId = reqRes.id;

        // 5. Insert service record
        const recRes = await database.run(
            "INSERT INTO service_records (request_id, item_id, quantity, unit_price, total_price) VALUES (?, ?, 2, 500, 1000)",
            [requestId, itemId]
        );
        const recordId = recRes.id;

        // Check vehicle total_spent after INSERT
        let vehicle = await database.get('SELECT total_spent, services_count FROM vehicles WHERE id = ?', [vehicleId]);
        assert.equal(Number(vehicle.total_spent), 1000, 'Vehicle total_spent should be 1000 after INSERT');
        assert.equal(vehicle.services_count, 1, 'Vehicle services_count should be 1');

        // Check client total_spent after INSERT
        let client = await database.get('SELECT total_spent FROM clients WHERE id = ?', [clientId]);
        assert.equal(Number(client.total_spent), 1000, 'Client total_spent should be 1000 after INSERT');

        // 6. UPDATE service record (price change)
        await database.run(
            "UPDATE service_records SET quantity = 3, total_price = 1500 WHERE id = ?",
            [recordId]
        );

        vehicle = await database.get('SELECT total_spent FROM vehicles WHERE id = ?', [vehicleId]);
        assert.equal(Number(vehicle.total_spent), 1500, 'Vehicle total_spent should update to 1500 after UPDATE trigger');

        client = await database.get('SELECT total_spent FROM clients WHERE id = ?', [clientId]);
        assert.equal(Number(client.total_spent), 1500, 'Client total_spent should update to 1500 after UPDATE trigger');

        // 7. DELETE service record
        await database.run('DELETE FROM service_records WHERE id = ?', [recordId]);

        vehicle = await database.get('SELECT total_spent, services_count FROM vehicles WHERE id = ?', [vehicleId]);
        assert.equal(Number(vehicle.total_spent), 0, 'Vehicle total_spent should reduce to 0 after DELETE trigger');
        assert.equal(vehicle.services_count, 0, 'Vehicle services_count should reduce to 0');

        client = await database.get('SELECT total_spent FROM clients WHERE id = ?', [clientId]);
        assert.equal(Number(client.total_spent), 0, 'Client total_spent should reduce to 0 after DELETE trigger');

        // Cleanup test data
        await database.run('DELETE FROM service_requests WHERE id = ?', [requestId]);
        await database.run('DELETE FROM service_items WHERE id = ?', [itemId]);
        await database.run('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
        await database.run('DELETE FROM clients WHERE id = ?', [clientId]);
    });

    test('serviceRequestController.createRequest creates request for staff and customer', async () => {
        const { default: requestController } = await import('../controllers/serviceRequestController.js');

        // Create client & vehicle
        const clientRes = await database.run(
            "INSERT INTO clients (full_name, phone) VALUES ('API Test Client', '01011112222')"
        );
        const clientId = clientRes.id;
        const vehicleRes = await database.run(
            "INSERT INTO vehicles (client_id, client_name, make, model, year) VALUES (?, 'API Test Client', 'Honda', 'Civic', 2021)",
            [clientId]
        );
        const vehicleId = vehicleRes.id;

        // Staff request
        let status1 = 200, res1 = null;
        await requestController.createRequest(
            { body: { clientId, vehicleId, serviceType: 'Maintenance', notes: 'Staff job' }, user: { id: 1, role: 'Admin', userType: 'staff' } },
            { status: (c) => { status1 = c; return { json: (d) => { res1 = d; } }; }, json: (d) => { res1 = d; } }
        );
        assert.equal(status1, 201);
        assert.ok(res1?.data?.id);

        // Customer request (owns vehicle)
        let status2 = 200, res2 = null;
        await requestController.createRequest(
            { body: { vehicleId, serviceType: 'Oil Change', notes: 'Customer request' }, user: { id: clientId, userType: 'customer' } },
            { status: (c) => { status2 = c; return { json: (d) => { res2 = d; } }; }, json: (d) => { res2 = d; } }
        );
        assert.equal(status2, 201);
        assert.ok(res2?.data?.id);

        // Cleanup
        await database.run('DELETE FROM service_requests WHERE id IN (?, ?)', [res1.data.id, res2.data.id]);
        await database.run('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
        await database.run('DELETE FROM clients WHERE id = ?', [clientId]);
    });

    after(async () => {
        await database.close();
    });
});
