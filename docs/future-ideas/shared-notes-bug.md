# Shared Content Bug — Fix Spec

## Problem

When a note is shared with a user, the recipient cannot:
- View comments on the note
- Post comments, replies, or likes
- Generate their own AI flashcards from the note
- Generate their own AI summary of the note

The recipient should be able to do all of the above as if it were their own content. The only distinction is that the original creator's name should be visible and clickable (links to their profile).

---

## Root Causes

### 1. `comments.controller.js` — `getComments` returns 403 for shared users

The access check references `note.visibility === 'public'`, but `'public'` is not a valid value in the Note schema enum (`['private', 'friends', 'specific']`). This means `isPublic` is always `false`, and the controller never falls through to check friendship — it immediately returns 403 for any non-owner.

**Fix:** Mirror the access logic from `getNoteById` in `notes.controller.js`:
- Allow if owner
- Allow if in `sharedWith`
- If `visibility === 'friends'`, verify an accepted friendship exists before allowing

Apply the same fix for `flashcardSet` and `task` target types in the same controller.

---

### 2. `notes.controller.js` — `generateFlashcardsFromNote` is owner-only

The controller blocks non-owners from generating flashcards. When a shared user generates flashcards, the resulting `FlashcardSet` should be owned by the requesting user — not the note owner. The `hasFlashcards` flag on the note document should not be updated in this case.

**Fix:** Add the same three-tier access check (owner / sharedWith / friends+friendship). If the requester is not the owner, generate the flashcard set owned by `req.user._id` and skip updating `note.hasFlashcards`.

---

### 3. `notes.controller.js` — `generateSummary` is owner-only

The summary is stored on the note document itself (`note.summary`). Allowing shared users to write to this field would overwrite the owner's summary, which is incorrect.

**Fix:** Add the three-tier access check. If the requester is not the owner, generate and return the summary in the response but do not persist it to the note document.

---

## Changes Required

### Backend

#### `backend/controllers/comments.controller.js`

- `getComments`: Replace the broken `isPublic` check with a full three-tier access guard (owner → sharedWith → friends visibility + friendship query). Apply to all three `targetType` branches (`note`, `flashcardSet`, `task`).
- `addComment`: Add the same access guard before allowing comment creation. Currently there is no access check on the target before inserting the comment.

#### `backend/controllers/notes.controller.js`

- `generateFlashcardsFromNote`:
  - Add three-tier access check.
  - If requester is not the owner: create FlashcardSet with `userId = req.user._id`, skip updating `note.hasFlashcards`.
- `generateSummary`:
  - Add three-tier access check.
  - If requester is not the owner: generate and return the summary but do not write it to the note document.

#### `backend/controllers/flashcardSets.controller.js`

- Review `getSetById` for the same `isPublic` visibility bug and apply the same fix if present.

---

### Frontend

#### `web/src/pages/notes/NoteDetail.jsx`

- **Creator attribution:** When the viewing user is not the owner, display the note creator's name (from `note.userId` — ensure the `getNoteById` response populates `firstName`, `lastName`, `username`) above the note title or in the metadata row. The name should link to `/profile/:userId`.
- **Comments section:** Remove any owner-only gate on rendering the comments section. Any user who can view the note should see comments and be able to post, reply, and like.
- **Generate Flashcards button:** Currently gated behind ownership check. Show to all users who have access to the note. The endpoint will handle creating a flashcard set owned by the viewer.
- **Generate AI Summary button:** Show to all users who have access. The response will include the summary text but the owner's stored summary will not be overwritten.
- **Preserve owner-only actions:** Edit, Delete, and Share buttons remain owner-only.

---

## Access Model Reference

| Action | Owner | Shared User (specific) | Friend (friends visibility) | No access |
|---|---|---|---|---|
| View note | ✓ | ✓ | ✓ | ✗ |
| Edit / Delete / Share | ✓ | ✗ | ✗ | ✗ |
| View comments | ✓ | ✓ | ✓ | ✗ |
| Post comment / reply / like | ✓ | ✓ | ✓ | ✗ |
| Generate flashcards (owned by viewer) | ✓ | ✓ | ✓ | ✗ |
| Generate AI summary (not persisted) | ✓ | ✓ | ✓ | ✗ |
| Update note summary on document | ✓ | ✗ | ✗ | ✗ |

---

## Files to Change

| File | Change |
|---|---|
| `backend/controllers/comments.controller.js` | Fix `getComments` access check; add access guard to `addComment` |
| `backend/controllers/notes.controller.js` | Fix `generateFlashcardsFromNote` and `generateSummary` access checks |
| `backend/controllers/flashcardSets.controller.js` | Audit and fix same `isPublic` bug if present |
| `web/src/pages/notes/NoteDetail.jsx` | Show creator info; expose flashcard/summary generation to shared users |

---

## Out of Scope

- Shared tasks: tasks use a different sharing model (participants). Not addressed here.
- Shared flashcard sets: same bugs likely exist but are tracked separately.
- Notifications when a shared user comments.
