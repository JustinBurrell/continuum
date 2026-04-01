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
    const rawCursor = req.query.cursor || null;
    const { search, since } = req.query;

    const userId = req.user._id;
    const useCache = !search;

    // Cursor is a compound "ISO|objectId" string so duplicate createdAt timestamps
    // don't cause items to be skipped between pages.
    let cursorTs = null;
    let cursorId = null;
    if (rawCursor) {
        const sep = rawCursor.lastIndexOf('|');
        cursorTs = new Date(rawCursor.slice(0, sep));
        cursorId = rawCursor.slice(sep + 1);
    }

    const cacheKey = `activity:${userId}:${rawCursor || 'first'}:${limit}`;

    // Base filter — no cursor constraint, used for the total count
    const baseFilter = {
        $or: [
            { visibleTo: userId },
            { isPublic: true },
        ],
    };

    if (search) {
        const User = require('../models/User');
        const regex = { $regex: search, $options: 'i' };
        const matchingUsers = await User.find({
            $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
        }).select('_id');
        const matchingUserIds = matchingUsers.map(u => u._id);

        baseFilter.$and = [{
            $or: [
                { 'metadata.noteTitle': regex },
                { 'metadata.setTitle': regex },
                { 'metadata.taskTitle': regex },
                { 'metadata.commentPreview': regex },
                ...(matchingUserIds.length > 0 ? [{ userId: { $in: matchingUserIds } }] : []),
            ],
        }];
    }

    const fetchFeed = async () => {
        // Compound cursor: items strictly before the cursor timestamp,
        // OR same timestamp but with a smaller _id — handles duplicate createdAt values.
        // Use $and to combine with baseFilter so the visibility check is never overwritten.
        const pagedFilter = cursorTs
            ? { $and: [baseFilter, { $or: [
                { createdAt: { $lt: cursorTs } },
                { createdAt: cursorTs, _id: { $lt: cursorId } },
            ]}]}
            : baseFilter;

        const feedRaw = await Activity.find(pagedFilter)
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1)
            .populate('userId', 'firstName lastName username avatarUrl roles');

        const hasMore = feedRaw.length > limit;
        const items = hasMore ? feedRaw.slice(0, limit) : feedRaw;
        const last = items[items.length - 1];
        const nextCursor = hasMore
            ? `${last.createdAt.toISOString()}|${last._id.toString()}`
            : null;

        return { feed: items, nextCursor };
    };

    // `since` — optional ISO timestamp; when present, count only activities newer than it
    // (used by the dashboard to show unseen/unread count since the user last visited /activity)
    const countFilter = since
        ? { ...baseFilter, createdAt: { $gt: new Date(since) } }
        : baseFilter;

    // Cache each cursor page for 5 minutes — pages are stable (new items always land above the cursor)
    // total is always fresh (not cached) so it never goes stale after a seed re-run or new activity
    const [result, total] = await Promise.all([
        useCache ? getOrSet(cacheKey, 300, fetchFeed) : fetchFeed(),
        Activity.countDocuments(countFilter),
    ]);

    res.status(200).json({ success: true, ...result, total });
};

// ----------------------------------------
// PUT /api/activity/mark-seen
// Purpose: Set lastViewedActivityAt to now on the authenticated user.
// Called when the user opens the /activity page so the dashboard unseen count resets.
// Response: { success: true }
// ----------------------------------------
exports.markSeen = async (req, res) => {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { lastViewedActivityAt: new Date() });
    res.status(200).json({ success: true });
};
