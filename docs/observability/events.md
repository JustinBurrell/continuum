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
| `account_deletion_requested` | backend | User soft-deletes their account (30-day grace period starts) | `scheduledDeletionAt` |
| `account_restored` | backend | User recovers their account before the 30-day window closes | — |

---

## Notes Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `note_created` | backend | A new note is saved | `noteId`, `userId` |
| `note_summary_generated` | backend | AI summary is generated for a note | `noteId`, `userId` |
| `note_deleted` | backend | User soft-deletes a note | `noteId` |
| `note_shared` | backend | User shares a note with friends or specific users | `noteId`, `visibility`, `recipientCount` |
| `google_doc_imported` | backend | User imports a Google Doc as a note | `noteId` |

---

## Flashcards Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `flashcard_set_generated` | backend | AI generates a flashcard set from a note or PDF | `flashcardSetId`, `userId`, `cardCount` |
| `flashcard_set_deleted` | backend | User deletes a flashcard set | `flashcardSetId` |
| `flashcard_set_shared` | backend | User shares a flashcard set with friends or specific users | `flashcardSetId`, `visibility`, `recipientCount` |

---

## Study Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `study_session_started` | frontend | User begins a study session on a flashcard set | `platform: 'web'`, `set_id` |
| `study_session_completed` | backend | User finishes a study session | `sessionId`, `flashcardSetId`, `userId`, `cardsStudied`, `score` |
| `study_session_abandoned` | frontend | User leaves study mode after marking at least one card, without finishing | `platform: 'web'`, `set_id`, `cards_seen` |

---

## Resume Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `resume_uploaded` | frontend | User uploads a PDF resume to Cloudinary | `platform: 'web'` |
| `resume_feedback_generated` | backend | AI runs section-by-section resume analysis | `resumeId`, `userId` |
| `resume_score_viewed` | frontend | User opens the AI feedback panel on a resume that has feedback | `platform: 'web'`, `resumeId` |

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
| `task_shared` | backend | User creates a shared task with participants | `taskId`, `recipientCount` |

---

## Social Events

| Event | Source | Fired When | Key Properties |
|-------|--------|-----------|----------------|
| `friend_request_sent` | backend | User sends a friend request | `fromUserId`, `toUserId` |
| `friend_request_accepted` | backend | User accepts a friend request | `friendshipId`, `fromUserId` |
| `message_sent` | backend | User sends a direct message | `conversationId`, `userId` |
| `comment_added` | backend | User leaves a top-level comment on a note, flashcard set, or task | `commentId`, `targetId`, `targetType` |
| `comment_reply_added` | backend | User replies to an existing comment | `commentId`, `targetId`, `targetType`, `parentCommentId` |

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
