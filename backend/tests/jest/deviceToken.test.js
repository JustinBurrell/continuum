/**
 * deviceToken.test.js
 *
 * Tests for POST /api/users/device-token
 * Verifies upsert behavior, max-5 enforcement, and auth guard.
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/users/device-token', () => {
    it('returns 401 without auth', async () => {
        const res = await request(app)
            .post('/api/users/device-token')
            .send({ token: 'tok', deviceId: 'dev-1' });
        expect(res.status).toBe(401);
    });

    it('returns 400 when token is missing', async () => {
        const { token } = await registerAndLogin();
        const res = await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ deviceId: 'dev-1' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when deviceId is missing', async () => {
        const { token } = await registerAndLogin();
        const res = await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'fcm-tok' });
        expect(res.status).toBe(400);
    });

    it('inserts a new token for a new deviceId', async () => {
        const { token, userId } = await registerAndLogin();
        const res = await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'fcm-tok-1', deviceId: 'dev-1' });
        expect(res.status).toBe(200);
        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(1);
        expect(user.fcmTokens[0].token).toBe('fcm-tok-1');
        expect(user.fcmTokens[0].deviceId).toBe('dev-1');
    });

    it('upserts (updates token) for an existing deviceId', async () => {
        const { token, userId } = await registerAndLogin();
        // Insert first token
        await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'fcm-tok-old', deviceId: 'dev-1' });

        // Update with new token for same deviceId
        await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'fcm-tok-new', deviceId: 'dev-1' });

        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(1);
        expect(user.fcmTokens[0].token).toBe('fcm-tok-new');
    });

    it('stores multiple tokens for different deviceIds', async () => {
        const { token, userId } = await registerAndLogin();
        await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'tok-a', deviceId: 'dev-a' });
        await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'tok-b', deviceId: 'dev-b' });

        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(2);
    });

    it('enforces max 5 tokens — oldest is evicted on 6th', async () => {
        const { token, userId } = await registerAndLogin();
        // Seed 5 existing tokens directly
        await User.findByIdAndUpdate(userId, {
            $set: {
                fcmTokens: [
                    { token: 'tok-1', deviceId: 'dev-1', updatedAt: new Date('2026-01-01') },
                    { token: 'tok-2', deviceId: 'dev-2', updatedAt: new Date('2026-01-02') },
                    { token: 'tok-3', deviceId: 'dev-3', updatedAt: new Date('2026-01-03') },
                    { token: 'tok-4', deviceId: 'dev-4', updatedAt: new Date('2026-01-04') },
                    { token: 'tok-5', deviceId: 'dev-5', updatedAt: new Date('2026-01-05') },
                ],
            },
        });

        // Add a 6th token — oldest (dev-1) should be evicted
        await request(app)
            .post('/api/users/device-token')
            .set('Authorization', `Bearer ${token}`)
            .send({ token: 'tok-6', deviceId: 'dev-6' });

        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(5);
        const deviceIds = user.fcmTokens.map((t) => t.deviceId);
        expect(deviceIds).not.toContain('dev-1'); // oldest evicted
        expect(deviceIds).toContain('dev-6');     // newest kept
    });
});
