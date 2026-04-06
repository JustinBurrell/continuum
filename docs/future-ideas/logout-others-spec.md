# Logout Others — Feature Spec

## Current State

- `POST /api/auth/logout-all` exists and works: increments `tokenVersion`, revokes all `RefreshToken` docs, clears cookie — logs the current user out too
- `DELETE /api/auth/sessions/:id` exists and works: revokes a single session and writes a Redis blocklist key for immediate JWT rejection
- `req.sessionId` is set by auth middleware from the JWT payload — the current session's `RefreshToken._id` is already available on every authenticated request
- There is no way to revoke all _other_ sessions while keeping the current one active — what Instagram, Google, and GitHub call "Sign out of all other devices"

---

## Goal

Add `POST /api/auth/logout-others` — revokes every active session **except** the caller's current session. The caller stays logged in. All other devices are immediately logged out via the Redis blocklist (same mechanism as `DELETE /auth/sessions/:id`).

---

## Endpoint

```
POST /api/auth/logout-others
Auth: required
Body: none
```

**Response:**
```json
{ "success": true, "revokedCount": 3 }
```

---

## Backend Implementation

### `backend/controllers/auth.controller.js`

Add `exports.logoutOthers` after `exports.logoutAll`:

```js
// POST /api/auth/logout-others
// Purpose: Revoke all sessions except the current one — keeps the caller logged in
exports.logoutOthers = async (req, res) => {
    const currentSessionId = req.sessionId; // set by auth middleware from JWT payload

    // Find all active sessions except the current one
    const query = { userId: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } };
    if (currentSessionId) query._id = { $ne: currentSessionId };

    const sessions = await RefreshToken.find(query).select('_id');

    if (sessions.length === 0) {
        return res.status(200).json({ success: true, revokedCount: 0 });
    }

    const ids = sessions.map((s) => s._id);

    // Soft-revoke in DB
    await RefreshToken.updateMany({ _id: { $in: ids } }, { revokedAt: new Date() });

    // Write Redis blocklist key for each revoked session so any still-valid JWT is immediately rejected
    const jwtTtlSeconds = parseInt(process.env.JWT_EXPIRES_SECONDS, 10) || 86400;
    await Promise.all(ids.map((id) => setKey(`revoked_session:${id}`, jwtTtlSeconds)));

    res.status(200).json({ success: true, revokedCount: ids.length });
};
```

Key notes:
- `setKey` is already imported in `auth.controller.js`
- `req.sessionId` is already set by `auth.middleware.js` when the JWT contains a `sessionId` field
- If `req.sessionId` is undefined (old JWT without sessionId, rare edge case), `query._id` is not set and all sessions are revoked — safe fallback matching `logout-all` behavior
- Does **not** increment `tokenVersion` — only the current device's sessions are affected, not the current JWT

### `backend/routes/auth.routes.js`

Register the route and add Swagger JSDoc:

```js
/**
 * @swagger
 * /api/auth/logout-others:
 *   post:
 *     summary: Sign out of all other devices (keep current session)
 *     description: >
 *       Revokes all active sessions except the one making the request.
 *       Each revoked session's sessionId is written to the Redis blocklist so
 *       any still-valid JWT for that session is immediately rejected — no waiting
 *       for token expiry. The caller remains logged in. Returns the count of
 *       sessions revoked.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Other sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 revokedCount: { type: integer, example: 3 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout-others', authMiddleware, authController.logoutOthers);
```

---

## Frontend Changes

### `web/src/pages/Profile.jsx` — Security tab

Replace the current "Sign out all" button in the Danger Zone with **two** buttons:

| Button | Action | Behavior |
|---|---|---|
| Sign out other devices | `POST /auth/logout-others` | Stays logged in, invalidates all other sessions |
| Sign out all devices | `POST /auth/logout-all` | Logs out everywhere including this device |

UI details:
- "Sign out other devices" uses `variant="outline"` or secondary danger style — less destructive
- "Sign out all devices" keeps `variant="danger"` — same as today
- Both show a confirm modal before firing
- After `logout-others` succeeds, invalidate the sessions query (`queryClient.invalidateQueries({ queryKey: ['sessions'] })`) so the list refreshes and only the current session remains
- Show `revokedCount` in the success toast: `"Signed out of ${revokedCount} other device(s)"`

### `web/src/lib/api.js`

Add the new call (or call it inline in Profile.jsx — no dedicated service needed):

```js
export const logoutOthers = () => api.post('/auth/logout-others');
```

---

## Auth Middleware Note

`req.sessionId` is already attached by `auth.middleware.js` (line ~56) when `decoded.sessionId` is present. No middleware changes needed.

---

## Testing

### Jest (`backend/tests/jest/auth.test.js`)

Add a `POST /api/auth/logout-others` describe block:

```
describe('POST /api/auth/logout-others', () => {
  it('revokes all sessions except the current one')
    Steps:
      1. Register (session A — current)
      2. Login again from different UA (session B)
      3. Login again (session C)
      4. POST /auth/logout-others with tokenA
      5. GET /auth/sessions with tokenA → expect only 1 session (current)
      6. POST /auth/refresh with session B's cookie → expect 401
      7. GET /auth/me with tokenA → expect 200 (still logged in)

  it('returns revokedCount = 0 when no other sessions exist')
    Steps:
      1. Register (single session)
      2. POST /auth/logout-others
      3. Expect 200, revokedCount = 0
      4. GET /auth/me → still 200

  it('immediately rejects JWTs for revoked sessions via Redis blocklist')
    Steps: same pattern as the existing revoked-session blocklist test in DELETE /sessions/:id
})
```

### Postman

Add a "Auth — Logout Others" folder to a future session collection:
1. Login (capture tokenA + cookieA)
2. Login again (different UA header) — capture tokenB
3. POST /auth/logout-others with tokenA → verify 200, revokedCount ≥ 1
4. GET /auth/me with tokenA → verify 200 (still authenticated)
5. POST /auth/refresh with cookieB → verify 401 (other session revoked)

### Docs to Update on Implementation

| File | What to add |
|---|---|
| `docs/backend/api_reference_guide.md` | Add `POST /api/auth/logout-others` entry |
| `docs/continuum-interview-brief.md` | Update auth feature description + test count + security blurb |
| `docs/database/mongodb_schema_explaination.md` | Mention logout-others in section 8 alongside logout-all |

---

## Implementation Order

1. `auth.controller.js` — `logoutOthers` function
2. `auth.routes.js` — route + Swagger
3. `auth.test.js` — 3 new tests
4. `Profile.jsx` — replace single button with two buttons + confirm modals
5. Docs updates

---

## Files to Create or Modify

| File | Change |
|---|---|
| `backend/controllers/auth.controller.js` | Add `exports.logoutOthers` |
| `backend/routes/auth.routes.js` | Register route + Swagger JSDoc |
| `backend/tests/jest/auth.test.js` | 3 new tests |
| `backend/tests/postman/` | New session collection with logout-others flow |
| `web/src/pages/Profile.jsx` | Replace "Sign out all" with two-button UI |
| `docs/backend/api_reference_guide.md` | Add new endpoint |
| `docs/continuum-interview-brief.md` | Update test count + auth description |
| `docs/database/mongodb_schema_explaination.md` | Section 8 update |
