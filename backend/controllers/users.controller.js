const User = require('../models/User');

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
        const user = await User.findOne({ _id: req.params.id, deletedAt: null })
            .select('username firstName lastName avatarUrl bio createdAt');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, user });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        throw err;
    }
};

exports.searchUsers = async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(escapeRegex(q.trim().slice(0, 100)), 'i');

    const users = await User.find({
        _id: { $ne: req.user._id },
        deletedAt: null,
        $or: [{ username: regex }, { email: regex }],
    })
        .select('username firstName lastName')
        .limit(20);

    res.status(200).json({ success: true, users });
};
