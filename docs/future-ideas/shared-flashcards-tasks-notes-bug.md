# Fix: Sharing System for Notes, Flashcard Sets, and Tasks

This is the **sole source of truth** for this fix. Read this file top to bottom and implement every section. Do not skip steps. Verify end-to-end before committing.

---

## Problem Summary

Sharing is broken or incomplete across all three content types:

1. **Flashcard Sets**: clicking "Share" throws a 400 error because the frontend sends `{ isShared: boolean }` but the backend expects `{ visibility, sharedWith }`.
2. **Notes**: sharing only offers "friends" (all friends) or "private" — there is no UI to pick specific friends.
3. **Tasks**: sharing via `isShared` + `participants` needs verification that it works end-to-end, including the "Shared with me" tab.
4. **Missing features across all three**: no auto-message to the friend on share, no way to unshare, collaborator names are not clickable, activity feed is not consistently created.

---

## Current State (What Exists)

### Backend Models

| Model | Sharing Fields | File |
|-------|---------------|------|
| **Note** | `visibility: 'private' \| 'friends' \| 'specific'`, `sharedWith: [ObjectId]` | `backend/models/Note.js` (lines 94-103) |
| **FlashcardSet** | `visibility: 'private' \| 'friends' \| 'specific'`, `sharedWith: [ObjectId]` | `backend/models/FlashcardSet.js` (lines 65-73) |
| **Task** | `isShared: Boolean`, `participants: [{ userId, status, completedAt }]` | `backend/models/Task.js` (lines 122-140) |

### Backend Endpoints

| Method | Endpoint | Controller | What It Does |
|--------|----------|------------|--------------|
| `PUT` | `/api/notes/:id/share` | `notes.controller.js:496-570` | Updates visibility + sharedWith, creates `note_shared` activity |
| `GET` | `/api/notes/shared` | `notes.controller.js:579-606` | Lists notes shared with the current user |
| `PATCH` | `/api/flashcard-sets/:id/share` | `flashcardSets.controller.js:286-361` | Updates visibility + sharedWith, creates `flashcard_shared` activity |
| `GET` | `/api/flashcard-sets/shared` | `flashcardSets.controller.js:371-397` | Lists sets shared with the current user |
| `GET` | `/api/tasks/shared` | `tasks.controller.js:224-233` | Lists tasks where user is a participant |
| `PATCH` | `/api/tasks/:id/participants` | `tasks.controller.js:240-272` | Participant updates their own status |

### Frontend Pages

| Page | File | Sharing UI | Shared Tab |
|------|------|-----------|------------|
| Notes | `web/src/pages/notes/NoteDetail.jsx` (lines 479-523) | Dropdown: private / friends only (no specific picker) | `NotesList.jsx` — "Shared with me" tab calls `GET /notes/shared` |
| Flashcard Sets | `web/src/pages/flashcards/FlashcardSetDetail.jsx` (lines 141-166) | **BROKEN** — sends `{ isShared: bool }` instead of `{ visibility, sharedWith }` | `FlashcardSets.jsx` — "Shared with me" tab calls `GET /flashcard-sets/shared` |
| Tasks | `web/src/pages/tasks/Tasks.jsx` (lines 188-196) | Checkbox for `isShared` at creation time | `Tasks.jsx` — "Shared with me" tab calls `GET /tasks/shared` |

### Other Relevant Files

| File | Purpose |
|------|---------|
| `backend/services/activity.service.js` | Creates activity feed entries on share events |
| `backend/controllers/conversations.controller.js` | Conversation + message creation (needed for auto-message on share) |
| `backend/models/Conversation.js` | `participants: [ObjectId]`, `lastMessage`, `unreadCounts` |
| `backend/models/Message.js` | `conversationId`, `senderId`, `content`, `readBy` |
| `web/src/lib/api.js` | Axios instance — all share API calls are inline in page components |
| `web/src/components/tasks/TaskDetailModal.jsx` | Task detail/edit modal (lines 56-65 for edit form) |

---

## What Needs to Change

### 1. Build a Reusable Share Modal Component

Create `web/src/components/ui/ShareModal.jsx` — a modal that:
- Fetches the user's accepted friends list (`GET /api/friends`)
- Displays friends as a checkbox list (avatar + name + username)
- Shows which friends are already selected (pre-populate from current `sharedWith` or `participants`)
- Has three visibility options:
  - **Private** — not shared with anyone (sets `visibility: 'private'`, clears `sharedWith`)
  - **All Friends** — sets `visibility: 'friends'`
  - **Specific Friends** — shows the friend picker, sets `visibility: 'specific'` + populates `sharedWith` with selected IDs
- Has a "Save" button that calls the appropriate API endpoint
- **Unsharing is per-friend, not all-or-nothing**: when visibility is `specific`, users can uncheck individual friends to remove them from `sharedWith` without affecting the others. The modal should show currently shared friends as checked — unchecking a friend and saving removes only that friend. Only selecting "Private" removes everyone at once.

This modal will be reused by Notes, Flashcard Sets, and Tasks.

### 2. Fix Flashcard Set Sharing (Bug Fix)

