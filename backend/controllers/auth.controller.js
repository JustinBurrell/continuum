const crypto = require('crypto');
const geoip = require('geoip-lite');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Note = require('../models/Note');
const RefreshToken = require('../models/RefreshToken');
const OAuthCode = require('../models/OAuthCode');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const cloudinary = require('../config/cloudinary');
const { invalidate, setKey } = require('../lib/cache');
const { hardDeleteUser } = require('../services/account.service');

const resend = new Resend(process.env.RESEND_API_KEY);
const posthog = require('../lib/posthog');

function emailTemplate(content) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:40px;max-width:560px;">
        <tr><td>
          ${content}
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;" />
          <p style="color:#6B7280;font-size:13px;margin:0 0 16px;">Team Continuum</p>
          <img src="https://usecontinuum.dev/wordmark.svg" alt="Continuum" height="22" style="display:block;" />
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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
// tokenVersion is embedded so auth middleware can immediately reject stale tokens after logoutAll
// sessionId (the RefreshToken _id) is embedded so middleware can immediately reject
// individually revoked sessions via the Redis blocklist
// ----------------------------------------
const signToken = (userId, tokenVersion = 0, sessionId = null) => {
    const payload = { userId, tokenVersion };
    if (sessionId) payload.sessionId = String(sessionId);
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d', algorithm: 'HS256' });
};

// ----------------------------------------
// HELPER: Set the refresh token as an httpOnly cookie
// ----------------------------------------
const setRefreshCookie = (res, rawToken) => {
    res.cookie('refreshToken', rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
    });
};

// ----------------------------------------
// HELPER: Generate a long-lived refresh token (30d)
// Stores a SHA-256 hash in the RefreshToken collection
// Returns { rawToken, sessionId } — rawToken is set as httpOnly cookie, sessionId is embedded in JWT
// ----------------------------------------
const generateRefreshToken = async (userId, deviceId, ipAddress = null, ipLocation = null) => {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const doc = await RefreshToken.create({ userId, tokenHash, deviceId: deviceId || null, ipAddress: ipAddress || null, ipLocation: ipLocation || null, expiresAt });

    return { rawToken, sessionId: doc._id };
};

// ----------------------------------------
// HELPER: Parse a human-readable device label from a User-Agent string
// e.g. "Chrome 120 on macOS", "Safari 17 on iPhone (iOS 17)", "Firefox 121 on Windows"
// ----------------------------------------
const parseDeviceLabel = (ua = '') => {
    if (!ua) return 'Unknown device';

    // Browser + major version
    let browser = 'Browser';
    let browserMatch;
    if (/Edg\/(\d+)/.test(ua)) {
        browser = `Edge ${ua.match(/Edg\/(\d+)/)[1]}`;
    } else if (/OPR\/(\d+)|Opera\/(\d+)/.test(ua)) {
        browserMatch = ua.match(/OPR\/(\d+)/) || ua.match(/Opera\/(\d+)/);
        browser = `Opera ${browserMatch[1]}`;
    } else if (/Firefox\/(\d+)/.test(ua)) {
        browser = `Firefox ${ua.match(/Firefox\/(\d+)/)[1]}`;
    } else if (/Chrome\/(\d+)/.test(ua) && !/Chromium/.test(ua)) {
        browser = `Chrome ${ua.match(/Chrome\/(\d+)/)[1]}`;
    } else if (/Version\/(\d+).*Safari/.test(ua) && !/Chrome/.test(ua)) {
        browser = `Safari ${ua.match(/Version\/(\d+)/)[1]}`;
    } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
        browser = 'Safari';
    }

    // Device type + OS
    let device = '';
    let os = 'Unknown OS';
    if (/iPhone/.test(ua)) {
        device = 'iPhone';
        const iosMatch = ua.match(/CPU iPhone OS ([\d_]+)/);
        os = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
    } else if (/iPad/.test(ua)) {
        device = 'iPad';
        const iosMatch = ua.match(/CPU OS ([\d_]+)/);
        os = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iPadOS';
    } else if (/Android/.test(ua)) {
        const androidMatch = ua.match(/Android ([\d.]+)/);
        os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (/Windows NT ([\d.]+)/.test(ua)) {
        const ntMap = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
        const ntVer = ua.match(/Windows NT ([\d.]+)/)[1];
        os = `Windows ${ntMap[ntVer] || ntVer}`;
    } else if (/Mac OS X ([\d_]+)/.test(ua)) {
        const macMatch = ua.match(/Mac OS X ([\d_]+)/);
        os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
    } else if (/Linux/.test(ua)) {
        os = 'Linux';
    }

    if (device) return `${browser} on ${device} (${os})`;
    return `${browser} on ${os}`;
};

