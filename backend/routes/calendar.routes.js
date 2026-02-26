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

router.get('/', calendarController.getCalendar);

module.exports = router;
