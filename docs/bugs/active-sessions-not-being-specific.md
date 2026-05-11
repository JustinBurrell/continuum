# BUG: Active Sessions — Inaccurate Device Labels & UX Issues

**Affects:** Web + Android (both have an Active Sessions UI) + Backend (shared device parsing)

---

## Summary of Issues

1. iPad displays as "macOS" instead of "iPadOS" — affects both web and Android (shared backend)
2. "Last logged in" is missing or not updating — Android has it, web needs to be verified
3. Stale/duplicate sessions linger after logout and re-login on the same device — affects both platforms (backend)
4. "Sign out all" redirects back to dashboard instead of logging the user out — web only
5. Sessions list UX needs improvement on both web and Android to match industry standard (Instagram/GitHub/Google)

---

## Issue 1: iPad Detected as macOS

**Platform:** Backend (fix resolves both Web and Android automatically)  
**File:** `backend/controllers/auth.controller.js:98–149` — `parseDeviceLabel()`

**Root cause:** iPadOS 13+ changed its user-agent string to match macOS for desktop-site compatibility. The UA now reads `Macintosh; Intel Mac OS X` — identical to a Mac. The regex check `if (/iPad/.test(ua))` at line 129 **never matches** modern iPads. They fall through to the macOS branch (line 140) and are labelled `macOS x.x.x`. Both web and Android call the same `/api/auth/sessions` endpoint, so they both display the wrong label.

**Fix:**
- Install `ua-parser-js` in `backend/`: `npm install ua-parser-js`
- Replace the custom `parseDeviceLabel()` function with `ua-parser-js`, which maintains a device database that handles iPadOS correctly
- Supplement with HTTP Client Hints headers (available in Chromium-based browsers): read `Sec-CH-UA-Mobile` and `Sec-CH-UA-Platform` from `req.headers` on the login request. If `Sec-CH-UA-Platform` is `"iOS"` or `"iPadOS"`, override the OS label accordingly even if the UA string says macOS
- Final label format: `"Chrome 124 on iPad (iPadOS 17)"` or `"Safari on iPhone (iOS 17)"`
- No changes needed on web or Android frontend — the fix is entirely in the backend label stored in `RefreshToken.deviceId`

---

## Issue 2: Last Logged In Not Shown / Not Updating

**Platform:** Web (primary concern) — Android already shows this correctly  
**Files:**
- `backend/models/RefreshToken.js` — `lastUsedAt` field (updated on every token refresh ✓)
- `backend/controllers/auth.controller.js:729–746` — sessions list endpoint returns `lastUsedAt`
- `web/src/pages/Profile.jsx:998–1048` — web sessions list UI
- `android/.../ProfileScreen.kt:454–458` — Android `SessionRow`: already shows `"Last active ${formatRelativeTime(it)}"` ✓

**Android status:** Android's `SessionRow` at line 455 correctly renders `lastUsedAt` as a relative timestamp. This is likely already working.

**Web fix:**
- In `Profile.jsx:998–1048`, ensure each session card renders `lastUsedAt` as a **relative timestamp** ("2 hours ago", "3 days ago") using `date-fns/formatDistanceToNow` or equivalent
- Add the **absolute date/time** as a `title` tooltip on hover (e.g., `title="May 9, 2026 at 3:42 PM"`)
- Industry pattern (Instagram/GitHub): relative time in the list, absolute on hover/detail view

---

## Issue 3: Stale and Duplicate Sessions After Logout

**Platform:** Backend (fix resolves both Web and Android)  
**File:** `backend/controllers/auth.controller.js` — login handler (wherever `generateRefreshToken()` is called for a new login)

**Root cause:** No deduplication on login. Every login creates a new `RefreshToken` document. When a user logs out and logs back in on the same browser or Android device, both the old revoked token row and the new one appear, making the list look like active sessions that aren't.

**Fix:**
- Before creating a new `RefreshToken` on login, query for any existing **non-revoked** tokens with the same `deviceId` for that `userId` and revoke them:
  ```javascript
  await RefreshToken.updateMany(
    { userId, deviceId: parsedDeviceId, revokedAt: null },
    { revokedAt: new Date() }
  );
  ```
