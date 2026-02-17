# Continuum — Backend User Flows

Every critical user journey from the backend perspective. Maps each user action to the exact API endpoint, database operation, and expected response. Use this to validate that routes, models, and services connect correctly.

---

## 1. Onboarding & Authentication

### Flow A: Email/Password Registration
```
User fills out registration form
  → POST /api/auth/register { email, username, password, firstName, lastName }
  → Server validates: email format, username length, password strength
  → Server checks: email unique, username unique (409 CONFLICT if not)
  → User.create() → pre-save hook hashes password with bcrypt
  → Sign JWT { userId, email } with JWT_EXPIRES_IN expiry
  → Return { token, user } (user without password field)
  → Frontend stores token in localStorage (web) or SecureStore (mobile)
  → Redirect to Dashboard
  → Google NOT linked — Drive/Docs features show "Connect Google" prompt
```

### Flow B: Google OAuth Registration/Login
```
User clicks "Sign in with Google"
  → Frontend redirects to GET /api/auth/google
  → Server redirects to Google consent screen
     Scopes: profile, email, drive.readonly, documents.readonly
  → User grants permission
  → Google redirects to GET /api/auth/google/callback with auth code
  → Server exchanges code for access + refresh tokens
  → Server checks: does User exist with this googleId or email?
     If yes → update Google tokens on existing User
     If no → create new User with Google profile info + tokens
  → Sign JWT { userId, email }
  → Redirect to frontend: /auth/callback?token=<jwt>
  → Frontend stores token
  → Google IS linked — all features available immediately
```

### Flow C: Forgot Password
```
User clicks "Forgot password" on login page
  → POST /api/auth/forgot-password { email }
  → Server finds user by email
  → user.createPasswordResetToken() → generates crypto random token
     → Stores hashed version + 1-hour expiry on User document
  → Sends email via Resend with link: /reset-password?token=<plaintext>
  → Returns 200 success (even if email not found — prevents enumeration)
  → User clicks email link
  → POST /api/auth/reset-password { token, newPassword }
  → Server hashes token, finds User where hash matches + not expired
  → Sets new password (pre-save hook hashes it)
  → Clears passwordResetToken and passwordResetExpires
  → Returns success → user redirected to login page
```

### Flow D: Link Google Account (for email/password users)
```
User goes to Settings → clicks "Connect Google Account"
  → POST /api/me/google/link → triggers same OAuth consent flow
  → Instead of creating new User, attaches tokens to EXISTING user
  → user.hasGoogleLinked = true
  → Drive/Docs import buttons now visible across app
```

### Flow E: Unlink Google Account
```
User goes to Settings → clicks "Disconnect Google"
  → Frontend shows confirmation: "Keep imported notes or delete them?"
  → DELETE /api/me/google/link { keepNotes: true }
     → Clears googleDocId/googleDocUrl on all user's notes (standalone copies)
     → Clears googleId, googleAccessToken, googleRefreshToken from User
  → OR DELETE /api/me/google/link { keepNotes: false }
     → Soft-deletes all notes where googleDocId is not null
     → Clears Google fields from User
  → user.hasGoogleLinked = false
  → Drive/Docs features hidden, "Connect Google" prompt returns
```

---

## 2. Notes & Google Docs

### Import a Google Doc
```
Prerequisite: user.hasGoogleLinked = true

User clicks "Import from Google Drive"
  → GET /api/google/files (uses stored Google access token)
     → If token expired → auto-refresh using googleRefreshToken
     → Returns list of Google Docs from Drive
  → User selects a document
  → POST /api/notes/import { googleDocId }
  → Server fetches document content via Google Docs API
  → Converts Google Docs format to HTML/Markdown
  → Note.create({ userId, title, content, googleDocId, googleDocUrl, contentType, lastSyncedAt })
  → Returns new Note
  → User sees note in their notes list
```

### Refresh a Google Doc Note
```
User opens a note that has googleDocId
  → Sees "Last synced: [date]" and "Refresh" button
  → PUT /api/notes/:noteId/refresh
  → Server re-fetches latest content from Google Docs API
  → Updates note.content and note.lastSyncedAt
  → Returns updated Note
  → If Google token expired → auto-refresh
  → If Google unlinked → return 403: "Google account not connected"
```

### Create a Manual Note
```
User clicks "New Note"
  → POST /api/notes { title, content, contentType, tags }
  → Note.create() with userId from JWT
  → No googleDocId → this is a standalone note
  → Returns new Note
```

---

## 3. AI-Powered Learning

