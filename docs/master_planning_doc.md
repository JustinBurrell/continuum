# Continuum - Development Planning & Progress Tracker

**Project**: All-in-one educational platform unifying Google Docs, AI study tools, task management, and career tracking  
**Timeline**: Design Sprint (Pre-Sprint) → February 16 - April 10, 2026 (8 development weeks)  
**Stack**: MERN (MongoDB, Express, React, Node.js) + React Native with Expo  
**Developer**: Solo full-stack development  
**Showcase**: April 10, 2026

---

## 📋 Project Understanding

📄 **Related Documents**: [Product Requirements Document](./product/product_requirements_document.md) | [Proof of Concept](./product/proof_of_concept.md) | [Design Breakdown](./design/design_breakdown.md) | [Cheat Sheet](./design/continuum_cheat_sheet.md)

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
4. **Collaboration**: Friends, sharing, comments, and direct messaging
5. **Career Tools**: Resume management with AI feedback and application tracking
6. **Offline Support**: Full functionality without internet connection

### Key Technical Decisions
- **MERN Stack**: JavaScript across entire stack for rapid solo development
- **React Native + Expo**: 70-80% code sharing between iOS/Android
- **MongoDB**: Flexible schemas for rapid iteration
- **Offline-First**: Local caching with sync on reconnect

### Success Metrics
- 160+ commits across 8 weeks
- 80%+ backend test coverage
- Functional on both web and mobile
- Sub-2s load times for core features

---

## 🎯 Overall Progress

**Total Sprints**: 9 (1 Design Sprint + 8 Development Sprints)  
**Completed Sprints**: 0/9  
**Total Tickets**: 92 (Development) + Design tasks + 4 Project Setup  
**Completed Tickets**: 0/96  
**Current Sprint**: Sprint 0 - Design & Planning

---

## 📍 Current Status

**Current Ticket**: Page 1 - Core Flows (Auth, Notes, Flashcards, Tasks)  
**Sprint**: Sprint 0 - Design & Planning  
**Status**: Not Started

*Update this section as you progress through tickets*

---

## 🎨 Sprint 0: Design & Planning
**Pre-Sprint | Figma Design Creation & Project Setup**  
📖 [Design Breakdown Reference](./design/design_breakdown.md) | [Figma Breakdown](./design/figma_breakdown.md)

### 🎯 Sprint Objectives
1. Create complete Figma designs for all web and mobile pages before starting development
2. Set up base project structure for backend, web, and mobile applications
3. Initialize all three projects with proper configuration

**Total Screens**: 56 (28 Mobile + 28 Web)  
**Figma Pages**: 2  
**Progress**: 0/2 pages + 0/4 project setups

---

## 📄 Page 1: Core Flows (Auth, Notes, Flashcards, Tasks)
**Total**: 15 web screens + 15 mobile screens = 30 designs

### Mobile Screens (15)
- [ ] Mobile - Landing Page
- [ ] Mobile - Signup
- [ ] Mobile - Login
- [ ] Mobile - Dashboard Home
- [ ] Mobile - Notes Dashboard
- [ ] Mobile - Note Viewer
- [ ] Mobile - Note Editor
- [ ] Mobile - Note Import
- [ ] Mobile - Flashcards Dashboard
- [ ] Mobile - Flashcards Viewer
- [ ] Mobile - Flashcards Creation
- [ ] Mobile - Tasks Dashboard
- [ ] Mobile - Tasks Creation
- [ ] Mobile - Tasks Editor
- [ ] Mobile - Calendar View

### Web Screens (15)
- [ ] Web - Landing Page
- [ ] Web - Login
- [ ] Web - Signup
- [ ] Web - Dashboard Home
- [ ] Web - Notes Dashboard
- [ ] Web - Note Viewer
- [ ] Web - Note Editor
- [ ] Web - Note Import
- [ ] Web - Flashcards Dashboard
- [ ] Web - Flashcards Viewer
- [ ] Web - Flashcards Creation
- [ ] Web - Tasks Dashboard
- [ ] Web - Tasks Creation
- [ ] Web - Tasks Editor
- [ ] Web - Calendar View

