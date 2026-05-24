# Implementation Order — Pitch, Launch & Google Play

**Pitch (TEI):** April 29, 2026 ✅ Delivered  
**Public Web Launch:** May 6, 2026 ✅ Shipped  
**Google Play Launch:** Target — TEA program (Technical Entrepreneurship Accelerator, sequel to TEI with Google Play + All Star Code). Start date TBD; ship everything below before it begins.  
**Current date:** May 18, 2026

---

## Shipped

### 1. Authenticated App Pages Redesign ✅
Full visual redesign of all 13 authenticated routes. Lavender/pastel colors removed, Fraunces typography applied to all page headings, semantic badge/status color system unified. PR #195.

### 2. Google Drive Scope Migration ✅
- Scopes narrowed to `drive.file` in `passport.js` and `auth.routes.js`
- `GET /api/google/files` removed from production
- Google Picker integrated on web and Android (CCT + URL paste fallback)
- `googleDocUrl` persistence and "View in Google Docs" on note detail
- Android: Chrome CustomTab for docs, DownloadManager for PDFs
- Privacy policy, landing, and product page copy updated

### 3. Observability ✅
PostHog (production-only), Sentry session linking, Vercel Speed Insights + Analytics, activation funnel events, Sentry user context wired across web and backend.

### 4. Onboarding ✅
Full goal-personalized onboarding on web (dedicated `/onboarding` route) and Android (full-screen flow). Profile setup steps: welcome, goal, integrations, name, photo/bio. Activation step with goal-personalized first action and first-run coach mark. "Show me everything" goal opens the full 11-step feature tour. Replay tour available from Profile on both platforms. Demo and seed accounts bypass all onboarding.

### 5. Sessions / Logout Others ✅
`GET /api/auth/sessions` lists active sessions with device label, IP location, and `isCurrent` flag. `DELETE /api/auth/sessions/:id` revokes individual sessions. `POST /api/auth/logout-all` immediately invalidates all sessions via `tokenVersion` increment + Redis blocklist. Profile security tab exposes all three actions.

### 6. Brand Asset Refresh ✅
Full brand identity applied across web and Android. PR #219.
- **Web:** favicon replaced with app icon PNG (white background for Arc/colored-tab browsers), apple-touch-icon updated, Sidebar/MarketingNav/MarketingFooter switched to logo lockup
- **Android launcher icon:** new brand icon at all adaptive-icon densities (foreground PNGs in safe zone) and mipmap WebP fallbacks; white background so Android squircle mask clips cleanly
- **Android splash screen:** app icon at all densities with CC marks explicitly filled white; `setKeepOnScreenCondition` holds splash while `MainViewModel` pre-fetches the user profile so dashboard greeting and stats are populated on first frame; single-use splash cache consumed by `DashboardViewModel` with no stale-data risk
- **Android auth screens:** logo lockup via Coil3 SVG; Google sign-in on Login and Register with official Google G icon and error surfacing
- **Role badges:** Founder and Team Continuum badges shown in comment threads and activity feed

---

## Pre-Google Play Launch (Code Complete First)

Get the app feature-complete and polished before TEA starts. Play Store listing and signing happen with TEA — focus here is purely on code.

### 1. Mobile & Tablet Marketing Gate ✅

Intercepts all routes at viewports below 1024px (mobile + tablet) and renders a dedicated marketing page instead of the full app.
- [x] `useMobile` hook + `isMobile` branch in `App.jsx` routes all sub-1024px traffic to `MobileGate`
- [x] Hero section with custom CSS Pixel 9 frame showing real Android dashboard screenshot
- [x] Feature carousel (6 cards, scroll-snap) with real Android screenshots per feature — status bar clipped, rounded corners, gradient breathing room
- [x] Waitlist form: platform interest (iOS / Android / Both), first name, email; `noValidate` + client + server validation; 409 duplicate guard
- [x] PostHog events: `mobile_landing_viewed`, `mobile_waitlist_form_started`, `mobile_waitlist_submitted`
- [x] Resend welcome email with platform-personalized copy (non-blocking, fires after 201)
- [x] `MobilePrivacyPage` and `MobileTermsPage` — legal pages accessible on mobile without hitting the gate
- [x] 65-test Playwright E2E suite covering gate rendering, form states, legal pages, and viewport breakpoints

