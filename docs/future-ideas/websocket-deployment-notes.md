# WebSocket & Redis — Deployment Notes

## Deployment Considerations

| Concern | Solution |
|---------|----------|
| WebSocket support on host | Most modern PaaS (Railway, Render, Fly.io) support WS natively; verify sticky sessions or use Redis adapter |
| Redis hosting | Upstash (serverless, free tier), Railway Redis plugin, or Redis Cloud |
| Socket.io client bundle size | ~45KB gzipped — acceptable; use `transports: ['websocket']` to skip the polling upgrade handshake |
| Connection limits | Socket.io handles ~1,000 concurrent connections per Node process; horizontal scaling + Redis adapter handles growth beyond that |

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

## Related

- `docs/future-ideas/redis-socket-adapter.md` — how to add the Redis adapter when scaling to multiple instances
- `docs/future-ideas/notifications-spec.md` — notification bell spec using `new_notification` socket event
- `backend/lib/socket.js` — Socket.io server implementation
- `backend/lib/cache.js` — Redis cache helpers
