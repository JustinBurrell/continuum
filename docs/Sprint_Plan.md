# Continuum
## 8-Week Sprint Plan

**Timeline**: February 16 - April 10, 2026  
**Methodology**: Agile with weekly sprints  
**Developer**: Solo full-stack development  
**Showcase**: April 10, 2026

---

## 🏗️ Sprint 1: Foundation Layer
**February 16-22 | Core Infrastructure**

### 🎯 Sprint Objectives
Build the foundational authentication and infrastructure that everything else depends on. Get basic app running on web and mobile.

### Week 1 Tasks

**Backend Setup**
- Initialize Express server with basic middleware
  - `git commit -m "feat: initialize express server with cors and body-parser"`
- Set up MongoDB connection and User schema
  - `git commit -m "feat: add mongodb connection and user model"`
- Implement JWT auth endpoints (register, login)
  - `git commit -m "feat: implement jwt authentication endpoints"`
- Add Google OAuth flow
  - `git commit -m "feat: add google oauth integration"`
- Create auth middleware for protected routes
  - `git commit -m "feat: add jwt verification middleware"`

**Web Frontend**
- Create React app with routing setup
  - `git commit -m "feat: initialize react app with router"`
- Build login and registration pages
  - `git commit -m "feat: add login and registration forms"`
- Implement auth context and protected routes
  - `git commit -m "feat: add auth context and protected routing"`
- Create basic dashboard layout
  - `git commit -m "feat: create dashboard shell with navigation"`

**Mobile App**
- Initialize Expo project
  - `git commit -m "feat: initialize expo react native project"`
- Set up navigation structure
  - `git commit -m "feat: configure react navigation with auth flow"`
- Build login screen with Google Sign-In
  - `git commit -m "feat: add login screen with google oauth"`
- Implement token storage
  - `git commit -m "feat: add secure token storage with async storage"`

### ✅ Demo Checkpoint
User registers/logs in via email or Google on web and mobile. Session persists across restarts.

---

## 📚 Sprint 2: Content Foundation
**February 23 - March 1 | Google Docs & Notes**

### 🎯 Sprint Objectives
Connect to Google Drive, import docs as notes, and build note viewing/management features.

### Week 2 Tasks

**Backend Development**
- Integrate Google Drive API client
  - `git commit -m "feat: add google drive api client integration"`
- Create Note schema and CRUD endpoints
  - `git commit -m "feat: add note model and crud endpoints"`
- Build Google Docs import endpoint
  - `git commit -m "feat: implement google doc import as note snapshot"`
- Add note refresh functionality
  - `git commit -m "feat: add note refresh from google docs"`

**Web Frontend**
- Build Google Drive file picker
  - `git commit -m "feat: add google drive file picker component"`
- Create notes list page with filters
  - `git commit -m "feat: create notes list with search and filters"`
- Build note viewer with scroll
  - `git commit -m "feat: add scrollable note viewer"`
- Add note editing and tagging
  - `git commit -m "feat: implement note editing and tag management"`

**Mobile Development**
- Create document list screen
  - `git commit -m "feat: add mobile document list screen"`
- Build mobile note viewer
  - `git commit -m "feat: create mobile scrollable note viewer"`
- Add import and refresh actions
  - `git commit -m "feat: implement note import and refresh on mobile"`

### ✅ Demo Checkpoint
User browses Google Drive, imports docs as notes, and views/edits them on web and mobile.

---

## 🧠 Sprint 3: Active Learning
**March 2-8 | AI Summaries & Flashcards**

### 🎯 Sprint Objectives
Add AI-powered study tools - summaries and flashcards with study interface.

### Week 3 Tasks

**Backend Development**
- Integrate LLM API for summaries
  - `git commit -m "feat: integrate llm api for summary generation"`
- Create AI summary endpoint with caching
  - `git commit -m "feat: add note summary generation endpoint"`
- Build flashcard generation endpoint
  - `git commit -m "feat: implement ai flashcard generation"`
- Add Flashcard schema and CRUD
  - `git commit -m "feat: add flashcard model and crud endpoints"`

**Web Frontend**
- Add summary generation UI to note page
  - `git commit -m "feat: add summary generation ui with loading states"`
- Build flashcard editor
  - `git commit -m "feat: create manual flashcard editor"`
- Create Quizlet-style study interface
  - `git commit -m "feat: build flashcard study view with flip animation"`
- Add keyboard navigation for studying
  - `git commit -m "feat: add keyboard shortcuts for flashcard study"`

