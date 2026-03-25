# Bug: Sign Out All Devices Does Not Invalidate Active Sessions

**Status:** Open
**Priority:** Medium
**Reported:** 2026-03-25
**Environment:** Production

---

## Description

"Sign out of all devices" on the Profile page does not actually sign out other active sessions. After clicking the button on one device, other devices remain fully logged in and can continue to use the app without interruption.

**Steps to reproduce:**
1. Log in on Device A (e.g., laptop) and Device B (e.g., phone)
2. On Device A, go to Profile → Security → click "Sign out all devices"
3. Observe: Device A redirects to `/login` ✓
4. Observe: Device B is still logged in and fully functional ✗

---

## Root Cause

The implementation has two layers — access tokens (JWT, 1-day expiry) and refresh tokens (stored in MongoDB, 30-day expiry).

`POST /auth/logout-all` only revokes refresh tokens:

```js
// backend/controllers/auth.controller.js
exports.logoutAll = async (req, res) => {
    await RefreshToken.updateMany(
        { userId: req.user._id, revokedAt: null },
        { revokedAt: new Date() }
    );
    res.status(200).json({ success: true, message: 'Logged out of all devices' });
};
```

The auth middleware validates requests using the JWT access token only — it does **not** check the RefreshToken collection on every request. So even after all refresh tokens are revoked:

- Device B's **access token** (JWT) is still valid for up to 24 hours
- Device B's requests are still accepted by the server
- Device B is only truly kicked out when its access token expires and the subsequent `/auth/refresh` call fails (revoked refresh token → 401 → redirect to login)

**Net effect:** "Sign out all" has up to a 24-hour lag before other sessions are actually terminated.

---

## Fix Options

### Option A — Add `tokenVersion` to User model (recommended)

Add a `tokenVersion: Number` field to the `User` model (default `0`). Embed `tokenVersion` in the JWT payload at sign-in. In auth middleware, compare the JWT's `tokenVersion` against the DB value on every request.

`logoutAll` increments `tokenVersion` by 1:

```js
await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
await RefreshToken.updateMany({ userId: req.user._id, revokedAt: null }, { revokedAt: new Date() });
```

Auth middleware check (after existing JWT verification):

```js
if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
    return res.status(401).json({ success: false, error: 'Session invalidated.' });
}
```

**Trade-off:** One extra DB read per request if `user` isn't cached, but the existing auth middleware already fetches the user (with 5-min cache), so the `tokenVersion` check is essentially free.

### Option B — Shorten access token expiry

Reduce JWT expiry from 1 day to 15 minutes. Revocation still has a lag, but it's capped at 15 minutes instead of 24 hours. Simpler change, but more `/auth/refresh` calls and doesn't fully solve the problem.

### Option C — Blocklist revoked JTIs in Redis

On `logoutAll`, add all active JWT IDs (JTI) to a Redis blocklist with TTL matching their remaining expiry. Auth middleware checks the blocklist. Instant invalidation with no DB schema changes — but requires Redis (already in stack) and storing JTIs at login.

---

## Related Feature: Per-Device Session Management

The `RefreshToken` model already has a `deviceId` field:

```js
// backend/models/RefreshToken.js
deviceId: {
    type: String,
    default: null,
    // Used for future 'manage devices' UI — not functional auth logic
}
```

However:
1. **`deviceId` is never populated at login.** The frontend doesn't pass a device label, so all sessions show `null`.
2. **No endpoint exists** to list active sessions or revoke a specific session by token ID.
3. **No user agent or IP is stored** per session.

### To make per-device management work:

**Backend changes needed:**
- At login/register, capture `User-Agent` header and parse a human-readable device label (e.g., "Chrome on Mac", "Mobile Safari on iPhone") — store on `RefreshToken.deviceId`
- `GET /auth/sessions` — return all non-revoked, non-expired `RefreshToken` records for the current user (id, deviceId, createdAt, lastUsedAt)
- `DELETE /auth/sessions/:id` — revoke a single refresh token by its record `_id`
- `DELETE /auth/sessions` — existing `logoutAll`, but fixed to also increment `tokenVersion`

**Frontend changes needed:**
- Profile → Security section: show a list of active sessions with device name + sign-in date
- "Sign out" button per session
- "Sign out all other devices" button (excludes current session)

---

## Acceptance Criteria

- [ ] Clicking "Sign out all devices" terminates all other sessions **immediately** (within one request cycle), not after access token expiry
- [ ] The currently initiating session is also terminated and the user is redirected to `/login`
- [ ] Each active session shows a recognizable device label in the UI
- [ ] Individual sessions can be revoked from the Profile page
- [ ] "Sign out all" works correctly and leaves no active sessions behind

---

## Required Updates When Fixed

### Jest Tests (`backend/tests/auth.test.js`)

Add or update tests in the auth suite:

- **`logoutAll` immediately invalidates access tokens** — log in on two "sessions" (two JWTs), call `POST /auth/logout-all` with session A's token, then verify a protected request with session B's (still-valid) JWT returns `401`. Currently this test would pass the JWT check and incorrectly return `200`.
- **`logoutAll` revokes all refresh tokens** — after calling `logoutAll`, verify `POST /auth/refresh` with any previously issued refresh token returns `401`.
- **`GET /auth/sessions`** (new endpoint) — verify it returns all active, non-expired sessions for the authenticated user.
- **`DELETE /auth/sessions/:id`** (new endpoint) — verify it revokes a specific session and that subsequent refresh attempts with that token's cookie return `401`.
- **Device label capture** — verify that after login the created `RefreshToken` record has a non-null `deviceId` parsed from the `User-Agent` header.

### Postman / Swagger (`backend/app.js`, JSDoc route comments)

- **`POST /auth/logout-all`** — update the success response description to note immediate invalidation and mention the `tokenVersion` mechanism.
- **`GET /auth/sessions`** (new) — document the endpoint: auth required, returns array of `{ id, deviceId, createdAt, lastUsedAt }` for non-revoked sessions.
- **`DELETE /auth/sessions/:id`** (new) — document: auth required, path param `id` is the RefreshToken `_id`, returns `204` on success or `404` if not found / already revoked.
- Update the Swagger tag for the `Auth` group to include the new session management endpoints.

### Docs

- **`backend/README.md`** — update the Auth section to describe the `tokenVersion` invalidation strategy and the new session management endpoints.
- **`docs/backend/system-design.md`** — update the auth flow diagram notes to reflect that `tokenVersion` is now embedded in the JWT payload and checked on every authenticated request.
