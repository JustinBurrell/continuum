# Continuum — Interview Brief

A complete reference for talking about this project in interviews, incubator pitches, and technical conversations. Everything in here is real — built, deployed, and verifiable.

**Live:** https://continuum-web.vercel.app
**API Docs:** https://continuum-backend-yrrr.onrender.com/api-docs
**Repo:** https://github.com/JustinBurrell/continuum

---

## What It Is

Continuum is a full-stack educational productivity platform built for college students. It combines note-taking, AI-powered study tools, task management, social features, and career tracking into a single cohesive product.

Built over 8 weeks for the 2026 All Star Code Technical Entrepreneurship Incubator with Google Play.

---

## The Numbers

| Metric | Count |
|--------|-------|
| Database collections | 17 |
| API endpoints | ~117 across 19 route groups |
| Frontend pages (web) | 31 |
| Frontend screens (Android) | 30+ |
| Web UI components | 27 |
| Android composables | 40+ (reusable + screen-level) |
| Backend tests | 314 Jest + Supertest across 20 suites |
| Web unit tests | 76 Vitest tests -- utils, error helpers, hooks, components |
| Web E2E tests | Playwright -- auth, notes, flashcards, tasks, career, mobile gate |
| Android unit tests | 176 MockK tests -- 10 ViewModels, 6 repositories, 2 utility modules |
| Backend controllers | 16 |
| Services | 6 (AI, Activity, Share, Account, Notifications, Email) |
| Middleware types | 5 (auth, rate limiting, validation, uploads, error handling) |
| Android API coverage | ~93/108 endpoints (~86%) |
| Android offline tables | Room + SyncQueue (WorkManager-backed) |

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Node.js, Express 5, MongoDB, Mongoose, Socket.io, Redis, Groq SDK |
| Frontend | Vite, React 18, Tailwind CSS 3, React Query v5, React Router v6 |
| Mobile | Kotlin 2.1, Jetpack Compose (Material 3), Hilt, Retrofit 2, Room, Coil 3, Socket.io, Lottie |
| AI | Groq API (llama-3.1-8b-instant) — summaries, flashcards, resume feedback |
| Storage | Cloudinary (images, PDFs) |
| Email | Resend — transactional from `noreply@usecontinuum.dev` (custom domain) |
| Auth | JWT access tokens, httpOnly refresh cookies, Google OAuth 2.0 |
| Monitoring | Sentry (backend `@sentry/node` + frontend `@sentry/react`), PostHog (product analytics + session replay) |
| Deployment | Vercel (frontend) + Render Starter (backend) + Upstash Redis |
| CI | GitHub Actions — Jest, Playwright E2E, and Android unit tests run in parallel on every PR |

---

## Features Built

