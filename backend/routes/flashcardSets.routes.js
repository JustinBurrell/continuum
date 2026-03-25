const express = require('express');
const router = express.Router();
const flashcardSetsController = require('../controllers/flashcardSets.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { aiRateLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// FLASHCARD SETS ROUTES
// Purpose: Map HTTP endpoints to flashcard set controller functions
// Base path: /api/flashcard-sets (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/generate) must be defined before dynamic routes (/:id)
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);
router.param('setId', validateObjectId);
router.param('cardId', validateObjectId);

// Static routes — must be before /:id to avoid param conflict
router.post('/generate', aiRateLimit, flashcardSetsController.generateFromContent);
router.get('/shared', flashcardSetsController.getSharedSets);

// Set CRUD
router.post('/', flashcardSetsController.createSet);
router.get('/', flashcardSetsController.getSets);
router.get('/:id', flashcardSetsController.getSetById);
router.patch('/:id', flashcardSetsController.updateSet);
router.delete('/:id', flashcardSetsController.deleteSet);
router.patch('/:id/share', flashcardSetsController.shareSet);
router.post('/:id/duplicate', flashcardSetsController.duplicateSet);

// Card CRUD (nested under set)
router.post('/:id/cards', flashcardSetsController.addCard);
router.put('/:setId/cards/:cardId', flashcardSetsController.updateCard);
router.put('/:setId/cards/:cardId/progress', flashcardSetsController.updateProgress);
router.delete('/:setId/cards/:cardId', flashcardSetsController.deleteCard);

module.exports = router;
