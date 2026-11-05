import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeServiceType } from '../utils/maintenance-helper.js';
import database from '../database/db.js';

test('Reminder Deduplication & Canonicalization Integrity', async (t) => {
    await t.test('canonicalizeServiceType accurately normalizes service variants', () => {
        assert.equal(canonicalizeServiceType('ENGINE_OIL'), 'تغيير زيت الموتور');
        assert.equal(canonicalizeServiceType('زيت موتور رزويل 10000'), 'تغيير زيت الموتور');
        assert.equal(canonicalizeServiceType('زيت كاسترول ٧٠٠٠ كم'), 'تغيير زيت الموتور');
        assert.equal(canonicalizeServiceType('TRANS_OIL'), 'تغيير زيت الفتيس');
        assert.equal(canonicalizeServiceType('زيت فتيس ميتسوبيشي'), 'تغيير زيت الفتيس');
        assert.equal(canonicalizeServiceType('تغيير قواعد الموتور والمساعدين'), 'تغيير قواعد الموتور والمساعدين');
        assert.equal(canonicalizeServiceType('تغيير سير المجموعة'), 'تغيير سير المجموعة');
        assert.equal(canonicalizeServiceType('Maintenance'), 'صيانة دورية');
        assert.equal(canonicalizeServiceType(null), 'صيانة دورية');
    });

    await t.test('Unique index rejects duplicate pending reminder for same vehicle and service type', async () => {
        await database.connect();

        // Query an existing client and vehicle
        const vehicle = await database.get('SELECT id, client_id FROM vehicles LIMIT 1');
        assert.ok(vehicle, 'At least one vehicle should exist');

        const testServiceType = 'اختبار فريد مانع تكرار';

        // Insert first pending reminder
        const insert1 = await database.run(
            `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, status)
             VALUES (?, ?, ?, '2027-01-01', 'Pending')`,
            [vehicle.client_id, vehicle.id, testServiceType]
        );
        assert.ok(insert1.id, 'First reminder inserted');

        // Attempting to insert duplicate pending reminder must throw UNIQUE constraint error
        await assert.rejects(
            async () => {
                await database.run(
                    `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, status)
                     VALUES (?, ?, ?, '2027-01-01', 'Pending')`,
                    [vehicle.client_id, vehicle.id, testServiceType]
                );
            },
            (err) => {
                assert.match(err.message, /UNIQUE constraint failed/i);
                return true;
            }
        );

        // Cleanup test reminder
        await database.run(`DELETE FROM service_reminders WHERE id = ?`, [insert1.id]);
    });
});
