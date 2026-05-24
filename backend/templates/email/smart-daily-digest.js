const { baseLayout } = require('./base.layout');

/**
 * smartDailyDigestEmail({ firstName, sections, unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl })
 *
 * sections: array of { type, items }
 *   type: 'friend_request' | 'share_received' | 'task_assigned'
 *   items: array of notification objects with at least a `message` field
 */

const SECTION_CONFIG = {
    friend_request:  { label: 'Friend Requests',   icon: '👥' },
    share_received:  { label: 'Shared with You',    icon: '📤' },
    task_assigned:   { label: 'Tasks Assigned',     icon: '✅' },
};

function renderSection({ type, items }) {
    const config = SECTION_CONFIG[type] || { label: type, icon: '🔔' };
    const rows = items.slice(0, 5).map(n => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;color:#374151;font-size:14px;">
            ${n.message}
          </td>
        </tr>`).join('');
    const more = items.length > 5
        ? `<tr><td style="padding:8px 0;color:#6B7280;font-size:13px;">+ ${items.length - 5} more</td></tr>`
        : '';

    return `
      <div style="margin-bottom:24px;">
        <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 8px;">${config.icon} ${config.label}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rows}${more}
        </table>
      </div>`;
}

function smartDailyDigestEmail({ firstName, sections, unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl }) {
    const preheader = `You have activity waiting for you on Continuum.`;

    const sectionsHtml = sections.map(renderSection).join('');

    const body = `
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">Your daily update</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        Hi ${firstName}, here's what happened on Continuum since yesterday.
      </p>
      ${sectionsHtml}
      <a href="${manageUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Open Continuum</a>
    `;

    return {
        subject: 'Your Continuum daily update',
        ...baseLayout({ preheader, body, type: 'digest', unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl }),
    };
}

module.exports = { smartDailyDigestEmail };
