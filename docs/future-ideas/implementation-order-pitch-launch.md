# Implementation Order — Pitch & Launch

**Pitch:** April 29, 2026  
**Public Web Launch:** ~May 6, 2026

---

## Pre-Pitch (now → April 29)

### 1. Google Drive Scope Migration
**Spec:** `google-drive-file-scope-migration-spec.md`

This is the only blocker. Google flagged `drive.readonly` scope and is waiting on a response. If this isn't fixed before launch, Google can pull the OAuth app. The spec is fully written — swap to `drive.file`, integrate Google Picker in the import modal, update legal copy, then reply to Google confirming narrower scopes.

- [ ] Swap OAuth scope to `drive.file` in `passport.js` and `auth.routes.js`
- [ ] Remove/deprecate `GET /api/google/files` from production flow
- [ ] Integrate Google Picker in the notes import modal
- [ ] Ensure `googleDocUrl` persistence and "View in Google Docs" action in note view
- [ ] Update privacy policy, landing page, and product page copy
- [ ] Run full web + backend QA (import, refresh, download, open-in-docs)
- [ ] Reply to Google with "Confirming narrower scopes"

### 2. Observability
**Spec:** `observability.md`

Goes in before the pitch so every crash that follows is visible. At minimum: the Sentry `ErrorBoundary` fallback (the current bare `<p>Something went wrong</p>` is a bad look in a pitch demo), PostHog init + identity wiring, and the activation funnel events. Skip building dashboards for now — just get data flowing.

- [ ] Install `posthog-js` (web) and `posthog-node` (backend)
- [ ] Create `web/src/lib/posthog.js` and import it first in `main.jsx`
- [ ] Create `backend/lib/posthog.js`
- [ ] Wire `posthog.identify()` in `AuthContext.jsx` on login and `posthog.reset()` on logout
- [ ] Replace bare `ErrorBoundary` fallback in `main.jsx` with actionable UI
- [ ] Update Sentry `beforeSend` to link PostHog session replay URL
- [ ] Add activation funnel events (`user_registered`, `note_created`, `flashcard_set_generated`, `study_session_completed`)
- [ ] Set Sentry user context in `auth.middleware.js`
- [ ] `npm install @vercel/speed-insights @vercel/analytics` in `web/`
- [ ] Add `<SpeedInsights />` and `<Analytics />` components to the React tree in `main.jsx`

### 3. Onboarding Modal
**Spec:** `onboarding-new-user-process.md`

Critical for the pitch. Any recruiter or judge handed the app will be a new user. Without onboarding they bounce before finding the value. The spec is fully designed — the backend is a single new field (`onboardingCompleted`) and one endpoint. Focus on the feature tour first; profile setup steps are secondary.

- [ ] Add `onboardingCompleted: Boolean` to `User` schema (default `false`)
- [ ] Run one-time migration to set `onboardingCompleted: true` for all existing users
- [ ] Add `POST /api/auth/me/onboarding/complete` endpoint
- [ ] Build `OnboardingModal.jsx` shell with progress dots and step routing
- [ ] Build `useOnboarding.js` hook and `tourConfig.js` (11 tour steps)
- [ ] Build profile setup steps: `EmailVerificationStep`, `ConnectGoogleStep`, `ProfileSetupStep`, `UsernameConfirmStep`
- [ ] Mount modal in `AppLayout.jsx`
- [ ] Add "Finish setup" resume path on Profile page

### 4. Logout Others
**Spec:** `logout-others-spec.md`

Low effort, high signal. The backend is essentially copy-paste from the spec, the frontend is one extra button on the Profile security tab. It's a security story that sounds sophisticated in a pitch. Ship it while onboarding is being polished.

- [ ] Add `exports.logoutOthers` to `auth.controller.js`
- [ ] Register `POST /api/auth/logout-others` route with Swagger JSDoc in `auth.routes.js`
- [ ] Add 3 Jest tests to `auth.test.js`
- [ ] Replace single "Sign out all" button in `Profile.jsx` with two-button UI + confirm modals
- [ ] Update `docs/backend/api_reference_guide.md`

---

