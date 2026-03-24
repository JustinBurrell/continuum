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
    const { search } = req.query;

    const filter = {
        $or: [
            { visibleTo: req.user._id },
            { isPublic: true },
        ],
        createdAt: { $lte: new Date() },
    };

    if (search) {
        const User = require('../models/User');
        const regex = { $regex: search, $options: 'i' };
        const matchingUsers = await User.find({
            $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
        }).select('_id');
        const matchingUserIds = matchingUsers.map(u => u._id);

        filter.$and = [{
            $or: [
                { 'metadata.noteTitle': regex },
                { 'metadata.setTitle': regex },
                { 'metadata.taskTitle': regex },
                { 'metadata.commentPreview': regex },
                ...(matchingUserIds.length > 0 ? [{ userId: { $in: matchingUserIds } }] : []),
            ],
        }];
    }

    const [feed, total] = await Promise.all([
        Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate('userId', 'firstName lastName username avatarUrl'),
        Activity.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, feed, total });
};
