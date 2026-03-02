const express = require('express');
const router = express.Router();
const conversationsController = require('../controllers/conversations.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// CONVERSATIONS ROUTES
// Purpose: Map HTTP endpoints to conversations controller functions
// Base path: /api/conversations (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.post('/', conversationsController.startConversation);
router.get('/', conversationsController.getConversations);
router.post('/:id/messages', conversationsController.sendMessage);
router.get('/:id/messages', conversationsController.getMessages);

module.exports = router;
