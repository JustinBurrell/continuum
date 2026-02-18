# Continuum - Development Planning & Progress Tracker

**Project**: All-in-one educational platform unifying Google Docs, AI study tools, task management, and career tracking
**Timeline**: February 23 - April 17, 2026 (8 development sessions + Showcase)
**Stack**: MERN (MongoDB, Express, React, Node.js) + React Native with Expo
**Developer**: Solo full-stack development
**Showcase**: April 17, 2026
**Program**: Google Play TEI

---

## Program Timeline

| Session | Date | Phase |
|---------|------|-------|
| Session 1 | 2/23 (Mon) 5:30-7:30pm ET | Phase 1: Database Layer |
| Session 2 | 3/2 (Mon) 5:30-7:30pm ET | Phase 1: Database Layer |
| Session 3 | 3/9 (Mon) 5:30-7:30pm ET | Phase 2: Backend APIs |
| Session 4 | 3/16 (Mon) 5:30-7:30pm ET | Phase 2: Backend APIs |
| Session 5 | 3/23 (Mon) 5:30-7:30pm ET | Phase 2: Backend APIs |
| Session 6 | 3/30 (Mon) 5:30-7:30pm ET | Phase 3: Frontend (Web + Mobile) |
| Session 7 | 4/6 (Mon) 5:30-7:30pm ET | Phase 3: Frontend (Web + Mobile) |
| Session 8 | 4/13 (Mon) 5:30-7:30pm ET | Phase 4: Polish & Showcase Prep |
| Showcase | 4/17 (Fri) 5:30-7:30pm ET | Showcase (subject to change) |

---

## Project Understanding

**Related Documents**: [Product Requirements Document](./product/product_requirements_document.md) | [Backend User Flows](./backend/backend_user_flows.md) | [Proof of Concept](./product/proof_of_concept.md) | [API Reference Guide](./backend/api_reference_guide.md) | [Backend Architecture](./backend/backend_architecture.md) | [Design Breakdown](./design/design_breakdown.md) | [Cheat Sheet](./design/continuum_cheat_sheet.md) | [MongoDB Schema Explanation](./database/mongodb_schema_explaination.md) | [MongoDB Schema Implementation Order](./database/mongodb_schema_implementation_order.md) | [Schema Diagram](./database/schema_diagram.md) | [Groq AI Integration](./backend/groq_ai_integration.md)

### Core Problem
Students manage their academic and professional lives across 8-12 disconnected applications, causing:
- **Cognitive Overload**: 2-3 hours/week lost to context-switching
- **Missed Opportunities**: Deadlines and tasks fall through cracks
- **Passive Learning**: Notes remain static instead of active study materials

### Solution
Continuum unifies:
1. **Content Management**: Google Docs import and note organization
2. **AI-Powered Learning**: Auto-generated summaries and flashcards
3. **Task & Calendar**: Integrated task management with calendar views
4. **Collaboration**: Friends, sharing, comments
5. **Career Tools**: Resume management with AI feedback and application tracking

### Key Technical Decisions
- **MERN Stack**: JavaScript across entire stack for rapid solo development
- **React Native + Expo**: Cross-platform mobile with Android SDK for Google Play
- **MongoDB**: Flexible schemas for rapid iteration
- **Cloudinary**: Resume PDF storage (cloud-hosted, no local file system)
- **Groq API**: AI-powered summaries, flashcards, and resume feedback (Llama 3.1)
- **Deployment**: Railway or Render (backend) + Vercel (web) + EAS Build (mobile)
- **Layered Development**: Database → Backend → Frontend to deeply learn each layer

### Success Metrics
- 160+ commits across 8 weeks
- 80%+ backend test coverage
- Functional on both web and mobile (Android required for Google Play)
- Sub-2s load times for core features

---

## Development Approach

**Learning-first, layered development.** Instead of vertical slices (full stack per feature), we build horizontally:

