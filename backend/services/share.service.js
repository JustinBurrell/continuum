const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ============================================================
// SHARE SERVICE
// Purpose: Send auto-messages when content is shared with a friend
// Used by: notes.controller, flashcardSets.controller, tasks.controller
// ============================================================

/**
 * sendShareMessage
 * Finds or creates a conversation between sharer and recipient,
 * then sends a system-style message with a link to the shared content.
 *
 * @param {ObjectId} sharerId     — user who shared the content
 * @param {ObjectId} recipientId  — user receiving the share
 * @param {String}   contentType  — 'note' | 'flashcardSet' | 'task'
 * @param {String}   contentTitle — title of the shared content
 * @param {ObjectId} contentId    — ID of the shared content
 */
const sendShareMessage = async (sharerId, recipientId, contentType, contentTitle, contentId) => {
    // Sort IDs to match the canonical pair convention used by startConversation
    const participants = [sharerId.toString(), recipientId.toString()].sort();

    // Find or create conversation
    let conversation = await Conversation.findOne({
        participants: { $all: participants },
        deletedAt: null,
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants,
            unreadCounts: [
                { userId: participants[0], count: 0 },
                { userId: participants[1], count: 0 },
            ],
        });
    }

    // Build message content with parseable prefix
    const content = `[shared:${contentType}:${contentId}] Shared a ${contentType === 'flashcardSet' ? 'flashcard set' : contentType} with you: "${contentTitle}"`;

    const message = await Message.create({
        conversationId: conversation._id,
        senderId: sharerId,
        content,
    });

    // Update denormalized last message preview
    conversation.lastMessage = {
        senderId: sharerId,
        content: content.substring(0, 200),
        sentAt: message.createdAt,
    };

    // Increment unread count for recipient
    const unreadEntry = conversation.unreadCounts.find(
        (u) => u.userId.toString() === recipientId.toString()
    );
    if (unreadEntry) {
        unreadEntry.count += 1;
    } else {
        conversation.unreadCounts.push({ userId: recipientId, count: 1 });
    }

    await conversation.save();
};

module.exports = { sendShareMessage };
