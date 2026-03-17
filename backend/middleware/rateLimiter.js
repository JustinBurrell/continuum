const rateLimit = require('express-rate-limit');

// ============================================================
// RATE LIMITER MIDDLEWARE
// Purpose: Prevent brute-force attacks on auth endpoints and
//          general API abuse across all routes
// ============================================================

// Strict limiter for sensitive auth endpoints (login, forgot-password, reset, refresh)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General limiter applied globally to all API routes
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { success: false, error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
