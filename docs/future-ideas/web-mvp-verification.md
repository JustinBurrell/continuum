# MVP Verification — Frontend Smoke Tests

Branch to verify: `feat/realtime-websockets`

Manual walkthrough to confirm every page and feature works end-to-end. For real-time flows, open two browser windows — one as User A, one as User B. A and B should be accepted friends before starting.

---

## Marketing Pages

### Landing
- [ ] Page loads with correct hero, features, and CTA sections
- [ ] "Get started" / sign up CTA navigates to register
- [ ] Log in link navigates to login
- [ ] Logged-in user visiting landing → redirected to dashboard

### About
- [ ] Page loads without errors

### Product
- [ ] Page loads without errors

---

## Auth

### Register
- [ ] Register with email + password → lands on dashboard
- [ ] Duplicate email → error shown
- [ ] Duplicate username → error shown
- [ ] Weak password (missing number, special char, etc.) → validation error shown

### Login
- [ ] Log in with email + password → lands on dashboard
- [ ] Wrong password → error shown
- [ ] Non-existent email → error shown
- [ ] Log out → redirected to landing page
- [ ] Refresh while logged in → stays logged in, user hydrates correctly

### Google OAuth
- [ ] "Sign in with Google" → Google consent → lands on dashboard
- [ ] Google account with existing email → links to existing user, no duplicate
- [ ] AuthCallback page handles token from URL → stores token → navigates to dashboard

### Forgot / Reset Password
- [ ] Submit email → success message shown
- [ ] Receive reset email → link opens reset page
- [ ] Submit new password → success → log in with new password
- [ ] Expired or invalid token → error shown

### Email Verification
- [ ] Verification banner shows on Profile Overview if email unverified
- [ ] "Send email" button sends verification email
- [ ] Clicking verification link → EmailVerified page loads correctly

---

## App Layout

### Sidebar
- [ ] All nav links navigate to correct pages
- [ ] Active link highlighted correctly
- [ ] Sidebar visible on all app pages
- [ ] User avatar and name display correctly
- [ ] Log out from sidebar works

### General
- [ ] Navigating between pages doesn't reset scroll or break layout
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Browser back/forward navigation works correctly

---

## Dashboard

- [ ] Loads without errors
- [ ] Recent notes section shows latest notes with correct titles
- [ ] Upcoming tasks section shows tasks with due dates
- [ ] Recent applications section shows applications with correct company and stage
- [ ] Activity summary renders
- [ ] Quick-action links navigate to correct pages
- [ ] Empty states show helpful messages when user has no data

---

## Notes

### Notes List
- [ ] My notes load and display correctly
- [ ] Search filters notes by title/content
- [ ] Filter by note type works
- [ ] "Shared with me" toggle switches to shared notes tab
- [ ] Shared notes tab shows notes from friends with correct author
- [ ] Search in shared tab filters correctly
- [ ] Create note button opens editor
- [ ] Clicking a note opens NoteDetail
- [ ] Google Drive import tab shows Drive files
- [ ] PDF upload import tab works
- [ ] Empty state shown when no notes exist

### Note Editor
- [ ] Create new note → title and content save correctly
- [ ] Edit existing note → changes persist on reload
- [ ] Rich text formatting (bold, italic, lists, etc.) works
- [ ] Note type selection works
- [ ] Auto-save or manual save functions correctly

### Note Detail
- [ ] Note content renders correctly
- [ ] AI summary generates and displays
- [ ] Generate flashcards from note → navigates to new flashcard set
- [ ] Share note modal opens
- [ ] Share with specific friends → correct friends listed
- [ ] Share with friends visibility → saves correctly
- [ ] Set to private → saves correctly
- [ ] Comments section loads
- [ ] Add comment → appears in list
- [ ] Delete comment → removed
- [ ] Edit note button navigates to editor
- [ ] Delete note → removed from list, redirected
- [ ] User B receives note in Shared tab instantly after User A shares (no refresh)

---

## Flashcards

