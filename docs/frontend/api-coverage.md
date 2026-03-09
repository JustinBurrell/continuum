# Frontend API Coverage

Every backend endpoint and the frontend page/component that covers it.

Backend base URL: `http://localhost:5001/api`
Frontend base URL: `http://localhost:5173`

---

## Auth — `/api/auth`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/auth/register` | `pages/auth/Register.jsx` | react-hook-form, redirects to `/dashboard` |
| POST | `/api/auth/login` | `pages/auth/Login.jsx` | JWT + refreshToken stored in localStorage |
| POST | `/api/auth/forgot-password` | `pages/auth/ForgotPassword.jsx` | Sends reset email |
| POST | `/api/auth/reset-password` | `pages/auth/ResetPassword.jsx` | Body: `{ token, password }` — token from URL param |
| POST | `/api/auth/refresh` | `lib/api.js` interceptor | Auto-refresh on 401; called transparently |
| GET | `/api/auth/google` | `context/AuthContext.jsx` → `googleLogin()` | Redirects browser to Google OAuth |
| GET | `/api/auth/google/callback` | Backend-only | Backend redirects to `/auth/callback?token=JWT` |
| GET | `/api/auth/me` | `context/AuthContext.jsx` (hydrate on mount) + `pages/Profile.jsx` | Returns current user |
| PATCH | `/api/auth/me/profile` | `pages/Profile.jsx` → profile tab | multipart/form-data; handles name, username, bio, avatar, settings |
| POST | `/api/auth/logout` | `context/AuthContext.jsx` → `logout()` | Sends refreshToken in body |
| POST | `/api/auth/logout-all` | Not yet exposed in UI | Revokes all sessions |
| POST | `/api/auth/me/google/link` | `pages/Profile.jsx` → integrations tab | Redirects to OAuth link flow |
| DELETE | `/api/auth/me/google/link` | `pages/Profile.jsx` → integrations tab → Unlink button | |

**Auth callback handler:** `pages/auth/AuthCallback.jsx` — reads `?token=` from URL, stores in localStorage, calls `/api/auth/me`, redirects to `/dashboard`.

---

## Notes — `/api/notes`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/notes` | `pages/notes/NotesList.jsx` | Supports `search`, `tag`, `type` query params |
| POST | `/api/notes` | `pages/notes/NoteEditor.jsx` | Create new note |
| GET | `/api/notes/:id` | `pages/notes/NoteDetail.jsx` | View note content |
| PUT | `/api/notes/:id` | `pages/notes/NoteEditor.jsx` | Edit note content |
| DELETE | `/api/notes/:id` | `pages/notes/NoteDetail.jsx` → delete button | Navigates back to list |
| POST | `/api/notes/:id/summary` | `pages/notes/NoteDetail.jsx` → AI Summary card | Returns AI-generated summary |
| GET | `/api/notes/shared` | Not yet exposed in UI | View notes shared with you |
| POST | `/api/notes/import` | `pages/notes/NotesList.jsx` → Import modal → Google Drive tab | Requires Google account linked |
| POST | `/api/notes/upload` | `pages/notes/NotesList.jsx` → Import modal → Upload PDF tab | multipart/form-data; field: `file`; optional: `title`, `type`, `tags` |
| PUT | `/api/notes/:id/refresh` | Not yet exposed in UI | |
| PUT | `/api/notes/:id/share` | Not yet exposed in UI | Share a note with another user |
| POST | `/api/notes/:id/flashcards/generate` | Not yet exposed in UI | Generate flashcards from note content |

---

## Comments — `/api/comments`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/comments` | `pages/notes/NoteDetail.jsx` → comment input | Body: `{ targetType: 'note', targetId, content }` |
| GET | `/api/comments/:targetType/:targetId` | `pages/notes/NoteDetail.jsx` | Fetched as `/comments/note/:noteId` |
| DELETE | `/api/comments/:id` | Not yet exposed in UI | Delete own comment |
| POST | `/api/comments/:id/like` | Not yet exposed in UI | Like a comment |

