const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');
const { setKey } = require('../lib/cache');
const { hardDeleteUser } = require('../services/account.service');

// ============================================================
// MOBILE AUTH CONTROLLER
// Purpose: Auth endpoints for the Android app
//
// The web app uses httpOnly cookies for refresh tokens, which
// Android's HTTP client cannot read or send. These endpoints
// return the refresh token in the JSON body so the Android
// client can store it in EncryptedSharedPreferences.
//
// Used by: routes/auth.routes.js (mounted under /api/auth/mobile)
// Endpoints:
//   POST /api/auth/mobile/login
//   POST /api/auth/mobile/refresh
//   POST /api/auth/google/mobile
// ============================================================

// ----------------------------------------
// HELPER: Sign a short-lived JWT access token (1d)
// Duplicated from auth.controller.js — kept local to avoid coupling
// ----------------------------------------
const signToken = (userId, tokenVersion = 0, sessionId = null) => {
    const payload = { userId, tokenVersion };
    if (sessionId) payload.sessionId = String(sessionId);
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d', algorithm: 'HS256' });
};

// ----------------------------------------
// HELPER: Generate a long-lived refresh token (30d)
// Stores SHA-256 hash in RefreshToken collection
// Returns { rawToken, sessionId } — rawToken goes to client, sessionId embedded in JWT
// ----------------------------------------
const generateRefreshToken = async (userId, deviceId, ipAddress = null, ipLocation = null) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const doc = await RefreshToken.create({ userId, tokenHash, deviceId: deviceId || null, ipAddress: ipAddress || null, ipLocation: ipLocation || null, expiresAt });

    return { rawToken, sessionId: doc._id };
};

// ----------------------------------------
// POST /api/auth/mobile/login
// Purpose: Identical to POST /api/auth/login except:
//   - Returns refreshToken in JSON body (not as httpOnly cookie)
//   - Android stores it in EncryptedSharedPreferences
// ----------------------------------------
exports.mobileLogin = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        console.warn(JSON.stringify({ event: 'auth_failure', reason: 'email_not_found', email, ip: req.ip, client: 'android', ts: new Date().toISOString() }));
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        console.warn(JSON.stringify({ event: 'auth_failure', reason: 'wrong_password', email, ip: req.ip, client: 'android', ts: new Date().toISOString() }));
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Hard delete if grace period has expired
    if (user.pendingDeletion && user.scheduledDeletionAt && user.scheduledDeletionAt <= new Date()) {
        await hardDeleteUser(user._id);
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.pendingDeletion) {
        return res.status(403).json({ success: false, error: 'Account is scheduled for deletion. Use the restore endpoint to recover it.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const loginIp = req.ip || null;
    const { rawToken: refreshToken, sessionId } = await generateRefreshToken(
        user._id,
        'Android App',
        loginIp,
        null
    );
    const token = signToken(user._id, user.tokenVersion, sessionId);

    const userObj = user.toObject();
    delete userObj.password;

    // Return refreshToken in body — no httpOnly cookie
    res.status(200).json({ success: true, token, refreshToken, user: userObj });
};

// ----------------------------------------
// POST /api/auth/mobile/refresh
// Purpose: Identical to POST /api/auth/refresh except:
//   - Reads refreshToken from JSON body (not httpOnly cookie)
//   - Returns new refreshToken in JSON body
// Implements full token rotation — old token is revoked immediately
// ----------------------------------------
exports.mobileRefresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(stored.userId);
    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Revoke old token immediately (rotation) — prevents replay if token is intercepted
    stored.revokedAt = new Date();
    await stored.save();

    // Write old sessionId to Redis blocklist so any still-valid JWT bearing it is rejected immediately
    const jwtTtlSeconds = parseInt(process.env.JWT_EXPIRES_SECONDS, 10) || 86400;
    await setKey(`revoked_session:${stored._id}`, jwtTtlSeconds);

    // Issue new refresh token — inherit device metadata
    const { rawToken: newRawToken, sessionId } = await generateRefreshToken(
        stored.userId, stored.deviceId, stored.ipAddress, stored.ipLocation
    );

    const token = signToken(stored.userId, user.tokenVersion, sessionId);

    // Return new refreshToken in body — no httpOnly cookie
    res.status(200).json({ success: true, token, refreshToken: newRawToken });
};

// ----------------------------------------
// POST /api/auth/google/mobile
// Purpose: Accept a Google ID token from Android Credential Manager
//          Verify it server-side and return JWT + refreshToken in body
//
// Why a separate endpoint: the web OAuth flow uses authorization codes via
// browser redirect, which Android cannot do. Credential Manager produces an
// ID token directly — this endpoint accepts and verifies that token.
//
// The WEB_CLIENT_ID (GOOGLE_CLIENT_ID) is used to verify the token audience.
// No new env var is needed.
// ----------------------------------------
exports.googleMobileLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    // Verify the ID token with Google — never trust a client-provided identity claim directly
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid Google ID token' });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

    // Find or create user by googleId or email — same upsert logic as web OAuth callback
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
        // Attach googleId if this is an existing email/password user signing in with Google for the first time
        if (!user.googleId) {
            user.googleId = googleId;
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save();
        }
    } else {
        // New user — create account from Google profile
        const baseUsername = (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
        let username = baseUsername;
        let suffix = 1;
        while (await User.findOne({ username })) {
            username = `${baseUsername}${suffix++}`;
        }

        user = await User.create({
            email,
            googleId,
            firstName: firstName || '',
            lastName: lastName || '',
            username,
            avatar: avatar || null,
            emailVerified: true, // Google has verified the email
        });
    }

    if (user.pendingDeletion) {
        return res.status(403).json({ success: false, error: 'Account is scheduled for deletion.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const loginIp = req.ip || null;
    const { rawToken: refreshToken, sessionId } = await generateRefreshToken(
        user._id,
        'Android App (Google)',
        loginIp,
        null
    );
    const token = signToken(user._id, user.tokenVersion, sessionId);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({ success: true, token, refreshToken, user: userObj });
};
