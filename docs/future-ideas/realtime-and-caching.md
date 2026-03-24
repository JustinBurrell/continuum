# Continuum — Real-Time & Caching Architecture

## Overview

Continuum currently uses React Query with explicit mutation invalidation and a 30-second `staleTime`. This is correct for MVP — your own actions are instant, and background data stays reasonably fresh. As the platform scales to concurrent users, two things need to evolve:

1. **Real-time delivery** — other users' actions should appear without the recipient refreshing or waiting for a stale cache to expire.
2. **Server-side caching** — reduce database pressure as query volume grows, keeping response times fast under concurrent load.

This document covers the recommended path from the current MVP to a production-grade, instant-feeling SaaS.

---

## Current State

| Layer | What's in place |
|-------|-----------------|
| Frontend | React Query v5, `staleTime: 30s`, explicit `invalidateQueries` on all mutations |
| Backend | Express + MongoDB, Socket.io connected, no Redis caching yet |
| Real-time | **Phase 1 complete** — messages, friend requests, shared tasks, notes, comments |

---

## ✅ Phase 1 — WebSockets for Messages and Notifications (COMPLETE)

Implemented in `feat/realtime-websockets`.

### Infrastructure

**`backend/lib/socket.js`** — Socket.io server module:
- JWT verification on every handshake (same secret as HTTP auth)
- Each user automatically joins their private room `user:<userId>` on connect
- `initSocket(httpServer)` called once at startup; `getIO()` used by controllers

**`backend/server.js`** — switched from `app.listen` to `http.createServer(app)` + `initSocket(httpServer)`

**`web/src/lib/socket.js`** — frontend socket singleton:
- `connectSocket(token)` — connects with JWT auth, uses WebSocket transport only
- `disconnectSocket()` — called on logout

**`web/src/context/AuthContext.jsx`** — socket lifecycle tied to auth:
- Connect + register all event handlers on login, register, and page-refresh hydration
- Disconnect on logout
- All events invalidate the relevant React Query keys — no manual cache merging needed

### Events Implemented

| Event | Emitted by | Who receives it | React Query keys invalidated |
|-------|-----------|-----------------|------------------------------|
| `new_message` | `sendMessage` | Message recipient | `['messages', convId]`, `['conversations']` |
| `friend_request` | `sendRequest` | Request recipient | `['friends']` |
| `friend_accepted` | `respondToRequest` (accept) | Request sender | `['friends']` |
| `task_updated` | `updateTask`, `updateStatus`, `updateParticipants` | All task participants | `['tasks']`, `['calendar']` |
| `note_updated` | `updateNote` | Users in `sharedWith` | `['notes']` |
| `note_shared` | `shareNote` | Newly shared users | `['notes']` |
| `comment_added` | `addComment` | Resource owner | `['note'/:id]`, `['flashcard-set'/:id]`, `['tasks']`, `['activity']` |
| `flashcard_shared` | `shareFlashcardSet` (when implemented) | Shared users | `['flashcard-sets']` |

### Pattern

Backend emits after the DB write:
```js
// controllers/conversations.controller.js
getIO().to(`user:${recipientId}`).emit('new_message', { conversationId, message });
```

Frontend invalidates the cache (React Query refetches automatically):
```js
// AuthContext.jsx
socket.on('new_message', ({ conversationId }) => {
  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
});
```

All `getIO()` calls are wrapped in `try/catch` so a socket failure never breaks an HTTP response.

---

## Phase 2 — Live Collaborative Features

Once the socket infrastructure is in place, extending it to shared tasks and activity feeds is straightforward.

### Shared Tasks (partially done in Phase 1)

`task_updated` already fires on `updateTask`, `updateStatus`, and `updateParticipants`.

Still to add:
- Emit when a task is **deleted** (participants' kanban should update)
- Emit when a task is **created** as shared

### Activity Feed

```js
s.on('activity_updated', () => {
  queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
});
```

### What gets real-time in Phase 2

| Feature | Trigger | Who gets the event |
|---------|---------|-------------------|
| Shared task deleted | `task_deleted` | All task participants |
| Shared task created | `task_created` | All participants |
| Friend shares a note | `activity_updated` | Friends of the sharer |
| Forum post vote/comment | `forum_updated` | Forum members (use a room per forum: `socket.join(`forum:${forumId}`)`) |

---

## Phase 3 — Server-Side Caching with Redis

At scale, repeated reads of the same data (dashboard summaries, shared note lists, activity feeds) will hammer MongoDB. Redis solves this with sub-millisecond in-memory reads.

### What to cache

| Data | TTL | Invalidation trigger |
|------|-----|----------------------|
| User profile | 5 min | Profile update |
| Shared notes list | 60s | Note visibility change, new note |
| Activity feed | 30s | Any activity write |
| Dashboard stats (task count, app count) | 30s | Relevant mutation |
| Forum post lists | 60s | New post, vote, delete |

### Pattern

```js
// backend/lib/cache.js
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetchFn();
  await client.setEx(key, ttlSeconds, JSON.stringify(data));
  return data;
}

async function invalidate(key) {
  await client.del(key);
}

module.exports = { getOrSet, invalidate };
```

```js
// In a controller
const { getOrSet, invalidate } = require('../lib/cache');

// Read (cached)
const notes = await getOrSet(`shared-notes:${userId}`, 60, () =>
  Note.find({ userId, visibility: 'friends' }).lean()
);

// Write (invalidate)
await Note.findByIdAndUpdate(id, update);
invalidate(`shared-notes:${userId}`);
```

### Redis also enables Socket.io at scale

When running multiple backend instances (horizontal scaling), each server has its own in-memory socket connections. A user connected to server A won't receive an event emitted by server B. Redis Pub/Sub solves this:

```js
const { createAdapter } = require('@socket.io/redis-adapter');
const pubClient = redis.createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

With the Redis adapter, `io.to('user:xyz').emit(...)` works correctly regardless of which server instance the user is connected to.

---

## Deployment Considerations

| Concern | Solution |
|---------|----------|
| WebSocket support on host | Most modern PaaS (Railway, Render, Fly.io) support WS natively; verify sticky sessions or use Redis adapter |
| Redis hosting | Upstash (serverless, free tier), Railway Redis plugin, or Redis Cloud |
| Socket.io client bundle size | ~45KB gzipped — acceptable; use `transports: ['websocket']` to skip the polling upgrade handshake |
| Connection limits | Socket.io handles ~1,000 concurrent connections per Node process; horizontal scaling + Redis adapter handles growth beyond that |

---

## Recommended Rollout Order

1. ✅ **Add Socket.io to backend + connect in AuthContext** — complete
2. ✅ **Real-time DMs** — complete
3. ✅ **Real-time friend requests** — complete
4. ✅ **Real-time shared tasks** — complete
5. ✅ **Real-time notes + comments** — complete
6. **Notification badge** — `new_notification` event updates a badge count on the sidebar
7. **Redis caching** — introduce once traffic warrants it, not before
8. **Redis adapter for Socket.io** — only needed when running more than one backend instance

---

## What Does Not Need WebSockets

Not everything should be real-time. These features are fine with React Query's invalidation + staleTime:

- **Your own mutations** — already instant via `invalidateQueries`.
- **Flashcards, resumes** — personal data, no other user is modifying it.
- **Applications / pipeline** — private per user.
- **Calendar** — derived from tasks; task invalidation covers it.
- **Profile / settings changes** — per-user, no cross-user visibility.

Real-time adds complexity and infrastructure cost. Use it only where the UX gap without it is genuinely noticeable (chat, shared collaboration, notifications).

---

*Last Updated: March 2026*
