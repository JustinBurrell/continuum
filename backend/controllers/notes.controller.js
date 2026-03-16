const Note = require('../models/Note');
const FlashcardSet = require('../models/FlashcardSet');
const Flashcard = require('../models/Flashcard');
const Friendship = require('../models/Friendship');
const getGoogleDriveClient = require('../config/googleDrive');
const cloudinary = require('../config/cloudinary');
const groqService = require('../services/groq.service');
const { createActivity } = require('../services/activity.service');
const { PDFParse } = require('pdf-parse');

// ============================================================
// NOTES CONTROLLER
// Purpose: Handle business logic for all note CRUD endpoints
// Used by: routes/notes.routes.js
// Endpoints: createNote, getNotes, getNoteById, updateNote, deleteNote,
//            importNote, uploadNote, refreshNote, shareNote, getSharedNotes
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
                type: 'upload',
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
// Helper: uploadNoteBufferToCloudinary
// Purpose: Upload an in-memory PDF buffer to Cloudinary (for direct file uploads)
// Uses a random public_id so each upload is a distinct asset
// ----------------------------------------
const uploadNoteBufferToCloudinary = (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'continuum/notes',
                public_id: fileName.replace(/\.[^.]+$/, '') + '_' + Date.now(),
                resource_type: 'raw',
                type: 'upload',
                format: 'pdf',
                overwrite: false,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// ----------------------------------------
// POST /api/notes/upload
// Purpose: Upload a local PDF as a note — parses text with pdf-parse,
//          uploads file to Cloudinary, creates a Note document
// Body: multipart/form-data — field name: "file" (PDF only)
// Optional body fields: title, type, tags (comma-separated)
// ----------------------------------------
exports.uploadNote = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'A PDF file is required' });
    }

    const { title, type, tags } = req.body;

    // Extract plain text from PDF buffer — used by Groq for summaries/flashcards
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    await parser.destroy();
    const content = pdfData.text;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Could not extract text from PDF — ensure the file is not scanned/image-only' });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadNoteBufferToCloudinary(req.file.buffer, req.file.originalname);

    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const note = await Note.create({
        userId: req.user._id,
        title: title || req.file.originalname.replace(/\.pdf$/i, '') || 'Untitled',
        content,
        contentType: 'plain',
        type: type || 'general',
        tags: tagList,
        pdfUrl: cloudinaryResult.secure_url,
        pdfPublicId: cloudinaryResult.public_id,
    });

    res.status(201).json({ success: true, note });
};

// ----------------------------------------
// GET /api/notes/:id/pdf
// Purpose: Generate a signed Cloudinary URL for downloading a note's source PDF
// Only available for notes that were imported from Google Drive or uploaded as PDF
// ----------------------------------------
exports.downloadNotePdf = async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    }).select('pdfUrl title');

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }
    if (!note.pdfUrl) {
        return res.status(404).json({ success: false, error: 'This note has no associated PDF' });
    }

    const safeName = (note.title || 'note').replace(/[^a-zA-Z0-9._-]/g, '_');
    const downloadUrl = note.pdfUrl.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
    res.status(200).json({ success: true, downloadUrl });
};

// ----------------------------------------
// POST /api/notes
// Purpose: Create a new note for the authenticated user
// ----------------------------------------
exports.createNote = async (req, res) => {
    const { title, content, contentType, type, tags, subject, folder, visibility } = req.body;

    const note = await Note.create({
        userId: req.user._id,
        title,
        content,
        contentType,
        type,
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
    const { search, type, subject, folder, tags, visibility, isPinned, page = 1, limit = 20 } = req.query;

    // Base filter — always scope to current user and exclude soft-deleted notes
    const filter = {
        userId: req.user._id,
        deletedAt: null,
    };

    // Optional filters — only applied if the query param was provided
    if (type) filter.type = type;
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
            .sort({ isPinned: -1, lastViewedAt: -1, createdAt: -1 }) // pinned first, then most recently viewed/created
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
    const { title, content, contentType, type, tags, subject, folder, visibility, sharedWith, isPinned } = req.body;

    const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { title, content, contentType, type, tags, subject, folder, visibility, sharedWith, isPinned },
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
        { deletedAt: new Date(), googleDocId: null },
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
        pdfPublicId: cloudinaryResult.public_id,
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
        { content, pdfUrl: cloudinaryResult.secure_url, pdfPublicId: cloudinaryResult.public_id, lastSyncedAt: new Date() },
        { new: true }
    );

    res.status(200).json({ success: true, note: updatedNote });
};

// ----------------------------------------
// POST /api/notes/:id/summary
// Purpose: Generate an AI summary for a note using Groq
//   - Calls groq.service.js which handles prompt + model call
//   - Saves quickSummary, detailedSummary, generatedAt, model, tokenCount to note.summary
//   - Returns cached summary unless ?force=true is passed
// ----------------------------------------
exports.generateSummary = async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    if (!note.content || note.content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Note has no content to summarize' });
    }

    // Return cached summary unless ?force=true is explicitly passed
    const force = req.query.force === 'true';
    if (note.summary?.quickSummary && !force) {
        return res.status(200).json({ success: true, note, cached: true });
    }

    const result = await groqService.generateSummary(note.content);

    const updatedNote = await Note.findByIdAndUpdate(
        note._id,
        {
            summary: {
                quickSummary: result.quickSummary,
                detailedSummary: result.detailedSummary,
                generatedAt: new Date(),
                model: result.model,
                tokenCount: result.tokenCount,
            },
        },
        { new: true }
    );

    res.status(200).json({ success: true, note: updatedNote, cached: false });
};

