/**
 * setup.js — runs before any test file.
 *
 * Sets required env vars so modules that read process.env at load time
 * (Passport Google strategy, JWT helpers, etc.) don't crash in the test env.
 * Values are fake — no real Google or email service is called during tests.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-not-real';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Google OAuth — required by config/passport.js at module load time
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Resend email — auth controller sends verification emails on register;
// in tests we don't want real emails sent.
process.env.RESEND_API_KEY = 'test-resend-key';

// Groq AI — notes controller loads groq.service at module load time
process.env.GROQ_API_KEY = 'test-groq-key';

// Cloudinary — used by upload routes
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET = 'test-cloudinary-secret';

