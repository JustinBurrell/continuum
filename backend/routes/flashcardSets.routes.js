const express = require('express');
const router = express.Router();
const flashcardSetsController = require('../controllers/flashcardSets.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// FLASHCARD SETS ROUTES
// Purpose: Map HTTP endpoints to flashcard set controller functions
// Base path: /api/flashcard-sets (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/generate) must be defined before dynamic routes (/:id)
// ============================================================

router.use(authMiddleware);

// AI generation routes (static — before /:id)
router.post('/generate', flashcardSetsController.generateFromContent);

module.exports = router;
