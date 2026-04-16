# Observability & Analytics Spec

## Status

**Draft — not yet implemented.**

Android is not in scope. Mobile development is in progress but has no codebase. This spec covers web (React) and backend (Express) only. When Android ships, the entire spec must be reaudited to include: push notification events, offline sync events, deep link attribution, and mobile-specific study session patterns. All event names and property shapes in this spec are intentionally platform-agnostic so Android can implement them without renaming anything.

---

## 1. Overview

Four tools, distinct responsibilities:

| Tool | Purpose |
|---|---|
| **PostHog** | User behavior, product analytics, activation funnels, retention signals, session replay |
| **Sentry** | Error tracking, performance monitoring, unhandled exception alerts |
| **Vercel Speed Insights** | Real User Monitoring (RUM) — Core Web Vitals (LCP, FID, CLS, TTFB) per route in production |
| **Vercel Analytics** | Page view tracking, visitor counts, referrer data — privacy-friendly, no cookies |

All four serve different jobs. PostHog and Sentry require instrumentation. Vercel Speed Insights and Analytics are drop-in — one component each, no configuration needed beyond adding the packages. Where possible, Sentry errors link to the PostHog session replay for that user so you can watch exactly what happened before a crash.

---

## 2. Installation

### 2.1 Frontend — `posthog-js`

```bash
cd web
npm install posthog-js
```

Add to `web/.env` (and production environment on Vercel):
```
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Create `web/src/lib/posthog.js`:

```javascript
import posthog from 'posthog-js'

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',   // only create profiles for identified users
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true, email: true },
    },
  })
}

export { posthog }
```

Import this file in `web/src/main.jsx` **before** any other app code so it initializes before the React tree renders:

```javascript
import './lib/posthog'   // must be first import
import * as Sentry from '@sentry/react'
// ... rest of main.jsx
```

### 2.2 Backend — `posthog-node`

```bash
cd backend
npm install posthog-node
```

Add to `backend/.env` (and production environment on Render):
```
POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://us.i.posthog.com
```

Note: `POSTHOG_KEY` is the same project API key as `VITE_POSTHOG_KEY`. PostHog uses the same key for both client-side and server-side SDKs.

Create `backend/lib/posthog.js`:

```javascript
const { PostHog } = require('posthog-node')

const client = new PostHog(process.env.POSTHOG_KEY || 'noop', {
  host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  flushAt: 20,
  flushInterval: 10000,
  disabled: !process.env.POSTHOG_KEY || process.env.NODE_ENV === 'test',
})

process.on('beforeExit', async () => {
  await client.shutdown()
})

module.exports = client
```

### 2.3 Vercel Speed Insights + Analytics

Both are drop-in — no API keys, no configuration. They only report in Vercel-hosted deployments (production and preview). They are no-ops in local dev.

```bash
cd web
npm install @vercel/speed-insights
npm install @vercel/analytics
```

Add both components to `web/src/main.jsx` inside the React tree. The simplest place is the root `App` component or directly in `main.jsx` alongside the existing providers:

```jsx
// web/src/main.jsx
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

// Inside the rendered tree (alongside <RouterProvider> or <App>):
<>
  <App />
  <SpeedInsights />
  <Analytics />
</>
```

**Speed Insights** collects Core Web Vitals (LCP, FID/INP, CLS, TTFB, FCP) per route and surfaces them in the Vercel dashboard under the Speed Insights tab. No sampling config needed — Vercel handles it automatically.

**Analytics** collects page views, unique visitors, referrer sources, and country-level geography. It is privacy-friendly (no cookies, no fingerprinting) and GDPR-compliant out of the box. Data appears in the Vercel dashboard under the Analytics tab.

Neither tool conflicts with PostHog. PostHog captures behavior events; Vercel Analytics captures page-level traffic; Vercel Speed Insights captures performance. They are complementary.

---

## 3. Sentry Improvements

### 3.1 Updated Frontend Initialization

Replace the current `web/src/main.jsx` Sentry init block:

```javascript
import { posthog } from './lib/posthog'
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Link every Sentry error to the PostHog session replay at the exact timestamp
      try {
        const sessionUrl = posthog.get_session_replay_url({ withTimestamp: true })
        if (sessionUrl) {
          event.tags = { ...event.tags, posthog_session_replay_url: sessionUrl }
        }
      } catch (_) {}
      return event
    },
  })
}
```

This is the only change needed to wire Sentry to PostHog. Every unhandled error in the browser will now carry a direct link to the session replay timestamped to the moment of the crash.

### 3.2 Updated Backend Initialization

No changes needed to `backend/instrument.js`. The Sentry user context is set per-request in the auth middleware (see Section 4.2).

### 3.3 ErrorBoundary Fallback

The current fallback in `main.jsx` is a bare `<p>Something went wrong.</p>`. Replace with a component that gives users a path forward:

```jsx
<Sentry.ErrorBoundary
  fallback={({ error, resetError }) => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>The error has been reported. Try refreshing the page.</p>
      <button onClick={resetError}>Try again</button>
    </div>
  )}
