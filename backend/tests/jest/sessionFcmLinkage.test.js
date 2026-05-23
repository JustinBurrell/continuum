/**
 * sessionFcmLinkage.test.js
 *
 * Verifies that revoking sessions also prunes the matching FCM token.
 *   - DELETE /api/auth/sessions/:id  → removes that device's FCM token
 *   - POST   /api/auth/logout-all    → clears ALL FCM tokens
 *   - POST   /api/auth/mobile/logout → removes current device's FCM token
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

async function seedFcmTokens(userId, tokens) {
    await User.findByIdAndUpdate(userId, { $set: { fcmTokens: tokens } });
}

// ─── DELETE /api/auth/sessions/:id ───────────────────────────────────────────

describe('DELETE /api/auth/sessions/:id — FCM linkage', () => {
    it('removes the FCM token for the revoked session deviceId', async () => {
        const { token, userId } = await registerAndLogin();

        // Seed two FCM tokens
        await seedFcmTokens(userId, [
            { token: 'tok-a', deviceId: 'device-A', updatedAt: new Date() },
            { token: 'tok-b', deviceId: 'device-B', updatedAt: new Date() },
        ]);

        // Update the RefreshToken for this session with deviceId device-A
        const session = await RefreshToken.findOne({ userId, revokedAt: null });
        session.deviceId = 'device-A';
        await session.save();

        const res = await request(app)
            .delete(`/api/auth/sessions/${session._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);

        const user = await User.findById(userId).lean();
        const deviceIds = user.fcmTokens.map((t) => t.deviceId);
        expect(deviceIds).not.toContain('device-A');
        expect(deviceIds).toContain('device-B'); // other device unaffected
    });

    it('does not fail if the session has no deviceId', async () => {
        const { token, userId } = await registerAndLogin();
        await seedFcmTokens(userId, [{ token: 'tok-a', deviceId: 'device-A', updatedAt: new Date() }]);

        const session = await RefreshToken.findOne({ userId, revokedAt: null });
        session.deviceId = undefined;
        await session.save();

        const res = await request(app)
            .delete(`/api/auth/sessions/${session._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);

        // FCM tokens unchanged (no deviceId to match)
        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(1);
    });
});

// ─── POST /api/auth/logout-all ────────────────────────────────────────────────

describe('POST /api/auth/logout-all — FCM linkage', () => {
    it('clears all FCM tokens', async () => {
        const { token, userId } = await registerAndLogin();
        await seedFcmTokens(userId, [
            { token: 'tok-a', deviceId: 'dev-a', updatedAt: new Date() },
            { token: 'tok-b', deviceId: 'dev-b', updatedAt: new Date() },
            { token: 'tok-c', deviceId: 'dev-c', updatedAt: new Date() },
        ]);

        const res = await request(app)
            .post('/api/auth/logout-all')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);

        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(0);
    });
});

// ─── POST /api/auth/mobile/logout ─────────────────────────────────────────────

describe('POST /api/auth/mobile/logout — FCM linkage', () => {
    it('removes the FCM token for the logged-out device', async () => {
        // Register then mobile-login to get a refreshToken in the response body
        const { email, userId } = await registerAndLogin();
        const loginRes = await request(app)
            .post('/api/auth/mobile/login')
            .send({ email, password: 'Test@1234' });
        expect(loginRes.status).toBe(200);
        const { token: mobileToken, refreshToken: mobileRefresh } = loginRes.body;

        // Stamp a deviceId on the session created by mobile login
        const mobileSession = await RefreshToken.findOne({ userId, revokedAt: null }).sort({ createdAt: -1 });
        mobileSession.deviceId = 'mobile-device';
        await mobileSession.save();

        await seedFcmTokens(userId, [
            { token: 'tok-mobile', deviceId: 'mobile-device', updatedAt: new Date() },
            { token: 'tok-other',  deviceId: 'other-device',  updatedAt: new Date() },
        ]);

        const res = await request(app)
            .post('/api/auth/mobile/logout')
            .set('Authorization', `Bearer ${mobileToken}`)
            .send({ refreshToken: mobileRefresh });
        expect(res.status).toBe(200);

        const user = await User.findById(userId).lean();
        const deviceIds = user.fcmTokens.map((t) => t.deviceId);
        expect(deviceIds).not.toContain('mobile-device');
        expect(deviceIds).toContain('other-device');
    });
});
