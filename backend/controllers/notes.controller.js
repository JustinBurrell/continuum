const Note = require('../models/Note');

// ============================================================
// NOTES CONTROLLER
// Purpose: Handle business logic for all note CRUD endpoints
// Used by: routes/notes.routes.js
// Endpoints: createNote, getNotes, getNoteById, updateNote, deleteNote
// ============================================================

// ----------------------------------------
// POST /api/notes
// Purpose: Create a new note for the authenticated user
// ----------------------------------------
exports.createNote = async (req, res) => {
    const { title, content, contentType, tags, subject, folder, visibility } = req.body;

    const note = await Note.create({
        userId: req.user._id,
        title,
        content,
        contentType,
        tags,
        subject,
        folder,
        visibility,
    });

    res.status(201).json({ success: true, note });
};

// ----------------------------------------
// GET /api/notes
// Purpose: List the authenticated user's notes with optional search, filters, and pagination
// Query params: search, subject, folder, tags, visibility, isPinned, page, limit
// ----------------------------------------
exports.getNotes = async (req, res) => {
    const { search, subject, folder, tags, visibility, isPinned, page = 1, limit = 20 } = req.query;

    // Base filter — always scope to current user and exclude soft-deleted notes
    const filter = {
        userId: req.user._id,
        deletedAt: null,
    };

    // Optional filters — only applied if the query param was provided
    if (subject) filter.subject = subject;
    if (folder) filter.folder = folder;
    if (visibility) filter.visibility = visibility;
    if (isPinned !== undefined) filter.isPinned = isPinned === 'true';
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    // Text search across title and content using case-insensitive regex
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notes, total] = await Promise.all([
        Note.find(filter)
            .sort({ isPinned: -1, createdAt: -1 }) // pinned notes first, then newest
            .skip(skip)
            .limit(Number(limit)),
        Note.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        notes,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
};

// ----------------------------------------
// GET /api/notes/:id
// Purpose: Get a single note by ID — only accessible by the owner
// ----------------------------------------
exports.getNoteById = async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    // Track engagement — increment view count and update last viewed timestamp
    note.viewCount += 1;
    note.lastViewedAt = new Date();
    await note.save();

    res.status(200).json({ success: true, note });
};

// ----------------------------------------
// PUT /api/notes/:id
// Purpose: Update a note — only accessible by the owner
// ----------------------------------------
exports.updateNote = async (req, res) => {
    const { title, content, contentType, tags, subject, folder, visibility, sharedWith, isPinned } = req.body;

    const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { title, content, contentType, tags, subject, folder, visibility, sharedWith, isPinned },
        { new: true, runValidators: true }  // new: true returns the updated doc
    );

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.status(200).json({ success: true, note });
};

// ----------------------------------------
// DELETE /api/notes/:id
// Purpose: Soft delete a note — sets deletedAt instead of removing from DB
// ----------------------------------------
exports.deleteNote = async (req, res) => {
    const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.status(200).json({ success: true, message: 'Note deleted' });
};