>
```

---

## 4. User Identity

### 4.1 Frontend Identity

In `web/src/context/AuthContext.jsx`, call `posthog.identify()` after a successful login and `posthog.reset()` on logout.

```javascript
import { posthog } from '../lib/posthog'

// After setting user state on login (email/password or Google OAuth):
posthog.identify(user._id, {
  email: user.email,
  username: user.username,
  name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username,
  created_at: user.createdAt,
})

// On logout:
posthog.reset()
```

Call `posthog.identify()` in every code path that resolves a logged-in user: the `/api/auth/me` hydration on app load, login form success, and `AuthCallback.jsx` after OAuth token exchange.

### 4.2 Backend User Context for Sentry

In `backend/middleware/auth.js` (or wherever the JWT is verified), set the Sentry user after attaching `req.user`:

```javascript
const Sentry = require('@sentry/node')

// After verifying token and attaching req.user:
Sentry.setUser({
  id: req.user._id.toString(),
  email: req.user.email,
  username: req.user.username,
})
```

This ensures every backend Sentry error is tied to a specific user without any extra per-controller work.

---

## 5. Global Event Properties

Every PostHog event — both frontend and backend — must include these properties. They are not implied; include them explicitly on every `posthog.capture()` and `client.capture()` call.

```javascript
{
  platform: 'web',      // 'web' | 'android' | 'ios' — never omit
  app_version: import.meta.env.VITE_APP_VERSION ?? 'unknown',  // frontend
  // backend uses: process.env.APP_VERSION ?? 'unknown'
}
```

Set `VITE_APP_VERSION` / `APP_VERSION` to the git SHA or semver at deploy time. This lets you correlate event changes with releases.

---

## 6. Event Taxonomy

Events fired from the **frontend** use `posthog.capture(eventName, properties)`.  
Events fired from the **backend** use `posthogClient.capture({ distinctId: req.user._id.toString(), event: eventName, properties })`.

The split: AI-generation events and study session completion fire from the backend because the backend has the authoritative computed values (card count, accuracy, source type). Everything else fires from the frontend after a successful mutation.

### 6.1 Auth Events

**Fire from: frontend**

```javascript
// Registration — after POST /api/auth/register succeeds
posthog.capture('user_registered', {
  platform: 'web',
  method: 'email',              // 'email' | 'google'
})

// Login — after successful auth (all paths: email, Google OAuth, token hydration on load)
posthog.capture('user_logged_in', {
  platform: 'web',
  method: 'email',              // 'email' | 'google'
})

// Logout — before clearing token
posthog.capture('user_logged_out', {
  platform: 'web',
})

// Email verified — in EmailVerified.jsx on mount
posthog.capture('email_verified', {
  platform: 'web',
})

// Password reset completed — after POST /api/auth/reset-password succeeds
posthog.capture('password_reset_completed', {
  platform: 'web',
})
```

### 6.2 Profile & Onboarding Events

**Fire from: frontend** (Profile.jsx, after PATCH /api/auth/me/profile succeeds)

The `profile_completed` event is a distinct retention signal. Fire it once when the user saves a profile that now has all three signals simultaneously. Check the updated user object after the API response — do not fire based on form state.

```javascript
// Any profile save
posthog.capture('profile_updated', {
  platform: 'web',
  fields_changed: ['avatar', 'bio', 'social_link'],  // array of what changed
  has_avatar: !!user.avatarUrl,
  has_bio: !!user.bio,
  has_social_link: !!(user.socialLinks?.twitter || user.socialLinks?.linkedin || user.socialLinks?.github || user.socialLinks?.website),
})

