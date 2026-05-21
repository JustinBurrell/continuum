const Comment = require('../models/Comment');
const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Task = require('../models/Task');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { createActivity } = require('../services/activity.service');
const { getIO } = require('../lib/socket');
const posthog = require('../lib/posthog');
const { notify } = require('../services/notification.service');

// ============================================================
// COMMENTS CONTROLLER
// Purpose: Handle business logic for comment and like endpoints
// Used by: routes/comments.routes.js
// Endpoints: addComment, getComments, toggleLike, deleteComment
// ============================================================

// ----------------------------------------
// POST /api/comments
// Purpose: Add a comment on a note, flashcard set, or task
// Body: { targetType, targetId, content, parentId? }
// Note: pre-save hook on Comment auto-populates userSnapshot from User
// ----------------------------------------
exports.addComment = async (req, res) => {
    const { targetType, targetId, content, parentId } = req.body;

    const validTargetTypes = ['note', 'flashcardSet', 'task'];
    if (!targetType || !validTargetTypes.includes(targetType)) {
        return res.status(400).json({
            success: false,
            error: `targetType must be one of: ${validTargetTypes.join(', ')}`,
        });
    }

    if (!targetId) {
        return res.status(400).json({ success: false, error: 'targetId is required' });
    }

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'content is required' });
    }

    // Verify requester has access to the target before allowing a comment
    const userId = req.user._id;
    if (targetType === 'note') {
        const note = await Note.findOne({ _id: targetId, deletedAt: null });
        if (!note) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = note.userId.toString() === userId.toString();
        const isShared = note.sharedWith.some(id => id.toString() === userId.toString());
        if (!isOwner && !isShared) {
            if (note.visibility !== 'friends') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            const friendship = await Friendship.findOne({
                $or: [
                    { user1: userId, user2: note.userId },
                    { user1: note.userId, user2: userId },
                ],
                status: 'accepted',
                deletedAt: null,
            });
            if (!friendship) return res.status(403).json({ success: false, error: 'Access denied' });
        }
    } else if (targetType === 'flashcardSet') {
        const set = await FlashcardSet.findOne({ _id: targetId, deletedAt: null });
        if (!set) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = set.userId.toString() === userId.toString();
        const isShared = set.sharedWith.some(id => id.toString() === userId.toString());
        if (!isOwner && !isShared) {
            if (set.visibility !== 'friends') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            const friendship = await Friendship.findOne({
                $or: [
                    { user1: userId, user2: set.userId },
                    { user1: set.userId, user2: userId },
                ],
                status: 'accepted',
                deletedAt: null,
            });
            if (!friendship) return res.status(403).json({ success: false, error: 'Access denied' });
        }
    } else if (targetType === 'task') {
        const task = await Task.findOne({ _id: targetId, deletedAt: null });
        if (!task) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = task.userId.toString() === userId.toString();
        const isParticipant = task.participants.some(p => p.userId.toString() === userId.toString());
        if (!isOwner && !isParticipant) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    // If parentId is provided, verify the parent comment exists and is on the same target
    if (parentId) {
        const parent = await Comment.findOne({ _id: parentId, deletedAt: null });
        if (!parent) {
            return res.status(404).json({ success: false, error: 'Parent comment not found' });
        }
        if (parent.targetId.toString() !== targetId || parent.targetType !== targetType) {
            return res.status(400).json({ success: false, error: 'parentId must belong to the same target' });
        }
        if (parent.parentId !== null) {
            return res.status(400).json({ success: false, error: 'Cannot reply to a reply' });
        }
    }

    // pre-save hook auto-sets userSnapshot from the User collection
    const comment = await new Comment({
        targetType,
        targetId,
        content: content.trim(),
        userId: req.user._id,
        parentId: parentId || null,
    }).save();

    posthog.capture(req.user, parentId ? 'comment_reply_added' : 'comment_added', {
        commentId: comment._id.toString(),
        targetId: comment.targetId.toString(),
        targetType: comment.targetType,
        ...(parentId && { parentCommentId: parentId.toString() }),
    });

    createActivity({
        actorId: req.user._id,
        type: 'comment_added',
        targetId: comment.targetId,
        targetType: comment.targetType,
        metadata: { commentPreview: content.trim().slice(0, 100), commentId: comment._id.toString() },
    }).catch(() => {});

    // Resolve the content owner and notify them
    let ownerId = null;
    try {
        if (targetType === 'note') {
            const n = await Note.findById(targetId).select('userId');
            ownerId = n?.userId?.toString();
        } else if (targetType === 'flashcardSet') {
            const s = await FlashcardSet.findById(targetId).select('userId');
            ownerId = s?.userId?.toString();
        } else if (targetType === 'task') {
            const t = await Task.findById(targetId).select('userId');
            ownerId = t?.userId?.toString();
        }
    } catch (_) {}

    const commentPreview = content.trim().slice(0, 120);

    if (ownerId && ownerId !== req.user._id.toString()) {
        // Socket emit and notify are independent — socket throws in test env so
        // keep them in separate try-catch blocks so notify always runs.
        try { getIO().to(`user:${ownerId}`).emit('comment_added', { targetType, targetId: targetId.toString() }); } catch (_) {}
        notify({
            recipientId: ownerId,
            actorId: req.user._id,
            type: 'comment_added',
            targetId,
            targetType,
            message: `${req.user.firstName} ${req.user.lastName} commented on your ${targetType === 'flashcardSet' ? 'flashcard set' : targetType}`,
            metadata: { commentPreview, commentId: comment._id.toString() },
            debounceMinutes: 2,
        }).catch(() => {});
    }

    // Notify the parent comment author on a reply
    if (parentId) {
        try {
            const parent = await Comment.findById(parentId).select('userId').lean();
            const parentAuthorId = parent?.userId?.toString();
            if (parentAuthorId && parentAuthorId !== req.user._id.toString() && parentAuthorId !== ownerId) {
                notify({
                    recipientId: parentAuthorId,
                    actorId: req.user._id,
                    type: 'comment_reply',
                    targetId: parentId,
                    targetType: 'comment',
                    message: `${req.user.firstName} ${req.user.lastName} replied to your comment`,
                    metadata: {
                        commentPreview,
                        commentId: comment._id.toString(),
                        resourceId: comment.targetId?.toString(),
                        resourceType: comment.targetType,
                    },
                    debounceMinutes: 2,
                }).catch(() => {});
            }
        } catch (_) {}
    }

    // Detect @username mentions and notify each mentioned user
    const mentionedUsernames = [...new Set(
        (content.match(/@([a-zA-Z0-9_]+)/g) || []).map(m => m.slice(1).toLowerCase())
    )];
    if (mentionedUsernames.length > 0) {
        try {
            const mentionedUsers = await User.find({
                username: { $in: mentionedUsernames },
                _id: { $ne: req.user._id },
            }).select('_id').lean();
            const alreadyNotified = new Set([
                req.user._id.toString(),
                ...(ownerId ? [ownerId] : []),
            ]);
            for (const u of mentionedUsers) {
                if (alreadyNotified.has(u._id.toString())) continue;
                notify({
                    recipientId: u._id,
                    actorId: req.user._id,
                    type: 'mention',
                    targetId: comment._id,
                    targetType: 'comment',
                    message: `${req.user.firstName} ${req.user.lastName} mentioned you in a comment`,
                    metadata: {
                        commentPreview,
                        commentId: comment._id.toString(),
                        resourceId: targetId.toString(),
                        resourceType: targetType,
                    },
                    debounceMinutes: 2,
                }).catch(() => {});
            }
        } catch (_) {}
    }

    res.status(201).json({ success: true, comment });
};