1. **Database Layer** — Learn MongoDB/Mongoose deeply. Design all schemas, understand indexing, relationships, and data flow.
2. **Backend APIs** — Learn Express, JWT, middleware, REST design. Build and test every endpoint with Postman before any frontend exists.
3. **Frontend** — Wire up existing web UI to APIs. Build mobile with Expo/React Native in parallel. React → React Native is a natural learning progression.
4. **Polish** — Bug fixes, performance, Google Play prep, showcase demo.

This means you won't have a working UI until Phase 3, but your backend will be rock-solid and fully tested.

---

## Overall Progress

**Total Phases**: 4
**Completed Phases**: 0/4
**Total Tickets**: 62 (must-ship) + stretch
**Completed Tickets**: 1/62
**Current Phase**: Phase 1 - Database Layer

---

## Current Status

**Current Ticket**: DB-2: Note Model
**Phase**: Phase 1 - Database Layer
**Status**: Merged

*Update this section as you progress through tickets*

---

## Feature Priority

### Must Ship
Everything needed for a complete showcase demo:
- Authentication (JWT + Google OAuth)
- Notes + Google Docs import
- AI summaries and flashcards (Groq)
- Tasks and calendar
- Friends, sharing, and comments
- Career tools (resume upload, AI feedback, application tracking)

### Stretch Goals
Nice to have but cut if time is short:
- Direct messaging
- Offline sync support
- Activity feed

---

## Phase 1: Database Layer
**Sessions 1-2 | February 23 - March 2**
**Focus**: MongoDB, Mongoose, schema design, indexing, data relationships

### Learning Goals
- Understand MongoDB document model vs relational databases
- Master Mongoose schema definition, validation, and middleware (pre-save hooks)
- Learn indexing strategies: compound indexes, text indexes, sparse indexes
- Understand soft deletes, virtual fields, and schema design patterns
- Practice testing schemas with seed data

### All Models (13 total — 9 must-ship + 4 stretch)

| # | Model | File | Category |
|---|-------|------|----------|
| 1 | User | `src/models/User.js` | Auth |
| 2 | Note | `src/models/Note.js` | Notes (summary embedded) |
| 3 | FlashcardSet | `src/models/FlashcardSet.js` | Learning |
| 4 | Flashcard | `src/models/Flashcard.js` | Learning |
| 5 | Task | `src/models/Task.js` | Tasks |
| 6 | Friendship | `src/models/Friendship.js` | Social |
| 7 | Comment | `src/models/Comment.js` | Social |
| 8 | Resume | `src/models/Resume.js` | Career (feedback embedded) |
| 9 | Application | `src/models/Application.js` | Career |
| 10 | Conversation | `src/models/Conversation.js` | Stretch: DMs |
| 11 | Message | `src/models/Message.js` | Stretch: DMs |
| 12 | SyncQueue | `src/models/SyncQueue.js` | Stretch: Offline |
| 13 | Activity | `src/models/Activity.js` | Stretch: Feed |

### Session 1 (2/23): Core Models
**Models 1-6 — Auth, Notes, Learning, Tasks**

#### Tickets

