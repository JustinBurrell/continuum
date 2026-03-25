const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/comments.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { perUserWriteLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// COMMENTS ROUTES
// Purpose: Map HTTP endpoints to comments controller functions
// Base path: /api/comments (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/:id/like) defined before dynamic /:id
//       to avoid Express treating "like" as a comment ID
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);
router.param('targetId', validateObjectId);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Add a comment to a note
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetId, targetType, content]
 *             properties:
 *               targetId:   { type: string, description: ID of the resource being commented on }
 *               targetType: { type: string, enum: [note], example: note }
 *               content:    { type: string, example: Great notes! }
 *     responses:
 *       201:
 *         description: Comment added
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', perUserWriteLimit, commentsController.addComment);

/**
 * @swagger
 * /api/comments/{targetType}/{targetId}:
 *   get:
 *     summary: Get all comments on a resource
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema: { type: string, enum: [note] }
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns array of comments
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:targetType/:targetId', commentsController.getComments);

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: Toggle a like on a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Like toggled (liked or unliked)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/like', commentsController.toggleLike);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment (owner only)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', commentsController.deleteComment);

module.exports = router;
