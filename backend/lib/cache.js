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
 * Delete one or more cache keys.
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

module.exports = { getOrSet, invalidate };
