import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import database from '../database/db.js';
import clientController from '../controllers/clientController.js';
import authController from '../controllers/authController.js';
import customerPortalController from '../controllers/customerPortalController.js';
import { buildPortalInviteMessage, formatWhatsAppNumber } from '../staff-interface/src/utils/whatsapp.js';

describe('Customer Onboarding & First-Time Password Cycle', () => {
    let testClientId;
    const testPhone = '01099887766';
    const testName = 'Tamer Onboarding Test';
    const testNewPassword = 'StrongPassword2026!';

    before(async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
        await database.connect();

        // Ensure clean state before test
        await database.run('DELETE FROM clients WHERE email = ?', ['tamer.test@example.com']);

        // Create temporary test client with NULL password_hash
        const result = await database.run(
            `INSERT INTO clients (full_name, phone, email, notes, password_hash)
             VALUES (?, ?, ?, ?, NULL)`,
            [testName, testPhone, 'tamer.test@example.com', 'Onboarding test client']
        );
        testClientId = result.id;
    });

    after(async () => {
        if (testClientId) {
            await database.run('DELETE FROM clients WHERE id = ?', [testClientId]);
        }
    });

    test('WhatsApp invite message formats cleanly in bilingual WhatsApp markdown', () => {
        const dummyMagicLink = 'https://gocarauto.vercel.app/magic/sample-token-123';
        const message = buildPortalInviteMessage(testName, testPhone, dummyMagicLink);

        // Verification of WhatsApp markdown formatting rules
        assert.ok(message.includes(`*${testName}*`), 'Customer name must be wrapped in single asterisks for WhatsApp bold');
        assert.ok(!message.includes(`**`), 'Must NOT contain double asterisks which break in WhatsApp');
        assert.ok(!message.includes(`#`), 'Must NOT contain markdown hashtags which display as raw text');
        assert.ok(message.includes(`\`${testPhone}\``), 'Phone number must be formatted in inline monospace code');
        assert.ok(message.includes('https://gocarauto.vercel.app'), 'Must contain the live Customer Portal URL');
        assert.ok(message.includes(dummyMagicLink), 'Must contain the direct magic link');
        assert.ok(message.includes('━━━━━━━━━━━━━━━━━━━━'), 'Must contain the bilingual visual divider');
        assert.ok(message.includes('مرحباً بك في جوكار أوتو'), 'Must contain clean Arabic greeting');
        assert.ok(message.includes('Welcome to GoCar Auto'), 'Must contain clean English greeting');

        // Phone number formatting
        const waNumber = formatWhatsAppNumber(testPhone);
        assert.equal(waNumber, '201099887766', 'Egyptian mobile number must format with 20 prefix for WhatsApp');

        // Verification of Zero Corruptible 4-Byte Emojis (avoids WhatsApp HTTP 302 character replacement diamond)
        // Match surrogate pairs ([\uD800-\uDBFF][\uDC00-\uDFFF]) which break upon wa.me 302 redirect
        const hasSurrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(message);
        assert.equal(hasSurrogatePairs, false, 'Invite message must NOT contain 4-byte surrogate emojis that corrupt to question diamonds in WhatsApp');
    });

    test('generateMagicLink generates a 30-day token with live customer portal URL', async () => {
        let responseJson;
        const req = { params: { id: testClientId } };
        const res = {
            json: (payload) => { responseJson = payload; return res; },
            status: () => res
        };

        await clientController.generateMagicLink(req, res);

        assert.equal(responseJson.success, true);
        assert.ok(responseJson.data.token, 'Magic token must be created');
        assert.ok(responseJson.data.url.startsWith('https://gocarauto.vercel.app/magic/'), 'Magic URL must target live portal');

        const decoded = jwt.verify(responseJson.data.token, process.env.JWT_SECRET);
        assert.equal(decoded.id, testClientId);
        assert.equal(decoded.type, 'magic_link');
    });

    test('magicLogin establishes session with hasPassword: false for uninitialized customer', async () => {
        const magicToken = jwt.sign(
            { id: testClientId, type: 'magic_link' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        let responseJson;
        const req = { params: { token: magicToken } };
        const res = {
            cookie: () => {},
            json: (payload) => { responseJson = payload; return res; },
            status: () => res
        };

        await authController.magicLogin(req, res);

        assert.equal(responseJson.success, true);
        assert.equal(responseJson.user.id, testClientId);
        assert.equal(responseJson.user.hasPassword, false, 'hasPassword must be false before first-time password setup');
        assert.equal(responseJson.user.phone, testPhone);
    });

    test('setInitialPassword successfully sets password when password_hash is NULL', async () => {
        let responseJson;
        let statusCode = 200;
        const req = {
            user: { id: testClientId, userType: 'customer' },
            body: { password: testNewPassword }
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; }
        };

        await customerPortalController.setInitialPassword(req, res);

        assert.equal(statusCode, 200);
        assert.equal(responseJson.success, true);

        // Verify in database that password_hash is now populated
        const client = await database.get('SELECT password_hash FROM clients WHERE id = ?', [testClientId]);
        assert.ok(client.password_hash, 'Client password_hash must now exist in DB');
        const matches = await bcrypt.compare(testNewPassword, client.password_hash);
        assert.equal(matches, true, 'Stored bcrypt hash must verify against testNewPassword');
    });

    test('setInitialPassword rejects second attempt with 409 Conflict once password exists', async () => {
        let responseJson;
        let statusCode = 200;
        const req = {
            user: { id: testClientId, userType: 'customer' },
            body: { password: 'AnotherPassword999!' }
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; }
        };

        await customerPortalController.setInitialPassword(req, res);

        assert.equal(statusCode, 409, 'Must return 409 Conflict if password already established');
        assert.ok(responseJson.error.includes('already been established'));
    });

    test('Customer can now log in via standard customerLogin using phone number as username', async () => {
        let responseJson;
        let statusCode = 200;
        const req = {
            body: {
                identifier: testPhone,
                password: testNewPassword
            }
        };
        const res = {
            cookie: () => {},
            status: (code) => { statusCode = code; return res; },
            json: (payload) => { responseJson = payload; return res; }
        };

        await authController.customerLogin(req, res);

        assert.equal(statusCode, 200);
        assert.equal(responseJson.success, true);
        assert.equal(responseJson.user.id, testClientId);
        assert.equal(responseJson.user.phone, testPhone);
        assert.equal(responseJson.user.hasPassword, true, 'hasPassword must now be true');

        // Test login flexibility: international prefix +201099887766 matches 01099887766 in DB
        let intlResponseJson;
        let intlStatusCode = 200;
        const reqIntl = {
            body: {
                identifier: `+20${testPhone.substring(1)}`,
                password: testNewPassword
            }
        };
        const resIntl = {
            cookie: () => {},
            status: (code) => { intlStatusCode = code; return res; },
            json: (payload) => { intlResponseJson = payload; return res; }
        };
        await authController.customerLogin(reqIntl, resIntl);
        assert.equal(intlStatusCode, 200);
        assert.equal(intlResponseJson.success, true);
    });
});
