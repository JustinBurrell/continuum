const { baseLayout } = require('./base.layout');

/**
 * weeklySummaryDigestEmail({ firstName, data, unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl, dashboardUrl })
 *
 * data: {
 *   comments:          { count, previews: string[] } | null
 *   likes:             { count } | null
 *   friendActivity:    { items: { message }[] } | null   — up to 5
 *   studyDays:         number | null                      — distinct calendar days with sessions
 *   staleApplications: { items: { title, company, status }[] } | null
 * }
 */

function renderComments({ count, previews = [] }) {
    const previewRows = previews.slice(0, 3).map(p => `
        <tr><td style="padding:6px 0;color:#6B7280;font-size:13px;font-style:italic;">"${p}"</td></tr>`).join('');
    return `
      <div style="margin-bottom:24px;">
        <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 8px;">💬 Comments (${count})</p>
        <table width="100%" cellpadding="0" cellspacing="0">${previewRows}</table>
      </div>`;
}

function renderLikes({ count }) {
    return `
      <div style="margin-bottom:24px;">
        <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 4px;">❤️ Likes received</p>
        <p style="color:#374151;font-size:14px;margin:0;">Your content received <strong>${count}</strong> like${count !== 1 ? 's' : ''} this week.</p>
      </div>`;
}

function renderFriendActivity({ items }) {
    const rows = items.slice(0, 5).map(item => `
        <tr><td style="padding:6px 0;color:#374151;font-size:14px;border-bottom:1px solid #F3F4F6;">${item.message}</td></tr>`).join('');
    return `
      <div style="margin-bottom:24px;">
        <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 8px;">👥 Friend activity</p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>`;
}

function renderStudyStreak(studyDays) {
    if (!studyDays) return '';
    const label = studyDays === 7
        ? '🔥 Perfect week — 7 days of studying!'
        : `📚 You studied ${studyDays} day${studyDays !== 1 ? 's' : ''} this week.`;
    return `
      <div style="margin-bottom:24px;background:#F5F3FF;border-radius:8px;padding:16px;">
        <p style="color:#6B21A8;font-size:15px;font-weight:600;margin:0;">${label}</p>
      </div>`;
}

function renderStaleApplications({ items }) {
    const rows = items.map(app => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;">
            <span style="color:#374151;font-size:14px;font-weight:500;">${app.title}</span>
            ${app.company ? `<span style="color:#6B7280;font-size:13px;"> — ${app.company}</span>` : ''}
            <span style="display:inline-block;background:#FEF3C7;color:#92400E;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:600;margin-left:6px;">${app.status}</span>
          </td>
        </tr>`).join('');
    return `
      <div style="margin-bottom:24px;">
        <p style="color:#111827;font-size:15px;font-weight:600;margin:0 0 4px;">📋 Applications to follow up</p>
        <p style="color:#6B7280;font-size:13px;margin:0 0 8px;">These haven't been updated in a while.</p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </div>`;
}

function weeklySummaryDigestEmail({ firstName, data, unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl, dashboardUrl }) {
    const preheader = `Your Continuum week in review.`;

    const { comments, likes, friendActivity, studyDays, staleApplications } = data;

    const sectionsHtml = [
        studyDays != null ? renderStudyStreak(studyDays) : '',
        comments ? renderComments(comments) : '',
        likes ? renderLikes(likes) : '',
        friendActivity ? renderFriendActivity(friendActivity) : '',
        staleApplications ? renderStaleApplications(staleApplications) : '',
    ].join('');

    const body = `
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 8px;">Your week on Continuum</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        Hi ${firstName}, here's a look back at your week.
      </p>
      ${sectionsHtml}
      <a href="${dashboardUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Open Continuum</a>
    `;

    return {
        subject: 'Your Continuum week in review',
        ...baseLayout({ preheader, body, type: 'digest', unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl }),
    };
}

module.exports = { weeklySummaryDigestEmail };
