# Web Launch Roadmap

Complete this in order before beginning mobile development. Every item is implemented and verified — nothing is deferred to post-launch.

As each step is completed, delete the referenced `future-ideas/` docs — they exist only to guide implementation. By step 11, the `future-ideas/` folder contains only `forum.md` and `notifications-spec.md`.

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

## 4. ~~Loading States & Perceived Performance~~ → `feat/loading-states` — DONE

[frontend/loading-states-plan.md](frontend/loading-states-plan.md)

- ~~Shimmer animation replacing pulse on the `Skeleton` component~~
- ~~Skeleton layouts for every page that fetches data (NotesList, Tasks, Flashcards, Friends, Dashboard, etc.)~~
- ~~Optimistic mutations for writes (create/delete note, task status drag, send message, friend request)~~
- ~~Sidebar prefetch on hover — data cached before user clicks~~
- ~~Per-query `staleTime` overrides for stable data (profile, flashcard sets, resumes)~~
- ~~Landing page auth hydration fix — `isLoading` guard prevents flash of Sign In/Get Started before auth resolves~~

~~App must feel instant before launch. Zero visible layout shift.~~

---

## 5. ~~Rate Limiting~~ → `chore/rate-limiting` — DONE

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 3
[future-ideas/pre-deployment-checklist.md](future-ideas/pre-deployment-checklist.md) — section 4

- ~~Tighter limits on auth endpoints (login, register, forgot-password)~~
- ~~Per-user limits on write endpoints (messages, comments, share, participants)~~
- ~~AI endpoint burst protection (5 req/min per user, on top of Redis daily cap from step 2)~~

---

## 6. ~~Redis Adapter for Socket.io~~ → `chore/redis-socket-adapter` — DONE

- ~~Install `@socket.io/redis-adapter`~~
- ~~Wire into `backend/lib/socket.js` using existing Redis connection~~
- ~~App becomes multi-instance ready from day one — no re-architecture needed later~~

---

## 7. ~~Activity Feed Cursor Pagination~~ → `feat/cursor-pagination` — DONE

- ~~Replace offset pagination with `createdAt` cursor on `GET /api/activity`~~
- ~~Cache every page by cursor key in Redis, not just the first page~~
- ~~Frontend updated to use cursor-based infinite scroll (useInfiniteQuery + Load More button)~~

---

## 8. ~~Background Job Queue for AI~~ → SKIPPED

[future-ideas/scale-readiness.md](future-ideas/scale-readiness.md) — item 6

Implemented and reverted. The socket-based notification round-trip (enqueue → worker → socket emit → client update) added measurable latency compared to keeping the AI call on the request thread. Groq responses are fast enough that synchronous is the better UX. BullMQ + ioredis remain installed but unused — can be revisited post-launch if Groq response times degrade at scale.

---

## 9. ~~Pre-Deployment Checklist~~ → `chore/pre-deploy` — DONE

[future-ideas/pre-deployment-checklist.md](future-ideas/pre-deployment-checklist.md)

- ~~ObjectId param validation on all routes (`validateObjectId` middleware + `router.param` in all 10 route files)~~
- ~~Global async error handler — `express-async-errors` patches Express; all 86 async controllers now forward errors to the global handler~~
- ~~CORS locked to production frontend URL — `process.exit(1)` if `FRONTEND_URL` unset in production~~
- ~~`npm audit` — 0 vulnerabilities~~
- ~~All env vars documented in `.env.example`~~
- ~~Process-level `unhandledRejection` + `uncaughtException` handlers~~
- Logging (structured logger) — deferred to post-launch
- Rollback strategy — deferred to step 11

---

## 10. Polish & Bug Fixes → `fix/polish`

These can be resolved in any order as PRs are opened. Issue numbers TBD — update inline as PRs are created.

Already completed from this list: ~~POL-1 (rate limiting — step 5)~~, ~~POL-3 (indexes — step 1)~~, ~~POL-4 (loading skeletons — step 4)~~.

### Bugs
- [ ] **POL-9 / Google Unlink 500** — `googleUnlink` crashes when `req.body` is `null`/`undefined` after `mongo-sanitize`. Fix: `const { keepNotes = true } = req.body || {};` in `auth.controller.js`. Frontend should send `{ data: { keepNotes: true } }` with the DELETE, or show a confirmation modal first. See [bugs/google-unlink-500.md](bugs/google-unlink-500.md).

### Backend hardening
- [ ] **POL-2** — Standardize error responses across all routes — audit every controller for inconsistent `{ message }` vs `{ error }` shapes; ensure all 4xx/5xx go through the same `{ success: false, error }` format

### Frontend polish
- [ ] **POL-5** — Add React error boundaries with fallback UI — wrap major page sections so a crash in one panel doesn't blank the whole page
- [ ] **POL-6** — Responsive layout improvements — audit every page at 375px, 768px, and 1280px; fix any overflow, cramped padding, or broken grids
- [ ] **POL-7** — Smooth animations and transitions — page entry fades, card hover lifts, button press feedback consistency

### Missing UI — endpoints built but not wired
- [ ] **Delete resume** — `DELETE /api/resumes/:id` — add delete button to Resumes page
- [ ] **Mark message as read** — `PUT /api/messages/:id/read` — call on Conversation mount to clear unread state
- [ ] **Task participant status** — `PATCH /api/tasks/:id/participant-status` — toggle accept/decline on shared task cards
- [ ] **Share note** — `PUT /api/notes/:id/share` — friend picker on NoteDetail to share with specific users
- [ ] **Share flashcard set** — `PATCH /api/flashcard-sets/:id/share` — share button on FlashcardSetDetail

### Testing
- [ ] **POL-8** — Integration test suite for critical paths — auth flow, note create/share, task create/assign, resume upload + AI feedback

### Documentation
- [ ] **POL-15** — Swagger/OpenAPI docs — `swagger-jsdoc` + `swagger-ui-express`, serve at `/api-docs`
- [ ] **POL-16** — Update backend README — setup, env vars, scripts, endpoint list
- [ ] **POL-17** — Update web README — setup, env vars, folder structure, key deps
- [ ] **POL-19** — Update root README — project overview, stack, architecture summary, quickstart, screenshots or demo GIF

### Showcase prep
- [ ] **POL-11** — Prepare demo script — full student workflow: import → summarize → flashcards → task → share → career
- [ ] **POL-12** — Create sample data for demo — clean seed that tells a compelling story
- [ ] **POL-13** — Record backup demo video — in case of live demo failure

---

## 11. Hosting + Deployment Config → `chore/deploy-config`

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
- Update `docs/backend/system-design.md` diagrams to reflect final production architecture
- Update `docs/database/schema_diagram.md` and regenerate `database_schema.png` if schema changed during launch prep

**When done:** delete `docs/future-ideas/scale-readiness.md`, `docs/future-ideas/websocket-deployment-notes.md`, `docs/future-ideas/pre-deployment-checklist.md`

---

## 12. MVP Verification → no branch

[future-ideas/web-mvp-verification.md](future-ideas/web-mvp-verification.md)

Full manual walkthrough of every page and feature against the production deployment. Two browser windows open for all real-time flows. Nothing moves forward until every checkbox is ticked.

**When done:** delete `docs/future-ideas/web-mvp-verification.md`

---

## 13. Launch → begin mobile development

Once step 12 is signed off, the web MVP is complete and stable. Mobile development starts on a clean foundation with a fully deployed, production-hardened backend.

The only files remaining in `docs/future-ideas/` will be `forum.md` and `notifications-spec.md` — post-launch features, not pre-launch requirements.

---

*Last Updated: March 2026*