- **Notes** — rich-text editor with AI summaries, Google Docs import via Google Picker (`drive.file` scope — user selects specific docs) with PDF export and text caching, "View in Google Docs" button on note detail, flashcard extraction, infinite-scroll pagination with `useInfiniteQuery`
- **Flashcards** — study mode with flip cards, per-card progress tracking, AI extraction from notes or PDFs, study history screen, infinite-scroll pagination
- **Tasks** — kanban board with shared tasks, per-participant status tracking, recurrence support, infinite-scroll pagination
- **Calendar** — month and week views sharing a single `selected` state in the parent component; clicking a day in either view updates a bounded right sidebar (max-height, scrollable) rather than an inline expansion panel; overdue tasks in a fixed-height scrollable container so they never push content off screen
- **Notifications** -- in-app notification bell (sidebar header + marketing nav when logged in) with unread badge, dropdown showing the 10 most recent, and a full history page (`/notifications`) grouped by Today / This week / This month / Earlier with IntersectionObserver infinite scroll. 8 event types: `new_message`, `share_received`, `task_assigned`, `comment_added`, `comment_reply`, `like_added`, `friend_request`, `friend_accepted`. Real-time badge updates via Socket.io `new_notification` event (payload includes `type` + `targetId` for suppression decisions). Bell is suppressed when the user is already viewing the active conversation -- matching Slack, Discord, and iMessage's pattern. `friend_request` notifications navigate to `/users/view` so you can accept/decline directly from the notification. `like_added` and `comment_reply` include `resourceId`/`resourceType` metadata so they navigate to the actual note/task, not just `/activity`. Duplicate message fix: socket handlers call `socket.off()` before `socket.on()` to prevent listener stacking on re-renders and React StrictMode double-invoke; messages append (not prepend) with `_id` dedup guard. 90-day TTL. Debouncing per actor+target. PostHog events on every interaction.
- **Social** -- friend requests, activity feed revamped to show what friends are *creating* (research-backed: Instagram, LinkedIn, Canvas all separate "ambient friend activity" from "directed notifications"). Activity shows `note_created`, `note_shared`, `flashcard_set_created`, `flashcard_shared`, `task_created`, `comment_added` -- creator actions that provide study-group motivation. `like_added` removed from activity (micro-reaction, lives only in notifications). `activityVisibility` setting respected: `private` users are completely absent from friends' feeds; historical activities from before a user went private remain visible. Direct messaging with real-time socket delivery (no polling), profile photos in feed and comments.
- **Career** — job application tracker with status pipeline, AI resume feedback (scored section-by-section), contacts and reminders per application, inline PDF resume viewer (iframe modal matching Android's in-app viewer)
- **Auth** — email/password and Google OAuth (`drive.file` scope — non-sensitive, no CASA assessment required) with JWT + httpOnly refresh cookie rotation
- **Mobile marketing page** — purpose-built waitlist landing page shown to visitors on phones and tablets (<1024px). Hero split layout (text + iPhone device frame), six feature highlights each with a mini device preview, platform-interest waitlist form (iOS/Android/Both), Resend welcome email with platform-personalized copy. `/privacy` and `/terms` serve mobile-optimized legal pages without hitting the gate. Legal docs on Android now open in the device browser via `LocalUriHandler` instead of an in-app screen.
- **Dashboard** — accurate total counts pulled from paginated response metadata (not capped list lengths)
- **Onboarding** — goal-personalized multi-step profile setup (web full-page, Android full-screen) → activation step with coach mark on the goal-relevant CTA; "Show me everything" goal opens the full 11-step feature tour instead. Replay tour available from Profile on both platforms. Web tour uses a React portal-rendered backdrop (bypasses CSS stacking context from `animation-fill-mode: both`) + pulsing purple ring via `getBoundingClientRect` screen coords. Android replay tour uses a `TourOverlay` composable (full-width bottom card, dimmed backdrop, back/next/skip) that navigates through each section in sidebar order while showing the real app UI behind it. Demo and seed accounts bypass all onboarding flows.

---

## System Design Decisions (The Ones That Matter in Interviews)

### 1. Cursor Pagination on the Activity Feed

**What I built:** Compound cursor using `(createdAt, _id)` tuple instead of offset pagination.

**Why it matters:**
- Offset pagination at scale requires scanning N rows to skip past them. At 10,000 items, offset 9,990 scans 9,990 rows for 10 results. Cursor-based doesn't scan what you've already seen.
- A timestamp-only cursor breaks when two activities are created in the same millisecond — items get skipped on page 2+. The compound `(createdAt | _id)` cursor guarantees stable ordering regardless of timestamp collisions.
- Each cursor page is immutable — new items always land above the cursor, never inside a cached page. This makes Redis caching of individual pages safe.

**The query:**
```js
const pagedFilter = cursorTs
  ? { $and: [baseFilter, { $or: [
      { createdAt: { $lt: cursorTs } },
      { createdAt: cursorTs, _id: { $lt: cursorId } }
    ]}]}
  : baseFilter;
```

---

### 2. Redis Caching — Fail-Open + Full Cross-User Invalidation

**What I built:** `getOrSet(key, ttlSeconds, fetchFn)` — check cache, miss → call fetchFn, store, return. `invalidatePattern(prefix)` wipes all search/filter/page variants for a user in one SCAN call on every mutation.

**Why it matters:**
- Fail-open: if Redis goes down, cache misses fall through to MongoDB. No cascade failure.
- `invalidatePattern` invalidates ALL affected users on every write — not just the actor. On a social platform this matters: if user A shares a note with user B, user B's `notes:` cache is wiped immediately so they see the shared note on next load. Without cross-user invalidation, user B would see stale data until TTL expires.
- Scoped per user: one user's cache never bleeds into another's.

**Cache keys (all hot list endpoints):**
- `conversations:{userId}` — 30s TTL. `sendMessage` and `startConversation` invalidate both participants; `markAsRead` and `deleteConversation` invalidate actor only.
- `friends:{userId}:{status}:{search}` — 60s TTL. Every friend mutation (request/accept/decline/cancel/remove) invalidates both sides of the friendship.
- `notes:{userId}:{search}:{type}:{page}:{limit}` — 60s TTL. `shareNote(friends)` queries accepted friendships and invalidates all of them. Cache key includes `limit` to prevent collisions between Dashboard (limit:3) and NotesList (limit:20).
- `tasks:{userId}:mine:{search}:{status}:{page}:{limit}` — 30s TTL. `invalidateSharedTasksCache` wipes `tasks:{uid}` and `calendar:{uid}` for all participants + owner on every task mutation. Cache key includes `limit` to prevent Dashboard/Kanban collisions.
- `calendar:{userId}:{fromDate}:{toDate}` — 30s TTL. Wiped by all task mutations via `invalidateSharedTasksCache`.
- `flashcardSets:{userId}:{search}:{page}:{limit}` — 60s TTL. `shareSet` invalidates actor + all recipients.
- `activity:{userId}:first` — 5min TTL. `notifyActivityAudience` (called by activity.service.js) wipes all users in the `visibleTo` array after every activity write.
- `applications:{userId}:{search}:{status}` — 120s TTL. Actor only (private data). Note: backend ignores `limit` param and returns all applications — cache key does not include limit.
- `shared-tasks:{userId}` — 60s TTL. Legacy key for `/tasks/shared` endpoint.

**Local dev:** If `REDIS_URL` is not set, all operations are no-ops. Never blocks development.

---

### 3. httpOnly Cookie for Refresh Tokens

**What I built:** Access tokens (JWT, 1 day) sent in response body. Refresh tokens (30 days) sent as httpOnly, Secure, SameSite=None cookies. Raw token never stored — only SHA-256 hash in MongoDB.

**Why it matters:**
- httpOnly cookies can't be read by JavaScript. An XSS attack that runs a malicious script cannot steal the refresh token.
- SameSite=None + Secure enforces HTTPS and blocks cross-site cookie abuse.
- Storing the SHA-256 hash means a database breach exposes hashed tokens, not the raw tokens that would let an attacker impersonate users.
- Token rotation: on 401, frontend calls `/api/auth/refresh` — browser automatically sends the httpOnly cookie, no manual token management.
- Refresh token rotation: each `/auth/refresh` call immediately revokes the old token and issues a new one. A stolen refresh token can only be used once before rotation invalidates it.

**Rotation flow:**
1. Login → JWT in body, refresh token in httpOnly cookie
2. JWT expires → 401
3. Axios interceptor POSTs to `/api/auth/refresh` (cookie sent automatically)
4. Old refresh token revoked, new httpOnly cookie set
5. New JWT returned, original request retried

---

### 4. Google OAuth with One-Time Codes

**What I built:** Backend callback doesn't issue JWT directly. Instead generates a 16-byte one-time code (SHA-256 hashed, 60s TTL in OAuthCode collection). Frontend exchanges the code for JWT + refresh cookie via `POST /api/auth/google/exchange`.

**Why it matters:**
- The JWT never appears in the browser URL (`?token=...`). Browser history, server logs, and analytics tools never see it.
- The code is single-use and auto-deletes after 60 seconds. Even if intercepted, it's worthless after first use.
- Mobile apps and web apps both handle a short one-time code cleanly — no special URL parsing for a long JWT string.

---

### 5. Socket.io with Redis Pub/Sub Adapter

**What I built:** Every user joins a private `user:{id}` room on connect. Controllers emit events to those rooms after writes. The `@socket.io/redis-adapter` routes events across all backend instances via Redis pub/sub.

**Why it matters:**
- Without the adapter, two users on different backend instances can't communicate in real-time — User A's event never reaches User B's instance.
- With the adapter, every instance subscribes to the same Redis pub/sub channel. Event from any instance reaches all relevant user rooms, regardless of which instance they're connected to.
- This means the app is horizontally scalable from day one. Adding a second backend instance requires zero code changes.

**Initialization:**
```js
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
}
```

---

### 6. Diagnosing Real-Time Failures with Playwright

**What happened:** After building the real-time messaging layer (Socket.io + React Query invalidation), messages weren't appearing in real-time for recipients. Users had to reload. The symptom was clear but the cause wasn't obvious from code review alone.

**How I diagnosed it:** Wrote a Playwright script with two browser sessions. One session (Justin) had a DOM mutation observer attached to the message thread. The other sent a message via raw API call using the second user's token (obtained via a `fetch` login call). Zero mutations fired on Justin's session — the socket event never arrived.

Traced the path: backend emits to `user:${otherParticipantId}`. Socket.io middleware puts the user in `user:${socket.userId}`. Found the mismatch: the JWT payload uses `{ userId: "..." }` but the socket middleware read `decoded.id` — always `undefined`. Every user was joining `user:undefined`. All socket events were silently discarded.

**Fix:** One line in `backend/lib/socket.js`: `socket.userId = decoded.userId` (was `decoded.id` — a field that doesn't exist in the JWT payload). Restores real-time delivery for every feature — messages, friend requests, task updates, note shares, activity, comments.

**Why it matters in interviews:** Shows systematic debugging. Didn't guess — instrumented the actual system to confirm the failure mode before touching code. Playwright as a diagnostic tool, not just a test runner.

---

### 7. Instagram-Style UX: Viewport Prefetching + Optimistic Updates

**What I built:** Three-layer approach to making the app feel instant:

**Layer 1 — Viewport prefetching (Instagram approach):**
Instagram's engineering blog describes prefetching based on what's *visible*, not what's hovered, using `requestIdleCallback` so prefetches don't compete with scroll/animation frames.

Built a `prefetchQueue.js` singleton that runs one prefetch at a time. Each conversation row in the messages sidebar uses `IntersectionObserver` — when a conversation enters the viewport, its messages are queued for prefetch at idle priority. By the time the user clicks, the data is already in the React Query cache. Zero loading spinner.

Also built `usePrefetchOnIntent` (hover with 150ms delay) for nav links, and feed-forward prefetching in `Conversation.jsx` — when you open a conversation, the next one in the inbox is silently prefetched.

**Layer 2 — Optimistic updates:**
Every user-triggered mutation updates the React Query cache immediately via `onMutate` before the server responds. Rollback via `onError` with a toast so the user is never left confused by a silent state change. Covered: accept/decline/cancel/remove friend, note delete, task status/delete, flashcard set delete, application stage update.

**Layer 3 — Stale-while-revalidate:**
`gcTime: 30min` keeps the React Query cache alive for a full session. Return visits to any page are always instant (data shows from cache while background refetch runs silently). Fixed two `staleTime: 0` overrides that were forcing a server round-trip on every component mount. Added `placeholderData: (prev) => prev` to all filtered list queries so changing a search term never blanks the list.

**Why it matters:** These are the same patterns Instagram, TikTok, and Twitter use. The user never sees a loading state they don't have to see.

---

### 8. Kanban All-At-Once Loading + React Query Cache Key Consistency

**The problem:** The Kanban task board showed only 20 of 26 tasks on first visit when navigating from the sidebar. The bug was silent — no error, no spinner, just missing cards.

**Root cause — two-layer:** The sidebar prefetches tasks on hover using `prefetchInfiniteQuery`. The page loads tasks using `useInfiniteQuery`. Both shared the same React Query cache key `['tasks', 'mine', '']`. But the sidebar was prefetching with `limit: 20` while the page queried with `limit: 100`. React Query found the cached entry (from the sidebar's prefetch), saw `pagination.pages: 2` from the 20-item page, and fetched "page 2 at limit 100" — which was empty, since 26 tasks fit in one page at limit 100. Board rendered 20 tasks and stopped.

**Fix — cache key alignment:** Both the sidebar prefetch and the page query must use identical params. `prefetchInfiniteQuery` writes to the same cache slot as `useInfiniteQuery` — any mismatch in `limit` writes a page with wrong `getNextPageParam` metadata that poisons all subsequent fetches.

**Why Jira-style all-at-once:** A Kanban board can't render "partially" — a task on page 2 that belongs in the "In Progress" column would simply be missing from that column with no indication. The board must wait for all pages before painting.

**Solution:** `useInfiniteQuery` with `limit: 100` per page + auto-chain via `useEffect`:
```js
useEffect(() => {
  if (hasNextPage && !isFetchingNextPage) fetchNextPage();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

**The timing trap — `isFetchingNextPage` vs `hasNextPage`:**
Holding the skeleton with `isLoading = ownLoading || isFetchingNextPage` has a one-render gap: page 1 resolves → `ownLoading=false`, `isFetchingNextPage=false` (the `useEffect` hasn't fired yet, it's post-render). The board briefly paints with 26 tasks missing their later pages before the second fetch starts.

`hasNextPage` is synchronously derived from the last page's `getNextPageParam` — it's `true` the moment page 1 resolves with `pagination.page < pagination.pages`. No render gap:
```js
const isLoading = ownLoading || hasNextPage;  // skeleton holds until ALL pages are in
```

**Why it matters:** Cache key discipline is a real production issue. Any time two callers share a React Query key with different params, one's stale data poisons the other's pagination metadata. The rule: if two queries share a key, they must share every param that affects pagination.

---

### 9. Four-Tier Rate Limiting

**What I built:**
- **Global:** 300 req/15 min per IP (all `/api/*`)
- **Auth:** 10 req/15 min (login, register, forgot-password)
- **Per-user writes:** 30 req/min keyed by userId (messages, comments, share)
- **AI burst:** 5 req/min + daily cap per type (25 summaries/day, 25 flashcard sets/day, 5 resumes/day)

**Why it matters:**
- Auth endpoints need a tight limit to block brute-force credential attacks.
- Global IP-based limit catches bots and scrapers before they reach controllers.
- Per-user write limits prevent a single logged-in user from spamming the DB.
- AI daily caps control Groq API costs — even if per-minute limits are reset, the daily cap holds.
- In `NODE_ENV=test`, limits are disabled. In dev, multiplied by 20 so they never trigger during normal work.

---

### 10. Encrypted Google OAuth Tokens at Rest

**What I built:** Google access/refresh tokens encrypted with AES-256-GCM before storage on User document. Key stored in `GOOGLE_TOKEN_ENCRYPTION_KEY` env var (separate from DB credentials).

**Why it matters:**
- If MongoDB is compromised, encrypted tokens are useless without the encryption key.
- Encryption key lives in environment variables, not source control, and is completely separate from the database password. An attacker needs both to decrypt anything.
- Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 11. Denormalization for Performance

**Pattern:** Frequently-accessed data is cached on parent documents to avoid N+1 queries.

**Examples:**
- `Comment.userSnapshot` — username, avatar, name captured at creation time. Comment threads render without querying User N times.
- `Conversation.lastMessage` — senderId, content, sentAt stored on Conversation. Message list renders without querying Message per conversation.
- `Conversation.unreadCounts[]` — per-user count stored on Conversation. No COUNT query needed.
- `Activity.metadata` — contextual info (noteTitle, commentPreview) stored inline. Feed renders without populating related documents.
- `Note.hasFlashcards` — boolean flag avoids querying FlashcardSet to display a badge.

---

### 12. Polymorphic Comments with Threading

**What I built:** Single Comment collection with `targetType` (note/flashcardSet/task) + `targetId`. Compound index on `(targetId, targetType, createdAt)`. Threading via `parentId`. Likes stored as array of user IDs on the comment.

**Why it matters:**
- One schema instead of NoteComment, TaskComment, FlashcardComment. Queries, indexes, and API surface all consolidate.
- `userSnapshot` pre-save hook means no N+1 on User lookups in comment threads.
- `parentId` threading allows nested replies without recursive queries — fetch all comments for a target in one query, build tree client-side.

---

### 13. 30-Day Account Deletion Grace Period

**What I built:** `DELETE /api/auth/me` sets `pendingDeletion: true` and `scheduledDeletionAt: now + 30 days`. Logging in during grace period restores the account. Hard deletion (cascade to all data + Cloudinary) runs lazily when `scheduledDeletionAt` passes.

**Why it matters:**
- Soft delete protects against accidental deletion. User has 30 days to recover.
- Lazy hard delete means the HTTP response never blocks on a potentially slow cascade operation.
- `POST /api/auth/me/restore` gives users a dedicated restore endpoint during the grace period.
- GDPR-friendly: data is actually deleted (not just hidden) after the grace period.

---

## REST API Design

### What REST Means and Why It Matters

REST (Representational State Transfer) is an architectural style for designing networked APIs. It uses standard HTTP methods and URLs to represent resources and actions. Continuum's API is fully RESTful — every decision about URL structure, HTTP verbs, and status codes was intentional.

**The six REST constraints Continuum follows:**
1. **Client-Server** — Frontend and backend are completely separate. The React app talks to the Express API over HTTP. Either can be replaced independently.
2. **Stateless** — Every request includes all information needed to process it (the JWT in the Authorization header). The server stores no session state between requests.
3. **Cacheable** — Responses that can be cached are (Redis, 5-minute TTL). Responses that mutate state explicitly invalidate the cache.
4. **Uniform Interface** — Consistent URL structure, consistent response shape `{ success, data/error }`, consistent HTTP verbs across all 16 route groups.
5. **Layered System** — The client doesn't know if it's hitting a single server or a load-balanced cluster behind Render. The Redis adapter makes this transparent.
6. **Code on Demand (optional)** — Not used (standard for REST APIs).

---

### HTTP Methods — How Each Is Used

| Method | Used for | Continuum examples |
|--------|----------|--------------------|
| `GET` | Read — never mutates state | `GET /api/notes`, `GET /api/auth/me`, `GET /api/activity` |
| `POST` | Create or non-idempotent action | `POST /api/notes`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| `PUT` | Full replace of a resource | Not used (all updates are partial — PATCH is more appropriate) |
| `PATCH` | Partial update | `PATCH /api/notes/:id`, `PATCH /api/auth/me/profile`, `PATCH /api/auth/me/password` |
| `DELETE` | Remove a resource | `DELETE /api/notes/:id`, `DELETE /api/auth/me`, `DELETE /api/conversations/:id` |

**Why no PUT?** PUT semantics require sending the full resource body — if you omit a field, it gets nulled out. PATCH is safer for partial updates (update just the title, leave everything else). Continuum uses PATCH everywhere updates are partial, which is all of them.

---

### URL Structure — Resource Naming Conventions

URLs represent nouns (resources), not verbs (actions). HTTP methods provide the verb.

**Correct:**
```
GET    /api/notes          → list all notes
POST   /api/notes          → create a note
GET    /api/notes/:id      → get one note
PATCH  /api/notes/:id      → update a note
DELETE /api/notes/:id      → delete a note
```

**Sub-resources for nested relationships:**
```
GET    /api/notes/:id/comments       → get comments for a specific note
POST   /api/notes/:id/generate-summary   → AI action scoped to a note
POST   /api/flashcard-sets/:id/cards     → add a card to a set
DELETE /api/flashcard-sets/:id/cards/:cardId  → remove a specific card
```

**Actions that don't fit CRUD — use POST with a descriptive path:**
```
POST /api/auth/refresh           → exchange refresh token for new JWT
POST /api/auth/logout            → revoke current session
POST /api/auth/logout-all        → revoke all sessions (all devices)
POST /api/auth/me/restore        → cancel pending account deletion
POST /api/notes/:id/import       → import from Google Drive
POST /api/resumes/:id/feedback   → trigger AI feedback generation
```

**Why not `GET /api/auth/logout`?** GET requests must be safe (no side effects, cacheable). Logout revokes a token — that's a mutation. It must be POST.

---

### HTTP Status Codes — Every Code Used and Why

| Code | Meaning | When Continuum uses it |
|------|---------|------------------------|
| `200` | OK | Successful GET, PATCH, DELETE, POST (non-creation) |
| `201` | Created | Successful POST that creates a resource (register, create note, create task) |
| `204` | No Content | Not used — Continuum always returns a body for consistency |
| `400` | Bad Request | Invalid input, missing required fields, validation failure |
| `401` | Unauthorized | Missing or invalid JWT, expired token, wrong password |
| `403` | Forbidden | Valid JWT but insufficient permission (e.g., editing someone else's note, account pending deletion) |
| `404` | Not Found | Resource doesn't exist or belongs to another user (same response — don't leak existence) |
| `409` | Conflict | Duplicate unique field (email already taken, username already taken, friendship already exists) |
| `429` | Too Many Requests | Rate limit hit (any of the 4 tiers) |
| `500` | Internal Server Error | Unhandled exception — message hidden in production |

**Why return 404 instead of 403 when a resource belongs to another user?**
If `GET /api/notes/123` returns 403, an attacker learns that note 123 exists and belongs to someone else. Returning 404 hides that fact — same response whether the note doesn't exist or belongs to another user. This is called "security through obscurity" and it's a legitimate API design pattern for user-owned resources.

**Why always return a body?** 204 No Content is technically correct for DELETE but forces every client to handle the empty response case. Returning `{ success: true }` is consistent and simpler for the frontend to process.

---

### Consistent Response Shape

Every single response from Continuum's API follows this shape:

**Success:**
```json
{ "success": true, "note": { ... } }
{ "success": true, "notes": [ ... ] }
{ "success": true, "token": "eyJ..." }
```

**Failure:**
```json
{ "success": false, "error": "Title is required" }
{ "success": false, "error": "Invalid or expired token" }
```

**Why this matters:**
- Every frontend component handles errors identically: `if (!res.data.success) showError(res.data.error)`
- Error messages are never raw Mongoose/MongoDB errors in production — they're mapped to user-friendly strings
- The `success` boolean lets clients distinguish success from failure without inspecting status codes (though both are always set correctly)

---

### Authentication on Every Request

Protected routes use `authMiddleware` before the controller. The middleware:

1. Extracts the JWT from `Authorization: Bearer <token>` header
2. Verifies signature + expiry with `jwt.verify()` — throws if tampered or expired
3. Looks up the user by `decoded.userId` — first checks Redis cache (`user:{id}`, 5 min TTL), then MongoDB on cache miss
4. Checks `pendingDeletion` — if grace period expired, hard-deletes the user lazily and returns 401. If within grace period, only allows restore/logout paths.
5. Attaches `user` object to `req.user` for the controller

**The cache here is critical.** Auth middleware runs on every protected request. Without caching, every request would hit MongoDB to verify the user still exists. With a 5-minute Redis cache, 99%+ of auth checks are served from memory.

```js
user = await getOrSet(`user:${decoded.userId}`, 300, () => User.findById(decoded.userId));
```

---

### Idempotency

REST requires that GET, PUT, and DELETE be idempotent (same result no matter how many times you call it). PATCH and POST are not required to be idempotent.

**How Continuum handles this:**
- `DELETE /api/notes/:id` — returns 200 even if already deleted (soft delete sets deletedAt, second call finds deletedAt already set and returns 404 gracefully)
- `POST /api/auth/logout` — always returns 200, even if token is already revoked (idempotent by design — safe to call multiple times)
- `POST /api/friends/respond/:id` — accepting the same friend request twice returns 400 (already accepted) — not idempotent, intentional

---

### Route Groups and Their Responsibility Split

Controllers are single-responsibility — one per resource, one function per endpoint:

```
auth.controller.js      → identity and session management only
notes.controller.js     → note CRUD + AI + Google Drive + sharing
tasks.controller.js     → task CRUD + participant management
activity.controller.js  → feed queries only (no writes — written by services)
```

The **Activity controller never writes directly.** Activities are created by `activity.service.js` which is called by other controllers (notes, tasks, comments) after their primary write succeeds. This keeps the concern separated — the notes controller doesn't know or care about activity feed mechanics.

---

### Swagger/OpenAPI Documentation

Every endpoint is documented with JSDoc annotations in the route file:

```js
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, username, password]
 *     responses:
 *       201:
 *         description: Account created — returns JWT and user
 *       409:
 *         description: Email or username already taken
 */
router.post('/register', authLimiter, authController.register);
```

`swagger-jsdoc` reads these annotations and generates an OpenAPI 3.0 spec at startup. `swagger-ui-express` serves an interactive UI at `/api-docs`. Every endpoint has live "Try it out" support — paste a JWT, execute any request directly from the browser.

**Production:** https://continuum-backend-yrrr.onrender.com/api-docs

---

### Middleware Chain — What Happens on Every Request

For a typical protected write endpoint like `PATCH /api/notes/:id`:

```
Request
  → helmet()              # security headers
  → cors()                # origin check
  → cookieParser()        # parse httpOnly cookies
  → bodyParser.json()     # parse JSON body (200KB limit)
  → mongoSanitize()       # strip $ and . from inputs
  → apiLimiter            # 300 req/15min per IP
  → router.param('id')    # validateObjectId — reject non-ObjectId params immediately
  → authMiddleware        # verify JWT, attach req.user (Redis cache → MongoDB)
  → authController.updateNote  # business logic
  → global error handler  # catch anything thrown in controller
Response
```

Each layer has a single job. If any layer rejects the request (wrong origin, invalid token, bad ObjectId, rate limit hit), the chain stops and the controller never runs.

---

## Security Measures

| Area | Implementation |
|------|----------------|
| Passwords | bcryptjs cost factor 12 |
| Refresh tokens | SHA-256 hash in DB, raw token in httpOnly cookie |
| Password reset tokens | SHA-256 hash, 1-hour TTL |
| Google OAuth tokens | AES-256-GCM encryption at rest |
| JWT | HS256 signed, 1-day TTL |
| NoSQL injection | mongo-sanitize strips `$` and `.` from all inputs |
| XSS | sanitize-html on user content, httpOnly cookies, CSP header |
| CSRF | SameSite=None + Secure on refresh cookie |
| Route params | validateObjectId middleware before every DB query |
| Rate limiting | 4-tier (global, auth, per-user write, AI) |
| HTTP headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| CORS | Whitelist of allowed origins, credentials: true |
| File uploads | PDF-only, 10 MB limit |

A formal security audit lives at `docs/security/backend_security_audit.md`.

---

## Testing

Continuum has three test layers, all running in parallel on every PR via GitHub Actions.

### 1. Backend — 314 Jest + Supertest integration tests across 20 suites

| Suite | What it covers |
|-------|----------------|
| Auth | Register, login, refresh via httpOnly cookie, tampered tokens, password not leaked |
| Auth (Mobile) | Mobile-specific token endpoints, `TokenAuthenticator`-equivalent refresh flow, device-bound sessions |
| Notes | CRUD, ownership isolation (Alice can't read Bob's notes), paginated list responses |
| Tasks | CRUD, status updates, shared tasks (participant visibility, owner exclusion), paginated list responses |
| Flashcards | Create set, add card, ownership isolation, shared sets, paginated list responses |
| Study Sessions | Submit session, load history, streak calculation, per-set history |
| Applications | Create, read, update status, delete (owner-only), contacts, reminders |
| Messages | Friend flow → conversation → send → read, non-participant blocked, soft delete |
| Notifications | CRUD endpoints, auth guards, unreadCount, cursor pagination; integration tests verify `comment_added` metadata (commentPreview + commentId), `like_added` metadata (resourceId + resourceType), `comment_reply` metadata (resourceId + resourceType + commentId), `friend_accepted` trigger |
| Activity | Feed auth guard, `note_created` and `flashcard_set_created` appear in friend's feed when `activityVisibility: 'friends'`; private users excluded; private notes don't generate activities; `like_added` invalid type; `since` param unseen count |
| Calendar | Task date filtering, date range queries, month-boundary edge cases |
| Comments | Create, delete, like, ownership isolation, polymorphic target types |
| Friends | Request, accept, decline, cancel, remove, duplicate prevention |
| Profile | View and update own profile, avatar, bio, username uniqueness |
| Resumes | Upload, AI feedback generation, delete, ownership isolation |
| Users | Update settings, password change, account deletion grace period |
| Waitlist | Sign-up, duplicate prevention, validation, platformInterest field, backward-compat when field omitted |
| Share | Note/flashcard/task share flows, permission checks |
| Onboarding | Goal-personalized step computation, completion, replay |
| Google Drive | Import flow, file picker, auth scope verification |

**No real database needed.** `mongodb-memory-server` spins up a real MongoDB process in RAM. Tests run offline, in CI, with zero Atlas configuration.

### 2. Web — 44 Vitest unit tests + Playwright E2E (Chromium)

**Unit tests (Vitest + jsdom)**

| File | What it covers |
|------|----------------|
| `utils.test.js` | `cn` (Tailwind merge), `formatDate`, `formatRelative` (just-now/m/h/d/absolute), `truncate`, `getInitials`, `stripHtml` |
| `errors.test.js` | `friendlyError()` — all ERROR_MAP entries (auth, account, server errors), fallback, null/undefined, plain Error |
| `useNotifications.test.js` | `useNotificationsBell`, `useMarkAllRead`, `useMarkOneRead`, `useDeleteNotification` — API calls, query invalidation |
| `NotificationBell.test.jsx` | Badge rendering (0/count/9+), dropdown open/close/Escape, empty state, item click PATCH + PostHog, mark-all-read; `resolveNav` unit tests for all 7 types including `friend_request → /users/view`, `like_added + metadata → resource`, `comment_reply → resource + commentId` |
| `Notifications.test.jsx` | Time grouping (Today/This week/This month/Earlier), empty state, mark-all-read (source: page), item click PostHog, delete notification |

**E2E tests (Playwright, Chromium)**

Playwright boots the real Express backend (with `mongodb-memory-server`) and the Vite dev server, then drives a headless Chromium browser through the full UI.

| Spec | What it covers |
|------|----------------|
| Auth | Register, duplicate email, login correct/wrong, logout, session persistence |
| Notes | Create, edit, delete (regression: no `old?.pages` TypeError), type filter, search |
| Flashcards | Create set, add card, study mode (reveal → Got it! → Set complete!) |
| Tasks | Create, status change (regression: no `old?.pages` TypeError), dashboard stat count |
| Career | Create application, edit status, delete, Resumes tab renders |
| Mobile | Gate renders at <1024px; desktop renders at ≥1024px; /privacy and /terms accessible without hitting gate; waitlist form validation (platform pills mutually exclusive, submit gated on all three fields); successful signup shows platform-personalized success state; duplicate email error; scroll-to-form from nav and legal pages; "Join the waitlist" on legal pages navigates and scrolls; TOC anchor links |

The `old?.pages` TypeError was a production bug caught by the delete-note and status-change tests. Guard: `if (!old?.pages) return old` in both `NotesList.jsx` and `Tasks.jsx`.

### 3. Android — 176 unit tests (JVM, no emulator)

MockK mocks repository interfaces; `UnconfinedTestDispatcher` makes coroutines run eagerly on the test thread. Runs in ~30s with no emulator.

**ViewModels (10 suites)**

| File | What it covers |
|------|----------------|
| `AuthViewModelTest` | Login/register success and failure, hydrate, logout, resetState |
| `NotesViewModelTest` | Load (fast-path Flow), search query path, createNote, deleteNote, type filter, Drive import |
| `TasksViewModelTest` | Load (fast-path Flow), createTask, moveTask (status change), sharedTab, derived `todoTasks` state |
| `FlashcardsViewModelTest` | Load sets + streak, createSet, startStudy, flipCard, answerCard, session complete |
| `CareerViewModelTest` | Load applications, createApplication, updateStatus, delete, loadResumes, filtered state |
| `DashboardViewModelTest` | Cache-first load, firstName from profile, onboarding redirect, task priority sort, career API mapping |
| `SocialViewModelTest` | Activity load + search, friends/requests, searchUsers, sharedNote, userProfile |
| `OnboardingViewModelTest` | Step computation (new vs replay), advance/skip/goBack, completeTour, exitAll, onGoalSaved |
| `MessagingViewModelTest` | Conversations load, delete, startConversation, messages load, optimistic send, send failure |
| `ProfileViewModelTest` | Load (demo vs non-demo), updateFields, updateUsername (409 conflict), changePassword, logoutAll, deleteAccount, restore |

**Repositories (6 suites)**

| File | What it covers |
|------|----------------|
| `AuthRepositoryTest` | login/register/getMe/forgotPassword/resetPassword/logout/isLoggedIn/loginWithGoogle |
| `NotesRepositoryTest` | Cache-first flow, getCachedNotes, createNote, deleteNote, updateNote, queryNotes (shared), getNoteById (cache fallback) |
| `TasksRepositoryTest` | Cache-first flow, createTask, updateStatus, deleteTask, queryTasks (shared), getTask |
| `CareerRepositoryTest` | getApplicationsFlow, createApplication, updateApplication, deleteApplication, getApplications (search), getResumes, addContact |
| `FlashcardsRepositoryTest` | Cache-first flow, getCachedSets, createSet, deleteSet, querySets (shared), getStreak, updateSet, duplicateSet |
| `MessagingRepositoryTest` | getConversationsFlow, getConversations (search), getMessages, sendMessage, deleteConversation |

**Utilities (2 suites)**

| File | What it covers |
|------|----------------|
| `DateUtilsTest` | `toDisplayDate()` — ISO date conversion, datetime truncation, edge cases (leap day, year-end, padding) |
| `ErrorUtilsTest` | `friendlyError()` — all ERROR_MAP entries, raw message passthrough, blank/colon-prefixed messages |

**GitHub Actions CI** runs all three jobs in parallel on every push and every PR. Failing any test blocks merges to main.

---

## Data Models

16 MongoDB collections across 5 domains:

**Auth:** User, RefreshToken, OAuthCode
**Notes & Learning:** Note (embedded AI summary), FlashcardSet, Flashcard
**Tasks:** Task (with participant tracking and recurrence)
**Social:** Friendship, Comment (polymorphic), Conversation, Message, Activity, Notification
**Career:** Resume (embedded AI feedback), Application
**Mobile:** SyncQueue

Notable schema decisions:
- AI summaries embedded on Note (not a separate collection) — always read together
- AI feedback embedded on Resume as an array — multiple generations preserved
- Activity has a 90-day TTL index — MongoDB auto-deletes old feed items
- Notification has a 90-day TTL index — matches Activity retention (industry standard: Instagram ~90 days, GitHub 3 months)
- OAuthCode has a 60-second TTL index — MongoDB auto-deletes used/expired codes
- Friendship uses ordered (user1 < user2) pair to prevent duplicate records
- Notification uses `Schema.Types.Mixed` metadata for flexible per-type context (commentPreview + commentId for comments; resourceId + resourceType for likes so the bell can navigate to the actual resource)

---

## Frontend Architecture

**27 pages, 26 UI components, 0 component libraries.** Everything is custom-built with Tailwind CSS.

Key implementation decisions:
- **React Query v5** for all server state — `gcTime: 30min` keeps the cache alive for a full session so return visits are always instant (stale-while-revalidate); `placeholderData: (prev) => prev` on all filtered list queries so search/filter changes never blank the list
- **`useInfiniteQuery` for paginated lists** — Notes, Flashcard Sets, and Tasks all use server-side pagination with auto-chain. Tasks uses `limit: 100` per page with `useEffect` auto-chaining (`fetchNextPage` until `hasNextPage` is false), holding the skeleton via `isLoading = ownLoading || hasNextPage` until ALL pages are fetched — board renders all-at-once like Jira. Dashboard total counts pulled from `pages[0].pagination.total`, not `pages.flatMap().length`.
- **Cache key consistency** — `prefetchInfiniteQuery` in the sidebar and `useInfiniteQuery` in the page share the same cache key and must use identical params (including `limit`). Mismatch writes a page with wrong `getNextPageParam` metadata, poisoning all subsequent fetches. See [Section 8](#8-kanban-all-at-once-loading--react-query-cache-key-consistency) for the full story.
- **Optimistic mutation guards** — all `onMutate` cache updaters guard `old?.pages` before calling `.map()`. Without this, a mutation firing before the first page resolves throws `TypeError: Cannot read properties of undefined (reading 'length')`.
- **Axios interceptor** deduplicates concurrent 401s — all in-flight requests queue behind one shared refresh promise, preventing N parallel refresh calls
- **Skeleton loaders** on every data-fetching page — shimmer animation, no layout shift
- **Viewport prefetch** — conversation rows, friend cards, and activity items use `IntersectionObserver` + `requestIdleCallback` to prefetch their detail data when they scroll into view; sidebar nav links use hover-intent prefetch (150ms delay). A module-level `prefetchQueue` ensures prefetches run sequentially to avoid saturating the API on mount.
- **Error boundaries** around major page sections — one crash doesn't take down the whole app
- **withCredentials: true** on axios — httpOnly cookies sent automatically with every request
- **Scroll restoration** — `ScrollToTop` component listens to `pathname` changes and scrolls both `window` and the `<main class="overflow-y-auto">` container. The `<main>` container is the actual scrollable element in `AppLayout`; `window.scrollTo` alone has no effect on it.

---

## Development Process

### Git Workflow
- **Branch naming:** `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`
- **Commits:** Conventional commit format — `feat: add cursor pagination`, `fix: $or overwrite on paginated filter`
- **PRs:** Descriptive bodies, issue references, test plan checklist
- **Protected main:** CI must pass before any merge

### Documentation
- Swagger/OpenAPI spec auto-generated from JSDoc and served at `/api-docs`
- Full system design diagram set (architecture, write/real-time flow, auth flow, production deployment, scaling path)
- ERDiagram for all 15 collections with field-level annotations
- Formal security audit with severity ratings (H1–H4, M1–M8, L1–L4)
- Rollback strategy covering Render, Vercel, and MongoDB
- Agile workflow guide with branch conventions, commit types, and PR format

### Deployment
- **Frontend:** Vercel with `vercel.json` SPA rewrite — all routes serve `index.html`
- **Backend:** Render Starter — `node server.js`, all env vars configured
- **Redis:** Upstash (`rediss://` TLS) — Socket.io pub/sub + read-through cache
- **Database:** MongoDB Atlas M0
- **Monitoring:** Sentry — backend initialized via `instrument.js` before Express loads; frontend initialized in `main.jsx` before React renders. Captures unhandled exceptions and surface-level errors in production.

---

## Android Architecture

The native Android app (Kotlin 2.1 + Jetpack Compose) was built to achieve full feature parity with the React web app. Key architectural decisions:

**Why native Kotlin, not React Native:**
- EncryptedSharedPreferences with Android KeyStore (AES-256-GCM in hardware secure enclave) — no React Native equivalent
- Google Credential Manager for phishing-resistant Sign-In (native API, no WebView)
- `FLAG_SECURE` on sensitive screens (`NoteDetail`, `ResumeDetail`, `ApplicationDetail`, `ConversationDetail`, `SharedNoteView`) — prevents screenshots and strips them from the recent apps thumbnail
- Compose renders directly to the Android canvas — zero JS bridge overhead for gesture-heavy study mode

**Mobile-specific auth pattern:**
- Web uses httpOnly cookies for refresh tokens; Android can't read browser cookies
- 4 mobile-specific backend endpoints (`mobile/login`, `mobile/refresh`, `google/mobile`, `mobile/logout`) return tokens in the JSON body instead of cookies
- Tokens stored in EncryptedSharedPreferences backed by Android KeyStore
- OkHttp `TokenAuthenticator` handles 401 recovery with automatic request queuing (equivalent to web's Axios interceptor, but OkHttp deduplicates refresh calls natively)

**Pagination on Android:**
- Notes, Flashcard Sets, and Tasks all use multi-page fetches: the repository fetches page 1 to get `pagination.pages`, then fires all remaining page requests in parallel and merges the results
- Room is updated with the full merged list and continues to serve as the offline fallback
- This mirrors the web's `useInfiniteQuery` approach while giving Room a complete local cache rather than a single page

**Offline layer (Android-only):**
- Room SQLite database as local cache (ViewModels read Room first, then API)
- SyncQueue entity queues mutations made while offline
- WorkManager `SyncWorker` syncs pending items via `POST /api/sync` on reconnection
- `NetworkMonitor` (ConnectivityManager-based StateFlow) drives a global OfflineBanner

**Cross-screen reactivity:**
- `DataRefreshNotifier` (SharedFlow) — ViewModels emit `RefreshScope` events on mutations; DashboardViewModel subscribes and auto-reloads
- `ProfileUpdateNotifier` — Triggers nav avatar refresh after profile edits
- `TokenManager.logoutEvent` — Broadcasts remote session invalidation; AppNavHost navigates to login with a "Your session was ended from another device" message

**Demo mode:**
- `LocalIsDemo` CompositionLocal is provided by `AppNavHost` from the JWT payload's `isDemo` flag
- Every screen that would write data gates its affordances behind this flag — create/edit/delete buttons are hidden, FABs are suppressed, and settings toggles are disabled
- Matches the web app's read-only demo behavior exactly, including the same banner copy and register CTA

**User profile parity:**
- `UserProfileScreen` mirrors the web `UserProfile` page: viewing your own profile redirects to the Profile tab; viewing a friend's profile loads their shared notes, tasks, flashcard sets, and activity feed slice in parallel via `SocialRepository.getFriendProfileExtras()`
- `OwnerRefJsonAdapter` handles the backend's flexible `userId` shape — some responses return a string ID, others return a populated `{ "_id": "..." }` object. The adapter is registered on the Moshi instance in `ApiClient` so all DTOs deserialise both shapes transparently
- Comment author names and conversation participant avatars navigate to `social/user/{userId}`

**UX patterns:**
- 5-item icon-only bottom nav (Notes, Flashcards, Center Logo → Dashboard, Applications, Profile)
- Instagram-style scrollable dashboard header with logo + action icons
- Flashcard study mode: card flip animation, swipe disabled until answer revealed, "Still Learning" / "Got it" tracking with study session recording to backend; dedicated `FlashcardStudyHistoryScreen` shows per-set and global history
- Slide-in/fade-out navigation transitions (300ms tween)
- Flat cards (Notion-style) for lists; elevated cards (Duolingo-style) for interactive elements
- Profile photos shown in activity feed items, dashboard activity strip, and comment threads

**Google Drive import on Android:** Uses a Chrome Custom Tab (CCT) that opens a backend-served picker page. GIS `initTokenClient` authenticates for the exact Google account linked in the app (via `hint=userEmail`), then the Google Picker dialog opens. On file selection the page redirects to `continuum://drive-pick?id=...&name=...&url=...` — the app receives this as a deep link and triggers the import automatically. URL paste fallback available for environments where CCT can't run. "View in Google Docs" opens via `CustomTabsIntent` (forces Chrome, not the Google Docs app). PDF download uses `DownloadManager` to save to the device Downloads folder with a system notification.

**API coverage:** ~93/108 endpoints (~86%). Remaining gaps are card progress update on Flashcards (tracked client-side during study), resume PDF download, and per-message mark-read/delete (conversation-level flow covers the primary use case).

For full details see `docs/android/architecture.md`, `docs/android/react-to-android.md`, `docs/android/api-coverage.md`, and `docs/android/web-route-parity.md`.

---

## What Makes This Stand Out as a Senior Project

1. **Real architectural decisions** — Cursor pagination, Redis pub/sub, httpOnly cookies, encrypted tokens at rest. Not just "I used React and Node." Every decision has a reason you can defend. The Activity vs Notifications separation is research-validated: studied how Instagram, LinkedIn, GitHub, and Canvas LMS handle the distinction — Activity = ambient creator actions, Notifications = directed personal events, no event appears in both for the same person.

2. **Production-quality security and three-layer test coverage** — Formal security audit, 4-tier rate limiting, AES-256 encryption, one-time OAuth codes, Sentry monitoring, 250 backend integration tests, Playwright E2E catching a real production TypeError (`old?.pages` guard), and Android ViewModel unit tests — all running in parallel CI. Most senior projects have none of this.

3. **Horizontal scaling is already wired** — Redis adapter means you add a second backend instance with zero code changes. That's a real system design answer, not a hypothetical.

4. **The process matches the code** — Conventional commits, protected main, CI on every PR, Swagger docs, schema diagrams. Hiring managers looking at the repo see someone who would fit into a professional engineering team immediately.

5. **Breadth without sacrificing depth** — 30+ screens on Android, 27 pages on web, 15 collections, 108 endpoints (~86% covered on Android), real-time, AI, OAuth, offline sync — and the auth flow is more secure than most production apps.

6. **Deployed and accessible** — Not a localhost demo. Live at a real URL with a public API explorer.

7. **True cross-platform with shared backend** — Web and Android consume the exact same REST API. The Android app adds 4 mobile-specific auth endpoints and a full offline layer — the same pattern used at companies like Instagram and Notion.

---

## Talking Points by Interview Type

### System Design Interview
Lead with cursor pagination — explain why offset fails at scale, why compound keys prevent timestamp collisions, and how Redis caching per cursor page works. Then cover the Socket.io + Redis adapter pattern for horizontal scaling. These are real production patterns, not textbook answers.

### Behavioral / "Tell me about a project"
Built over 8 weeks, solo, for an incubator. Started with a formal security audit before writing a line of frontend code. Used conventional commits and protected branches from day one. Deployed to production with a real CI pipeline blocking bad merges. Then built a native Android app achieving full feature parity with the web in under 2 weeks — including offline support, real-time messaging, and hardware-backed token storage. Both clients share a single backend with zero API duplication.

### Security-Focused Interview
Walk through the auth flow: httpOnly cookie for refresh token (XSS protection), SHA-256 hash in DB (breach protection), refresh token rotation (replay attack prevention — stolen token can only be used once), one-time OAuth codes (no JWT in browser history), AES-256 encrypted Google tokens (defense in depth), 4-tier rate limiting (brute force + abuse prevention). On Android: EncryptedSharedPreferences with Android KeyStore (hardware secure enclave), Credential Manager for phishing-resistant Google Sign-In (no WebView), FLAG_SECURE on sensitive screens, remote logout detection via SharedFlow.

### "Why this stack?"
Express 5 for native async/await error propagation. MongoDB for flexible schema during rapid feature iteration. Redis chosen for dual purpose — caching and Socket.io pub/sub. Groq over OpenAI because free-tier rate limits (14.4K RPD) are viable for a multi-user product at launch. Vercel + Render because both have zero-config deploys for Vite SPA and Node.js respectively. Native Kotlin + Compose over React Native for hardware KeyStore access, Credential Manager, FLAG_SECURE, and 60fps animations without a JS bridge.

### Mobile Architecture Interview
Explain the offline-first pattern: Room database as local cache, SyncQueue entity for offline mutations, WorkManager SyncWorker that batches and uploads on reconnection via POST /api/sync. Cover the TokenAuthenticator pattern — OkHttp natively queues concurrent requests behind a single refresh call, unlike web's Axios interceptor which needs an explicit guard. Discuss DataRefreshNotifier (SharedFlow event bus for cross-screen data freshness) and ProfileUpdateNotifier (nav avatar auto-refresh after profile edits). Cover pagination: the Android repositories fetch all pages on load (parallel page requests after reading `pagination.pages` from page 1), then persist the full merged result to Room — so Room has a complete offline copy, not just one page. Mention `OwnerRefJsonAdapter` as a real-world example of defensive DTO design — the same backend endpoint returns `userId` as either a string or a populated object depending on the query; a custom Moshi adapter handles both shapes transparently so no screen-level null checks are needed. Mention `LocalIsDemo` CompositionLocal for demo mode — a single flag provided at the NavHost level gates all write affordances across every screen without prop drilling.

---

---

## MongoDB & Mongoose — Deep Dive

### Why MongoDB

The decision was intentional, not default. Continuum needed rapid schema iteration during the 8-week build window — adding a new field to a Note doesn't require a migration file, a `ALTER TABLE`, or a deploy coordination. The flexible schema meant shipping features faster without schema debt accumulating.

MongoDB also fits the data access patterns naturally. Notes are always read with their embedded AI summary — embedding the summary on the Note document means one query, not a join. Resume feedback is always read alongside the resume — same reasoning. Where data is always queried together, it's embedded together.

**Where a relational DB would have been better:** The friend graph (Friendship collection) is a natural graph structure that would be more expressive in a graph DB or at least relational. Continuum works around this with ordered pairs.

---

### Schema Decisions Explained

**Ordered pairs in Friendship:**
```js
// user1 is always the lower ObjectId string
user1: { type: ObjectId, ref: 'User' },
user2: { type: ObjectId, ref: 'User' },
```
If user A sends a request to user B and later user B sends one back, you'd get two Friendship documents without this constraint. Forcing `user1 < user2` lexicographically means there's exactly one document per pair. The unique compound index on `(user1, user2)` enforces this at the database level.

**Embedding vs. referencing — the decision rule used:**
- Embed when: data is always queried with the parent, bounded in size, and changes together with the parent
- Reference when: data is shared across documents, large and unbounded, or needs independent querying

Applied: AI summary embedded on Note (always read together, bounded). Flashcards referenced from FlashcardSet (unbounded growth, queried independently in study mode).

**userSnapshot on Comment:**
```js
userSnapshot: {
  username: String,
  firstName: String,
  lastName: String,
  avatar: String,
}
```
Captured at creation time with a Mongoose pre-save hook. A comment thread with 50 comments doesn't require 50 User queries. The tradeoff: if a user changes their username, old comments still show the old name. That's acceptable — most social platforms have this behavior (Twitter/X comments show the username at time of posting).

**TTL indexes:**
```js
// Activity — auto-delete after 90 days
createdAt: { type: Date, expires: 7776000 }

// OAuthCode — auto-delete after 60 seconds
createdAt: { type: Date, expires: 60 }
```
MongoDB's TTL index runs a background thread that deletes expired documents. No cron job, no application code, no external scheduler. The Activity feed stays bounded. OAuth codes self-destruct.

**Compound indexes for query performance:**
```js
// Comment — covers all feed queries
{ targetId: 1, targetType: 1, createdAt: -1 }

// Activity — covers cursor pagination
{ userId: 1, createdAt: -1, _id: -1 }

// Friendship — covers bidirectional friend lookups
{ user1: 1, user2: 1 }
```
Without these indexes, MongoDB does a collection scan on every query. With them, lookups are O(log n) B-tree traversals. The compound index on Activity matches the exact query pattern of the feed: filter by `visibleTo` (which contains userId) then sort by `(createdAt, _id)` — though MongoDB can't use a compound index on an array field for the visibility filter, so that query still uses `userId` on the individual activity document.

---

### Mongoose Middleware

**Pre-save hook for userSnapshot:**
```js
CommentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const user = await User.findById(this.userId).select('username firstName lastName avatar');
    this.userSnapshot = { username: user.username, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar };
  }
  next();
});
```
Runs automatically before every `comment.save()`. The controller doesn't need to know about user lookups — the schema handles it.

**Pre-save hook for password hashing:**
```js
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```
`isModified` check is critical — without it, every `.save()` call would re-hash the already-hashed password, making the stored hash permanently wrong.

---

### aggregate() Does Not Auto-Cast Types

**The bug:** `GET /api/applications/dashboard` returned `{ total: 0, pipeline: [] }` even though the user had 40 applications. The React Query cache was showing the right count (pulled from the list response's pagination metadata), masking the API bug until a direct API call revealed it.

**Root cause:** Mongoose `find()` auto-casts `req.user._id` (a Mongoose ObjectId) to match the `userId` field type in the schema. `aggregate()` does not. The `$match` stage was comparing an ObjectId against documents whose `userId` field was also an ObjectId — but MongoDB's aggregation pipeline evaluated them as different types, returning zero matches.

```js
// WRONG — req.user._id is a Mongoose ObjectId, not cast in aggregate()
{ $match: { userId: req.user._id, deletedAt: null } }

// CORRECT — explicit cast required
const userId = new mongoose.Types.ObjectId(req.user._id.toString());
{ $match: { userId, deletedAt: null } }
```

**Why it matters:** This is a silent failure — no error thrown, just empty results. Any aggregate pipeline that filters on a user-scoped ObjectId field needs an explicit cast. `find()`, `findOne()`, and `findOneAndUpdate()` are safe because Mongoose casts for those automatically; `aggregate()` is raw MongoDB and bypasses Mongoose's type coercion entirely.

---

### Soft Deletes

Several collections use soft delete (`deletedAt` timestamp) rather than hard delete:
- **Notes:** `deletedAt` set on delete, `{ deletedAt: null }` filter on all queries
- **Messages:** `deletedAt: Date` per message, content replaced with `null` on delete (message record preserved for conversation threading)
- **Friendships:** `deletedAt` allows re-friending without duplicate records
- **Account:** `pendingDeletion` + `scheduledDeletionAt` — 30-day grace period, then hard cascade

Hard delete (cascade to Cloudinary assets, all related documents) only runs on account deletion after the grace period.

---

## Real-Time Architecture — Deep Dive

### The Socket.io Initialization Flow

`initSocket(httpServer)` in [backend/lib/socket.js](../backend/lib/socket.js) is called once from `server.js` before `httpServer.listen()`. This attaches Socket.io to the same HTTP server that Express uses — no separate WebSocket server, same port.

```
server.js
  → const httpServer = createServer(app)
  → await initSocket(httpServer)       ← Socket.io attached here
  → httpServer.listen(PORT)
```

### JWT Verification on Handshake

The Socket.io middleware runs before any `connection` event:

```js
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;  // JWT payload uses `userId`, not `id`
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});
```

This means: an unauthenticated WebSocket connection is rejected at the handshake, before the client ever joins a room. No malicious client can subscribe to another user's room. The JWT sent at connect time is the same access token stored in localStorage — if it expires, the socket is rejected, and the frontend reconnects after refreshing the token.

### Private Rooms

After handshake succeeds, the connection handler runs:
```js
io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
});
```

This is the entire connection handler. Every user gets their own private room named `user:{userId}`. Controllers emit events directly to these rooms:

```js
// In messages.controller.js after saving a message:
io.to(`user:${recipientId}`).emit('new_message', { conversationId });
```

The recipient's browser receives this event in real-time and React Query invalidates the messages cache — the UI updates without polling.

### Redis Pub/Sub Adapter — Why It Matters

Without the adapter, Socket.io events only reach sockets connected to the same Node.js process. If User A is on Instance 1 and User B is on Instance 2, and A sends B a message, the event never reaches Instance 2.

With `@socket.io/redis-adapter`, every instance publishes to a shared Redis pub/sub channel. All instances subscribe. An event from any instance fans out to all relevant socket rooms across the entire cluster.

```js
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

Two separate clients are needed because a Redis connection in subscribe mode can't issue other commands. `pubClient.duplicate()` creates an identical connection with independent state.

### Frontend Socket Connection

```js
// web/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(VITE_API_URL, {
    auth: { token },
    withCredentials: true,
  });
  return socket;
}
```

Token is passed in `auth`, which maps to `socket.handshake.auth` on the backend. The socket connects immediately on login/register/hydrate. On logout, `disconnectSocket()` terminates the connection so no events fire for a logged-out session.

### Socket Event → React Query Invalidation Map

| Socket Event | React Query Keys Invalidated | Notes |
|-------------|------------------------------|-------|
| `new_message` | `['messages', conversationId]`, `['conversations']` | Appended to cache (not prepend); deduped by `_id`; unread badge skipped if user is viewing that conversation |
| `new_notification` | `['notifications-bell']`, `['notifications-feed']` | Payload includes `{ type, targetId }` — skipped entirely if `type === 'new_message'` and user is viewing that conversation |
| `friend_request` | `['friends']`, `['friend-requests']` | |
| `friend_accepted` | `['friends']`, `['friend-requests-sent']` | |
| `task_updated` | `['tasks']`, `['calendar']` | |
| `task_created` | `['tasks']`, `['calendar']` | |
| `task_deleted` | `['tasks']`, `['calendar']` | |
| `note_updated` | `['notes']` | |
| `note_shared` | `['notes']` | |
| `note_deleted` | `['notes']` + removes `['note', noteId]` from cache | |
| `comment_added` | `['note', targetId]` or `['flashcard-set', targetId]` or `['tasks']`, + `['activity']` | |
| `like_added` | `['activity']` | |
| `flashcard_shared` | `['flashcard-sets']` | |
| `flashcard_set_deleted` | `['flashcard-sets']` + removes `['flashcard-set', setId]` from cache | |
| `activity_updated` | `['activity']` | |

This is the bridge between real-time events and the UI. When a socket event fires, `queryClient.invalidateQueries()` marks the data as stale. React Query automatically refetches the next time the component is visible or focused. The user sees updated data without a page reload, without polling, and without manual state management.

**Socket token refresh:** After the Axios interceptor silently refreshes a JWT, `updateSocketToken(newToken)` updates the socket's `auth` object so any future reconnection uses the new token — preventing a socket that reconnects after a network blip from failing auth with a stale token.

---

## Redis Caching — Complete Code Walkthrough

### getClient() — Lazy Connection with Fail-Open

```js
async function getClient() {
  if (!process.env.REDIS_URL) return null;   // dev mode — no Redis
  if (client?.isReady) return client;         // reuse existing connection
  if (connecting) return null;                // prevent concurrent connects
  try {
    connecting = true;
    client = redis.createClient({ url: process.env.REDIS_URL });
    client.on('error', () => { client = null; connecting = false; });
    await client.connect();
    connecting = false;
    return client;
  } catch (_) {
    client = null; connecting = false; return null;
  }
}
```

The `connecting` flag prevents a thundering herd: if 10 requests arrive simultaneously and Redis is starting up, only one tries to connect. The others get `null` (fail-open, fall through to MongoDB). The `error` handler resets state so the next request can retry the connection.

### getOrSet() — Cache-Aside Pattern

```js
async function getOrSet(key, ttlSeconds, fetchFn) {
  const c = await getClient();
  if (c) {
    try {
      const cached = await c.get(key);
      if (cached) return JSON.parse(cached);
      const data = await fetchFn();
      await c.setEx(key, ttlSeconds, JSON.stringify(data));
      return data;
    } catch (_) { /* fall through */ }
  }
  return fetchFn();  // Redis unavailable — go to MongoDB
}
```

The outer `try/catch` catches Redis errors mid-operation (e.g., Redis goes down after `get` but before `setEx`). In that case, the function falls through and calls `fetchFn()` directly. The HTTP request succeeds. No cascade failure.

`setEx` stores with an atomic expiry — key is deleted automatically by Redis after `ttlSeconds`. No TTL management code needed in the application.

### checkAiLimit() — Atomic Counter with Daily Reset

```js
async function checkAiLimit(userId, limit, type) {
  const c = await getClient();
  if (!c) return false;  // Redis down — fail open, allow the call
  const today = new Date().toISOString().split('T')[0];  // "2026-03-25"
  const key = `ai:${type}:${userId}:${today}`;
  try {
    const count = await c.incr(key);
    if (count === 1) await c.expire(key, 86400);  // set TTL on first use
    return count > limit;
  } catch (_) {
    return false;
  }
}
```

`INCR` is atomic in Redis — two concurrent AI requests can't both read 0, both increment to 1, and both think they're the first call. Redis processes `INCR` as a single atomic operation: the first request gets 1, the second gets 2.

The `count === 1` check: the `expire` is only set on the first use of each key, because Redis's `INCR` creates the key if it doesn't exist. Setting `expire` only on count 1 avoids resetting the TTL on every call (which would prevent the key from ever expiring under sustained load).

Daily reset is automatic: the key name includes today's date (`2026-03-25`). Tomorrow, `INCR` creates a new key (`2026-03-26`) with count 1. The old key expires via the 86400-second TTL.

Fail-open design: if Redis is unavailable, `return false` means "not over limit — allow the call." This prioritizes availability over cost control. In a real production system you'd want a fallback counter strategy, but for this scale, fail-open prevents AI features from breaking entirely when Redis is down.

---

## AI Integration — Deep Dive

### Model Choice: llama-3.1-8b-instant

The Groq free tier offers multiple models:
- `llama-3.3-70b-versatile` — 1,000 requests/day, better reasoning
- `llama-3.1-8b-instant` — 14,400 requests/day, faster, smaller context

For a multi-user product where many users each hit AI features daily, 1K RPD is a hard cap that gets hit immediately. 14.4K RPD at 25 summaries + 25 flashcards + 5 resumes per user per day gives roughly 18 users before hitting the daily limit — still tight but workable at early scale. The comment in the source file captures this reasoning: "not viable for a multi-user product."

Prompt engineering compensates for the smaller model. Strict JSON schema in the prompt, explicit rules, and `temperature: 0.3` (low randomness, consistent output) produce results that rival larger models for structured extraction tasks.

### temperature: 0.3

Temperature controls how "creative" (random) the model's output is. At 0.0, the model always picks the highest-probability next token — completely deterministic. At 1.0+, output becomes more varied and less predictable.

For factual summarization and structured extraction, low temperature (0.3) is correct:
- Summaries should accurately reflect what's in the notes, not hallucinate
- Flashcards should be grounded in the content, not invented
- JSON structure must be consistent — high temperature causes structural deviations

### response_format: json_object

Groq's `response_format: { type: 'json_object' }` mode forces the model to only output valid JSON. Without it, the model sometimes wraps output in markdown code fences (` ```json ... ``` `), adds preamble ("Here is the JSON:"), or produces malformed JSON.

Note: `generateFlashcards` does NOT use `response_format: json_object` (it was added later to the other two). That's why it has an extra cleaning step:
```js
const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
```
This strips markdown code fences in case the model wraps its output.

### Edge Case: detailedSummary as Object

The model was observed returning `detailedSummary` as an object (key-value pairs) instead of a formatted string, despite the prompt specifying a string. This is handled explicitly:

```js
if (typeof detailedSummary === 'object' && detailedSummary !== null) {
  detailedSummary = Object.entries(detailedSummary)
    .map(([section, items]) => {
      const bullets = Array.isArray(items)
        ? items.map((item) => `- ${item}`).join('\n')
        : items;
      return `${section}\n${bullets}`;
    })
    .join('\n\n');
}
```

This converts the model's object representation into a markdown-formatted string. Both formats produce readable output. Defensive handling like this is what separates production-grade AI integration from demos — you can't assume the model always follows the exact schema.

### Resume Feedback Prompt Engineering

The resume prompt is the most complex. Key techniques used:

**Role-play framing:** "You are a senior technical recruiter who has reviewed thousands of resumes for top tech companies." This constrains the model to think from a specific professional perspective, producing more targeted feedback.

**Specificity enforcement:** "Every sentence you write is grounded in the actual content of the resume being reviewed." Without explicit anti-hallucination instructions, LLMs will give generic advice ("quantify your achievements") that could apply to any resume.

**Format enforcement via example:** The prompt shows the exact JSON structure including placeholder sentences like `"<Improvement item — follow this pattern: Start with 'Problem:' ...>"`. Including the format in the prompt (not just in `response_format`) makes the model less likely to deviate from the schema.

**Strict rules section:** Exact counts (5 strengths, 5 improvements), sentence length requirements (3-5 sentences each), and the explicit "Only return the JSON object. No extra text." instruction.

### AI Limits by Type

| Function | Daily Limit | Reasoning |
|----------|------------|-----------|
| `generateSummary` | 25/user/day | Core feature, high frequency |
| `generateFlashcards` | 25/user/day | Core feature, high frequency |
| `generateResumeFeedback` | 5/user/day | Expensive output, lower frequency |

---

## Observability & Analytics — Deep Dive

### Architecture

Two-layer observability stack:
- **Sentry** — error monitoring and crash reporting. Backend initialized via `instrument.js` before Express loads; frontend initialized in `main.jsx` before React renders. Sentry errors are tagged with `posthog_session_replay_url` so you can click directly from an error to the session replay that triggered it.
- **PostHog** — product analytics, session replay, and activation funnel tracking.

### Ad Blocker Bypass via Vercel Proxy

The PostHog SDK is configured with `api_host: '/ph'` (relative path) instead of `https://us.i.posthog.com`. Vercel rewrites in `vercel.json` forward `/ph/*` to PostHog's ingestion endpoint:

```json
{ "source": "/ph/:path*", "destination": "https://us.i.posthog.com/:path*" }
```

Ad blockers block `us.i.posthog.com` by hostname. They see `usecontinuum.dev/ph` — your domain — and let it through. This is a standard production pattern; PostHog documents it as the recommended deployment for apps where ad blocker interference matters.

### Identity Model

Both frontend and backend use MongoDB `_id` as the PostHog `distinctId`. On login or register, the frontend calls:
```js
posthog.identify(user._id, { email, username, name, created_at })
```
The backend sends server-side events via a central `capture(user, event, props)` wrapper in `backend/lib/posthog.js`. Because both sides use the same ID, all events — frontend page views, backend write events — merge into a single user profile in PostHog automatically.

### Person Profiles: `identified_only`

PostHog's person profile mode is set to `identified_only`, meaning anonymous pre-login sessions are not stored as person records — only users who register and are identified generate person profiles. However, anonymous `$pageview` events on the marketing and login pages are still captured intentionally.

When an anonymous visitor registers and `posthog.identify()` fires, PostHog retroactively merges their anonymous session into the new person profile. This preserves the full pre-signup journey — the only way to measure landing page → registration conversion rate. All non-auth pages in the app are marketing or login pages, so there is no risk of capturing anonymous events on authenticated views.

### Demo & Seed Account Exclusion

The demo account (`isDemo: true`) and all seed bot accounts (`isSeedUser: true`) are completely excluded from PostHog:

**Frontend:** On login or hydration, if `user.isDemo || user.isSeedUser`, `posthog.opt_out_capturing()` is called. This disables ALL tracking for that session — including autocapture and automatic `$pageview` events, which cannot be blocked with a simple `if` guard. On logout, `posthog.opt_in_capturing()` restores the default state for the next real user.

**Backend:** `backend/lib/posthog.js` exports a `capture(user, event, props)` wrapper that checks `user.isDemo || user.isSeedUser` before forwarding to the PostHog client. All controllers call this wrapper, so the guard is in one place — no per-controller checks.

### Session Replay with PII Masking

Session recording is enabled with explicit masks on `[type=password]` and `[type=email]`. This captures full interaction recordings while automatically redacting credentials. You can replay exactly what a user did leading up to a bug or drop-off point.

### Backend Batching & Graceful Shutdown

The backend PostHog client flushes in batches (`flushAt: 20` events or every 10 seconds) rather than per-event HTTP calls. On process shutdown, `posthog.shutdown()` is called explicitly to flush any queued events before the Node.js process exits — ensuring no events are lost on Render deploys.

### Event Catalog (35 custom events)

Events are split between frontend (UI interactions) and backend (data mutations):

**Auth:** `user_registered`, `user_logged_in` (method: email|google), `user_logged_out`, `email_verified`, `google_auth_linked`, `account_deletion_requested`, `account_restored`

**Notes:** `note_created` (source: manual|pdf_upload|google_doc), `note_viewed`, `note_shared` (audience, recipientCount), `note_unshared`, `note_deleted`, `note_summary_generated`, `google_doc_imported`

**Flashcards:** `flashcard_set_generated` (source, card_count, generation_path), `flashcard_set_viewed`, `flashcard_set_shared`, `flashcard_set_unshared`, `flashcard_set_deleted`

**Study:** `study_session_started`, `study_session_completed`, `study_session_abandoned` (cards_seen)

**Career:** `resume_uploaded`, `resume_feedback_generated`, `resume_score_viewed`, `job_application_created`

**Social:** `friend_request_sent`, `friend_request_accepted`, `friend_removed`, `message_sent`, `task_shared`, `task_created`, `comment_added`, `comment_reply_added`

**Mobile waitlist:** `mobile_landing_viewed`, `mobile_waitlist_form_started` (fires once on first field focus), `mobile_waitlist_submitted` (includes `platform_interest: ios|android|both`)

### Activation Funnel

The defined activation event — the "aha moment" — is:
```
user_registered → (flashcard_set_generated OR note_summary_generated OR resume_feedback_generated)
```
Conversion window: 7 days. This tracks whether new users reach the AI-powered core of the product, which is the primary retention driver.

### Source Tracking

Notes and flashcards capture `source` on creation (`manual`, `pdf_upload`, `google_doc`, `text_paste`). This tells you which input modes users actually use — data that directly informs where to invest in UX improvements.

---

## Frontend Architecture — Deep Dive

### React Query v5 — Server State Management

All server data in Continuum goes through React Query. There is no Redux, no Zustand, no custom global state for server data. The mental model: React Query IS the client-side cache.

**Why v5?** The v5 API cleaned up the `cacheTime` vs `staleTime` confusion and made the object-based query options the standard. The `queryKey` array structure also makes cache invalidation explicit.

**Query key conventions:**
```js
['notes']                    // all notes list
['note', noteId]             // single note detail
['flashcard-sets']           // all flashcard sets
['flashcard-set', setId]     // single set
['tasks']                    // task board
['activity']                 // activity feed
['conversations']            // message inbox
['messages', conversationId] // conversation thread
```

When a socket event fires, invalidating `['notes']` causes every component using `useQuery({ queryKey: ['notes'] })` to refetch on next render. The key hierarchy isn't nested — `['note', noteId]` and `['notes']` are independent keys. Invalidating `['notes']` doesn't invalidate `['note', noteId]`.

**staleTime tuning:**
```js
// Dashboard stat counts — fresh for 30 seconds
useQuery({ queryKey: ['stats'], staleTime: 30_000 })

// Activity feed — fresh for 60 seconds
useQuery({ queryKey: ['activity'], staleTime: 60_000 })

// Profile data — fresh for 5 minutes
useQuery({ queryKey: ['profile', userId], staleTime: 5 * 60_000 })
```

Without `staleTime`, React Query marks data stale immediately after fetching and refetches on every window focus. For a dashboard with 5 stat cards, that's 5 API calls every time the user alt-tabs. `staleTime` batches these into a single fetch cycle.

**Optimistic mutations:**
```js
useMutation({
  mutationFn: (data) => api.patch(`/tasks/${taskId}`, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], (old) => updateTaskInList(old, taskId, newData));
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks'], context.previous); // rollback
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] }); // sync with server
  },
});
```

The kanban board updates instantly on drag-and-drop. If the API call fails, the board rolls back. `onSettled` always refetches to ensure consistency regardless of success or failure.

---

### Axios Interceptor — Complete Mechanics

The interceptor in [web/src/lib/api.js](../web/src/lib/api.js) handles two concerns: token injection and 401 recovery.

**Request interceptor — token injection:**
```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
Runs before every request. Token is read fresh from localStorage each time — if it was just updated by a refresh, the next request automatically uses the new token.

**Response interceptor — 401 recovery:**

The problem without deduplication: user visits a page with 5 data-fetching components. All 5 fire simultaneously. All 5 get 401. Without deduplication, all 5 try to call `/api/auth/refresh` simultaneously, causing 5 refresh attempts, 4 of which fail because the old refresh token is already rotated.

The solution:
```js
let refreshPromise = null;  // module-level — shared across all requests

if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
  err.config._retry = true;  // prevent infinite loop

  if (!refreshPromise) {
    refreshPromise = axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        localStorage.setItem('token', data.token);
        return data.token;
      })
      .finally(() => { refreshPromise = null; });  // reset when done
  }

  const newToken = await refreshPromise;  // all 5 requests await this same promise
  err.config.headers.Authorization = `Bearer ${newToken}`;
  return api(err.config);  // retry original request
}
```

All 5 failing requests see `refreshPromise` is already set and `await` it. One refresh call goes to the backend. When it resolves, all 5 get the new token and retry their original requests. The `_retry` flag on `err.config` prevents a retry from re-entering the interceptor.

**AUTH_ENDPOINTS exclusion:**
```js
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));
```
Login returning 401 (wrong password) should reach the component's catch block, not trigger a refresh attempt. Without this exclusion, a wrong-password login would silently try to refresh a non-existent token.

**429 deduplication:**
```js
let rateLimitFired = false;