### Flashcard Sets List
- [ ] My sets load and display with card count
- [ ] Search filters sets
- [ ] "Shared with me" toggle shows shared sets
- [ ] Shared sets show correct author
- [ ] Create set button works
- [ ] Clicking a set opens FlashcardSetDetail
- [ ] Delete set from list works
- [ ] Empty state shown when no sets exist

### Flashcard Set Detail
- [ ] Cards list loads with front/back content
- [ ] Add card → appears in list
- [ ] Edit card → updates correctly
- [ ] Delete card → removed, count decrements
- [ ] Share set modal opens and works correctly
- [ ] Generate from PDF upload works
- [ ] Comments section loads and works
- [ ] User B receives set in Shared tab instantly after User A shares (no refresh)

### Study Mode
- [ ] Cards load correctly
- [ ] Flip animation works
- [ ] Mark correct/incorrect updates progress
- [ ] Progress bar or counter updates
- [ ] End of deck shows summary or restart option
- [ ] Keyboard shortcuts work (if implemented)

---

## Tasks

### Tasks Page (My Tasks)
- [ ] Tasks load in kanban columns (todo, in progress, completed)
- [ ] Create task form opens → fills correctly → task appears in board
- [ ] Drag task between columns → status updates and persists
- [ ] Click task → detail modal opens with all fields
- [ ] Edit task title, description, due date, priority → saves
- [ ] Delete task → removed from board
- [ ] Search filters tasks
- [ ] Due date shows correctly
- [ ] Priority badge shows correctly

### Shared Tasks Tab
- [ ] "Shared" toggle switches to shared tasks
- [ ] Shared tasks from User A appear for User B without refreshing
- [ ] Create shared task with User B → appears in User B's shared tab instantly
- [ ] User A updates shared task → User B's list updates without refreshing
- [ ] User A deletes shared task → disappears from User B's list without refreshing
- [ ] User B updates their own participant status → saves correctly
- [ ] Share picker shows accepted friends only

### Recurring Tasks
- [ ] Create recurring task → recurrence saved
- [ ] Complete recurring task → next occurrence auto-created

---

## Calendar

- [ ] Calendar loads showing current month
- [ ] Tasks with due dates appear on correct dates
- [ ] Navigate to previous/next month works
- [ ] Clicking a task on the calendar opens task detail modal
- [ ] New tasks created with a due date appear on calendar without refresh

---

## Friends

### Friends Tab
- [ ] Accepted friends list loads
- [ ] Friend's avatar, name, username display correctly
- [ ] Remove friend → removed from list
- [ ] Clicking a friend navigates to their profile (UserProfile page)

### Requests Tab
- [ ] Incoming friend requests shown
- [ ] Accept request → friend appears in Friends tab, removed from Requests
- [ ] Decline request → removed from list
- [ ] User B receives friend request from User A without refreshing

### Sent Tab
- [ ] Outgoing pending requests shown
- [ ] Cancel sent request → removed from list

### Find Friends Tab
- [ ] Search by name or username returns results
- [ ] Send request to a user → appears in Sent tab
- [ ] Already-friends users shown as friends, not requestable

---

## Messages

### Messages (Inbox)
- [ ] Conversation list loads with latest message preview and timestamp
- [ ] Unread conversations highlighted
- [ ] Clicking a conversation navigates to Conversation page
- [ ] New conversation appears in User B's inbox when User A sends first message (no refresh)

### Conversation
- [ ] Message history loads in correct order
- [ ] Send message → appears instantly for sender
- [ ] User B receives message from User A without refreshing
- [ ] Timestamps display correctly
- [ ] Long conversations scroll correctly
- [ ] Auto-DM appears when User A shares something with User B

---

## Activity

- [ ] Activity feed loads with recent events
- [ ] Shows friend's notes shared, tasks created, comments, etc.
- [ ] User B's feed updates when User A shares a note (no refresh)
- [ ] User B's feed updates when User A shares a task (no refresh)
- [ ] Search filters activity by actor name or content title
- [ ] Pagination or infinite scroll loads more items
- [ ] Private visibility: User A sets activity to private → User B no longer sees User A's activity
- [ ] Empty state shown when feed is empty

---

## Applications

