const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Friendship = require('../models/Friendship');
const { getIO } = require('../lib/socket');
const posthog = require('../lib/posthog');
const { invalidatePattern } = require('../lib/cache');
const { notify } = require('../services/notification.service');

// ============================================================
// CONVERSATIONS CONTROLLER
// Purpose: Handle all messaging endpoints — conversations and messages
// Routes:
//   POST   /api/conversations              — start or get existing conversation
//   GET    /api/conversations              — list user's inbox
//   DELETE /api/conversations/:id          — soft-delete conversation for current user only
//   POST   /api/conversations/:id/messages — send a message
//   GET    /api/conversations/:id/messages — get messages (paginated)
// ============================================================

// ----------------------------------------
// startConversation
// Purpose: Find or create a 1-on-1 conversation with another user
// Idempotent: returns existing conversation if one already exists
// ----------------------------------------
exports.startConversation = async (req, res) => {
    const { participantId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
        return res.status(400).json({ success: false, error: 'participantId is required' });
    }

    if (participantId === userId.toString()) {
        return res.status(400).json({ success: false, error: 'You cannot start a conversation with yourself' });
    }

    // Verify accepted friendship exists before allowing DMs
    const [u1, u2] = [userId.toString(), participantId].sort();
    const friendship = await Friendship.findOne({ user1: u1, user2: u2, status: 'accepted', deletedAt: null });
    if (!friendship) {
        return res.status(403).json({ success: false, error: 'You can only message accepted friends' });
    }

    // Sort IDs to create a canonical pair — prevents [A,B] vs [B,A] duplicates
    const participants = [userId, participantId].sort();

    // Check if an active (not deleted for this user) conversation already exists
    const existing = await Conversation.findOne({
        participants: { $all: participants },
        deletedAt: null,
        deletedFor: { $ne: userId },
    }).populate('participants', 'username firstName lastName avatarUrl roles');

    if (existing) {
        await Promise.all([
            invalidatePattern(`conversations:${userId.toString()}`),
            invalidatePattern(`conversations:${participantId}`),
        ]).catch(() => {});
        return res.status(200).json({ success: true, conversation: existing });
    }

    // Create new conversation with unread counts initialized to 0 for both participants
    const conversation = await Conversation.create({
        participants,
        unreadCounts: [
            { userId, count: 0 },
            { userId: participantId, count: 0 },
        ],
    });

    await conversation.populate('participants', 'username firstName lastName avatarUrl roles');

    await Promise.all([
        invalidatePattern(`conversations:${userId.toString()}`),
        invalidatePattern(`conversations:${participantId}`),
    ]).catch(() => {});

    res.status(201).json({ success: true, conversation });
};

// ----------------------------------------
// getConversations
// Purpose: List the current user's inbox, sorted by most recent message
// ----------------------------------------
exports.getConversations = async (req, res) => {
    const userId = req.user._id;
    const { search } = req.query;

    const filter = { participants: userId, deletedAt: null, deletedFor: { $ne: userId } };

    if (search) {
        const User = require('../models/User');
        const regex = new RegExp(search, 'i');
        const matchingUsers = await User.find({
            _id: { $ne: userId },
            $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
        }).select('_id');
        const matchingIds = matchingUsers.map(u => u._id);
        filter.$and = [{ participants: { $in: matchingIds } }];
    }

    const fetchConversations = async () => {
        const convs = await Conversation.find(filter)
            .populate('participants', 'username firstName lastName avatarUrl roles')
            .sort({ 'lastMessage.sentAt': -1, createdAt: -1 });
        return convs.map(conv => {
            const raw = conv.toObject();
            const entry = raw.unreadCounts?.find(u => u.userId?.toString() === userId.toString());
            raw.unreadCount = entry?.count ?? 0;
            return raw;
        });
    };

    // Search queries bypass cache (dynamic); non-search uses 30s cache per user
    const conversations = await fetchConversations();

    res.status(200).json({ success: true, conversations });
};

// ----------------------------------------
// deleteConversation
// Purpose: Instagram-style per-user delete — hides conversation from the current
//          user's inbox without affecting the other participant's view
// ----------------------------------------
exports.deleteConversation = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({ _id: conversationId, deletedAt: null });
    if (!conversation) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        return res.status(403).json({ success: false, error: 'You are not a participant in this conversation' });
    }

    if (!conversation.deletedFor.some((id) => id.toString() === userId.toString())) {
        conversation.deletedFor.push(userId);
        await conversation.save();
    }

    await invalidatePattern(`conversations:${userId.toString()}`).catch(() => {});

    res.status(200).json({ success: true });
};

// ----------------------------------------
// sendMessage
// Purpose: Send a message in a conversation
// Side effects:
//   - Updates conversation.lastMessage (denormalized inbox preview)
//   - Increments unread count for the other participant
// ----------------------------------------
exports.sendMessage = async (req, res) => {
    const { id: conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'content is required' });
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
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

    const message = await Message.create({
        conversationId,
        senderId: userId,
        content: content.trim(),
    });

    // Update denormalized last message preview on the conversation
    conversation.lastMessage = {
        senderId: userId,
        content: content.trim().substring(0, 200),
        sentAt: message.createdAt,
    };

    // Increment unread count for the other participant
    const otherParticipantId = conversation.participants.find(
        (p) => p.toString() !== userId.toString()
    );
    if (otherParticipantId) {
        const unreadEntry = conversation.unreadCounts.find(
            (u) => u.userId.toString() === otherParticipantId.toString()
        );
        if (unreadEntry) {
            unreadEntry.count += 1;
        } else {
            conversation.unreadCounts.push({ userId: otherParticipantId, count: 1 });
        }
    }

    await conversation.save();

    await message.populate('senderId', 'username firstName lastName avatarUrl roles');

    // Notify the recipient in real-time (socket) and via notification bell
    if (otherParticipantId) {
        try {
            getIO().to(`user:${otherParticipantId}`).emit('new_message', {
                conversationId: conversationId.toString(),
                message,
            });
        } catch (_) {}

        notify({
            recipientId: otherParticipantId,
            actorId: userId,
            type: 'new_message',
            targetId: conversationId,
            targetType: 'conversation',
            message: `${req.user.firstName} sent you a message`,
            debounceMinutes: 5,
        }).catch(() => {});
    }

    await Promise.all([
        invalidatePattern(`conversations:${userId.toString()}`),
        otherParticipantId ? invalidatePattern(`conversations:${otherParticipantId.toString()}`) : Promise.resolve(),
    ]).catch(() => {});

    res.status(201).json({ success: true, message });
};

// ----------------------------------------
// getMessages
// Purpose: Get paginated messages in a conversation (newest first)
// Query params:
//   limit  — number of messages to return (default 50, max 100)
//   before — ISO date cursor, returns only messages created before this timestamp
// ----------------------------------------
exports.getMessages = async (req, res) => {
    const { id: conversationId } = req.params;
    const userId = req.user._id;
    const { search } = req.query;

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const conversation = await Conversation.findOne({
        _id: conversationId,
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

    const msgFilter = {
        conversationId,
        deletedAt: null,
        deletedFor: { $ne: userId },
        createdAt: { $lt: before },
    };

    if (search) msgFilter.content = { $regex: search, $options: 'i' };

    const messages = await Message.find(msgFilter)
        .populate('senderId', 'username firstName lastName avatarUrl roles')
        .sort({ createdAt: -1 })
        .limit(limit + 1);

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    res.status(200).json({ success: true, messages, hasMore });
};
