# Continuum
## API Reference Guide

**Version**: 1.0 MVP
**Base URL**: `/api`
**Format**: REST JSON
**Authentication**: JWT + Google OAuth

---

## Authentication & User Management

### **Authentication**
- `POST /api/auth/register` - Create new user account, return JWT + refresh token
- `POST /api/auth/login` - Authenticate user, return JWT + refresh token
- `POST /api/auth/refresh` - Exchange a valid refresh token for a new access token (public)
- `POST /api/auth/logout` - Revoke current device's refresh token (protected)
- `POST /api/auth/logout-all` - Revoke all active refresh tokens for the user (protected)
- `GET /api/auth/google` - Initiate Google OAuth consent flow (login or registration)
- `GET /api/auth/google/callback` - Handle OAuth callback, find/create user, return JWT
- `GET /api/auth/me` - Retrieve authenticated user from token
- `POST /api/auth/forgot-password` - Send password reset email via Resend
- `POST /api/auth/reset-password` - Verify reset token and set new password

Users can register with email/password OR Google OAuth. Both paths create the same User document. Login and register return a short-lived JWT (1d) and a long-lived refresh token (30d). Each device gets its own refresh token — logout is per-device. `logout-all` revokes every active token for the user.

### **User Profile**
- `PATCH /api/auth/me/profile` - Update user profile information (name, bio, avatarUrl, settings)

### **Google Account Linking**
- `POST /api/auth/me/google/link` - Initiate Google OAuth to link Google account to existing user
- `DELETE /api/auth/me/google/link` - Unlink Google account (body: `{ keepNotes: true/false }`)

Google linking is required for Google Drive/Docs features. `user.hasGoogleLinked` virtual tracks status. When unlinking, user chooses whether to keep imported notes as standalone copies or delete them.

---

## Google Integration & Notes

### **Google Drive Integration**
- `GET /api/google/files` - List available Google Docs for import
- `GET /api/google/docs/:docId/preview` - Preview document content without saving

