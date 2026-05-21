const User = require('../models/User');
const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Friendship = require('../models/Friendship');
const { getCachedStreak } = require('../services/studyStreak.service');

// ============================================================
// USERS CONTROLLER
// Purpose: Handle business logic for user-facing endpoints
// Used by: routes/users.routes.js
// Endpoints: searchUsers
// ============================================================

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ----------------------------------------
// GET /api/users/search
// Purpose: Search for users by username or email (for friend requests)
// Query: ?q= (minimum 2 characters)
// Excludes the authenticated user from results
// ----------------------------------------
// ----------------------------------------
// GET /api/users/:id
// Purpose: Get another user's public profile
// Returns only public-safe fields — no email, no tokens, no settings
// ----------------------------------------
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const [user, notesCount, setsCount] = await Promise.all([
            User.findOne({ _id: userId, deletedAt: null })
                .select('username firstName lastName avatarUrl bio createdAt roles linkedinUrl instagramHandle'),
            Note.countDocuments({ userId, deletedAt: null }),
            FlashcardSet.countDocuments({ userId }),
        ]);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, user: { ...user.toObject(), notesCount, setsCount } });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        throw err;
    }
};

// ----------------------------------------
// GET /api/users/:id/streak
// Purpose: Return another user's current study streak (public, numbers only).
//          Does not expose lastStudiedAt or session details.
// ----------------------------------------
exports.getUserStreak = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, deletedAt: null }).select('_id');
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    const streak = await getCachedStreak(req.params.id);
    res.status(200).json({ success: true, streak });
};

exports.searchUsers = async (req, res) => {
    // Exact username lookup for @mention click navigation — bypasses all filters
    if (req.query.exactUsername) {
        const user = await User.findOne({
            username: req.query.exactUsername.trim(),
            deletedAt: null,
        }).select('username firstName lastName avatarUrl roles');
        return res.status(200).json({ success: true, users: user ? [user] : [] });
    }

    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(escapeRegex(q.trim().slice(0, 100)), 'i');
    const isFriendsOnly = req.query.friendsOnly === 'true';

    let baseFilter = {
        _id: { $ne: req.user._id },
        deletedAt: null,
        // Only filter out seed users in general search — friends-only search
        // must include seed users since demo friends are seeded accounts
        ...(!isFriendsOnly && { isSeedUser: { $ne: true } }),
        $or: [{ username: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
    };

    if (isFriendsOnly) {
        const friendships = await Friendship.find({
            $or: [{ user1: req.user._id, status: 'accepted' }, { user2: req.user._id, status: 'accepted' }],
        }).select('user1 user2').lean();
        const friendIds = friendships.map(f =>
            f.user1.toString() === req.user._id.toString() ? f.user2 : f.user1
        );
        baseFilter._id = { $ne: req.user._id, $in: friendIds };
    }

    const users = await User.find(baseFilter)
        .select('username firstName lastName avatarUrl roles')
        .limit(20);

    res.status(200).json({ success: true, users });
};
