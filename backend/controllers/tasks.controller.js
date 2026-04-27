const Task = require('../models/Task');
const Friendship = require('../models/Friendship');
const { createActivity, createShareActivities } = require('../services/activity.service');
const { sendShareMessage } = require('../services/share.service');
const { getIO } = require('../lib/socket');
const { getOrSet, invalidate, invalidatePattern } = require('../lib/cache');
const posthog = require('../lib/posthog');

// Emit an event to all task participants/owner except the actor
function emitToTaskAudience(event, task, actorId, payload = {}) {
    try {
        const io = getIO();
        const participantIds = (task.participants || []).map(p =>
            p.userId ? p.userId.toString() : p.toString()
        );
        const ownerId = task.userId?.toString();
        const all = [...new Set([ownerId, ...participantIds])];
        all.forEach(uid => {
            if (uid && uid !== actorId.toString()) {
                io.to(`user:${uid}`).emit(event, { taskId: task._id.toString(), ...payload });
            }
        });
    } catch (_) {}
}

function emitTaskUpdate(task, actorId) {
    emitToTaskAudience('task_updated', task, actorId);
}

// Bust all task/calendar caches for the owner + every participant on a task
async function invalidateSharedTasksCache(task) {
    const participantIds = (task.participants || []).map(p =>
        p.userId ? p.userId.toString() : p.toString()
    );
    const ownerId = task.userId?.toString();
    const all = [...new Set([ownerId, ...participantIds].filter(Boolean))];

    // Legacy shared-tasks keys
    if (participantIds.length) {
        invalidate(...participantIds.map(uid => `shared-tasks:${uid}`)).catch(() => {});
    }
    // Invalidate list + calendar caches for all affected users
    await Promise.all([
        ...all.map(uid => invalidatePattern(`tasks:${uid}`)),
        ...all.map(uid => invalidatePattern(`calendar:${uid}`)),
    ]).catch(() => {});
}

// ============================================================
// TASKS CONTROLLER
// Purpose: Handle business logic for all task CRUD endpoints
// Used by: routes/tasks.routes.js
// Endpoints: createTask, getTasks, getTaskById, updateTask,
//            updateStatus, deleteTask, getSharedTasks,
//            updateParticipantStatus
// ============================================================

// ----------------------------------------
// POST /api/tasks
// Purpose: Create a new task for the authenticated user
// Body: { title, dueDate (required), type, priority, description?,
//         noteId?, duration?, reminderMinutes?, recurrence?,
//         isShared?, participants? [{ userId }] }
// ----------------------------------------
exports.createTask = async (req, res) => {
    const {
        title,
        dueDate,
        type,
        priority,
        description,
        noteId,
        duration,
        reminderMinutes,
        recurrence,
        isShared,
        participants,
    } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, error: 'title is required' });
    }

    if (!dueDate) {
        return res.status(400).json({ success: false, error: 'dueDate is required' });
    }

    // Validate that all participants are accepted friends
    let validatedParticipants = [];
    if (isShared && Array.isArray(participants) && participants.length > 0) {
        const userId = req.user._id.toString();
        for (const p of participants) {
            const [u1, u2] = [userId, p.userId].sort();
            const friendship = await Friendship.findOne({ user1: u1, user2: u2, status: 'accepted', deletedAt: null });
            if (!friendship) {
                return res.status(403).json({ success: false, error: `User ${p.userId} is not an accepted friend` });
            }
        }
        validatedParticipants = participants.map((p) => ({ userId: p.userId, status: 'todo' }));
    }

    const task = await Task.create({
        userId: req.user._id,
        title,
        dueDate,
        type,
        priority,
        description,
        noteId: noteId || null,
        duration,
        reminderMinutes,
        recurrence,
        isShared: isShared || false,
        participants: isShared && Array.isArray(participants)
            ? validatedParticipants
            : [],
    });

    if (task.isShared && validatedParticipants.length > 0) {
        posthog.capture(req.user, 'task_shared', { taskId: task._id.toString(), recipientCount: validatedParticipants.length });

        createShareActivities({
            actorId: req.user._id,
            type: 'task_created',
            targetId: task._id,
            targetType: 'task',
            metadata: { taskTitle: title },
            recipientIds: validatedParticipants.map(p => p.userId),
        }).catch(() => {});

        // Send auto-message to each participant
        for (const p of validatedParticipants) {
            sendShareMessage(req.user._id, p.userId, 'task', title, task._id).catch(() => {});
        }

        // Notify participants in real-time — task just appeared in their shared list
        emitToTaskAudience('task_created', task, req.user._id);
        await invalidateSharedTasksCache(task);
    } else {
        // Non-shared task — only invalidate owner's caches
        await Promise.all([
            invalidatePattern(`tasks:${req.user._id.toString()}`),
            invalidatePattern(`calendar:${req.user._id.toString()}`),
        ]).catch(() => {});
    }

    res.status(201).json({ success: true, task });
};

