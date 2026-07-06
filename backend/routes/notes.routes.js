const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { perUserWriteLimit, aiRateLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// NOTES ROUTES
// Purpose: Map HTTP endpoints to notes controller functions
// Base path: /api/notes (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/import) must be defined before dynamic routes (/:id)
//       to prevent Express treating "import" as a route param
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/notes/import:
 *   post:
 *     summary: Import a note from a Google Doc, Slides, or Sheets file
 *     description: >
 *       Looks up the Drive file's mimeType and exports it accordingly — Docs export as
 *       plain text, Slides export as PPTX (parsed to text), Sheets export as XLSX (parsed
 *       to text). A PDF is also exported for all three and stored as pdfUrl. The resulting
 *       note's `source` field is set to google_docs, google_slides, or google_sheets.
 *       Other Google file types (Forms, Drawings, etc.) return 400.
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [googleDocId, googleDocUrl]
 *             properties:
 *               googleDocId: { type: string, example: "1a2b3c4d5e6f" }
 *               googleDocUrl: { type: string, example: "https://docs.google.com/document/d/1a2b3c4d5e6f/edit" }
 *               title: { type: string, example: "Lecture 3 Notes" }
 *     responses:
 *       201:
 *         description: Note imported and saved
 *       400:
 *         description: Missing required fields, or an unsupported Google file type was selected
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Google account not linked, or access to the file has been revoked
 *       404:
 *         description: Google file not found
 *       409:
 *         description: This file has already been imported
 *       429:
 *         description: Too many requests — per-user write rate limit exceeded
 */
router.post('/import', perUserWriteLimit, notesController.importNote);

/**
 * @swagger
 * /api/notes/upload:
 *   post:
 *     summary: Upload a PDF or DOCX file and convert it to a note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: File uploaded and converted to note
 *       400:
 *         description: Unsupported file type or upload error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/upload', upload.single('file'), notesController.uploadNote);

/**
 * @swagger
 * /api/notes/shared:
 *   get:
 *     summary: Get all notes shared with the authenticated user by friends
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Returns array of shared notes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/shared', notesController.getSharedNotes);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:   { type: string, example: Lecture 3 Notes }
 *               content: { type: string }
 *               type:    { type: string, enum: [general, lecture, research, todo, journal] }
 *     responses:
 *       201:
 *         description: Note created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', notesController.createNote);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes owned by the authenticated user (paginated)
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filter by title
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [general, lecture, research, todo, journal] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Returns paginated notes with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 notes: { type: array }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, description: Total notes matching the filter }
 *                     page:  { type: integer }
 *                     limit: { type: integer }
 *                     pages: { type: integer, description: Total number of pages }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', notesController.getNotes);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a single note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns the note
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', notesController.getNoteById);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note's title, content, or type
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:   { type: string }
 *               content: { type: string }
 *               type:    { type: string, enum: [general, lecture, research, todo, journal] }
 *     responses:
 *       200:
 *         description: Note updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', notesController.updateNote);

/**
 * @swagger
 * /api/notes/{id}/refresh:
 *   put:
 *     summary: Re-import content from the original Google Doc, Slides, or Sheets file
 *     description: >
 *       Re-exports the note's content according to its stored `source` — google_docs
 *       re-exports plain text, google_slides re-exports PPTX (parsed to text), google_sheets
 *       re-exports XLSX (parsed to text). Notes imported before the source field existed
 *       default to google_docs. Requires the note to be linked to a Google file (googleDocId).
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Note content refreshed
 *       400:
 *         description: This note is not linked to a Google file
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/refresh', notesController.refreshNote);

/**
 * @swagger
 * /api/notes/{id}/share:
 *   put:
 *     summary: Share or unshare a note with a specific friend
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, action]
 *             properties:
 *               userId: { type: string, description: Friend's user ID }
 *               action: { type: string, enum: [share, unshare] }
 *     responses:
 *       200:
 *         description: Sharing updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/share', perUserWriteLimit, notesController.shareNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note (owner only)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Note deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', notesController.deleteNote);

/**
 * @swagger
 * /api/notes/{id}/summary:
 *   post:
 *     summary: Generate an AI summary for a note (Groq)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Summary generated and saved to note
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         description: AI rate limit exceeded
 */
router.post('/:id/summary', aiRateLimit, notesController.generateSummary);

/**
 * @swagger
 * /api/notes/{id}/flashcards/generate:
 *   post:
 *     summary: Generate a flashcard set from a note using AI (Groq)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Flashcard set created from note content
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         description: AI rate limit exceeded
 */
router.post('/:id/flashcards/generate', aiRateLimit, notesController.generateFlashcardsFromNote);

/**
 * @swagger
 * /api/notes/{id}/pdf:
 *   get:
 *     summary: Get a signed download URL for the note's PDF (if uploaded as PDF)
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns signed Cloudinary URL
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Note has no PDF
 */
router.get('/:id/pdf', notesController.downloadNotePdf);

module.exports = router;