### Generate Summary
```
User opens a note → clicks "Generate AI Summary"
  → POST /api/notes/:noteId/summary
  → Server loads note content
  → If content < 90K tokens → single Groq request (Llama 3.1 70B)
  → If content > 90K tokens → chunk into overlapping segments
     → Summarize each chunk → combine into final summary
  → Prompt generates both quickSummary (2-3 sentences) and detailedSummary (1-2 paragraphs)
  → Update note: note.summary = { quickSummary, detailedSummary, generatedAt, model, tokenCount }
  → Return updated Note
  → User sees summary displayed on note page
  → Can regenerate anytime (overwrites previous summary)

Error handling:
  → Groq rate limited → retry with exponential backoff (max 3)
  → Groq down → return 503: "AI features temporarily unavailable"
  → Note too short (< 50 words) → return 400: "Note too short for meaningful summary"
```

### Generate Flashcards
```
User opens a note → clicks "Generate Flashcards"
  → POST /api/notes/:noteId/flashcards/generate
  → Server loads note content
  → Sends to Groq (Llama 3.1 8B) with flashcard extraction prompt
  → AI returns structured JSON: [{ front, back }, ...]
  → Parse response → cap at 30 cards per generation
  → FlashcardSet.create({ userId, noteId, title, isAIGenerated: true, totalCards })
  → Flashcard.insertMany([{ setId, front, back, order }])
  → Update note.hasFlashcards = true
  → Return FlashcardSet with flashcards populated
  → User redirected to flashcard study view

Can generate multiple sets from same note (creates new set each time)
User can edit any AI-generated card afterward
```

### Study Flashcards
```
User opens a flashcard set → clicks "Study"
  → GET /api/flashcard-sets/:setId (returns set + all flashcards)
  → Frontend displays first card (front only)
  → User flips card (sees back)
  → User marks "Correct" or "Incorrect"
  → PUT /api/flashcard-sets/:setId/cards/:cardId/progress
     → Updates userProgress[]: { userId, correctCount++/incorrectCount++, confidence, lastStudied }
     → Confidence calculated: >80% correct = high, 50-80% = medium, <50% = low
  → Next card
  → After all cards: show session summary (% correct, total studied)
  → FlashcardSet.studySessionCount++, lastStudiedAt = now

MVP: Simple correct/incorrect tracking
Post-showcase: Spaced repetition (schema already supports nextReviewDate, interval fields)
```

---

## 4. Tasks & Calendar

### Create a Task
```
User clicks "New Task"
  → POST /api/tasks { title, description, dueDate, duration, type, priority, noteId? }
  → Task.create() with status: 'todo'
  → If recurrence specified: store recurrence.frequency, interval, daysOfWeek, endDate
  → Returns new Task
  → Appears on calendar at dueDate
```

### Complete a Recurring Task
```
User marks recurring task as complete
  → PATCH /api/tasks/:taskId/status { status: 'completed' }
  → Pre-save hook: set completedAt = now
  → Pre-save hook: check if task has recurrence
     → If yes → calculate next due date based on frequency + interval
     → Task.create() new instance with:
       - Same title, description, type, priority, duration
       - New dueDate (next occurrence)
       - recurrence.parentTaskId = original task's _id
       - status: 'todo'
  → Returns completed task + indicates next task was created
```

### Calendar View
```
User navigates to Calendar page
  → GET /api/calendar?from=2026-02-23&to=2026-03-01
  → Server aggregates:
     - All tasks owned by user in date range
     - All shared tasks where user is a participant in date range
     - Overdue tasks (dueDate < now, status !== 'completed')
  → Returns structured array: [{ date, tasks: [{ id, title, dueDate, priority, status, duration, isShared }] }]
  → Frontend renders calendar grid with tasks positioned by dueDate
```

### Shared Tasks
```
Owner creates task → adds participants
  → PUT /api/tasks/:taskId { isShared: true, participants: [{ userId }] }
  → Each participant gets their own status entry (default: 'todo')
  → Task appears on all participants' calendars

Participant updates their status:
  → PATCH /api/tasks/:taskId/status { status: 'completed' }
  → Only updates their entry in participants[] array
  → Does NOT change the task's global status
  → Owner sees who has/hasn't completed

Only owner can:
  → Edit title, description, dueDate, priority
  → Add/remove participants
  → Delete the task
```

---

## 5. Social Features

### Friend Request Flow
```
User searches for friend
  → GET /api/users/search?q=john (searches username, email)
  → Returns matching users (exclude self, exclude already-friends)

User sends request
  → POST /api/friends/request { userId: targetUser._id }
  → Friendship.create({ user1: min(sender, target), user2: max(sender, target), requestedBy: sender, status: 'pending' })
  → Pre-save enforces user1 < user2 ordering

Target user sees pending request
  → GET /api/friends (includes pending requests where user is not requestedBy)
  → PUT /api/friends/request/:requestId { action: 'accept' }
  → Friendship.status = 'accepted', respondedAt = now
  → Both users now see each other in friends list

Unfriend:
  → DELETE /api/friends/:friendId
  → Soft-delete Friendship
  → Previously shared content REMAINS visible (user's choice from earlier)
  → Can re-add friend later
```

