# Continuum
## API Reference Guide

**Version**: 1.0 MVP
**Base URL**: `/api`
**Format**: REST JSON
**Authentication**: JWT + Google OAuth

---

## Authentication & User Management

### **Authentication**
- `POST /api/auth/register` - Create new user account with email/password, return JWT
- `POST /api/auth/login` - Authenticate user with email/password, return JWT
- `GET /api/auth/google` - Initiate Google OAuth consent flow (login or registration)
- `GET /api/auth/google/callback` - Handle OAuth callback, find/create user, return JWT
- `GET /api/auth/me` - Retrieve authenticated user from token
- `POST /api/auth/forgot-password` - Send password reset email via Resend
- `POST /api/auth/reset-password` - Verify reset token and set new password

Users can register with email/password OR Google OAuth. Both paths create the same User document. Google OAuth users get Google Drive/Docs access immediately. Email/password users can link Google later.

### **User Profile**
- `PATCH /api/me/profile` - Update user profile information (name, bio, avatarUrl, settings)

### **Google Account Linking**
- `POST /api/me/google/link` - Initiate Google OAuth to link Google account to existing user
- `DELETE /api/me/google/link` - Unlink Google account (body: `{ keepNotes: true/false }`)

Google linking is required for Google Drive/Docs features. `user.hasGoogleLinked` virtual tracks status. When unlinking, user chooses whether to keep imported notes as standalone copies or delete them.

---

## Google Integration & Notes

### **Google Drive Integration**
- `GET /api/google/files` - List available Google Docs for import
- `GET /api/google/docs/:docId/preview` - Preview document content without saving

### **Note Management**
- `POST /api/notes` - Create manual note directly in app
- `GET /api/notes` - List user's notes with filtering options (tags, visibility, search query, pagination)
- `GET /api/notes/:noteId` - Retrieve specific note with full content and embedded summary
- `PATCH /api/notes/:noteId` - Update note title, tags, content, or visibility
- `DELETE /api/notes/:noteId` - Soft delete note
- `POST /api/notes/import` - Import Google Doc as note snapshot
- `PUT /api/notes/:noteId/refresh` - Re-import latest version of linked Google Doc

---

## AI-Powered Learning

### **AI Summaries**
- `POST /api/notes/:noteId/summary` - Generate AI summary and embed in note (quick + detailed)

Summary is stored as an embedded field on the Note document. When you `GET /api/notes/:noteId`, the `summary` object is included automatically — no separate fetch needed.

### **Flashcard System**
- `POST /api/notes/:noteId/flashcards/generate` - Auto-generate flashcards from note content via Groq
- `POST /api/flashcard-sets` - Create flashcard set manually
- `GET /api/flashcard-sets` - List user's flashcard sets
- `GET /api/flashcard-sets/:setId` - Get set with all flashcards
- `POST /api/flashcard-sets/:setId/cards` - Add card to set
- `PUT /api/flashcard-sets/:setId/cards/:cardId` - Edit flashcard front and back content
- `PUT /api/flashcard-sets/:setId/cards/:cardId/progress` - Update study progress (correct/incorrect)
- `DELETE /api/flashcard-sets/:setId` - Soft delete flashcard set

---

## Task & Calendar Management

### **Task Operations**
- `POST /api/tasks` - Create task with due date, priority, duration, and optional note link
- `GET /api/tasks` - List tasks with time range and status filters
- `PUT /api/tasks/:taskId` - Update task properties (title, status, priority, due date)
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
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/request/:requestId` - Accept or reject friend request
- `GET /api/friends` - List current friends
- `DELETE /api/friends/:friendId` - Remove friend

### **Content Sharing**
- `PUT /api/notes/:noteId/share` - Update note visibility (private, friends, or specific users)
- `GET /api/notes/shared` - List notes shared with the current user

### **Engagement**
- `POST /api/comments` - Add comment on a note or flashcard set (targetId + targetType)
- `GET /api/comments/:targetType/:targetId` - List comments on a resource
- `POST /api/comments/:commentId/like` - Toggle like on a comment
- `DELETE /api/comments/:commentId` - Soft delete comment

### **Shared Tasks**
- `PUT /api/tasks/:taskId` - Add participants to convert to shared task (update isShared + participants)
- `GET /api/tasks/shared` - List tasks shared with the current user

---

## Direct Messaging *(Stretch)*

### **Conversations**
- `POST /api/conversations` - Create or retrieve conversation with a friend
- `GET /api/conversations` - List user's direct message conversations (inbox)
- `GET /api/conversations/:conversationId/messages` - List messages in conversation (paginated)
- `POST /api/conversations/:conversationId/messages` - Send new message
- `PUT /api/messages/:messageId/read` - Mark message as read

---

## Career Management

### **Resume Management**
- `POST /api/resumes/upload` - Upload resume PDF with label and target role (multipart/form-data)
- `GET /api/resumes` - List all resume versions for user
- `GET /api/resumes/:resumeId` - Retrieve resume with metadata, file URL, and embedded feedback
- `POST /api/resumes/:resumeId/feedback` - Generate AI-powered feedback via Groq (appended to embedded feedback array)

Feedback is stored as an embedded array on the Resume document. When you `GET /api/resumes/:resumeId`, the `feedback[]` array and `latestFeedback` virtual are included automatically.

### **Application Tracking**
- `POST /api/applications` - Create job/internship application entry
- `GET /api/applications` - List applications with status and search filters
- `PUT /api/applications/:applicationId` - Update application status, notes, or details
- `DELETE /api/applications/:applicationId` - Soft delete application entry
- `GET /api/applications/dashboard` - Get pipeline overview with status counts
- `POST /api/applications/:applicationId/contacts` - Add networking contact
- `POST /api/applications/:applicationId/reminders` - Add follow-up reminder

---

## System Health

### **Monitoring**
- `GET /api/health` - System health check endpoint

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
| Auth | 7 | Yes |
| User Profile | 1 | Yes |
| Google Linking | 2 | Yes |
| Google Drive | 2 | Yes |
| Notes | 7 | Yes |
| AI Summary | 1 | Yes |
| Flashcards | 7 | Yes |
| Tasks | 5 | Yes |
| Calendar | 1 | Yes |
| Social (Friends) | 5 | Yes |
| Social (Sharing) | 2 | Yes |
| Social (Comments) | 4 | Yes |
| Shared Tasks | 2 | Yes |
| Resume | 4 | Yes |
| Applications | 7 | Yes |
| Messaging | 5 | Stretch |
| Health | 1 | Yes |
| **Total** | **63** | **58 must-ship** |