// ----------------------------------------
// HELPER: Resolve a client IP to a human-readable location string
// Returns "City, ST" (US) or "City, Country" (elsewhere), or null for loopback/private/unknown
// ----------------------------------------
const LOOPBACK_IPS = new Set(['::1', '127.0.0.1', '::ffff:127.0.0.1']);
const resolveLocation = (ip) => {
    if (!ip) return null;
    const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
    if (LOOPBACK_IPS.has(normalized)) return null;
    const geo = geoip.lookup(normalized);
    if (!geo) return null;
    const parts = [];
    if (geo.city) parts.push(geo.city);
    if (geo.country === 'US' && geo.region) parts.push(geo.region);
    else if (geo.country) parts.push(geo.country);
    return parts.join(', ') || null;
};

// ----------------------------------------
// POST /api/auth/register
// Purpose: Create a new user and return a JWT
// ----------------------------------------
exports.register = async (req, res) => {
    const { email, username, password, firstName, lastName } = req.body;

    const emailExists = await User.findOne({ email }).select('_id');
    if (emailExists) return res.status(409).json({ success: false, error: 'Email already registered' });
    const usernameExists = await User.findOne({ username }).select('_id');
    if (usernameExists) return res.status(409).json({ success: false, error: 'Username already taken' });

    // Create user — pre-save hook in User.js automatically hashes the password
    const user = await User.create({ email, username, password, firstName, lastName });

    // Auto-assign roles based on env var email lists — read at request time so tests can override
    const founderEmails = (process.env.FOUNDER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const teamEmails    = (process.env.TEAM_EMAILS    || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const assignedRoles = [];
    if (founderEmails.includes(email.toLowerCase())) assignedRoles.push('founder');
    if (teamEmails.includes(email.toLowerCase())) assignedRoles.push('team');
    if (assignedRoles.length) await User.updateOne({ _id: user._id }, { roles: assignedRoles });

    const regIp = req.ip || null;
    const { rawToken: refreshToken, sessionId } = await generateRefreshToken(
        user._id,
        parseDeviceLabel(req.headers['user-agent']),
        regIp,
        resolveLocation(regIp)
    );
    const token = signToken(user._id, user.tokenVersion, sessionId);

    // Auto-send verification email — non-blocking, don't fail registration if it errors
    try {
        const rawToken = user.createEmailVerificationToken();
        await User.findByIdAndUpdate(user._id, {
            emailVerificationToken: user.emailVerificationToken,
            emailVerificationExpires: user.emailVerificationExpires,
        });
        const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${rawToken}`;
        await resend.emails.send({
            from: 'Continuum <noreply@usecontinuum.dev>',
            to: user.email,
            subject: 'Verify your Continuum email',
            html: emailTemplate(`
                <p style="color:#111827;font-size:16px;margin:0 0 12px;">Hi ${user.firstName},</p>
                <p style="color:#374151;font-size:15px;margin:0 0 24px;">Welcome to Continuum! Click the button below to verify your email address. This link expires in 24 hours.</p>
                <a href="${verifyUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">Verify Email</a>
                <p style="color:#6B7280;font-size:13px;margin:24px 0 0;">If you didn't create a Continuum account, you can safely ignore this email.</p>
            `),
        });
    } catch (_) { /* non-blocking */ }

    const userObj = user.toObject();
    delete userObj.password;
    if (assignedRoles.length) userObj.roles = assignedRoles; // reflect the updateOne above since user was created before roles were set
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, token, user: userObj });
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
        console.warn(JSON.stringify({ event: 'auth_failure', reason: 'email_not_found', email, ip: req.ip, ua: req.headers['user-agent'], ts: new Date().toISOString() }));
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        console.warn(JSON.stringify({ event: 'auth_failure', reason: 'wrong_password', email, ip: req.ip, ua: req.headers['user-agent'], ts: new Date().toISOString() }));
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Hard delete if grace period has expired — treat as non-existent
    if (user.pendingDeletion && user.scheduledDeletionAt && user.scheduledDeletionAt <= new Date()) {
        await hardDeleteUser(user._id);
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Block login for accounts pending deletion within the grace period
    if (user.pendingDeletion) {
        return res.status(403).json({ success: false, error: 'Account is scheduled for deletion. Use the restore endpoint to recover it.' });
    }

    // Track last login time
    user.lastLoginAt = new Date();

    await user.save();

    const loginIp = req.ip || null;
    const { rawToken: refreshToken, sessionId } = await generateRefreshToken(
        user._id,
        parseDeviceLabel(req.headers['user-agent']),
        loginIp,
        resolveLocation(loginIp)
    );
    const token = signToken(user._id, user.tokenVersion, sessionId);

    const userObj = user.toObject();
    delete userObj.password;
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, token, user: userObj });
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

    // Block reset for unverified accounts — we cannot confirm the registrant owns the email
    if (!user.emailVerified) {
        return res.status(400).json({ success: false, error: 'Please verify your email before resetting your password. Check your inbox for the verification email.' });
    }

    // createPasswordResetToken() generates a random token, stores the hashed version
    // on the user, sets a 1hr expiry, and returns the raw token for the email link
    const rawToken = user.createPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await resend.emails.send({
        from: 'Continuum <noreply@usecontinuum.dev>',
        to: user.email,
        subject: 'Reset your Continuum password',
        html: emailTemplate(`
            <p style="color:#111827;font-size:16px;margin:0 0 12px;">Reset your password</p>
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">Reset Password</a>
            <p style="color:#6B7280;font-size:13px;margin:24px 0 0;">If you didn't request a password reset, you can safely ignore this email.</p>
        `),
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
exports.googleCallback = async (req, res) => {
    // Generate a random one-time code — never put the JWT in a URL
    const rawCode = crypto.randomBytes(16).toString('hex');
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    await OAuthCode.create({
        codeHash,
        userId: req.user._id,
        expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${rawCode}`);
};

// ----------------------------------------
// POST /api/auth/google/exchange
// Purpose: Exchange a one-time OAuth code for a JWT + refresh token
//          Code is single-use and expires after 60 seconds
// ----------------------------------------
exports.googleExchange = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ success: false, error: 'code is required' });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const record = await OAuthCode.findOne({ codeHash, used: false, expiresAt: { $gt: new Date() } });

    if (!record) {
        return res.status(400).json({ success: false, error: 'Invalid or expired code' });
    }

    // Mark as used immediately — prevents replay within the 60s window
    await OAuthCode.findByIdAndUpdate(record._id, { used: true });

    // Invalidate the Redis user cache so /auth/me returns the freshly updated user
    // (Passport may have just written googleId/tokens to MongoDB — stale cache would hide that)
    await invalidate(`user:${record.userId}`).catch(() => {});

    const user = await User.findById(record.userId);
    if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
    }

    const oauthIp = req.ip || null;
    const { rawToken: refreshToken, sessionId } = await generateRefreshToken(
        record.userId,
        parseDeviceLabel(req.headers['user-agent']),
        oauthIp,
        resolveLocation(oauthIp)
    );
    const token = signToken(user._id, user.tokenVersion, sessionId);

    setRefreshCookie(res, refreshToken);
    res.status(200).json({ success: true, token });
};