**Frontend** (`web/src/pages/flashcards/FlashcardSetDetail.jsx`):
- Replace the broken `handleShare` function (lines 141-166) that sends `{ isShared: boolean }`
- Instead, open the new ShareModal
- On save, call `PATCH /api/flashcard-sets/:id/share` with `{ visibility, sharedWith }`
- Show current share status on the page (e.g., "Shared with 3 friends" or "Private")

**Backend** (`backend/controllers/flashcardSets.controller.js`):
- The `shareSet` function (lines 286-361) already accepts `{ visibility, sharedWith }` — verify it validates that all sharedWith IDs are accepted friends
- Verify it creates a `flashcard_shared` activity on the private → shared transition
- Verify the `getSharedSets` function (lines 371-397) correctly returns sets shared with the current user via both `visibility: 'friends'` (from accepted friends) and `visibility: 'specific'` (where user is in `sharedWith`)

### 3. Fix Note Sharing (Add Specific Friend Picker)

**Frontend** (`web/src/pages/notes/NoteDetail.jsx`):
- Replace the simple visibility dropdown (lines 479-523) with the new ShareModal
- On save, call `PUT /api/notes/:id/share` with `{ visibility, sharedWith }`

**Backend** (`backend/controllers/notes.controller.js`):
- The `shareNote` function (lines 496-570) already supports `{ visibility, sharedWith }` — verify the same things as flashcard sets above

### 4. Fix Task Sharing (Verify + Improve)

Tasks use a different sharing model (`isShared` + `participants` instead of `visibility` + `sharedWith`), so the ShareModal needs a variant mode for tasks:

**Frontend** (`web/src/pages/tasks/Tasks.jsx` and `web/src/components/tasks/TaskDetailModal.jsx`):
- In the create form: replace the bare `isShared` checkbox with a button that opens the ShareModal in "task mode"
- Task mode: instead of visibility radio buttons, just show the friend picker. Selecting friends sets `isShared: true` and populates `participants: [{ userId }]`. Selecting nobody sets `isShared: false`.
- In the edit modal (`TaskDetailModal.jsx`): add the same share button to modify participants after creation
- Make the collaborator count badge clickable — on click, show a small popover or modal listing participants with their avatar, name, and a link to their profile page (`/profile/:userId`)

**Backend** (`backend/controllers/tasks.controller.js`):
- Verify `createTask` (lines 21-82) correctly validates that all participant userIds are accepted friends
- Verify `getSharedTasks` (lines 224-233) returns tasks where the current user is in `participants`
- Add an endpoint or update the existing update endpoint to allow **adding/removing participants** after task creation (if not already supported). The update endpoint (line 138-162) should accept a `participants` array change.

### 5. Auto-Message on Share

When a user shares content with a specific friend, automatically send a message in their conversation:

**Backend** — create a helper function (in `backend/services/share.service.js` or inline in controllers):

```
async function sendShareMessage(sharerId, recipientId, contentType, contentTitle, contentId)
```

Logic:
1. Find existing conversation between the two users: `Conversation.findOne({ participants: { $all: [sharerId, recipientId] } })`
2. If no conversation exists, create one: `Conversation.create({ participants: [sharerId, recipientId], unreadCounts: [{ userId: sharerId, count: 0 }, { userId: recipientId, count: 0 }] })`
3. Create a message: `Message.create({ conversationId, senderId: sharerId, content: '📎 Shared a {contentType} with you: "{contentTitle}"' })`
4. Update conversation `lastMessage` and increment `unreadCounts` for the recipient
5. The message content should include enough info for the frontend to render a clickable link. Use a convention like: `[shared:{contentType}:{contentId}] Shared a {contentType} with you: "{contentTitle}"`

**Call this function** from:
- `notes.controller.js` `shareNote()` — for each user in `sharedWith` (when visibility is `specific`) or skip if `friends` (too many messages)
- `flashcardSets.controller.js` `shareSet()` — same logic
- `tasks.controller.js` `createTask()` and the update endpoint — for each participant

**Frontend** (`web/src/pages/messages/Conversation.jsx`):
- Detect share messages by the `[shared:...]` prefix
- Render them as a special message bubble with a clickable link to the shared content:
  - `[shared:note:{id}]` → link to `/notes/{id}`
  - `[shared:flashcardSet:{id}]` → link to `/flashcards/{id}`
  - `[shared:task:{id}]` → link to `/tasks` (or specific task view)

### 6. Activity Feed on Share

Verify that activity entries are created correctly when sharing. The activity service (`backend/services/activity.service.js`) already has logic for this. Confirm:

- `note_shared` activity is created when a note transitions from private to shared, with `visibleTo` populated correctly
- `flashcard_shared` activity is created on the same transition
- `task_created` activity is created for shared tasks
- When sharing with **specific** friends, `visibleTo` should include only those specific friends (not all friends)
- Activities have correct `metadata` (title of the shared content)

### 7. "Shared with Me" Tabs — Verify End-to-End

