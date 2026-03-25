const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Bypass all rate limiting in test environment
const skip = () => process.env.NODE_ENV === 'test';

// ============================================================
// RATE LIMITER MIDDLEWARE
// Purpose: Prevent brute-force attacks on auth endpoints and
//          general API abuse across all routes
// ============================================================

// Strict limiter for sensitive auth endpoints (login, register, forgot-password, reset, refresh)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    skip,
    message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General limiter applied globally to all API routes
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    skip,
    message: { success: false, error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Per-user limiter for high-frequency write endpoints (messages, comments, share, participants)
// Keyed by user ID so one heavy user cannot exhaust the shared IP window
exports.perUserWriteLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    skip,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: { success: false, error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Per-user limiter for AI generation endpoints — burst protection on top of the daily Redis cap
exports.aiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    skip,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: { success: false, error: 'Too many AI requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});
