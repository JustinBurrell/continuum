const { baseLayout } = require('./base.layout');

/**
 * newDeviceLoginEmail({ firstName, deviceDescription, ipLocation, timestamp, securityUrl })
 * Sent only when no active RefreshToken exists for this deviceId before revocation.
 */
function newDeviceLoginEmail({ firstName, deviceDescription, ipLocation, timestamp, securityUrl }) {
    const preheader = `New sign-in to your Continuum account from ${deviceDescription}.`;

    const locationLine = ipLocation ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:14px;">Location</td><td style="padding:6px 0;color:#374151;font-size:14px;font-weight:500;">${ipLocation}</td></tr>` : '';

    const body = `
      <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#92400E;font-size:14px;font-weight:600;margin:0;">New sign-in detected</p>
      </div>
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">New sign-in to your account</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 20px;">
        Hi ${firstName}, we noticed a sign-in to your Continuum account from a device we haven't seen before.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;padding:16px;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#6B7280;font-size:14px;">Device</td><td style="padding:6px 0;color:#374151;font-size:14px;font-weight:500;">${deviceDescription}</td></tr>
        ${locationLine}
        <tr><td style="padding:6px 0;color:#6B7280;font-size:14px;">Time</td><td style="padding:6px 0;color:#374151;font-size:14px;font-weight:500;">${timestamp}</td></tr>
      </table>

      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        If this was you, no action is needed. If you don't recognise this sign-in, secure your account immediately.
      </p>

      <a href="${securityUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Review account security</a>
    `;

    return {
        subject: 'New sign-in to your Continuum account',
        ...baseLayout({ preheader, body, type: 'transactional' }),
    };
}

module.exports = { newDeviceLoginEmail };