For each content type, verify the full flow:
1. User A shares content with User B
2. User B navigates to the "Shared with me" tab
3. The shared content appears in the list
4. User B can view the content (read-only for notes/flashcards, participatory for tasks)
5. User A unshares User B specifically (unchecks them in the friend picker and saves) → content disappears from User B's "Shared with me" tab, but remains visible to other friends who are still checked

Test files:
- `web/src/pages/notes/NotesList.jsx` — sharedTab state, React Query key, `GET /notes/shared`
- `web/src/pages/flashcards/FlashcardSets.jsx` — same pattern
- `web/src/pages/tasks/Tasks.jsx` — same pattern

---

## Postman Tests

Add tests to the **existing** collection at `backend/testing/postman/continuum-session8.postman_collection.json`. Do NOT create a new collection.

### Tests to Add

**Note Sharing:**
1. `PUT /notes/:id/share` — share with specific friends (visibility: 'specific', sharedWith: [userBId])
2. `PUT /notes/:id/share` — share with all friends (visibility: 'friends')
3. `PUT /notes/:id/share` — unshare a specific friend (visibility: 'specific', sharedWith: [] with that friend removed)
   - Also test: unshare all by setting visibility: 'private'
4. `PUT /notes/:id/share` — error: non-friend userId in sharedWith → 400
5. `GET /notes/shared` — as User B, verify shared note appears
6. `GET /notes/shared` — as User B after unshare, verify it disappears

**Flashcard Set Sharing:**
1. `PATCH /flashcard-sets/:id/share` — share with specific friends
2. `PATCH /flashcard-sets/:id/share` — unshare a specific friend (remove from sharedWith array)
3. `PATCH /flashcard-sets/:id/share` — error: invalid visibility value → 400
4. `GET /flashcard-sets/shared` — as User B, verify shared set appears

**Task Sharing:**
1. `POST /tasks` — create shared task with participants
2. `GET /tasks/shared` — as participant, verify task appears
3. `PATCH /tasks/:id` — add participant after creation
4. `PATCH /tasks/:id` — remove participant (unshare)

**Auto-Message:**
1. After sharing a note with User B, verify `GET /conversations` shows a conversation with the share message
2. Verify message content matches the expected format

Add any needed environment variables (e.g., `noteId`, `flashcardSetId`, `userBId`) to the local environment file at `backend/testing/postman/continuum-local.postman_environment.json`.

Update the testing README (`backend/testing/postman/README.md` or whichever README documents the Postman tests) with the new tests in the **same format** as existing entries.

---

## Seed Script Updates

After all changes are working, update the seed scripts to reflect the new sharing behavior:

**`backend/scripts/seed-data.js`:**
- No structural changes needed — the data already uses `visibility` and `sharedWith` correctly

**`backend/scripts/seed.js`:**
- After creating shared notes/flashcard sets, call the new `sendShareMessage` helper for `visibility: 'specific'` items (notes at indices 1, 2 which are shared with all 6 friends)
- After creating shared tasks, send share messages to participants
- Verify the seed script still runs cleanly with `--clean` and `--no-ai` flags

---

## Documentation Updates

After implementation, update these docs to reflect the changes:

| Doc | What to Update |
|-----|---------------|
| `docs/backend/api_reference_guide.md` | Update share endpoint request/response schemas, add auto-message behavior |
| `docs/backend/backend_user_flows.md` | Update sharing user flows to include specific friend selection and auto-message |
| `docs/product/product_requirements_document.md` | Mark sharing features as implemented, note the auto-message feature |
| `docs/database/mongodb_schema_explaination.md` | Update if any schema changes were made |
| `docs/database/schema_diagram.md` | Update if relationships changed |
| `docs/security/backend_security_audit.md` | Verify share endpoints still validate friendship before allowing shares |
| `docs/master_planning_doc.md` | Update feature status |

---

## Verification Checklist

Before committing, verify each item works end-to-end:

- [ ] **Note sharing**: open share modal → select specific friends → save → note appears in friends' "Shared with me" → auto-message sent → activity created → unshare works
- [ ] **Flashcard set sharing**: same flow, no more 400 error
- [ ] **Task sharing**: create with participants → task appears in participants' "Shared with me" → auto-message sent → collaborator badge is clickable → clicking shows profile link → add/remove participants after creation works
- [ ] **Unsharing individually**: unchecking a specific friend removes content from only that friend's "Shared with me" tab while keeping it shared with others
- [ ] **Unsharing all**: setting to private removes content from all "Shared with me" tabs
- [ ] **Validation**: cannot share with non-friends (400 error)
- [ ] **Seed script**: `node backend/scripts/seed.js --clean --no-ai` runs without errors
- [ ] **Postman tests**: all new tests pass

---

## Commit Names

Based on `docs/agile_workflow_guide.md` conventions, once everything works:

```
fix: resolve flashcard set sharing 400 error and align request body with backend schema
feat: add specific friend picker share modal for notes, flashcard sets, and tasks
feat: send auto-message to friends when content is shared
fix: make task collaborator count clickable with profile links
test: add postman tests for sharing endpoints and auto-message
docs: update api reference and user flows for sharing system changes
chore: update seed scripts to include share messages
```
