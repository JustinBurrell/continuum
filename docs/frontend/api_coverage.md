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
| POST | `/api/auth/forgot-password` | `pages/auth/ForgotPassword.jsx` | Sends reset email; returns 400 with specific message if email is unverified |
| POST | `/api/auth/reset-password` | `pages/auth/ResetPassword.jsx` | Body: `{ token, password }` — token from URL param |
| POST | `/api/auth/refresh` | `lib/api.js` interceptor | Auto-refresh on 401; called transparently |
| GET | `/api/auth/google` | `context/AuthContext.jsx` → `googleLogin()` | Redirects browser to Google OAuth |
| GET | `/api/auth/google/callback` | Backend-only | Backend redirects to `/auth/callback?token=JWT` |
| GET | `/api/auth/me` | `context/AuthContext.jsx` (hydrate on mount) + `pages/Profile.jsx` | Returns current user |
| PATCH | `/api/auth/me/profile` | `pages/Profile.jsx` → Profile tab | multipart/form-data; handles name, bio, avatar, settings |
| PATCH | `/api/auth/me/username` | `pages/Profile.jsx` → Profile tab → username section | Body: `{ username }`; 409 if taken |
| PATCH | `/api/auth/me/password` | `pages/Profile.jsx` → Security tab | Body: `{ currentPassword, newPassword }`; live requirements checklist on frontend |
| POST | `/api/auth/logout` | `context/AuthContext.jsx` → `logout()` | Sends refreshToken in body |
| POST | `/api/auth/logout-all` | `pages/Profile.jsx` → Security tab → danger zone | Revokes all sessions |
| DELETE | `/api/auth/me` | `pages/Profile.jsx` → Security tab → danger zone → Delete account | Body: `{ password }`; modal requires typing username + password; 30-day grace period before hard delete; sends deletion email |
| POST | `/api/auth/me/restore` | `pages/Profile.jsx` → Security tab → pending deletion banner | Cancels scheduled deletion; also triggered automatically on login during grace period |
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
| GET | `/api/notes/shared` | `pages/notes/NotesList.jsx` → "Shared with me" tab (supports `?search=`) | View notes shared with you |
| POST | `/api/notes/import` | `pages/notes/NotesList.jsx` → Import modal → Google Drive tab | Requires Google account linked |
| POST | `/api/notes/upload` | `pages/notes/NotesList.jsx` → Import modal → Upload PDF tab | multipart/form-data; field: `file`; optional: `title`, `type`, `tags` |
| GET | `/api/notes/:id/pdf` | `pages/notes/NoteDetail.jsx` → PDF button (visible when `note.pdfUrl` exists) | Returns 10-min signed Cloudinary URL |
| PUT | `/api/notes/:id/refresh` | Not yet exposed in UI | |
| PUT | `/api/notes/:id/share` | Not yet exposed in UI | Share a note with another user |
| POST | `/api/notes/:id/flashcards/generate` | `pages/notes/NoteDetail.jsx` → Generate Flashcards button | Accessible to owner and shared users; set owned by requester |

---

## Comments — `/api/comments`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/comments` | `pages/notes/NoteDetail.jsx`; `pages/flashcards/FlashcardSetDetail.jsx`; `components/tasks/TaskDetailModal.jsx` | Body: `{ targetType, targetId, content }` |
| GET | `/api/comments/:targetType/:targetId` | `pages/notes/NoteDetail.jsx`; `pages/flashcards/FlashcardSetDetail.jsx`; `components/tasks/TaskDetailModal.jsx` | Fetched as `/comments/note/:id`, `/comments/flashcardSet/:id`, or `/comments/task/:id` |
| DELETE | `/api/comments/:id` | `pages/notes/NoteDetail.jsx`; `pages/flashcards/FlashcardSetDetail.jsx`; `components/tasks/TaskDetailModal.jsx` | Owner-only soft delete |
| POST | `/api/comments/:id/like` | `pages/notes/NoteDetail.jsx`; `pages/flashcards/FlashcardSetDetail.jsx`; `components/tasks/TaskDetailModal.jsx` | Toggle like |

---

