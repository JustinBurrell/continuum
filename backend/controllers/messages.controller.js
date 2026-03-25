const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// ============================================================
// MESSAGES CONTROLLER
// Purpose: Handle message-level actions
// Routes:
//   PUT    /api/messages/:id/read — mark a message as read
//   DELETE /api/messages/:id     — soft-delete a message for the requesting user only
// ============================================================

// ----------------------------------------
// markAsRead
// Purpose: Mark a message as read by the current user
// Side effects:
//   - Adds userId + readAt to message.readBy (if not already present)
//   - Resets the user's unreadCounts to 0 in the conversation
// ----------------------------------------
exports.markAsRead = async (req, res) => {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, deletedAt: null });

    if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        deletedAt: null,
    });

    if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
    }

    // Add to readBy only if not already present
    const alreadyRead = message.readBy.some(
        (r) => r.userId.toString() === userId.toString()
    );
    if (!alreadyRead) {
        message.readBy.push({ userId, readAt: new Date() });
        await message.save();
    }

    // Reset this user's unread count to 0 in the conversation
    const unreadEntry = conversation.unreadCounts.find(
        (u) => u.userId.toString() === userId.toString()
    );
    if (unreadEntry && unreadEntry.count > 0) {
        unreadEntry.count = 0;
        await conversation.save();
    }

    res.status(200).json({ success: true, message });
};

// ----------------------------------------
// deleteMessage
// Purpose: Soft-delete a message for the requesting user only (Instagram-style)
//   Adds req.user._id to message.deletedFor — the document is not removed.
//   getMessages filters deletedFor: { $ne: userId } so the message disappears
//   from the requester's view while the other participant is unaffected.
// ----------------------------------------
exports.deleteMessage = async (req, res) => {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, deletedAt: null });
    if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        deletedAt: null,
    });

    if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
    }

    const alreadyDeleted = message.deletedFor.some(
        (id) => id.toString() === userId.toString()
    );
    if (!alreadyDeleted) {
        message.deletedFor.push(userId);
        await message.save();
    }

    res.status(200).json({ success: true });
};
