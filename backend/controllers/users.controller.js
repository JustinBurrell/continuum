const User = require('../models/User');

// ============================================================
// USERS CONTROLLER
// Purpose: Handle business logic for user-facing endpoints
// Used by: routes/users.routes.js
// Endpoints: searchUsers
// ============================================================

// ----------------------------------------
// GET /api/users/search
// Purpose: Search for users by username or email (for friend requests)
// Query: ?q= (minimum 2 characters)
// Excludes the authenticated user from results
// ----------------------------------------
exports.searchUsers = async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(q.trim(), 'i');

    const users = await User.find({
        _id: { $ne: req.user._id },
        deletedAt: null,
        $or: [{ username: regex }, { email: regex }],
    })
        .select('username firstName lastName')
        .limit(20);

    res.status(200).json({ success: true, users });
};
