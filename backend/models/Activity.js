const mongoose = require('mongoose');

// ============================================================
// ACTIVITY SCHEMA
// Purpose: Define the structure of an Activity document in MongoDB
// Collection: activities
// Features: Social activity feed for friends, polymorphic targets,
//           flexible metadata, TTL index for auto-cleanup (90 days)
// ============================================================
const activitySchema = new mongoose.Schema({
    /**
     * Actor
     * Purpose: Link the activity to the user who performed the action
     * Fields: userId
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    /**
     * Activity Type
     * Purpose: Categorize what action was performed
     * Fields: type
     */
    type: {
        type: String,
        enum: ['note_shared', 'flashcard_shared', 'task_created', 'comment_added', 'like_added'],
        required: true,
        index: true,
    },

    /**
     * Target Resource
     * Purpose: Link the activity to the resource it references (polymorphic)
     * Fields: targetId, targetType
     * Note: targetId + targetType together identify what was acted on
     */
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    targetType: {
        type: String,
        enum: ['note', 'flashcardSet', 'task', 'comment'],
        required: true,
    },

    /**
     * Visibility
     * Purpose: Control which friends see this activity in their feed
     * Fields: visibleTo
     * Note: Array of User ObjectIds — populated when the activity is created
     *       based on the actor's friend list at that time
     */
    visibleTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    /**
     * Metadata
     * Purpose: Store additional context about the activity (flexible structure)
     * Fields: metadata
     * Note: Schema.Types.Mixed allows any JSON — e.g. { noteTitle: '...', commentPreview: '...' }
     */
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },

    /**
     * Timestamp
     * Purpose: Track when the activity occurred
     * Fields: createdAt
     * Note: Explicit createdAt (not using timestamps option) because the TTL index
     *       needs to reference this field for auto-deletion after 90 days
     */
    createdAt: {
        type: Date,
        default: Date.now,
    },

});

// ============================================================
// INDEXES
// Purpose: Speed up common queries by telling MongoDB which fields to pre-sort
// These compound indexes optimize queries that filter by BOTH fields at once
//
// { createdAt: 1 } (TTL)                      — auto-delete activities older than 90 days
// { visibleTo: 1, createdAt: -1 }             — "get a user's activity feed, newest first"
// { userId: 1, type: 1, createdAt: -1 }       — "get a user's activities by type, newest first"
// ============================================================
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });  // TTL: auto-delete after 90 days
activitySchema.index({ visibleTo: 1, createdAt: -1 });                    // "get a user's activity feed, newest first"
activitySchema.index({ userId: 1, type: 1, createdAt: -1 });              // "get a user's activities by type, newest first"

module.exports = mongoose.model('Activity', activitySchema);
