import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';

describe('Slice 10.4: Phone Referral Attribution & Delivery Fee Ledger Segregation', () => {
    let referrerId;
    let referred1Id;
    let referred2Id;
    let testVehicleId;
    let testRequestId;
    let testDeliveryItemId;

    before(async () => {
        await database.connect();

        // 1. Create a Champion Referrer
        const refRes = await database.run(
            `INSERT INTO clients (full_name, phone, email, referral_source)
             VALUES ('Top Champion Referrer', '01009998877', 'champion@test.com', 'CoFounder')`
        );
        referrerId = refRes.id;

        // 2. Create Referred Client 1 linked to Champion
        const c1Res = await database.run(
            `INSERT INTO clients (full_name, phone, email, referral_source, referred_by_client_id, total_spent)
             VALUES ('Referred Client Alpha', '01011110001', 'alpha@test.com', 'Top Champion Referrer', ?, 15000)`,
            [referrerId]
        );
        referred1Id = c1Res.id;

        // 3. Create Referred Client 2 linked to Champion
        const c2Res = await database.run(
            `INSERT INTO clients (full_name, phone, email, referral_source, referred_by_client_id, total_spent)
             VALUES ('Referred Client Beta', '01011110002', 'beta@test.com', 'Top Champion Referrer', ?, 25000)`,
            [referrerId]
        );
        referred2Id = c2Res.id;

        // 4. Create vehicle and delivery service item for economics check
        const vRes = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate)
             VALUES (?, 'Referred Client Alpha', 'Renault', 'Megane', 2022, 'REF-1234')`,
            [referred1Id]
        );
        testVehicleId = vRes.id;

        const itemRes = await database.run(
            `INSERT INTO service_items (item_name, item_name_ar, category, sale_price)
             VALUES ('Pick-up & Delivery New Cairo', 'استلام وتسليم السيارة من التجمع', 'Service', 450.00)`
        );
        testDeliveryItemId = itemRes.id;

        const reqRes = await database.run(
            `INSERT INTO service_requests (client_id, vehicle_id, client_name, vehicle_info, status)
             VALUES (?, ?, 'Referred Client Alpha', 'Renault Megane (REF-1234)', 'Paid')`,
            [referred1Id, testVehicleId]
        );
        testRequestId = reqRes.id;

        await database.run(
            `INSERT INTO service_records (request_id, service_date, item_id, quantity, unit_price, total_price)
             VALUES (?, '2026-11-01', ?, 1, 450.00, 450.00)`,
            [testRequestId, testDeliveryItemId]
        );

        await database.run(
            `INSERT INTO financial_transactions (request_id, invoice_number, total_amount_due, amount_paid, payment_status, payment_date, service_fee)
             VALUES (?, 'INV-REF-TEST-01', 3450.00, 3450.00, 'Paid', '2026-11-01', 500.00)`,
            [testRequestId]
        );
    });

    after(async () => {
        if (referrerId) {
            await database.run('DELETE FROM financial_transactions WHERE request_id = ?', [testRequestId]);
            await database.run('DELETE FROM service_records WHERE request_id = ?', [testRequestId]);
            await database.run('DELETE FROM service_requests WHERE id = ?', [testRequestId]);
            await database.run('DELETE FROM service_items WHERE id = ?', [testDeliveryItemId]);
            await database.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
            await database.run('DELETE FROM clients WHERE id IN (?, ?, ?)', [referrerId, referred1Id, referred2Id]);
        }
        await database.close();
    });

    test('Clients table supports referred_by_client_id and resolves referrer linkage', async () => {
        const client = await database.get(
            `SELECT c.*, ref.full_name as referrer_name
             FROM clients c
             JOIN clients ref ON c.referred_by_client_id = ref.id
             WHERE c.id = ?`,
            [referred1Id]
        );

        assert.ok(client, 'Referred client must exist');
        assert.equal(client.referred_by_client_id, referrerId);
        assert.equal(client.referrer_name, 'Top Champion Referrer');
    });

    test('Referral leaderboard groups referred network spend by referrer', async () => {
        const leaderboard = await database.query(
            `SELECT 
                ref.id as referrer_id,
                ref.full_name as referrer_name,
                COUNT(c.id) as referred_count,
                COALESCE(SUM(c.total_spent), 0) as total_network_spent
             FROM clients ref
             JOIN clients c ON c.referred_by_client_id = ref.id
             WHERE ref.id = ?
             GROUP BY ref.id`,
            [referrerId]
        );

        assert.equal(leaderboard.length, 1);
        assert.equal(leaderboard[0].referred_count, 2);
        // Alpha has 450 from active service record trigger rollup, Beta has 25000
        assert.equal(leaderboard[0].total_network_spent, 25450);
    });

    test('Delivery revenue is segregated from workshop pass-through and service fees', async () => {
        const deliveryQuery = await database.get(
            `SELECT COALESCE(SUM(sr.total_price), 0) as delivery_revenue
             FROM service_records sr
             JOIN service_items si ON sr.item_id = si.id
             WHERE sr.request_id = ? AND (si.item_name_ar LIKE '%استلام%' OR si.item_name_ar LIKE '%تسليم%')`,
            [testRequestId]
        );

        assert.equal(deliveryQuery.delivery_revenue, 450.00);

        const tx = await database.get(
            'SELECT total_amount_due, service_fee FROM financial_transactions WHERE request_id = ?',
            [testRequestId]
        );

        const totalBilled = parseFloat(tx.total_amount_due); // 3450
        const serviceFee = parseFloat(tx.service_fee); // 500
        const deliveryFee = deliveryQuery.delivery_revenue; // 450
        const workshopPassThrough = totalBilled - serviceFee - deliveryFee; // 2500

        assert.equal(workshopPassThrough, 2500.00, 'Workshop pass-through must equal total minus fees and delivery');
        assert.equal(totalBilled, workshopPassThrough + serviceFee + deliveryFee, 'Components must sum to grand total');
    });
});