// ----------------------------------------
// POST /api/auth/me/google/link
// Purpose: Link a Google account to an existing email/password user
//          Client sends a Google ID token — server verifies it with Google before trusting the googleId
// ----------------------------------------
exports.googleLink = async (req, res) => {
    const { idToken, googleAccessToken, googleRefreshToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    // Verify the ID token with Google — never trust a client-provided googleId directly
    let googleId;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        googleId = ticket.getPayload().sub;
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid Google ID token' });
    }

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

    posthog.capture(req.user, 'google_auth_linked');

    res.status(200).json({ success: true, user: req.user });
};

// ----------------------------------------
// DELETE /api/auth/me/google/link
// Purpose: Unlink Google from the current user's account
//          Only allowed if the user has a password (otherwise they'd be locked out)
// ----------------------------------------
exports.googleUnlink = async (req, res) => {
    if (!req.user.googleId) {
        return res.status(400).json({ success: false, error: 'No Google account is linked' });
    }

    // Prevent lockout — Google-only users have no password to fall back on
    // Must explicitly select password since it is select:false in the schema
    const userWithPassword = await User.findById(req.user._id).select('+password');
    if (!userWithPassword?.password) {
        return res.status(400).json({ success: false, error: 'Set a password before unlinking Google' });
    }

    const { keepNotes = true } = req.body || {};

    // If keepNotes is false, soft delete all notes imported from Google Docs
    // Google Docs notes are identified by googleDocId being set on the note
    if (!keepNotes) {
        await Note.updateMany(
            { userId: req.user._id, googleDocId: { $ne: null } },
            { deletedAt: new Date() }
        );
    }

    const updated = await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { googleId: '', googleAccessToken: '', googleRefreshToken: '', googleTokenExpiry: '' } },
        { new: true }
    );

    // Invalidate Redis cache so subsequent /auth/me calls reflect the unlinked state
    await invalidate(`user:${req.user._id}`).catch(() => {});

    res.status(200).json({ success: true, user: updated });
};

