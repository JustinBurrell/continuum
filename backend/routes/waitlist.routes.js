const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlist.controller');

// ============================================================
// WAITLIST ROUTES
// Purpose: Map HTTP endpoints to waitlist controller functions
// Base path: /api/waitlist (mounted in app.js)
// No auth required — public endpoint
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Waitlist
 *   description: Mobile waitlist signup for users on non-desktop devices
 */

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     summary: Subscribe an email to the mobile app waitlist
 *     tags: [Waitlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to subscribe
 *                 example: student@university.edu
 *               source:
 *                 type: string
 *                 description: Origin of the signup (defaults to mobile_gate)
 *                 example: mobile_gate
 *     responses:
 *       201:
 *         description: Successfully subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "You're on the list!"
 *       200:
 *         description: Email already on the list (idempotent response)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "You're on the list!"
 *       400:
 *         description: Missing or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Please enter a valid email address.
 */
router.post('/', waitlistController.subscribe);

module.exports = router;
