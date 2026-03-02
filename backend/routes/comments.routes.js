const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/comments.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// COMMENTS ROUTES
// Purpose: Map HTTP endpoints to comments controller functions
// Base path: /api/comments (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/:id/like) defined before dynamic /:id
//       to avoid Express treating "like" as a comment ID
// ============================================================

router.use(authMiddleware);

router.post('/', commentsController.addComment);
router.get('/:targetType/:targetId', commentsController.getComments);
router.post('/:id/like', commentsController.toggleLike);
router.delete('/:id', commentsController.deleteComment);

module.exports = router;
