const express = require('express');
const router = express.Router();
const conversationsController = require('../controllers/conversations.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { perUserWriteLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// CONVERSATIONS ROUTES
// Purpose: Map HTTP endpoints to conversations controller functions
// Base path: /api/conversations (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Start or retrieve an existing DM conversation with a friend
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId: { type: string, description: The other user's ID }
 *     responses:
 *       200:
 *         description: Existing conversation returned
 *       201:
 *         description: New conversation created
 *       400:
 *         description: Must be friends first
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', conversationsController.startConversation);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Returns array of conversations with latest message preview
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', conversationsController.getConversations);

/**
 * @swagger
 * /api/conversations/{id}:
 *   delete:
 *     summary: Delete a conversation for the current user (Instagram-style)
 *     description: Hides the conversation from the current user's inbox. The other participant is unaffected and still sees the conversation.
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation hidden for this user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a participant in this conversation
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', conversationsController.deleteConversation);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: Hey, are you free to study? }
 *     responses:
 *       201:
 *         description: Message sent — emitted via Socket.io to the other participant
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a participant in this conversation
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/messages', perUserWriteLimit, conversationsController.sendMessage);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Returns array of messages
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a participant in this conversation
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/messages', conversationsController.getMessages);

module.exports = router;
