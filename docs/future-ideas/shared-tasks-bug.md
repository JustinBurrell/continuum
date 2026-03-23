# Shared Tasks Bug — Fix Spec

## Problem

Tasks use a `participants` model (not `visibility`/`sharedWith` like notes). When a task is shared with a participant, they can view the task and update their own participant status — but they cannot view or post comments on the task.

---

## How Task Sharing Works (context)

- A task has `isShared: Boolean` and `participants: [{ userId, status, completedAt }]`
- Only the task owner can create, update, delete, or change participants
- Participants can call `PATCH /api/tasks/:id/participant-status` to update their own progress
- Access to `GET /api/tasks/:id` checks: owner OR participant

There are no AI features (flashcard generation, summaries) on tasks, so the only fix needed is comments access.

---

## Root Cause

### `comments.controller.js` — `getComments` and `addComment` do not recognize task participants

The comments controller has a branch for `targetType === 'task'`, but it likely checks task ownership only (matching the notes pattern where the `isPublic` bug causes non-owners to be rejected). Participants who are not the owner receive a `403 Forbidden`.

The same issue applies to `addComment` — if there is no access guard that checks participants, the endpoint either blocks participants (403) or allows any authenticated user (no check at all).

**Fix:** In the `task` branch of both `getComments` and `addComment`, check:

1. Is the user the task owner?
2. Is the user in `task.participants` array (by `userId`)?

If neither, return 403.

---

## Changes Required

### Backend

#### `backend/controllers/comments.controller.js`

- `getComments` (`targetType === 'task'` branch): checks owner OR participant — **already correct; implemented as part of shared-flashcard-sets-bug fix**
- `addComment` task branch: checks owner OR participant before inserting — **already correct; implemented as part of shared-flashcard-sets-bug fix**

### Frontend

#### `web/src/components/tasks/TaskDetailModal.jsx`

- Task detail is a modal (not a separate page) — `TaskDetailModal.jsx`
- Added comments section (post, like, delete) visible to all users with access (owner + participants) — **implemented**
- Task creator attribution (`task.userId`) was already visible — no change needed

---

## Access Model


| Action                          | Owner | Participant | Non-participant |
| ------------------------------- | ----- | ----------- | --------------- |
| View task                       | ✓     | ✓           | ✗               |
| Edit task / change participants | ✓     | ✗           | ✗               |
| Update own participant status   | ✓     | ✓           | ✗               |
| View comments                   | ✓     | ✓           | ✗               |
| Post comment / reply / like     | ✓     | ✓           | ✗               |


---

## Files to Change


| File                                         | Change                                                               |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `backend/controllers/comments.controller.js` | Fix `getComments` and `addComment` task branch to check participants |
| `web/src/pages/tasks/` (detail page)         | Ensure comments section renders for participants                     |


---

## Out of Scope

- Participants cannot edit or delete the task itself — this is intentional and correct.
- Task visibility is not publicly settable (no `visibility` field on Task) — this is correct.

