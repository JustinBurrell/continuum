const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// ACTIVITY ROUTES
// Purpose: Map HTTP endpoints to activity controller functions
// Base path: /api/activity (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.get('/', activityController.getActivityFeed);

module.exports = router;
