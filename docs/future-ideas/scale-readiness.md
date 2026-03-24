# Scale Readiness — Pre-Thousands Checklist

Implemented on: `feat/realtime-websockets`

The current stack (WebSockets + Redis caching) handles moderate concurrent load well. These are the remaining gaps to address before the platform reaches thousands of concurrent users.

---

## 1. MongoDB Indexes (Highest Priority)

Several hot query paths do full collection scans today. At 10K+ documents per collection this degrades linearly.

| Query | Collection | Missing index |
|---|---|---|
| `Activity.find({ visibleTo: userId })` | Activity | `{ visibleTo: 1, createdAt: -1 }` |
| `Note.find({ sharedWith: userId })` | Note | `{ sharedWith: 1, deletedAt: 1 }` |
| `Note.find({ userId, deletedAt: null })` | Note | `{ userId: 1, deletedAt: 1 }` |
| `Task.find({ participants.userId: userId })` | Task | `{ "participants.userId": 1, deletedAt: 1 }` |
| `Friendship.find({ user1/user2: userId, status })` | Friendship | `{ user1: 1, user2: 1, status: 1 }` |
| `Activity.find({ isPublic: true })` | Activity | `{ isPublic: 1, createdAt: -1 }` |

**Fix:** Add indexes directly to Mongoose schemas via `index: true` on the field or a `schema.index({...})` call at the bottom of each model file.

---

## 2. MongoDB Connection Pool Tuning

Mongoose defaults to a pool size of 5. Under concurrent load, requests queue waiting for a free connection.

**Fix:** Set pool size in the MongoDB connection config:

```js
// backend/config/db.js
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 20,  // tune based on instance size and DB tier
});
```

Start at 20 and increase if you see connection wait times in monitoring.

---

## 3. Per-User Rate Limiting on Write Endpoints

The current rate limiter is global (all IPs share the same window). A single heavy user can exhaust the limit and impact everyone else.

**Fix:** Add a per-user limiter on high-frequency write endpoints:

```js
// backend/middleware/userRateLimit.js
const rateLimit = require('express-rate-limit');

const perUserWriteLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, error: 'Too many requests' },
});
```

Apply to: `POST /messages`, `POST /comments`, `PUT /notes/:id/share`, `PATCH /tasks/:id/participants`.

---

## 4. Redis Adapter for Socket.io

Currently each backend process holds its own in-memory socket connections. A socket event emitted on Server A never reaches a user connected to Server B.

Already fully specced — see `docs/future-ideas/redis-socket-adapter.md`.

**Required when:** running more than one backend instance (replicas, PM2 cluster, auto-scaling).

---

## 5. Activity Feed Cursor Pagination Cache

The Redis cache on `GET /activity` only covers offset=0 with limit=20. Deeper pages always hit MongoDB.

**Fix:** Switch the activity feed from offset pagination to cursor-based pagination (`createdAt` as cursor). Cache each cursor page with key `activity:<userId>:<cursor>` — pages become stable and cacheable indefinitely until invalidated.

---

## 6. Background Job Queue for Heavy Operations

AI calls (note summaries, flashcard generation, resume feedback) are synchronous today — they block the request until Groq responds. Under load this ties up Node's event loop and increases p99 latency across all endpoints.

**Fix:** Move AI calls to a background job queue (BullMQ + Redis). The endpoint returns immediately with a `jobId`, and the client polls or receives a socket event when the result is ready.

```
POST /notes/:id/summary  →  { jobId }
socket event: note_summary_ready  →  client refetches
```

BullMQ reuses the existing Redis instance.

---

## 7. CDN for Static Assets

The Vite build outputs JS/CSS bundles served directly from the host. Under load, static asset requests compete with API traffic.

**Fix:** Deploy the `web/dist/` build to a CDN (Cloudflare Pages, Vercel, or Netlify). The backend only handles API and WebSocket traffic. This also improves initial load time globally via edge caching.

---

## Implementation Order

1. **MongoDB indexes** — zero infrastructure cost, highest return, do this first
2. **Connection pool tuning** — one-line config change
3. **Per-user rate limiting** — protects against abuse before you have monitoring in place
4. **Redis adapter** — only when scaling to multiple backend instances
5. **Cursor pagination cache** — once activity feed is a measurable bottleneck
6. **Background job queue** — once AI latency is user-visible under load
7. **CDN for static assets** — part of the production deployment setup

---

*Last Updated: March 2026*
