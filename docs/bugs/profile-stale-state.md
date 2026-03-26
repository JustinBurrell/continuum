# Bug: Profile Page Shows Stale emailVerified / googleId After External Change

**Status:** Fixed
**Priority:** Medium
**Reported:** 2026-03-25
**Branch:** `fix/profile-stale-state`

---

## Description

Two related stale-state issues on the Profile page — both caused by the same root:

### 1. Email verification badge stays "Not verified" after clicking the link

1. On Profile, click "Verify email" → email arrives ✓
2. Click the verification link in the email (opens in a new tab or navigates away)
3. Backend marks `emailVerified: true`
4. Return to Profile → badge still shows "Not verified" ✗
5. Log out and back in → "Verified" ✓ (confirms it worked, UI just didn't update)

### 2. Google account stays "Not connected" after OAuth

1. On Profile, click "Connect" → redirected to Google → completes OAuth
2. AuthCallback exchanges code, stores token, navigates to `/dashboard`
3. Navigate to Profile → "Not connected" still shown ✗
4. Log out and back in → "Connected" ✓

---

## Root Cause

`Profile.jsx` uses React Query to fetch user data:

```js
// Profile.jsx
const { data } = useQuery({
  queryKey: ['me'],
  queryFn: () => api.get('/auth/me').then(r => r.data),
  // inherits global staleTime: 30_000
});
```

The global `QueryClient` sets `staleTime: 30_000` (30 seconds). React Query's `refetchOnWindowFocus` only refetches if the cached data is stale. Within 30 seconds, it considers the data fresh and skips the refetch — so even when the user returns from clicking the verification link or completing OAuth, the stale `emailVerified: false` / `googleId: null` is served from cache.

Additionally, `AuthCallback.jsx` calls `updateUser(user)` (updates `AuthContext` state) but does **not** invalidate the `['me']` React Query cache. Since these are separate stores, Profile's query never learns about the updated `googleId`.

---

## Fix

### 1. `Profile.jsx` — set `staleTime: 0` and `refetchOnWindowFocus: true` on `['me']`

```js
const { data } = useQuery({
  queryKey: ['me'],
  queryFn: () => api.get('/auth/me').then(r => r.data),
  staleTime: 0,
  refetchOnWindowFocus: true,
});
```

`staleTime: 0` means the cached data is always considered stale. React Query will then honour `refetchOnWindowFocus` and re-fetch `/auth/me` every time the user returns to the tab — picking up `emailVerified: true` or the new `googleId` without a logout.

### 2. `AuthCallback.jsx` — invalidate `['me']` after `updateUser`

```js
import queryClient from '@/lib/queryClient';
// ...
queryClient.invalidateQueries({ queryKey: ['me'] });
updateUser(user);
```

Belt-and-suspenders: even if Profile is already mounted and cached, the invalidation forces a fresh fetch the next time it renders.

---

## Files Changed

| File | Change |
|------|--------|
| `web/src/pages/Profile.jsx` | `staleTime: 0`, `refetchOnWindowFocus: true` on `['me']` query |
| `web/src/pages/auth/AuthCallback.jsx` | `queryClient.invalidateQueries(['me'])` after `updateUser` |

---

## Testing

### Manual
- Send verification email → click link → return to Profile tab within 5 seconds → badge shows "Verified" immediately (no logout needed)
- Connect Google → complete OAuth → navigate to Profile → "Connected" shown immediately

### Jest (`backend/tests/auth.test.js`)
No backend changes — this is a pure frontend cache fix. No new Jest tests required.

### Postman / Swagger
No API changes. `GET /auth/me` already returns `emailVerified` and `googleId` correctly — the bug was entirely in how the frontend cached the response.

### Docs
No doc updates needed — this fix aligns behaviour with what the API already guarantees.