### **Note Management**
- `POST /api/notes` - Create manual note directly in app
- `GET /api/notes` - List user's notes with filtering options (tags, visibility, search query, pagination)
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
- `POST /api/notes/:noteId/summary` - Generate AI summary. For the owner: persists to note document and returns updated note. For shared users: generates and returns summary without persisting (owner's stored summary is never overwritten).

Summary is stored as an embedded field on the Note document for the owner. When you `GET /api/notes/:noteId`, the `summary` object is included automatically — no separate fetch needed.

### **Flashcard System**
- `POST /api/notes/:noteId/flashcards/generate` - Auto-generate flashcards from note content via Groq. Accessible by owner and shared users. The resulting FlashcardSet is always owned by the requesting user. `note.hasFlashcards` is only updated when the owner generates.
- `POST /api/flashcard-sets` - Create flashcard set manually
- `GET /api/flashcard-sets` - List user's flashcard sets
- `GET /api/flashcard-sets/:setId` - Get set with all flashcards. Accessible by owner, users in `sharedWith`, or friends when `visibility: 'friends'`. Response includes populated `userId` (username, firstName, lastName, avatarUrl) for creator attribution.
- `POST /api/flashcard-sets/:setId/cards` - Add card to set
- `PUT /api/flashcard-sets/:setId/cards/:cardId` - Edit flashcard front and back content
- `PUT /api/flashcard-sets/:setId/cards/:cardId/progress` - Update study progress (correct/incorrect)
- `DELETE /api/flashcard-sets/:setId` - Soft delete flashcard set
- `POST /api/flashcard-sets/:setId/duplicate` - Create a personal copy of an accessible set owned by the requesting user. Copies all cards; does not copy per-card `userProgress`. Access: owner or any user with read access (sharedWith or friends visibility).

---

## Task & Calendar Management

### **Task Operations**
- `POST /api/tasks` - Create task with due date, priority, type (`homework|study|project|exam|club|professional|personal|other`), duration, and optional note link
- `GET /api/tasks` - List tasks with time range and status filters
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
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/request/:requestId` - Accept or reject friend request
- `GET /api/friends` - List current friends
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
- `GET /api/tasks/shared` - List tasks shared with the current user

### **Flashcard Set Sharing**
- `PATCH /api/flashcard-sets/:setId/share` - Update flashcard set visibility (private, friends, or specific users). When visibility is `specific`, an auto-message is sent to each user in `sharedWith` via the messaging system.
- `GET /api/flashcard-sets/shared` - List flashcard sets shared with the current user

### **Activity Feed**
- `GET /api/activity` - List activity feed for the authenticated user (limit/offset pagination). Returns `{ feed[], total }` where `total` is the full count of all visible activities.

Activity is driven by `settings.activityVisibility` on the User (default: `friends`). The actor always sees their own activity regardless of this setting. `private` means only the actor sees their activity, `friends` also makes it visible to accepted friends, `public` makes it visible to all (backend-only, not exposed in frontend settings). Activity types: `note_shared`, `task_created` (shared tasks only), `comment_added`, `like_added`, `flashcard_shared`.

Sharing activities are personalized: the sharer's feed shows who they shared with (e.g., "shared note X with Alice, Bob"), while each recipient sees "shared note X with you". Recipient names are clickable links to their profile. When shared with all friends (`visibility: 'friends'`), the activity says "shared with friends" without listing names.

---

## Direct Messaging

### **Conversations**
- `POST /api/conversations` - Create or retrieve conversation with a user (find-or-create)
- `GET /api/conversations` - List user's conversations (inbox), sorted by latest message
- `POST /api/conversations/:conversationId/messages` - Send a message in a conversation
- `GET /api/conversations/:conversationId/messages` - List messages (cursor pagination via `?limit=&before=`)
- `PUT /api/messages/:messageId/read` - Mark message as read, reset unread count

---

## Career Management

### **Resume Management**
- `POST /api/resumes/upload` - Upload resume PDF with label and target role (multipart/form-data); stored as `type: authenticated` in Cloudinary
- `GET /api/resumes` - List all resume versions for user
- `GET /api/resumes/:resumeId/download` - Generate a 10-minute signed download URL via `private_download_url`; requires ownership
- `POST /api/resumes/:resumeId/feedback` - Generate AI-powered feedback via Groq (appended to embedded feedback array)
- `GET /api/resumes/:resumeId/feedback` - Retrieve all feedback entries for a resume
- `DELETE /api/resumes/:resumeId` - Soft delete resume

Resume PDFs are stored as Cloudinary `authenticated` resources — direct URLs return 401. The `/download` endpoint generates a signed API-level URL that works regardless of the resource's upload type. Feedback is stored as an embedded array on the Resume document.

### **Application Tracking**
- `POST /api/applications` - Create job/internship application entry
- `GET /api/applications` - List applications with status and search filters
- `PUT /api/applications/:applicationId` - Update application status, notes, or details
- `DELETE /api/applications/:applicationId` - Soft delete application entry
- `GET /api/applications/dashboard` - Get pipeline overview with status counts
- `POST /api/applications/:applicationId/contacts` - Add networking contact
- `POST /api/applications/:applicationId/reminders` - Add follow-up reminder

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
Query parameters for list endpoints:
```
?limit=20&cursor=<last_id>
```

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
All DELETE endpoints perform soft deletes (set `deletedAt` timestamp). Data can be recovered.

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
| Flashcards | 8 | Yes |
| Tasks | 5 | Yes |
| Calendar | 1 | Yes |
| Social (Friends) | 6 | Yes |
| Social (Note Sharing) | 2 | Yes |
| Social (Comments) | 4 | Yes |
| Shared Tasks | 3 | Yes |
| Flashcard Set Sharing | 3 | Stretch |
| Resume | 6 | Yes |
| Applications | 7 | Yes |
| Messaging | 5 | Yes |
| Activity Feed | 1 | Stretch |
| Offline Sync | 1 | Stretch |
| Health | 1 | Yes |
| **Total** | **78** | **73** |
