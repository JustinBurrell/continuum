# BUG: Google OAuth Tab/CCT Doesn't Close After Login

**Affects:** Android (CCT — primary issue) + Web mobile (popup tab — secondary issue)
**Web desktop:** Not affected — full-page redirect flow works correctly

---

## Summary of Issues

When a user completes Google OAuth (either during onboarding/linking or at sign-in), the tab or Chrome Custom Tab that opened for the OAuth flow does not close automatically. The user is left stranded on the callback page instead of being returned to the original screen logged in.

- **Android CCT:** After completing Google OAuth in a Chrome Custom Tab, the CCT stays open showing a web page instead of closing and returning to the app.
- **Web mobile (Chrome on Android / Safari on iOS):** The popup/tab opened by `window.open()` does not auto-close after OAuth completes — `window.close()` is blocked by mobile browsers for tabs that navigated cross-origin.
- **Web desktop:** Uses `window.location.href` (full-page redirect in the same tab) — not a popup, no close issue. This flow is correct and should not be touched.

---

## How the Current Flows Work

### Web Desktop — Sign In ("Continue with Google")
- `AuthContext.jsx:214–217`: `googleLogin()` does `window.location.href = '/api/auth/google'`
- Full-page redirect: same tab navigates through Google OAuth → `/auth/callback` → `/dashboard` or `/onboarding`
- **Status: Working correctly. No changes needed.**

### Web — Onboarding/Linking Popup Flow
- `web/src/components/onboarding/steps/IntegrationsStep.jsx:63–116`: opens `window.open('/api/auth/google?source=linking', 'google-oauth', 'width=500,height=640')`
- `web/src/pages/auth/AuthCallback.jsx:43–51`: detects `source=linking`, broadcasts `GOOGLE_OAUTH_SUCCESS` via `BroadcastChannel('continuum_oauth')`, then calls `window.close()`
- **Desktop:** `window.close()` works — popup closes, parent tab receives broadcast and updates
- **Mobile (Android Chrome / iOS Safari):** `window.open()` opens a new tab (not a popup). `window.close()` is blocked for tabs that navigated cross-origin through Google's servers. The tab stays open. The BroadcastChannel message does go through, so the parent tab updates correctly — but the user is stuck on the open tab.

### Android Native — Onboarding/Linking CCT Flow
- `android/.../GoogleDriveStep.kt:57–77`: opens CCT at `"$apiBaseUrl/api/auth/google"` — **no `source` param**
- Without a `source` param, `AuthCallback.jsx` falls through to the regular sign-in branch (line 67–68) and calls `navigate('/dashboard')` inside the CCT — wrong behavior inside a CCT
- Even if `source=linking` were passed, `window.close()` is **always blocked** inside a CCT — JavaScript cannot close a Chrome Custom Tab
- **The only way to auto-close a CCT is to navigate to a custom URI scheme** (e.g., `continuum://`) which causes the Android system to close the CCT and route the deep link to the app

---

## Fix

### Fix 1: Android CCT Auto-Close via Deep Link

**Platform:** Android + Web (`AuthCallback.jsx`) + Backend (Passport state passthrough)

**How it works:** Navigate the CCT to `continuum://oauth-callback?linked=true` after successful OAuth. Android intercepts the deep link, closes the CCT automatically, and the app handles the result.

**Step-by-step:**

**A. Android — `GoogleDriveStep.kt:57–77`**
Append `?source=android-linking` to the CCT URL:
```kotlin
intent.launchUrl(
    context,
    "$apiBaseUrl/api/auth/google?source=android-linking".toUri()
)
```

**B. Android — `IntegrationsStep.kt`** (if it also has a CCT-based Google linking flow)
Apply the same `?source=android-linking` param.

**C. Web — `AuthCallback.jsx`**
Add a new branch for `source === 'android-linking'` before the existing `source === 'linking'` branch:
```javascript
if (source === 'android-linking') {
  // Redirect to custom scheme — CCT auto-closes, Android intercepts deep link
  window.location.href = 'continuum://oauth-callback?linked=true';
  return;
}
```
This must come before the `source === 'linking'` check.

**D. Backend — Passport OAuth callback** (`backend/config/passport.js` or the auth callback route)
The Google OAuth flow passes a `state` parameter through the round-trip. Verify that when `/api/auth/google?source=android-linking` is called, the `source` value is encoded into the OAuth `state` and decoded back onto the callback URL as `?source=android-linking`. The existing `source=linking` already does this — confirm `android-linking` also passes through correctly.

**E. Android — NavGraph / deep link registration**
Register `continuum://oauth-callback` as a deep link destination in the Android NavGraph (`NavHost` or `AndroidManifest.xml` intent filter). On arrival:
- Read the `linked` query param
- If `linked=true`, call the same profile-refresh logic already used by `LifecycleEventEffect(ON_RESUME)` in `GoogleDriveStep.kt` — refresh profile, call `onContinue()` if `isGoogleLinked == true`

