# Redis Adapter for Socket.io

## Problem

Socket.io connections are held in-process memory. Each backend instance only knows about the clients connected to it.

When running a single instance (current state), emitting `io.to('user:abc').emit(...)` works correctly — that user's socket is on this server.

When running **multiple backend instances** behind a load balancer (horizontal scaling), a user connected to Server A will not receive an event emitted by Server B. The event silently drops.

```
Server A                    Server B
├── user:alice (connected)  ├── user:bob (connected)
└── ...                     └── ...

Bob creates a task shared with Alice.
Server B emits to user:alice — but Alice is on Server A. Dropped.
```

---

## Solution: Redis Pub/Sub Adapter

The `@socket.io/redis-adapter` package routes all `io.to(...).emit(...)` calls through a Redis Pub/Sub channel. Every server instance subscribes to that channel and delivers the event to any locally connected client.

```
Server A              Redis Pub/Sub              Server B
├── user:alice  ←──── receives event ─────────── emits to user:alice
```

---

## When to Add This

Only when you run more than one backend instance. This happens when:

- Deploying to Railway/Render/Fly.io with replicas > 1
- Using a process manager (PM2 cluster mode)
- Adding auto-scaling

At a single instance, the adapter adds latency and complexity for zero benefit. Do not add it prematurely.

---

## Implementation

### 1. Install

```bash
npm install @socket.io/redis-adapter
```

Redis is already a dependency (`redis` package, used for caching). No new infrastructure needed — reuse `REDIS_URL`.

### 2. Update `backend/lib/socket.js`

```js
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('redis');

// In initSocket(), after creating the io instance:
async function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { ... } });

  // Redis adapter — enables multi-instance socket delivery
  if (process.env.REDIS_URL) {
    const pubClient = redis.createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use(...); // existing JWT auth middleware
  io.on('connection', ...); // existing connection handler
}
```

Using separate pub/sub clients is required by Redis — a client in subscribe mode cannot issue other commands.

### 3. No other changes needed

`getIO().to('user:xyz').emit(...)` calls in all controllers work unchanged. The adapter transparently intercepts them and broadcasts via Pub/Sub.

---

## Load Balancer Requirement

WebSocket connections are long-lived. A load balancer must route all requests from the same client to the same server instance (sticky sessions). Without this, the Socket.io upgrade handshake may land on a different server than the initial polling request.

Most modern PaaS platforms handle this automatically, but verify before scaling:

| Platform | Sticky sessions |
|----------|-----------------|
| Railway | Enabled by default |
| Render | Set `Session Affinity: true` in service settings |
| Fly.io | No native sticky sessions — use Redis adapter + `transports: ['websocket']` (no upgrade needed) |
| AWS ALB | Enable stickiness on target group |

Since the frontend already uses `transports: ['websocket']` (no polling fallback), the handshake is a single WebSocket connection — sticky sessions are less critical, but still recommended.

---

## Environment Variables

No new env vars. Reuses `REDIS_URL` already present for caching.

---

## Related

- `backend/lib/socket.js` — where to make the change
- `backend/lib/cache.js` — existing Redis client (uses a separate connection, as required)
- `docs/future-ideas/realtime-and-caching.md` — Phase 3 context

---

*This is a no-op in single-instance deployments. Add it when scaling out, not before.*
