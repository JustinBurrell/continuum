const Notification = require('../models/Notification');
const { getIO } = require('../lib/socket');

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
 * @param {number}          [params.debounceMinutes] - skip if same notif sent within N minutes
 */
async function notify({ recipientId, actorId, type, targetId, targetType, message, debounceMinutes }) {
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

    await Notification.create({ userId: recipientId, actorId, type, targetId, targetType, message });

    // Count total unread for the recipient and push to their socket room
    const unreadCount = await Notification.countDocuments({ userId: recipientId, read: false });
    try {
        getIO().to(`user:${recipientId}`).emit('new_notification', { unreadCount });
    } catch (_) {}
}

module.exports = { notify };
