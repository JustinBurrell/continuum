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

/**
 * @swagger
 * /api/google/files:
 *   get:
 *     summary: List the authenticated user's Google Docs from Drive
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Returns array of Google Doc files (id, name, modifiedTime)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Google account not linked — connect Google in Integrations settings
 */
router.get('/files', googleController.listFiles);

module.exports = router;