---

## 📄 Page 2: Social, Career & Settings
**Total**: 13 web screens + 13 mobile screens = 26 designs

### Mobile Screens (13)
- [ ] Mobile - Social Dashboard
- [ ] Mobile - User Search
- [ ] Mobile - Friends List
- [ ] Mobile - Shared Note View
- [ ] Mobile - DM Inbox
- [ ] Mobile - Chat Screen
- [ ] Mobile - Career Dashboard
- [ ] Mobile - Resume Management
- [ ] Mobile - Resume Upload
- [ ] Mobile - Resume Feedback
- [ ] Mobile - Application Dashboard
- [ ] Mobile - Application Detail
- [ ] Mobile - Settings Profile

### Web Screens (13)
- [ ] Web - Social Dashboard
- [ ] Web - Friends List
- [ ] Web - User Search
- [ ] Web - Shared Note View
- [ ] Web - DM Inbox
- [ ] Web - Chat Screen
- [ ] Web - Career Dashboard
- [ ] Web - Resume Management
- [ ] Web - Resume Upload
- [ ] Web - Resume Feedback
- [ ] Web - Application Dashboard
- [ ] Web - Application Detail
- [ ] Web - Settings Profile

---

## 🧩 Shared Components
**Design once and reuse across all screens**:
- [ ] Buttons (primary, secondary, icon)
- [ ] Input fields
- [ ] Cards (note cards, task cards, application cards)
- [ ] Modals/Dialogs
- [ ] Navigation components
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Status badges
- [ ] Avatars

---

## ✅ Design Checklist

### Before Building Each Screen:
- [ ] Frame created with correct dimensions (Web: 1440 x 900px, Mobile: 390 x 844px)
- [ ] Named using convention: `[Platform] - [Screen Name]`
- [ ] Auto Layout enabled on main container
- [ ] All nested elements have descriptive names
- [ ] Consistent spacing (4/8/12/16/24/32/48px)
- [ ] Colors match design system (#6B21A8, #F8F9FA, etc.)
- [ ] Components use Hug/Fill appropriately
- [ ] No absolute positioning inside Auto Layout

### For MCP Compatibility:
- [ ] All layers descriptively named (no "Frame 182")
- [ ] Auto Layout on all containers
- [ ] Consistent component patterns
- [ ] Clear hierarchy in layer structure

---

## 🛠️ Project Setup

### Backend Setup
1. [ ] `feat: initialize express server with cors and body-parser`
   - Initialize Node.js project with `npm init`
   - Install Express, CORS, body-parser, dotenv
   - Create `server.js` entry point
   - Set up basic Express app with middleware
   - Configure environment variables
   - Add health check endpoint

2. [ ] `feat: add mongodb connection and basic setup`
   - Install mongoose
   - Create database connection utility
   - Test MongoDB connection
   - Set up basic project structure (`/routes`, `/models`, `/middleware`, `/config`)

### Web Frontend Setup
3. [ ] `feat: initialize react app with router`
   - Create React app with Vite or Create React App
   - Install React Router DOM
   - Set up basic route structure
   - Create project folder structure (`/components`, `/pages`, `/hooks`, `/utils`, `/context`)
   - Configure routing with BrowserRouter

### Mobile App Setup
4. [ ] `feat: initialize expo react native project`
   - Install Expo CLI
   - Create new Expo project
   - Set up project structure (`/screens`, `/components`, `/navigation`, `/utils`, `/context`)
   - Configure app.json
   - Test on iOS simulator/Android emulator

---

### ✅ Sprint 0 Checkpoint
**Design:**
- [ ] Page 1 designs complete (30 screens)
- [ ] Page 2 designs complete (26 screens)
- [ ] All shared components designed (10 components)
- [ ] Design system documented (colors, typography, spacing)
- [ ] Designs reviewed and approved
- [ ] Figma files organized and ready for development

**Projects:**
- [ ] Backend Express server runs and responds to health check
- [ ] MongoDB connection established
- [ ] React web app runs and displays basic routes
- [ ] Expo mobile app runs on simulator/emulator
- [ ] All three projects have proper folder structure
- [ ] Git repository initialized with proper `.gitignore`

---

## 🏗️ Sprint 1: Foundation Layer
**February 16-22 | Core Infrastructure**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_1.md)