---

## Flashcard Sets — `/api/flashcard-sets`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/flashcard-sets` | `pages/flashcards/FlashcardSets.jsx` | List all sets |
| POST | `/api/flashcard-sets` | `pages/flashcards/FlashcardSets.jsx` → create modal | |
| GET | `/api/flashcard-sets/:id` | `pages/flashcards/FlashcardSetDetail.jsx` | Cards array included |
| DELETE | `/api/flashcard-sets/:id` | `pages/flashcards/FlashcardSets.jsx` → delete button | |
| POST | `/api/flashcard-sets/generate` | `pages/flashcards/FlashcardSetDetail.jsx` → AI Generate | Body: `{ setId }` |
| POST | `/api/flashcard-sets/:id/cards` | `pages/flashcards/FlashcardSetDetail.jsx` → Add card modal | Body: `{ front, back }` |
| DELETE | `/api/flashcard-sets/:setId/cards/:cardId` | `pages/flashcards/FlashcardSetDetail.jsx` → card delete | |
| PUT | `/api/flashcard-sets/:setId/cards/:cardId` | Not yet exposed in UI | Edit card text |
| PUT | `/api/flashcard-sets/:setId/cards/:cardId/progress` | `pages/flashcards/StudyMode.jsx` | Track study progress |
| PATCH | `/api/flashcard-sets/:id/share` | Not yet exposed in UI | Share a set |
| GET | `/api/flashcard-sets/shared` | Not yet exposed in UI | View shared sets |

---

## Tasks — `/api/tasks`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/tasks` | `pages/tasks/Tasks.jsx` | Kanban grouped by status |
| POST | `/api/tasks` | `pages/tasks/Tasks.jsx` → New task modal | |
| GET | `/api/tasks/:id` | Not needed (list used) | |
| PUT | `/api/tasks/:id` | `pages/tasks/Tasks.jsx` → status dropdown | Full update including status change |
| PATCH | `/api/tasks/:id/status` | Available but not used directly | Status-only update (use `PUT` instead) |
| DELETE | `/api/tasks/:id` | `pages/tasks/Tasks.jsx` → card delete | |
| PATCH | `/api/tasks/:id/participant-status` | Not yet exposed in UI | Update a participant's status |
| GET | `/api/tasks/shared` | Not yet exposed in UI | Tasks shared with you |

---

## Calendar — `/api/calendar`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/calendar` | `pages/Calendar.jsx` | Supports `from`, `to`, `view` query params |

---

## Friends — `/api/friends`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/friends` | `pages/friends/Friends.jsx` → Friends tab | Returns `{ friendships }` of accepted |
| GET | `/api/friends?status=pending` | `pages/friends/Friends.jsx` → Requests tab | Returns `{ friendships }` of pending |
| POST | `/api/friends/request` | `pages/friends/Friends.jsx` → Find tab → Add button | Body: `{ recipientId }` (user `_id` from search) |
| PUT | `/api/friends/request/:id` | `pages/friends/Friends.jsx` → Requests tab | Body: `{ action: 'accept' \| 'reject' }` |
| DELETE | `/api/friends/:id` | `pages/friends/Friends.jsx` → Friends tab → Remove | Removes accepted friendship |

---

## Users — `/api/users`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/users/search` | `pages/friends/Friends.jsx` → Find tab | Query param `q`; results shown as cards with Add button |
| GET | `/api/users/:id` | Not yet wired | Returns public profile: `{ _id, username, firstName, lastName, avatarUrl, bio, createdAt }`. No email, tokens, or settings. JWT required. |

---

