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

### 4. In-App Notification Bell (PR #229)
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
- [ ] Android: notification bell in top bar; `socket.on('new_notification')` handler (follow-up PR)

### 5. FCM Push Notifications
Android only. Requires notification bell infrastructure above.
- [ ] Add Firebase to the project (`google-services.json`, Firebase SDK)
- [ ] `FCMToken` stored per user session on the backend
- [ ] Backend sends FCM message via `notification.service.js` when `notify()` fires
- [ ] Android: handle foreground + background notification payloads, tap → deep link

### 6. Notification Email Delivery
Requires notification bell infrastructure. Send on events users care about when they're not in the app.
- [ ] Configure transactional email provider (e.g. Resend or SendGrid) with `noreply@usecontinuum.dev`
- [ ] Email template for comment, friend request, and shared content notifications
- [ ] Respect `emailNotifications` user setting (already exists on the profile model)
- [ ] Unsubscribe link in every email (CAN-SPAM)

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

*Last updated: May 18, 2026*
