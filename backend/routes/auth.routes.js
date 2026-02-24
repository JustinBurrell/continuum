const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ============================================================
// AUTH ROUTES
// Purpose: Map HTTP endpoints to auth controller functions
// Base path: /api/auth (mounted in server.js)
// ============================================================

// Public routes — no JWT required
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes — JWT required (authMiddleware attaches req.user)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
