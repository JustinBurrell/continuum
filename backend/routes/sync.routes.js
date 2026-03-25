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

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Process a batch of offline mutations queued while the client was offline
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [operations]
 *             properties:
 *               operations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:    { type: string, example: CREATE_NOTE }
 *                     payload: { type: object }
 *     responses:
 *       200:
 *         description: Operations processed — returns results per operation
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', syncController.processSync);

module.exports = router;