// ----------------------------------------
// POST /api/auth/refresh
// Purpose: Exchange a valid refresh token for a new access token
// Public — no JWT required (used when the access token has expired)
// ----------------------------------------
exports.refresh = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

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

    // Issue new refresh token — inherit device/location metadata so session UI stays consistent
    const { rawToken, sessionId } = await generateRefreshToken(
        stored.userId, stored.deviceId, stored.ipAddress, stored.ipLocation
    );
    setRefreshCookie(res, rawToken);

    const token = signToken(stored.userId, user.tokenVersion, sessionId);

    res.status(200).json({ success: true, token });
};

// ----------------------------------------
// PATCH /api/auth/me/profile
// Purpose: Update the authenticated user's profile fields and/or avatar
// Body (multipart/form-data): firstName, lastName, bio, settings.emailNotifications,
//                             settings.pushNotifications, avatar (file, optional)
// ----------------------------------------
exports.updateProfile = async (req, res) => {
    const allowed = ['firstName', 'lastName', 'bio'];
    const updates = {};

    // Collect whitelisted text fields
    for (const field of allowed) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    // Settings are nested — accept as flat body fields (settings.x)
    if (req.body['settings.emailNotifications'] !== undefined) {
        updates['settings.emailNotifications'] = req.body['settings.emailNotifications'] === 'true';
    }
    if (req.body['settings.pushNotifications'] !== undefined) {
        updates['settings.pushNotifications'] = req.body['settings.pushNotifications'] === 'true';
    }
    if (req.body['settings.activityVisibility'] !== undefined) {
        const validVisibility = ['private', 'friends', 'public'];
        if (!validVisibility.includes(req.body['settings.activityVisibility'])) {
            return res.status(400).json({ success: false, error: 'activityVisibility must be private, friends, or public' });
        }
        updates['settings.activityVisibility'] = req.body['settings.activityVisibility'];
    }

    // Social links — validated separately (not in whitelist loop)
    if (req.body.linkedinUrl !== undefined) {
        const url = req.body.linkedinUrl.trim();
        if (url === '') {
            updates.linkedinUrl = null;
        } else if (!/^https:\/\/(www\.)?linkedin\.com\/in\//.test(url)) {
            return res.status(400).json({ success: false, error: 'Invalid LinkedIn URL' });
        } else {
            updates.linkedinUrl = url;
        }
    }
    if (req.body.instagramHandle !== undefined) {
        const handle = req.body.instagramHandle.trim().replace(/^@/, '');
        if (handle === '') {
            updates.instagramHandle = null;
        } else if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
            return res.status(400).json({ success: false, error: 'Invalid Instagram handle' });
        } else {
            updates.instagramHandle = handle;
        }
    }

    if (req.body.onboardingGoal !== undefined) {
        const validGoals = ['study_smarter', 'track_job_search', 'manage_coursework', 'collaborate', 'not_sure'];
        if (!validGoals.includes(req.body.onboardingGoal)) {
            return res.status(400).json({ success: false, error: 'Invalid onboardingGoal value' });
        }
        updates.onboardingGoal = req.body.onboardingGoal;
    }

    // Avatar upload — if a file was attached, upload to Cloudinary and set avatarUrl
    if (req.file) {
        const userId = req.user._id.toString();

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `continuum/profiles/${userId}`,
                    public_id: 'avatar',
                    resource_type: 'image',
                    overwrite: true,
                    // transformation: resize to 400x400 square, auto quality
                    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        updates.avatarUrl = uploadResult.secure_url;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields provided' });
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    invalidate(`user:${req.user._id}`).catch(() => {});
    res.status(200).json({ success: true, user: updatedUser });
};

