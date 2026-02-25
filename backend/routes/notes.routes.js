const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// NOTES ROUTES
// Purpose: Map HTTP endpoints to notes controller functions
// Base path: /api/notes (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/import) must be defined before dynamic routes (/:id)
//       to prevent Express treating "import" as a route param
// ============================================================

router.use(authMiddleware);

// Static routes first
router.post('/import', notesController.importNote);

// CRUD routes
router.post('/', notesController.createNote);
router.get('/', notesController.getNotes);
router.get('/:id', notesController.getNoteById);
router.put('/:id', notesController.updateNote);
router.put('/:id/refresh', notesController.refreshNote);
router.delete('/:id', notesController.deleteNote);

// AI routes
router.post('/:id/summary', notesController.generateSummary);

module.exports = router;