// ----------------------------------------
// GET /api/tasks
// Purpose: List the authenticated user's tasks with optional filters
// Query params: status, type, priority, startDate, endDate
// Sorted by dueDate ascending (soonest first)
// ----------------------------------------
exports.getTasks = async (req, res) => {
    const { status, type, priority, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const filter = {
        userId: req.user._id,
        deletedAt: null,
    };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    if (startDate || endDate) {
        filter.dueDate = {};
        if (startDate) filter.dueDate.$gte = new Date(startDate);
        if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const cacheKey = `tasks:${req.user._id.toString()}:mine:${search || ''}:${status || ''}:${page}:${limit}`;
    const fetchTasks = async () => {
        const [tasks, total] = await Promise.all([
            Task.find(filter).sort({ dueDate: 1 }).skip(skip).limit(Number(limit)),
            Task.countDocuments(filter),
        ]);
        return { tasks, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
    };

    // Bypass cache when filtering by date range, type, or priority (too many variants)
    const bypassCache = !!(search || startDate || endDate || type || priority);
    const result = bypassCache
        ? await fetchTasks()
        : await getOrSet(cacheKey, 30, fetchTasks);

    res.status(200).json({ success: true, ...result });
};

// ----------------------------------------
// GET /api/tasks/:id
// Purpose: Get a single task by ID — only accessible by the owner
// ----------------------------------------
exports.getTaskById = async (req, res) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deletedAt: null,
    }).populate('participants.userId', 'username firstName lastName avatarUrl');

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Access check: owner or participant
    const userId = req.user._id.toString();
    const isOwner = task.userId.toString() === userId;
    const isParticipant = task.participants?.some(p => p.userId?._id?.toString() === userId || p.userId?.toString() === userId);

    if (!isOwner && !isParticipant) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.status(200).json({ success: true, task });
};

// ----------------------------------------
// PUT /api/tasks/:id
// Purpose: Update a task's fields (title, description, dueDate, type, priority, etc.)
// Does NOT handle status changes — use PATCH /:id/status for that
// Uses findOneAndUpdate (no hook needed for non-status updates)
// ----------------------------------------
exports.updateTask = async (req, res) => {
    const {
        title,
        description,
        dueDate,
        type,
        priority,
        noteId,
        duration,
        reminderMinutes,
        recurrence,
    } = req.body;

    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { title, description, dueDate, type, priority, noteId, duration, reminderMinutes, recurrence },
        { new: true, runValidators: true }
    );

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    emitTaskUpdate(task, req.user._id);
    invalidateSharedTasksCache(task);
    res.status(200).json({ success: true, task });
};

// ----------------------------------------
// PATCH /api/tasks/:id/status
// Purpose: Quick status update — triggers pre-save hook
//   - Hook auto-sets completedAt when status → 'completed'
//   - Hook auto-clears completedAt when status moves back to 'todo'/'in_progress'
//   - Hook creates next recurring task occurrence when completed
// Must use .save() (not findOneAndUpdate) to fire the pre-save hook
// ----------------------------------------
exports.updateStatus = async (req, res) => {
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: `status must be one of: ${validStatuses.join(', ')}`,
        });
    }

    const task = await Task.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Set the new status and call .save() to trigger the pre-save hook
    // The hook will: set completedAt if completed, generate next recurrence if recurring
    task.status = status;
    await task.save();

    emitTaskUpdate(task, req.user._id);
    invalidateSharedTasksCache(task);
    res.status(200).json({ success: true, task });
};