### 🎯 Sprint Objectives
Build the foundational authentication and infrastructure that everything else depends on. Get basic app running on web and mobile.

### Progress: 0/10 tickets

#### Backend Setup
1. [ ] `feat: add user model with password hashing`
2. [ ] `feat: implement jwt authentication endpoints`
3. [ ] `feat: add google oauth integration`
4. [ ] `feat: add jwt verification middleware`

#### Web Frontend
5. [ ] `feat: add login and registration forms`
6. [ ] `feat: add auth context and protected routing`
7. [ ] `feat: create dashboard shell with navigation`

#### Mobile App
8. [ ] `feat: configure react navigation with auth flow`
9. [ ] `feat: add login screen with google oauth`
10. [ ] `feat: add secure token storage with async storage`

### ✅ Demo Checkpoint
- [ ] User registers/logs in via email or Google on web and mobile
- [ ] Session persists across restarts

---

## 📚 Sprint 2: Content Foundation
**February 23 - March 1 | Google Docs & Notes**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_2.md)

### 🎯 Sprint Objectives
Connect to Google Drive, import docs as notes, and build note viewing/management features.

### Progress: 0/11 tickets

#### Backend Development
11. [ ] `feat: add google drive api client integration`
12. [ ] `feat: add note model and crud endpoints`
13. [ ] `feat: implement google doc import as note snapshot`
14. [ ] `feat: add note refresh from google docs`

#### Web Frontend
15. [ ] `feat: add google drive file picker component`
16. [ ] `feat: create notes list with search and filters`
17. [ ] `feat: add scrollable note viewer`
18. [ ] `feat: implement note editing and tag management`

#### Mobile Development
19. [ ] `feat: add mobile document list screen`
20. [ ] `feat: create mobile scrollable note viewer`
21. [ ] `feat: implement note import and refresh on mobile`

### ✅ Demo Checkpoint
- [ ] User browses Google Drive, imports docs as notes
- [ ] User views/edits notes on web and mobile

---

## 🧠 Sprint 3: Active Learning
**March 2-8 | AI Summaries & Flashcards**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_3.md)

### 🎯 Sprint Objectives
Add AI-powered study tools - summaries and flashcards with study interface.

### Progress: 0/12 tickets

#### Backend Development
22. [ ] `feat: integrate llm api for summary generation`
23. [ ] `feat: add note summary generation endpoint`
24. [ ] `feat: implement ai flashcard generation`
25. [ ] `feat: add flashcard model and crud endpoints`

#### Web Frontend
26. [ ] `feat: add summary generation ui with loading states`
27. [ ] `feat: create manual flashcard editor`
28. [ ] `feat: build flashcard study view with flip animation`
29. [ ] `feat: add keyboard shortcuts for flashcard study`

#### Mobile Development
30. [ ] `feat: create mobile flashcard study screen`
31. [ ] `feat: implement swipe gestures for flashcard navigation`
32. [ ] `feat: add offline caching for flashcards`

### ✅ Demo Checkpoint
- [ ] User generates summaries and flashcards from notes
- [ ] User studies using interactive flip interface

---

## 📅 Sprint 4: Time Management
**March 9-15 | Tasks & Calendar**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_4.md)

### 🎯 Sprint Objectives
Build task management with calendar views to track assignments and deadlines.

### Progress: 0/11 tickets

#### Backend Development
33. [ ] `feat: add task model with note linking`
34. [ ] `feat: implement task crud endpoints`
35. [ ] `feat: create calendar aggregation endpoint`
36. [ ] `feat: add overdue task detection`

#### Web Frontend
37. [ ] `feat: add task creation modal with date picker`
38. [ ] `feat: create task list with status filters`
39. [ ] `feat: build calendar grid view component`
40. [ ] `feat: implement inline task editing`

