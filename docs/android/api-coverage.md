# Android API Coverage

Last updated: April 2026
Backend API docs: https://api.usecontinuum.dev/api-docs

---

## Coverage Summary

| Feature Group | Backend Endpoints | Android Covered | Notes |
|--------------|-------------------|-----------------|-------|
| Auth | 26 | 18 | 4 mobile-specific endpoints; Google OAuth redirect/callback (web-only) not applicable; admin endpoints excluded |
| Notes | 13 | 10 | PDF download, upload from file, and refresh (Google Docs re-sync) not yet wired |
| Flashcards | 13 | 12 | Card progress update not yet wired (tracked client-side during study) |
| Tasks | 9 | 9 | Includes `PATCH /tasks/:id/participants` from task detail share sheet |
| Calendar | 1 | 1 | |
| Applications | 9 | 9 | Includes 3 endpoints added during this branch |
| Resumes | 6 | 5 | Resume upload uses multipart; download not yet wired |
| Social / Activity | 5 | 5 | |
| Friends | 5 | 5 | |
| Users | 3 | 3 | |
| Comments | 4 | 4 | |
| Study Sessions | 5 | 4 | Single session by ID not yet wired |
| Conversations | 5 | 5 | |
| Messages | 2 | 0 | Mark-as-read and delete-message are per-message endpoints; conversations cover the primary flow |
| Sync | 1 | 1 | |
| Google Drive | 1 | 1 | `files` list only; `docs/:docId/preview` handled inline |
| **Total** | **~108** | **~92** | ~85% coverage; remaining are niche or web-only endpoints |

---

## Endpoint Detail

### Auth

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| POST | /api/auth/mobile/login | LoginScreen | AuthViewModel.login() | No |
| POST | /api/auth/mobile/refresh | (TokenAuthenticator) | Automatic on 401 | No |
| POST | /api/auth/google/mobile | LoginScreen | AuthViewModel.loginWithGoogle() | No |
| POST | /api/auth/mobile/logout | ProfileScreen | ProfileViewModel.logout() | No |
| POST | /api/auth/register | RegisterScreen | AuthViewModel.register() | No |
| POST | /api/auth/forgot-password | ForgotPasswordScreen | AuthViewModel.forgotPassword() | No |
| POST | /api/auth/reset-password | ResetPasswordScreen | AuthViewModel.resetPassword() | No |
| GET | /api/auth/me | App startup | AuthViewModel.hydrateUser() | No |
| PATCH | /api/auth/me/profile | EditProfileScreen, SettingsScreen | ProfileViewModel.updateProfileFields() | No |
| PATCH | /api/auth/me/password | ProfileScreen | ProfileViewModel.changePassword() | No |
| PATCH | /api/auth/me/username | EditProfileScreen | ProfileViewModel.updateUsername() | No |
| DELETE | /api/auth/me | ProfileScreen | ProfileViewModel.deleteAccount() | No |
| POST | /api/auth/me/restore | (handled server-side on login) | — | No |
| POST | /api/auth/logout-all | ProfileScreen | ProfileViewModel.logoutAll() | No |
| GET | /api/auth/sessions | ProfileScreen | ProfileViewModel.loadSessions() | No |
| DELETE | /api/auth/sessions/:id | ProfileScreen | ProfileViewModel.revokeSession() | No |
| POST | /api/auth/send-verification | ProfileScreen | ProfileViewModel.resendVerification() | No |
| DELETE | /api/auth/me/google/link | ProfileScreen | ProfileViewModel.unlinkGoogle() | No |

