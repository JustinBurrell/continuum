const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const logger = require('../lib/logger');

const { welcomeEmail } = require('../templates/email/welcome');
const { integrationUpdateEmail } = require('../templates/email/integration-update');
const { newDeviceLoginEmail } = require('../templates/email/new-device-login');
const { accountDeletionEmail } = require('../templates/email/account-deletion');
const { accountRestoredEmail } = require('../templates/email/account-restored');
const { smartDailyDigestEmail } = require('../templates/email/smart-daily-digest');
const { weeklySummaryDigestEmail } = require('../templates/email/weekly-summary-digest');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_TRANSACTIONAL = process.env.EMAIL_FROM_TRANSACTIONAL || 'Continuum <noreply@usecontinuum.dev>';
const FROM_DIGEST        = process.env.EMAIL_FROM_DIGEST        || 'Continuum <hello@usecontinuum.dev>';

// ─── Helpers ────────────────────────────────────────────────────────────────

const BASE_URL     = () => process.env.APP_BASE_URL || process.env.FRONTEND_URL || '';
const deepLink     = (path) => `${BASE_URL()}${path}`;
const authDeepLink = (path) => `${BASE_URL()}/login?next=${encodeURIComponent(path)}`;

function signUnsubscribeToken(userId, type) {
    return jwt.sign({ userId: String(userId), type }, process.env.EMAIL_UNSUBSCRIBE_SECRET, { expiresIn: '30d' });
}

function buildUnsubscribeUrl(userId, type) {
    const token = signUnsubscribeToken(userId, type);
    return `${process.env.APP_BASE_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function send({ to, from, subject, html, text }) {
    if (process.env.NODE_ENV !== 'production') {
        logger.debug(`[EMAIL SKIPPED] NODE_ENV=${process.env.NODE_ENV} — only sends in production`);
        return;
    }
    await resend.emails.send({ from, to, subject, html, text });
}

// ─── Transactional ──────────────────────────────────────────────────────────

async function sendVerificationEmail(user, rawToken) {
    try {
        const verifyUrl = deepLink(`/auth/verify-email?token=${rawToken}`);
        // Re-use the existing template shape already in auth.controller.js
        // (plain inline HTML, not a named template file — kept here for migration path)
        const html = require('../templates/email/base.layout').baseLayout({
            body: `
              <h1 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Verify your email</h1>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                Thanks for signing up, ${user.firstName}! Please verify your email address to activate your Continuum account.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Verify email address</a>
              <p style="color:#6B7280;font-size:13px;margin:24px 0 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
            `,
            type: 'transactional',
        }).html;
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject: 'Verify your Continuum email address', html });
    } catch (err) {
        logger.error({ err }, 'sendVerificationEmail failed');
    }
}

async function sendPasswordResetEmail(user, resetToken) {
    try {
        const resetUrl = deepLink(`/reset-password?token=${resetToken}`);
        const html = require('../templates/email/base.layout').baseLayout({
            body: `
              <h1 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Reset your password</h1>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                We received a request to reset the password for your Continuum account. Click the button below to choose a new password.
              </p>
              <a href="${resetUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Reset password</a>
              <p style="color:#6B7280;font-size:13px;margin:24px 0 0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
            `,
            type: 'transactional',
        }).html;
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject: 'Reset your Continuum password', html });
    } catch (err) {
        logger.error({ err }, 'sendPasswordResetEmail failed');
    }
}

async function sendWelcomeEmail(user) {
    try {
        const { subject, html, text } = welcomeEmail({
            firstName:    user.firstName,
            dashboardUrl: deepLink('/dashboard'),
            notesUrl:     deepLink('/notes'),
            friendsUrl:   deepLink('/friends'),
            settingsUrl:  deepLink('/settings'),
        });
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendWelcomeEmail failed');
    }
}

async function sendIntegrationEmail(user, { action, serviceName, capabilities, whatHappensNext, manageUrl }) {
    try {
        const { subject, html, text } = integrationUpdateEmail({
            firstName: user.firstName,
            action,
            serviceName,
            capabilities,
            whatHappensNext,
            manageUrl: deepLink(manageUrl),
        });
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendIntegrationEmail failed');
    }
}

async function sendNewDeviceLoginEmail(user, { deviceDescription, ipLocation, timestamp, securityUrl }) {
    try {
        const { subject, html, text } = newDeviceLoginEmail({
            firstName:         user.firstName,
            deviceDescription,
            ipLocation,
            timestamp:         timestamp || new Date().toUTCString(),
            securityUrl:       securityUrl || authDeepLink('/settings/security'),
        });
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendNewDeviceLoginEmail failed');
    }
}

async function sendAccountDeletionEmail(user, variant, restoreUrl) {
    try {
        const { subject, html, text } = accountDeletionEmail({
            firstName:          user.firstName,
            variant,
            scheduledDeletionAt: user.scheduledDeletionAt,
            restoreUrl:         restoreUrl || deepLink('/login'),
            supportUrl:         null,
        });
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendAccountDeletionEmail failed');
    }
}

async function sendAccountRestoredEmail(user) {
    try {
        const { subject, html, text } = accountRestoredEmail({
            firstName: user.firstName,
            loginUrl:  deepLink('/login'),
        });
        await send({ to: user.email, from: FROM_TRANSACTIONAL, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendAccountRestoredEmail failed');
    }
}

// ─── Digest ─────────────────────────────────────────────────────────────────

async function sendSmartDailyDigest(user, sections) {
    try {
        const unsubscribeUrl          = buildUnsubscribeUrl(user._id, 'smartDaily');
        const allDigestsUnsubscribeUrl = buildUnsubscribeUrl(user._id, 'allDigests');
        const manageUrl               = deepLink('/settings/notifications');
        const { subject, html, text } = smartDailyDigestEmail({
            firstName: user.firstName,
            sections,
            unsubscribeUrl,
            allDigestsUnsubscribeUrl,
            manageUrl,
        });
        await send({ to: user.email, from: FROM_DIGEST, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendSmartDailyDigest failed');
    }
}

async function sendWeeklySummaryDigest(user, data) {
    try {
        const unsubscribeUrl          = buildUnsubscribeUrl(user._id, 'weeklySummary');
        const allDigestsUnsubscribeUrl = buildUnsubscribeUrl(user._id, 'allDigests');
        const manageUrl               = deepLink('/settings/notifications');
        const dashboardUrl            = deepLink('/dashboard');
        const { subject, html, text } = weeklySummaryDigestEmail({
            firstName: user.firstName,
            data,
            unsubscribeUrl,
            allDigestsUnsubscribeUrl,
            manageUrl,
            dashboardUrl,
        });
        await send({ to: user.email, from: FROM_DIGEST, subject, html, text });
    } catch (err) {
        logger.error({ err }, 'sendWeeklySummaryDigest failed');
    }
}

module.exports = {
    // Transactional
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendIntegrationEmail,
    sendNewDeviceLoginEmail,
    sendAccountDeletionEmail,
    sendAccountRestoredEmail,
    // Digest
    sendSmartDailyDigest,
    sendWeeklySummaryDigest,
    // Helpers (exported for tests)
    signUnsubscribeToken,
    deepLink,
    authDeepLink,
};
