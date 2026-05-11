# Continuum
## API Reference Guide

**Version**: 1.0 MVP
**Base URL**: `/api`
**Format**: REST JSON
**Authentication**: JWT + Google OAuth

---

## Authentication & User Management

### **Authentication**
- `POST /api/auth/register` - Create new user account, return JWT + refresh token. Email and username are checked separately — returns 409 `'Email already registered'` or `'Username already taken'` with distinct messages so the UI can surface which field is the problem.
- `POST /api/auth/login` - Authenticate user, return JWT + refresh token
- `POST /api/auth/refresh` - Exchange a valid refresh token for a new access token with full token rotation — the old token is immediately revoked and a new httpOnly cookie is issued. Old `sessionId` written to Redis blocklist to reject any still-valid JWT bearing it. Device/location metadata inherited by new token. (public)
- `POST /api/auth/logout` - Revoke current device's refresh token (protected)
- `POST /api/auth/logout-all` - Immediately invalidate all sessions — increments `tokenVersion` so existing JWTs are rejected on the next request, then revokes all refresh tokens (protected)
- `GET /api/auth/sessions` - List all active (non-revoked, non-expired) sessions for the current user. Response: `{ sessions: [{ _id, deviceId, ipLocation, lastUsedAt, createdAt, isCurrent }] }`. `ipLocation` is a human-readable city/country (e.g. `"San Francisco, CA"`) resolved from the login IP via `geoip-lite`; null for local/unknown IPs. `isCurrent` is true for the session that issued the request's JWT (protected)
- `DELETE /api/auth/sessions/:id` - Revoke a single session by RefreshToken `_id`. Immediately invalidates any active JWT for that session via a Redis blocklist key (`revoked_session:{id}`, TTL 1 day) — fail-open if Redis unavailable. Returns 404 if not found or already revoked (protected)
- `GET /api/auth/google` - Initiate Google OAuth consent flow (login or registration)
- `GET /api/auth/google/callback` - Handle OAuth callback, find/create user, return JWT
- `GET /api/auth/me` - Retrieve authenticated user from token
- `POST /api/auth/forgot-password` - Send password reset email via Resend
- `POST /api/auth/reset-password` - Verify reset token and set new password

Users can register with email/password OR Google OAuth. Both paths create the same User document. Login and register return a short-lived JWT (1d) and a long-lived refresh token (30d). Each device gets its own refresh token. The JWT payload includes `sessionId` (the RefreshToken `_id`) so per-session revocation takes effect immediately without waiting for token expiry. `logout-all` increments `tokenVersion` to immediately invalidate all sessions across all devices.

### **Mobile Authentication**

The Android native app cannot use httpOnly cookies (no browser cookie jar). Four mobile-specific endpoints return tokens in the JSON response body for storage in Android's EncryptedSharedPreferences:

- `POST /api/auth/mobile/login` - Same validation as `/login`. Returns `{ token, refreshToken, user }` in the body (no cookie). Stores device metadata from `User-Agent` header for session labeling (e.g. "Pixel 8 on Android 15").
- `POST /api/auth/mobile/refresh` - Token rotation. Body: `{ refreshToken }`. Returns `{ token, refreshToken }`. Old token is revoked immediately.
- `POST /api/auth/google/mobile` - Accepts a Google ID token from Android's Credential Manager. Body: `{ idToken }`. Verifies via `google-auth-library`, finds/creates user, returns `{ token, refreshToken, user }`. Does not use redirect-based OAuth flow.
- `POST /api/auth/mobile/logout` - Server-side logout for mobile. Body: `{ refreshToken }`. Hashes the refresh token (SHA-256), finds and deletes the matching RefreshToken document, effectively revoking the session. Protected by auth middleware.

All four endpoints are defined in `routes/auth.routes.js` and handled by `controllers/mobileAuth.controller.js`. The mobile client identifies itself via the `X-Client-Type: android` header on every request.

### **User Profile**
- `PATCH /api/auth/me/profile` - Update user profile information (name, bio, avatarUrl, settings)
- `PATCH /api/auth/me/username` - Change username. Validates format (3–30 chars, letters/numbers/underscores/hyphens) and checks uniqueness. Returns 409 if taken.
- `PATCH /api/auth/me/password` - Change password. Body: `{ currentPassword, newPassword }`. Verifies current password before updating. Applies same validation rules as registration (8+ chars, letter, number, special char). Returns 400 for Google-only accounts with no password set.
- `DELETE /api/auth/me` - Soft-mark account for deletion with a 30-day grace period. Body: `{ password }` — required for email/password users; optional for Google-only accounts. Revokes all active sessions and sends a deletion notice email. User can restore by logging in or calling `POST /api/auth/me/restore` before the deadline. After 30 days, a lazy cascade hard-deletes all data (User, Notes, FlashcardSets, Tasks, Applications, Resumes, Activity, Comments, Messages, Friendships, RefreshTokens, SyncQueue, Cloudinary assets). Returns 401 "Invalid credentials" if grace period has expired.
- `POST /api/auth/me/restore` - Cancel a pending deletion and restore the account. Clears `pendingDeletion` and `scheduledDeletionAt`. Logging in during the grace period also restores automatically.

