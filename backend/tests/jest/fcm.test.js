/**
 * fcm.test.js
 *
 * Unit tests for sendPush() and buildFcmBody() in notification.service.js.
 * firebase-admin is mocked — no real FCM calls are made.
 */

const { connectTestDb, clearTestDb, closeTestDb } = require('./testDb');
const { registerAndLogin } = require('./testHelpers');
const User = require('../../models/User');
const { sendPush, buildFcmBody, PUSH_CATEGORY } = require('../../services/notification.service');
const admin = require('firebase-admin');

beforeAll(connectTestDb);
afterEach(async () => {
    await clearTestDb();
    admin._reset();
});
afterAll(closeTestDb);

// Seed admin.apps so sendPush() knows Firebase is initialized
function enableFirebase() {
    admin.apps.push({});
}

async function createUserWithToken(fcmToken = 'test-fcm-token', pushPrefs = null) {
    const { userId } = await registerAndLogin();
    const update = { fcmTokens: [{ token: fcmToken, deviceId: 'device-1', updatedAt: new Date() }] };
    if (pushPrefs !== null) update['settings.pushNotifications'] = pushPrefs;
    await User.findByIdAndUpdate(userId, { $set: update });
    return userId;
}

// ─── buildFcmBody ─────────────────────────────────────────────────────────────

describe('buildFcmBody', () => {
    it('returns message as-is when no preview', () => {
        expect(buildFcmBody('like_added', 'Alex liked a comment on your note', {})).toBe('Alex liked a comment on your note');
    });

    it('formats like_added with quoted comment preview', () => {
        const body = buildFcmBody('like_added', 'Alex liked a comment on your note', { commentPreview: 'Great write-up!' });
        expect(body).toBe('Alex liked a comment on your note: "Great write-up!"');
    });

    it('returns share_received message as-is (title already in message)', () => {
        const body = buildFcmBody('share_received', 'Alex shared a note with you: "Biology Notes Ch 5"', {});
        expect(body).toBe('Alex shared a note with you: "Biology Notes Ch 5"');
    });

    it('formats new_message with colon separator', () => {
        const body = buildFcmBody('new_message', 'Alex Chen sent you a message', { messagePreview: 'Hey, free to study?' });
        expect(body).toBe('Alex Chen: Hey, free to study?');
    });

    it('formats comment_added with quoted preview', () => {
        const body = buildFcmBody('comment_added', 'Alex commented on your note', { commentPreview: 'Great work!' });
        expect(body).toBe('Alex commented on your note: "Great work!"');
    });

    it('formats comment_reply with quoted preview', () => {
        const body = buildFcmBody('comment_reply', 'Alex replied to your comment', { commentPreview: 'Good point!' });
        expect(body).toBe('Alex replied to your comment: "Good point!"');
    });

    it('formats mention with quoted preview', () => {
        const body = buildFcmBody('mention', 'Alex mentioned you in a note', { commentPreview: '@justin see this' });
        expect(body).toBe('Alex mentioned you in a note: "@justin see this"');
    });

    it('falls back to messagePreview when commentPreview missing', () => {
        const body = buildFcmBody('new_message', 'Alex sent you a message', { messagePreview: 'Hello!' });
        expect(body).toBe('Alex: Hello!');
    });
});

// ─── PUSH_CATEGORY mapping ────────────────────────────────────────────────────

describe('PUSH_CATEGORY', () => {
    it('maps all 9 notification types correctly', () => {
        expect(PUSH_CATEGORY.new_message).toBe('messages');
        expect(PUSH_CATEGORY.comment_added).toBe('comments');
        expect(PUSH_CATEGORY.comment_reply).toBe('comments');
        expect(PUSH_CATEGORY.mention).toBe('comments');
        expect(PUSH_CATEGORY.like_added).toBe('likes');
        expect(PUSH_CATEGORY.friend_request).toBe('friendRequests');
        expect(PUSH_CATEGORY.friend_accepted).toBe('friendRequests');
        expect(PUSH_CATEGORY.task_assigned).toBe('tasks');
        expect(PUSH_CATEGORY.share_received).toBe('sharedContent');
    });
});

