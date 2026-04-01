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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, username, password]
 *             properties:
 *               firstName: { type: string, example: Justin }
 *               lastName:  { type: string, example: Burrell }
 *               email:     { type: string, format: email, example: justin@example.com }
 *               username:  { type: string, example: justinb }
 *               password:  { type: string, example: "Pass123!" }
 *     responses:
 *       201:
 *         description: Account created — returns JWT and user
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email or username already taken
 */
router.post('/register', authLimiter, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful — returns JWT, refreshToken, and user
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send a password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (always 200 — does not confirm whether email exists)
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using the token from the reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:       { type: string }
 *               newPassword: { type: string, example: "NewPass123!" }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Token invalid or expired
 */
router.post('/reset-password', authLimiter, authController.resetPassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Issue a new JWT using a valid refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token issued
 *       401:
 *         description: Refresh token invalid or expired
 */
router.post('/refresh', authLimiter, authController.refresh);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth — redirects to Google consent screen
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'], accessType: 'offline', prompt: 'consent' }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback — issues a one-time code, redirects to frontend
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to frontend /auth/callback?code=...
 */
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
    authController.googleCallback
);

/**
 * @swagger
 * /api/auth/google/exchange:
 *   post:
 *     summary: Exchange the one-time OAuth code for a JWT and refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Returns JWT, refreshToken, and user
 *       400:
 *         description: Code missing, invalid, or expired
 */
router.post('/google/exchange', authLimiter, authController.googleExchange);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns user object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @swagger
 * /api/auth/me/profile:
 *   patch:
 *     summary: Update profile — firstName, lastName, bio, activityVisibility, linkedinUrl, instagramHandle, avatar image
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:          { type: string }
 *               lastName:           { type: string }
 *               bio:                { type: string }
 *               activityVisibility: { type: string, enum: [public, friends, private] }
 *               linkedinUrl:        { type: string, example: 'https://linkedin.com/in/yourname' }
 *               instagramHandle:    { type: string, example: 'yourhandle' }
 *               avatar:             { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated — returns updated user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/me/profile', authMiddleware, (req, res, next) => {
    uploadImage.single('avatar')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        next();
    });
}, authController.updateProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Invalidate the current refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Invalidate all refresh tokens for the account (sign out all devices)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: All sessions terminated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout-all', authMiddleware, authController.logoutAll);

/**
 * @swagger
 * /api/auth/send-verification:
 *   post:
 *     summary: Resend the email verification link
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Verification email sent
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/send-verification', authMiddleware, authController.sendVerificationEmail);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email using the token from the verification email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Token invalid or expired
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/auth/me/password:
 *   patch:
 *     summary: Change password (requires current password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string, example: "NewPass123!" }
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: New password fails validation or account uses Google sign-in only
 *       401:
 *         description: Current password is wrong
 */
router.patch('/me/password', authMiddleware, authController.changePassword);

/**
 * @swagger
 * /api/auth/me/username:
 *   patch:
 *     summary: Change username
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username: { type: string, example: newusername }
 *     responses:
 *       200:
 *         description: Username changed — returns updated user
 *       400:
 *         description: Username format invalid
 *       409:
 *         description: Username already taken
 */
router.patch('/me/username', authMiddleware, authController.changeUsername);

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Soft-delete the account (30-day grace period before permanent deletion)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Account scheduled for deletion
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/me', authMiddleware, authController.deleteAccount);

/**
 * @swagger
 * /api/auth/me/restore:
 *   post:
 *     summary: Cancel a pending account deletion during the 30-day grace period
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Account restored
 *       400:
 *         description: Account is not pending deletion
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/restore', authMiddleware, authController.restoreAccount);

/**
 * @swagger
 * /api/auth/me/google/link:
 *   post:
 *     summary: Link a Google account to an existing email/password account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, description: One-time OAuth code from Google }
 *     responses:
 *       200:
 *         description: Google account linked
 *       400:
 *         description: Google account already linked to another account
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/google/link', authMiddleware, authController.googleLink);

/**
 * @swagger
 * /api/auth/me/google/link:
 *   delete:
 *     summary: Unlink Google account
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keepNotes: { type: boolean, default: true, description: Whether to keep notes imported from Google Drive }
 *     responses:
 *       200:
 *         description: Google account unlinked
 *       400:
 *         description: No Google account linked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/me/google/link', authMiddleware, authController.googleUnlink);

module.exports = router;
