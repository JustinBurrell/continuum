const express = require('express');
const router = express.Router();
const resumesController = require('../controllers/resumes.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { aiRateLimit } = require('../middleware/rateLimiter');
const validateObjectId = require('../middleware/validateObjectId');

// ============================================================
// RESUMES ROUTES
// Purpose: Map HTTP endpoints to resumes controller functions
// Base path: /api/resumes (mounted in server.js)
// All routes are protected — JWT required
// Note: static routes (/upload, /:id/feedback) defined before /:id
// ============================================================

router.use(authMiddleware);
router.param('id', validateObjectId);

/**
 * @swagger
 * /api/resumes/upload:
 *   post:
 *     summary: Upload a resume PDF
 *     tags: [Resumes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [resume]
 *             properties:
 *               resume: { type: string, format: binary, description: PDF file }
 *     responses:
 *       201:
 *         description: Resume uploaded and saved
 *       400:
 *         description: Unsupported file type or upload error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/upload', (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
}, resumesController.uploadResume);

/**
 * @swagger
 * /api/resumes:
 *   get:
 *     summary: Get all resumes for the authenticated user
 *     tags: [Resumes]
 *     responses:
 *       200:
 *         description: Returns array of resumes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', resumesController.getResumes);

/**
 * @swagger
 * /api/resumes/{id}/download:
 *   get:
 *     summary: Get a signed download URL for a resume PDF
 *     tags: [Resumes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns signed Cloudinary URL
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/download', resumesController.downloadResume);

/**
 * @swagger
 * /api/resumes/{id}/feedback:
 *   post:
 *     summary: Generate AI feedback for a resume (Groq)
 *     tags: [Resumes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Feedback generated and saved
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         description: AI rate limit exceeded
 */
router.post('/:id/feedback', aiRateLimit, resumesController.generateFeedback);

/**
 * @swagger
 * /api/resumes/{id}/feedback:
 *   get:
 *     summary: Get previously generated AI feedback for a resume
 *     tags: [Resumes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns stored feedback
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/feedback', resumesController.getFeedback);

/**
 * @swagger
 * /api/resumes/{id}:
 *   delete:
 *     summary: Delete a resume (owner only)
 *     tags: [Resumes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Resume deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', resumesController.deleteResume);

module.exports = router;
