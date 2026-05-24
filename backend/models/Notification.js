const mongoose = require('mongoose');

// ============================================================
// NOTIFICATION SCHEMA
// Purpose: Persistent record of every in-app notification sent to a user.
// Powers the bell badge, dropdown, and full history page.
// Collection: notifications
// TTL: 90 days (matches Activity feed retention)
// ============================================================
const notificationSchema = new mongoose.Schema({
    // Recipient
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // What triggered this notification
    type: {
        type: String,
        enum: [
            'new_message',
            'share_received',
            'task_assigned',
            'comment_added',
            'comment_reply',
            'like_added',
            'mention',
            'friend_request',
            'friend_accepted',
        ],
        required: true,
    },

    // Who triggered it
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // The resource this notification points to (note, task, conversation, etc.)
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    targetType: {
        type: String,
        enum: ['note', 'flashcardSet', 'task', 'comment', 'conversation', 'friendship'],
    },

    // Pre-rendered human-readable string shown in the UI
    message: {
        type: String,
        required: true,
    },

    // Optional context data used to enrich the notification display.
    // For comments: { commentPreview, commentId }
    // Keeps the schema flexible without adding typed sub-fields per event type.
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },

    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },

    // Explicit createdAt for TTL index (not using timestamps option)
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Set after this notification is included in a digest email — prevents re-sending
    digestSentAt: {
        type: Date,
        default: null,
    },
});

// ============================================================
// INDEXES
// TTL: auto-delete notifications older than 90 days (matches Activity)
// Compound indexes for the two main query patterns:
//   - "get this user's notifications newest first"
//   - "count this user's unread notifications"
// ============================================================
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
