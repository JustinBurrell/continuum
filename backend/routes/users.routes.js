const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// USERS ROUTES
// Purpose: Map HTTP endpoints to users controller functions
// Base path: /api/users (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by name or username
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search query (name or username)
 *     responses:
 *       200:
 *         description: Returns array of matching users (excludes current user)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/search', usersController.searchUsers);

/**
 * @swagger
 * /api/users/device-token:
 *   post:
 *     summary: Register or refresh an FCM device token for push notifications
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, deviceId]
 *             properties:
 *               token:    { type: string, description: FCM registration token }
 *               deviceId: { type: string, description: Stable device UUID }
 *     responses:
 *       200:
 *         description: Token registered or updated
 *       400:
 *         description: Missing token or deviceId
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/device-token', usersController.registerDeviceToken);

/**
 * @swagger
 * /api/users/{id}/streak:
 *   get:
 *     summary: Get another user's current study streak
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns current streak count (integer)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 streak:  { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/streak', usersController.getUserStreak);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns public profile (name, username, avatar, bio, joinedAt, linkedinUrl, instagramHandle)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', usersController.getUserProfile);

module.exports = router;
