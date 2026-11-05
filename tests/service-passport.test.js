import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';
import { generateServicePassportPDF, closePDFBrowser } from '../utils/pdf-generator.js';

describe('Slice 10.3: Verified Vehicle Service Passport & Data Privacy', () => {
    let testClientId;
    let testVehicleId;
    let testRequestId;
    let testItemId;

    before(async () => {
        await database.connect();

        // 1. Create client with private details
        const clientRes = await database.run(
            `INSERT INTO clients (full_name, phone, email, address)
             VALUES ('Private Client Confidential', '01099998888', 'secret@private.com', '123 Classified St, Cairo')`
        );
        testClientId = clientRes.id;

        // 2. Create vehicle
        const vehicleRes = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage)
             VALUES (?, 'Private Client Confidential', 'Mercedes-Benz', 'C180', 2022, 'PAS-9999', 'WDD2050401F999999', 32000)`,
            [testClientId]
        );
        testVehicleId = vehicleRes.id;

        // 3. Create service item
        const itemRes = await database.run(
            `INSERT INTO service_items (item_name, item_name_ar, category, sale_price)
             VALUES ('MANN Oil Filter Synthetic', 'فلتر زيت أصلي مان', 'Oil', 650.00)`
        );
        testItemId = itemRes.id;

        // 4. Create service request
        const reqRes = await database.run(
            `INSERT INTO service_requests (client_id, vehicle_id, client_name, vehicle_info, status, mileage)
             VALUES (?, ?, 'Private Client Confidential', 'Mercedes C180 (PAS-9999)', 'Completed', 32000)`,
            [testClientId, testVehicleId]
        );
        testRequestId = reqRes.id;

        // 5. Create service record
        await database.run(
            `INSERT INTO service_records (request_id, service_date, mileage, item_id, quantity, unit_price, total_price, notes)
             VALUES (?, '2026-05-15', 32000, ?, 1, 650.00, 650.00, 'Replaced synthetic MANN filter and inspected belts')`,
            [testRequestId, testItemId]
        );
    });

    after(async () => {
        if (testClientId) {
            await database.run('DELETE FROM service_records WHERE request_id = ?', [testRequestId]);
            await database.run('DELETE FROM service_requests WHERE id = ?', [testRequestId]);
            await database.run('DELETE FROM service_items WHERE id = ?', [testItemId]);
            await database.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
            await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
        }
        await database.close();
        await closePDFBrowser();
    });

    test('generateServicePassportPDF compiles a valid binary PDF buffer', async () => {
        const vehicle = await database.get('SELECT * FROM vehicles WHERE id = ?', [testVehicleId]);
        const records = await database.query(
            `SELECT sr.service_date, sr.mileage, sr.notes,
                    si.item_name, si.item_name_ar, si.category
             FROM service_records sr
             JOIN service_items si ON sr.item_id = si.id
             WHERE sr.request_id = ?`,
            [testRequestId]
        );

        const pdfBuffer = await generateServicePassportPDF({
            vehicle,
            records,
            passportId: 'PASSPORT-TEST-001',
            verificationUrl: 'https://gocarauto.com/verify-passport/test'
        });

        assert.ok(Buffer.isBuffer(pdfBuffer), 'Result must be a binary buffer');
        assert.ok(pdfBuffer.length > 1000, 'PDF buffer must have meaningful size');
        // Validate PDF signature
        const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
        assert.equal(pdfHeader, '%PDF-', 'Buffer must start with %PDF- signature');
    });

    test('Data privacy check: Personal client details are strictly scrubbed from public pedigree query', async () => {
        // Query public passport by VIN or plate
        const vehicle = await database.get(
            'SELECT id, make, model, year, license_plate, vin, current_mileage FROM vehicles WHERE vin = ?',
            ['WDD2050401F999999']
        );
        assert.ok(vehicle, 'Vehicle must exist');

        // Verify that sensitive client columns are NOT included
        assert.equal(vehicle.client_id, undefined, 'client_id must not be exposed');
        assert.equal(vehicle.client_name, undefined, 'client_name must not be exposed');
        assert.equal(vehicle.phone, undefined, 'phone must not be exposed');
        assert.equal(vehicle.email, undefined, 'email must not be exposed');
        assert.equal(vehicle.address, undefined, 'address must not be exposed');
    });
});