### 2. Android Polish Audit ✅
Full audit of the Android app against Google Play standards. All Critical → High → Medium issues resolved.

### 3. Deep Links ✅
Shared notes, user profiles (friend requests), and tasks open in the app from iMessage/Slack/browser.
- [x] Android App Links: `web/public/.well-known/assetlinks.json` deployed to `usecontinuum.dev`
- [x] `AndroidManifest.xml`: `https://usecontinuum.dev/share/` App Links intent-filter with `autoVerify`
- [x] `AppNavHost.kt`: `navDeepLink` wired to `SharedNoteViewScreen`, `UserProfileScreen`, `TaskDetailScreen`
- [x] `UserProfileScreen` cold-start crash fix (`runCatching` on `getBackStackEntry`)
- [x] Backend: `GET /share/note/:id`, `/share/user/:id`, `/share/task/:id` — HTML with Open Graph meta tags
- [x] `web/vercel.json`: `/share/*` proxied to backend for OG rendering
- [x] iOS: `apple-app-site-association` deployed; Associated Domains entitlement documented in iOS build guide
- [x] 13 backend Jest tests for share routes
- [x] Debug SHA-256 fingerprint added to `web/public/.well-known/assetlinks.json` (debug builds only)
- [ ] **⚠️ TODO (before Play Store release):** Add release fingerprint to `web/public/.well-known/assetlinks.json`. Two options — pick one:
  - **Option A — Play App Signing (recommended):** Enroll in Google Play Console → Setup → App Integrity → Play App Signing. Google manages the release key. Copy the SHA-256 fingerprint shown there and add it as a second entry in the `sha256_cert_fingerprints` array alongside the debug fingerprint.
  - **Option B — Self-managed keystore:** Generate a release keystore (`keytool -genkey ...`), run `keytool -list -v -keystore release.keystore` to get the SHA-256, and add it to the array. Store the keystore file securely outside the repo.
- [ ] **⚠️ You must do:** Test on Android emulator via `adb shell am start` (see PR description for commands)
- [ ] Test OG preview by pasting a share URL into Slack

