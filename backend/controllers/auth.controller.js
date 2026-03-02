const crypto = require('crypto');
const User = require('../models/User');
const Note = require('../models/Note');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// AUTH CONTROLLER
// Purpose: Handle business logic for all authentication endpoints
// Used by: routes/auth.routes.js
// Endpoints: register, login, me, forgotPassword, resetPassword,
//            googleCallback, googleLink, googleUnlink,
//            refresh, logout, logoutAll
// ============================================================

// ----------------------------------------
// HELPER: Sign a short-lived JWT access token (1d)
// ----------------------------------------
const signToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

// ----------------------------------------
// HELPER: Generate a long-lived refresh token (30d)
// Stores a SHA-256 hash in the RefreshToken collection
// Returns the raw token to give to the client — never stored raw
// ----------------------------------------
const generateRefreshToken = async (userId, deviceId) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await RefreshToken.create({ userId, tokenHash, deviceId: deviceId || null, expiresAt });

    return rawToken;
};

// ----------------------------------------
// POST /api/auth/register
// Purpose: Create a new user and return a JWT
// ----------------------------------------
exports.register = async (req, res) => {
    const { email, username, password, firstName, lastName, deviceId } = req.body;

    // Return 409 if email or username is already taken
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        return res.status(409).json({ success: false, error: 'Email or username already in use' });
    }

    // Create user — pre-save hook in User.js automatically hashes the password
    const user = await User.create({ email, username, password, firstName, lastName });

    const token = signToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, deviceId);

    res.status(201).json({ success: true, token, refreshToken, user });
};

// ----------------------------------------
// POST /api/auth/login
// Purpose: Validate credentials and return a JWT
// ----------------------------------------
exports.login = async (req, res) => {
    const { email, password, deviceId } = req.body;

    // password is select:false in the schema — must opt in explicitly to get it back
    const user = await User.findOne({ email }).select('+password');

    // Use a generic message — don't reveal whether email or password was wrong
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Track last login time
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, deviceId);

    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).json({ success: true, token, refreshToken, user: userObj });
};

// ----------------------------------------
// GET /api/auth/me
// Purpose: Return the currently authenticated user (from req.user set by auth middleware)
// ----------------------------------------
exports.me = async (req, res) => {
    // authMiddleware already verified the token and attached the full user to req.user
    res.status(200).json({ success: true, user: req.user });
};

// ----------------------------------------
// POST /api/auth/forgot-password
// Purpose: Generate a reset token and send a reset email via Resend
// ----------------------------------------
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return 200 — never reveal whether an email exists in the system
    if (!user) {
        return res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent' });
    }

    // createPasswordResetToken() generates a random token, stores the hashed version
    // on the user, sets a 1hr expiry, and returns the raw token for the email link
    const rawToken = user.createPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await resend.emails.send({
        from: 'Continuum <onboarding@resend.dev>',
        to: user.email,
        subject: 'Reset your Continuum password',
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
               <a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent' });
};

// ----------------------------------------
// POST /api/auth/reset-password
// Purpose: Verify the reset token and set the new password
// ----------------------------------------
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    // Hash the raw token from the URL — must match how createPasswordResetToken stored it
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired yet
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
    }

    // Assign new password — pre-save hook in User.js will re-hash it automatically
    user.password = newPassword;

    // Clear the reset token fields so the link can't be reused
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
};

// ----------------------------------------
// GET /api/auth/google/callback
// Purpose: Passport has already verified the Google token and attached the user to req.user
//          Sign a JWT and redirect to the frontend with it as a query param
// ----------------------------------------
exports.googleCallback = (req, res) => {
    const token = signToken(req.user._id);

    // Redirect to frontend — token passed as query param so the client can store it
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
};

// ----------------------------------------
// POST /api/auth/me/google/link
// Purpose: Link a Google account to an existing email/password user
//          req.body contains the googleId and tokens from a client-side Google sign-in
// ----------------------------------------
exports.googleLink = async (req, res) => {
    const { googleId, googleAccessToken, googleRefreshToken } = req.body;

    // Prevent linking a googleId that's already tied to another account
    const alreadyLinked = await User.findOne({ googleId });
    if (alreadyLinked) {
        return res.status(409).json({ success: false, error: 'This Google account is already linked to another user' });
    }

    // Attach Google fields to the current user (req.user set by authMiddleware)
    req.user.googleId = googleId;
    req.user.googleAccessToken = googleAccessToken;
    req.user.googleRefreshToken = googleRefreshToken;
    req.user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000);
    await req.user.save();

    res.status(200).json({ success: true, user: req.user });
};

// ----------------------------------------
// DELETE /api/auth/me/google/link
// Purpose: Unlink Google from the current user's account
//          Only allowed if the user has a password (otherwise they'd be locked out)
// ----------------------------------------
exports.googleUnlink = async (req, res) => {
    // Prevent lockout — Google-only users have no password to fall back on
    if (!req.user.password) {
        return res.status(400).json({ success: false, error: 'Set a password before unlinking Google' });
    }

    const { keepNotes = true } = req.body;

    // If keepNotes is false, soft delete all notes imported from Google Docs
    // Google Docs notes are identified by googleDocId being set on the note
    if (!keepNotes) {
        await Note.updateMany(
            { userId: req.user._id, googleDocId: { $ne: null } },
            { deletedAt: new Date() }
        );
    }

    req.user.googleId = undefined;
    req.user.googleAccessToken = undefined;
    req.user.googleRefreshToken = undefined;
    req.user.googleTokenExpiry = undefined;
    await req.user.save();

    res.status(200).json({ success: true, user: req.user });
};

// ----------------------------------------
// POST /api/auth/refresh
// Purpose: Exchange a valid refresh token for a new access token
// Public — no JWT required (used when the access token has expired)
// ----------------------------------------
exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const token = signToken(stored.userId);

    res.status(200).json({ success: true, token });
};

// ----------------------------------------
// POST /api/auth/logout
// Purpose: Revoke the current device's refresh token
// Idempotent — returns 200 even if token is already revoked or not found
// ----------------------------------------
exports.logout = async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await RefreshToken.findOneAndUpdate(
            { tokenHash, revokedAt: null },
            { revokedAt: new Date() }
        );
    }

    res.status(200).json({ success: true, message: 'Logged out' });
};

// ----------------------------------------
// POST /api/auth/logout-all
// Purpose: Revoke all active refresh tokens for this user (all devices)
// ----------------------------------------
exports.logoutAll = async (req, res) => {
    await RefreshToken.updateMany(
        { userId: req.user._id, revokedAt: null },
        { revokedAt: new Date() }
    );

    res.status(200).json({ success: true, message: 'Logged out of all devices' });
};
