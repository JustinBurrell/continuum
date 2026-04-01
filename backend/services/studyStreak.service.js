const StudySession = require('../models/StudySession');
const { getOrSet, invalidate } = require('../lib/cache');

// ============================================================
// STUDY STREAK SERVICE
// Purpose: Compute and cache the study streak for a user.
//          Extracted into its own service so both studySessions.controller
//          and users.controller can import it without circular deps.
// ============================================================

const STREAK_TTL = 1800; // 30 minutes
const cacheKey = (userId) => `study-streak:${userId}`;

/**
 * computeStreak
 * Purpose: Walk the user's completed sessions (newest first) and count
 *          consecutive calendar days (UTC) ending today or yesterday.
 *          A streak is still "alive" if the user hasn't studied today yet
 *          but did study yesterday — it only breaks when a full calendar
 *          day is skipped.
 * @param {string|ObjectId} userId
 * @returns {Promise<number>} current streak length
 */
async function computeStreak(userId) {
    const sessions = await StudySession.find({ userId })
        .select('completedAt')
        .sort({ completedAt: -1 })
        .lean();

    if (!sessions.length) return 0;

    // Deduplicate into sorted-descending array of UTC date strings (YYYY-MM-DD)
    const dateSet = new Set(
        sessions.map((s) => s.completedAt.toISOString().split('T')[0])
    );
    const dates = [...dateSet]; // Set preserves insertion order — sessions are already sorted desc

    const today = new Date().toISOString().split('T')[0];

    // Streak is alive if the user studied today OR yesterday
    if (!dates.includes(today)) {
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (!dates.includes(yesterdayStr)) return 0;
    }

    // Walk backwards from today counting consecutive calendar days
    let streak = 0;
    let expected = today;

    for (const d of dates) {
        if (d === expected) {
            streak++;
            const prev = new Date(expected);
            prev.setUTCDate(prev.getUTCDate() - 1);
            expected = prev.toISOString().split('T')[0];
        } else if (d < expected) {
            break; // gap found
        }
        // d > expected shouldn't happen (sorted desc) — skip
    }

    return streak;
}

/**
 * getCachedStreak
 * Purpose: Return the streak from Redis cache if warm; otherwise compute and cache.
 * @param {string|ObjectId} userId
 * @returns {Promise<number>}
 */
async function getCachedStreak(userId) {
    return getOrSet(cacheKey(userId), STREAK_TTL, () => computeStreak(userId));
}

/**
 * invalidateStreakCache
 * Purpose: Bust the streak cache after a new session is written.
 * @param {string|ObjectId} userId
 */
function invalidateStreakCache(userId) {
    invalidate(cacheKey(userId)).catch(() => {});
}

module.exports = { computeStreak, getCachedStreak, invalidateStreakCache };
