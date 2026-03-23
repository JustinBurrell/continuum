# Shared Flashcard Sets Bug — Fix Spec

## Problem

FlashcardSets use the same `visibility` / `sharedWith` model as notes. When a flashcard set is shared with a user, they can view the set and study it (progress tracking is per-user via `userProgress` on each card). However, they cannot:

- View or post comments on the set
- Generate a new AI flashcard set from the same source content (separate from the shared set)

---

## How FlashcardSet Sharing Works (context)

- `visibility`: `'private' | 'friends' | 'specific'`
- `sharedWith`: array of User ObjectIds (used when visibility is `'specific'`)
- `getSetById` already performs a three-tier access check: owner → sharedWith → friends visibility + friendship query
- Per-card study progress is tracked in a `userProgress` array — each user maintains their own progress entry, so studying as a shared user already works correctly
- `updateProgress` allows any participant to update their own progress entry

---

## Root Causes

### 1. `comments.controller.js` — `getComments` returns 403 for shared users

Same root cause as in `shared-notes-bug.md`: the `flashcardSet` branch checks `set.visibility === 'public'`, but `'public'` is not a valid enum value. `isPublic` is always `false`, so any non-owner is rejected.

**Fix:** Replace the broken `isPublic` check with the three-tier guard (owner → sharedWith → friends visibility + friendship query), mirroring the logic already in `getSetById`.

Apply the same fix to `addComment` if no access guard exists there for flashcard set targets.

### 2. `comments.controller.js` — `addComment` lacks access guard for flashcard set targets

Comments can be posted without verifying the user has access to the target flashcard set. Either the check is missing entirely (any authenticated user can comment) or it mirrors the broken `isPublic` pattern and blocks shared users.

**Fix:** Add the three-tier access check in `addComment` before inserting the comment.

### 3. No "generate my own flashcards" path from a shared set

There is no endpoint that takes a `flashcardSetId` as a source and generates a new set owned by the requesting user. The existing `POST /api/flashcard-sets/generate` takes raw content — not a set ID. A shared user who wants their own copy of the set has no way to do this.

**Fix (new endpoint):** `POST /api/flashcard-sets/:id/duplicate` — access-guarded (owner or shared user), creates a new FlashcardSet owned by `req.user._id` with the same cards. Does not copy progress. The original set is unaffected.

Alternatively, this can be deferred and addressed as a separate feature rather than a bug fix.

---

## Changes Required

### Backend

#### `backend/controllers/comments.controller.js`

- `getComments` (`targetType === 'flashcardSet'` branch): replace `isPublic` check with three-tier guard (owner → sharedWith → friends + friendship query)
- `addComment`: add three-tier access check for `targetType === 'flashcardSet'` before inserting

#### `backend/controllers/flashcardSets.controller.js` *(optional — duplicate feature)*

- `duplicateSet` (new): access-guarded copy endpoint at `POST /api/flashcard-sets/:id/duplicate`
  - Verifies access via three-tier check
  - Creates new FlashcardSet with `userId = req.user._id`, same cards array, `isAIGenerated = false` (or carry over original flag), clears per-card `userProgress`

#### `backend/routes/flashcardSets.routes.js` *(if adding duplicate)*

- Add `POST /:id/duplicate → duplicateSet`

### Frontend

#### Flashcard set detail page

- Ensure comments section renders for shared users (not gated behind ownership)
- If duplicate endpoint is added: show a "Save a copy" button for shared users in place of Edit/Delete

---

## Access Model

| Action | Owner | Shared User | No access |
|---|---|---|---|
| View set and cards | ✓ | ✓ | ✗ |
| Edit / Delete set | ✓ | ✗ | ✗ |
| Study (track own progress) | ✓ | ✓ | ✗ |
| View comments | ✓ | ✓ | ✗ |
| Post comment / reply / like | ✓ | ✓ | ✗ |
| Duplicate set (own copy) | ✓ | ✓ *(new)* | ✗ |

---

## Files to Change

| File | Change |
|---|---|
| `backend/controllers/comments.controller.js` | Fix `getComments` and `addComment` flashcardSet branch access checks |
| `backend/controllers/flashcardSets.controller.js` | Add `duplicateSet` controller *(optional)* |
| `backend/routes/flashcardSets.routes.js` | Register `POST /:id/duplicate` *(optional)* |
| Frontend flashcard set detail page | Show comments for shared users; show "Save a copy" button *(optional)* |

---

## Out of Scope

- Shared users editing or deleting cards — intentionally blocked.
- Generating AI flashcards directly from the shared set's source document — the original source (note, PDF) is a separate resource with its own access control.
