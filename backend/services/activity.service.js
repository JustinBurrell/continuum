const Activity = require('../models/Activity');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

// ============================================================
// ACTIVITY SERVICE
// Purpose: Create activity feed entries based on the actor's activityVisibility setting
// Used by: notes.controller, tasks.controller, comments.controller
//
// Visibility rules:
//   'private' — no Activity doc created; actor's actions are invisible to others
//   'friends' — visibleTo is populated with the actor's accepted friend IDs at creation time
//   'public'  — isPublic: true; visible to all users without storing every userId in visibleTo
// ============================================================

/**
 * createActivity
 * @param {Object} params
 * @param {ObjectId} params.actorId    — user who performed the action
 * @param {String}   params.type       — Activity type enum value
 * @param {ObjectId} params.targetId   — ID of the resource acted on
 * @param {String}   params.targetType — targetType enum value
 * @param {Object}   [params.metadata] — optional context (noteTitle, commentPreview, etc.)
 */
const createActivity = async ({ actorId, type, targetId, targetType, metadata }) => {
    // Look up the actor's activityVisibility setting
    const actor = await User.findById(actorId).select('settings.activityVisibility');
    const visibility = actor?.settings?.activityVisibility ?? 'private';

    // Private — don't create any Activity doc
    if (visibility === 'private') return;

    let visibleTo = [];
    let isPublic = false;

    if (visibility === 'friends') {
        // Resolve friend IDs at the moment of action
        const friendships = await Friendship.find({
            $or: [{ user1: actorId }, { user2: actorId }],
            status: 'accepted',
            deletedAt: null,
        });

        visibleTo = friendships.map(f =>
            f.user1.toString() === actorId.toString() ? f.user2 : f.user1
        );

        // No friends yet — nothing to publish
        if (visibleTo.length === 0) return;

    } else if (visibility === 'public') {
        isPublic = true;
    }

    await Activity.create({
        userId: actorId,
        type,
        targetId,
        targetType,
        visibleTo,
        isPublic,
        metadata: metadata || {},
    });
};

module.exports = { createActivity };
