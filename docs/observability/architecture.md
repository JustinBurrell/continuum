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

## Clean Slate Before Launch

Before your product launch, wipe all test data:

**MongoDB Atlas:**  
Drop all collections or use the Atlas UI to delete and recreate the database. This removes all test users, notes, flashcard sets, etc.

**PostHog:**  
Settings → Project → Reset project data. This wipes all persons and events while preserving your project key, funnel configuration, and dashboard setup.

Do this only after confirming the proxy works end-to-end so the first real user data that enters PostHog is clean.
