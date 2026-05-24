/**
 * base.layout.js
 *
 * Two variants:
 *   type === 'transactional'  — identical output to the legacy emailTemplate() helper in auth.controller.js
 *   type === 'digest'         — adds a preheader span and unsubscribe footer before the logo
 *
 * Usage:
 *   const { html, text } = baseLayout({ preheader, body, type, digestType, unsubscribeUrl, manageUrl })
 *   - preheader:     shown as preview text in the inbox (hidden in rendered email)
 *   - body:          inner HTML string (the card content, excluding the footer)
 *   - type:          'transactional' | 'digest'
 *   - digestType:    'smartDaily' | 'weeklySummary' — used to build the targeted unsubscribe link
 *   - unsubscribeUrl: pre-signed URL for unsubscribing from this specific digest type
 *   - allDigestsUnsubscribeUrl: pre-signed URL for unsubscribing from all digests
 *   - manageUrl:     full URL to notification settings page (e.g. APP_BASE_URL + /settings/notifications)
 */

function baseLayout({ preheader = '', body, type = 'transactional', unsubscribeUrl, allDigestsUnsubscribeUrl, manageUrl }) {
    const preheaderHtml = preheader
        ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>`
        : '';

    const digestFooter = type === 'digest' ? `
          <p style="color:#6B7280;font-size:12px;margin:16px 0 4px;line-height:1.6;">
            <a href="${unsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">Unsubscribe from this digest</a>
            &nbsp;&bull;&nbsp;
            <a href="${allDigestsUnsubscribeUrl}" style="color:#6B7280;text-decoration:underline;">Unsubscribe from all digests</a>
            &nbsp;&bull;&nbsp;
            <a href="${manageUrl}" style="color:#6B7280;text-decoration:underline;">Manage preferences</a>
          </p>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif;">
  ${preheaderHtml}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #E5E7EB;padding:40px;max-width:560px;">
        <tr><td>
          ${body}
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0;" />
          ${digestFooter}
          <p style="color:#6B7280;font-size:13px;margin:0 0 16px;">Team Continuum</p>
          <img src="https://usecontinuum.dev/logo-lockup.svg" alt="Continuum" height="32" style="display:block;" />
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    return { html, text: htmlToText(body, preheader) };
}

function htmlToText(html, preheader = '') {
    const stripped = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&bull;/gi, '•')
        .replace(/&zwnj;/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return preheader ? `${preheader}\n\n${stripped}` : stripped;
}

module.exports = { baseLayout };
