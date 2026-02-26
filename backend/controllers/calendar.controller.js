const Task = require('../models/Task');

// ============================================================
// CALENDAR CONTROLLER
// Purpose: Aggregate tasks for calendar rendering
// Used by: routes/calendar.routes.js
// Endpoints: getCalendar
// ============================================================

// ----------------------------------------
// GET /api/calendar
// Purpose: Aggregate owned + shared tasks by date range for calendar rendering
// Query params:
//   from (required) — start date, ISO 8601
//   to   (required) — end date, ISO 8601 (inclusive, extended to 23:59:59)
//   view (optional) — 'week' | 'month' — returned in response meta only
// Response:
//   days    — tasks grouped by YYYY-MM-DD key (owned + participated)
//   overdue — all tasks past due + not completed (regardless of range)
// ----------------------------------------
exports.getCalendar = async (req, res) => {
    const { from, to, view } = req.query;

    if (!from || !to) {
        return res.status(400).json({
            success: false,
            error: 'from and to query params are required (ISO 8601)',
        });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate) || isNaN(toDate)) {
        return res.status(400).json({
            success: false,
            error: 'from and to must be valid ISO 8601 dates',
        });
    }

    // Extend toDate to end of day so tasks due on that day are included
    toDate.setHours(23, 59, 59, 999);

    const userId = req.user._id;
    const now = new Date();

    // Owned tasks in date range
    const ownedTasks = await Task.find({
        userId,
        deletedAt: null,
        dueDate: { $gte: fromDate, $lte: toDate },
    }).sort({ dueDate: 1 });

    // Shared tasks user is a participant in (exclude owned to avoid duplication)
    const participantTasks = await Task.find({
        isShared: true,
        'participants.userId': userId,
        userId: { $ne: userId },
        deletedAt: null,
        dueDate: { $gte: fromDate, $lte: toDate },
    }).sort({ dueDate: 1 });

    // Group all in-range tasks by YYYY-MM-DD
    const days = {};
    for (const task of [...ownedTasks, ...participantTasks]) {
        const dateKey = task.dueDate.toISOString().split('T')[0];
        if (!days[dateKey]) days[dateKey] = [];
        days[dateKey].push(task);
    }

    // Overdue: past due, not completed, not deleted — owned + participated
    const overdue = await Task.find({
        $or: [
            { userId },
            { isShared: true, 'participants.userId': userId },
        ],
        deletedAt: null,
        status: { $ne: 'completed' },
        dueDate: { $lt: now },
    }).sort({ dueDate: 1 });

    res.status(200).json({
        success: true,
        view: view || null,
        from: fromDate,
        to: toDate,
        days,
        overdue,
    });
};
