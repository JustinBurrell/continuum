const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// NOTES ROUTES
// Purpose: Map HTTP endpoints to notes controller functions
// Base path: /api/notes (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.post('/', notesController.createNote);
router.get('/', notesController.getNotes);
router.get('/:id', notesController.getNoteById);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