### 4. In-App Notification Bell (PR #229, PR #231) ✅
Foundation for everything below.
- [x] `Notification` model + `notification.service.js` with `notify()` dispatcher and debounce
- [x] Wire into `comments.controller.js`, `friends.controller.js`, `conversations.controller.js`, `notes.controller.js`, `flashcardSets.controller.js`, `tasks.controller.js`
- [x] `GET /api/notifications` (cursor pagination), `PATCH /api/notifications/read`, `PATCH /api/notifications/:id/read`, `DELETE /api/notifications/:id`
- [x] Emit `new_notification` Socket.io event after every `Notification.create()`
- [x] Web: notification bell in sidebar header and marketing nav with unread badge and dropdown
- [x] Web: `/notifications` history page with Today / This week / This month / Earlier grouping and infinite scroll
- [x] 8 notification types: `new_message`, `share_received`, `task_assigned`, `comment_added`, `comment_reply`, `like_added`, `friend_request`, `friend_accepted`
- [x] PostHog events: bell open, item click, mark all read (bell + page), see all, dismiss, page view
- [x] Seed notifications for Jane and Justin across all time groups
- [x] Backend Jest suite + Vitest component and hook tests
- [x] Android: bell icon (custom badge, purple dot unread indicator) in Dashboard top bar; `socket.on('new_notification')` live badge updates; `NotificationsScreen` with time grouping, cursor pagination, swipe-to-delete, mark all read, actor name + photo + role badges, comment preview, message preview, scroll-to-comment (PR #231)
- [x] Android: `NotificationBell` component in `core/ui/components`; `NotificationsViewModel` + `NotificationsRepository` with MockK unit tests; `ResolveNavTest` covering all 8 types
- [x] Android: `like_added` and `comment_reply` correctly resolve resource via `metadata.resourceId/resourceType`; `commentId` passed through nav route for scroll-to
- [x] Android: `GET /api/users/:id` now returns `notesCount` and `setsCount` — UserProfileScreen no longer shows 0 stats
- [x] Android: Dashboard badge refreshes on `ON_RESUME` lifecycle event so marking all read and returning clears the badge
- [x] `metadata.messagePreview` added to `new_message` notifications (backend + seed) — shown on both web and Android
- [x] `metadata.commentId` added to `like_added` notifications (backend + seed) — enables scroll-to-comment on both platforms

### 4a. Notification & Activity Audit ✅
Pre-FCM correctness audit ensuring every notification type and activity event is accurate, actionable, and consistent across web and Android. Required before FCM and email so the message text and routing are correct from day one on all delivery channels.

**What was audited and verified:**
- Every notification type navigates to the exact correct resource with back-stack preserved to NotificationsScreen
- `comment_added` and `comment_reply` scroll to the specific comment on NoteDetail and FlashcardSetDetail
- `like_added` now scrolls to the liked comment (via `metadata.commentId`)
- Actor name, profile photo, and role badges shown on every notification row (web + Android)
- `messagePreview` shown in italic for `new_message` on both platforms
- `commentPreview` shown in italic for comment and like notifications on both platforms
- ActivityFeed: `flashcard_shared`, `task_created`, `friend_accepted` now navigate correctly with back button (was no-op before)
- ActivityFeed timestamps use smart format ("10:30 AM" / "May 5") instead of raw date string

**Known issue resolved in NOTIF-3 (4b):**
- `like_added` message now reads "Alex Chen liked a comment on your note" — full name, correct context. Bug spec deleted.

### 4b. Notification & Activity Audit Fix (NOTIF-3) ✅
Fixed `like_added` message copy and completed the full notification correctness pass.
- [x] `like_added` message updated: "X liked a comment on your note/flashcard set/task"
- [x] All `notify()` calls across all controllers updated to use full name (firstName + lastName)
- [x] `comment_added` message now says "flashcard set" instead of "flashcardSet" when targetType is flashcardSet
- [x] Actor name rendered as inline clickable link in notification items (web + Android) — name and action text flow as one paragraph
- [x] Web + Android name-stripping logic falls back to firstName when message uses only firstName
- [x] Re-ran both seed scripts `--clean --no-ai`; verified correct text in browser via Playwright

### 4c. Notification & Activity Completeness ✅
Full coverage of all notification types and activity events across web, Android, backend, and seed data.
- [x] `task_completed` activity type added to Activity model, fires from `tasks.controller.js → updateStatus` when status transitions to `'completed'`
- [x] Web `ActivityFeedItem.jsx` and Android `Social.kt` + `ActivityFeedScreen.kt` handle `task_completed`
- [x] `mention` notification type added to Notification model; `addComment` detects `@username` patterns, looks up users, fires `mention` notifications (skips self + content owner already notified via `comment_added`)
- [x] `mention` routing added to `resolveNav()` on web and Android — navigates to the parent resource with `commentId` for scroll-to
- [x] All 8 notification types + `task_completed` + `mention` seeded for Justin and Jane
- [x] Real `@username` comment documents created in seed for mention notifications (Marcus → Justin, Logan → Jane)
- [x] Em dashes removed from all seed data files (seed-justin.js, seed-jane.js, seed-justin-data.js)
- [x] 4 new notification tests (mention detection, no-self, no-duplicate-owner, full-name); all 25 pass

### 4d. @Mention UX — Autocomplete + Clickable Rendering ✅
Instagram-style @mention experience in comment threads.
- [x] Backend `users/search` expanded to match firstName and lastName in addition to username and email
- [x] `friendsOnly=true` query param restricts search to accepted friends; empty `q` with `friendsOnly=true` returns all friends instantly (shown immediately on `@`)
- [x] `exactUsername` query param for exact-match lookup, bypasses all filters (used for @mention click navigation)
- [x] Web `CommentThread.jsx`: typing `@` opens a live dropdown (name or username match); selecting inserts `@username`; `@username` in rendered comments is a clickable purple link that navigates to the user's profile
- [x] Android `CommentThread.kt`: `@username` in rendered comments styled purple/bold and tappable via `ClickableText`; typing `@` shows a suggestion list; all four caller screens wired with `onSearchUsers` / `onLookupUsername` from `SocialViewModel`
- [x] Seed reply comments prepend `@username` for realistic mention data; 20 users tests + 26 notification tests passing

### 4e. Reply UX — Auto-focus + Prefill ✅
Tapping Reply behaves like Instagram: input focuses immediately and keyboard appears without manual scrolling.
- [x] `authorUsername` added to `Comment` domain model and mapped from API `userSnapshot`
- [x] Tapping Reply prefills the input with `@username ` and shows "Replying to @username" banner
- [x] `FocusRequester` + `BringIntoViewRequester` auto-focus the input and scroll it into view when Reply is tapped — no manual scrolling required
- [x] Cancel clears the prefilled input and dismisses the banner
- [x] `CommentThreadTest` (Compose UI, androidTest): 7 tests covering prefill, banner with/without username, cancel, send with parentId, auto-focus, and default state

### Bug Fix: Google OAuth CCT Doesn't Close After Login ✅
Android CCT and web mobile popup stay open after completing Google OAuth. Spec: `docs/bugs/google_oauth_pop_up_bug.md`. PR #233.
- [x] Android `GoogleDriveStep.kt` + `IntegrationsStep.kt`: append `?source=android-linking` to CCT URL; `GoogleDriveStep` swaps unreliable 1-second delay for `LifecycleEventEffect(ON_RESUME)`
- [x] Web `AuthCallback.jsx`: add `source === 'android-linking'` branch — redirect to `continuum://oauth-callback?linked=true` (before the existing `source === 'linking'` check)
- [x] Backend `auth.routes.js` + `auth.controller.js`: `source=android-linking` round-trips through `oauth_source` cookie the same way `linking` does
- [x] Android `AndroidManifest.xml`: register `continuum://oauth-callback` intent filter; `AppNavHost.kt` registers `OAUTH_CALLBACK` route + deep link composable that pops back to the onboarding step
- [x] Web `AuthCallback.jsx:76–88`: "Close this tab" button (user-gesture `window.close()`) + improved copy; `IntegrationsStep.jsx` adds `visibilitychange` listener so original tab refreshes when user returns from a stuck popup
- [x] Tests: Jest OAuth state round-trip (9 tests in `oauth-state.test.js`), Playwright (login regression, fallback UI on desktop + mobile), Android unit (`GoogleOAuthUrlTest`)

### Bug Fix: Google Android Drive & Unlink Issues ✅
Three Android-only issues with the Google Drive integration. PR: fix/OAUTH-2-android-google-drive-unlink-and-cct.
- [x] Android `ProfileViewModel.kt`: `unlinkGoogle()` now uses `friendlyError()` to parse the HTTP 400 body; exposes `unlinkError: String?` in `ProfileUiState`; `ProfileScreen.kt` shows an `AlertDialog` with "Set Password" action that opens the existing `ChangePasswordDialog`
- [x] Android `GoogleDriveImportScreen.kt`: `isGoogleLinked` pre-flight check — shows an in-app Surface card ("Connect your Google account to import documents from Drive." + "Go to Profile to connect") instead of opening CCT when not linked; `isGoogleLinked` exposed in `DriveFilesUiState` via `ProfileRepository` injected into `NotesViewModel`; `onNavigateToProfile` wired in `AppNavHost.kt`
- [x] Android `GoogleDriveImportScreen.kt`: trailing `Clear` `IconButton` on the URL `OutlinedTextField` — visible only when field is non-empty, clears on tap
- [x] Backend `google.controller.js`: replaced both bare `<p>Google account not linked</p>` 403 responses with a styled HTML page (purple brand card) including a `continuum://` deep link button
- [x] Tests: Jest — `DELETE /api/auth/me/google/link` (no Google linked → 400, Google-only account → 400 with password guard message, valid unlink → 200 + googleId cleared); `GET /api/google/picker-page-cct` without googleId → 403 HTML with `continuum://`; all 47 tests pass

### Bug Fix: Active Sessions Accuracy & UX ✅
Sessions list had wrong device labels, stale entries, and UX gaps vs. Instagram/GitHub standard. PR #235.
- [x] Backend `auth.controller.js`: replaced custom `parseDeviceLabel()` with `ua-parser-js` + `Sec-CH-UA-Platform` Client Hints — iPad now correctly identified instead of showing as macOS
- [x] Backend (login/register/googleExchange): revoke same-`deviceId` non-revoked tokens before creating a new one — eliminates duplicate sessions on re-login
- [x] Backend sessions endpoint: sort response so `isCurrent` session is always first
- [x] Web `Profile.jsx`: fix `doLogoutAll` to call `logout()` (clears `AuthContext.user`) before `navigate('/login')` — no longer bounces back to dashboard
- [x] Web `Profile.jsx`: device-type icon (Smartphone/Tablet/Monitor) inferred from `deviceId`; absolute datetime as `title` tooltip on "Last active"
- [x] Android `ProfileViewModel.kt`: sessions sorted `sortedByDescending { it.isCurrent }` before UI state update
- [x] Android `ProfileScreen.kt` `SessionRow`: leading device-type icon; subtitle split into "Last active Xh ago · City" line
- [x] Tests: Jest (iPad UA + Client Hints, iPhone/Android/Windows labels, deduplication same/different device, expired token exclusion, current-first ordering, logout-all revocation); Playwright `sessions.spec.ts` (badge visible, sign-out-all → `/login`, re-login dedup)

### 5. FCM Push Notifications ✅
Android only. Requires notification bell infrastructure above.
- [x] Add Firebase to the project (`google-services.json`, Firebase SDK)
- [x] `fcmTokens` array stored per user (up to 5 devices) with session-FCM linkage (logout prunes token)
- [x] Backend sends FCM message via `sendPush()` in `notification.service.js` when `notify()` fires
- [x] Per-type push notification toggles (messages, comments, likes, friendRequests, tasks, sharedContent) — Instagram model, iOS-ready
- [x] Enriched notification body with message/comment preview (e.g. "Alex Chen: Hey, free to study?")
- [x] Android: tap-to-navigate — opens exact resource with scroll-to-comment for comment types
- [x] Android: quick reply from DM notification tray without opening the app
- [x] Web: per-type push toggles in Profile settings (mirrors Android settings screen)

### 6. Notification Email Delivery ✅
Requires notification bell infrastructure. Send on events users care about when they're not in the app.
- [x] Configure transactional email provider (e.g. Resend or SendGrid) with `noreply@usecontinuum.dev`
- [x] Email template for comment, friend request, and shared content notifications
- [x] Respect `emailNotifications` user setting (already exists on the profile model)
- [x] Unsubscribe link in every email (CAN-SPAM)

### 7. Accessibility Audit
Play Store IARC questionnaire surfaces a11y failures, and it fits the All Star Code / TEA profile.
- [ ] Lighthouse + axe scan on all public and app routes (web)
- [ ] Fix contrast, keyboard nav, focus indicators, aria-label, modal focus trap, alt text
- [ ] Android: content descriptions on all icon-only buttons and images
- [ ] `Accessibility.jsx` page at `/accessibility` + footer link

### 8. Email Inbound Routing
Quick win — needed before real support traffic comes in.
- [ ] Confirm `usecontinuum.dev` is 30+ days old
- [ ] ImprovMX MX records + forwarding rules for `hello@`, `support@`, `noreply@`

---

## Do With TEA

### Android Release Build & Signing
- [ ] Generate a production release keystore and store it securely (not in repo)
- [ ] Configure `signingConfigs` in `build.gradle.kts` for release
- [ ] Build a signed AAB (`./gradlew bundleRelease`)
- [ ] Verify `minSdk`, `targetSdk`, and `versionCode`/`versionName` are set correctly
- [ ] Test the release build on a physical device before upload

### Google Play Store Listing
- [ ] Create Google Play Developer account (one-time $25 fee)
- [ ] App title, short description (80 chars), full description
- [ ] Feature graphic (1024×500 px) — use brand assets
- [ ] At least 2 phone screenshots per required screen size
- [ ] Content rating questionnaire (IARC)
- [ ] Privacy policy URL live and linked in the listing
- [ ] Target audience and content settings
- [ ] Release track: Internal Testing → Closed Testing → Production

---

*Last updated: May 22, 2026 — Active Sessions bug fix complete (PR #235)*
