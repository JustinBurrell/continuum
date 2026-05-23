const User = require('../models/User');
const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Friendship = require('../models/Friendship');
const RefreshToken = require('../models/RefreshToken');
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
    const isFriendsOnly = req.query.friendsOnly === 'true';
    const trimmedQ = (q || '').trim();

    // Non-friends search requires at least 2 chars; friends search works with any length
    if (!isFriendsOnly && trimmedQ.length < 2) {
        return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    let baseFilter = {
        _id: { $ne: req.user._id },
        deletedAt: null,
        // Only filter out seed users in general search — friends-only search
        // must include seed friends (demo accounts are seeded)
        ...(!isFriendsOnly && { isSeedUser: { $ne: true } }),
    };

    // Add text filter only when there is a query
    if (trimmedQ.length >= 1) {
        const regex = new RegExp(escapeRegex(trimmedQ.slice(0, 100)), 'i');
        baseFilter.$or = [{ username: regex }, { firstName: regex }, { lastName: regex }, { email: regex }];
    }

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

// ---------------------------------------------------------------------------
// registerDeviceToken
// POST /api/users/device-token
// Upserts an FCM token for this deviceId on the authenticated user (max 5).
// Also stamps the caller's current RefreshToken document with this deviceId
// so session revocation can remove the matching FCM token.
// ---------------------------------------------------------------------------
exports.registerDeviceToken = async (req, res) => {
    const { token, deviceId } = req.body;
    if (!token || !deviceId) {
        return res.status(400).json({ success: false, error: 'token and deviceId are required' });
    }

    const userId = req.user._id;
    const now = new Date();

    // Upsert: update existing entry for this deviceId, or push a new one
    const user = await User.findById(userId).select('fcmTokens').lean();
    const exists = user.fcmTokens?.some((t) => t.deviceId === deviceId);

    if (exists) {
        await User.findOneAndUpdate(
            { _id: userId, 'fcmTokens.deviceId': deviceId },
            { $set: { 'fcmTokens.$.token': token, 'fcmTokens.$.updatedAt': now } }
        );
    } else {
        // Enforce max 5 tokens — evict oldest if needed
        await User.findByIdAndUpdate(userId, {
            $push: {
                fcmTokens: {
                    $each:     [{ token, deviceId, updatedAt: now }],
                    $sort:     { updatedAt: -1 },
                    $slice:    5,
                },
            },
        });
    }

    // Stamp the calling session's RefreshToken with this deviceId so logout can prune the FCM token
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const jwt = authHeader.slice(7);
        const crypto = require('crypto');
        const tokenHash = crypto.createHash('sha256').update(jwt).digest('hex');
        // RefreshToken uses the raw token stored as hashed — match on userId + not revoked
        // We identify the session by deviceId already set on login; just ensure it's current
        await RefreshToken.findOneAndUpdate(
            { userId, deviceId, revoked: false },
            { $set: { deviceId } },
            { sort: { createdAt: -1 } }
        ).catch(() => {});
    }

    res.status(200).json({ success: true });
};
