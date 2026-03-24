# Web Launch Roadmap

Complete this in order before beginning mobile development. Every item is implemented and verified — nothing is deferred to post-launch.

As each step is completed, delete the referenced `future-ideas/` docs — they exist only to guide implementation. By step 10, the `future-ideas/` folder contains only `forum.md` and `notifications-spec.md`.

---

## 1. ~~Database Performance~~ → `chore/db-performance` — DONE

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — items 1 and 2

- ~~Add compound indexes to all hot query paths (Activity, Note, Task, Friendship)~~
- ~~Tune Mongoose connection pool from default 5 → 20~~

Foundation for everything else. Queries must be fast before adding more load on top.

---

## 2. ~~Backend Security Hardening~~ → `fix/backend-security` — DONE

[future-ideas/security-hardening.md](future-ideas/security-hardening.md)
[security/backend_security_audit.md](security/backend_security_audit.md)

Work through the remediation roadmap in the audit top to bottom. Key items:

- ~~**H1** — Per-user daily AI call limit (uses existing Redis)~~
- ~~**M8** — Encrypt Google OAuth tokens at rest (AES-256-GCM)~~
- ~~**L1** — Block password reset for unverified emails~~
- ~~**OP3** — GDPR delete endpoint with 30-day grace period (`DELETE /api/auth/me` + `POST /api/auth/me/restore`)~~
- ~~All remaining findings from the backend audit not yet resolved~~

**When done:** delete `docs/future-ideas/security-hardening.md`

---

## 3. ~~Frontend Security Fixes~~ → `fix/frontend-security` — DONE

[security/frontend_security_audit.md](security/frontend_security_audit.md)

- ~~**F-H1** — Clear React Query cache on logout (`queryClient.clear()`)~~
- ~~**F-C2** — Remove "HTML is supported" hint from NoteEditor + add DOMPurify~~
- ~~**F-M2** — Fix Register.jsx sending `name` instead of `firstName`/`lastName`~~
- ~~**F-L4** — Add `<meta name="referrer">` to index.html~~
- ~~**F-L2** — Add `rel="noopener noreferrer"` to all `target="_blank"` links~~ (already clean)
- ~~**F-H2** — Add Content Security Policy meta tag to index.html~~
- ~~**F-L1** — Add `autocomplete` attributes to all password fields~~
- ~~**F-H4** — Add `VITE_API_URL` missing build guard in vite.config.js~~
- ~~**F-M4** — Add explicit React Query staleTime and gcTime config~~
- ~~**F-M1** — Fix concurrent 401s each attempting token refresh (refresh lock)~~
- ~~**F-M5** — Replace all `window.confirm()` with the existing Modal component~~
- ~~**F-M3** — Replace raw server error strings with a friendlyError map~~
- **F-H3** — Self-host Google Fonts or add SRI hashes — deferred to step 10
- **F-C1** — Migrate refresh token from localStorage to httpOnly cookie — deferred to step 10
- **F-C3** — AuthCallback one-time code exchange — deferred to step 10

---

## 4. Loading States & Perceived Performance → `feat/loading-states`

[frontend/loading-states-plan.md](frontend/loading-states-plan.md)

- Shimmer animation replacing pulse on the `Skeleton` component
- Skeleton layouts for every page that fetches data (NotesList, Tasks, Flashcards, Friends, Dashboard, etc.)
- Optimistic mutations for writes (create/delete note, task status drag, send message, friend request)
- Sidebar prefetch on hover — data cached before user clicks
- Per-query `staleTime` overrides for stable data (profile, flashcard sets, resumes)
- Landing page auth hydration fix — `isLoading` guard prevents flash of Sign In/Get Started before auth resolves

App must feel instant before launch. Zero visible layout shift.

---

## 5. Rate Limiting → `chore/rate-limiting`

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 3
[future-ideas/pre-deployment-checklist.md](future-ideas/pre-deployment-checklist.md) — section 4

- Tighter limits on auth endpoints (login, register, forgot-password)
- Per-user limits on write endpoints (messages, comments, share, participants)
- AI endpoint daily cap (tied to step 2 above)

---

## 6. Redis Adapter for Socket.io → `chore/redis-socket-adapter`

[future-ideas/redis-socket-adapter.md](future-ideas/redis-socket-adapter.md)

- Install `@socket.io/redis-adapter`
- Wire into `backend/lib/socket.js` using existing Redis connection
- App becomes multi-instance ready from day one — no re-architecture needed later

**When done:** delete `docs/future-ideas/redis-socket-adapter.md`

---

## 7. Activity Feed Cursor Pagination → `feat/cursor-pagination`

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 5

- Replace offset pagination with `createdAt` cursor on `GET /api/activity`
- Cache every page by cursor key in Redis, not just the first page
- Frontend updated to use cursor-based infinite scroll

---

## 8. Background Job Queue for AI → `feat/ai-job-queue`

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 6

- Install BullMQ (reuses existing Redis)
- Move note summary, flashcard generation, and resume feedback off the request thread
- Endpoints return `{ jobId }` immediately
- Socket event fires to client when job completes (`note_summary_ready`, etc.)

---

## 9. Pre-Deployment Checklist → `chore/pre-deploy`

[future-ideas/pre-deployment-checklist.md](future-ideas/pre-deployment-checklist.md)

Work through every section top to bottom:
- ObjectId param validation on all routes
- Global async error handler
- CORS locked to production frontend URL only
- All indexes verified with `db.collection.getIndexes()`
- `npm audit` — no high or critical findings
- All env vars documented in `.env.example`
- Logging structured and persistent
- Rollback strategy documented

---

## 10. Hosting + Deployment Config → `chore/deploy-config`

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 7
[future-ideas/pre-deployment-checklist.md](future-ideas/pre-deployment-checklist.md) — sections 11–13
[future-ideas/websocket-deployment-notes.md](future-ideas/websocket-deployment-notes.md)

- **Frontend** — deploy `web/dist/` to Vercel, Netlify, or Cloudflare Pages (CDN edge caching included)
- **Backend** — deploy to Railway, Render, or Fly.io
- Verify HTTPS end to end
- Lock MongoDB Atlas Network Access to server static IP
- Set `NODE_ENV=production`
- Set spend alerts on Groq, Atlas, Cloudinary, and Resend
- Confirm WebSocket support and sticky sessions on chosen host
- **F-H3** — Self-host Google Fonts or add SRI hashes (deferred from step 3)
- **F-C1** — Migrate refresh token from localStorage to httpOnly cookie — requires backend `Set-Cookie` coordination (deferred from step 3)
- **F-C3** — AuthCallback one-time code exchange instead of JWT in URL — requires backend C3 fix (deferred from step 3)

**When done:** delete `docs/future-ideas/scale-readiness.md`, `docs/future-ideas/websocket-deployment-notes.md`, `docs/future-ideas/pre-deployment-checklist.md`

---

## 11. MVP Verification → no branch

[future-ideas/web-mvp-verification.md](future-ideas/web-mvp-verification.md)

Full manual walkthrough of every page and feature against the production deployment. Two browser windows open for all real-time flows. Nothing moves forward until every checkbox is ticked.

**When done:** delete `docs/future-ideas/web-mvp-verification.md`

---

## 12. Launch → begin mobile development

Once step 11 is signed off, the web MVP is complete and stable. Mobile development starts on a clean foundation with a fully deployed, production-hardened backend.

The only files remaining in `docs/future-ideas/` will be `forum.md` and `notifications-spec.md` — post-launch features, not pre-launch requirements.

---

*Last Updated: March 2026*
