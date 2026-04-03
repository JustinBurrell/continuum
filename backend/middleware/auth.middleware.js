const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getOrSet, invalidate } = require('../lib/cache');
const { hardDeleteUser } = require('../services/account.service');

// ============================================================
// AUTH MIDDLEWARE
// Purpose: Verify JWT on protected routes and attach the user to req.user
// Used by: any route that requires authentication
// Flow: extract token from Authorization header → verify → find user → attach to req
// ============================================================

const authMiddleware = async (req, res, next) => {
    // Expect: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify signature and expiry throws if invalid or expired
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Confirm the user still exists in the database (cached 5 min)
    let user;
    try {
        user = await getOrSet(`user:${decoded.userId}`, 300, () => User.findById(decoded.userId));
    } catch (err) {
        return next(err);
    }

    if (!user) {
        return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    // Reject stale tokens invalidated by logoutAll — tokenVersion in JWT must match DB
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ success: false, error: 'Session invalidated.' });
    }

    // Handle pending deletion grace period
    if (user.pendingDeletion) {
        // Grace period expired — hard delete lazily and treat as non-existent
        if (user.scheduledDeletionAt && user.scheduledDeletionAt <= new Date()) {
            await hardDeleteUser(user._id).catch(() => {});
            await invalidate(`user:${decoded.userId}`).catch(() => {});
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        // Within grace period — only allow restore/me/logout paths
        const allowed = ['/me/restore', '/me', '/logout', '/logout-all'];
        const isAllowed = allowed.some(p => req.path === p || req.path.endsWith(p));
        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                error: 'Account is scheduled for deletion. Log in to restore it.',
                pendingDeletion: true,
                scheduledDeletionAt: user.scheduledDeletionAt,
            });
        }
    }

    // Attach user to request so controllers can access req.user
    req.user = user;

    // Block all write operations for the demo account — it is read-only.
    // Logout paths are exempt so the user can always sign out.
    if (user.isDemo && !['GET', 'HEAD'].includes(req.method)) {
        const logoutPaths = ['/logout', '/logout-all'];
        const isLogout = logoutPaths.some(p => req.path === p || req.path.endsWith(p));
        if (!isLogout) {
            return res.status(403).json({ success: false, error: 'Demo account is read-only.' });
        }
    }

    next();
};

module.exports = authMiddleware;