// ----------------------------------------
// POST /api/notes/:id/flashcards/generate
// Purpose: Generate AI flashcards from an existing note's content
//   - Uses note.content as input to Groq
//   - Creates a FlashcardSet linked to the note (isAIGenerated: true)
//   - Bulk inserts Flashcard docs and updates totalCards
//   - Sets note.hasFlashcards = true
// Generated once — no regeneration (call the endpoint again to create a new set)
// ----------------------------------------
exports.generateFlashcardsFromNote = async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.id,
        userId: req.user._id,
        deletedAt: null,
    });

    if (!note) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    if (!note.content || note.content.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Note has no content to generate flashcards from' });
    }

    const result = await groqService.generateFlashcards(note.content);

    // Create the FlashcardSet linked to this note
    const set = await FlashcardSet.create({
        userId: req.user._id,
        noteId: note._id,
        title: note.title ? `${note.title} — Flashcards` : 'Generated Flashcard Set',
        isAIGenerated: true,
        generatedAt: new Date(),
        totalCards: result.cards.length,
    });

    // Bulk insert all flashcard docs
    const flashcardDocs = result.cards.map((card, index) => ({
        setId: set._id,
        front: card.front,
        back: card.back,
        order: index,
    }));
    await Flashcard.insertMany(flashcardDocs);

    // Mark note as having flashcards
    await Note.findByIdAndUpdate(note._id, { hasFlashcards: true });

    const populatedSet = await FlashcardSet.findById(set._id).populate('flashcards');

    res.status(201).json({ success: true, set: populatedSet });
};

// ----------------------------------------
// PUT /api/notes/:id/share
// Purpose: Update a note's visibility and sharedWith list
// Body: { visibility: "private" | "friends" | "specific", sharedWith?: [userId, ...] }
// Note: visibility="specific" requires sharedWith — all listed users must be accepted friends
// ----------------------------------------
exports.shareNote = async (req, res) => {
    const { visibility, sharedWith } = req.body;

    const validVisibilities = ['private', 'friends', 'specific'];
    if (!visibility || !validVisibilities.includes(visibility)) {
        return res.status(400).json({
            success: false,
            error: `visibility must be one of: ${validVisibilities.join(', ')}`,
        });
    }

    if (visibility === 'specific') {
        if (!sharedWith || sharedWith.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'sharedWith is required when visibility is "specific"',
            });
        }

        // Validate every user in sharedWith is an accepted friend of the requester
        const userId = req.user._id;
        const friendships = await Friendship.find({
            $or: [{ user1: userId }, { user2: userId }],
            status: 'accepted',
            deletedAt: null,
        });

        const friendIds = new Set(
            friendships.map(f =>
                f.user1.toString() === userId.toString()
                    ? f.user2.toString()
                    : f.user1.toString()
            )
        );

        const invalidUsers = sharedWith.filter(id => !friendIds.has(id.toString()));
        if (invalidUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'sharedWith can only include accepted friends',
            });
        }
    }

    // Fetch current visibility before update — needed to detect private → shared transition
    const existing = await Note.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null }).select('visibility');

    if (!existing) {
        return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        {
            visibility,
            // Clear sharedWith when switching away from "specific"
            sharedWith: visibility === 'specific' ? sharedWith : [],
        },
        { new: true, runValidators: true }
    );

    // Only fire activity when going from private → shared for the first time
    // Tweaking between friends/specific doesn't warrant a new share event
    if (existing.visibility === 'private' && visibility !== 'private') {
        createActivity({
            actorId: req.user._id,
            type: 'note_shared',
            targetId: note._id,
            targetType: 'note',
            metadata: { noteTitle: note.title },
        }).catch(() => {}); // non-blocking — never fail the request over activity
    }

    res.status(200).json({ success: true, note });
};

// ----------------------------------------
// GET /api/notes/shared
// Purpose: List notes shared with the authenticated user by other users
// Includes:
//   - Notes with visibility="friends" owned by an accepted friend
//   - Notes with visibility="specific" where current user is in sharedWith
// ----------------------------------------
exports.getSharedNotes = async (req, res) => {
    const userId = req.user._id;

    // Step 1: Get all accepted friend IDs for the current user
    const friendships = await Friendship.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'accepted',
        deletedAt: null,
    });

    const friendIds = friendships.map(f =>
        f.user1.toString() === userId.toString() ? f.user2 : f.user1
    );

    // Step 2: Find notes accessible to the current user (owned by others)
    const notes = await Note.find({
        deletedAt: null,
        userId: { $ne: userId },
        $or: [
            { visibility: 'friends', userId: { $in: friendIds } },
            { visibility: 'specific', sharedWith: userId },
        ],
    })
        .populate('userId', 'username firstName lastName')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, notes });
};
