# Continuum

Node.js Express MongoDB React Vite CI License

Continuum is a full-stack educational productivity platform built for college students. It combines note-taking, AI-powered study tools, task management, social features, and career tracking into a single cohesive product.

Built over 8 weeks for the 2026 All Star Code Technical Entrepreneurship Incubator with Google Play.

---

## Demo

> **Live app:** [https://continuum-web.vercel.app](https://continuum-web.vercel.app)
>
> **API docs:** [https://continuum-backend-yrrr.onrender.com/api-docs](https://continuum-backend-yrrr.onrender.com/api-docs)
>
> **Screenshots:** *coming soon*

---

## What it does

- **Notes** -- rich-text note editor with AI-generated summaries and auto-generated flashcard sets
- **Flashcards** -- study mode with flip cards, progress tracking, and AI extraction from notes or uploaded PDFs
- **Tasks** -- kanban board with drag-and-drop columns and due date tracking
- **Calendar** -- event creation and scheduling integrated with the task system
- **Social** -- friend requests, activity feed, and direct messaging
- **Career** -- job application tracker with status pipeline and AI resume feedback (scored, section-by-section)
- **Auth** -- email/password and Google OAuth with JWT + refresh token rotation

---

## System Design

System Architecture

See [docs/backend/system-design.md](docs/backend/system-design.md) for the full diagram set including the write/real-time flow, auth flow, production deployment, and scaling path.

---

## Monorepo structure

```
continuum/
  backend/     Node.js + Express REST API, MongoDB
  web/         Vite + React 18 SPA
  mobile/      Kotlin, Jetpack Compose, Android SDK (In-Progress)
  docs/        Architecture, API reference, design specs, future roadmap
```

- [backend/README.md](backend/README.md) -- API surface, auth, real-time, caching, AI integration, security
- [web/README.md](web/README.md) -- component architecture, state management, routing, UI system

---

## Tech stack


| Layer   | Stack                                                                      |
| ------- | -------------------------------------------------------------------------- |
| Backend | Node.js, Express 5, MongoDB, Mongoose, Socket.io, Redis, Groq SDK          |
| Web     | Vite, React 18, Tailwind CSS 3, React Query v5, React Router v6            |
| Mobile  | Kotlin, Jetpack Compose, Android SDK (In-Progress)                         |
| AI      | Groq API (llama-3.1-8b-instant) for summaries, flashcards, resume analysis |
| Storage | Cloudinary (images, PDFs)                                                  |
| Email   | Resend                                                                     |
| Auth    | JWT access tokens, refresh token rotation, Google OAuth 2.0                |


---

## API docs

Interactive API browser (Swagger UI) — every endpoint, request/response schema, and live "Try it out":

**Production:** [https://continuum-backend-yrrr.onrender.com/api-docs](https://continuum-backend-yrrr.onrender.com/api-docs)

**Local:**

```
http://localhost:5001/api-docs
```

Click **Authorize**, paste a JWT, and execute any endpoint directly from the browser.

---

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY, etc.
npm run dev            # starts on http://localhost:5001
```

### Web

```bash
cd web
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5001
npm run dev
```

### Tests

```bash
cd backend
npm test
```

Jest + Supertest integration suite covering auth, notes, tasks, flashcards, applications, messages, and activity. Uses an in-memory MongoDB — no Atlas connection needed.