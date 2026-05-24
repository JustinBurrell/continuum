const { baseLayout } = require('./base.layout');

/**
 * integrationUpdateEmail({ firstName, action, serviceName, capabilities, whatHappensNext, manageUrl })
 * action: 'connected' | 'disconnected'
 */
function integrationUpdateEmail({ firstName, action, serviceName, capabilities = [], whatHappensNext = [], manageUrl }) {
    const isConnected = action === 'connected';
    const verb = isConnected ? 'connected' : 'disconnected';
    const preheader = `${serviceName} has been ${verb} to your Continuum account.`;

    const capabilitiesHtml = isConnected && capabilities.length
        ? `
      <p style="color:#374151;font-size:15px;margin:16px 0 8px;font-weight:600;">What you can do now:</p>
      <ul style="color:#374151;font-size:15px;margin:0 0 16px;padding-left:20px;">
        ${capabilities.map(c => `<li style="margin-bottom:6px;">${c}</li>`).join('')}
      </ul>`
        : '';

    const whatNextHtml = whatHappensNext.length
        ? `
      <p style="color:#374151;font-size:15px;margin:16px 0 8px;font-weight:600;">What happens next:</p>
      <ul style="color:#374151;font-size:15px;margin:0 0 16px;padding-left:20px;">
        ${whatHappensNext.map(w => `<li style="margin-bottom:6px;">${w}</li>`).join('')}
      </ul>`
        : '';

    const accentColor = isConnected ? '#16A34A' : '#6B7280';
    const accentLabel = isConnected ? 'Connected' : 'Disconnected';

    const body = `
      <div style="display:inline-block;background:${accentColor};color:#ffffff;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;letter-spacing:0.5px;margin-bottom:16px;">${accentLabel}</div>
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">${serviceName} ${verb}</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">
        Hi ${firstName}, your ${serviceName} account has been ${verb} ${isConnected ? 'to' : 'from'} Continuum.
      </p>
      ${capabilitiesHtml}
      ${whatNextHtml}
      <div style="margin:24px 0 0;">
        <a href="${manageUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Manage integrations</a>
      </div>
    `;

    return {
        subject: `${serviceName} ${verb} to Continuum`,
        ...baseLayout({ preheader, body, type: 'transactional' }),
    };
}

module.exports = { integrationUpdateEmail };