// ----------------------------------------
// GET /api/comments/:targetType/:targetId
// Purpose: Get all non-deleted comments on a target (top-level + replies), sorted oldest first
// Note: Returns a flat list. Each comment includes parentId so the frontend can build the thread.
// ----------------------------------------
exports.getComments = async (req, res) => {
    const { targetType, targetId } = req.params;

    const validTargetTypes = ['note', 'flashcardSet', 'task'];
    if (!validTargetTypes.includes(targetType)) {
        return res.status(400).json({
            success: false,
            error: `targetType must be one of: ${validTargetTypes.join(', ')}`,
        });
    }

    // Verify requester has access to the target before returning its comments
    const userId = req.user._id;
    if (targetType === 'note') {
        const note = await Note.findOne({ _id: targetId, deletedAt: null });
        if (!note) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = note.userId.toString() === userId.toString();
        const isShared = note.sharedWith.some(id => id.toString() === userId.toString());
        if (!isOwner && !isShared) {
            if (note.visibility !== 'friends') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            const friendship = await Friendship.findOne({
                $or: [
                    { user1: userId, user2: note.userId },
                    { user1: note.userId, user2: userId },
                ],
                status: 'accepted',
                deletedAt: null,
            });
            if (!friendship) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
        }
    } else if (targetType === 'flashcardSet') {
        const set = await FlashcardSet.findOne({ _id: targetId, deletedAt: null });
        if (!set) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = set.userId.toString() === userId.toString();
        const isShared = set.sharedWith.some(id => id.toString() === userId.toString());
        if (!isOwner && !isShared) {
            if (set.visibility !== 'friends') {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
            const friendship = await Friendship.findOne({
                $or: [
                    { user1: userId, user2: set.userId },
                    { user1: set.userId, user2: userId },
                ],
                status: 'accepted',
                deletedAt: null,
            });
            if (!friendship) {
                return res.status(403).json({ success: false, error: 'Access denied' });
            }
        }
    } else if (targetType === 'task') {
        const task = await Task.findOne({ _id: targetId, deletedAt: null });
        if (!task) return res.status(404).json({ success: false, error: 'Target not found' });
        const isOwner = task.userId.toString() === userId.toString();
        const isParticipant = task.participants.some(p => p.userId.toString() === userId.toString());
        if (!isOwner && !isParticipant) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
    }

    // Fetch all non-deleted comments on this target (top-level and replies together)
    // Client can group by parentId to build the thread
    const comments = await Comment.find({
        targetType,
        targetId,
        deletedAt: null,
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
};

// ----------------------------------------
// POST /api/comments/:id/like
// Purpose: Toggle like on a comment — adds userId if not present, removes if already liked
// ----------------------------------------
exports.toggleLike = async (req, res) => {
    const userId = req.user._id;

    // Check if the user has already liked this comment
    const comment = await Comment.findOne({ _id: req.params.id, deletedAt: null });

    if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const alreadyLiked = comment.likes.some(id => id.toString() === userId.toString());

    // Toggle: pull if liked, addToSet if not
    const update = alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };

    const updated = await Comment.findByIdAndUpdate(req.params.id, update, { new: true });

    // Only fire notifications/activity when adding a like, not removing
    if (!alreadyLiked) {
        // Notify the comment author instantly so their activity feed updates
        const commentAuthorId = comment.userId?.toString();
        if (commentAuthorId && commentAuthorId !== userId.toString()) {
            try {
                getIO().to(`user:${commentAuthorId}`).emit('like_added');
            } catch (_) {}
            const resourceLabel = comment.targetType === 'note'
                ? 'note'
                : comment.targetType === 'flashcardSet'
                    ? 'flashcard set'
                    : comment.targetType;
            notify({
                recipientId: commentAuthorId,
                actorId: userId,
                type: 'like_added',
                targetId: comment._id,
                targetType: 'comment',
                message: `${req.user.firstName} ${req.user.lastName} liked a comment on your ${resourceLabel}`,
                metadata: {
                    commentPreview: comment.content?.slice(0, 120),
                    commentId: comment._id.toString(),
                    resourceId: comment.targetId?.toString(),
                    resourceType: comment.targetType,
                },
                debounceMinutes: 2,
            }).catch(() => {});
        }
    }

    res.status(200).json({ success: true, liked: !alreadyLiked, comment: updated });
};

// ----------------------------------------
// DELETE /api/comments/:id
// Purpose: Soft delete a comment — only the author can delete their own comment
// ----------------------------------------
exports.deleteComment = async (req, res) => {
    const comment = await Comment.findOne({ _id: req.params.id, deletedAt: null });

    if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this comment' });
    }

    comment.deletedAt = new Date();
    await comment.save();

    res.status(200).json({ success: true, message: 'Comment deleted' });
};