// ----------------------------------------
// DELETE /api/tasks/:id
// Purpose: Soft delete a task — sets deletedAt instead of removing from DB
// ----------------------------------------
exports.deleteTask = async (req, res) => {
    // Fetch before delete so we can read participants for socket emit
    const existing = await Task.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null });
    if (!existing) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await Task.findByIdAndUpdate(existing._id, { deletedAt: new Date() });

    // Notify participants — task disappeared from their shared list
    emitToTaskAudience('task_deleted', existing, req.user._id);
    invalidateSharedTasksCache(existing);

    res.status(200).json({ success: true, message: 'Task deleted' });
};

// ----------------------------------------
// GET /api/tasks/shared
// Purpose: List tasks the authenticated user is a participant in (not their own)
// Sorted by dueDate ascending (soonest first)
// ----------------------------------------
exports.getSharedTasks = async (req, res) => {
    const { search } = req.query;
    const userId = req.user._id;

    const fetchTasks = async () => {
        const filter = {
            isShared: true,
            'participants.userId': userId,
            userId: { $ne: userId },
            deletedAt: null,
        };
        if (search) filter.title = { $regex: search, $options: 'i' };
        const tasks = await Task.find(filter).sort({ dueDate: 1 });
        return { tasks };
    };

    const result = !search
        ? await getOrSet(`shared-tasks:${userId}`, 60, fetchTasks)
        : await fetchTasks();

    res.status(200).json({ success: true, ...result });
};

// ----------------------------------------
// PATCH /api/tasks/:id/participants
// Purpose: Add or remove participants on an existing shared task
// Body: { participants: [{ userId }] }
// Replaces the full participant list — all userIds must be accepted friends
// ----------------------------------------
exports.updateParticipants = async (req, res) => {
    const { participants } = req.body;

    if (!Array.isArray(participants)) {
        return res.status(400).json({ success: false, error: 'participants must be an array' });
    }

    const task = await Task.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Validate all participant userIds are accepted friends
    const userId = req.user._id.toString();
    for (const p of participants) {
        const [u1, u2] = [userId, p.userId].sort();
        const friendship = await Friendship.findOne({ user1: u1, user2: u2, status: 'accepted', deletedAt: null });
        if (!friendship) {
            return res.status(400).json({ success: false, error: `User ${p.userId} is not an accepted friend` });
        }
    }

    // Determine new participants (not in old list) for auto-messages
    const oldParticipantIds = new Set(task.participants.map(p => p.userId.toString()));
    const newParticipantEntries = participants.filter(p => !oldParticipantIds.has(p.userId.toString()));

    // Replace participants — preserve existing status for returning participants
    const updatedParticipants = participants.map(p => {
        const existing = task.participants.find(ep => ep.userId.toString() === p.userId.toString());
        return existing || { userId: p.userId, status: 'todo' };
    });

    task.participants = updatedParticipants;
    task.isShared = updatedParticipants.length > 0;
    await task.save();

    // Send auto-message to newly added participants
    for (const p of newParticipantEntries) {
        sendShareMessage(req.user._id, p.userId, 'task', task.title, task._id).catch(() => {});
    }

    // Fire activity when participants are added
    if (newParticipantEntries.length > 0) {
        createShareActivities({
            actorId: req.user._id,
            type: 'task_created',
            targetId: task._id,
            targetType: 'task',
            metadata: { taskTitle: task.title },
            recipientIds: newParticipantEntries.map(p => p.userId),
        }).catch(() => {});
    }

    emitTaskUpdate(task, req.user._id);
    invalidateSharedTasksCache(task);
    res.status(200).json({ success: true, task });
};

// ----------------------------------------
// PATCH /api/tasks/:id/participant-status
// Purpose: Let a participant update their own status entry on a shared task
// Body: { status } — one of 'todo' | 'in_progress' | 'completed'
// ----------------------------------------
exports.updateParticipantStatus = async (req, res) => {
    const { status } = req.body;

    const validStatuses = ['todo', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: `status must be one of: ${validStatuses.join(', ')}`,
        });
    }

    const task = await Task.findOne({
        _id: req.params.id,
        isShared: true,
        'participants.userId': req.user._id,
        deletedAt: null,
    });

    if (!task) {
        return res.status(404).json({ success: false, error: 'Shared task not found or you are not a participant' });
    }

    const participant = task.participants.find(
        (p) => p.userId.toString() === req.user._id.toString()
    );

    participant.status = status;
    participant.completedAt = status === 'completed' ? new Date() : null;

    await task.save();
    emitTaskUpdate(task, req.user._id);
    await invalidateSharedTasksCache(task);

    res.status(200).json({ success: true, task });
};
