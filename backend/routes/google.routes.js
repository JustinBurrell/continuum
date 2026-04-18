const express = require('express');
const router = express.Router();
const googleController = require('../controllers/google.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// GOOGLE ROUTES
// Purpose: Map HTTP endpoints to Google Drive controller functions
// Base path: /api/google (mounted in server.js)
// All routes are protected — JWT required + Google account must be linked
//
// NOTE: GET /api/google/files was removed as part of the drive.file scope migration.
// Drive-wide file listing is incompatible with drive.file scope (user-selected access only).
// File selection now happens client-side via Google Picker.
// ============================================================

router.use(authMiddleware);

/**
 * @swagger
 * /api/google/token:
 *   get:
 *     summary: Return the user's current Google access token for use by the Google Picker
 *     description: Token is auto-refreshed if expired before being returned.
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Returns { accessToken }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Google account not linked
 */
router.get('/token', googleController.getAccessToken);

/**
 * @swagger
 * /api/google/picker-page:
 *   get:
 *     summary: Serve an HTML page that loads Google Picker (for Android WebView)
 *     description: Returns HTML pre-configured with the user's OAuth access token.
 *                  The Android app loads this in a WebView with a JavascriptInterface
 *                  ("AndroidPicker") to receive the selected file.
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: HTML page
 *       403:
 *         description: Google account not linked
 */
router.get('/picker-page', googleController.getPickerPage);

module.exports = router;
