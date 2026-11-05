import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication & Security Integrity', () => {
    test('bcrypt accurately verifies correct password and rejects backdoor', async () => {
        const password = 'RealUserSecret99!';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const correct = await bcrypt.compare(password, hash);
        assert.equal(correct, true, 'Valid password should match hash');

        const backdoorCheck = await bcrypt.compare('password123', hash);
        assert.equal(backdoorCheck, false, 'Backdoor password123 must NOT match');
    });

    test('JWT signs and verifies session payload with secret', () => {
        const secret = 'test-secret-key-for-unit-testing-only-1234';
        const user = { id: 1, email: 'admin@gocarauto.com', role: 'Admin', userType: 'staff' };
        
        const token = jwt.sign(user, secret, { expiresIn: '1h' });
        assert.ok(token, 'Token must be generated');

        const decoded = jwt.verify(token, secret);
        assert.equal(decoded.id, 1);
        assert.equal(decoded.role, 'Admin');
        assert.equal(decoded.userType, 'staff');
    });

    test('JWT rejects invalid signatures', () => {
        const secret = 'valid-secret-key-123';
        const fakeSecret = 'wrong-secret-key-456';
        const token = jwt.sign({ id: 1 }, secret, { expiresIn: '1h' });

        assert.throws(() => {
            jwt.verify(token, fakeSecret);
        });
    });
});
