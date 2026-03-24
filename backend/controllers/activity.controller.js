const Activity = require('../models/Activity');
const { getOrSet } = require('../lib/cache');

// ============================================================
// ACTIVITY CONTROLLER
// Purpose: Handle business logic for the activity feed endpoint
// Used by: routes/activity.routes.js
// Endpoints: getActivityFeed
// ============================================================

// ----------------------------------------
// GET /api/activity
// Purpose: Return the authenticated user's activity feed using cursor pagination.
// Cursor is the createdAt timestamp of the last item on the previous page.
// Each cursor page is cached independently — pages are stable and never change.
// Query params: limit (default 20, max 50), cursor (ISO date string), search
// Response: { feed, nextCursor } — nextCursor is null when no more results
// ----------------------------------------
exports.getActivityFeed = async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor || null;
    const { search } = req.query;

    const userId = req.user._id;
    const useCache = !search;
    const cacheKey = `activity:${userId}:${cursor || 'first'}`;

    const fetchFeed = async () => {
        const filter = {
            $or: [
                { visibleTo: userId },
                { isPublic: true },
            ],
            createdAt: cursor
                ? { $lt: new Date(cursor) }
                : { $lte: new Date() },
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

        const feed = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit + 1) // fetch one extra to determine if there is a next page
            .populate('userId', 'firstName lastName username avatarUrl');

        const hasMore = feed.length > limit;
        const items = hasMore ? feed.slice(0, limit) : feed;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        return { feed: items, nextCursor };
    };

    // Cache each cursor page for 5 minutes — pages are stable (new items always land above the cursor)
    const result = useCache
        ? await getOrSet(cacheKey, 300, fetchFeed)
        : await fetchFeed();

    res.status(200).json({ success: true, ...result });
};