// Retention signal 2: profile fully completed
// Fire ONLY when the updated profile now has all three: avatar + bio + at least one social link
// AND the event hasn't been fired before (check a ref or user property to avoid repeats)
const isNowComplete = !!user.avatarUrl && !!user.bio && !!(user.socialLinks?.twitter || user.socialLinks?.linkedin || user.socialLinks?.github || user.socialLinks?.website)
if (isNowComplete && !wasCompleteBeforeUpdate) {
  posthog.capture('profile_completed', {
    platform: 'web',
    has_avatar: true,
    has_bio: true,
    has_social_link: true,
  })
}

// Google account linked
posthog.capture('google_account_linked', {
  platform: 'web',
})

// Account deletion initiated (soft delete)
posthog.capture('account_deletion_initiated', {
  platform: 'web',
})
```

### 6.3 Notes Events

**Fire from: backend** (notes.controller.js), using `posthog-node`.

The backend can derive `source` from the note model fields. Use this helper in the controller:

```javascript
// backend/controllers/notes.controller.js
const posthog = require('../lib/posthog')

function getNoteSource(note) {
  if (note.googleDocId) return 'google_doc'
  if (note.pdfUrl) return 'pdf_upload'
  return 'manual'
}
```

```javascript
// After creating or importing a note — fires in importGoogleDoc, uploadFile, createNote handlers
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'note_created',
  properties: {
    platform: 'web',
    note_id: note._id.toString(),
    source: getNoteSource(note),          // 'google_doc' | 'pdf_upload' | 'manual'
    note_type: note.type,                 // 'general' | 'lecture' | 'research' | 'todo' | 'journal'
    has_content: !!note.content && note.content.trim().length > 0,
  },
})

// After POST /api/notes/:id/summary succeeds
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'note_summary_generated',
  properties: {
    platform: 'web',
    note_id: note._id.toString(),
    source: getNoteSource(note),
    note_type: note.type,
    token_count: result.tokenCount ?? null,
    model: result.model ?? null,
  },
})

// After PUT /api/notes/:id/share succeeds
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'note_shared',
  properties: {
    platform: 'web',
    note_id: req.params.id,
    visibility: updatedNote.visibility,   // 'friends' | 'specific'
    shared_with_count: updatedNote.sharedWith?.length ?? 0,
  },
})

// After PUT /api/notes/:id/refresh succeeds (re-import from Google Doc)
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'note_refreshed',
  properties: {
    platform: 'web',
    note_id: req.params.id,
  },
})
```

### 6.4 Flashcard Events

**`flashcard_set_generated` fires from: backend** (this is the activation event — the backend is authoritative for card count and source).  
**Other flashcard events fire from: frontend.**

```javascript
// backend/controllers/notes.controller.js — after generateFlashcardsFromNote succeeds
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'flashcard_set_generated',
  properties: {
    platform: 'web',
    set_id: set._id.toString(),
    note_id: note._id.toString(),
    source: getNoteSource(note),          // 'google_doc' | 'pdf_upload' | 'manual'
    note_type: note.type,
    card_count: result.cards.length,
    generation_path: 'from_note',        // 'from_note' | 'from_text_paste'
  },
})

// backend/controllers/flashcardSets.controller.js — after generateFromContent succeeds
posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'flashcard_set_generated',
  properties: {
    platform: 'web',
    set_id: set._id.toString(),
    note_id: null,
    source: 'text_paste',
    note_type: null,
    card_count: result.cards.length,
    generation_path: 'from_text_paste',
  },
})

// Frontend — after POST /api/flashcard-sets (manual set creation)
posthog.capture('flashcard_set_created_manual', {
  platform: 'web',
  set_id: newSet._id,
})

// Frontend — after PATCH /api/flashcard-sets/:id/share
posthog.capture('flashcard_set_shared', {
  platform: 'web',
  set_id: setId,
  visibility: updatedSet.visibility,
  shared_with_count: updatedSet.sharedWith?.length ?? 0,
})

// Frontend — after POST /api/flashcard-sets/:id/duplicate
posthog.capture('flashcard_set_duplicated', {
  platform: 'web',
  original_set_id: setId,
  new_set_id: duplicatedSet._id,
})

// Frontend — after DELETE /api/flashcard-sets/:id
posthog.capture('flashcard_set_deleted', {
  platform: 'web',
  set_id: setId,
})
```

### 6.5 Study Session Events

**`study_session_completed` fires from: backend** (controller has all computed values).  
**`study_session_started` fires from: frontend** (when StudyMode mounts with a set loaded).

This is **Retention Signal 1**. A qualifying session requires `cards_reviewed >= 5`.

```javascript
// Frontend — StudyMode.jsx, after the set loads and the user sees the first card
posthog.capture('study_session_started', {
  platform: 'web',
  set_id: set._id,
  card_count: set.totalCards,
})

