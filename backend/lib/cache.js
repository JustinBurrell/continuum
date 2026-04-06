const redis = require('redis');

// ============================================================
// REDIS CACHE HELPER
// Purpose: Provide getOrSet / invalidate utilities for server-side caching
// If REDIS_URL is not set (local dev), all operations are no-ops — no caching.
// Errors are silently swallowed so a Redis failure never breaks an HTTP response.
// ============================================================

let client = null;
let connecting = false;

async function getClient() {
    if (!process.env.REDIS_URL) return null;
    if (client?.isReady) return client;
    if (connecting) return null;
    try {
        connecting = true;
        client = redis.createClient({ url: process.env.REDIS_URL });
        client.on('error', () => {
            client = null;
            connecting = false;
        });
        await client.connect();
        connecting = false;
        return client;
    } catch (_) {
        client = null;
        connecting = false;
        return null;
    }
}

/**
 * Return cached value if present; otherwise call fetchFn, cache the result, and return it.
 * Falls back to fetchFn directly if Redis is unavailable.
 *
 * @param {string}   key        — Redis key
 * @param {number}   ttlSeconds — expiry in seconds
 * @param {Function} fetchFn    — async function that returns the data to cache
 */
async function getOrSet(key, ttlSeconds, fetchFn) {
    const c = await getClient();
    if (c) {
        try {
            const cached = await c.get(key);
            if (cached) return JSON.parse(cached);
            const data = await fetchFn();
            await c.setEx(key, ttlSeconds, JSON.stringify(data));
            return data;
        } catch (_) {
            // Fall through to fetchFn on any Redis error
        }
    }
    return fetchFn();
}

/**
 * Delete one or more cache keys by exact name.
 * No-op if Redis is unavailable.
 *
 * @param {...string} keys
 */
async function invalidate(...keys) {
    if (keys.length === 0) return;
    const c = await getClient();
    if (!c) return;
    try {
        await Promise.all(keys.map(k => c.del(k)));
    } catch (_) {}
}

/**
 * Delete all keys whose names start with the given prefix.
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 * No-op if Redis is unavailable.
 *
 * @param {string} prefix — e.g. 'activity:abc123:first'
 */
async function invalidatePattern(prefix) {
    if (!prefix) return;
    const c = await getClient();
    if (!c) return;
    try {
        let cursor = 0;
        do {
            const reply = await c.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
            cursor = reply.cursor;
            if (reply.keys.length > 0) {
                await Promise.all(reply.keys.map(k => c.del(k)));
            }
        } while (cursor !== 0);
    } catch (_) {}
}

/**
 * Increment and check a per-user daily AI call counter.
 * Returns true if the user has exceeded the daily limit (caller should block).
 * Returns false if under limit OR if Redis is unavailable (fail open).
 *
 * @param {string} userId
 * @param {number} limit  — max calls per day
 * @param {string} type   — endpoint type key ('summary' | 'flashcards' | 'resume')
 */
async function checkAiLimit(userId, limit, type) {
    const c = await getClient();
    if (!c) return false; // no Redis — fail open, don't block
    const today = new Date().toISOString().split('T')[0];
    const key = `ai:${type}:${userId}:${today}`;
    try {
        const count = await c.incr(key);
        if (count === 1) await c.expire(key, 86400); // expire at end of day
        return count > limit;
    } catch (_) {
        return false;
    }
}

/**
 * Set a key to '1' with a TTL (used for blocklists, e.g. revoked sessions).
 * No-op if Redis is unavailable.
 *
 * @param {string} key
 * @param {number} ttlSeconds
 */
async function setKey(key, ttlSeconds) {
    const c = await getClient();
    if (!c) return;
    try {
        await c.setEx(key, ttlSeconds, '1');
    } catch (_) {}
}

/**
 * Get the raw string value of a key, or null if missing/unavailable.
 *
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getKey(key) {
    const c = await getClient();
    if (!c) return null;
    try {
        return await c.get(key);
    } catch (_) {
        return null;
    }
}

module.exports = { getOrSet, invalidate, invalidatePattern, checkAiLimit, setKey, getKey };