### Notes

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/notes | NotesListScreen | NotesViewModel.loadNotes() | Yes |
| GET | /api/notes/shared | NotesListScreen (shared tab) | NotesViewModel.loadNotes(shared=true) | No |
| GET | /api/notes/:id | NoteDetailScreen | NotesViewModel.loadNote() | Yes |
| POST | /api/notes | NoteDetailScreen | NotesViewModel.createNote() | Yes |
| PUT | /api/notes/:id | NoteEditorScreen | NotesViewModel.autoSave() | Yes |
| DELETE | /api/notes/:id | NotesListScreen | NotesViewModel.deleteNote() | Yes |
| POST | /api/notes/:id/summary | NoteDetailScreen | NotesViewModel.generateSummary() | No |
| POST | /api/notes/:id/flashcards/generate | NoteDetailScreen | NotesViewModel.generateFlashcards() | No |
| POST | /api/notes/import | GoogleDriveImportScreen | NotesViewModel.importFromDrive() | No |
| PUT | /api/notes/:id/share | NoteDetailScreen | NotesViewModel.shareNote() | No |

### Flashcard Sets

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/flashcard-sets | FlashcardSetsListScreen | FlashcardsViewModel.loadSets() | Yes |
| GET | /api/flashcard-sets/shared | FlashcardSetsListScreen (shared tab) | FlashcardsViewModel.loadSets(shared=true) | No |
| GET | /api/flashcard-sets/:id | FlashcardSetDetailScreen | FlashcardsViewModel.loadSetDetail() | Yes |
| POST | /api/flashcard-sets | FlashcardSetsListScreen | FlashcardsViewModel.createSet() | Yes |
| PATCH | /api/flashcard-sets/:id | FlashcardSetDetailScreen | FlashcardsViewModel.updateSet() | No |
| DELETE | /api/flashcard-sets/:id | FlashcardSetsListScreen | FlashcardsViewModel.deleteSet() | Yes |
| PATCH | /api/flashcard-sets/:id/share | FlashcardSetDetailScreen | FlashcardsViewModel.shareSet() | No |
| POST | /api/flashcard-sets/:id/duplicate | FlashcardSetDetailScreen | FlashcardsViewModel.duplicateSet() | No |
| POST | /api/flashcard-sets/:id/cards | FlashcardSetDetailScreen | FlashcardsViewModel.addCard() | No |
| PUT | /api/flashcard-sets/:setId/cards/:cardId | FlashcardSetDetailScreen | FlashcardsViewModel.updateCard() | No |
| DELETE | /api/flashcard-sets/:setId/cards/:cardId | FlashcardSetDetailScreen | FlashcardsViewModel.deleteCard() | No |
| POST | /api/flashcard-sets/generate | FlashcardSetsListScreen | FlashcardsViewModel.generateSet() | No |

### Tasks

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/tasks | TaskBoardScreen | TasksViewModel.loadTasks() | Yes |
| GET | /api/tasks/shared | TaskBoardScreen (shared tab) | TasksViewModel.loadTasks(shared=true) | No |
| GET | /api/tasks/:id | TaskDetailScreen | TasksViewModel.loadTaskDetail() | No |
| POST | /api/tasks | TaskBoardScreen | TasksViewModel.createTask() | Yes |
| PUT | /api/tasks/:id | TaskDetailScreen | TasksViewModel.updateTask() | No |
| PATCH | /api/tasks/:id/status | TaskDetailScreen | TasksViewModel.updateTaskStatus() | No |
| PATCH | /api/tasks/:id/participant-status | TaskBoardScreen | TasksViewModel.moveTask() | No |
| PATCH | /api/tasks/:id/participants | TaskDetailScreen | TasksViewModel.saveTaskParticipants() | No |
| DELETE | /api/tasks/:id | TaskDetailScreen | TasksViewModel.deleteTask() | Yes |

### Calendar

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/calendar | CalendarViewScreen | TasksViewModel.loadCalendar() | No |

