const { Resend } = require('resend');
const WaitlistEntry = require('../models/WaitlistEntry');

// ============================================================
// WAITLIST CONTROLLER
// Purpose: Handle business logic for mobile gate waitlist signups
// Used by: routes/waitlist.routes.js
// Endpoints: subscribe
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);
if (process.env.RESEND_DISABLED === 'true') {
    resend.emails.send = async () => ({ data: { id: 'e2e-noop' }, error: null });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function platformLine(platformInterest) {
    if (platformInterest === 'ios')     return `<p style="color:#374151;font-size:15px;margin:0 0 20px;">We saw you're most excited about iOS. We're putting the finishing touches on it now.</p>`;
    if (platformInterest === 'android') return `<p style="color:#374151;font-size:15px;margin:0 0 20px;">We saw you're most excited about Android. That one is nearly complete.</p>`;
    if (platformInterest === 'both')    return `<p style="color:#374151;font-size:15px;margin:0 0 20px;">We saw you're excited about both platforms. We're building them in parallel and they're both on the way.</p>`;
    return '';
}

function waitlistEmail({ firstName, platformInterest }) {
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
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
          <p style="color:#111827;font-size:16px;margin:0 0 12px;">${greeting}</p>
          <p style="color:#374151;font-size:15px;margin:0 0 20px;">You're on the Continuum waitlist. Glad to have you here.</p>
          <p style="color:#374151;font-size:15px;margin:0 0 20px;">Continuum is a student workspace that brings everything into one place: AI-powered notes with instant summaries, smart flashcards generated from your notes, task tracking so you never miss a deadline, a career pipeline to keep your job search organized, and a social layer to collaborate with classmates. Instead of juggling a different app for each part of your academic life, you have one.</p>
          ${platformLine(platformInterest)}
          <p style="color:#374151;font-size:15px;margin:0 0 20px;">Both Android and iOS are in active development. You'll be among the first to know when we're ready for you.</p>
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;" />
          <p style="color:#6B7280;font-size:13px;margin:0 0 16px;">Team Continuum</p>
          <img src="https://usecontinuum.dev/logo-lockup.svg" alt="Continuum" height="32" style="display:block;" />
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ----------------------------------------
// POST /api/waitlist
// Purpose: Subscribe an email to the mobile waitlist
// Body: { email (required), firstName?, source?, platformInterest? }
// Auth: None — public endpoint
// Returns 201 on first successful signup
// Returns 409 for duplicate email
// ----------------------------------------
exports.subscribe = async (req, res) => {
    const { email, firstName, source = 'mobile_gate', platformInterest } = req.body;

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
        platformInterest: platformInterest || null,
    });

    res.status(201).json({ success: true, message: "You're on the list!" });

    // Non-blocking welcome email — don't fail the 201 if Resend errors
    try {
        await resend.emails.send({
            from: 'Continuum <noreply@usecontinuum.dev>',
            to: email.trim(),
            subject: "You're on the Continuum waitlist",
            html: waitlistEmail({ firstName: firstName ? firstName.trim() : null, platformInterest }),
        });
    } catch (_) { /* non-blocking */ }
};
