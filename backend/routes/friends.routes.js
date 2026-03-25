const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friends.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// FRIENDS ROUTES
// Purpose: Map HTTP endpoints to friends controller functions
// Base path: /api/friends (mounted in server.js)
// All routes are protected — JWT required
// Note: static route (/request) defined before dynamic /:id
//       to avoid Express treating "request" as a friendship ID
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId]
 *             properties:
 *               recipientId: { type: string }
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Already friends or request already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Recipient not found
 */
router.post('/request', friendsController.sendRequest);

/**
 * @swagger
 * /api/friends/request/{id}:
 *   put:
 *     summary: Accept or decline a received friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Friendship document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [accept, decline] }
 *     responses:
 *       200:
 *         description: Request accepted or declined
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not the recipient of this request
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/request/:id', friendsController.respondToRequest);

/**
 * @swagger
 * /api/friends/request/{id}:
 *   delete:
 *     summary: Cancel a sent friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Friendship document ID
 *     responses:
 *       200:
 *         description: Request cancelled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not the sender of this request
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/request/:id', friendsController.cancelRequest);

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get friends list or pending/sent requests
 *     tags: [Friends]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [accepted, pending, sent] }
 *         description: Omit for accepted friends; use pending/sent for requests
 *     responses:
 *       200:
 *         description: Returns array of friendship records
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', friendsController.getFriends);

/**
 * @swagger
 * /api/friends/{id}:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Friendship document ID
 *     responses:
 *       200:
 *         description: Friend removed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', friendsController.removeFriend);

module.exports = router;
