/**
 * pushSettings.test.js
 *
 * Tests for per-type push notification settings:
 *   - PATCH profile saves per-type pushNotifications
 *   - sendPush() respects each per-type flag
 *   - Forward-compat: undefined sub-key treated as enabled
 *   - Legacy Boolean false treated as all-off
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { sendPush } = require('../../services/notification.service');
const admin = require('firebase-admin');
const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');

beforeAll(connectTestDb);
afterEach(async () => {
    await clearTestDb();
    admin._reset();
});
afterAll(closeTestDb);

function enableFirebase() {
    admin.apps.push({});
}

async function userWithToken(fcmToken = 'test-tok') {
    const { token, userId } = await registerAndLogin();
    await User.findByIdAndUpdate(userId, {
        $set: { fcmTokens: [{ token: fcmToken, deviceId: 'dev-1', updatedAt: new Date() }] },
    });
    return { token, userId };
}

// ─── PATCH profile — per-type settings persist ────────────────────────────────

describe('PATCH /api/auth/me/profile — per-type push settings', () => {
    it('persists pushNotifications.messages = false', async () => {
        const { token, userId } = await registerAndLogin();
        const res = await request(app)
            .patch('/api/auth/me/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ 'settings.pushNotifications.messages': 'false' });
        expect(res.status).toBe(200);
        const user = await User.findById(userId).lean();
        expect(user.settings.pushNotifications.messages).toBe(false);
    });

    it('persists pushNotifications.likes = false while others remain true', async () => {
        const { token, userId } = await registerAndLogin();
        await request(app)
            .patch('/api/auth/me/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ 'settings.pushNotifications.likes': 'false' });
        const user = await User.findById(userId).lean();
        expect(user.settings.pushNotifications.likes).toBe(false);
        expect(user.settings.pushNotifications.messages).toBe(true);
        expect(user.settings.pushNotifications.comments).toBe(true);
    });
});

// ─── sendPush per-type enforcement ────────────────────────────────────────────

describe('sendPush — per-type category gating', () => {
    const types = [
        { type: 'new_message',     category: 'messages' },
        { type: 'comment_added',   category: 'comments' },
        { type: 'comment_reply',   category: 'comments' },
        { type: 'mention',         category: 'comments' },
        { type: 'like_added',      category: 'likes' },
        { type: 'friend_request',  category: 'friendRequests' },
        { type: 'friend_accepted', category: 'friendRequests' },
        { type: 'task_assigned',   category: 'tasks' },
        { type: 'share_received',  category: 'sharedContent' },
    ];

    for (const { type, category } of types) {
        it(`skips FCM when ${category} = false (type: ${type})`, async () => {
            enableFirebase();
            const { userId } = await userWithToken(`tok-${type}`);
            await User.findByIdAndUpdate(userId, {
                $set: { [`settings.pushNotifications.${category}`]: false },
            });
            await sendPush({ recipientId: userId, type, message: 'test', metadata: {} });
            expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
            admin._reset();
            enableFirebase();
            admin.apps.push({});
        });
    }

    it('sends FCM when per-type setting is undefined (treated as enabled)', async () => {
        enableFirebase();
        const { userId } = await userWithToken('tok-undef');
        // Remove the pushNotifications sub-document entirely to simulate missing key
        await User.findByIdAndUpdate(userId, { $unset: { 'settings.pushNotifications': '' } });
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    });

    it('blocks all push when legacy Boolean false is stored', async () => {
        enableFirebase();
        const { userId } = await userWithToken('tok-legacy-false');
        // Use raw collection with proper ObjectId cast to bypass Mongoose schema validation
        await User.collection.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $set: { 'settings.pushNotifications': false } }
        );
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });
});
