# Implementation Order — Pitch & Launch

**Pitch:** April 29, 2026 ✅ Delivered  
**Public Web Launch:** May 6, 2026 ✅ Shipped  
**Current date:** May 10, 2026

---

## Shipped (Pre-Pitch + Launch)

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

---

## Post-Launch Backlog

### In-App Notification Bell
Stop at the in-app bell + Socket.io delivery. Skip email and FCM for now.

- [ ] `Notification` model + `notification.service.js` with `notify()` dispatcher
- [ ] Wire into `comments.controller.js`, `friends.controller.js`, `share.service.js`
- [ ] `GET /api/notifications`, `PATCH /api/notifications/read`, `DELETE /api/notifications/:id`
- [ ] Emit `new_notification` Socket.io event
- [ ] Notification bell in sidebar with unread badge and dropdown
- [ ] `socket.on('new_notification')` in `AuthContext.jsx`

### Deep Links
- [ ] Audit all externally linkable routes
- [ ] Open Graph meta tags on public pages for link previews
- [ ] Android: wire `MainActivity` intent → `NavController` for message, friend request, shared note, task deep links
- [ ] Test in iMessage, Slack, and browser

### Accessibility Audit
- [ ] Lighthouse + axe on all public and app routes
- [ ] Fix contrast, keyboard nav, focus, aria-label, modal focus trap, alt text violations
- [ ] `Accessibility.jsx` at `/accessibility` + footer link

### Email Inbound Routing
- [ ] Confirm `usecontinuum.dev` is 30+ days old
- [ ] ImprovMX MX records + forwarding rules for `hello@`, `support@`, `noreply@`

---

## Long-Term

| Feature | Notes |
|---|---|
| iOS App | Full SwiftUI port — 6 phases, 9 feature modules |
| Notification email delivery | Complete after real users on platform |
| FCM push notifications | Android only, after notification bell ships |
| Forum | Existing social primitives cover the pitch story for now |

---

*Last updated: May 10, 2026*
