const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// SYNC ROUTES
// Purpose: Map HTTP endpoints to sync controller functions
// Base path: /api/sync (mounted in server.js)
// All routes are protected — JWT required
// ============================================================

router.use(authMiddleware);

router.post('/', syncController.processSync);

module.exports = router;
