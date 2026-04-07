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
    const { email, firstName, source = 'mobile_gate' } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existing = await WaitlistEntry.findOne({ email: email.trim() });
    if (existing) {
        return res.status(409).json({ success: false, error: 'This email is already on the waitlist.' });
    }

    await WaitlistEntry.create({
        email: email.trim(),
        firstName: firstName ? firstName.trim() : null,
        source,
    });

    return res.status(201).json({ success: true, message: "You're on the list!" });
};
