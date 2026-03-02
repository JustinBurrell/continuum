const express = require('express');
const router = express.Router();
const resumesController = require('../controllers/resumes.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// ============================================================
// RESUMES ROUTES
// Purpose: Map HTTP endpoints to resumes controller functions
// Base path: /api/resumes (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/upload, /:id/feedback) defined before /:id
// ============================================================

router.use(authMiddleware);

// upload.single('resume') — expects a single file in the "resume" form field
router.post('/upload', upload.single('resume'), resumesController.uploadResume);
router.get('/', resumesController.getResumes);
router.post('/:id/feedback', resumesController.generateFeedback);
router.get('/:id/feedback', resumesController.getFeedback);

module.exports = router;