if (err.response?.status === 429) {
  if (!rateLimitFired) {
    rateLimitFired = true;
    window.dispatchEvent(new CustomEvent('api:ratelimit'));
    setTimeout(() => { rateLimitFired = false; }, 10_000);
  }
  return Promise.reject(err);
}
```
If 5 requests all get 429 simultaneously, the user should see one toast notification, not 5. The `rateLimitFired` flag deduplicates them within a 10-second window. The toast component listens for the `api:ratelimit` custom event.

---

### AuthContext — Global Auth State

AuthContext wraps the entire app and is the single source of truth for the authenticated user object. No component queries `/api/auth/me` directly — they all read from `useAuth()`.

**Hydration on mount:**
```js
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) { setIsLoading(false); return; }
  api.get('/auth/me')
    .then((res) => {
      setUser(res.data.user);
      const socket = connectSocket(token);
      registerSocketEvents(socket);
    })
    .catch(() => {
      localStorage.removeItem('token');  // bad token — clear it
    })
    .finally(() => setIsLoading(false));
}, []);
```

On every page load: read token from localStorage, fetch current user from backend (ensures user data is fresh and token is still valid), connect socket, register all event handlers. If the token is expired or revoked, the axios interceptor fires, tries to refresh via httpOnly cookie, and if that fails, clears the session.

`isLoading: true` during hydration prevents the app from rendering protected routes before knowing if the user is authenticated — eliminates the flash of the login page on refresh.

**useCallback on all auth methods:**
```js
const login = useCallback(async (email, password) => { ... }, []);
const register = useCallback(async (data) => { ... }, []);
const logout = useCallback(() => { ... }, []);
```
`useCallback` with an empty dependency array means these function references are stable across renders. Components that receive them as props or use them in `useEffect` dependencies don't trigger re-renders unnecessarily.

---

## Activity Feed — Architecture

### Activity vs Notifications — The Design Contract

Most student projects collapse these two concepts into one. Continuum keeps them strictly separate based on how Instagram, LinkedIn, GitHub, and Canvas LMS handle this:

- **Activity Feed** answers "what are my friends *creating and doing*?" — ambient social context that drives study-group motivation. Shows `note_created`, `note_shared`, `flashcard_set_created`, `flashcard_shared`, `task_created`, `comment_added`. Never shows `like_added` (micro-reaction, now notifications-only).
- **Notifications** answers "what's *directed at me* that requires my attention?" — comment on YOUR note, message TO you, request FOR you.

The rule that eliminates overlap: **no event appears in both streams for the same person.** When Bob comments on Alice's note, Alice gets a notification (targeted at her). Their mutual friend Carol sees it in her activity feed (ambient social context). Bob's `activityVisibility: 'private'` users are completely absent from others' feeds — their historical activities remain visible (stamped at creation time), but no new activities propagate.

This separation was research-validated: Instagram removed their "Following Activity" tab in 2019 because it served neither purpose well — it was a reaction feed disguised as an inbox, and users felt surveilled.

### The Visibility Problem

The activity feed isn't "show everything" — it's "show me only activities from people whose visibility settings allow me to see them." This required designing a per-document visibility model.

Each Activity document has a `visibleTo` array (array of user IDs who should see it) and `isPublic` (boolean for public activities). The feed query is:
```js
const baseFilter = {
  $or: [
    { visibleTo: userId },    // explicitly included in this activity's audience
    { isPublic: true },       // public activity anyone can see
  ],
};
```

The `visibleTo` array is populated at creation time by `resolveVisibleTo()`, which reads the actor's `settings.activityVisibility` and looks up their accepted friends. This means visibility is baked into the document at creation, not computed at query time.

### Personalized Sharing Activities

When Alice shares a note with Bob and Carol, three Activity documents are created:

1. **Alice's activity** (`visibleTo`: Alice + her other friends, minus Bob and Carol):
   `metadata: { sharedWithNames: [{ firstName: 'Bob' }, { firstName: 'Carol' }] }`
   → "You shared Note X with Bob, Carol"

2. **Bob's activity** (`visibleTo`: [Bob only]):
   `metadata: { isRecipient: true }`
   → "Alice shared Note X with you"

3. **Carol's activity** (`visibleTo`: [Carol only]):
   `metadata: { isRecipient: true }`
   → "Alice shared Note X with you"

Bob and Carol are explicitly removed from Alice's activity's `visibleTo` — they see only their personalized version, not Alice's generic one. This is the most complex part of the activity service and required careful set-theoretic filtering.

### Cache Invalidation Strategy

Only the first page of the activity feed is cached (`activity:{userId}:first`). When a new activity is created, `notifyActivityAudience` invalidates this key for all affected users. Cursor pages (page 2+) are not cached because:

1. New activities only ever land above the cursor (newer than any cursor timestamp), so cursor pages are immutable
2. Caching every cursor page would require knowing all active cursors at invalidation time — impractical
3. The first page is the hot path — 90%+ of users never paginate past it

---

## Testing — Deep Dive

### Why Integration Tests, Not Unit Tests

Continuum's test suite uses Supertest to make real HTTP requests through the full Express middleware stack and `mongodb-memory-server` to run a real MongoDB process in memory. This is deliberate.

Unit tests for a REST API controller often require mocking:
- The database (Mongoose)
- The auth middleware
- Other controllers the test calls into

Mocked tests prove the code runs, not that the system works. The test that matters is: does `POST /api/auth/login` with a correct password return a JWT that can be used to call `GET /api/notes`? That's an integration test.

Real-world example from the summary: mocked tests passed while production migrations failed. Integration tests catch the class of bugs that unit tests miss.

### mongodb-memory-server

```js
// beforeAll in each test suite
mongoServer = await MongoMemoryServer.create();
await mongoose.connect(mongoServer.getUri());

