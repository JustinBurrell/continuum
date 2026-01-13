# Continuum
## API Reference Guide

**Version**: 1.0 MVP  
**Format**: REST JSON  
**Authentication**: JWT + Google OAuth

---

## 🔐 Authentication & User Management

### **Authentication**
- `POST /auth/register` - Create new user account with email/password
- `POST /auth/login` - Authenticate user and return JWT token
- `GET /auth/google/url` - Generate Google OAuth consent URL
- `POST /auth/google/exchange` - Exchange OAuth code for JWT token

### **User Profile**
- `GET /me` - Retrieve authenticated user profile
- `PATCH /me/profile` - Update user profile information (name, school, major, skills, bio)

---

## 📄 Google Integration & Notes

### **Google Drive Integration**
- `GET /google/drive/docs` - List available Google Docs for import
- `GET /google/docs/:docId/preview` - Preview document content without saving

### **Note Management**
- `POST /notes/import/google-doc` - Import Google Doc as note snapshot
- `POST /notes/:noteId/refresh` - Re-import latest version of linked Google Doc
- `POST /notes` - Create manual note directly in app
- `GET /notes` - List user's notes with filtering options (tags, visibility, search query)
- `GET /notes/:noteId` - Retrieve specific note with full content
- `PATCH /notes/:noteId` - Update note title, tags, content, or visibility
- `DELETE /notes/:noteId` - Delete note and associated content

---

## 🤖 AI-Powered Learning

### **AI Summaries**
- `POST /notes/:noteId/ai/summary` - Generate and store note summary (short or detailed)
- `GET /notes/:noteId/ai` - List all AI outputs for a note

### **Flashcard System**
- `POST /notes/:noteId/ai/flashcards` - Auto-generate flashcards from note content
- `POST /notes/:noteId/flashcards` - Manually create flashcard
- `GET /notes/:noteId/flashcards` - List flashcards for study session
- `PATCH /flashcards/:flashcardId` - Edit flashcard front and back content
- `DELETE /flashcards/:flashcardId` - Remove flashcard

---

## ✅ Task & Calendar Management

### **Task Operations**
- `POST /tasks` - Create task with due date, priority, duration, and optional note link
- `GET /tasks` - List tasks with time range and status filters
- `PATCH /tasks/:taskId` - Update task properties (title, status, priority, due date, sharing)
- `DELETE /tasks/:taskId` - Remove task (owner only)

### **Calendar Views**
- `GET /calendar` - Aggregate tasks and shared tasks for calendar rendering

**How `/calendar` works:**
- Accepts `from` and `to` date parameters (ISO 8601 format)
- Returns all tasks owned by user with due dates in range
- Includes shared tasks where user is a participant
- Pre-aggregates data optimized for calendar UI rendering
- Returns structured format with task details (title, due date, priority, status, duration)

---

## 👥 Social & Collaboration

### **Friend Management**
- `GET /users/search` - Search users by name or email
- `POST /friends/requests` - Send friend request
- `POST /friends/requests/:requestId/respond` - Accept or decline friend request
- `GET /friends` - List current friends

### **Content Sharing**
- `POST /notes/:noteId/share` - Toggle note visibility (private or friends-only)
- `GET /feed/friends` - View friends' shared notes sorted by recent activity

### **Engagement**
- `POST /notes/:noteId/comments` - Add comment to shared note
- `GET /notes/:noteId/comments` - List comments on a note
- `POST /notes/:noteId/likes` - Like a note
- `DELETE /notes/:noteId/likes` - Remove like from note

### **Shared Tasks**
- `POST /tasks/:taskId/share` - Convert personal task to shared task with participants

---

## 💬 Direct Messaging

### **Conversations**
- `GET /dm/conversations` - List user's direct message conversations
- `POST /dm/conversations` - Create or retrieve conversation with a friend
- `GET /dm/conversations/:conversationId/messages` - List messages in conversation
- `POST /dm/conversations/:conversationId/messages` - Send new message

### **Sync Support**
- `GET /sync/checkpoint` - Get server time for offline sync coordination

---

## 💼 Career Management

### **Resume Management**
- `POST /resumes` - Upload resume PDF with label and target role (multipart/form-data)
- `GET /resumes` - List all resume versions for user
- `GET /resumes/:resumeId` - Retrieve resume metadata and file URL
- `POST /resumes/:resumeId/feedback` - Generate AI-powered feedback on resume
- `GET /resumes/:resumeId/feedback` - List all feedback iterations for resume version

### **Application Tracking**
- `POST /applications` - Create job/internship application entry
- `GET /applications` - List applications with status and search filters
- `PATCH /applications/:applicationId` - Update application status, notes, or networking info
- `DELETE /applications/:applicationId` - Remove application entry
- `GET /applications/dashboard` - Get pipeline overview with status counts and activity timeline

---

## 🔧 System Health

### **Monitoring**
- `GET /health` - System health check endpoint
- `GET /metrics` - System metrics and monitoring data (protected)

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
?limit=20&cursor=<opaque_token>
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
All endpoints except `/auth/*` and `/health` require valid JWT in Authorization header.