**Mobile Development**
- Build flashcard study screen
  - `git commit -m "feat: create mobile flashcard study screen"`
- Add swipe gestures and animations
  - `git commit -m "feat: implement swipe gestures for flashcard navigation"`
- Enable offline flashcard access
  - `git commit -m "feat: add offline caching for flashcards"`

### ✅ Demo Checkpoint
User generates summaries and flashcards from notes, then studies using interactive flip interface.

---

## 📅 Sprint 4: Time Management
**March 9-15 | Tasks & Calendar**

### 🎯 Sprint Objectives
Build task management with calendar views to track assignments and deadlines.

### Week 4 Tasks

**Backend Development**
- Create Task schema with relationships
  - `git commit -m "feat: add task model with note linking"`
- Build task CRUD endpoints
  - `git commit -m "feat: implement task crud endpoints"`
- Add calendar aggregation endpoint
  - `git commit -m "feat: create calendar aggregation endpoint"`
- Implement overdue detection logic
  - `git commit -m "feat: add overdue task detection"`

**Web Frontend**
- Create task creation modal
  - `git commit -m "feat: add task creation modal with date picker"`
- Build task list with filters
  - `git commit -m "feat: create task list with status filters"`
- Implement calendar week/month view
  - `git commit -m "feat: build calendar grid view component"`
- Add task quick-edit functionality
  - `git commit -m "feat: implement inline task editing"`

**Mobile Development**
- Build task creation screen
  - `git commit -m "feat: add mobile task creation form"`
- Create mobile calendar view
  - `git commit -m "feat: implement mobile calendar view"`
- Add task status updates
  - `git commit -m "feat: add swipe actions for task status"`

### ✅ Demo Checkpoint
User creates tasks linked to notes, views them in calendar, and marks them complete.

---

## 🤝 Sprint 5: Collaboration Layer
**March 16-22 | Friends & Sharing**

### 🎯 Sprint Objectives
Enable social features - friend system, sharing notes, comments, and shared tasks.

### Week 5 Tasks

**Backend Development**
- Create Friend and FriendRequest schemas
  - `git commit -m "feat: add friendship and friend request models"`
- Build friend request endpoints
  - `git commit -m "feat: implement friend request send and respond"`
- Add Comment and Like schemas
  - `git commit -m "feat: create comment and like models"`
- Implement note sharing with permissions
  - `git commit -m "feat: add note sharing with visibility controls"`
- Build shared task logic
  - `git commit -m "feat: implement shared tasks with participants"`

**Web Frontend**
- Create user search and friend management
  - `git commit -m "feat: add user search and friend request ui"`
- Build friends feed page
  - `git commit -m "feat: create friends activity feed"`
- Add comment and like functionality
  - `git commit -m "feat: implement comments and likes on shared notes"`
- Show shared tasks in calendar
  - `git commit -m "feat: display shared tasks in calendar view"`

**Mobile Development**
- Build friends list screen
  - `git commit -m "feat: add mobile friends management screen"`
- Create shared content views
  - `git commit -m "feat: implement shared note viewing on mobile"`
- Add commenting interface
  - `git commit -m "feat: build mobile comment interface"`

### ✅ Demo Checkpoint
User adds friends, shares notes, comments on shared content, and creates shared tasks visible to all participants.

---

## 💬 Sprint 6: Messaging & Offline
**March 23-29 | DMs & Offline Support**

### 🎯 Sprint Objectives
Add direct messaging and implement offline functionality for uninterrupted use.

### Week 6 Tasks

**Backend Development**
- Create Conversation and Message schemas
  - `git commit -m "feat: add conversation and message models"`
- Build messaging endpoints
  - `git commit -m "feat: implement dm send and retrieve endpoints"`
- Add sync checkpoint endpoint
  - `git commit -m "feat: create sync checkpoint for offline support"`

**Web Frontend**
- Build DM inbox and conversation list
  - `git commit -m "feat: add direct message inbox ui"`
- Create chat interface
  - `git commit -m "feat: implement chat view with message bubbles"`
- Add message composition
  - `git commit -m "feat: build message input with emoji support"`

**Mobile Development**
- Create mobile chat screen
  - `git commit -m "feat: add mobile messaging interface"`
- Implement offline data caching
  - `git commit -m "feat: add offline storage for notes and tasks"`
- Build sync logic for offline changes
  - `git commit -m "feat: implement sync on reconnect"`
- Add sync status indicators
  - `git commit -m "feat: show offline/sync status in ui"`