// backend/controllers/studySessions.controller.js
// Add after StudySession.create() and computeStreak() in the submitSession handler:

const posthog = require('../lib/posthog')

// Inside submitSession, after computing session metrics:
const isQualifyingSession = totalCards >= 5

posthog.capture({
  distinctId: req.user._id.toString(),
  event: 'study_session_completed',
  properties: {
    platform: 'web',
    session_id: session._id.toString(),
    set_id: setId.toString(),
    cards_reviewed: totalCards,
    cards_correct: correctCount,
    accuracy_pct: score,                      // 0–100
    duration_seconds: durationSeconds,
    is_qualifying_session: isQualifyingSession,
    streak_after: streak.current ?? 0,
  },
})

// Fire streak milestone event if applicable
const STREAK_MILESTONES = [7, 14, 30, 60, 100]
if (STREAK_MILESTONES.includes(streak.current)) {
  posthog.capture({
    distinctId: req.user._id.toString(),
    event: 'study_streak_milestone',
    properties: {
      platform: 'web',
      streak_days: streak.current,
    },
  })
}
```

No backend schema changes are required. The existing `submitSession` controller already computes `totalCards`, `correctCount`, and `score`, and calls `computeStreak()` before responding. Add the PostHog calls after those computations.

### 6.6 Task Events

**Fire from: frontend**

```javascript
// After POST /api/tasks
posthog.capture('task_created', {
  platform: 'web',
  has_due_date: !!dueDate,
  is_shared: participants.length > 0,
  participant_count: participants.length,
})

// After PATCH /api/tasks/:id/status
posthog.capture('task_status_updated', {
  platform: 'web',
  task_id: taskId,
  from_status: previousStatus,   // 'todo' | 'in_progress' | 'completed'
  to_status: newStatus,
})

// After PATCH /api/tasks/:id/participants
posthog.capture('task_shared', {
  platform: 'web',
  task_id: taskId,
  participant_count: updatedParticipants.length,
})
```

### 6.7 Social Events

**Fire from: frontend**

```javascript
// After POST /api/friends/request
posthog.capture('friend_request_sent', {
  platform: 'web',
})

// After PUT /api/friends/request/:id with accepted status
posthog.capture('friend_request_accepted', {
  platform: 'web',
})

// After DELETE /api/friends/:id
posthog.capture('friend_removed', {
  platform: 'web',
})

// After POST /api/conversations/:id/messages
posthog.capture('message_sent', {
  platform: 'web',
  conversation_id: conversationId,
})

// After POST /api/comments
posthog.capture('comment_added', {
  platform: 'web',
  target_type: targetType,   // 'note' | whatever targetType is in the model
  target_id: targetId,
})

// After POST /api/comments/:id/like
posthog.capture('comment_liked', {
  platform: 'web',
  comment_id: commentId,
})
```

### 6.8 Career Events

**Fire from: frontend**

```javascript
// After POST /api/applications
posthog.capture('job_application_created', {
  platform: 'web',
  initial_status: status,   // 'applied' | 'interviewing' | etc.
})

// After PUT /api/applications/:id (status change only — check if status changed)
if (previousStatus !== newStatus) {
  posthog.capture('job_application_status_updated', {
    platform: 'web',
    application_id: applicationId,
    from_status: previousStatus,
    to_status: newStatus,
  })
}

// After POST /api/resumes/upload
posthog.capture('resume_uploaded', {
  platform: 'web',
})

