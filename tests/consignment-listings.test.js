import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import database from '../database/db.js';
import consignmentController from '../controllers/consignmentController.js';
import reportController from '../controllers/reportController.js';

describe('Slice 10.5: Used Car Consignment & Marketplace Listing Hub', () => {
    let testClientId;
    let testVehicleId;
    let testRequestId;
    let testListingId;

    before(async () => {
        await database.connect();

        // Create test client and vehicle
        const clientRes = await database.run(
            `INSERT INTO clients (full_name, phone, email, address)
             VALUES ('Consignment Seller VIP', '01099887766', 'seller@gocar.eg', 'New Cairo, Egypt')`
        );
        testClientId = clientRes.id;

        const vehicleRes = await database.run(
            `INSERT INTO vehicles (client_id, client_name, make, model, year, license_plate, vin, current_mileage)
             VALUES (?, 'Consignment Seller VIP', 'Porsche', 'Cayenne GTS', 2022, 'ق ص ر 7777', 'WP1AA2AY5ND123456', 32000)`,
            [testClientId]
        );
        testVehicleId = vehicleRes.id;

        // Inbound request from VIP portal
        const reqRes = await database.run(
            `INSERT INTO consignment_requests (client_id, vehicle_id, asking_price, current_mileage, notes, status)
             VALUES (?, ?, 3800000.00, 32000, 'Mint condition, serviced exclusively at GoCar', 'New')`,
            [testClientId, testVehicleId]
        );
        testRequestId = reqRes.id;
    });

    after(async () => {
        // Clean up test records
        if (testListingId) {
            await database.run('DELETE FROM consignment_listings WHERE id = ?', [testListingId]);
        }
        if (testRequestId) {
            await database.run('DELETE FROM consignment_requests WHERE id = ?', [testRequestId]);
        }
        if (testVehicleId) {
            await database.run('DELETE FROM vehicles WHERE id = ?', [testVehicleId]);
        }
        if (testClientId) {
            await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
        }
    });

    it('creates a consignment listing and auto-calculates 2.5% commission cut', async () => {
        const req = {
            body: {
                requestId: testRequestId,
                vehicleId: testVehicleId,
                clientId: testClientId,
                askingPrice: 3800000,
                commissionType: 'Percentage',
                commissionRate: 2.50,
                listingStatus: 'Intake',
                notes: 'Inspected by GoCar team; passport generated'
            }
        };

        let responseData;
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: (data) => {
                responseData = data;
            }
        };

        await consignmentController.createListing(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(responseData.success, true);
        assert.ok(responseData.data.id);
        testListingId = responseData.data.id;

        // Verify estimated commission calculation: 2.5% of 3,800,000 = 95,000 EGP
        assert.equal(responseData.data.estimated_commission, 95000);

        // Verify parent request was moved to 'Listed'
        const parentReq = await database.get('SELECT status FROM consignment_requests WHERE id = ?', [testRequestId]);
        assert.equal(parentReq.status, 'Listed');
    });

    it('updates listing status through pipeline and attaches Facebook Marketplace URL', async () => {
        const req = {
            params: { id: testListingId },
            body: {
                listingStatus: 'Listed',
                fbMarketplaceUrl: 'https://www.facebook.com/marketplace/item/998877665544332/',
                notes: 'High-res photos taken. Ad active on Marketplace and Instagram.'
            }
        };

        let responseData;
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: (data) => { responseData = data; }
        };

        await consignmentController.updateListing(req, res);
        assert.equal(responseData.success, true);
        assert.equal(responseData.data.listing_status, 'Listed');

        // Verify stored in DB
        const saved = await database.get('SELECT * FROM consignment_listings WHERE id = ?', [testListingId]);
        assert.equal(saved.listing_status, 'Listed');
        assert.equal(saved.fb_marketplace_url, 'https://www.facebook.com/marketplace/item/998877665544332/');
    });

    it('settles a sold consignment deal and earns GoCar commission cut', async () => {
        // Sold for 3,750,000 EGP with 2.5% commission cut = 93,750 EGP
        const req = {
            params: { id: testListingId },
            body: {
                soldPrice: 3750000,
                commissionRate: 2.50,
                notes: 'Buyer verified via Service Passport. Deal closed successfully.'
            }
        };

        let responseData;
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: (data) => { responseData = data; }
        };

        await consignmentController.settleListing(req, res);
        assert.equal(responseData.success, true);
        assert.equal(responseData.data.status, 'Sold');
        assert.equal(responseData.data.commission_earned, 93750);

        // Verify DB record
        const settledRecord = await database.get('SELECT * FROM consignment_listings WHERE id = ?', [testListingId]);
        assert.equal(settledRecord.listing_status, 'Sold');
        assert.equal(settledRecord.sold_price, 3750000);
        assert.equal(settledRecord.commission_amount, 93750);

        // Verify parent request also marked 'Sold'
        const parentReq = await database.get('SELECT status FROM consignment_requests WHERE id = ?', [testRequestId]);
        assert.equal(parentReq.status, 'Sold');
    });

    it('aggregates pipeline summary with total sold count and realized commissions', async () => {
        let pipelineData;
        const res = {
            json: (data) => { pipelineData = data; }
        };

        await consignmentController.getPipelineSummary({}, res);
        assert.equal(pipelineData.success, true);
        assert.ok(pipelineData.data.sold >= 1);
        assert.ok(pipelineData.data.totalEarnedCommission >= 93750);
    });

    it('incorporates consignment commission cut into Operational Economics in revenue reports', async () => {
        let reportData;
        const res = {
            json: (data) => { reportData = data; }
        };

        await reportController.getRevenueReport({ query: {} }, res);
        assert.equal(reportData.success, true);
        const { economics } = reportData.data;
        assert.ok(economics.totalConsignmentCommissions >= 93750);
        assert.ok(economics.soldCarsCount >= 1);
        assert.ok(economics.gocarNetMargin >= economics.totalConsignmentCommissions);
    });
});
