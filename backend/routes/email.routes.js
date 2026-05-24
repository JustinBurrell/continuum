const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ----------------------------------------
// GET /api/email/unsubscribe?token=
// Public — no auth required.
// Verifies a JWT signed with EMAIL_UNSUBSCRIBE_SECRET.
// Updates the relevant emailNotifications flag then returns self-contained HTML.
// Idempotent: already-unsubscribed users get a 200 confirmation page.
// ----------------------------------------
router.get('/unsubscribe', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send(unsubscribeHtml('invalid'));
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.EMAIL_UNSUBSCRIBE_SECRET);
    } catch {
        return res.status(400).send(unsubscribeHtml('invalid'));
    }

    const { userId, type } = payload;
    if (!userId || !type) {
        return res.status(400).send(unsubscribeHtml('invalid'));
    }

    const update = {};
    if (type === 'smartDaily')    update['settings.emailNotifications.smartDaily']    = false;
    else if (type === 'weeklySummary') update['settings.emailNotifications.weeklySummary'] = false;
    else if (type === 'allDigests')    update['settings.emailNotifications.enabled']        = false;
    else return res.status(400).send(unsubscribeHtml('invalid'));

    await User.findByIdAndUpdate(userId, { $set: update });

    const manageUrl = `${process.env.APP_BASE_URL || process.env.FRONTEND_URL || ''}/settings/notifications`;
    res.status(200).send(unsubscribeHtml('success', type, manageUrl));
});

function unsubscribeHtml(status, type, manageUrl) {
    const typeLabel = {
        smartDaily:    'smart daily digest',
        weeklySummary: 'weekly summary digest',
        allDigests:    'all digest emails',
    }[type] || 'digest emails';

    const messages = {
        success: {
            heading: 'Unsubscribed',
            body:    `You've been unsubscribed from <strong>${typeLabel}</strong>. You'll no longer receive these emails.`,
        },
        invalid: {
            heading: 'Link expired or invalid',
            body:    'This unsubscribe link is invalid or has expired. Please use the link from a recent email.',
        },
    };
    const { heading, body } = messages[status] || messages.invalid;
    const manageLink = manageUrl
        ? `<p style="margin:20px 0 0;font-size:14px;color:#6B7280;"><a href="${manageUrl}" style="color:#6B21A8;text-decoration:none;">Manage all email preferences</a></p>`
        : '';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Continuum</title></head><body style="margin:0;padding:40px 0;background:#F8F9FA;font-family:'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif;"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:40px;"><h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">${heading}</h1><p style="color:#374151;font-size:15px;margin:0;">${body}</p>${manageLink}<hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;"/><img src="https://usecontinuum.dev/logo-lockup.svg" alt="Continuum" height="32"/></div></body></html>`;
}

module.exports = router;