## Flashcard Sets — `/api/flashcard-sets`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/flashcard-sets` | `pages/flashcards/FlashcardSets.jsx` | List all sets; supports `?search=` for title filter |
| POST | `/api/flashcard-sets` | `pages/flashcards/FlashcardSets.jsx` → create modal | |
| GET | `/api/flashcard-sets/:id` | `pages/flashcards/FlashcardSetDetail.jsx` | Cards array included |
| PATCH | `/api/flashcard-sets/:id` | `pages/flashcards/FlashcardSetDetail.jsx` → inline title edit (owner-only) | Body: `{ title?, description? }` |
| DELETE | `/api/flashcard-sets/:id` | `pages/flashcards/FlashcardSets.jsx` → delete button | |
| POST | `/api/flashcard-sets/generate` | No frontend trigger (backend-only endpoint) | Body: `{ content, title }` |
| POST | `/api/flashcard-sets/:id/cards` | `pages/flashcards/FlashcardSetDetail.jsx` → Add card modal | Body: `{ front, back }` |
| DELETE | `/api/flashcard-sets/:setId/cards/:cardId` | `pages/flashcards/FlashcardSetDetail.jsx` → card delete | |
| PUT | `/api/flashcard-sets/:setId/cards/:cardId` | `pages/flashcards/FlashcardSetDetail.jsx` → edit card modal | Edit card text |
| PUT | `/api/flashcard-sets/:setId/cards/:cardId/progress` | `pages/flashcards/StudyMode.jsx` | Track study progress |
| PATCH | `/api/flashcard-sets/:id/share` | Not yet exposed in UI | Share a set |
| GET | `/api/flashcard-sets/shared` | Not yet exposed in UI | View shared sets |
| POST | `/api/flashcard-sets/:id/duplicate` | `pages/flashcards/FlashcardSetDetail.jsx` → "Save a copy" button (shown for non-owners) | Creates a copy owned by the requesting user |

---

## Tasks — `/api/tasks`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/tasks` | `pages/tasks/Tasks.jsx` | Kanban board. Uses `useInfiniteQuery` with `limit: 100` per page and auto-chain (`useEffect` calls `fetchNextPage` until `hasNextPage` is false). `isLoading = ownLoading \|\| hasNextPage` holds the skeleton until ALL pages are fetched — board renders all-at-once like Jira, never partially. Supports `?search=`. |
| POST | `/api/tasks` | `pages/tasks/Tasks.jsx` → New task modal | |
| GET | `/api/tasks/:id` | Not needed (list used) | |
| PUT | `/api/tasks/:id` | `pages/tasks/Tasks.jsx` → status dropdown | Full update including status change |
| PATCH | `/api/tasks/:id/status` | Available but not used directly | Status-only update (use `PUT` instead) |
| DELETE | `/api/tasks/:id` | `pages/tasks/Tasks.jsx` → card delete | |
| PATCH | `/api/tasks/:id/participant-status` | `pages/tasks/Tasks.jsx` → "Shared with me" tab → status dropdown on task card | Updates the current user's own participant status entry |
| GET | `/api/tasks/shared` | `pages/tasks/Tasks.jsx` → "Shared with me" tab (supports `?search=`); `pages/UserProfile.jsx` → Shared Tasks section (friend-gated, links to `/tasks` with `state: { openTaskId }` to open task detail modal) | Tasks shared with you |

---

## Calendar — `/api/calendar`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/calendar` | `pages/Calendar.jsx` | Supports `from`, `to`, `view` query params. Month and week views share a single `selected` state in the parent component — clicking a day in either view updates the right sidebar (not an inline expansion panel). Overdue section is a fixed-height (260px) scrollable container. |

---

## Friends — `/api/friends`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/friends` | `pages/friends/Friends.jsx` → Friends tab (supports `?search=` for accepted friends by name) | Returns `{ friendships }` of accepted |
| GET | `/api/friends?status=pending` | `pages/friends/Friends.jsx` → Requests tab | Returns `{ friendships }` of pending |
| POST | `/api/friends/request` | `pages/friends/Friends.jsx` → Find tab → Add button | Body: `{ recipientId }` (user `_id` from search) |
| PUT | `/api/friends/request/:id` | `pages/friends/Friends.jsx` → Requests tab | Body: `{ action: 'accept' \| 'reject' }` |
| DELETE | `/api/friends/:id` | `pages/friends/Friends.jsx` → Friends tab → Remove | Removes accepted friendship |

---

## Users — `/api/users`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/users/search` | `pages/friends/Friends.jsx` → Find tab | Query param `q`; results shown as cards with Add button |
| GET | `/api/users/:id` | Throughout app — clickable user avatars/names | Returns public profile: `{ _id, username, firstName, lastName, avatarUrl, bio, createdAt }`. No email, tokens, or settings. JWT required. |

---

