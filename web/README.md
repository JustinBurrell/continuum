# Continuum Web

React SPA for the Continuum platform. Built with Vite, React 18, and Tailwind CSS 3.

---

## Architecture

```
web/src/
  main.jsx           App entry, QueryClientProvider, Router
  App.jsx            Route definitions (public + protected)
  lib/
    api.js           Axios instance with JWT attach + silent refresh interceptors
    queryClient.js   React Query client config
    utils.js         clsx/tailwind-merge helpers
  context/
    AuthContext.jsx  Global user state, login/logout/googleLogin
  components/
    layout/          AppLayout (protected wrapper), Sidebar
    ui/              Button, Input, Card, Badge, Modal, Skeleton, Avatar, Toast
    tasks/           Kanban-specific components
  pages/
    auth/            Login, Register, ForgotPassword, ResetPassword, AuthCallback
    notes/           NotesList, NoteDetail, NoteEditor
    flashcards/      FlashcardSets, FlashcardSetDetail, StudyMode
    tasks/           Kanban board
    applications/    ApplicationsList, ApplicationDetail
    resumes/         Resume upload and AI feedback viewer
    friends/         Friend list and requests
    messages/        Conversation list, Conversation view
    Dashboard.jsx    Activity feed and quick-access widgets
    Calendar.jsx     Event calendar
    Profile.jsx      User profile and settings
    Activity.jsx     Full activity log
```

---

## Key libraries

| Library                 | Version | Purpose                                              |
| ----------------------- | ------- | ---------------------------------------------------- |
| React                   | 18.3    | UI rendering                                         |
| Vite                    | 6       | Dev server and build tool                            |
| Tailwind CSS            | 3.4     | Utility-first styling                                |
| React Router            | v6      | Client-side routing with layout routes               |
| TanStack React Query    | v5      | Server state, caching, and background refetching     |
| React Hook Form         | 7       | Form state and validation                            |
| Axios                   | 1.7     | HTTP client with interceptors                        |
| Radix UI                | various | Accessible headless primitives (Dialog, Toast, etc.) |
| lucide-react            | 0.468   | Icon set                                             |
| class-variance-authority | 0.7   | Variant-based component styling                      |

---

## HTTP client

`lib/api.js` wraps Axios with two interceptors:

**Request:** attaches `Authorization: Bearer <token>` from `localStorage` on every outbound request.

**Response (401 handler):** on a 401, attempts a silent token refresh via `POST /api/auth/refresh`. If the refresh succeeds, the original request is retried transparently. If it fails, tokens are cleared from storage and the user is redirected to `/login`. Auth endpoints (login, register, password reset) bypass this logic so errors surface directly to components.

---

## Auth flow

**Email/password:** credentials submitted via React Hook Form, token stored in `localStorage`, `AuthContext` hydrated from the response.

**Google OAuth:** `window.location.href` redirected to the backend OAuth initiation route. After Google callback, the backend issues a JWT and redirects to `/auth/callback?token=...`. `AuthCallback.jsx` reads the token from the URL, stores it, then redirects to the dashboard.

---

## State management

- **Server state** is handled by React Query. Each resource has a dedicated query/mutation set. Cache invalidation is colocated with the mutation.
- **Auth state** lives in `AuthContext` and is initialized from `localStorage` on mount.
- **Form state** is local to each form via React Hook Form. No global form state.

### React Query config (`lib/queryClient.js`)

| Option | Value | Reason |
|--------|-------|--------|
| `staleTime` | 30s | Data is fresh for 30s after fetch — avoids redundant background refetches within a single interaction |
| `gcTime` | 30min | Data survives a full browsing session in memory — return visits are always instant, no skeleton shown |
| `retry` | ≤2, skip 401/403/429 | Transient errors retry; auth/rate-limit errors surface immediately |

### Real-time (Socket.io + React Query)

