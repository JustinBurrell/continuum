const Friendship = require('../models/Friendship');
const User = require('../models/User');

// ============================================================
// FRIENDS CONTROLLER
// Purpose: Handle business logic for friend request endpoints
// Used by: routes/friends.routes.js
// Endpoints: sendRequest, respondToRequest, getFriends, removeFriend
// ============================================================

// Helper: return { user1, user2 } sorted so user1 < user2
// Matches the ordering enforced by the Friendship pre-save hook
const sortedPair = (a, b) =>
    a.toString() < b.toString()
        ? { user1: a, user2: b }
        : { user1: b, user2: a };

// ----------------------------------------
// POST /api/friends/request
// Purpose: Send a friend request to another user
// Body: { recipientId }
// ----------------------------------------
exports.sendRequest = async (req, res) => {
    const { recipientId } = req.body;

    if (!recipientId) {
        return res.status(400).json({ success: false, error: 'recipientId is required' });
    }

    if (recipientId === req.user._id.toString()) {
        return res.status(400).json({ success: false, error: 'You cannot send a friend request to yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Look up any existing friendship between these two users (including soft-deleted)
    const { user1, user2 } = sortedPair(req.user._id, recipientId);
    const existing = await Friendship.findOne({ user1, user2 });

    if (existing) {
        if (existing.deletedAt === null || existing.deletedAt === undefined) {
            if (existing.status === 'pending') {
                return res.status(400).json({ success: false, error: 'Friend request already pending' });
            }
            if (existing.status === 'accepted') {
                return res.status(400).json({ success: false, error: 'Already friends' });
            }
            if (existing.status === 'rejected') {
                return res.status(400).json({ success: false, error: 'Friend request was previously rejected' });
            }
        }
        // Soft-deleted friendship — reactivate as a new pending request
        existing.status = 'pending';
        existing.requestedBy = req.user._id;
        existing.requestedAt = new Date();
        existing.respondedAt = undefined;
        existing.deletedAt = null;
        const friendship = await existing.save();
        return res.status(201).json({ success: true, friendship });
    }

    // Pass user1/user2 in any order — pre-save hook enforces user1 < user2
    const friendship = await Friendship.create({
        user1: req.user._id,
        user2: recipientId,
        requestedBy: req.user._id,
        requestedAt: new Date(),
    });

    res.status(201).json({ success: true, friendship });
};

// ----------------------------------------
// PUT /api/friends/request/:id
// Purpose: Accept or reject a pending friend request
// Body: { action: "accept" | "reject" }
// Note: Only the recipient (not the sender) can respond
// ----------------------------------------
exports.respondToRequest = async (req, res) => {
    const { action } = req.body;

    if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, error: 'action must be "accept" or "reject"' });
    }

    const friendship = await Friendship.findOne({
        _id: req.params.id,
        status: 'pending',
        deletedAt: null,
    });

    if (!friendship) {
        return res.status(404).json({ success: false, error: 'Pending friend request not found' });
    }

    const userId = req.user._id.toString();
    const isParticipant =
        friendship.user1.toString() === userId || friendship.user2.toString() === userId;
    const isSender = friendship.requestedBy.toString() === userId;

    if (!isParticipant || isSender) {
        return res.status(403).json({ success: false, error: 'You cannot respond to your own request' });
    }

    friendship.status = action === 'accept' ? 'accepted' : 'rejected';
    friendship.respondedAt = new Date();
    await friendship.save();

    res.status(200).json({ success: true, friendship });
};

// ----------------------------------------
// GET /api/friends
// Purpose: List accepted friends (default) or incoming pending requests
// Query: ?status=pending  → incoming requests only (sent by someone else)
// ----------------------------------------
exports.getFriends = async (req, res) => {
    const userId = req.user._id;
    const { status, search } = req.query;

    const filter = { deletedAt: null };

    if (status === 'pending') {
        filter.status = 'pending';
        filter.requestedBy = { $ne: userId };
        filter.$or = [{ user1: userId }, { user2: userId }];
    } else if (status === 'sent') {
        filter.status = 'pending';
        filter.requestedBy = userId;
        filter.$or = [{ user1: userId }, { user2: userId }];
    } else {
        filter.status = 'accepted';
        // If searching, find matching user IDs first, then constrain the friendship query
        if (search) {
            const User = require('../models/User');
            const regex = new RegExp(search, 'i');
            const matchingUsers = await User.find({
                _id: { $ne: userId },
                $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
            }).select('_id');
            const matchingIds = matchingUsers.map(u => u._id);
            // Current user must be one side, matched user must be the other
            filter.$or = [
                { user1: userId, user2: { $in: matchingIds } },
                { user2: userId, user1: { $in: matchingIds } },
            ];
        } else {
            filter.$or = [{ user1: userId }, { user2: userId }];
        }
    }

    const friendships = await Friendship.find(filter)
        .populate('user1', 'username firstName lastName avatarUrl')
        .populate('user2', 'username firstName lastName avatarUrl')
        .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, friendships });
};

// ----------------------------------------
// DELETE /api/friends/:id
// Purpose: Remove an accepted friend — soft delete via deletedAt
// ----------------------------------------
exports.removeFriend = async (req, res) => {
    const userId = req.user._id.toString();

    const friendship = await Friendship.findOneAndUpdate(
        {
            _id: req.params.id,
            status: 'accepted',
            deletedAt: null,
            $or: [{ user1: userId }, { user2: userId }],
        },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!friendship) {
        return res.status(404).json({ success: false, error: 'Friendship not found' });
    }

    res.status(200).json({ success: true, message: 'Friend removed' });
};

// ----------------------------------------
// DELETE /api/friends/request/:id
// Purpose: Cancel a pending outgoing friend request
// ----------------------------------------
exports.cancelRequest = async (req, res) => {
    const userId = req.user._id;

    const friendship = await Friendship.findOneAndUpdate(
        {
            _id: req.params.id,
            requestedBy: userId,
            status: 'pending',
            deletedAt: null,
        },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!friendship) {
        return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.status(200).json({ success: true, message: 'Friend request cancelled' });
};