// ----------------------------------------
// POST /api/auth/logout
// Purpose: Revoke the current device's refresh token
// Idempotent — returns 200 even if token is already revoked or not found
// ----------------------------------------
exports.logout = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await RefreshToken.findOneAndUpdate(
            { tokenHash, revokedAt: null },
            { revokedAt: new Date() }
        );
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({ success: true, message: 'Logged out' });
};

// ----------------------------------------
// POST /api/auth/mobile/logout
// Purpose: Revoke the refresh token sent in the request body (for mobile clients)
// ----------------------------------------
exports.mobileLogout = async (req, res) => {
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
// Purpose: Immediately invalidate all sessions — increments tokenVersion so existing JWTs are
//          rejected by auth middleware on the next request, then revokes all refresh tokens
// ----------------------------------------
exports.logoutAll = async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    await invalidate(`user:${req.user._id}`);
    await RefreshToken.updateMany(
        { userId: req.user._id, revokedAt: null },
        { revokedAt: new Date() }
    );
    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({ success: true, message: 'Logged out of all devices' });
};

// ----------------------------------------
// GET /api/auth/sessions
// Purpose: Return all active (non-revoked, non-expired) sessions for the current user
// ----------------------------------------
exports.getSessions = async (req, res) => {
    const tokens = await RefreshToken.find({
        userId: req.user._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }).select('_id deviceId ipAddress ipLocation lastUsedAt createdAt').sort({ createdAt: -1 });

    const sessions = tokens.map((t) => ({
        _id: t._id,
        deviceId: t.deviceId,
        ipLocation: t.ipLocation,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
        isCurrent: req.sessionId ? String(t._id) === req.sessionId : false,
    }));

    res.status(200).json({ success: true, sessions });
};

// ----------------------------------------
// DELETE /api/auth/sessions/:id
// Purpose: Revoke a single session by its RefreshToken record _id
// ----------------------------------------
exports.revokeSession = async (req, res) => {
    const session = await RefreshToken.findOne({
        _id: req.params.id,
        userId: req.user._id,
        revokedAt: null,
    });
    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
    }
    session.revokedAt = new Date();
    await session.save();

    // Write a Redis blocklist key so any existing JWT for this session is rejected
    // immediately by auth middleware — not just on next refresh attempt.
    // TTL matches JWT expiry (default 1 day). Fail-open: skip if Redis unavailable.
    const jwtTtlSeconds = parseInt(process.env.JWT_EXPIRES_SECONDS, 10) || 86400;
    await setKey(`revoked_session:${session._id}`, jwtTtlSeconds);

    res.status(200).json({ success: true });
};

