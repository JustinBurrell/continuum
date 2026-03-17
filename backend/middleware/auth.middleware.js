const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // Confirm the user still exists in the database
    let user;
    try {
        user = await User.findById(decoded.userId);
    } catch (err) {
        return next(err);
    }

    if (!user) {
        return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    // Attach user to request so controllers can access req.user
    req.user = user;
    next();
};

module.exports = authMiddleware;
