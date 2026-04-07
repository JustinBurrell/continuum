const WaitlistEntry = require('../models/WaitlistEntry');

// ============================================================
// WAITLIST CONTROLLER
// Purpose: Handle business logic for mobile gate waitlist signups
// Used by: routes/waitlist.routes.js
// Endpoints: subscribe
// ============================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ----------------------------------------
// POST /api/waitlist
// Purpose: Subscribe an email to the mobile waitlist
// Body: { email (required), source? }
// Auth: None — public endpoint
// Returns 200 for duplicate emails (idempotent — avoids leaking "already registered")
// Returns 201 on first successful signup
// ----------------------------------------
exports.subscribe = async (req, res) => {
    const { email, source = 'mobile_gate' } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    try {
        await WaitlistEntry.create({ email: email.trim(), source });
    } catch (err) {
        // E11000 = MongoDB duplicate key — email already on the list
        // Return success anyway so users don't know whether an email was already registered
        if (err.code === 11000) {
            return res.status(200).json({ success: true, message: "You're on the list!" });
        }
        throw err; // Let app.js global error handler deal with anything else
    }

    return res.status(201).json({ success: true, message: "You're on the list!" });
};
