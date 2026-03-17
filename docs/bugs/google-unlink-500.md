# Bug: Google Unlink Returns 500

**Reported:** March 17, 2026
**Severity:** Medium — unlink button non-functional, no data loss
**Status:** Deferred

---

## Symptoms

Clicking "Unlink" on the Google Account card in Profile returns:

```
DELETE http://localhost:5001/api/auth/me/google/link 500 (Internal Server Error)
Cannot read properties of undefined (reading 'keepNotes')
```

## Root Cause

`googleUnlink` in `auth.controller.js` destructures `req.body` to read `keepNotes`:

```js
const { keepNotes = true } = req.body;
```

The frontend sends the DELETE with no body:

```js
api.delete('/auth/me/google/link')
```

For DELETE requests with no body, `body-parser` may set `req.body` to `undefined` or `{}`. After the `mongo-sanitize` middleware processes it, `req.body` can become `null` or `undefined`. Destructuring `null`/`undefined` throws:

```
Cannot read properties of undefined (reading 'keepNotes')
```

This crashes before the `try/catch` or global error handler can return a clean JSON response, producing a 500.

## Fix

Two things needed:

1. **Guard the destructure** — default `req.body` to `{}` before destructuring:

```js
const { keepNotes = true } = req.body || {};
```

2. **Send `keepNotes` from the frontend** — the Profile unlink button should pass an explicit body so the user can choose what happens to imported Google Doc notes:

```js
api.delete('/auth/me/google/link', { data: { keepNotes: true } })
```

Or show a confirmation modal first asking "Keep your imported Google Doc notes?" before firing the request.

## Context

- This is only triggered when a user with linked Google Drive tries to unlink
- `keepNotes: true` (keep Google Doc notes as standalone copies) vs `keepNotes: false` (soft-delete all notes with a `googleDocId`)
- The password check added in the security hardening PR (`select('+password')`) works correctly — the bug is hit before that check completes
- No data is lost or corrupted — the unlink simply fails and leaves Google still linked

## Related Files

- `backend/controllers/auth.controller.js` — `googleUnlink` function
- `web/src/pages/Profile.jsx` — unlink button onClick handler
