# Observability Architecture

How monitoring, analytics, and error tracking are wired up in Continuum.

---

## Stack

| Tool | Purpose |
|------|---------|
| **PostHog** | Product analytics — events, funnels, person profiles, session replay |
| **Sentry** | Error tracking — frontend JS exceptions, unhandled promise rejections |
| **Vercel Analytics** | Web vitals and page performance (built into Vercel deployment) |

---

## PostHog Proxy

PostHog events are routed through a Vercel Edge Function to bypass ad blockers. Without a proxy, requests to `us.i.posthog.com` are blocked by uBlock Origin, EasyPrivacy, and Brave Shields before they leave the browser.

### Request flow

```
Browser
  → POST usecontinuum.dev/ph/e/          (ad blockers see your domain, not PostHog)
  → Vercel rewrite: /ph/* → /api/ph/*
  → Edge function: web/api/ph/[...path].js
  → us.i.posthog.com  or  us-assets.i.posthog.com
```

### Host routing in the edge function

| Path prefix | Upstream host |
|-------------|--------------|
| `/static/*` | `us-assets.i.posthog.com` |
| `/array/*`  | `us-assets.i.posthog.com` |
| everything else | `us.i.posthog.com` |

`/array/` hosts PostHog's runtime config JS. `/static/` hosts the session recorder and other SDK assets. Both must hit the assets CDN, not the ingestion API.

### Key files

| File | Role |
|------|------|
| `web/api/ph/[...path].js` | Vercel Edge Function — proxies all PostHog traffic |
| `web/vercel.json` | Rewrite rule: `/ph/:path*` → `/api/ph/:path*` |
| `web/src/lib/posthog.js` | PostHog SDK init with `api_host: '/ph'` |
| `backend/lib/posthog.js` | `posthog-node` client for server-side event capture |

---

## Identity Model

PostHog uses a **MongoDB `_id`** (ObjectID string) as the `distinctId` for all events — both frontend and backend. This keeps them consistent.

```
Frontend:  posthog.identify(user._id, { email, username, name, created_at })
Backend:   posthog.capture({ distinctId: req.user._id.toString(), event, properties })
```

On first load, PostHog assigns an anonymous UUID. When `identify()` fires (on login, register, or page hydration with a stored token), PostHog merges the anonymous UUID into the `_id` person profile and attaches the email as a display property.

`posthog.reset()` is called on logout to clear the local anonymous ID.

---

## Sentry

Sentry is initialized in the React app and captures all unhandled JS errors and promise rejections in production.

Environment: `production`  
SDK: `@sentry/react`  
DSN: set via `VITE_SENTRY_DSN` environment variable

Errors are visible at: [sentry.io](https://sentry.io) → project **CONTINUUM-FRONTEND**

---

## How to Test Events End-to-End

### Prerequisites

- Use **Chrome Incognito with no extensions** — extensions (uBlock, AdBlock) will block requests even through the proxy if they're active in incognito
- The PR containing proxy fixes must be deployed to Vercel before testing

### Step 1 — Verify the proxy is working

1. Open `https://usecontinuum.dev` in incognito (no extensions)
2. Open DevTools → Network tab → filter by `ph/`
3. All requests should return `200` — no `405`, no `ERR_BLOCKED_BY_CLIENT`
4. You should see: `ph/array/.../config.js`, `ph/flags/`, `ph/e/`

### Step 2 — Fire each event

Work through these in order in the same incognito session:

| # | Action | Expected event |
|---|--------|----------------|
| 1 | Register a new account | `user_registered` |
| 2 | Create a note manually | `note_created` |
| 3 | Generate flashcards from that note | `flashcard_set_generated` |
| 4 | Generate a summary on the note | `note_summary_generated` |
| 5 | Open a flashcard set and flip through 5+ cards | `study_session_started` |
| 6 | Finish the study session | `study_session_completed` |
| 7 | Upload a resume | `resume_uploaded` |
| 8 | Run AI feedback on the resume | `resume_feedback_generated` |
| 9 | Create a job application | `job_application_created` |
| 10 | Create a task | `task_created` |
| 11 | Send a friend request | `friend_request_sent` |
| 12 | Send a direct message | `message_sent` |
| 13 | Leave a comment on a note | `comment_added` |

### Step 3 — Confirm in PostHog

Go to **PostHog → Activity → Live Events**. Events should appear within 2–5 seconds of each action. The person should show as the registered user's email (after `identify` fires on registration).

### Step 4 — Verify the activation funnel

Go to **PostHog → Dashboards → Launch → Activation Funnel**. After completing steps 1–9 above, both steps of the funnel should show conversion.

---

## Demo & Seed Account Exclusion

The demo account (`isDemo: true`) and all seeded bot accounts (`isSeedUser: true`) are completely silenced from PostHog at two layers:

**Frontend — `posthog.opt_out_capturing()`**  
In `web/src/context/AuthContext.jsx` and `web/src/pages/auth/AuthCallback.jsx`, after the user object is set on login/hydration, the code checks `user.isDemo || user.isSeedUser`. If true, `posthog.opt_out_capturing()` is called. This disables all PostHog tracking for that browser session — including autocapture and automatic `$pageview` events that cannot be blocked with a simple conditional.

On logout, `posthog.opt_in_capturing()` is always called to restore the default state for the next user who logs in on that browser.

**Backend — centralized `capture()` wrapper**  
`backend/lib/posthog.js` exports a `capture(user, event, props)` wrapper instead of the raw PostHog client. The wrapper checks `user.isDemo || user.isSeedUser` and silently returns without forwarding the event. All controllers call `posthog.capture(req.user, ...)`, so the guard is enforced in one place.

**PostHog dashboard (belt-and-suspenders)**  
A "Real users" cohort (person property `isDemo is not true`) is applied as a filter on all dashboards and saved insights. Even if a demo event somehow slipped through the code guards, it would be excluded from all charts.

---

## Anonymous Tracking on Marketing Pages

Anonymous `$pageview` events on the landing page and login page are intentionally retained — they are not blocked or filtered.

With `person_profiles: 'identified_only'`, anonymous sessions do not create person records in PostHog. But when the visitor later registers and `posthog.identify()` fires, PostHog retroactively merges the anonymous session into the new person profile. This preserves the full pre-signup journey and enables the landing page → registration conversion funnel.

All non-auth pages in the app are marketing or login pages, so there is no risk of capturing anonymous events on authenticated views.

---

## Clean Slate Before Launch

Before your product launch, wipe all test data:

**MongoDB:**  
Run `node backend/scripts/reset-prod.js` (after setting `MONGODB_URI` in `backend/.env` to your prod Atlas URI). The script prints document counts per collection and requires you to type `RESET` to confirm before dropping anything. Then re-seed: `node backend/scripts/seed-jane.js && node backend/scripts/seed-justin.js`.

**PostHog:**  
Settings → Project → Reset project data. This wipes all persons and events while preserving your project key, funnel configuration, and dashboard setup.

Do this only after confirming the proxy works end-to-end so the first real user data that enters PostHog is clean.