#### Mobile Development
41. [ ] `feat: add mobile task creation form`
42. [ ] `feat: implement mobile calendar view`
43. [ ] `feat: add swipe actions for task status`

### ✅ Demo Checkpoint
- [ ] User creates tasks linked to notes
- [ ] User views tasks in calendar
- [ ] User marks tasks complete

---

## 🤝 Sprint 5: Collaboration Layer
**March 16-22 | Friends & Sharing**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_5.md)

### 🎯 Sprint Objectives
Enable social features - friend system, sharing notes, comments, and shared tasks.

### Progress: 0/12 tickets

#### Backend Development
44. [ ] `feat: add friendship and friend request models`
45. [ ] `feat: implement friend request send and respond`
46. [ ] `feat: create comment and like models`
47. [ ] `feat: add note sharing with visibility controls`
48. [ ] `feat: implement shared tasks with participants`

#### Web Frontend
49. [ ] `feat: add user search and friend request ui`
50. [ ] `feat: create friends activity feed`
51. [ ] `feat: implement comments and likes on shared notes`
52. [ ] `feat: display shared tasks in calendar view`

#### Mobile Development
53. [ ] `feat: add mobile friends management screen`
54. [ ] `feat: implement shared note viewing on mobile`
55. [ ] `feat: build mobile comment interface`

### ✅ Demo Checkpoint
- [ ] User adds friends
- [ ] User shares notes
- [ ] User comments on shared content
- [ ] User creates shared tasks visible to all participants

---

## 💬 Sprint 6: Messaging & Offline
**March 23-29 | DMs & Offline Support**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_6.md)

### 🎯 Sprint Objectives
Add direct messaging and implement offline functionality for uninterrupted use.

### Progress: 0/12 tickets

#### Backend Development
56. [ ] `feat: add conversation and message models`
57. [ ] `feat: implement dm send and retrieve endpoints`
58. [ ] `feat: create sync checkpoint for offline support`

#### Web Frontend
59. [ ] `feat: add direct message inbox ui`
60. [ ] `feat: implement chat view with message bubbles`
61. [ ] `feat: build message input with emoji support`

#### Mobile Development
62. [ ] `feat: add mobile messaging interface`
63. [ ] `feat: add offline storage for notes and tasks`
64. [ ] `feat: implement sync on reconnect`
65. [ ] `feat: show offline/sync status in ui`

### ✅ Demo Checkpoint
- [ ] User sends messages to friends
- [ ] User uses app fully offline (notes, flashcards, tasks)
- [ ] App syncs when back online

---

## 💼 Sprint 7: Career Tools
**March 30 - April 5 | Resumes & Applications**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_7.md)

### 🎯 Sprint Objectives
Add career management features - resume uploads with AI feedback and application tracking dashboard.

### Progress: 0/12 tickets

#### Backend Development
66. [ ] `feat: add resume pdf upload endpoint`
67. [ ] `feat: add resume and feedback models`
68. [ ] `feat: implement ai resume analysis`
69. [ ] `feat: add application tracking model and endpoints`
70. [ ] `feat: create applications dashboard endpoint`

#### Web Frontend
71. [ ] `feat: create resume upload with drag and drop`
72. [ ] `feat: build resume feedback display component`
73. [ ] `feat: implement application pipeline dashboard`
74. [ ] `feat: add application detail modal with networking`

#### Mobile Development
75. [ ] `feat: add mobile resume management screen`
76. [ ] `feat: implement mobile application tracking`
77. [ ] `feat: build application status update ui`

### ✅ Demo Checkpoint
- [ ] User uploads resumes
- [ ] User receives AI feedback
- [ ] User creates application entries
- [ ] User tracks status and logs networking activity

---

## 🚀 Sprint 8: Polish & Launch
**April 6-10 | Final Testing & Showcase Prep**  
📖 [Detailed Sprint Plan](./sprint_planning/sprint_8.md)

### 🎯 Sprint Objectives
Polish UI/UX, fix bugs, optimize performance, and prepare showcase demo.

### Progress: 0/14 tickets

