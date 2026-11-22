import test from 'node:test';
import assert from 'node:assert/strict';
import {
    parseDateSafe,
    calculateMonthsDiff,
    classifyFluidType,
    extractIntervalKm,
    extractIntervalMonths,
    calculateVehicleTelemetry
} from '../utils/vehicleTelemetry.js';

test('Telemetry Engine: parseDateSafe handles various formats', () => {
    // Standard ISO string
    const d1 = parseDateSafe('2026-08-05');
    assert.equal(d1.getFullYear(), 2026);
    assert.equal(d1.getMonth(), 7); // August is 7

    // Date object
    const now = new Date(2026, 10, 22);
    const d2 = parseDateSafe(now);
    assert.equal(d2.getTime(), now.getTime());

    // Excel serial number (45489 -> July 2024)
    const d3 = parseDateSafe(45489);
    assert.ok(d3 !== null);
    assert.equal(d3.getFullYear(), 2024);
    assert.equal(d3.getMonth(), 6); // July is 6

    // Null/undefined/invalid
    assert.equal(parseDateSafe(null), null);
    assert.equal(parseDateSafe('not-a-date'), null);
});

test('Telemetry Engine: calculateMonthsDiff accurate across intervals', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-07-01');
    const diff = calculateMonthsDiff(start, end);
    assert.ok(diff >= 5.9 && diff <= 6.1, `Expected ~6 months, got ${diff}`);
});

test('Telemetry Engine: classifyFluidType differentiates Engine vs Transmission oil', () => {
    assert.equal(classifyFluidType({ tracking_point: 'ENGINE_OIL' }), 'ENGINE_OIL');
    assert.equal(classifyFluidType({ tracking_point: 'TRANS_OIL' }), 'TRANS_OIL');
    assert.equal(classifyFluidType({ item_name: 'زيت موتور 10000' }), 'ENGINE_OIL');
    assert.equal(classifyFluidType({ item_name: 'تغيير زيت الفتيس' }), 'TRANS_OIL');
    assert.equal(classifyFluidType({ item_name: 'Transmission Fluid Synthetic' }), 'TRANS_OIL');
    assert.equal(classifyFluidType({ service_type: 'تغيير زيت الموتور' }), 'ENGINE_OIL');
    assert.equal(classifyFluidType({ item_name: 'سير كاتينة' }), null);
});

test('Telemetry Engine: extractIntervalKm extracts custom and default intervals', () => {
    assert.equal(extractIntervalKm({ km_interval: 5000 }, 'ENGINE_OIL'), 5000);
    assert.equal(extractIntervalKm({ item_name: 'زيت موتور 5000' }, 'ENGINE_OIL'), 5000);
    assert.equal(extractIntervalKm({ item_name: 'زيت موتور' }, 'ENGINE_OIL'), 10000);
    assert.equal(extractIntervalKm({ item_name: 'زيت فتيس 50000 كم' }, 'TRANS_OIL'), 50000);
    assert.equal(extractIntervalKm({}, 'TRANS_OIL'), 40000);
});

test('Telemetry Engine: Fresh Engine Oil Service yields 100% life', () => {
    const fixedNow = new Date('2026-11-22T00:00:00Z');
    const vehicle = { id: 1, current_mileage: 50000 };
    const serviceRecords = [{
        service_date: '2026-11-20',
        mileage: 50000,
        tracking_point: 'ENGINE_OIL',
        km_interval: 10000,
        month_interval: 8
    }];

    const telemetry = calculateVehicleTelemetry(vehicle, serviceRecords, [], fixedNow);
    assert.equal(telemetry.engine_oil.has_history, true);
    assert.equal(telemetry.engine_oil.life_percent, 100);
    assert.equal(telemetry.engine_oil.km_remaining, 10000);
    assert.equal(telemetry.engine_oil.status, 'good');
});

test('Telemetry Engine: Distance degradation accurately lowers life percentage', () => {
    const fixedNow = new Date('2026-11-22T00:00:00Z');
    // Service done at 50,000 km with 10,000 km interval. Vehicle now at 55,000 km (5,000 km driven).
    // Service done 1 month ago (so time is not the limiting factor, distance is).
    const vehicle = { id: 1, current_mileage: 55000 };
    const serviceRecords = [{
        service_date: '2026-10-22',
        mileage: 50000,
        tracking_point: 'ENGINE_OIL',
        km_interval: 10000,
        month_interval: 8
    }];

    const telemetry = calculateVehicleTelemetry(vehicle, serviceRecords, [], fixedNow);
    assert.equal(telemetry.engine_oil.has_history, true);
    assert.equal(telemetry.engine_oil.km_driven, 5000);
    assert.equal(telemetry.engine_oil.km_remaining, 5000);
    assert.equal(telemetry.engine_oil.life_percent, 50);
    assert.equal(telemetry.engine_oil.status, 'good');
});

test('Telemetry Engine: Warning status triggered when life <= 30%', () => {
    const fixedNow = new Date('2026-11-22T00:00:00Z');
    // 7,500 km driven on a 10,000 km oil -> 25% remaining
    const vehicle = { id: 1, current_mileage: 57500 };
    const serviceRecords = [{
        service_date: '2026-10-01',
        mileage: 50000,
        tracking_point: 'ENGINE_OIL',
        km_interval: 10000,
        month_interval: 8
    }];

    const telemetry = calculateVehicleTelemetry(vehicle, serviceRecords, [], fixedNow);
    assert.equal(telemetry.engine_oil.life_percent, 25);
    assert.equal(telemetry.engine_oil.km_remaining, 2500);
    assert.equal(telemetry.engine_oil.status, 'warning');
});

