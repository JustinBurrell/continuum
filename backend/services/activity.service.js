const Activity = require('../models/Activity');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

// ============================================================
// ACTIVITY SERVICE
// Purpose: Create activity feed entries based on the actor's activityVisibility setting
// Used by: notes.controller, tasks.controller, comments.controller
//
// Visibility rules (actor always sees their own activity):
//   'private' — only the actor sees their activity
//   'friends' — actor + accepted friends see it (default)
//   'public'  — isPublic: true; visible to all users
// ============================================================

/**
 * Resolve the actor's visibleTo array based on their activityVisibility setting.
 * Always includes the actor themselves.
 */
const resolveVisibleTo = async (actorId) => {
    const actor = await User.findById(actorId).select('settings.activityVisibility');
    const visibility = actor?.settings?.activityVisibility ?? 'friends';

    let visibleTo = [actorId];
    let isPublic = false;

    if (visibility === 'friends') {
        const friendships = await Friendship.find({
            $or: [{ user1: actorId }, { user2: actorId }],
            status: 'accepted',
            deletedAt: null,
        });
        const friendIds = friendships.map(f =>
            f.user1.toString() === actorId.toString() ? f.user2 : f.user1
        );
        visibleTo.push(...friendIds);
    } else if (visibility === 'public') {
        isPublic = true;
    }

    return { visibleTo, isPublic };
};

/**
 * createActivity — generic activity (comments, likes, non-sharing events)
 */
const createActivity = async ({ actorId, type, targetId, targetType, metadata }) => {
    const { visibleTo, isPublic } = await resolveVisibleTo(actorId);

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

/**
 * createShareActivities — creates personalized activity entries for sharing events.
 *
 * Sharer sees: "You shared X with Alice, Bob, Charlie"
 * Each recipient sees: "Justin shared X with you"
 * Other friends of the sharer see: "Justin shared X with Alice, Bob, Charlie"
 *
 * @param {Object} params
 * @param {ObjectId} params.actorId      — user who shared
 * @param {String}   params.type         — Activity type enum value
 * @param {ObjectId} params.targetId     — ID of the shared resource
 * @param {String}   params.targetType   — targetType enum value
 * @param {Object}   params.metadata     — base metadata (noteTitle, setTitle, taskTitle, etc.)
 * @param {Array}    [params.recipientIds] — specific user IDs shared with (for 'specific' or task participants)
 * @param {Boolean}  [params.shareAll]   — true if shared with all friends (no specific recipients)
 */
const createShareActivities = async ({ actorId, type, targetId, targetType, metadata, recipientIds, shareAll }) => {
    const { visibleTo: sharerVisibleTo, isPublic } = await resolveVisibleTo(actorId);

    if (shareAll) {
        // Shared with all friends — single activity entry
        await Activity.create({
            userId: actorId,
            type,
            targetId,
            targetType,
            visibleTo: sharerVisibleTo,
            isPublic,
            metadata: { ...metadata, sharedWithAll: true },
        });
        return;
    }

    if (!recipientIds || recipientIds.length === 0) return;

    // Look up recipient names for the sharer's activity
    const recipients = await User.find({ _id: { $in: recipientIds } })
        .select('firstName lastName username');
    const sharedWithNames = recipients.map(r => ({
        _id: r._id,
        firstName: r.firstName,
        lastName: r.lastName,
    }));

    // Remove recipients from sharer's visibleTo so they only see
    // their personalized "with you" version, not the generic one
    const recipientSet = new Set(recipientIds.map(id => id.toString()));
    const filteredVisibleTo = sharerVisibleTo.filter(id => !recipientSet.has(id.toString()));

    // 1. Sharer's activity — "shared X with Alice, Bob"
    await Activity.create({
        userId: actorId,
        type,
        targetId,
        targetType,
        visibleTo: filteredVisibleTo,
        isPublic,
        metadata: { ...metadata, sharedWithNames },
    });

    // 2. Per-recipient activity — "Justin shared X with you"
    for (const recipientId of recipientIds) {
        await Activity.create({
            userId: actorId,
            type,
            targetId,
            targetType,
            visibleTo: [recipientId],
            isPublic: false,
            metadata: { ...metadata, isRecipient: true },
        });
    }
};

module.exports = { createActivity, createShareActivities };
