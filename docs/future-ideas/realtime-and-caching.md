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
| Backend | Express + MongoDB, no caching layer, no push transport |
| Real-time | None — all data is pull-only |

**Implication:** Changes made by User A are invisible to User B until User B's staleTime window expires and they trigger a refetch by navigating. For a multi-user social app, this is a noticeable gap.

---

## Phase 1 — WebSockets for Messages and Notifications

The highest-impact, lowest-risk place to introduce real-time is the two features that require it most:

- **Direct messages** — a chat feature that requires polling is not a chat feature.
- **In-app notifications** — friend requests, task shares, comments on your notes.

### Technology: Socket.io

Socket.io runs on top of the existing Express server with a minimal addition:

```js
// backend/server.js
const { Server } = require('socket.io');
const httpServer = require('http').createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

// Attach io to app so controllers can emit
app.set('io', io);

// Auth middleware — verify JWT on socket handshake
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // Join a personal room keyed to userId so backend can target a specific user
  socket.join(`user:${socket.userId}`);
});
```

### Emitting from Controllers

After the existing DB write, emit an event to the target user's room:

```js
// Inside messages.controller.js — sendMessage
const io = req.app.get('io');
io.to(`user:${recipientId}`).emit('new_message', {
  conversationId,
  message: savedMessage,
});

// Inside friends.controller.js — sendFriendRequest
io.to(`user:${recipientId}`).emit('new_notification', {
  type: 'friend_request',
  from: req.user,
});
```

### Frontend: Socket connects once, invalidates React Query

```js
// mock/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function getSocket() { return socket; }
export function disconnectSocket() { socket?.disconnect(); socket = null; }
```

```js
// In AuthContext.jsx — connect on login, disconnect on logout
import { connectSocket, disconnectSocket } from '@/lib/socket';

// On login success:
const s = connectSocket(token);
s.on('new_message', ({ conversationId }) => {
  queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
  queryClient.invalidateQueries({ queryKey: ['conversations'] });
});
s.on('new_notification', () => {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
});

// On logout:
disconnectSocket();
```

This pattern keeps React Query as the single source of truth — WebSockets just tell the client "something changed," and React Query fetches the actual data. This avoids merging socket payloads into the cache manually.

### What gets real-time in Phase 1

| Feature | Socket event | Query invalidated |
|---------|-------------|-------------------|
| New DM received | `new_message` | `['messages', convId]`, `['conversations']` |
| Friend request received | `new_notification` | `['notifications']`, `['friend-requests']` |
| Friend request accepted | `new_notification` | `['friends']`, `['notifications']` |
| Comment on your note | `new_notification` | `['notifications']` |

---

## Phase 2 — Live Collaborative Features

Once the socket infrastructure is in place, extending it to shared tasks and activity feeds is straightforward.

### Shared Tasks

When User A changes a shared task's status:

```js
// backend — after statusMutation succeeds
task.participants.forEach(participantId => {
  io.to(`user:${participantId}`).emit('task_updated', { taskId: task._id });
});
```

```js
// frontend — in socket setup
s.on('task_updated', ({ taskId }) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['calendar'] });
});
```

### Activity Feed

```js
s.on('activity_updated', () => {
  queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
});
```

### What gets real-time in Phase 2

| Feature | Trigger | Who gets the event |
|---------|---------|-------------------|
| Shared task status changed | `task_updated` | All task participants |
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

1. **Add Socket.io to backend + connect in AuthContext** — infrastructure only, no visible features yet. Low risk.
2. **Real-time DMs** — highest user-facing impact, clearly scoped.
3. **Notification badge** — `new_notification` event updates a badge count. Simple consumer of the existing socket.
4. **Real-time shared tasks** — extend the socket to emit `task_updated` to participants.
5. **Redis caching** — introduce once traffic warrants it, not before. Premature caching adds complexity without payoff at low user counts.
6. **Redis adapter for Socket.io** — only needed when running more than one backend instance.

---

## What Does Not Need WebSockets

Not everything should be real-time. These features are fine with React Query's invalidation + staleTime:

- **Your own mutations** — already instant via `invalidateQueries`.
- **Notes, flashcards, resumes** — personal data, no other user is modifying it.
- **Applications / pipeline** — private per user.
- **Calendar** — derived from tasks; task invalidation covers it.

Real-time adds complexity and infrastructure cost. Use it only where the UX gap without it is genuinely noticeable (chat, shared collaboration, notifications).

---

*Last Updated: March 2026*
