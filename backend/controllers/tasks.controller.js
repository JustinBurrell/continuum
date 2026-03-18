const Task = require('../models/Task');
const Friendship = require('../models/Friendship');
const { createActivity } = require('../services/activity.service');
const { sendShareMessage } = require('../services/share.service');

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

    if (task.isShared) {
        createActivity({
            actorId: req.user._id,
            type: 'task_created',
            targetId: task._id,
            targetType: 'task',
            metadata: { taskTitle: title, dueDate },
        }).catch(() => {});

        // Send auto-message to each participant
        for (const p of validatedParticipants) {
            sendShareMessage(req.user._id, p.userId, 'task', title, task._id).catch(() => {});
        }
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
    const { status, type, priority, startDate, endDate } = req.query;

    const filter = {
        userId: req.user._id,
        deletedAt: null,
    };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    // Date range filter on dueDate
    if (startDate || endDate) {
        filter.dueDate = {};
        if (startDate) filter.dueDate.$gte = new Date(startDate);
        if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    const tasks = await Task.find(filter).sort({ dueDate: 1 });

    res.status(200).json({ success: true, tasks });
};

// ----------------------------------------
// GET /api/tasks/:id
// Purpose: Get a single task by ID — only accessible by the owner
// ----------------------------------------
exports.getTaskById = async (req, res) => {
    const task = await Task.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    }).populate('participants.userId', 'username firstName lastName avatarUrl');

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
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

    res.status(200).json({ success: true, task });
};

// ----------------------------------------
// DELETE /api/tasks/:id
// Purpose: Soft delete a task — sets deletedAt instead of removing from DB
// ----------------------------------------
exports.deleteTask = async (req, res) => {
    const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.status(200).json({ success: true, message: 'Task deleted' });
};

// ----------------------------------------
// GET /api/tasks/shared
// Purpose: List tasks the authenticated user is a participant in (not their own)
// Sorted by dueDate ascending (soonest first)
// ----------------------------------------
exports.getSharedTasks = async (req, res) => {
    const tasks = await Task.find({
        isShared: true,
        'participants.userId': req.user._id,
        userId: { $ne: req.user._id }, // exclude tasks the user owns
        deletedAt: null,
    }).sort({ dueDate: 1 });

    res.status(200).json({ success: true, tasks });
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

    res.status(200).json({ success: true, task });
};
