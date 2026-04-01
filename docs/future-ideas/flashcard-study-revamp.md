# Feature: Flashcard Study Revamp (Streaks + Session History)

**Status:** Planned
**Priority:** Medium
**Type:** Enhancement

---

## Overview

The product page promises "Study streaks and session history" for flashcards — neither currently exists. This feature adds:

1. **Study streak** — a consecutive-days counter that increments each calendar day the user completes at least one study session. Displayed prominently on the flashcard sets page and on user profiles.
2. **Session history** — a log of every completed study session, scoped to each set and rolled up globally. Each entry records score, duration, card count, and timestamp.

The backend already has stubs (`studySessionCount`, `lastStudiedAt` on `FlashcardSet`) but no session boundaries, no duration tracking, and no streak logic. This revamp fills all of that in.

---

## User Stories

- As a user, I want to see my current streak on the flashcard sets page so I'm motivated to study daily.
- As a user, I want to view my session history for a specific set so I can track improvement over time.
- As a user, I want to see my all-time stats (total sessions, best streak, avg score) on my profile.
- As a friend, I want to see another user's current streak on their profile.

---

## Data Model Changes

### New Model: `StudySession`

```js
// backend/models/StudySession.js
{
  userId:         { type: ObjectId, ref: 'User', required: true, index: true },
  setId:          { type: ObjectId, ref: 'FlashcardSet', required: true, index: true },
  completedAt:    { type: Date, required: true, default: Date.now },
  durationSeconds:{ type: Number, required: true },   // wall-clock time from first card to submit
  totalCards:     { type: Number, required: true },
  correctCount:   { type: Number, required: true },
  score:          { type: Number, required: true },   // 0–100, Math.round(correct/total * 100)
  cardResults: [{                                      // one entry per card answered
    cardId:   { type: ObjectId, ref: 'Flashcard' },
    correct:  Boolean,
  }],
}
// indexes: { userId, completedAt } compound — for streak + global history queries
// indexes: { userId, setId, completedAt } compound — for per-set history
```

> `cardResults` is optional on read — only fetch when rendering the per-session detail view.

### Changes to `FlashcardSet`

Remove the stub `studySessionCount` field (or keep it as a denormalized cache — see below). Add nothing else; session data lives in `StudySession`.

Recommendation: keep `studySessionCount` and `lastStudiedAt` as denormalized counters updated on each session write. They power quick card-list queries without joining `StudySession`.

### Changes to `User`

Add a virtual or computed stats object — **do not embed streak in the User document**. Streak is derived from `StudySession` records at read time (or cached in Redis with a short TTL).

```
// Derived, not stored:
studyStreak: {
  current: Number,       // consecutive calendar days ending today (or yesterday)
  longest: Number,       // all-time longest streak
  lastStudiedAt: Date,
}
```

If caching: key `study-streak:<userId>`, TTL 30 min, invalidated on every new session write.

---

## Session Boundary Rules

- A new `StudySession` is created every time the user clicks "Study" and completes all cards (reaches the completion screen).
- Abandoning mid-session (navigating away) does not create a record.
- Re-studying the same set on the same calendar day creates a second session record — both count toward streaks but both appear in history.

---

## Streak Calculation

```
streak = 0
today  = toDateString(now)  // "2026-03-31"

get all distinct study dates for this user (completedAt, descending)
if today not in dates AND yesterday not in dates → streak = 0
else walk dates backwards counting consecutive calendar days
```

"Calendar day" is in the user's local timezone — use UTC date boundary on the backend, accept a `tz` query param (or derive from the client's offset header). If timezone is not provided, default to UTC.

A streak is maintained if the user studied yesterday. If they have not studied today yet, the streak is still alive (not broken until they miss a full calendar day).

---

