const express = require('express');
const router = express.Router();
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

module.exports = router;
