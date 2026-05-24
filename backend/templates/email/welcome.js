const { baseLayout } = require('./base.layout');

/**
 * welcomeEmail({ firstName, dashboardUrl, notesUrl, friendsUrl, settingsUrl })
 * Sent on register and Google OAuth new user.
 */
function welcomeEmail({ firstName, dashboardUrl, notesUrl, friendsUrl, settingsUrl }) {
    const preheader = `Welcome to Continuum, ${firstName}! Here's everything you can do.`;

    const body = `
      <h1 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to Continuum, ${firstName}! 🎉</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        We're glad you're here. Continuum is your all-in-one space for notes, tasks, flashcards, and staying connected with friends. Here's what you can do right now:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
            <a href="${notesUrl}" style="text-decoration:none;">
              <span style="color:#111827;font-size:15px;font-weight:600;">📝 Take your first note</span>
              <p style="color:#6B7280;font-size:14px;margin:4px 0 0;">Create rich, organised notes with AI-powered summaries.</p>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
            <a href="${dashboardUrl}" style="text-decoration:none;">
              <span style="color:#111827;font-size:15px;font-weight:600;">✅ Set up your dashboard</span>
              <p style="color:#6B7280;font-size:14px;margin:4px 0 0;">Track tasks, study sessions, and your goals in one place.</p>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;">
            <a href="${friendsUrl}" style="text-decoration:none;">
              <span style="color:#111827;font-size:15px;font-weight:600;">👥 Connect with friends</span>
              <p style="color:#6B7280;font-size:14px;margin:4px 0 0;">Share notes and collaborate with classmates and colleagues.</p>
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <a href="${settingsUrl}" style="text-decoration:none;">
              <span style="color:#111827;font-size:15px;font-weight:600;">⚙️ Customise your experience</span>
              <p style="color:#6B7280;font-size:14px;margin:4px 0 0;">Set notification preferences, connect integrations, and more.</p>
            </a>
          </td>
        </tr>
      </table>

      <div style="margin:32px 0 0;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Go to my dashboard</a>
      </div>
    `;

    return {
        subject: 'Welcome to Continuum',
        ...baseLayout({ preheader, body, type: 'transactional' }),
    };
}

module.exports = { welcomeEmail };
