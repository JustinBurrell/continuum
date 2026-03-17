const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const uploadImage = require('../middleware/uploadImage.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

// ============================================================
// AUTH ROUTES
// Purpose: Map HTTP endpoints to auth controller functions
// Base path: /api/auth (mounted in server.js)
// ============================================================

// Public routes — no JWT required
router.post('/register', authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/refresh', authLimiter, authController.refresh);

// ----------------------------------------
// Google OAuth routes — no JWT required
// Purpose: Initiate and handle the Google OAuth redirect flow
// session: false — we use JWT, not server-side sessions
// ----------------------------------------

// Redirect user to Google's consent screen
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'], accessType: 'offline', prompt: 'consent' }));

// Google redirects back here — Passport runs verify callback, then googleCallback signs a JWT
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
    authController.googleCallback
);

// Protected routes — JWT required (authMiddleware attaches req.user)
router.get('/me', authMiddleware, authController.me);
router.patch('/me/profile', authMiddleware, (req, res, next) => {
    uploadImage.single('avatar')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        next();
    });
}, authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.post('/send-verification', authMiddleware, authController.sendVerificationEmail);
router.get('/verify-email', authController.verifyEmail);

// ----------------------------------------
// Google account link/unlink — JWT required
// Purpose: Let existing email/password users connect or disconnect their Google account
// ----------------------------------------
router.post('/me/google/link', authMiddleware, authController.googleLink);
router.delete('/me/google/link', authMiddleware, authController.googleUnlink);

module.exports = router;