// After POST /api/resumes/:id/feedback
posthog.capture('resume_feedback_generated', {
  platform: 'web',
  resume_id: resumeId,
})
```

### 6.9 Public Page Events

**Fire from: frontend** (landing, product, about pages)

```javascript
// Landing page — after POST /api/waitlist succeeds
posthog.capture('waitlist_signup', {
  platform: 'web',
  has_first_name: !!firstName,
})
```

PostHog automatically captures page views (`capture_pageview: true` in init), so no manual tracking is needed for public page visits.

---

## 7. Activation Funnel

### 7.1 Definition

**Activation event:** `flashcard_set_generated`

A user is activated when they go from having content to having study material in a single session. This is the moment the product delivers its core promise — reducing the gap between having notes and being ready to be tested. It must happen through AI generation (not manual set creation) because manual creation does not prove the user experienced the core value.

The import step is a strong leading indicator but is not gated into the activation definition. A user who pastes text and generates flashcards in the same session is equally activated.

### 7.2 Funnel Steps

Build this as a PostHog funnel with a 7-day conversion window:

| Step | Event | Notes |
|---|---|---|
| 1 | `user_registered` | Top of funnel |
| 2 | `note_created` OR `flashcard_set_generated` (from_text_paste) | First content action |
| 3 | `flashcard_set_generated` | **Activation** |
| 4 | `study_session_started` | First study engagement |
| 5 | `study_session_completed` where `is_qualifying_session = true` | **Retention Signal 1** |

### 7.3 Key Drop-off Points to Watch

- **Registration → first content action:** Users who sign up and leave without creating any content. This is likely onboarding friction.
- **note_created → flashcard_set_generated:** Users who import a note but never generate flashcards. The gap here indicates they don't know the feature exists or don't trust it.
- **flashcard_set_generated → study_session_started:** Users who generate flashcards but never actually study them. This is activation without engagement.

---

## 8. Retention Signals

### 8.1 Retention Signal 1 — Study Sessions

**Event:** `study_session_completed` where `is_qualifying_session = true` (cards_reviewed >= 5)

Track weekly: what percentage of registered users complete at least one qualifying session per week? Users who complete 2+ qualifying sessions in their first week have significantly higher 30-day retention (hypothesis — validate with data).

PostHog cohort to create: "Weekly Active Studiers" — users who fired `study_session_completed` with `is_qualifying_session = true` in the last 7 days.

### 8.2 Retention Signal 2 — Profile Completion

**Event:** `profile_completed`

Users who complete their profile (avatar + bio + social link) are predicted to engage with social features (friends, messages, activity feed, shared content). This is a leading indicator of social retention, not learning retention. These are two distinct user types.

PostHog cohort to create: "Profile-Completed Users" — users who have fired `profile_completed`.

### 8.3 User Segmentation

Define these two cohorts in PostHog and compare their behavior:

| Cohort | Definition | Predicted behavior |
|---|---|---|
| Learning-focused | Fired `study_session_completed` (qualifying) but NOT `profile_completed` | Higher flashcard usage, lower social feature usage |
| Socially-engaged | Fired `profile_completed` and at least one social event (friend_request_sent, message_sent, comment_added) | Higher friend/message feature usage |

Both cohorts should go through the same activation funnel. Compare funnel conversion rates between them.

---

## 9. Sentry Alert Thresholds

All alerts deliver via email. The goal is signal over noise — alerts should require action, not awareness.

### 9.1 Alerts to Enable

**Issue Alerts (configure in Sentry → Alerts → Issue Alerts):**

| Alert | Condition | Threshold | Rationale |
|---|---|---|---|
| New unhandled error | A new issue is created | First occurrence only | Catch regressions immediately |
| AI generation failure | Error in `generateFlashcardsFromNote` or `generateFromContent` | Any occurrence | These are the core value path — any failure matters |
| Auth failure spike | Error rate on `/api/auth/*` routes exceeds threshold | 3 errors in 10 min | Auth errors are user-facing and high impact |
| Unhandled 500 spike | `status:500` event count | 10 errors in 5 min | Distinguish a bug from normal 4xx traffic |

**Performance Alerts (configure in Sentry → Alerts → Metric Alerts):**

| Alert | Metric | Threshold | Rationale |
|---|---|---|---|
| Slow AI generation | P95 response time on `/api/notes/:id/flashcards/generate` or `/api/flashcard-sets/generate` | > 15s | Groq calls can be slow — alert if consistently degraded |
| Slow note import | P95 on `POST /api/notes/import` | > 10s | Google Docs API dependency |

### 9.2 Alerts to Leave Off (noise)

- All `401 Unauthorized` errors — expected from expired tokens and unauthenticated requests.
- All `404 Not Found` errors — expected from deep links to deleted resources.
- Individual slow request warnings — too frequent at low volume.
- Repeated occurrences of a known issue — only alert on new issues or spikes, not every recurrence.

### 9.3 Sentry Performance Tracing

The current `tracesSampleRate: 0.1` (10%) on both frontend and backend is appropriate for early stage. Do not increase it until you have enough traffic to need less sampling. The AI generation endpoints should be instrumented with manual spans when you want to diagnose slowness:

```javascript
// backend/controllers/notes.controller.js (generateFlashcardsFromNote)
const Sentry = require('@sentry/node')

const result = await Sentry.startSpan(
  { name: 'groq.generateFlashcards', op: 'ai.generate' },
  () => groqService.generateFlashcards(note.content, req.user._id)
)
```

---

## 10. PostHog Dashboards to Create

Once events are flowing, create these dashboards in PostHog:

**Activation Dashboard:**
- Funnel: registered → note_created → flashcard_set_generated (weekly conversion %)
- Trend: daily `flashcard_set_generated` count, split by `generation_path`
- Trend: daily `user_registered` vs daily `flashcard_set_generated` (activation lag)

**Retention Dashboard:**
- Cohort retention table: users who completed a qualifying study session in week 1 — what % return in week 2, 3, 4?
- Trend: weekly active studiers (qualifying sessions per week)
- Streak milestone breakdown: how many users hit 7, 14, 30 days?

**Feature Adoption Dashboard:**
- Trend: `note_summary_generated` — who is using AI summary vs flashcards?
- Trend: social events (friend_request_sent, message_sent) vs learning events
- Funnel: `flashcard_set_generated` → `study_session_started` → `study_session_completed` (drop-off between generation and actual use)

---

## 11. Android & Future Platforms

When Android development begins, this spec must be reaudited before implementation. Specifically:

- All events in this spec use `platform: 'web'`. Android sets `platform: 'android'`. iOS sets `platform: 'ios'`. Event names are identical — no renaming.
- Mobile-specific events not yet defined: `app_backgrounded`, `app_foregrounded`, `push_notification_received`, `push_notification_tapped`, `offline_session_synced`.
- The `study_session_completed` event on mobile may have different session mechanics if the user can study offline and sync later. The `is_qualifying_session` threshold (cards_reviewed >= 5) stays the same.
- Session replay is web-only for now. PostHog's mobile session replay is available but requires separate evaluation and a privacy review before enabling.
- The PostHog project key is the same across platforms. Do not create separate PostHog projects per platform — all events flow into one project and are segmented by `platform` property.
- Sentry has separate SDKs for Android and React Native. A new Sentry DSN should be created for the mobile app — do not reuse the web or backend DSN.

---

## 12. Environment Variables Summary

### Local Development

Add the following to `web/.env` (already documented in `web/.env.example`):

```
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_APP_VERSION=local
```

Add the following to `backend/.env` (already documented in `backend/.env.example`):

```
POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://us.i.posthog.com
APP_VERSION=local
```

Both `.env.example` files have been updated with these additions. Anyone cloning the repo will see the new variables documented.

The PostHog key for local and production is the same project API key. Find it in PostHog under **Project Settings → Project API Key**.

---

## 13. Deploying Environment Variables

### Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → your Continuum project → **Settings → Environment Variables**
2. Add each variable. Set **Environment** to **Production** (and **Preview** if you want analytics in preview deploys — recommended to leave off to keep data clean):

| Name | Value | Environment |
|---|---|---|
| `VITE_POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxx` | Production |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | Production |
| `VITE_APP_VERSION` | Leave blank — see below | Production |

3. For `VITE_APP_VERSION`, set it to the git SHA automatically at build time instead of hardcoding it. In Vercel, go to **Settings → Environment Variables** and add:

```
VITE_APP_VERSION=$VERCEL_GIT_COMMIT_SHA
```

Vercel exposes `VERCEL_GIT_COMMIT_SHA` as a system environment variable during builds. This gives you the full commit SHA on every deploy without manual updates.

4. After adding all variables, trigger a redeploy: **Deployments → your latest deployment → Redeploy** (or push a new commit).

### Render (Backend)

1. Go to [render.com](https://render.com) → your Continuum backend service → **Environment**
2. Add each key-value pair:

| Key | Value |
|---|---|
| `POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxx` |
| `POSTHOG_HOST` | `https://us.i.posthog.com` |
| `APP_VERSION` | See below |

3. For `APP_VERSION`, Render does not inject the git SHA automatically as an env var. Two options:

   **Option A (recommended for now):** Set `APP_VERSION` to the short SHA manually after each deploy. Not ideal but acceptable at this stage since deploys are infrequent.

   **Option B:** Add a build command step that writes the SHA to the env. In Render's **Build Command** field, prepend:
   ```bash
   echo "APP_VERSION=$(git rev-parse --short HEAD)" >> .env && <your existing build command>
   ```
   This only works if `NODE_ENV` reads `.env` at startup, which the current backend does not do in production (env vars come from Render directly). Stick with Option A until you have a deploy pipeline that handles this.

4. Render automatically restarts the service after saving environment variable changes. No manual redeploy needed.