#### Backend Hardening
78. [ ] `feat: implement api rate limiting`
79. [ ] `refactor: standardize error responses`
80. [ ] `perf: add indexes and optimize queries`

#### Frontend Polish
81. [ ] `ui: add loading skeletons and spinners`
82. [ ] `feat: add error boundaries with fallback ui`
83. [ ] `fix: responsive layout improvements`
84. [ ] `ui: smooth animations and transitions`

#### Testing & QA
85. [ ] `test: add integration test suite`
86. [ ] `fix: resolve [specific bug description]`
87. [ ] `test: verify offline sync edge cases`

#### Showcase Preparation
88. [ ] `docs: prepare demo script`
89. [ ] `feat: create sample data for demo`
90. [ ] `docs: record backup demo video`
91. [ ] `test: verify functionality on multiple devices`

### ✅ Showcase - April 10
- [ ] Complete product demo showing full student workflow
- [ ] Demo: Google Docs import → AI learning → Task management → Collaboration → Career tools
- [ ] Offline functionality demonstration

---

## 📊 Progress Summary

### Sprint Completion
- [ ] Sprint 0: Design & Planning (0/2 pages, 0/56 screens, 0/4 project setups)
- [ ] Sprint 1: Foundation Layer (0/10)
- [ ] Sprint 2: Content Foundation (0/11)
- [ ] Sprint 3: Active Learning (0/12)
- [ ] Sprint 4: Time Management (0/11)
- [ ] Sprint 5: Collaboration Layer (0/12)
- [ ] Sprint 6: Messaging & Offline (0/12)
- [ ] Sprint 7: Career Tools (0/12)
- [ ] Sprint 8: Polish & Launch (0/14 tickets)

### Key Milestones
- [ ] **Page 1 complete** (Core Flows: Auth, Notes, Flashcards, Tasks - 30 screens)
- [ ] **Page 2 complete** (Social, Career & Settings - 26 screens)
- [ ] **All shared components designed** (10 components)
- [ ] Authentication working on web and mobile
- [ ] Google Docs import functional
- [ ] AI summaries and flashcards working
- [ ] Task and calendar system complete
- [ ] Social features (friends, sharing) implemented
- [ ] Direct messaging functional
- [ ] Offline support working
- [ ] Resume upload and AI feedback complete
- [ ] Application tracking dashboard ready
- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Showcase demo prepared

---

## 📝 Notes & Adjustments

### Priority Order (if time runs short)
1. **Must Have**: Auth, Notes, Tasks, Basic sharing
2. **Should Have**: AI features, Calendar, Friends
3. **Nice to Have**: DMs, Offline sync, Resume feedback
4. **Showcase Ready**: At least Sprints 1-4 fully working

### Scope Adjustments (if needed)
- **Sprint 3**: Can defer flashcard auto-generation, keep manual creation
- **Sprint 5**: Can simplify to note sharing only, defer shared tasks
- **Sprint 6**: Can defer offline sync, keep DMs simple
- **Sprint 7**: Can simplify to resume upload only, defer AI feedback

### Using the Detailed Sprint Plans
Each sprint has a detailed plan in `docs/sprint_planning/` with:
- **Learning Goals**: What concepts to understand
- **Implementation Steps**: Step-by-step guidance
- **Acceptance Criteria**: How to know it's done
- **Resources**: Links and documentation
- **Common Issues**: Troubleshooting tips

**Workflow**: 
1. Check current ticket number in "Current Status"
2. Open the detailed sprint plan for that sprint
3. Read the ticket details, learning goals, and resources
4. Implement following the steps
5. Verify against acceptance criteria
6. Mark ticket complete and update current status

---

## 🎯 Success Criteria

Each sprint succeeds when:
- ✅ Demo checkpoint can be executed smoothly
- ✅ Core functionality works on both web and mobile
- ✅ No critical bugs in completed features
- ✅ Code is committed and pushed to repository

**Remember**: Better to have fewer features working well than many features half-done. Focus on the demo story!

---

*Last Updated: [Date]*  
*Current Status: Sprint 0 - Design & Planning (Page 1: Core Flows)*
