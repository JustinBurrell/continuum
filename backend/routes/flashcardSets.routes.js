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

/**
 * @swagger
 * /api/flashcard-sets/generate:
 *   post:
 *     summary: Generate a flashcard set from pasted text using AI (Groq)
 *     tags: [Flashcards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, description: Raw text to generate flashcards from }
 *               title:   { type: string }
 *     responses:
 *       201:
 *         description: Flashcard set generated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: AI rate limit exceeded
 */
router.post('/generate', aiRateLimit, flashcardSetsController.generateFromContent);

/**
 * @swagger
 * /api/flashcard-sets/shared:
 *   get:
 *     summary: Get flashcard sets shared by friends (visibility = friends or specific)
 *     tags: [Flashcards]
 *     responses:
 *       200:
 *         description: Returns array of shared sets
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/shared', flashcardSetsController.getSharedSets);

/**
 * @swagger
 * /api/flashcard-sets:
 *   post:
 *     summary: Create a new flashcard set
 *     tags: [Flashcards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:      { type: string, example: Bio Chapter 4 }
 *               visibility: { type: string, enum: [private, friends, specific], default: private }
 *     responses:
 *       201:
 *         description: Flashcard set created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', flashcardSetsController.createSet);

/**
 * @swagger
 * /api/flashcard-sets:
 *   get:
 *     summary: Get all flashcard sets owned by the authenticated user
 *     tags: [Flashcards]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns array of flashcard sets
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', flashcardSetsController.getSets);

/**
 * @swagger
 * /api/flashcard-sets/{id}:
 *   get:
 *     summary: Get a single flashcard set with all its cards
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns the set and its cards
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', flashcardSetsController.getSetById);

/**
 * @swagger
 * /api/flashcard-sets/{id}:
 *   patch:
 *     summary: Update a flashcard set's title or visibility (owner only)
 *     tags: [Flashcards]
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
 *               title:      { type: string }
 *               visibility: { type: string, enum: [private, friends, specific] }
 *     responses:
 *       200:
 *         description: Set updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', flashcardSetsController.updateSet);

/**
 * @swagger
 * /api/flashcard-sets/{id}:
 *   delete:
 *     summary: Delete a flashcard set and all its cards (owner only)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Set deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', flashcardSetsController.deleteSet);

/**
 * @swagger
 * /api/flashcard-sets/{id}/share:
 *   patch:
 *     summary: Update which specific users a set is shared with (visibility=specific)
 *     tags: [Flashcards]
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
 *             required: [userIds]
 *             properties:
 *               userIds: { type: array, items: { type: string } }
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
router.patch('/:id/share', flashcardSetsController.shareSet);

/**
 * @swagger
 * /api/flashcard-sets/{id}/duplicate:
 *   post:
 *     summary: Duplicate a flashcard set (creates a new copy owned by the authenticated user)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Duplicate set created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/duplicate', flashcardSetsController.duplicateSet);

/**
 * @swagger
 * /api/flashcard-sets/{id}/cards:
 *   post:
 *     summary: Add a card to a flashcard set (owner only)
 *     tags: [Flashcards]
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
 *             required: [front, back]
 *             properties:
 *               front: { type: string, example: What is mitosis? }
 *               back:  { type: string, example: Cell division producing two identical daughter cells }
 *     responses:
 *       201:
 *         description: Card added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/cards', flashcardSetsController.addCard);

/**
 * @swagger
 * /api/flashcard-sets/{setId}/cards/{cardId}:
 *   put:
 *     summary: Update a card's front or back text (owner only)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               front: { type: string }
 *               back:  { type: string }
 *     responses:
 *       200:
 *         description: Card updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:setId/cards/:cardId', flashcardSetsController.updateCard);

/**
 * @swagger
 * /api/flashcard-sets/{setId}/cards/{cardId}/progress:
 *   put:
 *     summary: Record study progress for a card (correct/incorrect)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correct]
 *             properties:
 *               correct: { type: boolean }
 *     responses:
 *       200:
 *         description: Progress recorded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:setId/cards/:cardId/progress', flashcardSetsController.updateProgress);

/**
 * @swagger
 * /api/flashcard-sets/{setId}/cards/{cardId}:
 *   delete:
 *     summary: Delete a card from a set (owner only)
 *     tags: [Flashcards]
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Card deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:setId/cards/:cardId', flashcardSetsController.deleteCard);

module.exports = router;
