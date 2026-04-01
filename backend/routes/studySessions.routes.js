const express = require('express');
const router = express.Router();
const studySessionsController = require('../controllers/studySessions.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// STUDY SESSIONS ROUTES
// Purpose: Map HTTP endpoints to study session controller functions
// Base path: /api/study-sessions (mounted in app.js)
// All routes are protected — JWT required
// Note: static routes (/streak, /set/:setId) must come before dynamic /:id
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);
router.param('setId', validateObjectId);

/**
 * @swagger
 * /api/study-sessions:
 *   post:
 *     summary: Submit a completed study session
 *     tags: [StudySessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [setId, durationSeconds, cardResults]
 *             properties:
 *               setId:
 *                 type: string
 *                 description: ID of the flashcard set that was studied
 *               durationSeconds:
 *                 type: integer
 *                 minimum: 0
 *                 description: Wall-clock time from first card to submission
 *               cardResults:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [cardId, correct]
 *                   properties:
 *                     cardId:  { type: string }
 *                     correct: { type: boolean }
 *     responses:
 *       201:
 *         description: Session recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 session: { $ref: '#/components/schemas/StudySession' }
 *                 streak:  { type: integer, description: Current consecutive-day streak }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', studySessionsController.submitSession);

/**
 * @swagger
 * /api/study-sessions/streak:
 *   get:
 *     summary: Get the current user's study streak
 *     tags: [StudySessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current streak length (consecutive calendar days)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 streak:  { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/streak', studySessionsController.getStreak);

/**
 * @swagger
 * /api/study-sessions/set/{setId}:
 *   get:
 *     summary: Get session history for a specific set (current user only)
 *     tags: [StudySessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated session list for this set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean }
 *                 sessions: { type: array, items: { $ref: '#/components/schemas/StudySession' } }
 *                 total:    { type: integer }
 *                 page:     { type: integer }
 *                 limit:    { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/set/:setId', studySessionsController.getSessionsBySet);

/**
 * @swagger
 * /api/study-sessions/{id}:
 *   get:
 *     summary: Get a single session by ID (owner only)
 *     tags: [StudySessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full session document including cardResults
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 session: { $ref: '#/components/schemas/StudySession' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', studySessionsController.getSessionById);

/**
 * @swagger
 * /api/study-sessions:
 *   get:
 *     summary: Get paginated session history for the current user
 *     tags: [StudySessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: setId
 *         schema: { type: string }
 *         description: Filter by set ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated session list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean }
 *                 sessions: { type: array, items: { $ref: '#/components/schemas/StudySession' } }
 *                 total:    { type: integer }
 *                 page:     { type: integer }
 *                 limit:    { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', studySessionsController.getUserSessions);

module.exports = router;
