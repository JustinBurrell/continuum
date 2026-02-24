const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// GOOGLE ROUTES
// Purpose: Map HTTP endpoints to Google Drive controller functions
// Base path: /api/google (mounted in server.js)
// All routes are protected — JWT required + Google account must be linked
// ============================================================

router.use(authMiddleware);

// List the authenticated user's Google Drive files (Docs only)
router.get('/files', googleController.listFiles);

module.exports = router;
