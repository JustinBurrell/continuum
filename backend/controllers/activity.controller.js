const Activity = require('../models/Activity');

// ============================================================
// ACTIVITY CONTROLLER
// Purpose: Handle business logic for the activity feed endpoint
// Used by: routes/activity.routes.js
// Endpoints: getActivityFeed
// ============================================================

// ----------------------------------------
// GET /api/activity
// Purpose: Return the authenticated user's activity feed
// Shows activities from friends (or public) based on each actor's activityVisibility setting
// Query params: limit (default 20, max 50), offset (default 0)
// ----------------------------------------
exports.getActivityFeed = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const feed = await Activity.find({
        $or: [
            { visibleTo: req.user._id },
            { isPublic: true },
        ],
    })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('userId', 'firstName lastName username avatarUrl');

    res.status(200).json({ success: true, feed });
};
