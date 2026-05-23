const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../lib/socket');
const admin = require('../lib/firebase');

// ============================================================
// NOTIFICATION SERVICE
// Purpose: Central dispatcher for all in-app notifications.
// Called fire-and-forget from controllers: notify({...}).catch(() => {})
// ============================================================

/**
 * notify
 * Creates a Notification document and pushes a real-time count update
 * to the recipient via Socket.io.
 *
 * Guards:
 *   - Skips if actorId === recipientId (never notify yourself)
 *   - Skips if a duplicate exists within the debounce window
 *
 * @param {Object} params
 * @param {ObjectId|string} params.recipientId
 * @param {ObjectId|string} params.actorId
 * @param {string}          params.type          - notification type enum
 * @param {ObjectId|string} params.targetId      - the resource being referenced
 * @param {string}          params.targetType    - resource type enum
 * @param {string}          params.message       - pre-rendered human-readable string
 * @param {Object}          [params.metadata]    - optional context (e.g. { commentPreview, commentId })
 * @param {number}          [params.debounceMinutes] - skip if same notif sent within N minutes
 */
async function notify({ recipientId, actorId, type, targetId, targetType, message, metadata, debounceMinutes }) {
    // Never notify a user about their own actions
    if (actorId && recipientId && actorId.toString() === recipientId.toString()) return;

    // Debounce: skip if a matching notification already exists within the window
    if (debounceMinutes && targetId) {
        const cutoff = new Date(Date.now() - debounceMinutes * 60 * 1000);
        const exists = await Notification.findOne({
            userId: recipientId,
            actorId,
            type,
            targetId,
            createdAt: { $gte: cutoff },
        }).lean();
        if (exists) return;
    }

    await Notification.create({ userId: recipientId, actorId, type, targetId, targetType, message, metadata });

    // Count total unread for the recipient and push to their socket room
    const unreadCount = await Notification.countDocuments({ userId: recipientId, read: false });
    try {
        getIO().to(`user:${recipientId}`).emit('new_notification', {
            unreadCount,
            type,
            targetId: targetId?.toString(),
        });
    } catch (_) {}

    // FCM push — fire-and-forget, never throws
    sendPush({ recipientId, actorId, type, targetId, targetType, message, metadata }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Push notification category mapping (type → user settings key)
// ---------------------------------------------------------------------------

const PUSH_CATEGORY = {
    new_message:      'messages',
    comment_added:    'comments',
    comment_reply:    'comments',
    mention:          'comments',
    like_added:       'likes',
    friend_request:   'friendRequests',
    friend_accepted:  'friendRequests',
    task_assigned:    'tasks',
    share_received:   'sharedContent',
};

// ---------------------------------------------------------------------------
// buildFcmBody — enriches the notification body with preview metadata
// ---------------------------------------------------------------------------

function buildFcmBody(type, message, metadata) {
    const preview = metadata?.messagePreview || metadata?.commentPreview;
    if (!preview) return message;
    switch (type) {
        case 'new_message':
            // "Alex Chen sent you a message" → "Alex Chen: Hey, free to study?"
            return message.replace(' sent you a message', '') + ': ' + preview;
        case 'comment_added':
        case 'comment_reply':
        case 'mention':
            return message + ': "' + preview + '"';
        case 'like_added':
            return message + ': "' + preview + '"';
        default:
            return message;
    }
}

// ---------------------------------------------------------------------------
// sendPush — sends an FCM push notification to all devices for a user
// ---------------------------------------------------------------------------

async function sendPush({ recipientId, actorId, type, targetId, targetType, message, metadata }) {
    // Skip if Firebase Admin is not initialized (no service account in env)
    if (!admin.apps.length) return;

    const user = await User.findById(recipientId)
        .select('fcmTokens settings')
        .lean();
    if (!user?.fcmTokens?.length) return;

    // Respect legacy Boolean pushNotifications: false
    const pushPrefs = user.settings?.pushNotifications;
    if (pushPrefs === false) return;

    // Respect per-type preference
    if (typeof pushPrefs === 'object' && pushPrefs !== null) {
        const category = PUSH_CATEGORY[type];
        if (category && pushPrefs[category] === false) return;
    }

    // Look up actor name for the notification body and deep-link data
    let actorName = '';
    if (actorId) {
        const actor = await User.findById(actorId).select('firstName lastName').lean();
        actorName = actor ? `${actor.firstName} ${actor.lastName}` : '';
    }

    const body = buildFcmBody(type, message, metadata);
    const tokens = user.fcmTokens.map((t) => t.token);

    // Build FCM data payload (all values must be strings)
    const data = {
        type:         type ?? '',
        targetId:     targetId?.toString() ?? '',
        targetType:   targetType ?? '',
        actorId:      actorId?.toString() ?? '',
        actorName:    actorName,
        title:        'Continuum',
        body:         body,
        commentId:    metadata?.commentId ?? '',
        resourceId:   metadata?.resourceId ?? '',
        resourceType: metadata?.resourceType ?? '',
    };

    // new_message uses data-only so onMessageReceived always fires (for quick reply action)
    const isMessage = type === 'new_message';

    const payload = {
        tokens,
        data,
        android: { priority: 'high' },
        ...(isMessage
            ? {}
            : { notification: { title: 'Continuum', body } }),
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    // Prune stale tokens FCM rejected
    const staleTokens = [];
    response.responses.forEach((r, i) => {
        if (
            !r.success &&
            ['messaging/registration-token-not-registered',
             'messaging/invalid-registration-token'].includes(r.error?.code)
        ) {
            staleTokens.push(tokens[i]);
        }
    });
    if (staleTokens.length) {
        await User.findByIdAndUpdate(recipientId, {
            $pull: { fcmTokens: { token: { $in: staleTokens } } },
        });
    }
}

module.exports = { notify, sendPush, buildFcmBody, PUSH_CATEGORY };
