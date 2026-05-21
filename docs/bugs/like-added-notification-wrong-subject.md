# BUG: `like_added` Notification Has Incorrect Subject

**Affects:** Web + Android (display) + Backend (notification creation) + Seed data  
**Priority:** Fix before FCM push notifications and email notifications are implemented

---

## Summary

When someone likes a comment on a note or flashcard set, the recipient gets a notification that reads:

> "Alex liked your comment"

This is wrong. The comment being liked is not necessarily the recipient's comment — it is a comment left on content the recipient **owns** (their note or flashcard set). The correct phrasing, matching how Instagram, Twitter/X, and LinkedIn handle it, is:

> "Alex liked a comment on your note"  
> or  
> "Alex liked a comment on your flashcard set"

---

## Why It Happens

The `like_added` notification is sent to `comment.userId` — the author of the comment that was liked. That person wrote the comment, so the notification subject "your comment" is technically accurate for them. However, the notification is also delivered to the note/flashcard **owner** in some flows, where "your comment" is misleading.

More importantly, even when the comment author receives it, the social context on mobile and web is missing. Apps like Instagram say **"liked your comment on [content title]"** so the user immediately knows which post and which comment is involved without having to open anything.

---

## Current Backend Behavior

**File:** `backend/controllers/comments.controller.js` — `toggleCommentLike`

```javascript
notify({
    recipientId: commentAuthorId,
    actorId: userId,
    type: 'like_added',
    targetId: comment._id,          // the liked comment's ID
    targetType: 'comment',
    message: `${req.user.firstName} liked your comment`,
    metadata: {
        commentPreview: comment.content?.slice(0, 120),
        commentId: comment._id.toString(),
        resourceId: comment.targetId?.toString(),   // note/flashcard set ID
        resourceType: comment.targetType,           // "note" | "flashcardSet" | "task"
    },
    debounceMinutes: 2,
});
```

The `message` field is the string shown directly in the notification bell and on the notifications screen.

---

## Required Changes

### 1. Backend — `comments.controller.js`

Update the `message` to reference the content type, not just "your comment":

```javascript
// Resolve resource title for richer context (optional but recommended)
const resourceLabel = comment.targetType === 'note'
    ? 'note'
    : comment.targetType === 'flashcardSet'
        ? 'flashcard set'
        : comment.targetType;

message: `${req.user.firstName} liked a comment on your ${resourceLabel}`,
```

If the content title is available at this point (it can be fetched via a lean query), include it:

```javascript
// Example with title lookup:
message: `${req.user.firstName} liked a comment on your note "${noteTitle}"`,
```

Keep the `metadata.commentPreview` so both web and Android can show the exact comment text in italic below the message.

### 2. Web — `NotificationBell.jsx` and `Notifications.jsx`

No code change needed if the fix is made at the `message` field level in the backend — the web just renders `notif.message`. The `commentPreview` in metadata is already shown in italic below, which provides the comment context.

If a richer display is wanted (e.g., showing the note title separately), update the `NotifItem` component to read `metadata.resourceTitle` if added to the backend.

### 3. Android — `NotificationsScreen.kt`

Same as web — `notification.message` is rendered directly. No code change needed if the backend fix is applied.

### 4. Seed Data — `seed-justin.js` and `seed-jane.js`

Update all `like_added` notification entries to use the corrected message text:

```javascript
// seed-justin.js
message: 'Marcus liked a comment on your note',
// (or 'Marcus liked a comment on your flashcard set' depending on targetType)
```

Verify the `metadata` on each entry already has `commentPreview`, `commentId`, `resourceId`, `resourceType` — this was added in the NOTIF-2 branch and should be present.

---

## Recommended Final Message Format

| Content type | Message |
|---|---|
| Note | `"{Actor} liked a comment on your note"` |
| Flashcard set | `"{Actor} liked a comment on your flashcard set"` |
| Task | `"{Actor} liked a comment on your task"` |

With `metadata.commentPreview` shown in italic below, the full notification reads:

> **Alex Chen** liked a comment on your note  
> *"Great explanation of memoization — this helped me a lot"*  
> 2 hours ago

This matches the pattern used by Instagram ("liked your comment on [post]"), Twitter/X ("liked your reply"), and LinkedIn ("reacted to your comment on [post]").

---

## Why This Must Be Fixed Before FCM / Email

Push notifications and emails send the `message` field directly as the notification body. Once a push notification is delivered to a device, it cannot be recalled or corrected. If the wrong message goes out at scale, users get permanently incorrect notifications in their OS notification tray and email inbox. Fixing the message source (backend `notify()` call) before FCM/email are wired up ensures correctness from day one across all delivery channels.

---

## Files to Change

| File | Change |
|---|---|
| `backend/controllers/comments.controller.js` | Update `message` in `toggleCommentLike` notify call |
| `backend/scripts/seed-justin.js` | Update `like_added` notification `message` strings |
| `backend/scripts/seed-jane.js` | Update `like_added` notification `message` strings |
| Web / Android | No code change needed (they render `message` directly) |

---

*Filed: 2026-05-21*