---

### Fix 2: Web Mobile Popup — Improve Fallback UX

**Platform:** Web only  
**Files:** `web/src/components/onboarding/steps/IntegrationsStep.jsx:63–116`, `web/src/pages/auth/AuthCallback.jsx:76–88`

The BroadcastChannel already works on mobile — the parent tab receives the `GOOGLE_OAUTH_SUCCESS` message and updates correctly. The only problem is the stuck open tab. Auto-close is not reliably achievable on mobile browsers.

**Fix:** Improve the existing fallback UI at `AuthCallback.jsx:76–88` ("Google connected! You can close this tab.") so it is clearer and gives the user a button that attempts `window.close()` on user gesture (browsers allow `window.close()` triggered by a user tap even when auto-close is blocked):

```jsx
// AuthCallback.jsx — enhanced fallback UI (shown when window.close() is blocked)
if (showConnected) {
  return (
    <div ...>
      <CheckCircle icon />
      <p>"Google connected!"</p>
      <p>"You can now close this tab and return to the app."</p>
      <button onClick={() => window.close()}>Close this tab</button>
    </div>
  );
}
```

**No change to the BroadcastChannel flow** — it works correctly. Only the fallback UI needs improvement.

---

## Files to Change

| File | Platform | Change |
|------|----------|--------|
| `android/.../GoogleDriveStep.kt:57–77` | Android | Append `?source=android-linking` to CCT URL |
| `android/.../IntegrationsStep.kt` | Android | Append `?source=android-linking` if this file also opens a CCT for Google linking |
| `web/src/pages/auth/AuthCallback.jsx` | Web | Add `source === 'android-linking'` branch: redirect to `continuum://oauth-callback?linked=true` |
| `backend/config/passport.js` (or OAuth callback route) | Backend | Verify `source=android-linking` round-trips through the OAuth `state` parameter |
| Android `NavGraph` / `AndroidManifest.xml` | Android | Register `continuum://oauth-callback` deep link; handle `linked=true` to refresh profile |
| `web/src/pages/auth/AuthCallback.jsx:76–88` | Web | Improve "connected" fallback UI — add "Close this tab" button that calls `window.close()` on user gesture |

---

## Tests Needed

### Jest — Backend Unit Tests

1. **OAuth state round-trip**
   - Test: calling `GET /api/auth/google?source=android-linking` starts OAuth flow with `state` param encoding `source=android-linking`, and the callback URL contains `source=android-linking`
   - Test: calling `GET /api/auth/google?source=linking` round-trips `source=linking` correctly (regression guard — must not break existing web popup flow)

### Playwright — E2E Tests (Web)

1. **Onboarding Google link popup closes on desktop**
   - Open onboarding in desktop browser → click "Connect Google" → complete OAuth in popup → verify popup closes automatically and onboarding step advances (BroadcastChannel received by parent)

2. **Login "Continue with Google" full-page flow**
   - Click "Continue with Google" on login page → verify same tab navigates through OAuth → ends on `/dashboard` or `/onboarding` (not a stuck callback page)
   - This is a regression guard — do NOT convert this to a popup

3. **Mobile web popup fallback (manual/visual test)**
   - On mobile Chrome (emulate in Playwright with mobile viewport + UA), open onboarding → click "Connect Google" → complete OAuth → verify the fallback "Google connected" screen appears with a visible "Close this tab" button
   - This cannot be fully automated (window.close behavior is browser-controlled) but the UI should be verified

### Android — Unit / Instrumentation Tests

1. **`source=android-linking` param is appended**
   - Unit test: verify the URL constructed in `GoogleDriveStep.kt` includes `?source=android-linking`
   - Unit test: verify the URL in `IntegrationsStep.kt` (if applicable) also includes the param

2. **Deep link `continuum://oauth-callback` is registered**
   - Instrumentation test: fire a deep link Intent for `continuum://oauth-callback?linked=true` → verify the app navigates to the correct destination and calls profile refresh

3. **Profile re-check after CCT closes**
   - Given `isGoogleLinked` transitions from `false` to `true` during `ON_RESUME` → verify `onContinue()` is called (mock the profile repository returning `isGoogleLinked = true`)

---

## What NOT to Change

- `AuthContext.jsx:214–217` — `googleLogin()` full-page redirect on desktop web. **Do not convert this to a popup.**
- `AuthCallback.jsx:43–51` — existing `source=linking` popup flow for desktop web. **Working correctly, do not touch.**
- `AuthCallback.jsx:67–68` — sign-in navigation to `/dashboard` or `/onboarding`. **Working correctly.**
