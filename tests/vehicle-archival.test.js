import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';
import vehicleController from '../controllers/vehicleController.js';
import customerPortalController from '../controllers/customerPortalController.js';
import reminderController from '../controllers/reminderController.js';

describe('Slice 10.6: Vehicle Archival, Decommissioning Reasons & Reminder Disconnection', () => {
    let testClientId;
    let testVehicleId;
    let testReminderId;

    before(async () => {
        await database.connect();

        // 1. Create a test client
        const clientRes = await database.run(
            `INSERT INTO clients (full_name, phone, email) VALUES (?, ?, ?)`,
            ['Archival Test Client', '+201099998888', 'archive.test@gocar.eg']
        );
        testClientId = clientRes.id;

        // 2. Create a test vehicle
        const vehRes = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, next_service_due)
             VALUES (?, ?, ?, ?, ?, ?, DATE('now', '+3 days'))`,
            [testClientId, 'Archival Test Client', 'TestMake', 'TestModel', 2022, 'ARCH-999']
        );
        testVehicleId = vehRes.id;

        // 3. Create a pending reminder for this vehicle
        const remRes = await database.run(
            `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, status)
             VALUES (?, ?, ?, DATE('now', '+3 days'), 'Pending')`,
            [testClientId, testVehicleId, 'تغيير زيت الموتور']
        );
        testReminderId = remRes.id;
    });

    after(async () => {
        // Cleanup test data
        if (testReminderId) await database.run('DELETE FROM service_reminders WHERE id = ?', [testReminderId]);
        if (testVehicleId) await database.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
        if (testClientId) await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
    });

    test('archiveVehicle rejects request without a valid reason', async () => {
        const req = {
            params: { id: testVehicleId },
            body: { reason: '   ' },
            user: { id: 1, role: 'Admin' }
        };
        let statusSent = null;
        let jsonSent = null;
        const res = {
            status: (code) => { statusSent = code; return res; },
            json: (data) => { jsonSent = data; }
        };

        await vehicleController.archiveVehicle(req, res);
        assert.equal(statusSent, 400);
        assert.ok(jsonSent.error.includes('reason is required'));
    });

    test('archiveVehicle decommissions vehicle, sets reason and cancels all pending reminders', async () => {
        const req = {
            params: { id: testVehicleId },
            body: { reason: 'Sold / Ownership Transferred', notes: 'Sold to private owner on Nov 2026' },
            user: { id: 1, role: 'Admin' }
        };
        let jsonSent = null;
        const res = {
            status: () => res,
            json: (data) => { jsonSent = data; }
        };

        await vehicleController.archiveVehicle(req, res);
        assert.ok(jsonSent.success);

        // Verify vehicle in DB
        const vehicle = await database.get('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
        assert.equal(vehicle.is_archived, 1);
        assert.equal(vehicle.archive_reason, 'Sold / Ownership Transferred');
        assert.equal(vehicle.archive_notes, 'Sold to private owner on Nov 2026');
        assert.ok(vehicle.archived_at);

        // Verify reminder was cancelled/dismissed
        const reminder = await database.get('SELECT * FROM service_reminders WHERE id = ?', [testReminderId]);
        assert.equal(reminder.status, 'Dismissed');
        assert.ok(reminder.notes.includes('Vehicle Decommissioned: Sold / Ownership Transferred'));
    });

    test('getAllVehicles excludes archived vehicles by default and includes them when requested', async () => {
        // Query active vehicles
        let activeVehicles = [];
        const reqActive = { query: { search: 'ARCH-999' } };
        const resActive = { json: (data) => { activeVehicles = data.data; } };
        await vehicleController.getAllVehicles(reqActive, resActive);
        assert.equal(activeVehicles.length, 0, 'Archived vehicle must not appear in active fleet list');

        // Query archived vehicles
        let archivedVehicles = [];
        const reqArchived = { query: { search: 'ARCH-999', archived: 'true' } };
        const resArchived = { json: (data) => { archivedVehicles = data.data; } };
        await vehicleController.getAllVehicles(reqArchived, resArchived);
        assert.equal(archivedVehicles.length, 1, 'Archived vehicle must appear in archived fleet list');
        assert.equal(archivedVehicles[0].id, testVehicleId);
    });

    test('getUpcomingService excludes archived vehicles from service reminders queue', async () => {
        let upcoming = [];
        const req = { query: { days: 10 } };
        const res = { json: (data) => { upcoming = data.data; } };
        await vehicleController.getUpcomingService(req, res);

        const found = upcoming.find(v => v.id === testVehicleId);
        assert.equal(found, undefined, 'Decommissioned vehicle must not be processed for service reminders');
    });

    test('customerPortalController.getVehicles excludes archived vehicles from garage', async () => {
        let portalVehicles = [];
        const req = { user: { id: testClientId } };
        const res = { json: (data) => { portalVehicles = data.data; } };
        await customerPortalController.getVehicles(req, res);

        const found = portalVehicles.find(v => v.id === testVehicleId);
        assert.equal(found, undefined, 'Archived vehicle must not appear in customer active garage');
    });

    test('restoreVehicle restores asset back to active fleet', async () => {
        const req = { params: { id: testVehicleId }, user: { id: 1 } };
        let jsonSent = null;
        const res = {
            status: () => res,
            json: (data) => { jsonSent = data; }
        };

        await vehicleController.restoreVehicle(req, res);
        assert.ok(jsonSent.success);

        // Verify DB state
        const vehicle = await database.get('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
        assert.equal(vehicle.is_archived, 0);
        assert.equal(vehicle.archive_reason, null);
        assert.equal(vehicle.archived_at, null);

        // Verify it appears again in active list
        let activeVehicles = [];
        const reqActive = { query: { search: 'ARCH-999' } };
        const resActive = { json: (data) => { activeVehicles = data.data; } };
        await vehicleController.getAllVehicles(reqActive, resActive);
        assert.equal(activeVehicles.length, 1);
    });
});