## Pre-Public Launch (April 29 → May 6)

### 5. In-App Notification Bell (partial)
**Spec:** `notifications-spec.md`

Stop at the in-app bell + Socket.io delivery. That means: `Notification` model, `notification.service.js`, wire into comments/friends/share, bell component with unread badge + dropdown. Skip email delivery and FCM entirely for now — those are steps 5–7 in the spec's implementation order.

- [ ] Create `backend/models/Notification.js` schema
- [ ] Create `backend/services/notification.service.js` with `notify()` dispatcher
- [ ] Wire `notify()` into `comments.controller.js`, `friends.controller.js`, and `share.service.js`
- [ ] Add `GET /api/notifications`, `PATCH /api/notifications/read`, `PATCH /api/notifications/:id/read`, `DELETE /api/notifications/:id` endpoints
- [ ] Emit `new_notification` Socket.io event from `notification.service.js`
- [ ] Build notification bell component in sidebar with unread badge + dropdown
- [ ] Register `socket.on('new_notification')` handler in `AuthContext.jsx`

### 6. Deep Links
**Spec:** `fcm-push-notifications.md` (deep link strategy section)

Deep links are needed before public launch so that notification taps, shared links, and any external entry points land on the correct screen instead of the dashboard root. Covers both web (URL routing) and Android (intent handling via `MainActivity`).

- [ ] Audit all routes that can be linked to externally (note, flashcard set, task, conversation, friend profile, application)
- [ ] Ensure direct URL navigation works for all protected routes (no blank screens on hard refresh)
- [ ] Add Open Graph meta tags to public-facing pages (landing, product, about) for link previews
- [ ] Android: wire `MainActivity` to read incoming `Intent` data payload and navigate via `NavController` to the correct screen
- [ ] Android: handle deep link entry points for: message → `ConversationDetail`, friend request → `FriendsList` (Pending tab), shared note → `SharedNoteView`, task → `TaskDetail`
- [ ] Test link previews in iMessage, Slack, and browser

### 7. Accessibility Audit + Statement Page
**Spec:** `accessibility.md`

Before going public, run Lighthouse and axe on every route, fix contrast/label/focus violations, and add the Accessibility Statement page to the footer. One day of work that makes the launch credible and avoids embarrassment with disabled users.

- [ ] Run Lighthouse + axe DevTools on all public routes (`/`, `/product`, `/about`, `/privacy`, `/terms`)
- [ ] Run Lighthouse + axe on all app routes (`/dashboard`, `/notes`, `/tasks`, `/calendar`, `/flashcards`, `/friends`, `/messages`, `/applications`, `/resumes`, `/activity`, `/profile`)
- [ ] Fix all reported violations (contrast, keyboard nav, focus indicators, aria-labels, modal focus trap, alt text, live regions)
- [ ] Create `web/src/pages/legal/Accessibility.jsx` at `/accessibility`
- [ ] Add Accessibility link to `MarketingFooter.jsx` Legal column and bottom bar
- [ ] Add route and title in router + `TitleManager.jsx`

### 8. Email Inbound Routing
**Spec:** `email-inbound-routing.md`

Check if `usecontinuum.dev` is past 30 days old. If yes, add the ImprovMX MX records and create forwarding rules for `hello@` and `support@`. Twenty-minute task that makes the contact addresses on the landing page actually work when people hit it after launch.

- [ ] Confirm domain is 30+ days old (check registrar)
- [ ] Sign up for ImprovMX and add `usecontinuum.dev`
- [ ] Add ImprovMX MX records in Vercel DNS
- [ ] Create forwarding rules: `hello@` → personal email, `support@` → personal email, `noreply@` → personal email
- [ ] Send a test email to each address to verify delivery

---

## Post-Launch

| Feature | Spec | Notes |
|---|---|---|
| Notification email delivery | `notifications-spec.md` | Complete steps 5–8 once real users are on the platform |
| FCM push notifications | `fcm-push-notifications.md` | Only relevant once Android ships |
| Forum | `forum.md` | Too large to touch before launch; existing social primitives cover the pitch story |

---

*Last Updated: April 15, 2026*
