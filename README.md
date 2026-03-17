# Continuum

Continuum is a full-stack educational productivity platform built for college students. It combines note-taking, AI-powered study tools, task management, social features, and career tracking into a single cohesive product.

Built over 8 weeks for the 2026 All Star Code Technical Entrepreneurship Incubator with Google Play.

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

## Monorepo structure

```
continuum/
  backend/     Node.js + Express REST API, MongoDB
  web/         Vite + React 18 SPA
  mobile/      React Native + Expo (in progress)
```

- [backend/README.md](backend/README.md) -- API surface, auth, AI integration, security, data models
- [web/README.md](web/README.md) -- component architecture, state management, routing, UI system

---

## Tech stack

| Layer    | Stack                                                           |
| -------- | --------------------------------------------------------------- |
| Backend  | Node.js, Express 5, MongoDB, Mongoose, Passport.js, Groq SDK   |
| Web      | Vite, React 18, Tailwind CSS 3, React Query v5, React Router v6 |
| Mobile   | React Native, Expo                                              |
| AI       | Groq API (llama-3.1-8b-instant) for summaries, flashcards, resume analysis |
| Storage  | Cloudinary (images, PDFs)                                       |
| Email    | Resend                                                          |
| Auth     | JWT access tokens, refresh token rotation, Google OAuth 2.0    |

---

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY, etc.
npm run dev
```

### Web

```bash
cd web
npm install
cp .env.example .env   # fill in VITE_API_URL
npm run dev
```
