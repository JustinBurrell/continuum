# Continuum

Continuum is a full-stack educational productivity platform built for college students. It combines note-taking, AI-powered study tools, task management, social features, and career tracking into a single cohesive product.

Built over 8 weeks for the 2026 All Star Code Technical Entrepreneurship Incubator with Google Play.

---

## Demo

> **Live app:** [https://usecontinuum.dev/](https://usecontinuum.dev/)
>
> **API docs:** [https://api.usecontinuum.dev/api-docs/](https://api.usecontinuum.dev/api-docs/)
>
> **Screenshots:** *coming soon*

### Try it yourself

Explore Continuum with the pre-loaded demo account, no sign-up required:

| Field | Value |
|-------|-------|
| Email | `janedoe_demo@example.com` |
| Password | `Demo@1234` |

The demo account comes pre-loaded with notes, flashcard sets, tasks, job applications, messages, and social content so you can explore every feature. Content is **read-only**, any changes you make won't affect other visitors' experience.

---

## What it does

- **Notes** -- rich-text note editor with AI-generated summaries and auto-generated flashcard sets
- **Flashcards** -- study mode with flip cards, progress tracking, and AI extraction from notes or uploaded PDFs
- **Tasks** -- kanban board with drag-and-drop columns and due date tracking
- **Calendar** -- event creation and scheduling integrated with the task system
- **Social** -- friend requests, activity feed, and direct messaging
- **Career** -- job application tracker with status pipeline and AI resume feedback (scored, section-by-section)
- **Auth** -- email/password and Google OAuth with JWT + refresh token rotation
- **Android** -- native Kotlin app with full web parity, offline support via Room + WorkManager, hardware-backed token storage, and real-time messaging via Socket.io

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
  android/     Native Android app — Kotlin + Jetpack Compose
  docs/        Architecture, API reference, design specs, future roadmap
```

- [backend/README.md](backend/README.md) -- API surface, auth, real-time, caching, AI integration, security
- [web/README.md](web/README.md) -- component architecture, state management, routing, UI system
- [android/README.md](android/README.md) -- architecture, offline sync, setup, features, security

---

## Tech stack


| Layer   | Stack                                                                      |
| ------- | -------------------------------------------------------------------------- |
| Backend | Node.js, Express 5, MongoDB, Mongoose, Socket.io, Redis, Groq SDK          |
| Web     | Vite, React 18, Tailwind CSS 3, React Query v5, React Router v6            |
| Android | Kotlin 2.1, Jetpack Compose (Material 3), Hilt, Retrofit 2, Room, Coil 3   |
| AI      | Groq API (llama-3.1-8b-instant) for summaries, flashcards, resume analysis |
| Storage | Cloudinary (images, PDFs)                                                  |
| Email   | Resend                                                                     |
| Auth    | JWT access tokens, refresh token rotation, Google OAuth 2.0                |


---

## API docs

Interactive API browser (Swagger UI), every endpoint, request/response schema, and live "Try it out":

**Production:** [https://api.usecontinuum.dev/api-docs/](https://api.usecontinuum.dev/api-docs/)


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

### Android

```bash
# Open android/ in Android Studio (File > Open > select android/ directory)
# Create android/local.properties with:
#   BASE_URL=https://api.usecontinuum.dev/api/
#   WEB_CLIENT_ID=<your Google Web OAuth client ID>
# Sync Gradle, then Run > Run 'app' on an API 26+ emulator or device
```

For local backend development, omit `BASE_URL` — the build script auto-detects the backend port and uses `http://10.0.2.2:<PORT>/api/` (the emulator's localhost alias). See [android/README.md](android/README.md) for full setup details.

### Tests

```bash
cd backend
npm test
```

Jest + Supertest integration suite covering auth, notes, tasks, flashcards, applications, messages, and activity. Uses an in-memory MongoDB, no Atlas connection needed.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/backend/api_reference_guide.md](docs/backend/api_reference_guide.md) | Complete REST API reference (~108 endpoints) |
| [docs/backend/system-design.md](docs/backend/system-design.md) | System architecture diagrams |
| [docs/database/mongodb_schema_explaination.md](docs/database/mongodb_schema_explaination.md) | MongoDB schema design and data model decisions |
| [docs/continuum-interview-brief.md](docs/continuum-interview-brief.md) | Interview-ready technical deep dive |
| [docs/android/architecture.md](docs/android/architecture.md) | Android MVVM + Clean Architecture reference |
| [docs/android/react-to-android.md](docs/android/react-to-android.md) | How the React web app was ported to native Kotlin |
| [docs/android/api-coverage.md](docs/android/api-coverage.md) | Android endpoint-by-endpoint API coverage matrix |
| [docs/future-ideas/demo-video-script.md](docs/future-ideas/demo-video-script.md) | Scene-by-scene Android demo recording script |
| [docs/observability/events.md](docs/observability/events.md) | PostHog events catalog — all custom events, properties, and activation funnel |
| [docs/observability/architecture.md](docs/observability/architecture.md) | Observability architecture — PostHog proxy, Sentry, identity model, how to test |