// ─── sendPush ─────────────────────────────────────────────────────────────────

describe('sendPush', () => {
    it('skips when Firebase is not initialized', async () => {
        // admin.apps is empty (reset by afterEach)
        const userId = await createUserWithToken();
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('skips when user has no FCM tokens', async () => {
        enableFirebase();
        const { userId } = await registerAndLogin();
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('sends FCM for new_message with data-only payload (no notification field)', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-msg');
        await sendPush({
            recipientId: userId,
            type: 'new_message',
            targetId: 'conv123',
            targetType: 'conversation',
            message: 'Alex Chen sent you a message',
            metadata: { messagePreview: 'Hey!' },
        });
        expect(admin._mockSendEachForMulticast).toHaveBeenCalledTimes(1);
        const payload = admin._mockSendEachForMulticast.mock.calls[0][0];
        expect(payload.notification).toBeUndefined();
        expect(payload.data.type).toBe('new_message');
        expect(payload.data.body).toBe('Alex Chen: Hey!');
    });

    it('sends FCM with notification field for comment_added', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-comment');
        await sendPush({
            recipientId: userId,
            type: 'comment_added',
            targetId: 'note123',
            targetType: 'note',
            message: 'Alex commented on your note',
            metadata: { commentPreview: 'Great work!', commentId: 'cmt1' },
        });
        const payload = admin._mockSendEachForMulticast.mock.calls[0][0];
        expect(payload.notification).toBeDefined();
        expect(payload.notification.body).toBe('Alex commented on your note: "Great work!"');
        expect(payload.data.commentId).toBe('cmt1');
    });

    it('respects legacy pushNotifications: false (all push off)', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-off');
        await User.findByIdAndUpdate(userId, { $set: { 'settings.pushNotifications': false } });
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('respects per-type messages: false — skips new_message', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-msg-off');
        await User.findByIdAndUpdate(userId, { $set: { 'settings.pushNotifications.messages': false } });
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('respects per-type comments: false — skips comment_added', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-cmt-off');
        await User.findByIdAndUpdate(userId, { $set: { 'settings.pushNotifications.comments': false } });
        await sendPush({ recipientId: userId, type: 'comment_added', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('still sends when only one category is disabled (others unaffected)', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-partial');
        await User.findByIdAndUpdate(userId, { $set: { 'settings.pushNotifications.likes': false } });
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        expect(admin._mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    });

    it('prunes stale tokens from FCM rejection', async () => {
        enableFirebase();
        const userId = await createUserWithToken('stale-token');
        admin._mockSendEachForMulticast.mockResolvedValueOnce({
            responses: [{
                success: false,
                error: { code: 'messaging/registration-token-not-registered' },
            }],
            successCount: 0,
            failureCount: 1,
        });
        await sendPush({ recipientId: userId, type: 'new_message', message: 'test', metadata: {} });
        const user = await User.findById(userId).lean();
        expect(user.fcmTokens).toHaveLength(0);
    });

    it('includes all required data payload keys', async () => {
        enableFirebase();
        const userId = await createUserWithToken('token-all');
        await sendPush({
            recipientId: userId,
            type: 'comment_reply',
            targetId: 'cmt123',
            targetType: 'comment',
            message: 'Alex replied to your comment',
            metadata: { commentPreview: 'Reply!', commentId: 'cmt123', resourceId: 'note456', resourceType: 'note' },
        });
        const payload = admin._mockSendEachForMulticast.mock.calls[0][0];
        expect(payload.data.type).toBe('comment_reply');
        expect(payload.data.targetId).toBe('cmt123');
        expect(payload.data.resourceId).toBe('note456');
        expect(payload.data.resourceType).toBe('note');
        expect(payload.data.commentId).toBe('cmt123');
        expect(payload.android.priority).toBe('high');
    });
});
