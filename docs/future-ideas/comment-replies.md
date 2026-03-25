# Spec: Comment Replies (Instagram-style)

**Status:** Not started
**Priority:** Post-launch polish
**Affects:** Backend (comments controller/routes), Frontend (NoteDetail, FlashcardSetDetail, TaskDetailModal)

---

## What exists today

Comments are flat. You can post a top-level comment on a note, flashcard set, or task. There is no way to reply to a specific comment. The `Comment` model already has a `parentId` field (`ObjectId`, default `null`) — threading infrastructure is in place but not used.

---

## What to build

### Backend

The `Comment` model already supports `parentId`. No schema changes needed.

**Update `GET /api/comments/:targetType/:targetId`** to return threaded structure:

Option A (flat with parentId populated — simpler): return all comments sorted by `createdAt` ascending, let the frontend nest them. Each comment includes `parentId`.

Option B (nested — server assembles tree): fetch all comments, build a map `{ [id]: comment }`, attach replies as `comment.replies = []`. Return top-level comments only with nested replies inline.

**Recommendation: Option A** — flat list, frontend nests. Simpler query, easier to paginate later.

No new routes needed — replies are created via the same `POST /api/comments` endpoint with a `parentId` in the body:

```
POST /api/comments
Body: { targetType, targetId, content, parentId }   ← parentId is optional
```

Update `createComment` controller to accept `parentId`:
- Validate that the referenced parent comment exists and belongs to the same `targetId` → 400 if not
- Max nesting depth: 1 (replies to replies not supported — keep it simple like Instagram)
  - If parent already has a `parentId`, reject with 400: "Cannot reply to a reply"

---

### Frontend

#### Comment thread display

For each top-level comment, show replies indented below it. Replies are filtered from the flat list by `parentId === comment._id`.

```
[Avatar] Alex Chen  ·  2h ago
  This set is perfect for exam prep.
  ❤️ 3    Reply

  └─ [Avatar] Justin  ·  1h ago
       Thanks! Glad it helped.
       ❤️ 1
```

Collapse replies behind a "View N replies" toggle if there are 3+.

#### Reply interaction

- Each top-level comment gets a **Reply** button/link below the like count
- Tapping Reply focuses the comment input and pre-fills `@username ` (visual cue only, not stored in content)
- The active `parentId` is stored in local state; cleared when the user dismisses or submits

#### Input state

```jsx
const [replyTo, setReplyTo] = useState(null); // { commentId, username }

// On Reply click:
setReplyTo({ commentId: comment._id, username: comment.userSnapshot.username });
inputRef.current.focus();

// On submit:
api.post('/comments', { targetType, targetId, content, parentId: replyTo?.commentId });
setReplyTo(null);
```

Show a small banner above the input when replying: `Replying to @username  ×`

#### Affected pages

| Page | Comment section location |
|------|--------------------------|
| `NoteDetail.jsx` | Comment section at bottom |
| `FlashcardSetDetail.jsx` | Comment section at bottom |
| `TaskDetailModal.jsx` | Comment section in modal |

All three use the same comment rendering pattern — build a shared `CommentThread` component to avoid triplicate logic.

---

## UX rules (Instagram parity)

- **Depth limit: 1** — you can reply to a comment but not to a reply. No infinite nesting.
- **No edit** — comments and replies are immutable after posting (same as current behavior)
- **Delete works the same** — replies can be deleted the same way as top-level comments; when a parent is deleted, its replies remain (orphaned) or collapse — show "[Comment deleted]" placeholder
- **Likes work the same** — replies support likes identically to top-level comments

---

## Testing

### Jest — add to `comments.test.js` (new file or extend existing)

```
POST /api/comments with parentId → 201, reply linked to parent
POST /api/comments with parentId that belongs to a different target → 400
POST /api/comments replying to a reply → 400 (max depth 1)
GET /api/comments/:targetType/:targetId → flat list includes replies with parentId populated
```

---

## Notes

- `parentId` is already on the model — no migration needed
- Notification hook: when someone replies to your comment, they should ideally trigger a notification. Defer to `notifications-spec.md`.
- The `@username` prefix in content is cosmetic — do not parse or store it as a mention. Mentions are a separate future feature.
