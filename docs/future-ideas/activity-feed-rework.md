# Activity Feed Rework

## Problems

### 1. Shared task activity not appearing in feed
`createShareActivities` is only called in `tasks.controller.js` when `task.isShared && validatedParticipants.length > 0` (line 105). If the user creates a shared task without adding participants at creation time, no activity is ever created. Additionally, the first-page activity cache may not be invalidated after task creation, so even correctly-created activities don't appear until the cache expires (5 min).

**Investigate:**
- Does the frontend send `isShared: true` with participants on task creation, or does it send them separately?
- Is the cache invalidation (`invalidate(activity:${userId}:first:*)`) being called after `createShareActivities`? (It is inside `notifyActivityAudience` in the service, but only if `visibleTo` is non-empty — verify this path fires)
- Does the actor (task owner) appear in their own activity feed after creating a shared task?

### 2. New activity count resets across sessions
`lastViewedActivityAt` is stored in `localStorage`, which means:
- It is device-specific — a user on a second device always sees the full unread count
- It survives logout (logout only removes `token/refreshToken/user`) but is fragile — clearing browser data, incognito sessions, or any code change that wipes localStorage resets it
- It is not the Instagram model — Instagram stores the "last seen" timestamp server-side per user

---

## Correct Instagram-Like Model

On Instagram, the notification count reflects activities that arrived **since the user last opened the activity tab**, persisted server-side so it's consistent across devices and sessions.

### How it should work
1. User logs in → Dashboard shows count of activities newer than their `lastViewedActivityAt` (stored on User)
2. User opens `/activity` → frontend calls `PUT /api/activity/mark-seen` → backend sets `user.lastViewedActivityAt = now`
3. User returns to Dashboard → count is 0 (or reflects only activities since they just marked it seen)
4. User logs in on a second device → same count, because it's server-side

---

## Implementation Plan

### Backend

**1. Add field to User model (`backend/models/User.js`):**
```js
lastViewedActivityAt: { type: Date, default: null }
```

**2. New endpoint — `PUT /api/activity/mark-seen` (`activity.routes.js` + `activity.controller.js`):**
```js
exports.markSeen = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { lastViewedActivityAt: new Date() });
    res.status(200).json({ success: true });
};
```

**3. Include `lastViewedActivityAt` in auth responses:**
- `GET /api/auth/me` — already returns user object, add the field
- Login/register responses — include it so the frontend has it immediately on auth

**4. `GET /api/activity` `since` param:**
- Already implemented — reads `since` query param and applies to `countDocuments`
- No changes needed here

### Frontend

**1. Remove localStorage approach from `Dashboard.jsx`:**
- Delete `localStorage.getItem('lastViewedActivityAt')`
- Read `since` from `user.lastViewedActivityAt` (already in AuthContext)
- Pass it to the activity query: `params: { limit: 4, since: user.lastViewedActivityAt }`

**2. Update `Activity.jsx`:**
- Replace `localStorage.setItem('lastViewedActivityAt', ...)` with `api.put('/activity/mark-seen')`
- On success, call `updateUser({ lastViewedActivityAt: new Date().toISOString() })` to update AuthContext so Dashboard re-renders with count 0 without a full refresh

**3. React Query cache invalidation:**
- After `mark-seen` succeeds, invalidate `['activity', { limit: 4, since: ... }]` query so Dashboard refetches immediately

---

## Files to Change
- `backend/models/User.js` — add `lastViewedActivityAt` field
- `backend/controllers/activity.controller.js` — add `markSeen` export
- `backend/routes/activity.routes.js` — add `PUT /mark-seen` route
- `backend/controllers/auth.controller.js` — include `lastViewedActivityAt` in `/me` and login responses
- `web/src/pages/Dashboard.jsx` — read from `user.lastViewedActivityAt` instead of localStorage
- `web/src/pages/Activity.jsx` — call `PUT /activity/mark-seen` on mount instead of localStorage
- `web/src/context/AuthContext.jsx` — ensure `updateUser` is available (already is)

## Also Fix
- Investigate and fix shared task activity not appearing (see Problem 1 above)
- After fix, add integration test: create shared task → verify activity appears in both owner and participant feeds

## When Done — Update
- **Jest (`backend/tests/jest/activity.test.js`)** — add tests: shared task creates activity for owner and participant; `mark-seen` updates `lastViewedActivityAt`; `since` using server-side timestamp returns correct unseen count
- **Postman (`continuum-session9.postman_collection.json`)** — add `PUT /api/activity/mark-seen` request; update "Get activity feed — with since param" to use a dynamic `{{lastViewedActivityAt}}` env var
- **`backend/tests/jest/README.md`** — update Activity row with new test cases
- **`backend/tests/postman/README.md`** — add `mark-seen` row to section 6 Activity Feed table
- **`docs/backend/api_reference_guide.md`** — add `PUT /api/activity/mark-seen` endpoint entry; update `GET /api/activity` `since` param note to reflect server-side source
- **`backend/models/User.js`** — `lastViewedActivityAt` field is a schema change; update `docs/database/mongodb_schema_explaination.md` and `docs/database/schema_diagram.md` if they document the User schema