### **Google Account Linking**
- `POST /api/auth/me/google/link` - Initiate Google OAuth to link Google account to existing user
- `DELETE /api/auth/me/google/link` - Unlink Google account (body: `{ keepNotes: true/false }`)

Google linking is required for Google Drive/Docs features. `user.hasGoogleLinked` virtual tracks status. When unlinking, user chooses whether to keep imported notes as standalone copies or delete them.

---

## Google Integration & Notes

### **Google Integration**
- `GET /api/google/token` - Return the authenticated user's decrypted Google access token (auto-refreshes if expired). Used by the web frontend to authorize the Google Picker. Requires Google account linked (403 otherwise).

Note: `GET /api/google/files` was removed in the `drive.file` scope migration. Drive-wide file listing is no longer supported — users select specific docs via Google Picker (web) or by pasting a Google Docs URL (Android).

### **Note Management**
- `POST /api/notes` - Create manual note directly in app
- `GET /api/notes` - List user's notes. Query params: `search` (title regex), `type`, `page` (default 1), `limit` (default 20). Response: `{ notes[], pagination: { total, page, limit, pages } }`. `pagination.total` is the authoritative count across all pages — clients must paginate to fetch all notes.
- `GET /api/notes/:noteId` - Retrieve specific note with full content and embedded summary. Accessible by owner, users in `sharedWith`, or friends when `visibility: 'friends'`. Response includes populated `userId` (username, firstName, lastName, avatarUrl) for creator attribution.
- `PUT /api/notes/:noteId` - Update note title, tags, content, contentType, or visibility
- `DELETE /api/notes/:noteId` - Soft delete note
- `POST /api/notes/import` - Import Google Doc as note snapshot; PDF stored as Cloudinary `authenticated` resource
- `POST /api/notes/upload` - Upload a local PDF as a note (multipart/form-data, field: `file`; optional: `title`, `type`, `tags`); PDF stored as Cloudinary `authenticated` resource
- `GET /api/notes/:noteId/pdf` - Generate a 10-minute signed download URL for the note's source PDF (only available for imported/uploaded notes that have `pdfUrl`)
- `PUT /api/notes/:noteId/refresh` - Re-import latest version of linked Google Doc

---

## AI-Powered Learning

### **AI Summaries**

**Rate limits:** Two layers — (1) per-user daily cap tracked via Redis INCR: Summary 25/day (`ai:summary:<userId>:<date>`), Flashcards 25/day (`ai:flashcards:<userId>:<date>`), Resume feedback 5/day (`ai:resume:<userId>:<date>`); (2) express-rate-limit burst guard: 5 req/min per user (keyed by `req.user._id`). Returns 429 on breach of either layer. Falls back to allowing calls if Redis is unavailable.

- `POST /api/notes/:noteId/summary` - Generate AI summary. For the owner: persists to note document and returns updated note. For shared users: generates and returns summary without persisting.

Summary is stored as an embedded field on the Note document for the owner. When you `GET /api/notes/:noteId`, the `summary` object is included automatically — no separate fetch needed.

### **Flashcard System**
- `POST /api/notes/:noteId/flashcards/generate` - Auto-generate flashcards from note content via Groq. Accessible by owner and shared users. The resulting FlashcardSet is always owned by the requesting user. `note.hasFlashcards` is only updated when the owner generates.
- `POST /api/flashcard-sets` - Create flashcard set manually
- `GET /api/flashcard-sets` - List user's flashcard sets. Query params: `search` (title regex), `page` (default 1), `limit` (default 20). Response: `{ sets[], pagination: { total, page, limit, pages } }`. `pagination.total` is the authoritative count — clients must paginate to fetch all sets.
- `GET /api/flashcard-sets/:setId` - Get set with all flashcards. Accessible by owner, users in `sharedWith`, or friends when `visibility: 'friends'`. Response includes populated `userId` (username, firstName, lastName, avatarUrl) for creator attribution.
- `PATCH /api/flashcard-sets/:setId` - Update set title and/or description. Owner-only. Body: `{ title?, description? }` — at least one required; title cannot be empty.
- `POST /api/flashcard-sets/:setId/cards` - Add card to set
- `PUT /api/flashcard-sets/:setId/cards/:cardId` - Edit flashcard front and back content
- `PUT /api/flashcard-sets/:setId/cards/:cardId/progress` - Update study progress (correct/incorrect) — **deprecated**: use `POST /api/study-sessions` which applies all card progress in bulk
- `DELETE /api/flashcard-sets/:setId` - Soft delete flashcard set
- `POST /api/flashcard-sets/:setId/duplicate` - Create a personal copy of an accessible set owned by the requesting user. Copies all cards; does not copy per-card `userProgress`. Access: owner or any user with read access (sharedWith or friends visibility).

