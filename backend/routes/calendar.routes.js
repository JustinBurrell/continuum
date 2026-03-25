const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// CALENDAR ROUTES
// Purpose: Map HTTP endpoints to calendar controller functions
// Base path: /api/calendar (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Get owned and shared tasks grouped by due date for the calendar view
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date }
 *         description: Start of date range (ISO date)
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date }
 *         description: End of date range (ISO date)
 *     responses:
 *       200:
 *         description: Returns tasks keyed by date string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', calendarController.getCalendar);

module.exports = router;