## Conversations & Messages — `/api/conversations`, `/api/messages`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/conversations` | `pages/messages/Messages.jsx` (supports `?search=` by participant name) | List of conversations |
| POST | `/api/conversations` | `pages/friends/Friends.jsx` → Message button | Body: `{ participantId: friendId }` |
| DELETE | `/api/conversations/:id` | `pages/messages/Conversation.jsx` header trash icon + `pages/messages/Messages.jsx` hover trash | Instagram-style: hidden for current user only |
| GET | `/api/conversations/:id/messages` | `pages/messages/Conversation.jsx` (supports `?search=` by content; polling disabled while searching) | Socket-driven (`new_message` event invalidates cache instantly — no polling) |
| POST | `/api/conversations/:id/messages` | `pages/messages/Conversation.jsx` → send input | Body: `{ content }` |
| DELETE | `/api/messages/:id` | `pages/messages/Conversation.jsx` hover trash on bubble | Instagram-style: hidden for current user only |
| PUT | `/api/messages/:id/read` | Auto-mark read on Conversation mount | |

---

## Applications — `/api/applications`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/applications` | `pages/applications/ApplicationsList.jsx` | Pipeline (kanban) + list view |
| POST | `/api/applications` | `pages/applications/ApplicationsList.jsx` → Add modal | |
| PUT | `/api/applications/:id` | `pages/applications/ApplicationDetail.jsx` → Edit | Stage, notes, role, company, etc. |
| DELETE | `/api/applications/:id` | `pages/applications/ApplicationDetail.jsx` → delete | Soft delete |
| GET | `/api/applications/dashboard` | `pages/Dashboard.jsx` — pipeline pills (Draft/Applied/Interview/Offer/Rejected/Withdrawn counts) + total count badge in Applications section header | Aggregate returns `{ total, pipeline }`. **Note:** `aggregate()` does not auto-cast types — `userId` must be explicitly cast via `new mongoose.Types.ObjectId(req.user._id.toString())` or the match returns 0 results even when documents exist. |
| POST | `/api/applications/:id/contacts` | Not yet exposed in UI | Add a contact to an application |
| POST | `/api/applications/:id/reminders` | Not yet exposed in UI | Set a reminder |

**Note:** No single GET for applications — `ApplicationDetail.jsx` reads from router state or React Query cache passed from the list.

---

## Resumes — `/api/resumes`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| POST | `/api/resumes/upload` | `pages/resumes/Resumes.jsx` → drag & drop / upload button | multipart/form-data with `resume` (file) + `name` fields; stored as Cloudinary `authenticated` resource |
| GET | `/api/resumes` | `pages/resumes/Resumes.jsx` (supports `?search=` by fileName, version, targetRole) | Lists all uploaded resumes |
| GET | `/api/resumes/:id/download` | `pages/resumes/Resumes.jsx` → Download button | Returns 10-min signed URL via `private_download_url`; opened in new tab |
| POST | `/api/resumes/:id/feedback` | `pages/resumes/Resumes.jsx` → AI Feedback / Regenerate button | AI-generated feedback accordion; older entries browsable via history panel |
| GET | `/api/resumes/:id/feedback` | `pages/resumes/Resumes.jsx` → history panel | Returns all feedback entries; browsable in-card history |
| DELETE | `/api/resumes/:id` | Not yet exposed in UI | Soft delete resume |

---

## Activity — `/api/activity`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/activity` | `pages/Activity.jsx` (supports `?search=` on actor name + metadata fields; cursor pagination via `?cursor=` ISO timestamp) | Cursor-based infinite scroll — `useInfiniteQuery` + Load More button; each cursor page cached independently in Redis |

---

## Google — `/api/google`

| Method | Endpoint | Frontend Page | Notes |
|--------|----------|---------------|-------|
| GET | `/api/google/token` | `pages/notes/NotesList.jsx` → `openGooglePicker()` | Returns decrypted Google access token for the Picker; auto-refreshes if expired |

Note: `GET /api/google/files` was removed in the `drive.file` scope migration. `GET /api/google/docs/:docId/preview` was never implemented and is no longer planned.

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
| `PUT /api/notes/:id/refresh` | Refresh button on NoteDetail (Google Doc notes only) |
| `PUT /api/notes/:id/share` | Share note with friend button on NoteDetail |
| `POST /api/notes/:id/flashcards/generate` | "Generate flashcards" button on NoteDetail |
| `PATCH /api/flashcard-sets/:id/share` | Share set button on FlashcardSetDetail |
| `GET /api/flashcard-sets/shared` | ~~Wired~~ — `pages/flashcards/FlashcardSets.jsx` → Shared tab (supports `?search=`) |
| `PUT /api/messages/:id/read` | Auto-mark read on Conversation mount |
| `POST /api/applications/:id/contacts` | Contacts section on ApplicationDetail |
| `POST /api/applications/:id/reminders` | Reminder section on ApplicationDetail |
| `DELETE /api/resumes/:id` | Delete button on Resumes page |
| `PUT /api/notes/:id/refresh` | Refresh button on NoteDetail (Google Doc notes only — resyncs from Drive) |
