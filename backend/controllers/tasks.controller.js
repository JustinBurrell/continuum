const Task = require('../models/Task');

// ============================================================
// TASKS CONTROLLER
// Purpose: Handle business logic for all task CRUD endpoints
// Used by: routes/tasks.routes.js
// Endpoints: createTask, getTasks, getTaskById, updateTask,
//            updateStatus, deleteTask
// ============================================================

// ----------------------------------------
// POST /api/tasks
// Purpose: Create a new task for the authenticated user
// Body: { title, dueDate (required), type, priority, description?,
//         noteId?, duration?, reminderMinutes?, recurrence? }
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
    } = req.body;

    if (!dueDate) {
        return res.status(400).json({ success: false, error: 'dueDate is required' });
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
    });

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
    });

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
