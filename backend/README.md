# Continuum Backend

REST API for the Continuum platform. Built with Node.js, Express 5, MongoDB, Socket.io, and Redis.

![System Architecture](../docs/system-design/system-architecture.png)

Full diagram set — architecture, real-time flow, auth flow, scaling path — at [docs/backend/system-design.md](../docs/backend/system-design.md).

---

## Architecture

```
backend/
  server.js          Entry point, middleware stack, route registration
  config/            MongoDB connection, Passport strategy, Groq client
  controllers/       Request handlers, one file per resource
  routes/            Express routers, one file per resource
  models/            Mongoose schemas
  middleware/        Auth guard, rate limiter, file upload handlers
  services/          Groq AI, activity, share, email, push services
  lib/
    socket.js        Socket.io server — JWT auth, user:id rooms, getIO()
    cache.js         Redis helpers — getOrSet / invalidate, no-op fallback
  scripts/           One-off scripts (seeding, migrations)
```

---

## API surface

16 route groups, ~70 endpoints total.

| Route group           | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `/api/auth`           | Register, login, logout, token refresh, password reset |
| `/api/google`         | Google OAuth initiation, callback, account link/unlink |
| `/api/notes`          | CRUD, AI summary generation, flashcard extraction    |
| `/api/flashcard-sets` | CRUD, add/remove cards, PDF-to-flashcard import      |
| `/api/tasks`          | Kanban tasks with status and due date                |
| `/api/calendar`       | Calendar events                                      |
| `/api/friends`        | Friend requests, accept/decline, remove              |
| `/api/users`          | Profile reads, avatar upload, account settings       |
| `/api/comments`       | Comments on notes                                    |
| `/api/applications`   | Job application CRUD with status pipeline            |
| `/api/resumes`        | PDF upload, text extraction, AI feedback             |
| `/api/conversations`  | Direct message threads between users                 |
| `/api/messages`       | Messages within a conversation                       |
| `/api/activity`       | User activity feed                                   |
| `/api/sync`           | Offline sync queue (mobile)                          |

All responses follow `{ success: boolean, data? }` or `{ success: false, error: string }`.

---

## Authentication

- Access tokens are short-lived JWTs signed with HS256, sent via `Authorization: Bearer`.
- Refresh tokens are stored in MongoDB with expiry and rotated on each use.
- Google OAuth uses Passport.js (passport-google-oauth20). On callback, a JWT is issued and the user is redirected to the frontend with the token in the query string.
- Passwords are hashed with bcryptjs (cost factor 12).

---

## AI integration

All AI calls go through `services/groq.service.js` using the Groq API.

Model: `llama-3.1-8b-instant`. Chosen for free-tier rate limits viable for multi-user traffic (14.4K RPD, 500K TPD). Prompts use `temperature: 0.3` and `response_format: { type: 'json_object' }` where available to ensure deterministic, parseable output. Input is capped at 50,000 characters per call.

| Function                 | Input          | Output                                                                |
| ------------------------ | -------------- | --------------------------------------------------------------------- |
| `generateSummary`        | Note content   | `{ quickSummary, detailedSummary }` -- structured markdown sections   |
| `generateFlashcards`     | Note or PDF text | `{ cards: [{ front, back }] }` -- 5-20 Q&A pairs                   |
| `generateResumeFeedback` | Resume text    | Scored feedback: strengths, improvements, per-section scores, keyword analysis |

---

## Security

| Concern              | Implementation                                                 |
| -------------------- | -------------------------------------------------------------- |
| HTTP headers         | Helmet (removes `X-Powered-By`, sets CSP/HSTS/etc.)            |
| CORS                 | Restricted to `FRONTEND_URL` with explicit allowed methods     |
| Rate limiting        | `express-rate-limit` applied globally to all `/api` routes     |
| NoSQL injection      | `mongo-sanitize` strips `$`-prefixed keys from body, params, query |
| XSS / HTML injection | `sanitize-html` applied to user-generated content              |
| Body size            | Requests capped at 200kb                                       |
| Auth guard           | `middleware/auth.middleware.js` verifies JWT on protected routes |

---

## Data models

| Model          | Key fields                                                          |
| -------------- | ------------------------------------------------------------------- |
| `User`         | email, passwordHash, googleId, avatar, friends, refreshTokens       |
| `Note`         | owner, title, content, aiSummary, tags, collaborators               |
| `FlashcardSet` | owner, cards `[{ front, back }]`, source (manual/AI/PDF)            |
| `Task`         | owner, title, status (todo/in-progress/done), dueDate               |
| `Application`  | owner, company, role, status, notes, appliedAt                      |
| `Resume`       | owner, cloudinaryUrl, extractedText, aiFeedback                     |
| `Conversation` | participants `[userId]`, lastMessage                                |
| `Message`      | conversation, sender, body, readBy                                  |
| `Friendship`   | requester, recipient, status (pending/accepted)                     |
| `Activity`     | user, type, metadata, createdAt                                     |
| `RefreshToken` | userId, token, expiresAt                                            |
| `SyncQueue`    | userId, operations (offline mobile sync)                            |

---

## Real-Time & Caching

Socket.io delivers cross-user events (messages, task updates, shared content, activity feed) instantly without polling. Each user joins a private `user:<id>` room on connect; controllers emit targeted events after every write.

Redis caches high-read endpoints server-side and is invalidated on every relevant mutation. Falls back silently to MongoDB if `REDIS_URL` is not set — safe to omit in local dev.

| Cache key | TTL | Invalidated by |
|---|---|---|
| `user:<id>` | 5 min | profile update, username change |
| `activity:<id>` | 30s | any activity write |
| `shared-notes:<id>` | 60s | shareNote |
| `shared-sets:<id>` | 60s | shareSet |
| `shared-tasks:<id>` | 60s | createTask, updateTask, updateParticipants, deleteTask |

---

## Environment variables

```
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
GROQ_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
FRONTEND_URL
PORT
NODE_ENV
REDIS_URL              # optional — enables server-side caching
```

---

## Running locally

```bash
npm install
cp .env.example .env
npm run dev
```

Health check: `GET /health`
