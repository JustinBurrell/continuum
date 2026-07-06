const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { generatePdfFromContent } = require('../services/contentToPdf.service');

// ============================================================
// INTEGRATIONS ROUTES
// Purpose: Shared integration endpoints (content-to-PDF rendering, etc.)
// Base path: /api/integrations (mounted in app.js)
// All routes are protected, JWT required
// ============================================================

router.use(authMiddleware);

/**
 * @swagger
 * /api/integrations/health/pdf:
 *   get:
 *     summary: Verify the PDF rendering pipeline is healthy
 *     description: >
 *       Renders a small fixed piece of content through the shared
 *       html-to-pdf pipeline (Puppeteer + Chromium) and reports the size
 *       of the resulting PDF. Used as an ops check that Chromium is
 *       installed and reachable in the current environment; this is a
 *       permanent endpoint, not a one-off test route.
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: PDF rendering pipeline is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 bytes: { type: integer, example: 4213, description: Size of the rendered PDF in bytes }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       503:
 *         description: PDF render queue is busy
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, error: 'Import is busy, try again in a moment.' }
 */
router.get('/health/pdf', async (req, res, next) => {
    try {
        const buffer = await generatePdfFromContent('PDF health check', 'plain', 'Health Check');
        res.status(200).json({ ok: true, bytes: buffer.length });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
