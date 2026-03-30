# Bug: Demo Account Friends Not Showing in Friends Tab

## Summary

When logged into a demo account (Jane Doe / Justin Burrell seed), the Friends tab shows an empty list even though seed friendships exist in the database and shared content from those friends is visible elsewhere in the app.

---

## Intended Design

- Seed friend accounts (`isSeedUser: true`) should be **invisible to the public** — they must not appear in user search (`GET /users/search`), so real users can claim those usernames without conflict.
- Seed friend accounts should **still appear as friends** of the demo accounts. They are not real discoverable users, but they ARE intentional friends of the demo persona.
- Content seeded from those friends (shared notes, flashcard sets, messages, shared tasks) must remain coherent and attributed to the correct user.

This means `isSeedUser` is a search-exclusion flag only, not a global account-visibility flag.

---

## Root Cause

There are two independent bugs:

### Bug 1 — Frontend key mismatch (primary, always broken)

File: `web/src/pages/friends/Friends.jsx:84`

```js
// What the frontend reads:
const friendships = friendsData?.friendships || friendsData?.data || [];
const requests    = requestsData?.friendships || requestsData?.data || [];
const sentRequests = sentData?.friendships || sentData?.data || [];
```

File: `backend/controllers/friends.controller.js:169`

```js
// What the API actually returns:
res.status(200).json({ success: true, friends: friendships });
//                                     ^^^^^^^
//                                     key is "friends", not "friendships"
```

`friendsData.friendships` is always `undefined`. The fallback `friendsData.data` is also `undefined`. All three lists resolve to `[]`. No friends, requests, or sent requests ever render regardless of what the database contains.

### Bug 2 — Seed script failure (secondary, blocked Justin's friends from existing)

File: `backend/scripts/seed-justin-data.js:1403`

A raw backtick inside a template literal string (`Ctrl+\``) prematurely closed the template literal, causing a `SyntaxError`. The Justin seed script crashed before creating any friends or friendships. **This is now fixed.**

Jane's seed ran successfully and created 20 Friendship documents with `status: 'accepted'`. Justin's friends were never created.

---

## Affected Endpoints

| Endpoint | Returns key | Frontend reads key | Result |
|---|---|---|---|
| `GET /api/friends` | `friends` | `friendships` | always empty |
| `GET /api/friends?status=pending` | `friends` | `friendships` | always empty |
| `GET /api/friends?status=sent` | `friends` | `friendships` | always empty |

---

## What Is Working Correctly

- `GET /users/search` correctly excludes `isSeedUser: true` accounts. Real users can claim those usernames.
- Friendship documents are created correctly by the seed scripts (status: `accepted`, both user IDs set, `deletedAt: null`).
- The `getFriends` controller does NOT filter by `isSeedUser` — seed friends will appear once the key mismatch is fixed. No backend change needed for that intent.
- Jane's 20 seed friend accounts exist in the DB with correct `isSeedUser: true` flags, proper names, and populated content.

---

## Fix Scope (when implementing)

Only `web/src/pages/friends/Friends.jsx:84-86` needs to change.

Change:
```js
const friendships  = friendsData?.friendships  || friendsData?.data  || [];
const requests     = requestsData?.friendships || requestsData?.data || [];
const sentRequests = sentData?.friendships     || sentData?.data     || [];
```

To:
```js
const friendships  = friendsData?.friends  || [];
const requests     = requestsData?.friends || [];
const sentRequests = sentData?.friends     || [];
```

No backend changes are needed. The controller already behaves correctly — seed friends will appear in the friends list once the key is corrected because `getFriends` has no `isSeedUser` filter.

---

## Verification Steps (after fix)

1. Log in as Jane Doe (`janedoe_demo@example.com` / `Demo@1234`)
2. Navigate to Friends tab — should show 20 friends
3. Search within the friends list — should filter correctly
4. Navigate to Find People tab — searching for any of the 20 seed usernames (e.g. `carolinehall`) should return **no results** (isSeedUser exclusion still working)
5. Log in as Justin, navigate to Friends — should show his seed friends after re-running `node backend/scripts/seed-justin.js --clean`
6. Pending and Sent tabs should also render correctly (same key fix applies)
