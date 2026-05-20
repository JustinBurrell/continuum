const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// NOTIFICATIONS ROUTES
// Purpose: Map HTTP endpoints to notifications controller functions
// Base path: /api/notifications (mounted in app.js)
// All routes are protected - JWT required
// ============================================================

router.use(authMiddleware);

router.get('/', notificationsController.getNotifications);
router.patch('/read', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markOneRead);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