## API Changes

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/study-sessions` | Required | Submit a completed session |
| GET | `/api/study-sessions/me` | Required | Paginated session history for the current user (all sets) |
| GET | `/api/study-sessions/sets/:setId` | Required | Session history for a specific set (owner or shared viewer) |
| GET | `/api/study-sessions/streak` | Required | Current user's streak + longest streak |
| GET | `/api/users/:id/streak` | Required | Public streak for another user's profile |

### POST `/api/study-sessions` — Submit Session

Request body:

```json
{
  "setId": "<ObjectId>",
  "durationSeconds": 142,
  "cardResults": [
    { "cardId": "<ObjectId>", "correct": true },
    { "cardId": "<ObjectId>", "correct": false }
  ]
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "session": { "_id": "...", "score": 75, "correctCount": 3, "totalCards": 4, "durationSeconds": 142, "completedAt": "..." },
    "streak": { "current": 5, "longest": 12 }
  }
}
```

Side effects:
- Creates `StudySession` document
- Updates `FlashcardSet.lastStudiedAt` and increments `FlashcardSet.studySessionCount`
- Calls existing `trackProgress` logic per card (or consolidate into this endpoint to eliminate the N individual card progress calls currently made during study)
- Emits socket event `study:session-complete` to `user:<id>` room (for live profile/streak updates)
- Invalidates `study-streak:<userId>` Redis cache key

### GET `/api/study-sessions/me`

Query params: `page` (default 1), `limit` (default 20), `setId` (optional filter)

Response: paginated list of sessions with `setTitle` populated from `FlashcardSet`.

### GET `/api/study-sessions/sets/:setId`

Returns sessions for this set belonging to the current user. Access check: user must be owner or appear in `sharedWith` / friends (matching existing sharing rules).

### GET `/api/study-sessions/streak`

Response:

```json
{
  "success": true,
  "data": {
    "current": 5,
    "longest": 12,
    "lastStudiedAt": "2026-03-30T..."
  }
}
```

### GET `/api/users/:id/streak`

Same shape as above. Only `current` and `longest` are public — do not expose `lastStudiedAt` on other users' profiles.

---

## Changes to Existing Endpoints

### `PUT /api/flashcard-sets/:setId/cards/:cardId/progress`

Currently called once per card during study. After this revamp, individual card progress calls become redundant during a session — consolidate into the session submit. Options:

**Option A (preferred):** Deprecate the per-card progress endpoint. Session submit applies all card progress in bulk.

**Option B (incremental):** Keep per-card endpoint as-is; session submit is additive. Simpler rollout but redundant writes.

The spec assumes Option A. Per-card `userProgress` (confidence, correctCount, incorrectCount) is still updated — just batched through the session endpoint.

---

## Frontend Changes

### `FlashcardSets.jsx` — Streak Banner

Above the sets grid, add a streak section:

```
[ 🔥 5-day streak ]  [ Session History ↗ ]
```

- Streak count fetched from `GET /api/study-sessions/streak` on page load.
- If streak is 0 or no sessions exist, show "Start your streak today" instead.
- "Session History" link navigates to `/flashcards/history` (global history page).

### New Page: `FlashcardHistory.jsx` (`/flashcards/history`)

- Full list of past sessions, newest first.
- Each row: set name, date, score (e.g. "8/10 · 83%"), duration ("2m 14s").
- Clicking a row expands card-by-card breakdown (from `cardResults`).
- Filter by set via dropdown.

### `FlashcardSetDetail.jsx` — Per-Set History Tab

Add a "History" tab alongside the cards list. Fetches `GET /api/study-sessions/sets/:setId`. Shows sessions newest first: date, score, duration. Same expandable row as global history.

Also display best score and session count in the set header.

### `StudyMode.jsx` — Session Timing + Submit

- Record `sessionStartedAt = Date.now()` when study mode mounts.
- On completion screen, call `POST /api/study-sessions` with `durationSeconds` and `cardResults` built from the existing `known` set state.
- Display score from session response (already shown, now backed by API).
- Show streak delta on completion screen: "You're on a 5-day streak!"

### `Profile.jsx` / `UserProfile.jsx` — Streak Display

- On own profile: fetch streak from `GET /api/study-sessions/streak`. Show below badges.
- On other user's profile: fetch from `GET /api/users/:id/streak`. Show same widget.
- Display: "5-day study streak" with a small calendar icon or flame icon. If streak is 0, omit the widget.

---

## Socket.io Events

| Event | Room | Payload | Purpose |
|-------|------|---------|---------|
| `study:session-complete` | `user:<id>` | `{ sessionId, score, streak }` | Update streak display live if profile is open in another tab |

---

## Redis Caching

| Key | TTL | Invalidated by |
|-----|-----|----------------|
| `study-streak:<userId>` | 30 min | `POST /api/study-sessions` |

---

## Required Updates When Implemented

### Jest (`backend/tests/`)

New test suite: `backend/tests/jest/study-sessions.test.js`

- `POST /api/study-sessions` → creates session, returns score + streak
- `POST /api/study-sessions` with missing `setId` → 400
- `GET /api/study-sessions/me` → returns paginated list for current user only
- `GET /api/study-sessions/sets/:setId` → returns set-scoped history
- `GET /api/study-sessions/sets/:setId` for unrelated user → 403
- `GET /api/study-sessions/streak` → returns `{ current, longest }`
- `GET /api/users/:id/streak` → returns public streak for other user
- Streak calculation: two sessions on same day → streak = 1; sessions on consecutive days → streak = 2; gap of 2 days → streak resets

### Postman

- Add `Study Sessions` folder under `Flashcards` collection
- Document all 5 new endpoints with example bodies and responses
- Update `POST /flashcard-sets/:setId/cards/:cardId/progress` description to note deprecation path

### Swagger

- Add `StudySession` schema to components
- Document all 5 new endpoints with request/response schemas
- Add `streak` object to `User` response schema (virtual, derived)

### Docs

- `docs/database/schema_diagram.md` — add `StudySession` entity with relationships to `User` and `FlashcardSet`
- `backend/README.md` — add `StudySession` to Data Models table; add `/api/study-sessions` to API Surface table
- `docs/future-ideas/flashcard-study-revamp.md` — update Status: Planned → Implemented when done

---

## Acceptance Criteria

- [ ] Completing a study session creates a `StudySession` document with correct score, duration, and card results
- [ ] `GET /api/study-sessions/streak` returns correct streak after studying on consecutive days
- [ ] Streak resets if user skips a full calendar day
- [ ] Streak widget appears on `/flashcards` page with live data
- [ ] Session history is visible on `FlashcardSetDetail` per-set tab and `/flashcards/history` global page
- [ ] Streak (current + longest) is visible on own Profile and other users' profiles
- [ ] Abandoning a session mid-way does not create a session record
- [ ] Shared set history is scoped to the current user's sessions only
- [ ] All new endpoints are covered by Jest tests
- [ ] Swagger docs updated
