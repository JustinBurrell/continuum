# Continuum Android Demo Video Script

Recording tool: Android Studio screen recording (Run > Screen Record) or ADB `adb shell screenrecord /sdcard/demo.mp4`

Target device: Pixel 8 emulator, API 35, light mode.

---

## Scene 1: Authentication (30s)

1. Cold launch the app — splash screen appears
2. Show the login screen with email/password fields, Google Sign-In button, and links to privacy policy / terms of service
3. Tap "Sign in with Google" — Credential Manager bottom sheet appears with Google account
4. Select account — one-tap sign-in completes, navigates to Dashboard
5. Quick cut: show the Register screen with validation (required field asterisks, password strength)

**Key points to highlight:** Native Credential Manager (no WebView), smooth transition to Dashboard, form validation parity with web.

---

## Scene 2: Dashboard (15s)

1. Show the Instagram-style top header (Continuum logo left, calendar/activity/messages icons right)
2. Scroll through: greeting, stat tiles (notes, flashcards, tasks, applications), recent notes horizontal scroller, recent flashcard sets, upcoming tasks, recent activity
3. Tap a stat tile — navigates to the corresponding feature screen
4. Show the 5-item icon-only bottom nav (Notes, Flashcards, Logo/Dashboard, Applications, Profile)

**Key points to highlight:** Modern header that scrolls away, elevated stat cards, bottom nav with center logo, pull-to-refresh.

---

## Scene 3: Notes (30s)

1. Navigate to Notes via bottom nav
2. Show the notes list with search bar, type filter chips (All, Lecture, Study, Personal)
3. Tap FAB to create a new note — title + rich text editor appears
4. Type a title, add some formatted text (bold, heading, bullet list)
5. Save the note — show it appear in the list
6. Open the note, tap the AI summary button — loading state, then summary appears
7. Tap "Generate Flashcards" — navigates to a new flashcard set created from the note

**Key points to highlight:** Rich text editing (richeditor-compose), AI-powered summary and flashcard generation, real-time save.

---

## Scene 4: Flashcards + Study Mode (30s)

1. Navigate to Flashcards via bottom nav
2. Show the sets list with search and shared tab
3. Open a set — show cards list with front/back preview
4. Tap "Study" — study mode launches
5. Show a flashcard face, tap "Reveal Answer" to flip
6. Tap "Got it" — card slides away, next card appears
7. Tap "Still Learning" on the next card — different animation
8. Complete the study session — summary screen shows score, time, "Got it" vs "Still Learning" counts
9. Study session is recorded to backend

**Key points to highlight:** Card flip animation, swipe disabled until answer revealed, study session recording, Quizlet-inspired UX.

---

## Scene 5: Tasks + Calendar (25s)

1. Navigate to Tasks (from dashboard or profile quick link)
2. Show the task board with status tabs (To Do, In Progress, Completed)
3. Create a new task — fill in title, priority, type, due date
4. Tap a task card — detail screen opens with full metadata (status chips, due date, duration, overdue warning)
5. Change task status from the detail screen
6. Switch to Calendar view — show events on the calendar grid
7. Tap a date — filtered tasks for that date appear

**Key points to highlight:** Clickable task cards, full task detail parity with web, calendar integration.

---

## Scene 6: Career (25s)

1. Navigate to Applications via bottom nav
2. Show the applications list with status filter chips and search
3. Create a new application — company, position, status, job URL
4. Open an application — detail screen with contacts, reminders, notes
5. Quick cut: show the Resumes tab within Applications
6. Open a resume — PDF viewer loads
7. Tap "AI Feedback" — scored section-by-section feedback appears

**Key points to highlight:** Full application CRUD with contacts/reminders, resume PDF viewing, AI feedback scores.

---

## Scene 7: Social + Messaging (25s)

1. Navigate to Profile via bottom nav
2. Tap "Friends" quick link — friends list with tabs (Friends, Requests, Sent)
3. Tap a friend — user profile screen shows stats, bio, friend status
4. Navigate to Messages — conversations list with search bar, unread badges
5. Open a conversation — chat bubbles, real-time delivery
6. Type and send a message — optimistic UI (message appears instantly)
7. Show the Activity Feed — recent activity with clickable user avatars

**Key points to highlight:** Real-time messaging via Socket.io, user profile screens, clickable names everywhere, conversation search.

---

## Scene 8: Profile + Settings (15s)

1. Show Profile screen — avatar, name, username, quick links (Calendar, Resumes, Friends, Messages, Activity)
2. Tap Edit Profile — change display name, bio
3. Show Settings — notification toggles, activity visibility (persisted to backend)
4. Show Sessions — device-labeled active sessions with revoke capability
5. Tap "Sign out" — server-side logout, navigates to login

**Key points to highlight:** Profile picture upload, session management with device labels, server-side logout with refresh token revocation.

---

## Scene 9: Offline Resilience (15s)

1. Turn off emulator network (Settings > Network > Airplane mode)
2. Show the OfflineBanner appearing at the top of the screen
3. Create a note while offline — it saves locally to Room
4. Turn network back on — banner disappears
5. Show the note syncing (pull-to-refresh confirms it's on the server)

**Key points to highlight:** Offline banner, local Room persistence, WorkManager sync queue, seamless reconnection.

---

## Total Runtime

Approximately 3 minutes 10 seconds. Keep transitions tight, use cuts between scenes rather than manual navigation when possible.

## Post-Production

- Add text overlays for each scene title
- Add a brief intro card: "Continuum Android — Full Feature Parity with Web"
- Export as MP4, 1080x2400 resolution (Pixel 8 native)
