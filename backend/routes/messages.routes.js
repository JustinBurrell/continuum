const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// MESSAGES ROUTES
// Purpose: Map HTTP endpoints to messages controller functions
// Base path: /api/messages (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a participant in this conversation
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/read', messagesController.markAsRead);

module.exports = router;
