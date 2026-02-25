const Note = require('../models/Note');
const getGoogleDriveClient = require('../config/googleDrive');
const cloudinary = require('../config/cloudinary');

// ============================================================
// NOTES CONTROLLER
// Purpose: Handle business logic for all note CRUD endpoints
// Used by: routes/notes.routes.js
// Endpoints: createNote, getNotes, getNoteById, updateNote, deleteNote,
//            importNote, refreshNote
// ============================================================

// ----------------------------------------
// Helper: uploadPdfToCloudinary
// Purpose: Pipe a readable stream from Drive into Cloudinary
// publicId is derived from googleDocId — ensures refreshNote overwrites the same asset
// resource_type 'raw' is required for non-image files (PDFs)
// ----------------------------------------
const uploadPdfToCloudinary = (stream, googleDocId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'continuum/notes',
                public_id: googleDocId,
                resource_type: 'raw',
                format: 'pdf',
                overwrite: true,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.pipe(uploadStream);
    });
};

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

// ----------------------------------------
// POST /api/notes/import
// Purpose: Import a Google Doc as a note snapshot
//   - Exports PDF via Drive API → uploads to Cloudinary → stores pdfUrl (for viewing)
//   - Exports plain text via Drive API → stores as content field (for Groq AI)
// Body: { googleDocId, googleDocUrl, title }
// ----------------------------------------
exports.importNote = async (req, res) => {
    if (!req.user.googleId) {
        return res.status(403).json({ success: false, error: 'Google account not linked' });
    }

    const { googleDocId, googleDocUrl, title } = req.body;

    if (!googleDocId || !googleDocUrl) {
        return res.status(400).json({ success: false, error: 'googleDocId and googleDocUrl are required' });
    }

    // Prevent duplicate imports of the same Google Doc
    const existing = await Note.findOne({ googleDocId, deletedAt: null });
    if (existing) {
        return res.status(409).json({ success: false, error: 'This Google Doc has already been imported' });
    }

    const drive = await getGoogleDriveClient(req.user);

    // Export Google Doc as PDF stream → upload to Cloudinary
    // responseType: 'stream' gives us a readable stream to pipe directly to Cloudinary
    const pdfResponse = await drive.files.export(
        { fileId: googleDocId, mimeType: 'application/pdf' },
        { responseType: 'stream' }
    );
    const cloudinaryResult = await uploadPdfToCloudinary(pdfResponse.data, googleDocId);

    // Export Google Doc as plain text → used by Groq for summaries/flashcards
    // responseType: 'arraybuffer' → convert buffer to UTF-8 string
    const textResponse = await drive.files.export(
        { fileId: googleDocId, mimeType: 'text/plain' },
        { responseType: 'arraybuffer' }
    );
    const content = Buffer.from(textResponse.data).toString('utf-8');

    const note = await Note.create({
        userId: req.user._id,
        title: title || 'Untitled',
        content,
        contentType: 'plain',
        pdfUrl: cloudinaryResult.secure_url,
        googleDocId,
        googleDocUrl,
        lastSyncedAt: new Date(),
    });

    res.status(201).json({ success: true, note });
};

// ----------------------------------------
// PUT /api/notes/:id/refresh
// Purpose: Re-sync an imported note from its source Google Doc
//   - Re-exports PDF → overwrites existing Cloudinary asset (same public_id = googleDocId)
//   - Re-exports plain text → updates content field
//   - Updates lastSyncedAt timestamp
// ----------------------------------------
exports.refreshNote = async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    if (!note.googleDocId) {
        return res.status(400).json({ success: false, error: 'This note is not linked to a Google Doc' });
    }

    const drive = await getGoogleDriveClient(req.user);

    // Re-export PDF → overwrite the existing Cloudinary asset (public_id = googleDocId)
    const pdfResponse = await drive.files.export(
        { fileId: note.googleDocId, mimeType: 'application/pdf' },
        { responseType: 'stream' }
    );
    const cloudinaryResult = await uploadPdfToCloudinary(pdfResponse.data, note.googleDocId);

    // Re-export plain text → update content field for Groq AI
    const textResponse = await drive.files.export(
        { fileId: note.googleDocId, mimeType: 'text/plain' },
        { responseType: 'arraybuffer' }
    );
    const content = Buffer.from(textResponse.data).toString('utf-8');

    const updatedNote = await Note.findOneAndUpdate(
        { _id: note._id, userId: req.user._id },
        { content, pdfUrl: cloudinaryResult.secure_url, lastSyncedAt: new Date() },
        { new: true }
    );

    res.status(200).json({ success: true, note: updatedNote });
};
