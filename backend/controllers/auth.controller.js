const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// AUTH CONTROLLER
// Purpose: Handle business logic for all authentication endpoints
// Used by: routes/auth.routes.js
// Endpoints: register, login, me, forgotPassword, resetPassword
// ============================================================

// ----------------------------------------
// HELPER: Sign a JWT for a given user ID
// ----------------------------------------
const signToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

// ----------------------------------------
// POST /api/auth/register
// Purpose: Create a new user and return a JWT
// ----------------------------------------
exports.register = async (req, res) => {
    const { email, username, password, firstName, lastName } = req.body;

    // Return 409 if email or username is already taken
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        return res.status(409).json({ success: false, error: 'Email or username already in use' });
    }

    // Create user — pre-save hook in User.js automatically hashes the password
    const user = await User.create({ email, username, password, firstName, lastName });

    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user });
};

// ----------------------------------------
// POST /api/auth/login
// Purpose: Validate credentials and return a JWT
// ----------------------------------------
exports.login = async (req, res) => {
    const { email, password } = req.body;

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

    res.status(200).json({ success: true, token, user });
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
