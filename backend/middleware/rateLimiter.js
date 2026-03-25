const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Skip entirely in test; in development apply 20x multiplier so limits are exercised
// but never hit during normal browsing. Production uses the exact values below.
const skip = () => process.env.NODE_ENV === 'test';
const devMult = process.env.NODE_ENV === 'development' ? 20 : 1;

// ============================================================
// RATE LIMITER MIDDLEWARE
// Purpose: Prevent brute-force attacks on auth endpoints and
//          general API abuse across all routes
// ============================================================

// Strict limiter for sensitive auth endpoints (login, register, forgot-password, reset, refresh)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 * devMult,         // prod: 10 — strict brute-force protection
    skip,
    message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General limiter applied globally to all API routes
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300 * devMult,        // prod: 300 — ~20 req/min avg; power user browsing hits ~100-150
    skip,
    message: { success: false, error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Per-user limiter for high-frequency write endpoints (messages, comments, share, participants)
// Keyed by user ID so one heavy user cannot exhaust the shared IP window
exports.perUserWriteLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30 * devMult,   // prod: 30/min — active chat could approach this; raise if users report it
    skip,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: { success: false, error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Per-user limiter for AI generation endpoints — burst protection on top of the daily Redis cap
exports.aiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5 * devMult,    // prod: 5/min — intentionally tight; AI calls are expensive
    skip,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: { success: false, error: 'Too many AI requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});