- Then create the new token as usual
- Sessions endpoint (`auth.controller.js:729–746`) should also filter `expiresAt > now` in addition to `revokedAt == null` to exclude expired tokens that slipped through

---

## Issue 4: Sign Out All Redirects to Dashboard Instead of Logging Out

**Platform:** Web only — Android handles this correctly via ViewModel + `onLogout` callback  
**File:** `web/src/pages/Profile.jsx:452–457` — `doLogoutAll()`

**Android status:** Android's `ProfileScreen.kt:410–413` calls `viewModel.logoutAll(onLogout)`. The ViewModel clears auth tokens via repository, then calls the `onLogout` callback which navigates to the sign-in screen. This flow is correct.

**Root cause (web):** `doLogoutAll` calls `navigate('/login')` while `AuthContext.user` is still set in React state. The protected-route guard sees the user as authenticated and immediately redirects back to `/dashboard` before the auth state clears.

```javascript
// Current (broken):
const doLogoutAll = async () => {
  setShowLogoutAllConfirm(false);
  setLogoutAllLoading(true);
  try { await api.post('/auth/logout-all'); } catch (_) {}
  finally { localStorage.clear(); navigate('/login'); }
};
```

**Web fix:** Call `logout()` from `useAuth()` (which clears `AuthContext.user` and `localStorage`) **before** navigating:
```javascript
// Fixed:
const doLogoutAll = async () => {
  setShowLogoutAllConfirm(false);
  setLogoutAllLoading(true);
  try {
    await api.post('/auth/logout-all');
  } catch (_) {}
  finally {
    logout();          // clears AuthContext.user + localStorage
    navigate('/login');
  }
};
```
`logout` is already available from `useAuth()` at the top of the Profile component.

---

## Issue 5: Sessions List UX Below Industry Standard

**Platform:** Web AND Android  
**Files:**
- `web/src/pages/Profile.jsx:998–1048` — web sessions UI
- `android/.../ProfileScreen.kt:431–468` — Android `SessionRow` composable

**Reference:** Instagram, GitHub, and Google sessions pages all follow these patterns: current session first, device type icon, relative "last active" timestamp, distinct current-session badge.

### Web Fixes (4 improvements)

1. **Current session first:** Sort sessions so the entry with `isCurrent: true` always appears at the top
2. **Device type icon:** Infer device type from the `deviceId` string — "iPhone"/"Android" → phone icon (`Smartphone` from Lucide); "iPad" → tablet icon (`Tablet`); otherwise → desktop icon (`Monitor`)
3. **Last active display:** Show `lastUsedAt` as relative time ("2h ago") as the primary timestamp. On hover (via `title` attribute), show the full absolute date/time. Label `createdAt` as "Signed in" and `lastUsedAt` as "Last active" as separate visual elements
4. **Current session badge:** Verify the "This device" badge is visually distinct. Confirm the delete button is disabled/hidden for the current session to prevent self-lockout

### Android Fixes (3 improvements)

1. **Current session first:** Verify sessions are sorted so `isCurrent == true` appears first in the list. If the API returns them unsorted, sort in `ProfileViewModel` before passing to UI state: `sessions.sortedByDescending { it.isCurrent }`
2. **Device type icon:** Add a leading icon to `SessionRow` (`android/.../ProfileScreen.kt:431–468`) based on `deviceId` label keywords:
   - "iPhone" or "Android" → `Icons.Default.Smartphone`
   - "iPad" → `Icons.Default.Tablet` (or `Icons.Default.TabletAndroid`)
   - Otherwise → `Icons.Default.Computer` or `Icons.Default.DesktopWindows`
3. **Improve timestamp display:** The current `SessionRow` concatenates `"Signed in $date · Last active $time · $location"` into a single text string (line 454–458). Split into two `Text` rows: the device label on top (already bold), and below it a subtitle with location + last active. This gives better visual hierarchy and prevents very long single-line strings.

---

