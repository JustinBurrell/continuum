const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// MESSAGES ROUTES
// Purpose: Map HTTP endpoints to messages controller functions
// Base path: /api/messages (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.put('/:id/read', messagesController.markAsRead);

module.exports = router;