// afterAll
await mongoose.disconnect();
await mongoServer.stop();
```

Each test suite starts a fresh MongoDB instance in memory. No Atlas connection, no test database to clean up, no shared state between CI runs. The in-memory process spins up in ~200ms. Tests run offline.

### Test Isolation

Each test within a suite runs against the same in-memory database but uses `beforeEach` to create fresh users and data. The pattern:

```js
let userA, tokenA, userB, tokenB;

beforeEach(async () => {
  await User.deleteMany({});
  await Note.deleteMany({});
  const res = await request(app).post('/api/auth/register').send({ email: 'a@test.com', ... });
  tokenA = res.body.token;
  userA = res.body.user;
  // repeat for userB
});
```

Every test starts with a clean state. No test can affect another. This means tests can run in any order and in parallel.

### Ownership Isolation Tests

The most important security tests are the ones that verify User A can't access User B's data:

```js
it('returns 404 when accessing another user\'s note', async () => {
  const note = await Note.create({ userId: userB._id, title: 'Bob\'s note', ... });
  const res = await request(app)
    .get(`/api/notes/${note._id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  expect(res.status).toBe(404);  // not 403 — don't leak existence
});
```

These tests would pass with a unit test that mocks the database, because the mock doesn't enforce actual ownership checks. Running against a real MongoDB instance verifies the Mongoose query actually filters by `userId`.

---

## Deployment & Infrastructure — Deep Dive

### Vercel — SPA Routing

The problem: Vite builds a SPA where React Router handles routing client-side. If a user navigates directly to `https://continuum-web.vercel.app/notes`, Vercel serves a 404 because there's no `notes/index.html` file.

The fix: `vercel.json` SPA rewrite:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Every path serves `index.html`. React Router reads the path and renders the correct page. This is required for any SPA deployed to a static host.

### Render — Backend

Render Starter tier: 512 MB RAM, shared CPU, spins down after 15 minutes of inactivity (cold starts ~30s). The free tier works for demos but adds latency on first request after inactivity.

The backend is deployed as `node server.js`. Render auto-deploys on push to main via GitHub integration. All environment variables are configured in the Render dashboard — `MONGO_URI`, `JWT_SECRET`, `REDIS_URL`, `GROQ_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, `CLOUDINARY_*`, `RESEND_API_KEY`.

### Upstash Redis

Upstash is a serverless Redis provider with per-request pricing. Connection string is `rediss://` (TLS) — standard Redis over TLS. Upstash's free tier provides 10,000 commands/day — sufficient for caching + Socket.io pub/sub at early scale.

The `rediss://` protocol is critical: Upstash requires TLS. A plain `redis://` connection attempt fails. The cache and socket adapter both use the same `REDIS_URL`.

### MongoDB Atlas M0

Free tier: 512 MB storage, shared cluster, no automated backups. The IP allowlist is currently `0.0.0.0/0` (all IPs) because Render's Starter tier doesn't provide static egress IPs. This is a known temporary tradeoff — upgrading to Render's paid tier provides a static IP, which allows locking Atlas down to that specific IP.

---

## Development Process — Deep Dive

### Git Workflow

Every change lives on a branch. Branch naming follows a strict convention:
```
feat/    → new user-visible feature
fix/     → bug fix
chore/   → maintenance, dependencies, config
docs/    → documentation only
test/    → test additions or changes
refactor/→ code restructuring, no behavior change
```

The convention makes the git log self-documenting. `git log --oneline main` reads like a changelog.

### Conventional Commits

Commit messages follow the Conventional Commits specification:
```
feat: add cursor pagination to activity feed
fix: $or overwrite on paginated activity filter
chore: install cookie-parser for httpOnly refresh cookie
docs: add rollback strategy for Render and Vercel
test: add httpOnly cookie refresh tests to auth suite
```

Format: `type: short imperative description`. No past tense ("added"), no period at end. The type matches the branch prefix.

**Why this matters in interviews:** It signals engineering maturity. Git history is documentation. A repo where every commit is "updates" or "fix stuff" tells a reviewer nothing. A repo with conventional commits tells them exactly what changed and why at a glance.

### Protected Main Branch

GitHub branch protection rules on `main`:
- Require pull request before merging
- Require status checks to pass (CI — Jest suite)
- No direct pushes, even from the repo owner

This means: even solo development goes through PRs. Every change is reviewed (by the author, with fresh eyes), tested by CI, and merged deliberately.

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: backend
      - run: npm test
        working-directory: backend
        env:
          NODE_ENV: test
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

CI runs on every push and every PR. `npm test` runs the full 61-test suite. Failing CI blocks the PR from being merged. This means: main is always green.

`NODE_ENV=test` disables rate limiting in tests and sets other test-specific behavior. The Jest secret is a dummy value — tests use `mongodb-memory-server` so Atlas credentials are never needed in CI.

### PR Process

Each PR includes:
- **Summary:** bullet points of what changed and why
- **Test plan:** checklist of manual verification steps
- **Issue references:** closes #59, closes #60 (links the PR to the issue tracker)

This creates a paper trail. Six months from now, you can read a PR and understand exactly what problem it solved, what it changed, and how to verify it worked.

*Last updated: May 20, 2026*