## Industry Reference

How major apps handle this (Instagram / GitHub / Google):
- **Device label:** Browser name, OS, and device type (phone/tablet/desktop) — not just OS version
- **Timestamps:** Relative ("5 min ago") in list, absolute on hover
- **Current session:** Listed first, visually badged, no logout action
- **Location:** City/country from IP geo (already implemented via `geoip-lite`)
- **Sign-out all:** Immediate invalidation → user state fully cleared → redirect to login
- **Deduplication:** Same device re-logging collapses old sessions

---

## Files to Change

| File | Platform | Change |
|------|----------|--------|
| `backend/controllers/auth.controller.js:98–149` | Backend | Replace `parseDeviceLabel()` with `ua-parser-js` + Client Hints headers |
| `backend/controllers/auth.controller.js` (login handler) | Backend | Revoke same-`deviceId` tokens before creating new one |
| `backend/controllers/auth.controller.js:729–746` | Backend | Add `expiresAt > now` filter to sessions query |
| `backend/package.json` | Backend | Add `ua-parser-js` dependency |
| `web/src/pages/Profile.jsx:452–457` | Web | Fix `doLogoutAll` to call `logout()` before `navigate` |
| `web/src/pages/Profile.jsx:998–1048` | Web | UX: sort current first, device icons, relative timestamps |
| `android/.../ProfileScreen.kt:431–468` | Android | UX: add device type icon to `SessionRow`, split timestamp display into two rows |
| `android/.../ProfileViewModel.kt` | Android | Sort sessions so `isCurrent == true` is first |

---

## Tests Needed

### Jest — Backend Unit Tests (`backend/tests/` or `backend/__tests__/`)

1. **`parseDeviceLabel` / `ua-parser-js` replacement**
   - Test: iPad UA string (`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15` with `Sec-CH-UA-Platform: "iPadOS"`) → label contains "iPad" not "macOS"
   - Test: iPhone UA → label contains "iPhone"
   - Test: Android UA → label contains "Android"
   - Test: Chrome on Windows UA → label contains "Windows"
   - Test: unknown UA → returns "Unknown device"

2. **Session deduplication on login**
   - Test: logging in twice with the same `deviceId` results in exactly 1 active (non-revoked) `RefreshToken` for that device
   - Test: logging in from a second device does not revoke the first device's session

3. **Sessions list endpoint filtering**
   - Test: expired tokens (`expiresAt < now`) do not appear in `GET /api/auth/sessions` response
   - Test: revoked tokens do not appear in the response
   - Test: `isCurrent` is true for the session that matches the requesting JWT's `sessionId`

4. **Logout-all**
   - Test: after `POST /api/auth/logout-all`, all previously active `RefreshToken` docs for that user have `revokedAt` set
   - Test: after logout-all, `user.tokenVersion` is incremented

### Playwright — E2E Tests (Web)

1. **Sessions list displays correct info**
   - Sign in → navigate to Profile > Security tab → verify at least one session row is visible
   - Verify the current session has a "This device" badge
   - Verify "Last active" timestamp is present and non-empty

2. **Sign out all clears auth and redirects to login**
   - Sign in → Profile > Security → click "Sign out all" → confirm dialog → verify URL is `/login` (not `/dashboard`)
   - Verify trying to visit `/dashboard` redirects back to `/login` (session is fully cleared)

3. **Revoke individual session**
   - Sign in on two browsers/contexts → on browser A, revoke browser B's session → verify browser B gets a 401 on next API call

4. **No duplicate sessions after re-login**
   - Sign in → sign out → sign in again → verify sessions list shows only 1 session (not 2)

### Android — Unit Tests (`ProfileViewModelTest` or similar)

1. **Sessions sorted with current first**
   - Given a list of sessions where `isCurrent = false` for all except the last, verify ViewModel state presents the `isCurrent` session as `sessions[0]`

2. **Logout-all clears tokens and triggers `onLogout`**
   - Mock `ProfileRepository.logoutAll()` returning success → verify `onLogout` callback is invoked and auth token is cleared from `TokenManager`