### Sharing Content
```
Notes, flashcard sets, and tasks can all be shared.

Share a note:
  → PUT /api/notes/:noteId/share { visibility: 'friends' }
  → Note visible to all friends
  → OR { visibility: 'specific', sharedWith: [userId1, userId2] }
  → Note visible only to specified users

View shared content:
  → GET /api/notes/shared → returns notes shared with current user
  → Includes notes where:
     - visibility = 'friends' AND author is a friend
     - visibility = 'specific' AND current user in sharedWith[]

Same pattern for flashcard sets (visibility + sharedWith fields exist)
Tasks use isShared + participants[] pattern
```

### Comments
```
User opens a shared note/flashcard set/task
  → GET /api/comments/note/:noteId (or flashcardSet/:setId or task/:taskId)
  → Returns comments with userSnapshot (no extra user lookups)

Post comment:
  → POST /api/comments { targetId, targetType, content, parentId? }
  → Pre-save: snapshot user's username, firstName, lastName, avatarUrl
  → Returns comment with snapshot

Like/unlike:
  → POST /api/comments/:commentId/like
  → Toggle: if userId in likes[] → remove, else → add
  → Returns updated like count
```

---

## 6. Career Tools

### Resume Upload & AI Feedback
```
User uploads resume PDF
  → POST /api/resumes/upload (multipart/form-data)
     File: resume.pdf, Body: { version, targetRole }
  → multer parses file to buffer
  → Upload buffer to Cloudinary (folder: "continuum/resumes")
  → Extract text from PDF using pdf-parse → store as extractedText
  → Resume.create({ userId, fileName, fileUrl, fileSize, extractedText, version, targetRole })
  → Return resume metadata (without extractedText)

User requests AI feedback
  → POST /api/resumes/:resumeId/feedback
  → Server loads resume with extractedText (select: '+extractedText')
  → Sends to Groq (Llama 3.1 70B) with resume analysis prompt
  → AI returns: overallScore, strengths[], improvements[], sections[], keywordOptimization
  → $push to resume.feedback[] array
  → Return updated resume with latest feedback

User views feedback
  → GET /api/resumes/:resumeId
  → Returns resume with full feedback[] array
  → Frontend shows latest feedback with option to view history
  → Can regenerate feedback anytime (appends to array, doesn't overwrite)
```

### Application Tracking
```
User creates application entry
  → POST /api/applications { company, position, location, jobUrl, status, appliedAt, resumeUsed? }
  → Default status: 'applied'

User updates application status
  → PUT /api/applications/:id { status: 'interviewing' }
  → Status values: 'saved', 'applied', 'interviewing', 'offered', 'rejected', 'accepted', 'withdrawn'

Pipeline dashboard
  → GET /api/applications/dashboard
  → Returns counts by status: { applied: 5, interviewing: 2, offered: 1, ... }
  → Frontend renders as kanban board or status summary

Add networking contact
  → POST /api/applications/:id/contacts { name, role, email, linkedin, notes }
  → Pushed to application.contacts[] embedded array

Add follow-up reminder
  → POST /api/applications/:id/reminders { date, note }
  → Pushed to application.followUpReminders[] embedded array
  → MVP: displayed in app dashboard as upcoming reminders
  → Stretch: email notification via Resend when date arrives
```

---

## 7. Data Lifecycle & Edge Cases

### Soft Deletes
```
All deletions set deletedAt = new Date() instead of removing the document.
All queries filter: { deletedAt: null } to hide deleted content.
Deleted content can be recovered by setting deletedAt = null.
```

### Account Deletion
```
User requests account deletion from Settings
  → Soft-delete User document (deletedAt = now)
  → JWT middleware checks user.deletedAt — returns 401 if set
  → User's content (notes, tasks, flashcards, etc.) remains in database
  → Shared content remains visible to others (design decision)
  → Can restore account by clearing deletedAt within grace period
```

### Google Token Expiry
```
Google access tokens expire after ~1 hour.
When a Google API call fails with 401:
  → Use stored googleRefreshToken to get new access token
  → Update googleAccessToken and googleTokenExpiry on User
  → Retry the original request
  → If refresh also fails → user.hasGoogleLinked effectively false
  → Prompt user to re-link Google account
```

### Groq API Failures
```
AI features are non-blocking — the app works without them.
If Groq is down or rate-limited:
  → Summary generation: show error, user can retry later
  → Flashcard generation: show error, user can create cards manually
  → Resume feedback: show error, user can view resume without feedback
  → Never block navigation or non-AI features
```

---

## 8. Showcase Demo Script (Reference)

The ideal demo walks through:
1. Register with Google → show seamless auth
2. Import Google Doc → show Drive integration
3. Generate AI summary → show Groq speed
4. Generate flashcards → study a few → show progress
5. Create tasks → show calendar with recurring task
6. Add a friend → share a note → leave a comment
7. Upload resume → get AI feedback → create application entry
8. Show mobile app doing the same core flows

This script validates every critical path works end-to-end.
