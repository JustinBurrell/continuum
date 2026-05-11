# BUG: Google Android — Unlink Fails, "Not Connected" Shows Blank Page, No Clear Button

**Affects:** Android (primary) + Backend (secondary — HTML error page)
**Web:** Already handles the "not connected" state correctly — no changes needed there except where noted

---

## Summary of Issues

1. Google unlink does not work properly on Android
2. When not Google-connected, tapping "Import from Drive" shows a blank/unstyled HTML page in a Chrome Custom Tab (CCT)
3. No way to clear a pasted Google Doc link on the import screen

---

## Issue 1: Google Unlink Broken on Android

**Platform:** Android + Backend  
**Files:**
- `android/.../ProfileScreen.kt:289–295` — "Unlink Google" button, calls `viewModel.unlinkGoogle()`
- `android/.../ProfileViewModel.kt` — `unlinkGoogle()` implementation (verify this exists and is correct)
- `backend/controllers/auth.controller.js:476–509` — `DELETE /api/auth/me/google/link`

**Root cause (suspected):** The backend unlink endpoint returns `400` if the user has no password set (Google-only accounts cannot unlink without first setting a password — it would lock them out). The Android implementation likely silently ignores this error, or `ProfileViewModel.unlinkGoogle()` is not wired up correctly.

Backend validation at `auth.controller.js:485`:
```javascript
if (!user.password) {
  return res.status(400).json({ error: 'Set a password before unlinking Google' });
}
```

**Fix:**

**Android:**
1. In `ProfileViewModel.kt`, verify `unlinkGoogle()` calls `DELETE /api/auth/me/google/link` with body `{ keepNotes: true }`
2. Capture the error response. If the backend returns 400 with `"Set a password before unlinking Google"`, surface a `Snackbar` or `AlertDialog` with that message and a "Set Password" action that navigates to the change-password screen
3. Add a `unlinkError: String?` field to the profile UI state and observe it in `ProfileScreen.kt` to show the error

**Web (reference — already works):**
- `web/src/pages/Profile.jsx:1232–1249` — calls `DELETE /auth/me/google/link`, shows error toast on failure
- No changes needed

---

## Issue 2: "Not Connected" Shows a Blank HTML Page in CCT

**Platform:** Android (primary) + Backend (defense-in-depth)  
**Files:**
- `android/.../GoogleDriveImportScreen.kt:131–145` — "Choose from Google Drive" button launches CCT without checking connection state
- `android/.../NotesViewModel.kt` — source of truth for profile/drive state
- `backend/controllers/google.controller.js:142–260` — picker page endpoint; returns `res.status(403).send('<p>Google account not linked</p>')` when not connected — bare HTML

**Root cause:** `GoogleDriveImportScreen.kt` opens the CCT unconditionally. If the user's Google account is not linked, the backend returns a bare `<p>` tag with no styling. The CCT renders it as a white page with plain text — unacceptable UX.

**Web (working reference):** `web/src/pages/notes/NotesList.jsx:507–519` checks `user?.googleId` before showing the picker. If not connected, shows a styled in-modal message: "Connect your Google account to import documents from Drive." with a link to Profile. No CCT is opened.

**Fix:**

**Android — pre-flight check (primary fix):**
1. Expose `isGoogleLinked: Boolean` from the user's profile in `NotesViewModel` (read from the cached profile or a dedicated `ProfileRepository` call)
2. In `GoogleDriveImportScreen.kt`, replace the unconditional CCT launch with a conditional:
   ```kotlin
   if (!isGoogleLinked) {
       // Show in-app "not connected" UI — do NOT open CCT
   } else {
       // Existing CCT launch
       val url = "${BuildConfig.BASE_URL}google/picker-page-cct?token=$token"
       CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))
   }
   ```
3. The "not connected" UI should be a `Surface` card (matching app visual language) displayed inline on the screen, containing:
   - Heading: "Google Drive"
   - Body: "Connect your Google account to import documents from Drive."
   - Button (primary): "Go to Profile to connect" — navigates to Profile > Integrations tab
   - This matches the web modal copy exactly (see `NotesList.jsx:507–519`)