### ✅ Demo Checkpoint
User sends messages to friends and uses app fully offline (notes, flashcards, tasks), then syncs when back online.

---

## 💼 Sprint 7: Career Tools
**March 30 - April 5 | Resumes & Applications**

### 🎯 Sprint Objectives
Add career management features - resume uploads with AI feedback and application tracking dashboard.

### Week 7 Tasks

**Backend Development**
- Set up file upload for resumes
  - `git commit -m "feat: add resume pdf upload endpoint"`
- Create Resume and ResumeFeedback schemas
  - `git commit -m "feat: add resume and feedback models"`
- Build AI resume feedback endpoint
  - `git commit -m "feat: implement ai resume analysis"`
- Create Application schema and CRUD
  - `git commit -m "feat: add application tracking model and endpoints"`
- Build dashboard aggregation
  - `git commit -m "feat: create applications dashboard endpoint"`

**Web Frontend**
- Add resume upload interface
  - `git commit -m "feat: create resume upload with drag and drop"`
- Display resume feedback
  - `git commit -m "feat: build resume feedback display component"`
- Create application dashboard
  - `git commit -m "feat: implement application pipeline dashboard"`
- Build application detail view
  - `git commit -m "feat: add application detail modal with networking"`

**Mobile Development**
- Build resume list screen
  - `git commit -m "feat: add mobile resume management screen"`
- Create application tracker
  - `git commit -m "feat: implement mobile application tracking"`
- Add status update interface
  - `git commit -m "feat: build application status update ui"`

### ✅ Demo Checkpoint
User uploads resumes, receives AI feedback, creates application entries, tracks status, and logs networking activity.

---

## 🚀 Sprint 8: Polish & Launch
**April 6-10 | Final Testing & Showcase Prep**

### 🎯 Sprint Objectives
Polish UI/UX, fix bugs, optimize performance, and prepare showcase demo.

### Week 8 Tasks

**Backend Hardening**
- Add rate limiting
  - `git commit -m "feat: implement api rate limiting"`
- Improve error handling
  - `git commit -m "refactor: standardize error responses"`
- Optimize database queries
  - `git commit -m "perf: add indexes and optimize queries"`

**Frontend Polish**
- Add loading states everywhere
  - `git commit -m "ui: add loading skeletons and spinners"`
- Implement error boundaries
  - `git commit -m "feat: add error boundaries with fallback ui"`
- Fix responsive design issues
  - `git commit -m "fix: responsive layout improvements"`
- Polish animations and transitions
  - `git commit -m "ui: smooth animations and transitions"`

**Testing & QA**
- Run full regression tests
  - `git commit -m "test: add integration test suite"`
- Fix critical bugs
  - `git commit -m "fix: resolve [specific bug description]"`
- Test offline sync thoroughly
  - `git commit -m "test: verify offline sync edge cases"`

**Showcase Preparation**
- Prepare demo script
- Create sample data
- Record backup demo video
- Test on multiple devices

### ✅ Showcase - April 10
Complete product demo showing full student workflow from Google Docs import to career management.

---

## Sprint Guidelines for Solo Developer

### Daily Workflow
- **Morning**: Pick 2-3 commit goals from sprint plan
- **Focus Time**: 4-6 hours of deep work
- **Evening**: Test, commit, push, update progress

### Realistic Expectations
- **Average**: 3-4 meaningful commits per day
- **Each commit**: 1-3 hours of focused work
- **Weekly output**: ~20-25 commits per sprint
- **Flexibility**: Adjust scope if falling behind - cut stretch goals first

### Priority Order (if time runs short)
1. **Must Have**: Auth, Notes, Tasks, Basic sharing
2. **Should Have**: AI features, Calendar, Friends
3. **Nice to Have**: DMs, Offline sync, Resume feedback
4. **Showcase Ready**: At least Sprints 1-4 fully working

### Scope Adjustments
- **Sprint 3**: Can defer flashcard auto-generation, keep manual creation
- **Sprint 5**: Can simplify to note sharing only, defer shared tasks
- **Sprint 6**: Can defer offline sync, keep DMs simple
- **Sprint 7**: Can simplify to resume upload only, defer AI feedback

---

## Success Criteria

Each sprint succeeds when:
- ✅ Demo checkpoint can be executed smoothly
- ✅ Core functionality works on both web and mobile
- ✅ No critical bugs in completed features
- ✅ Code is committed and pushed to repository

**Remember**: Better to have fewer features working well than many features half-done. Focus on the demo story!