DB-1. [x] `feat: add user model with password hashing`
   - Schema: email, username, password (hashed via pre-save), createdAt (auto — tracks registration date), googleId, googleAccessToken, googleRefreshToken, passwordResetToken, passwordResetExpires, settings, deletedAt
   - Pre-save hook: bcrypt password hashing
   - Methods: comparePassword, createPasswordResetToken
   - Virtuals: fullName, hasGoogleLinked
   - Indexes: email (unique), username (unique), googleId (sparse)
   - See [Schema Explanation - Auth](./database/mongodb_schema_explaination.md#authentication)

DB-2. [x] `feat: add note model with embedded summary`
   - Note schema: userId, title, content, googleDocId, tags, visibility, sharedWith, summary (embedded: quickSummary, detailedSummary, generatedAt, model), hasFlashcards, deletedAt
   - Text index on title, content, tags
   - See [Schema Explanation - Notes](./database/mongodb_schema_explaination.md#notes--content)

DB-3. [x] `feat: add flashcard set and flashcard models`
   - FlashcardSet schema: userId, noteId, title, totalCards, visibility, sharedWith, isAIGenerated, deletedAt
   - Flashcard schema: setId, front, back, userProgress[] (userId, correctCount, incorrectCount, confidence), order, deletedAt
   - Study tracking: simple correct/incorrect for MVP; schema supports spaced repetition fields for post-showcase
   - Virtual: flashcards on FlashcardSet
   - Indexes: setId+order, userProgress.userId
   - See [Schema Explanation - Learning](./database/mongodb_schema_explaination.md#ai-learning)

DB-4. [x] `feat: add task model with recurrence and shared participants`
   - Schema: userId, noteId, title, dueDate, type, priority, status, recurrence (frequency, interval, daysOfWeek, endDate, parentTaskId), isShared, participants[] (userId, status, completedAt), completedAt, deletedAt
   - Virtual: isOverdue
   - Pre-save: set completedAt when status=completed; generate next occurrence for recurring tasks
   - Participants track their own status independently; only owner can edit task details
   - Indexes: userId+dueDate, participants.userId+isShared, dueDate+status, recurrence.parentTaskId
   - See [Schema Explanation - Tasks](./database/mongodb_schema_explaination.md#tasks--calendar)

DB-5. [x] `test: create seed script for core models`
   - Create seed data for Users, Notes, NoteSummaries, FlashcardSets, Flashcards, Tasks
   - Validate all schemas work correctly
   - Test indexes and queries
   - Verify pre-save hooks fire correctly

### Session 2 (3/2): Social & Career Models
**Models 7-11 — Social, Career + Stretch models if time permits**

#### Tickets

DB-6. [ ] `feat: add friendship model with request system`
   - Schema: user1, user2 (user1<user2), requestedBy, status (pending/accepted/rejected/blocked), deletedAt
   - Pre-save: enforce user1<user2 ordering
   - Unique compound index: user1+user2
   - See [Schema Explanation - Social](./database/mongodb_schema_explaination.md#social-features-sprint-5)

DB-7. [ ] `feat: add comment model with user snapshots`
   - Schema: targetId, targetType (note, flashcardSet, task), userId, content, parentId, likes, userSnapshot, deletedAt
   - Pre-save: snapshot user data
   - Indexes: targetId+targetType, userId
   - See [Schema Explanation - Social](./database/mongodb_schema_explaination.md#social-features)

DB-8. [ ] `feat: add resume model with embedded feedback and cached text`
   - Resume schema: userId, fileName, fileUrl, fileSize, version, targetRole, extractedText (select: false, cached on upload), feedback[] (embedded: overallScore, strengths, improvements, sections[], keywordOptimization, model, generatedAt), deletedAt
   - Virtuals: hasFeedback, latestFeedback
   - extractedText parsed from PDF on upload for instant AI feedback
   - See [Schema Explanation - Career](./database/mongodb_schema_explaination.md#career-tools)

DB-9. [ ] `feat: add application tracking model`
   - Schema: userId, company, position, status, appliedAt, contacts[], notes, resumeUsed, followUpReminders[], deletedAt
   - Indexes: userId+status, userId+deadlineDate
   - See [Schema Explanation - Career](./database/mongodb_schema_explaination.md#career-tools-sprint-7)

DB-10. [ ] `test: create seed script for social and career models`
   - Seed data for Friendships, Comments, Resumes, ResumeFeedback, Applications
   - Test relationships between models
   - Validate compound indexes work correctly

DB-11. [ ] `feat: add stretch models (conversation, message, syncqueue, activity)` *(stretch)*
   - Conversation schema: participants[2], lastMessage, unreadCounts[], deletedAt
   - Message schema: conversationId, senderId, content, readBy[], clientTimestamp, syncStatus, deletedAt
   - SyncQueue schema: userId, operation, collection, documentId, data, status, clientTimestamp, processedAt
   - Activity schema: userId, type, targetId, targetType, visibleTo[], metadata, createdAt (TTL: 90 days)
   - See [Schema Explanation - Messaging](./database/mongodb_schema_explaination.md#messaging-sprint-6) and [Offline Sync](./database/mongodb_schema_explaination.md#offline-sync-sprint-6)

### Phase 1 Checkpoint
- [ ] All 9 must-ship models created and validated
- [ ] Seed scripts run successfully
- [ ] All indexes verified
- [ ] Pre-save hooks tested (bcrypt, user1<user2, completedAt, user snapshot)
- [ ] Virtual fields working (isOverdue, flashcards, latestFeedback)
- [ ] Understand data flow between related models

---

## Phase 2: Backend APIs
**Sessions 3-5 | March 9-23**
**Focus**: Express.js, REST API design, JWT authentication, middleware, Groq AI integration

### Learning Goals
- Master Express routing, middleware chains, and error handling
- Understand JWT authentication flow (sign, verify, refresh)
- Learn Google OAuth integration
- Practice RESTful API design patterns
- Integrate third-party APIs (Google Drive, Groq)
- Test all endpoints with Postman/Thunder Client before any frontend

### Session 3 (3/9): Auth & Notes APIs
**Authentication system + Notes CRUD + Google Docs integration**

#### Tickets

API-1. [ ] `feat: implement jwt authentication endpoints`
   - POST /api/auth/register — create user, return JWT
   - POST /api/auth/login — validate credentials, return JWT
   - GET /api/auth/me — get current user from token
   - POST /api/auth/forgot-password — send reset email via Resend
   - POST /api/auth/reset-password — verify token, set new password
   - Implement password validation, error handling

API-2. [ ] `feat: add google oauth integration`
   - GET /api/auth/google — initiate OAuth flow (login/register)
   - GET /api/auth/google/callback — handle OAuth callback, create/find user, return JWT
   - POST /api/me/google/link — link Google account to existing user
   - DELETE /api/me/google/link — unlink Google (keepNotes: true/false)
   - Store Google tokens securely, track hasGoogleLinked state

API-3. [ ] `feat: add jwt verification middleware`
   - Create auth middleware that verifies JWT on protected routes
   - Extract user from token and attach to request
   - Handle expired tokens, invalid tokens, missing tokens

API-4. [ ] `feat: add note crud endpoints`
   - POST /api/notes — create note
   - GET /api/notes — list user's notes (with search, filters, pagination)
   - GET /api/notes/:id — get single note
   - PUT /api/notes/:id — update note
   - DELETE /api/notes/:id — soft delete note

API-5. [ ] `feat: add google drive api client integration`
   - Set up Google Drive API client
   - GET /api/google/files — list user's Google Drive files
   - Implement OAuth token refresh

API-6. [ ] `feat: implement google doc import and refresh`
   - POST /api/notes/import — import Google Doc as note snapshot
   - PUT /api/notes/:id/refresh — refresh note from Google Docs
   - Parse Google Doc content into note format

### Session 4 (3/16): AI, Flashcards & Tasks APIs
**Groq integration + Flashcard CRUD + Task management**

#### Tickets

API-7. [ ] `feat: integrate groq api for summary generation`
   - Set up Groq API client with Llama 3.1
   - Create prompt templates for summary generation
   - POST /api/notes/:id/summary — generate AI summary
   - See [Groq AI Integration](./backend/groq_ai_integration.md)

API-8. [ ] `feat: implement ai flashcard generation`
   - Create prompt templates for flashcard extraction
   - POST /api/notes/:id/flashcards/generate — generate flashcards from note
   - Parse AI response into flashcard format

API-9. [ ] `feat: add flashcard set and flashcard crud endpoints`
   - POST /api/flashcard-sets — create set
   - GET /api/flashcard-sets — list user's sets
   - GET /api/flashcard-sets/:id — get set with flashcards
   - POST /api/flashcard-sets/:id/cards — add card
   - PUT /api/flashcard-sets/:setId/cards/:cardId — update card
   - PUT /api/flashcard-sets/:setId/cards/:cardId/progress — update study progress
   - DELETE /api/flashcard-sets/:id — soft delete set

API-10. [ ] `feat: implement task crud endpoints`
   - POST /api/tasks — create task (with optional note linking)
   - GET /api/tasks — list tasks (with status filters, date range)
   - PUT /api/tasks/:id — update task
   - DELETE /api/tasks/:id — soft delete task
   - PATCH /api/tasks/:id/status — quick status update

API-11. [ ] `feat: create calendar aggregation endpoint`
   - GET /api/calendar — aggregate tasks by date range
   - Support week and month views
   - Include overdue task detection

API-12. [ ] `test: test all session 3-4 endpoints with postman`
   - Create Postman collection for all endpoints
   - Test happy paths and error cases
   - Verify auth middleware protects routes
   - Test pagination and filtering

### Session 5 (3/23): Social & Career APIs
**Friends, sharing, comments + Resume upload and AI feedback + Application tracking**

#### Tickets

API-13. [ ] `feat: implement friend request endpoints`
   - POST /api/friends/request — send friend request
   - PUT /api/friends/request/:id — accept/reject request
   - GET /api/friends — list friends
   - DELETE /api/friends/:id — remove friend
   - GET /api/users/search — search users by username/email

API-14. [ ] `feat: add note sharing with visibility controls`
   - PUT /api/notes/:id/share — share note with friends
   - GET /api/notes/shared — list notes shared with user
   - Update note visibility (private/friends/specific users)

API-15. [ ] `feat: add comment and like endpoints`
   - POST /api/comments — add comment on note/flashcard set
   - GET /api/comments/:targetType/:targetId — get comments
   - POST /api/comments/:id/like — toggle like
   - DELETE /api/comments/:id — soft delete comment

API-16. [ ] `feat: add resume upload and ai feedback endpoints`
   - POST /api/resumes/upload — upload resume PDF (with file validation)
   - GET /api/resumes — list user's resumes
   - POST /api/resumes/:id/feedback — generate AI feedback via Groq
   - GET /api/resumes/:id/feedback — get feedback history

API-17. [ ] `feat: add application tracking endpoints`
   - POST /api/applications — create application entry
   - GET /api/applications — list applications (with status filters)
   - PUT /api/applications/:id — update application
   - GET /api/applications/dashboard — pipeline summary (counts by status)
   - POST /api/applications/:id/contacts — add networking contact
   - POST /api/applications/:id/reminders — add follow-up reminder

API-18. [ ] `feat: implement shared tasks with participants`
   - Update task endpoints to support isShared and participants
   - GET /api/tasks/shared — list tasks shared with user
   - Shared tasks appear in all participants' calendars

API-19. [ ] `test: test all session 5 endpoints with postman`
   - Test friend request flow end-to-end
   - Test sharing and visibility
   - Test file upload
   - Verify all protected routes

API-20. [ ] `feat: add stretch api endpoints (messaging)` *(stretch)*
   - POST /api/conversations — start conversation
   - GET /api/conversations — list conversations (inbox)
   - POST /api/conversations/:id/messages — send message
   - GET /api/conversations/:id/messages — get messages (paginated)
   - PUT /api/messages/:id/read — mark as read

### Phase 2 Checkpoint
- [ ] All auth endpoints working (register, login, Google OAuth, JWT middleware)
- [ ] Notes CRUD + Google Docs import working
- [ ] AI summaries and flashcard generation working via Groq
- [ ] Flashcard CRUD with study progress working
- [ ] Task CRUD with calendar aggregation working
- [ ] Friend system working end-to-end
- [ ] Note sharing and comments working
- [ ] Resume upload and AI feedback working
- [ ] Application tracking working
- [ ] All endpoints tested via Postman collection
- [ ] Error handling consistent across all routes

---

## Phase 3: Frontend Integration
**Sessions 6-7 | March 30 - April 6**
**Focus**: React (web), React Native + Expo (mobile), API integration, state management

### Learning Goals
- Connect React frontend to Express backend with fetch/axios
- Implement auth context and protected routes
- Learn React Native parallels to React (components, navigation, state)
- Build for Android with Expo for Google Play
- Handle loading states, errors, and optimistic updates

### Session 6 (3/30): Auth, Notes & Learning UI
**Wire up existing web UI + build mobile equivalents for core features**

#### Web Tickets

WEB-1. [ ] `feat: wire up login and registration to auth api`
   - Connect existing login/register forms to POST /api/auth endpoints
   - Store JWT in localStorage/context
   - Handle auth errors and validation

WEB-2. [ ] `feat: add auth context and protected routing`
   - Create AuthContext with login, logout, user state
   - Add ProtectedRoute wrapper component
   - Redirect unauthenticated users to login
   - Persist session across page refreshes

WEB-3. [ ] `feat: create dashboard shell with navigation`
   - Build main dashboard layout with sidebar/nav
   - Route between Notes, Flashcards, Tasks, Social, Career sections

WEB-4. [ ] `feat: wire up notes list and google drive import`
   - Connect notes list to GET /api/notes
   - Add Google Drive file picker → POST /api/notes/import
   - Implement search and tag filtering
   - Add note viewer and editor

WEB-5. [ ] `feat: wire up ai summaries and flashcard study`
   - Connect summary generation to POST /api/notes/:id/summary
   - Build flashcard study view with flip animation
   - Connect flashcard CRUD to API
   - Add keyboard shortcuts for study navigation

WEB-6. [ ] `feat: wire up tasks and calendar view`
   - Connect task creation/editing to API
   - Build calendar grid component with GET /api/calendar
   - Implement status filters and inline editing
   - Show overdue indicators

#### Mobile Tickets

MOB-1. [ ] `feat: build mobile auth screens`
   - Login and registration screens
   - Google OAuth flow on mobile
   - Secure token storage with AsyncStorage
   - Navigation auth flow (auth stack vs main stack)

MOB-2. [ ] `feat: build mobile notes and import screens`
   - Notes list screen with search
   - Note viewer (scrollable)
   - Google Drive import flow
   - Note refresh

MOB-3. [ ] `feat: build mobile flashcard study screen`
   - Flashcard set list
   - Study view with flip animation
   - Swipe gestures for navigation (next/previous)
   - Progress tracking

MOB-4. [ ] `feat: build mobile task and calendar screens`
   - Task creation form
   - Task list with status filters
   - Calendar view
   - Swipe actions for quick status updates

### Session 7 (4/6): Social, Career & Polish
**Wire up remaining features on both platforms**

#### Web Tickets

WEB-7. [ ] `feat: wire up friends and sharing ui`
   - User search and friend request flow
   - Friends list
   - Note sharing controls
   - Shared notes feed

WEB-8. [ ] `feat: wire up comments and likes`
   - Comment threads on shared notes
   - Like functionality
   - Display shared tasks in calendar

WEB-9. [ ] `feat: wire up resume management`
   - Resume upload with drag and drop
   - Resume feedback display
   - Version management

WEB-10. [ ] `feat: wire up application tracking dashboard`
   - Application creation and editing
   - Pipeline dashboard (kanban-style or list by status)
   - Networking contacts and follow-up reminders

#### Mobile Tickets

MOB-5. [ ] `feat: build mobile social screens`
   - Friends management screen
   - User search
   - Shared note viewing
   - Comments interface

MOB-6. [ ] `feat: build mobile career screens`
   - Resume management
   - Resume feedback viewing
   - Application tracking list
   - Application detail and status updates

MOB-7. [ ] `feat: add stretch mobile features` *(stretch)*
   - Direct messaging interface
   - Offline storage for notes and tasks
   - Sync on reconnect
   - Offline/sync status indicators

### Phase 3 Checkpoint
- [ ] Web: All features connected to backend APIs
- [ ] Web: Auth flow working (register, login, Google OAuth, protected routes)
- [ ] Web: Notes, flashcards, tasks, calendar all functional
- [ ] Web: Social features (friends, sharing, comments) working
- [ ] Web: Career tools (resume, applications) working
- [ ] Mobile: Auth flow with secure storage working
- [ ] Mobile: Core features (notes, flashcards, tasks) functional
- [ ] Mobile: Social and career features working
- [ ] Mobile: Builds and runs on Android emulator/device

---

## Phase 4: Polish & Showcase Prep
**Session 8 + Showcase | April 13-17**
**Focus**: Bug fixes, performance, Google Play prep, demo

### Session 8 (4/13): Final Polish

#### Backend Hardening

POL-1. [ ] `feat: implement api rate limiting`
POL-2. [ ] `refactor: standardize error responses across all routes`
POL-3. [ ] `perf: verify indexes and optimize slow queries`

#### Frontend Polish

POL-4. [ ] `ui: add loading skeletons and spinners`
POL-5. [ ] `feat: add error boundaries with fallback ui`
POL-6. [ ] `fix: responsive layout improvements`
POL-7. [ ] `ui: smooth animations and transitions`

#### Testing & QA

POL-8. [ ] `test: add integration test suite for critical paths`
POL-9. [ ] `fix: resolve bugs found during testing`
POL-10. [ ] `test: verify functionality on android device`

#### Showcase Preparation

POL-11. [ ] `docs: prepare demo script`
POL-12. [ ] `feat: create sample data for demo`
POL-13. [ ] `docs: record backup demo video`
POL-14. [ ] `build: prepare android build for google play`

### Showcase - April 17
- [ ] Complete product demo showing full student workflow
- [ ] Demo: Google Docs import → AI summaries/flashcards → Task management → Social sharing → Career tools
- [ ] Working on both web and Android mobile
- [ ] Android build ready for Google Play submission

---

## Progress Summary

### Phase Completion
- [ ] Phase 1: Database Layer (0/11 tickets)
- [ ] Phase 2: Backend APIs (0/20 tickets)
- [ ] Phase 3: Frontend Integration (0/17 tickets — 10 web + 7 mobile)
- [ ] Phase 4: Polish & Showcase (0/14 tickets)

### Key Milestones
- [ ] All MongoDB models created and seeded
- [ ] All backend APIs tested via Postman
- [ ] Authentication working on web and mobile
- [ ] Google Docs import functional
- [ ] AI summaries and flashcards working
- [ ] Task and calendar system complete
- [ ] Social features (friends, sharing, comments) working
- [ ] Career tools (resume upload, AI feedback, applications) working
- [ ] Android build running on device/emulator
- [ ] All critical bugs fixed
- [ ] Showcase demo prepared

---

## Priority & Scope Adjustments

### Must Ship
- Authentication (JWT + Google OAuth)
- Notes + Google Docs import
- AI summaries and flashcards (Groq)
- Tasks and calendar
- Friends, sharing, and comments
- Career tools (resume upload, AI feedback, application tracking)

### Stretch Goals
- Direct messaging
- Offline sync support
- Activity feed

### If Time Runs Short
- **Phase 1**: Can skip stretch models (Conversation, Message, SyncQueue, Activity)
- **Phase 2**: Can skip messaging endpoints, simplify shared tasks
- **Phase 3**: Prioritize web first, then mobile core features. Career screens can be simplified.
- **Phase 4**: Minimum viable: demo script + sample data. Skip backup video if needed.

### Reference Documents
- **Database schemas & data flows**: [MongoDB Schema Explanation](./database/mongodb_schema_explaination.md) and [MongoDB Schema Implementation Order](./database/mongodb_schema_implementation_order.md)
- **API routes & conventions**: [API Reference Guide](./backend/api_reference_guide.md)
- **ER diagram**: [Schema Diagram](./database/schema_diagram.md)
- **Git & agile workflow**: [Agile Workflow Guide](./agile_workflow_guide.md)

**Workflow**:
1. Check current ticket in "Current Status"
2. Read the relevant schema docs or sprint plan for context
3. Implement following the ticket description
4. Verify against the phase checkpoint
5. Mark ticket complete and update current status

---

## Success Criteria

Each phase succeeds when:
- Phase checkpoint can be verified
- Core functionality works as described
- No critical bugs in completed features
- Code is committed and pushed to repository

**Remember**: Better to have fewer features working well than many features half-done. Focus on the demo story!

---

*Last Updated: February 16, 2026*
*Current Status: Phase 1 - Database Layer (Session 1: Core Models)*