### **Study Sessions**
- `POST /api/study-sessions` - Submit a completed study session. Body: `{ setId, durationSeconds, cardResults: [{ cardId, correct }] }`. Applies bulk card progress, updates `FlashcardSet.studySessionCount` and `lastStudiedAt`, invalidates streak cache, emits `study:session-complete` socket event. Response: `{ session, streak }`.
- `GET /api/study-sessions` - Paginated session history for the authenticated user. Query params: `page`, `limit` (default 20), `setId` (optional filter). Response: `{ sessions, total, page, limit }`.
- `GET /api/study-sessions/streak` - Current user's streak (consecutive calendar days with at least one session). Response: `{ success, streak }`. Cached in Redis 30 min.
- `GET /api/study-sessions/set/:setId` - Session history scoped to one flashcard set. Access: owner or users with read access to the set. Response: `{ sessions, total, page, limit }`.
- `GET /api/study-sessions/:id` - Single session by ID including full `cardResults`. Owner-only.

Streak is computed from UTC calendar dates — a streak stays alive if the user studied yesterday but not yet today. It resets only when a full calendar day is missed.

---

## Task & Calendar Management

### **Task Operations**
- `POST /api/tasks` - Create task with due date, priority, type (`homework|study|project|exam|club|professional|personal|other`), duration, and optional note link
- `GET /api/tasks` - List tasks with filters. Query params: `search` (title regex), `status` (`todo`|`in_progress`|`completed`), `priority`, `startDate`, `endDate`, `page` (default 1), `limit` (default 20). Response: `{ tasks[], pagination: { total, page, limit, pages } }`. Use `?status=todo&limit=1` for count-only queries (the dashboard open-tasks stat pattern).
- `PUT /api/tasks/:taskId` - Update task properties (title, status, priority, type, due date)
- `PATCH /api/tasks/:taskId/status` - Quick status update
- `DELETE /api/tasks/:taskId` - Soft delete task (owner only)

### **Calendar Views**
- `GET /api/calendar` - Aggregate tasks and shared tasks for calendar rendering

**How `/api/calendar` works:**
- Accepts `from` and `to` date parameters (ISO 8601 format)
- Returns all tasks owned by user with due dates in range
- Includes shared tasks where user is a participant
- Pre-aggregates data optimized for calendar UI rendering
- Returns structured format with task details (title, due date, priority, status, duration)

---

## Social & Collaboration

