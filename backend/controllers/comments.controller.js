const Comment = require('../models/Comment');

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

    // If parentId is provided, verify the parent comment exists and is on the same target
    if (parentId) {
        const parent = await Comment.findOne({ _id: parentId, deletedAt: null });
        if (!parent) {
            return res.status(404).json({ success: false, error: 'Parent comment not found' });
        }
        if (parent.targetId.toString() !== targetId || parent.targetType !== targetType) {
            return res.status(400).json({ success: false, error: 'parentId must belong to the same target' });
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

    res.status(201).json({ success: true, comment });
};

// ----------------------------------------
// GET /api/comments/:targetType/:targetId
// Purpose: Get all top-level comments on a target, sorted newest first
// Note: Returns top-level comments only (parentId: null)
//       Replies are nested under each comment via the replies virtual
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

    // Fetch all non-deleted comments on this target (top-level and replies together)
    // Client can group by parentId to build the thread
    const comments = await Comment.find({
        targetType,
        targetId,
        deletedAt: null,
    }).sort({ createdAt: -1 });

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

    res.status(200).json({ success: true, liked: !alreadyLiked, comment: updated });
};

// ----------------------------------------
// DELETE /api/comments/:id
// Purpose: Soft delete a comment — only the author can delete their own comment
// ----------------------------------------
exports.deleteComment = async (req, res) => {
    const comment = await Comment.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    res.status(200).json({ success: true, message: 'Comment deleted' });
};