test('Telemetry Engine: Critical status triggered when overdue', () => {
    const fixedNow = new Date('2026-11-22T00:00:00Z');
    // 10,500 km driven on 10,000 km oil -> 0% remaining
    const vehicle = { id: 1, current_mileage: 60500 };
    const serviceRecords = [{
        service_date: '2026-05-01',
        mileage: 50000,
        tracking_point: 'ENGINE_OIL',
        km_interval: 10000,
        month_interval: 8
    }];

    const telemetry = calculateVehicleTelemetry(vehicle, serviceRecords, [], fixedNow);
    assert.equal(telemetry.engine_oil.life_percent, 0);
    assert.equal(telemetry.engine_oil.km_remaining, 0);
    assert.equal(telemetry.engine_oil.status, 'critical');
});

test('Telemetry Engine: Transmission Oil calculates over extended intervals', () => {
    const fixedNow = new Date('2026-11-22T00:00:00Z');
    // Transmission fluid serviced 12 months ago at 100,000 km.
    // Interval is 40,000 km / 24 months. Vehicle is at 110,000 km (10,000 km driven).
    // Mileage remaining: (30000 / 40000) = 75%. Time remaining: (12 / 24) = 50%.
    // Fluid life is Min(75%, 50%) = 50%.
    const vehicle = { id: 1, current_mileage: 110000 };
    const serviceRecords = [{
        service_date: '2025-11-22',
        mileage: 100000,
        tracking_point: 'TRANS_OIL',
        km_interval: 40000,
        month_interval: 24
    }];

    const telemetry = calculateVehicleTelemetry(vehicle, serviceRecords, [], fixedNow);
    assert.equal(telemetry.transmission_oil.has_history, true);
    assert.equal(telemetry.transmission_oil.life_percent, 50);
    assert.equal(telemetry.transmission_oil.status, 'good');
});

test('Telemetry Engine: Untracked vehicle returns clean untracked state', () => {
    const vehicle = { id: 99, current_mileage: 0, last_service_date: null };
    const telemetry = calculateVehicleTelemetry(vehicle, [], []);

    assert.equal(telemetry.engine_oil.has_history, false);
    assert.equal(telemetry.engine_oil.status, 'untracked');
    assert.equal(telemetry.engine_oil.life_percent, null);

    assert.equal(telemetry.transmission_oil.has_history, false);
    assert.equal(telemetry.transmission_oil.status, 'untracked');
    assert.equal(telemetry.transmission_oil.life_percent, null);
});

test('Customer Portal Controller: getVehicles and getDashboard enrich vehicles with telemetry', async () => {
    const database = (await import('../database/db.js')).default;
    const customerPortalController = (await import('../controllers/customerPortalController.js')).default;
    await database.connect();

    const uniqueId = Date.now();
    let testClientId = null;
    let testVehId = null;
    let sreqId = null;
    let srecId = null;

    try {
        // 1. Create a test customer & vehicle with an oil service record
        const clientRes = await database.run(
            'INSERT INTO clients (full_name, phone, email) VALUES (?, ?, ?)',
            [`Telemetry Client ${uniqueId}`, `+2010${uniqueId.toString().slice(-8)}`, `telemetry.${uniqueId}@gocar.eg`]
        );
        testClientId = clientRes.id;

        const vehRes = await database.run(
            'INSERT INTO vehicles (client_id, client_name, make, model, year, current_mileage, last_service_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [testClientId, `Telemetry Client ${uniqueId}`, 'Toyota', 'Corolla', 2021, 62000, '2026-10-01']
        );
        testVehId = vehRes.id;

        // Create a service request and itemized engine oil record
        const sreqRes = await database.run(
            'INSERT INTO service_requests (client_id, client_name, vehicle_id, vehicle_info, service_type, status, mileage) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [testClientId, `Telemetry Client ${uniqueId}`, testVehId, 'Toyota Corolla (2021)', 'تغيير زيت وفلاتر', 'Completed', 60000]
        );
        sreqId = sreqRes.id;

        const srecRes = await database.run(
            'INSERT INTO service_records (request_id, service_date, mileage, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [sreqId, '2026-10-01', 60000, 9, 1, 1500, 1500] // item_id 9 is 'زيت موتور' with tracking_point ENGINE_OIL
        );
        srecId = srecRes.id;

        // Call customerPortalController.getVehicles
        let jsonSent = null;
        const res = {
            json: (data) => { jsonSent = data; },
            status: () => res
        };

        await customerPortalController.getVehicles({ user: { id: testClientId } }, res);
        assert.ok(jsonSent.success);
        assert.ok(Array.isArray(jsonSent.data));
        const vehicle = jsonSent.data.find(v => v.id === testVehId);
        assert.ok(vehicle);
        assert.ok(vehicle.telemetry);
        assert.equal(vehicle.telemetry.engine_oil.has_history, true);
        assert.ok(vehicle.telemetry.engine_oil.life_percent >= 0 && vehicle.telemetry.engine_oil.life_percent <= 100);
        assert.equal(vehicle.telemetry.engine_oil.km_driven, 2000); // 62000 - 60000
        assert.equal(vehicle.telemetry.engine_oil.km_remaining, 8000); // 10000 - 2000
        assert.equal(vehicle.telemetry.transmission_oil.has_history, false);
        assert.equal(vehicle.telemetry.transmission_oil.status, 'untracked');
    } finally {
        if (srecId) await database.run('DELETE FROM service_records WHERE id = ?', [srecId]);
        if (sreqId) await database.run('DELETE FROM service_requests WHERE id = ?', [sreqId]);
        if (testVehId) await database.run('DELETE FROM vehicles WHERE id = ?', [testVehId]);
        if (testClientId) await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
    }
});