### **Friend Management**
- `GET /api/users/search` - Search users by username or email
- `GET /api/users/:id` - Get a user's public profile (returns `{ _id, username, firstName, lastName, avatarUrl, bio, createdAt }`; no email, tokens, or settings)
- `GET /api/users/:id/streak` - Get another user's public study streak (returns `{ success, streak }` — count only, no session details)
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/request/:requestId` - Accept or reject friend request
- `GET /api/friends` - List current friends. Supports `?search=` for accepted friends: two-step lookup — matches users by firstName/lastName/username, then filters friendships to those involving the matched users.
- `DELETE /api/friends/:friendId` - Remove friend

### **Content Sharing**
- `PUT /api/notes/:noteId/share` - Update note visibility (private, friends, or specific users). When visibility is `specific`, an auto-message is sent to each user in `sharedWith` via the messaging system.
- `GET /api/notes/shared` - List notes shared with the current user (supports `?search=` query param for title/content filtering)

### **Engagement**
- `POST /api/comments` - Add comment on a note or flashcard set (targetId + targetType)
- `GET /api/comments/:targetType/:targetId` - List comments on a resource
- `POST /api/comments/:commentId/like` - Toggle like on a comment
- `DELETE /api/comments/:commentId` - Soft delete comment

### **Shared Tasks**
- `PUT /api/tasks/:taskId` - Update task properties including participants
- `PATCH /api/tasks/:taskId/participants` - Add or remove participants on a shared task (validates friendship). Sends auto-message to newly added participants via the messaging system.
- `GET /api/tasks/shared` - List tasks shared with the current user. Supports `?search=` for title regex match.

### **Flashcard Set Sharing**
- `PATCH /api/flashcard-sets/:setId/share` - Update flashcard set visibility (private, friends, or specific users). When visibility is `specific`, an auto-message is sent to each user in `sharedWith` via the messaging system.
- `GET /api/flashcard-sets/shared` - List flashcard sets shared with the current user. Supports `?search=` for title regex match.

### **Activity Feed**
- `GET /api/activity` - List activity feed for the authenticated user (cursor-based pagination). Query params: `limit` (default 20, max 50), `cursor` (compound `ISO|objectId` string — the `createdAt` and `_id` of the last item on the previous page), `search`, `since` (ISO timestamp). Returns `{ feed[], nextCursor, total }` — `nextCursor` is a compound cursor string when more results exist, or `null` when all results have been loaded; `total` is the count of visible activities (filtered by `since` when provided — used by the dashboard to show unseen/unread count). Each cursor page is cached in Redis independently (`activity:<userId>:<cursor | 'first'>:<limit>`, TTL 5 min); all first-page key variants are invalidated by prefix pattern when new activity arrives. Supports `?search=` — two-step lookup matches users by `firstName`/`lastName`/`username` first, then returns activities where `userId` matches OR any of `metadata.noteTitle`, `metadata.setTitle`, `metadata.taskTitle`, `metadata.commentPreview` match the regex. Search bypasses cache. The `since` param only affects the `total` count (not the feed), enabling the dashboard to show how many activities have arrived since the user last visited `/activity`. The source of `since` is `user.lastViewedActivityAt` (stored server-side — consistent across devices and sessions).
- `PUT /api/activity/mark-seen` - Set `lastViewedActivityAt` to the current time on the authenticated user. Called when the user opens `/activity`. Returns `{ success: true }`. The frontend then calls `updateUser({ lastViewedActivityAt })` in AuthContext so the Dashboard unseen count resets immediately without a full refresh.

Activity is driven by `settings.activityVisibility` on the User (default: `friends`). The actor always sees their own activity regardless of this setting. `private` means only the actor sees their activity, `friends` also makes it visible to accepted friends, `public` makes it visible to all (backend-only, not exposed in frontend settings). Activity types: `note_shared`, `task_created` (shared tasks only), `comment_added`, `like_added`, `flashcard_shared`.

Sharing activities are personalized: the sharer's feed shows who they shared with (e.g., "shared note X with Alice, Bob"), while each recipient sees "shared note X with you". Recipient names are clickable links to their profile. When shared with all friends (`visibility: 'friends'`), the activity says "shared with friends" without listing names.

---

## Direct Messaging

### **Conversations**
- `POST /api/conversations` - Create or retrieve conversation with a user (find-or-create). Skips conversations the current user has soft-deleted.
- `GET /api/conversations` - List user's conversations (inbox), sorted by latest message. Supports `?search=` for participant name. Excludes conversations soft-deleted for the current user.
- `DELETE /api/conversations/:id` - Instagram-style soft delete — hides conversation from current user's inbox; other participant is unaffected.
- `POST /api/conversations/:conversationId/messages` - Send a message in a conversation
- `GET /api/conversations/:conversationId/messages` - List messages (cursor pagination via `?limit=&before=`). Supports `?search=` for content regex match; polling is disabled on the frontend while search is active.
- `DELETE /api/messages/:messageId` - Instagram-style soft delete — hides message from current user's view only; other participant unaffected.
- `PUT /api/messages/:messageId/read` - Mark message as read, reset unread count

---

## Career Management

### **Resume Management**
- `POST /api/resumes/upload` - Upload resume PDF with label and target role (multipart/form-data); stored as `type: authenticated` in Cloudinary
- `GET /api/resumes` - List all resume versions for user. Supports `?search=` for case-insensitive regex match on `fileName`, `version`, and `targetRole`.
- `GET /api/resumes/:resumeId/download` - Generate a download URL (adds `fl_attachment` transform); used by both the Download button and the PDF viewer modal on web
- `POST /api/resumes/:resumeId/feedback` - Generate AI-powered feedback via Groq (appended to embedded feedback array)
- `GET /api/resumes/:resumeId/feedback` - Retrieve all feedback entries for a resume
- `DELETE /api/resumes/:resumeId` - Soft delete resume

Resume PDFs are stored as Cloudinary `authenticated` resources — direct URLs return 401. The `/download` endpoint generates a signed API-level URL that works regardless of the resource's upload type. Feedback is stored as an embedded array on the Resume document.

### **Application Tracking**
- `POST /api/applications` - Create job/internship application entry
- `GET /api/applications` - List applications with status and search filters
- `GET /api/applications/:id` - Get single application by ID with contacts and reminders
- `PUT /api/applications/:id` - Update application status, notes, or details
- `DELETE /api/applications/:id` - Soft delete application entry
- `GET /api/applications/dashboard` - Get pipeline overview with status counts
- `POST /api/applications/:id/contacts` - Add networking contact
- `DELETE /api/applications/:id/contacts/:contactId` - Remove a contact from an application
- `POST /api/applications/:id/reminders` - Add follow-up reminder
- `DELETE /api/applications/:id/reminders/:reminderId` - Remove a reminder from an application

---

## Offline Sync

### **Sync Queue**
- `POST /api/sync` - Process a batch of queued offline operations

Body: `{ operations: [{ operation, collection, documentId?, data?, clientTimestamp? }] }`
- `operation`: `create` | `update` | `delete`
- `collection`: `notes` | `tasks` | `flashcards` | `messages`

Returns per-entry `{ entryId, status, operation, collection, documentId }` — failed entries include `error`. Each operation is tracked in the SyncQueue collection. Conflict behavior: `update` on a deleted doc silently completes; `delete` is idempotent; `create` duplicate fails.

---

## System Health

### **Monitoring**
- `GET /health` - System health check endpoint

---

## Common Conventions

### **Headers**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

### **Date/Time Format**
ISO 8601 strings, UTC recommended
```
2026-01-12T21:15:00Z
```

### **Pagination**

Two patterns are used depending on the endpoint:

**Page-based** (notes, flashcard sets, tasks):
```
?page=1&limit=20
```
Response includes `pagination: { total, page, limit, pages }`. `total` is always the authoritative count across all pages — never infer count from `array.length`. Fetch `?page=1&limit=1` to get just the total count without loading results.

**Cursor-based** (activity feed, messages):
```
?limit=20&cursor=<compound_cursor>   // activity: ISO|objectId
?limit=20&before=<messageId>         // messages
```
Response includes `nextCursor` (or `null` when exhausted) and `total`.

### **Error Response Format**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descriptive error message",
    "details": []
  }
}
```