### Applications

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/applications | ApplicationsListScreen | CareerViewModel.loadApplications() | No |
| GET | /api/applications/dashboard | DashboardScreen | DashboardViewModel.load() | No |
| GET | /api/applications/:id | ApplicationDetailScreen | CareerViewModel.loadApplicationDetail() | No |
| POST | /api/applications | ApplicationsListScreen | CareerViewModel.createApplication() | No |
| PUT | /api/applications/:id | ApplicationDetailScreen | CareerViewModel.updateApplication() | No |
| DELETE | /api/applications/:id | ApplicationsListScreen | CareerViewModel.deleteApplication() | No |
| POST | /api/applications/:id/contacts | ApplicationDetailScreen | CareerViewModel.addContact() | No |
| DELETE | /api/applications/:id/contacts/:contactId | ApplicationDetailScreen | CareerViewModel.deleteContact() | No |
| DELETE | /api/applications/:id/reminders/:reminderId | ApplicationDetailScreen | CareerViewModel.deleteReminder() | No |

### Resumes

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/resumes | ResumesListScreen | CareerViewModel.loadResumes() | No |
| POST | /api/resumes/upload | ResumesListScreen | CareerViewModel.uploadResume() | No |
| DELETE | /api/resumes/:id | ResumesListScreen | CareerViewModel.deleteResume() | No |
| POST | /api/resumes/:id/feedback | ResumeFeedbackScreen | CareerViewModel.generateFeedback() | No |
| GET | /api/resumes/:id/feedback | ResumeFeedbackScreen | CareerViewModel.loadFeedback() | No |

### Social / Activity

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/activity | ActivityFeedScreen, DashboardScreen | SocialViewModel.loadActivity() | No |
| PUT | /api/activity/mark-seen | ActivityFeedScreen | SocialViewModel.markActivitySeen() | No |
| GET | /api/users/search | UserSearchScreen | SocialViewModel.searchUsers() | No |
| GET | /api/users/:id | UserProfileScreen | SocialViewModel.loadUserProfile() | No |
| GET | /api/users/:id/streak | UserProfileScreen | (included in profile response) | No |

### Friends

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/friends | FriendsListScreen | SocialViewModel.loadFriends() | No |
| POST | /api/friends/request | UserSearchScreen, UserProfileScreen | SocialViewModel.sendFriendRequest() | No |
| PUT | /api/friends/request/:id | FriendsListScreen | SocialViewModel.acceptRequest() | No |
| DELETE | /api/friends/request/:id | FriendsListScreen | SocialViewModel.cancelSentRequest() | No |
| DELETE | /api/friends/:id | FriendsListScreen | SocialViewModel.removeFriend() | No |

### Comments

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| POST | /api/comments | CommentThread | SocialViewModel/via CommentThread | No |
| GET | /api/comments/:targetType/:targetId | SharedNoteViewScreen, TaskDetailScreen | SocialRepository.getCommentsForTarget() | No |
| POST | /api/comments/:id/like | CommentThread | SocialViewModel.likeComment() | No |
| DELETE | /api/comments/:id | CommentThread | SocialRepository.deleteComment() | No |

### Study Sessions

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| POST | /api/study-sessions | StudyModeScreen | FlashcardsViewModel.submitStudySession() | No |
| GET | /api/study-sessions | (Study history) | FlashcardsViewModel.loadStudyHistory() | No |
| GET | /api/study-sessions/streak | DashboardScreen | (included in profile) | No |
| GET | /api/study-sessions/set/:setId | FlashcardSetDetailScreen | FlashcardsViewModel.loadSetStudyHistory() | No |

### Conversations

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/conversations | ConversationsScreen | MessagingViewModel.loadConversations() | No |
| POST | /api/conversations | UserProfileScreen | MessagingViewModel.startConversation() | No |
| DELETE | /api/conversations/:id | ConversationsScreen | MessagingViewModel.deleteConversation() | No |
| GET | /api/conversations/:id/messages | ConversationDetailScreen | MessagingViewModel.loadMessages() | No |
| POST | /api/conversations/:id/messages | ConversationDetailScreen | MessagingViewModel.sendMessage() | No |

### Sync

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| POST | /api/sync | (SyncWorker background) | SyncWorker.doWork() | N/A |

### Google Drive

| Method | Path | Android Screen | ViewModel Method | Room Cached |
|--------|------|---------------|-----------------|-------------|
| GET | /api/google/files | GoogleDriveImportScreen | NotesViewModel.loadDriveFiles() | No |
