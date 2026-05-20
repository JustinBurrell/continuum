const Notification = require('../models/Notification');

// ============================================================
// NOTIFICATIONS CONTROLLER
// Purpose: CRUD for in-app notifications
// Used by: routes/notifications.routes.js
// Base path: /api/notifications
// All routes require JWT auth (enforced by router-level middleware)
// ============================================================

// ----------------------------------------
// GET /api/notifications
// Purpose: Return the authenticated user's notifications, newest first.
// Cursor pagination — cursor is a compound "ISO|objectId" string (same
// pattern as the activity feed) so duplicate createdAt values never skip items.
// Query params:
//   cursor - compound cursor string from a previous response
//   limit  - default 20, max 50
// Response: { notifications, nextCursor, hasMore, unreadCount }
// ----------------------------------------
exports.getNotifications = async (req, res) => {
    const userId = req.user._id;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const rawCursor = req.query.cursor || null;

    let cursorTs = null;
    let cursorId = null;
    if (rawCursor) {
        const sep = rawCursor.lastIndexOf('|');
        cursorTs = new Date(rawCursor.slice(0, sep));
        cursorId = rawCursor.slice(sep + 1);
    }

    const baseFilter = { userId };

    const pagedFilter = cursorTs
        ? {
            $and: [
                baseFilter,
                {
                    $or: [
                        { createdAt: { $lt: cursorTs } },
                        { createdAt: cursorTs, _id: { $lt: cursorId } },
                    ],
                },
            ],
        }
        : baseFilter;

    const [raw, unreadCount] = await Promise.all([
        Notification.find(pagedFilter)
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1)
            .populate('actorId', 'firstName lastName avatarUrl'),
        Notification.countDocuments({ userId, read: false }),
    ]);

    const hasMore = raw.length > limit;
    const notifications = hasMore ? raw.slice(0, limit) : raw;
    const last = notifications[notifications.length - 1];
    const nextCursor = hasMore
        ? `${last.createdAt.toISOString()}|${last._id.toString()}`
        : null;

    res.status(200).json({ success: true, notifications, nextCursor, hasMore, unreadCount });
};

// ----------------------------------------
// PATCH /api/notifications/read
// Purpose: Mark all of the authenticated user's unread notifications as read.
// ----------------------------------------
exports.markAllRead = async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true, readAt: new Date() }
    );
    res.status(200).json({ success: true });
};

// ----------------------------------------
// PATCH /api/notifications/:id/read
// Purpose: Mark a single notification as read.
// ----------------------------------------
exports.markOneRead = async (req, res) => {
    const notif = await Notification.findOne({ _id: req.params.id });

    if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });

    if (notif.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!notif.read) {
        notif.read = true;
        notif.readAt = new Date();
        await notif.save();
    }

    res.status(200).json({ success: true, notification: notif });
};

// ----------------------------------------
// DELETE /api/notifications/:id
// Purpose: Remove a notification (only the recipient can delete their own).
// ----------------------------------------
exports.deleteNotification = async (req, res) => {
    const notif = await Notification.findOne({ _id: req.params.id });

    if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });

    if (notif.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await notif.deleteOne();
    res.status(200).json({ success: true });
};