### **Authentication**
All endpoints except `/api/auth/*` and `/api/health` require valid JWT in Authorization header.

### **Soft Deletes**
All DELETE endpoints perform soft deletes (set `deletedAt` timestamp) except `DELETE /api/auth/me`, which triggers a 30-day grace period before a permanent hard delete cascade.

---

## Endpoint Summary

| Category | Endpoints | Must-Ship |
|----------|-----------|-----------|
| Auth | 10 | Yes |
| User Profile | 1 | Yes |
| Google Linking | 2 | Yes |
| Google Drive | 2 | Yes |
| Notes | 9 | Yes |
| AI Summary | 1 | Yes |
| Flashcards | 9 | Yes |
| Study Sessions | 5 | Yes |
| Tasks | 5 | Yes |
| Calendar | 1 | Yes |
| Social (Friends) | 6 | Yes |
| Social (Note Sharing) | 2 | Yes |
| Social (Comments) | 4 | Yes |
| Shared Tasks | 3 | Yes |
| Flashcard Set Sharing | 3 | Stretch |
| Resume | 6 | Yes |
| Applications | 10 | Yes |
| Messaging | 5 | Yes |
| Activity Feed | 2 | Stretch |
| Offline Sync | 1 | Stretch |
| Health | 1 | Yes |
| Waitlist | 1 | Yes |
| **Total** | **86** | **81** |

---

## Waitlist

### **Mobile Waitlist**
- `POST /api/waitlist` — Subscribe an email to the mobile waitlist. No auth required. Idempotent — returns success for duplicate emails without revealing whether the address was already registered.

**Request body:**
```json
{ "email": "student@university.edu", "firstName": "Justin", "source": "mobile_gate", "platformInterest": "android" }
```
`firstName` is optional — stored as `null` if omitted.  
`platformInterest` is optional — enum `ios | android | both`, stored as `null` if omitted. Used to personalize the Resend welcome email sent on signup.

**Responses:**
- `201` — Email successfully subscribed: `{ success: true, message: "You're on the list!" }`
- `409` — Email already on the waitlist: `{ success: false, error: "This email is already on the waitlist." }`
- `400` — Missing or invalid email: `{ success: false, error: "Please enter a valid email address." }`