`AuthContext.jsx` connects a Socket.io client on login and registers event handlers. Each handler either writes directly into the React Query cache (for instant display) or calls `invalidateQueries` (for background refetch of the affected resource). Events covered: `new_message`, `friend_request`, `friend_accepted`, `task_updated/created/deleted`, `note_updated/shared/deleted`, `comment_added`, `flashcard_shared/set_deleted`, `activity_updated`, `study:session-complete`.

New messages use direct `setQueryData` (no round-trip) so they appear in ~0ms.

### Viewport-based prefetching

Three files in `lib/` and `hooks/` implement Instagram-style prefetching:

- **`lib/prefetchQueue.js`** — module-level singleton queue. Runs one prefetch at a time via `requestIdleCallback` so prefetching never competes with scroll or animation frames. Duplicate keys are discarded.
- **`hooks/usePrefetchOnView.js`** — `IntersectionObserver` hook. Enqueues a prefetch when an element enters the viewport. `queryKey` must be memoized at the call site.
- **`hooks/usePrefetchOnIntent.js`** — hover-intent hook with 150ms delay. Returns `onMouseEnter/onMouseLeave` handlers.

Applied to: `Sidebar.jsx` (nav links, 150ms delay), `MessagesLayout.jsx` (each conversation row prefetches its messages when visible), `Conversation.jsx` (feed-forward: prefetches the next conversation's messages).

### Optimistic updates

All user-triggered mutations update the React Query cache immediately via `onMutate`, roll back on `onError`, and show a toast so the user is never left confused by a silent state change. Covered: note delete, task status/delete, flashcard set delete, application stage update, all friend mutations (accept, decline, cancel, remove, send).

---

## UI system

Custom component library in `components/ui/`. No shadcn/ui -- all components are handwritten against the project's color palette.

Color palette:
- Primary: `#6b21a8`
- Muted: `#a087b0`
- Background: `#fef7ff`
- Accent/sidebar: `#fffade`

Radix UI primitives are used for accessibility-critical interactions (modals, dropdowns, toasts, tabs) but are always wrapped in styled components that conform to the palette above.

---

## Pages

| Page              | Route                         | Description                                   |
| ----------------- | ----------------------------- | --------------------------------------------- |
| Dashboard         | `/dashboard`                  | Activity feed, quick stats, recent items      |
| Notes             | `/notes`                      | Note list with search                         |
| Note detail       | `/notes/:id`                  | Read view with AI summary tab                 |
| Note editor       | `/notes/:id/edit`             | Rich-text editor                              |
| Flashcard sets    | `/flashcards`                 | Library of sets                               |
| Flashcard detail  | `/flashcards/:id`             | Card list and edit                            |
| Study mode        | `/flashcards/:id/study`       | Flip-card study session with progress         |
| Tasks             | `/tasks`                      | Kanban board (todo/in-progress/done)          |
| Calendar          | `/calendar`                   | Monthly event calendar                        |
| Applications      | `/applications`               | Job application tracker with status pipeline  |
| Application detail | `/applications/:id`          | Full detail, status history, notes            |
| Resumes           | `/resumes`                    | PDF upload, AI-scored feedback per section    |
| Friends           | `/friends`                    | Friend list, pending requests                 |
| Messages          | `/messages`                   | DM threads                                   |
| Profile           | `/profile`                    | Edit profile, manage linked accounts          |
| Activity          | `/activity`                   | Full activity log                             |

### Mobile Gate

On screens narrower than 768px (phones), the app renders a `MobileGate` component in place of all routes. It matches the Landing page design and displays:

- Hero copy and mobile-in-development notice
- Email capture form that calls `POST /api/waitlist` to store signups
- Placeholder section for mobile screenshots and demo video (to be filled after Android development)
- Link to the full desktop experience at usecontinuum.dev

Detection uses `window.innerWidth < 768` with a resize listener, matching Tailwind's `md:` breakpoint.

---

## Running locally

```bash
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5001
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
