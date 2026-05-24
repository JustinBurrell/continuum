const { baseLayout } = require('./base.layout');

/**
 * accountDeletionEmail({ firstName, variant, scheduledDeletionAt, restoreUrl, supportUrl })
 * variant: 'immediate' | 'warning'
 *
 * 'immediate' — sent when the user requests deletion. Includes one-click restore link.
 * 'warning'   — sent 5 days before scheduled deletion. Includes one-click restore link.
 */
function accountDeletionEmail({ firstName, variant, scheduledDeletionAt, restoreUrl, supportUrl }) {
    const isImmediate = variant === 'immediate';

    const formattedDate = scheduledDeletionAt
        ? new Date(scheduledDeletionAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const preheader = isImmediate
        ? `Your Continuum account is scheduled for deletion on ${formattedDate}.`
        : `Reminder: your Continuum account will be deleted on ${formattedDate}.`;

    const heading = isImmediate
        ? 'Account deletion requested'
        : 'Your account will be deleted soon';

    const intro = isImmediate
        ? `Hi ${firstName}, we've received your request to delete your Continuum account. Your account and all associated data will be permanently deleted on <strong>${formattedDate}</strong>.`
        : `Hi ${firstName}, this is a reminder that your Continuum account is scheduled for permanent deletion on <strong>${formattedDate}</strong>. After this date, your notes, tasks, and data cannot be recovered.`;

    const body = `
      <div style="background:#FEE2E2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#991B1B;font-size:14px;font-weight:600;margin:0;">${isImmediate ? 'Deletion scheduled' : 'Deletion in 5 days'}</p>
      </div>
      <h1 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 16px;">${heading}</h1>
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">${intro}</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">
        Changed your mind? You can restore your account with one click — no password required.
      </p>
      <a href="${restoreUrl}" style="display:inline-block;background:#6B21A8;color:#ffffff;border-radius:8px;padding:12px 24px;font-size:15px;font-weight:600;text-decoration:none;">Restore my account</a>
      ${supportUrl ? `<p style="color:#6B7280;font-size:13px;margin:24px 0 0;">Questions? <a href="${supportUrl}" style="color:#6B21A8;text-decoration:none;">Contact support</a></p>` : ''}
    `;

    return {
        subject: isImmediate
            ? 'Your Continuum account has been scheduled for deletion'
            : 'Your Continuum account will be deleted in 5 days',
        ...baseLayout({ preheader, body, type: 'transactional' }),
    };
}

module.exports = { accountDeletionEmail };