// ----------------------------------------
// POST /api/auth/send-verification
// Purpose: Generate a verification token and send it to the user's email via Resend
// Protected — requires JWT (user must be logged in)
// ----------------------------------------
exports.sendVerificationEmail = async (req, res) => {
    if (req.user.emailVerified) {
        return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    // req.user may be a plain object deserialized from Redis cache (not a Mongoose doc),
    // so we can't call req.user.createEmailVerificationToken(). Inline the same logic.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    await User.findByIdAndUpdate(req.user._id, {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: tokenExpires,
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${rawToken}`;

    try {
        await resend.emails.send({
            from: 'Continuum <noreply@usecontinuum.dev>',
            to: req.user.email,
            subject: 'Verify your Continuum email',
            html: emailTemplate(`
            <p style="color:#111827;font-size:16px;margin:0 0 12px;">Hi ${req.user.firstName},</p>
            <p style="color:#374151;font-size:15px;margin:0 0 24px;">Click the button below to verify your email address. This link expires in 24 hours.</p>
            <a href="${verifyUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">Verify Email</a>
            <p style="color:#6B7280;font-size:13px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        `),
        });
    } catch (emailErr) {
        return res.status(500).json({ success: false, error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({ success: true, message: 'Verification email sent' });
};

// ----------------------------------------
// GET /api/auth/verify-email?token=
// Purpose: Validate the verification token and mark the user's email as verified in MongoDB
// Public — no JWT required (user clicks link from email, may not be logged in)
// ----------------------------------------
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Must select +emailVerificationToken since it's select:false in the schema
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken');

    if (!user) {
        return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
    }

    // Use findByIdAndUpdate to write directly — avoids running validators on fields
    // that aren't loaded (e.g. password is select:false on this document).
    // This guarantees emailVerified is written atomically and the token is cleared.
    await User.findByIdAndUpdate(user._id, {
        $set: { emailVerified: true },
        $unset: { emailVerificationToken: '', emailVerificationExpires: '' },
    });

    res.status(200).json({ success: true, message: 'Email verified successfully' });
};

// ----------------------------------------
// PATCH /api/auth/me/password
// Purpose: Change the authenticated user's password
// Requires current password for verification — prevents account takeover if JWT leaks
// Not available to Google-only users (no password set)
// ----------------------------------------
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
    }

    // Re-fetch with password — select:false means req.user never has it
    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
        return res.status(400).json({ success: false, error: 'No password set — use Forgot Password to create one first' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Validate new password against same rules as the schema
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters and contain a letter, number, and special character' });
    }

    // Assign — pre-save hook in User.js rehashes automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
};

// ----------------------------------------
// PATCH /api/auth/me/username
// Purpose: Change the authenticated user's username
// Validates format and checks uniqueness before saving
// ----------------------------------------
exports.changeUsername = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, error: 'username is required' });
    }

    const trimmed = username.trim().toLowerCase();

    // 3–30 chars, alphanumeric + underscores + hyphens only
    if (!/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
        return res.status(400).json({ success: false, error: 'Username must be 3–30 characters and contain only letters, numbers, underscores, or hyphens' });
    }

    // Check uniqueness — exclude the current user so they can "save" without changing
    const existing = await User.findOne({ username: trimmed, _id: { $ne: req.user._id } });
    if (existing) {
        return res.status(409).json({ success: false, error: 'Username is already taken' });
    }

    const updated = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { username: trimmed } },
        { new: true }
    );

    invalidate(`user:${req.user._id}`).catch(() => {});
    res.status(200).json({ success: true, user: updated });
};