### Applications List
- [ ] Applications load with company name and stage badge
- [ ] Stage badge colors correct (draft gray, applied blue, interview purple, offer green, rejected red)
- [ ] Filter by stage works
- [ ] Search by company name works
- [ ] Create application form opens → fills correctly → appears in list
- [ ] Empty state shown when no applications

### Application Detail
- [ ] All fields display correctly (company, position, stage, notes, dates)
- [ ] Edit fields → save → changes persist on reload
- [ ] Update stage → badge updates correctly
- [ ] Delete application → removed from list, redirected
- [ ] Clicking application from Profile Overview opens this page correctly

---

## Resumes

- [ ] Resume list loads
- [ ] Upload PDF → appears in list with file name
- [ ] Click resume → detail view opens
- [ ] Request AI feedback → scored feedback renders with sections (strengths, improvements, scores)
- [ ] Delete resume → removed from list
- [ ] Empty state shown when no resumes

---

## Profile / Settings

### Overview Tab
- [ ] Full name, username, avatar, bio display correctly
- [ ] Friends count correct
- [ ] Joined date correct
- [ ] Recent notes list shows correct items → clicking opens note
- [ ] Recent tasks list shows correct items → clicking opens task detail modal
- [ ] Recent flashcard sets → clicking opens set detail
- [ ] Recent applications show company + stage badge → clicking opens application detail
- [ ] Recent resumes show file name
- [ ] "View all" links navigate to correct pages
- [ ] Email verification banner shows if unverified
- [ ] Bio updated on Profile tab → Overview reflects it immediately (no refresh)

### Profile Tab
- [ ] First name, last name, bio fields pre-filled with current values
- [ ] Edit fields → save → Overview updates immediately (no refresh)
- [ ] Username field pre-filled → change to unique name → success toast → sidebar updates
- [ ] Username change to taken name → inline error
- [ ] Avatar upload → crop modal opens → crop and save → avatar updates everywhere immediately
- [ ] Activity visibility dropdown saves correctly

### Security Tab
- [ ] Change password form shows (three fields + requirements checklist)
- [ ] Requirements checklist updates live as new password is typed
- [ ] Wrong current password → inline error under that field
- [ ] Passwords don't match → inline error
- [ ] Valid change → success toast → can log in with new password
- [ ] Google-only account → informational message shown instead of blocking

### Notifications Tab
- [ ] Email notifications toggle loads with current saved state
- [ ] Push notifications toggle loads with current saved state
- [ ] Toggling and saving persists on page reload

### Integrations Tab
- [ ] Google account linked status shows correctly
- [ ] "Link Google" works for email-only accounts
- [ ] "Unlink Google" works (only when password is set)
- [ ] Email verification status shows correctly
- [ ] "Sign out all devices" works → all refresh tokens revoked

---

## User Profile (Public)

- [ ] Navigating to another user's profile loads their name, username, avatar, bio
- [ ] Their public notes/activity visible based on their visibility settings
- [ ] Send friend request from their profile works
- [ ] Already friends → shows friend status

---

## Real-Time — Combined Scenario

Run this with User A and User B side by side:

- [ ] A sends B a message → B sees it in under 2 seconds
- [ ] A shares a task with B → B's Shared Tasks and activity feed both update
- [ ] A shares a note with B → B's Shared Notes and activity feed both update
- [ ] A shares a flashcard set with B → B's Shared Sets updates
- [ ] A sends B a friend request → B sees badge on Friends nav
- [ ] B accepts → A's friends list updates
- [ ] A comments on a note B owns → B's note detail updates
- [ ] All of the above work after a page refresh on B's side (socket reconnects)
- [ ] Both windows open as same user → both receive socket events

---

## Edge Cases

- [ ] Log out while socket event is in flight → no console errors
- [ ] Session expires → auto-redirected to login, not stuck on broken state
- [ ] All pages show loading skeletons while data fetches, not blank screens
- [ ] All pages show empty states when no data, not broken layouts
- [ ] Long text (very long note title, long name) doesn't break layouts
- [ ] Mobile viewport (375px) — no horizontal scroll, no overlapping elements

---

*Last Updated: March 2026*
