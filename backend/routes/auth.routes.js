const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/auth.controller');
const mobileAuthController = require('../controllers/auth.mobile.controller');
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
 *     summary: Issue a new JWT using a valid refresh token (with token rotation)
 *     description: >
 *       Reads the refresh token from the httpOnly cookie. Implements full token rotation —
 *       the incoming token is immediately revoked and a new httpOnly refresh cookie is issued.
 *       The old sessionId is written to the Redis blocklist so any still-valid JWT bearing it
 *       is immediately rejected by auth middleware. Prevents replay attacks if a refresh token
 *       is intercepted. Device and location metadata is carried forward to the new token.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New JWT issued; new refresh token set in httpOnly cookie (Set-Cookie header)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 token: { type: string, description: "New JWT access token (1 day)" }
 *       400:
 *         description: No refresh token cookie present
 *       401:
 *         description: Refresh token invalid, expired, or already rotated
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
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'], accessType: 'offline', prompt: 'consent' }));

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
router.post('/mobile/logout', authMiddleware, authController.mobileLogout);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Immediately invalidate all sessions (sign out all devices)
 *     description: >
 *       Increments the user's tokenVersion so all existing JWTs are rejected on the next request,
 *       then revokes all refresh tokens. Invalidation is immediate — no waiting for JWT expiry.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: All sessions terminated immediately
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout-all', authMiddleware, authController.logoutAll);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: List active sessions for the current user
 *     description: >
 *       Returns all non-revoked, non-expired RefreshToken records.
 *       Each session includes a human-readable device label (browser + version + OS),
 *       a human-readable location resolved from the client IP at login (e.g. "San Francisco, CA"),
 *       last active timestamp, and an isCurrent flag marking the session that issued the request's JWT.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Array of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:         { type: string }
 *                       deviceId:    { type: string, example: "Chrome 120 on macOS 10.15.7" }
 *                       ipLocation:  { type: string, example: "San Francisco, CA", nullable: true, description: "City and state/country resolved from login IP; null for local/unknown IPs" }
 *                       lastUsedAt:  { type: string, format: date-time, nullable: true }
 *                       createdAt:   { type: string, format: date-time }
 *                       isCurrent:   { type: boolean, description: "True when this session issued the current request JWT" }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/sessions', authMiddleware, authController.getSessions);

/**
 * @swagger
 * /api/auth/sessions/{id}:
 *   delete:
 *     summary: Revoke a specific session by its RefreshToken record ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The _id of the RefreshToken record to revoke
 *     responses:
 *       200:
 *         description: Session revoked
 *       404:
 *         description: Session not found or already revoked
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/sessions/:id', authMiddleware, authController.revokeSession);

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

// ============================================================
// MOBILE AUTH ROUTES
// Purpose: Auth endpoints for the Android app
// These mirror the web auth routes but return the refresh token
// in the JSON body instead of setting an httpOnly cookie,
// because Android's OkHttp cannot read or send httpOnly cookies.
// ============================================================

/**
 * @swagger
 * /api/auth/mobile/login:
 *   post:
 *     summary: Mobile login — email/password, returns refreshToken in body
 *     description: >
 *       Identical to POST /api/auth/login except the refresh token is returned
 *       in the JSON body instead of being set as an httpOnly cookie.
 *       Android clients store it in EncryptedSharedPreferences.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean }
 *                 token:        { type: string, description: "JWT access token (1 day)" }
 *                 refreshToken: { type: string, description: "Raw refresh token — store in EncryptedSharedPreferences" }
 *                 user:         { type: object }
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests (10 per 15 minutes)
 */
router.post('/mobile/login', authLimiter, mobileAuthController.mobileLogin);

/**
 * @swagger
 * /api/auth/mobile/refresh:
 *   post:
 *     summary: Mobile token refresh — reads refreshToken from body, returns new tokens
 *     description: >
 *       Identical to POST /api/auth/refresh except the refresh token is read from
 *       the JSON body instead of an httpOnly cookie, and the new refresh token is
 *       returned in the JSON body. Implements full token rotation — the incoming
 *       token is immediately revoked. The old sessionId is written to the Redis
 *       blocklist so any still-valid JWT bearing it is immediately rejected.
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
 *               refreshToken: { type: string, description: "Raw refresh token from EncryptedSharedPreferences" }
 *     responses:
 *       200:
 *         description: New JWT and refreshToken issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean }
 *                 token:        { type: string, description: "New JWT access token (1 day)" }
 *                 refreshToken: { type: string, description: "New raw refresh token — replace stored value in EncryptedSharedPreferences" }
 *       400:
 *         description: refreshToken missing from request body
 *       401:
 *         description: Refresh token invalid, expired, or already rotated
 *       429:
 *         description: Too many requests (10 per 15 minutes)
 */
router.post('/mobile/refresh', authLimiter, mobileAuthController.mobileRefresh);

/**
 * @swagger
 * /api/auth/google/mobile:
 *   post:
 *     summary: Mobile Google Sign-In — verifies Credential Manager ID token, returns tokens in body
 *     description: >
 *       Accepts a Google ID token produced by Android's Credential Manager API.
 *       Verifies the token server-side using google-auth-library (OAuth2Client.verifyIdToken)
 *       with the WEB_CLIENT_ID (GOOGLE_CLIENT_ID env var). Finds or creates a user from
 *       the verified Google payload. Returns JWT and refreshToken in the JSON body.
 *       The Android OAuth client ID (registered in Google Cloud Console with SHA-1 fingerprint)
 *       is used only for Credential Manager registration — it is NOT passed as the audience.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string, description: "Google ID token from Credential Manager API" }
 *     responses:
 *       200:
 *         description: Google Sign-In successful — returns JWT, refreshToken, and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean }
 *                 token:        { type: string, description: "JWT access token (1 day)" }
 *                 refreshToken: { type: string, description: "Raw refresh token — store in EncryptedSharedPreferences" }
 *                 user:         { type: object }
 *       400:
 *         description: idToken missing from request body
 *       401:
 *         description: Google ID token verification failed
 *       429:
 *         description: Too many requests (10 per 15 minutes)
 */
router.post('/google/mobile', authLimiter, mobileAuthController.googleMobileLogin);

// ============================================================
// ONBOARDING ROUTES
// Purpose: Track completion of the new-user onboarding flow and feature tour
// ============================================================

router.post('/me/onboarding/complete', authMiddleware, authController.completeOnboarding);
router.post('/me/tour/complete', authMiddleware, authController.completeTour);
router.patch('/me/tour/reset', authMiddleware, authController.resetTour);

module.exports = router;
