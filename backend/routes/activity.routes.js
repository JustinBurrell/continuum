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

/**
 * @swagger
 * /api/activity:
 *   get:
 *     summary: Get the activity feed for the authenticated user and their friends
 *     tags: [Activity]
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Cursor (createdAt ISO timestamp) for pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Returns paginated activity feed with nextCursor
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', activityController.getActivityFeed);

module.exports = router;
