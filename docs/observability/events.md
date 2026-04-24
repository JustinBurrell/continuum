# PostHog Events Catalog

All custom events tracked in Continuum. Every event is either fired from the **frontend** (React web, `posthog-js`) or the **backend** (Node.js, `posthog-node`).

---

## Identity

Before any custom events fire, the frontend calls `posthog.identify()` to link the PostHog person to the logged-in user.

| Call | distinctId | Properties |
|------|-----------|------------|
| `posthog.identify()` | MongoDB `_id` | `email`, `username`, `name`, `created_at` |

Called on: email login, email registration, Google OAuth callback, and page hydration (if a stored token exists).  
`posthog.reset()` is called on logout to clear the local identity.

---

## Auth Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `user_registered` | frontend | Successful email/password registration | `platform: 'web'`, `method: 'email'` |
| `user_logged_in` | frontend | Successful login (email or Google OAuth) | `platform: 'web'`, `method: 'email' \| 'google'` |
| `user_logged_out` | frontend | User clicks logout | `platform: 'web'` |

---

## Notes Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `note_created` | backend | A new note is saved | `noteId`, `userId` |
| `note_summary_generated` | backend | AI summary is generated for a note | `noteId`, `userId` |

---

## Flashcards Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `flashcard_set_generated` | backend | AI generates a flashcard set from a note or PDF | `flashcardSetId`, `userId`, `cardCount` |

---

## Study Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `study_session_started` | frontend | User begins a study session on a flashcard set | `platform: 'web'`, `set_id` |
| `study_session_completed` | backend | User finishes a study session | `sessionId`, `flashcardSetId`, `userId`, `cardsStudied`, `score` |

---

## Resume Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `resume_uploaded` | frontend | User uploads a PDF resume to Cloudinary | `platform: 'web'` |
| `resume_feedback_generated` | backend | AI runs section-by-section resume analysis | `resumeId`, `userId` |

---

## Career Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `job_application_created` | backend | User creates a new job application entry | `applicationId`, `userId` |

---

## Task Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `task_created` | backend | User creates a new task | `taskId`, `userId` |

---

## Social Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `friend_request_sent` | backend | User sends a friend request | `fromUserId`, `toUserId` |
| `message_sent` | backend | User sends a direct message | `conversationId`, `userId` |
| `comment_added` | backend | User leaves a comment on a note, flashcard set, or task | `commentId`, `targetId`, `targetType` |

---

## Autocapture Events (PostHog built-in)

These fire automatically — no code required.

| Event | Description |
|-------|-------------|
| `$pageview` | Every page navigation |
| `$pageleave` | User leaves a page |
| `$autocapture` | Clicks, form interactions, and other DOM events |
| `$identify` | Identity merge when `posthog.identify()` fires |
| `$set` | Person property update |

---

## Activation Funnel

The core activation funnel in PostHog (saved as **Activation Funnel** on the **Launch** dashboard):

```
user_registered
  → flashcard_set_generated OR note_summary_generated OR resume_feedback_generated
```

Conversion window: 7 days, Sequential order.

This measures whether a new user reaches a meaningful "aha moment" — generating AI-powered content — within their first week.
