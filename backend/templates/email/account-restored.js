const { baseLayout } = require('./base.layout');

/**
 * accountRestoredEmail({ firstName, loginUrl })
 * Brief confirmation sent after successful account restoration.
 */
function accountRestoredEmail({ firstName, loginUrl }) {
    const preheader = `Your Continuum account has been restored successfully.`;

    const body = `
      <div style="background:#DCFCE7;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#166534;font-size:14px;font-weight:600;margin:0;">Account restored</p>
      </div>
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 16px;">Your account is back</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">
        Hi ${firstName}, your Continuum account has been successfully restored. The scheduled deletion has been cancelled and everything is exactly as you left it.
      </p>
      <a href="${loginUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Sign in to Continuum</a>
    `;

    return {
        subject: 'Your Continuum account has been restored',
        ...baseLayout({ preheader, body, type: 'transactional' }),
    };
}

module.exports = { accountRestoredEmail };
