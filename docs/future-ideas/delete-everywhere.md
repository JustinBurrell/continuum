# Spec: Delete Everywhere

**Status:** Not started
**Priority:** Pre-launch
**Affects:** Backend (applications, messages), Frontend (tasks, applications, flashcard sets, messages)

---

## What exists today

| Item | Backend DELETE | Frontend button |
|------|---------------|-----------------|
| Individual flashcard | ✅ `DELETE /api/flashcard-sets/:id/cards/:cardId` | ✅ |
| Note | ✅ `DELETE /api/notes/:id` | ✅ |
| Resume | ✅ `DELETE /api/resumes/:id` | ✅ |
| Flashcard set | ✅ `DELETE /api/flashcard-sets/:id` | ❌ |
| Task | ✅ `DELETE /api/tasks/:id` | ❌ |
| Application | ❌ Not implemented | ❌ |
| Message | ❌ Not implemented | ❌ |

---

## What to build

### 1. Flashcard Set — frontend only

Backend is already implemented. Just needs a delete button in the FlashcardSetDetail or FlashcardSets list.

**Frontend:**
- Add a delete button (trash icon) in `FlashcardSetDetail.jsx` header, owner-only
- Trigger a `ConfirmModal` ("Delete this set? This will also delete all cards inside it.")
- On confirm: call `DELETE /api/flashcard-sets/:id`
- On success: navigate back to `/flashcards` + invalidate `['flashcard-sets']`

---

### 2. Task — frontend only

Backend is already implemented (`DELETE /api/tasks/:id`, owner-only). Just needs a UI entry point.

**Frontend:**
- Add a delete option in `TaskDetailModal.jsx`, owner-only (not shown to participants)
- Trigger a `ConfirmModal` ("Delete this task? This will remove it for all participants.")
- On confirm: call `DELETE /api/tasks/:id`
- On success: close modal + invalidate `['tasks']` + invalidate `['shared-tasks']`

---

### 3. Application — backend + frontend

**Backend — new route + controller method:**

```
DELETE /api/applications/:id
```

- Protected route (JWT required)
- Only the owner can delete (`application.userId.toString() !== req.user._id.toString()` → 403)
- Hard delete (applications are personal, no sharing, no need for soft delete)
- Return `{ success: true, message: 'Application deleted' }`

Add to `backend/routes/applications.routes.js`:
```js
router.delete('/:id', applicationsController.deleteApplication);
```

Add to `backend/controllers/applications.controller.js`:
```js
exports.deleteApplication = async (req, res) => {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    if (app.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    await Application.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Application deleted' });
};
```

**Frontend:**
- Add a delete button in `ApplicationDetail.jsx`
- Trigger a `ConfirmModal` ("Delete this application? This cannot be undone.")
- On confirm: call `DELETE /api/applications/:id`
- On success: navigate to `/applications` + invalidate `['applications']`

---

### 4. Message — Instagram-style soft delete

Instagram's pattern: when you delete a message, it disappears for you but the other person still sees it. It's per-user, not per-message.

**Backend:**

Add a `deletedFor` array to the `Message` model — an array of user IDs who have deleted this message for themselves:

```js
// models/Message.js — add field
deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
```

New endpoint:
```
DELETE /api/messages/:id
```

- Protected route
- Verify the requesting user is a participant in the conversation this message belongs to → 403 if not
- Push `req.user._id` into `message.deletedFor` (don't delete the document)
- Return `{ success: true }`

When fetching messages (`GET /api/conversations/:id/messages`), add a filter:
```js
// Already in messages controller — add to the query:
Message.find({ conversationId, deletedFor: { $ne: req.user._id } })
```

This way the message naturally disappears from your view but the other person's query is unaffected.

**Frontend:**
- Long-press (mobile) or hover menu (web) on a message bubble → "Delete for me"
- Only show on messages the current user sent OR received (all messages in the conversation)
- On confirm: call `DELETE /api/messages/:id`
- On success: remove message from local React Query cache optimistically
- No confirmation modal needed (low stakes, consistent with Instagram UX)

**No "Delete for everyone" scope** — that's a separate feature. For now, delete is always "for me only."

---

## Testing

### Jest — add to existing suites

**`tests/jest/applications.test.js`** — add after implementing the backend:
```js
describe('DELETE /api/applications/:id', () => {
  it('deletes an application', async () => { ... });
  it('returns 403 when another user tries to delete', async () => { ... });
});
```

**`tests/jest/messages.test.js`** — add after implementing the backend:
```js
describe('DELETE /api/messages/:id', () => {
  it('soft-deletes a message for the sender only', async () => {
    // send message as alice, delete as alice, verify alice can't see it,
    // verify bob still sees it
  });
});
```

Frontend delete buttons for flashcard sets and tasks don't need new backend tests — the backend is already covered by the existing suites.

### Postman — update `continuum-session10.postman_collection.json`

Add requests:
- `DELETE /api/applications/:id` — expects `200`, run after "Create Application"
- `DELETE /api/messages/:id` — expects `200`, run after "Send Message"; follow up with "Get Messages" and verify deleted message is absent for sender but present for recipient (requires two tokens)

### Postman — update `README.md`

Add rows to the Applications and Messages tables:

**Applications table:**
```
| Delete Application | none | `200` *(run last in this folder)* | |
```

**Messages table:**
```
| Delete Message (for me) | none | `200` — message removed from sender's view, still visible to recipient | |
```

### Postman — update `continuum-local.postman_environment.json`

Add variable:
```json
{ "key": "messageId", "value": "", "enabled": true }
```

Set it via test script on "Send Message":
```js
pm.environment.set("messageId", pm.response.json().message._id);
```
