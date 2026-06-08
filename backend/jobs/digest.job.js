const cron   = require('node-cron');
const logger = require('../lib/logger');

const User         = require('../models/User');
const Notification = require('../models/Notification');
const Activity     = require('../models/Activity');
const StudySession = require('../models/StudySession');
const Application  = require('../models/Application');
const emailSvc     = require('../services/email.service');

// ─── Shared suppression filter ───────────────────────────────────────────────
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const baseFilter = () => ({
    'settings.emailNotifications.enabled': true,
    pendingDeletion: { $ne: true },
    deletedAt:       null,
    lastLoginAt:     { $gt: THIRTY_DAYS_AGO() },
    isDemo:          { $ne: true },
    isSeedUser:      { $ne: true },
});

// ─── Worker functions (exported for unit tests) ──────────────────────────────

async function runSmartDaily() {
    const users = await User.find({
        ...baseFilter(),
        'settings.emailNotifications.smartDaily': true,
    }).lean();

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const user of users) {
        const notifications = await Notification.find({
            userId:       user._id,
            type:         { $in: ['friend_request', 'share_received', 'task_assigned'] },
            digestSentAt: null,
            createdAt:    { $gt: yesterday },
        }).lean();

        if (!notifications.length) continue;

        const grouped = {};
        for (const n of notifications) {
            if (!grouped[n.type]) grouped[n.type] = [];
            grouped[n.type].push(n);
        }

        const sections = Object.entries(grouped).map(([type, items]) => ({ type, items }));

        await emailSvc.sendSmartDailyDigest(user, sections);

        await Notification.updateMany(
            { _id: { $in: notifications.map(n => n._id) } },
            { digestSentAt: new Date() }
        );
    }
}

async function runWeeklySummary() {
    const users = await User.find({
        ...baseFilter(),
        'settings.emailNotifications.weeklySummary': true,
    }).lean();

    const sevenDaysAgo    = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    for (const user of users) {
        const commentNotifs = await Notification.find({
            userId:       user._id,
            type:         { $in: ['comment_added', 'comment_reply'] },
            digestSentAt: null,
            createdAt:    { $gt: sevenDaysAgo },
        }).lean();

        const comments = commentNotifs.length
            ? {
                count:    commentNotifs.length,
                previews: commentNotifs
                    .slice(0, 3)
                    .map(n => n.metadata?.commentPreview)
                    .filter(Boolean),
            }
            : null;

        const likeNotifs = await Notification.find({
            userId:       user._id,
            type:         'like_added',
            digestSentAt: null,
            createdAt:    { $gt: sevenDaysAgo },
        }).lean();

        const likes = likeNotifs.length ? { count: likeNotifs.length } : null;

        const activityItems = await Activity.find({
            visibleTo: user._id,
            userId:    { $ne: user._id },
            createdAt: { $gt: sevenDaysAgo },
        }).lean().sort({ createdAt: -1 }).limit(5);

        const friendActivity = activityItems.length
            ? { items: activityItems.map(() => ({ message: 'New activity on your feed' })) }
            : null;

        const sessions = await StudySession.find({
            userId:      user._id,
            completedAt: { $gt: sevenDaysAgo },
        }).lean();

        const studyDays = sessions.length
            ? new Set(sessions.map(s => s.completedAt.toISOString().split('T')[0])).size
            : null;

        const staleApps = await Application.find({
            userId:    user._id,
            status:    { $in: ['applied', 'interview'] },
            updatedAt: { $lt: fourteenDaysAgo },
        }).lean().limit(5);

        const staleApplications = staleApps.length
            ? { items: staleApps.map(a => ({ title: a.position, company: a.company, status: a.status })) }
            : null;

        if (!comments && !likes && !friendActivity && studyDays === null && !staleApplications) continue;

        await emailSvc.sendWeeklySummaryDigest(user, { comments, likes, friendActivity, studyDays, staleApplications });

        const notifIds = [...commentNotifs, ...likeNotifs].map(n => n._id);
        if (notifIds.length) {
            await Notification.updateMany(
                { _id: { $in: notifIds } },
                { digestSentAt: new Date() }
            );
        }
    }
}

async function runDeletionWarn() {
    const crypto     = require('crypto');
    const now        = new Date();
    const fiveDaysOut = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const users = await User.find({
        pendingDeletion:            true,
        scheduledDeletionAt:        { $gt: now, $lt: fiveDaysOut },
        deletionWarningEmailSentAt: null,
    }).lean();

    for (const user of users) {
        const rawToken    = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        await User.findByIdAndUpdate(user._id, {
            restorationToken:           hashedToken,
            restorationTokenExpires:    user.scheduledDeletionAt,
            deletionWarningEmailSentAt: new Date(),
        });

        const restoreUrl = emailSvc.deepLink(`/api/auth/me/restore?token=${rawToken}`);
        await emailSvc.sendAccountDeletionEmail(
            { ...user, scheduledDeletionAt: user.scheduledDeletionAt },
            'warning',
            restoreUrl
        );
    }
}

// ─── Init: register cron schedules (skipped in test env) ────────────────────
function scheduleJob(pattern, name, fn) {
    cron.schedule(pattern, async () => {
        try {
            await fn();
        } catch (err) {
            logger.error({ err }, `Digest job "${name}" failed`);
        }
    }, { timezone: 'UTC' });
}

function initDigestJobs() {
    if (process.env.NODE_ENV === 'test') return;

    scheduleJob('0 8 * * *', 'smart-daily', runSmartDaily);
    scheduleJob('0 18 * * 0', 'weekly-summary', runWeeklySummary);
    scheduleJob('0 9 * * *', 'deletion-warn', runDeletionWarn);

    logger.info('Digest jobs scheduled (smart-daily 08:00, weekly-summary Sun 18:00, deletion-warn 09:00 — all UTC)');
}

module.exports = { initDigestJobs, runSmartDaily, runWeeklySummary, runDeletionWarn };