## Conversations & Messages — `/api/conversations`, `/api/messages`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/conversations` | `pages/messages/Messages.jsx` | List of conversations |
| POST | `/api/conversations` | `pages/friends/Friends.jsx` → Message button | Body: `{ participantId: friendId }` |
| GET | `/api/conversations/:id/messages` | `pages/messages/Conversation.jsx` | Polled every 5s |
| POST | `/api/conversations/:id/messages` | `pages/messages/Conversation.jsx` → send input | Body: `{ content }` |
| PUT | `/api/messages/:id/read` | Not yet exposed in UI | Mark message as read |

---

## Applications — `/api/applications`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/applications` | `pages/applications/ApplicationsList.jsx` | Pipeline (kanban) + list view |
| POST | `/api/applications` | `pages/applications/ApplicationsList.jsx` → Add modal | |
| PUT | `/api/applications/:id` | `pages/applications/ApplicationDetail.jsx` → Edit | Stage, notes, role, company, etc. |
| GET | `/api/applications/dashboard` | Not yet exposed in UI | Summary stats |
| POST | `/api/applications/:id/contacts` | Not yet exposed in UI | Add a contact to an application |
| POST | `/api/applications/:id/reminders` | Not yet exposed in UI | Set a reminder |

**Note:** No single GET or DELETE for applications in the backend. Detail page (`ApplicationDetail.jsx`) reads from router state or React Query cache passed from the list.

---

## Resumes — `/api/resumes`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/resumes/upload` | `pages/resumes/Resumes.jsx` → drag & drop / upload button | multipart/form-data with `resume` (file) + `name` fields |
| GET | `/api/resumes` | `pages/resumes/Resumes.jsx` | Lists all uploaded resumes |
| POST | `/api/resumes/:id/feedback` | `pages/resumes/Resumes.jsx` → AI Feedback button | AI-generated feedback accordion |
| GET | `/api/resumes/:id/feedback` | Not yet exposed in UI | Fetch prior feedback |

---

## Activity — `/api/activity`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/activity` | `pages/Activity.jsx` | Own activity feed |

---

## Google — `/api/google`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/google/files` | Not yet exposed in UI | List linked Google Drive files (requires Google account linked) |

---

## Sync — `/api/sync`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/sync` | `pages/Profile.jsx` → Integrations tab → Sync now | Syncs notes/resumes to Google Drive |

---

## Health

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/health` | Not used in UI | Backend health check only |

---

## Endpoints Not Yet Wired to UI

These backend endpoints exist but have no frontend UI yet:

| Endpoint | Feature Needed |
|----------|---------------|
| `POST /api/auth/logout-all` | "Sign out all devices" button in Profile security tab |
| `GET /api/notes/shared` | "Shared with me" section on NotesList |
| `POST /api/notes/import` | Import button on NotesList |
| `PUT /api/notes/:id/refresh` | Refresh note action |
| `PUT /api/notes/:id/share` | Share note with friend button on NoteDetail |
| `POST /api/notes/:id/flashcards/generate` | "Generate flashcards" button on NoteDetail |
| `DELETE /api/comments/:id` | Delete comment button on NoteDetail |
| `POST /api/comments/:id/like` | Like comment button on NoteDetail |
| `PUT /api/flashcard-sets/:setId/cards/:cardId` | Edit card content inline on FlashcardSetDetail |
| `PATCH /api/flashcard-sets/:id/share` | Share set button on FlashcardSetDetail |
| `GET /api/flashcard-sets/shared` | "Shared sets" tab on FlashcardSets |
| `PATCH /api/tasks/:id/participant-status` | Participant status toggle on task card |
| `GET /api/tasks/shared` | "Shared with me" tab on Tasks |
| `PUT /api/messages/:id/read` | Auto-mark read on Conversation mount |
| `GET /api/applications/dashboard` | Stats widget on Dashboard or Applications header |
| `POST /api/applications/:id/contacts` | Contacts section on ApplicationDetail |
| `POST /api/applications/:id/reminders` | Reminder section on ApplicationDetail |
| `GET /api/resumes/:id/feedback` | Load prior feedback without regenerating |
| `GET /api/google/files` | Google Drive file browser in Profile |