// ----------------------------------------
// DELETE /api/auth/me
// Purpose: Soft-mark the account for deletion with a 30-day grace period.
//          User can restore by logging in within 30 days.
//          Hard delete cascades lazily when scheduledDeletionAt passes.
// Body: { password } — required for email/password users; optional for Google-only
// ----------------------------------------
exports.deleteAccount = async (req, res) => {
    const userId = req.user._id;
    // JWT is sufficient proof of identity — no password re-confirmation required

    // Soft-mark for deletion — hard delete cascades lazily when scheduledDeletionAt passes
    const scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await User.findByIdAndUpdate(userId, { pendingDeletion: true, scheduledDeletionAt });

    // Revoke all active sessions
    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });

    // Send deletion notice email — non-blocking
    try {
        const restoreDeadline = scheduledDeletionAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        await resend.emails.send({
            from: 'Continuum <noreply@usecontinuum.dev>',
            to: user.email,
            subject: 'Your Continuum account has been scheduled for deletion',
            html: emailTemplate(`
                <p style="color:#111827;font-size:16px;margin:0 0 12px;">Hi ${user.firstName},</p>
                <p style="color:#374151;font-size:15px;margin:0 0 12px;">Your account has been scheduled for deletion. <strong>All your data (notes, tasks, flashcards, messages, and more) will be permanently deleted on ${restoreDeadline}.</strong></p>
                <p style="color:#374151;font-size:15px;margin:0 0 24px;">Changed your mind? Simply log in before ${restoreDeadline} and your account will be fully restored.</p>
                <p style="color:#6B7280;font-size:13px;margin:0;">If you did not request this, log in immediately to restore your account.</p>
            `),
        });
    } catch (_) { /* non-blocking */ }

    posthog.capture(req.user, 'account_deletion_requested', { scheduledDeletionAt: scheduledDeletionAt.toISOString() });

    res.status(200).json({ success: true, message: 'Account scheduled for deletion. Log in within 30 days to restore it.' });
};

// ----------------------------------------
// POST /api/auth/me/restore
// Purpose: Cancel a pending deletion and restore the account
// Called when a pendingDeletion user explicitly requests restore (vs. implicit restore via login)
// ----------------------------------------
exports.restoreAccount = async (req, res) => {
    if (!req.user.pendingDeletion) {
        return res.status(400).json({ success: false, error: 'Account is not pending deletion' });
    }

    await User.findByIdAndUpdate(req.user._id, {
        pendingDeletion: false,
        scheduledDeletionAt: null,
    });

    posthog.capture(req.user, 'account_restored');

    // Re-fetch the clean user object to return
    const restored = await User.findById(req.user._id);
    res.status(200).json({ success: true, user: restored });
};

// ----------------------------------------
// POST /api/auth/me/onboarding/complete
// Purpose: Mark the profile setup portion of onboarding as done
// Idempotent — safe to call if already true
// ----------------------------------------
exports.completeOnboarding = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { onboardingCompleted: true } },
        { new: true }
    );
    res.status(200).json({ success: true, user });
};

// ----------------------------------------
// POST /api/auth/me/tour/complete
// Purpose: Mark the feature tour as done
// Idempotent — safe to call if already true
// ----------------------------------------
exports.completeTour = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { tourCompleted: true } },
        { new: true }
    );
    res.status(200).json({ success: true, user });
};

// ----------------------------------------
// PATCH /api/auth/me/tour/reset
// Purpose: Allow the user to replay the feature tour from Profile settings
// Sets tourCompleted: false so the tour re-opens on the next dashboard visit
// ----------------------------------------
exports.resetTour = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { tourCompleted: false } },
        { new: true }
    );
    res.status(200).json({ success: true, user });
};

// ----------------------------------------
// PATCH /api/auth/me/onboarding/checklist
// Purpose: Mark individual checklist items as completed (one-way ratchet)
// Body: { noteCreated?, flashcardsGenerated?, taskAdded?, friendConnected?, dismissed? }
// Only fields with value === true are written — false values are silently ignored
// so a completed item can never be un-checked by a stale request body.
// ----------------------------------------
exports.updateOnboardingChecklist = async (req, res) => {
    const allowed = ['noteCreated', 'flashcardsGenerated', 'taskAdded', 'friendConnected', 'dismissed'];
    const setFields = {};

    for (const field of allowed) {
        if (req.body[field] === true) {
            setFields[`onboardingChecklist.${field}`] = true;
        }
    }

    if (Object.keys(setFields).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid checklist fields provided' });
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: setFields },
        { new: true }
    );
    res.status(200).json({ success: true, user });
};