**Backend — defense-in-depth (secondary fix):**
- File: `backend/controllers/google.controller.js:203–207`
- Update the 403 HTML response from `<p>Google account not linked</p>` to a properly styled page:
  - Purple brand color (`#6B21A8`), centered card, readable message
  - A "Return to app" button that links to `continuum://` (deep link to close the CCT)
  - This covers the edge case where the CCT is opened despite the Android pre-flight check failing

---

## Issue 3: No Way to Clear a Pasted Google Doc Link

**Platform:** Android only  
**File:** `android/.../GoogleDriveImportScreen.kt:157–172` — the `OutlinedTextField` for the Google Doc URL

**Root cause:** The text field has no clear/delete button. Users must backspace through the entire URL manually.

**Web:** Not applicable — standard browser input fields support select-all + delete natively. No change needed.

**Fix:**

**Android:**
Add a `trailingIcon` to the `OutlinedTextField` that shows an `IconButton` with `Icons.Default.Clear` only when the field is non-empty:

```kotlin
OutlinedTextField(
    value = docUrl,
    onValueChange = { docUrl = it },
    label = { Text("Google Doc link") },
    trailingIcon = {
        if (docUrl.isNotBlank()) {
            IconButton(onClick = { docUrl = "" }) {
                Icon(Icons.Default.Clear, contentDescription = "Clear")
            }
        }
    },
    // ... rest of existing params
)
```

---

## Files to Change

| File | Platform | Change |
|------|----------|--------|
| `android/.../ProfileViewModel.kt` | Android | Verify/fix `unlinkGoogle()` — handle 400 error and expose error state |
| `android/.../ProfileScreen.kt` | Android | Observe `unlinkError` state, show Snackbar/dialog with error message |
| `android/.../NotesViewModel.kt` | Android | Expose `isGoogleLinked` from profile state |
| `android/.../GoogleDriveImportScreen.kt:131–145` | Android | Add pre-flight `isGoogleLinked` check before opening CCT |
| `android/.../GoogleDriveImportScreen.kt:157–172` | Android | Add `trailingIcon` clear button to URL text field |
| `backend/controllers/google.controller.js:203–207` | Backend | Replace bare `<p>` error response with styled HTML + `continuum://` deep link |

---

## Tests Needed

### Jest — Backend Unit Tests

1. **Unlink endpoint — password guard**
   - Test: `DELETE /api/auth/me/google/link` with a Google-only account (no password) returns 400 with `{ error: 'Set a password before unlinking Google' }`
   - Test: `DELETE /api/auth/me/google/link` with a valid account (has password + Google linked) returns 200 and clears `googleId`, `googleAccessToken`, `googleRefreshToken`
   - Test: `DELETE /api/auth/me/google/link` when Google is not linked returns 400

2. **Picker page error response**
   - Test: `GET /api/google/picker-page-cct` for a user without Google linked returns 403 with HTML containing `continuum://` deep link (not bare `<p>` tag)

### Playwright — E2E Tests (Web)

**Note:** Web handles the "not connected" state correctly — these tests verify it stays correct after backend changes.

1. **Import modal "not connected" state**
   - Sign in as a user without Google linked → open Notes → click Import → verify the modal shows "Connect your Google account" message and a link to Profile (not a broken state)

2. **Google unlink (web, working reference)**
   - Sign in as a user with Google linked + a password set → Profile > Integrations → click Unlink → confirm → verify `googleId` is removed and the Connect button is shown again
   - Sign in as a Google-only user (no password) → Profile > Integrations → click Unlink → verify an error message appears ("Set a password before unlinking")

### Android — Unit Tests

1. **`unlinkGoogle()` error handling**
   - Mock `ProfileRepository.unlinkGoogle()` returning a 400 error with body `{ error: "Set a password before unlinking Google" }` → verify `ProfileUiState.unlinkError` is set to that message

2. **`isGoogleLinked` pre-flight in `NotesViewModel`**
   - Given profile state with `isGoogleLinked = false`, verify `GoogleDriveImportScreen` shows the "not connected" in-app card (no CCT launch)
   - Given profile state with `isGoogleLinked = true`, verify the "Choose from Google Drive" button is active

3. **Clear button on `docUrl` field**
   - Compose UI test: set `docUrl` to a non-empty value → verify trailing Clear icon is visible; tap it → verify `docUrl` is empty and icon disappears
