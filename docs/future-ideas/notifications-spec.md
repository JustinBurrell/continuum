# Notifications — Feature Spec

## Current State

- `User.settings.emailNotifications` and `User.settings.pushNotifications` exist in the schema but are not enforced anywhere in business logic (noted in the model as "MVP uses in-app notifications only")
- `Resend` is already integrated (`resend` v6.9.2 in `package.json`) and used for password reset and email verification — the infrastructure exists
- An in-app activity feed exists (`GET /api/activity`) and is the only notification mechanism today
- Auto-DMs via `sendShareMessage` in `share.service.js` notify users when something is shared with them, but only through the Messages inbox

---

## Goals

1. Notify users of social events in real time or near-real time
2. Respect per-user channel preferences (`emailNotifications`, `pushNotifications`)
3. Use **Resend** for email delivery
4. Use **Firebase Cloud Messaging (FCM)** for push notifications on mobile (iOS + Android)
5. Do not send duplicate notifications across channels for the same event

---

## Notification Events

### Social

| Event | Recipient | Trigger location |
|---|---|---|
| Someone comments on your note / flashcard set / task | Content owner | `comments.controller.js → addComment` |
| Someone replies to your comment | Comment author | `comments.controller.js → addComment` (when `parentId` is set) |
| Someone likes your comment | Comment author | `comments.controller.js → toggleLike` |
| Someone shares a note / flashcard set / task with you | Recipient user(s) | `share.service.js → sendShareMessage` (already fires auto-DM — extend this) |
| Someone sends you a message | Recipient | `messages.controller.js` (or wherever messages are created) |
| Friend request accepted | Requester | `friends.controller.js` (on accepting a request) |

### System

| Event | Recipient | Trigger location |
|---|---|---|
| Email verification sent | New user | `auth.controller.js → register` *(already implemented)* |
| Password reset link sent | Requesting user | `auth.controller.js → forgotPassword` *(already implemented)* |

---

## Notification Channels

### Email (Resend)

- Already integrated — reuse the existing `resend` instance from `auth.controller.js`
- Move Resend initialization to a shared service: `backend/services/email.service.js`
- Send email only when `user.settings.emailNotifications === true`
- Use transactional email templates per event type (HTML with the app's branding)
- Batch or debounce email for comment/like events if the user receives many in a short window (e.g., max one email per event type per 15 minutes per user)

### Push Notifications (FCM)

- Requires adding `firebase-admin` to `backend/package.json`
- Requires a new env var: `FIREBASE_SERVICE_ACCOUNT_JSON` (path to service account JSON)
- Users must register a device token after logging in: `POST /api/users/device-token`
- Store device tokens on the User document: `deviceTokens: [{ token: String, platform: 'ios'|'android'|'web', createdAt: Date }]`
- Send push only when `user.settings.pushNotifications === true` AND a valid device token exists
- Remove stale tokens when FCM returns `messaging/registration-token-not-registered`

---

## Data Model Changes

### User model additions

```js
deviceTokens: [{
  token:     { type: String, required: true },
  platform:  { type: String, enum: ['ios', 'android', 'web'], required: true },
  createdAt: { type: Date, default: Date.now },
}]
```

### Notification model (new)

Stores a persistent record of every notification sent to a user. Powers an in-app notification bell/panel in addition to email/push.

```js
// backend/models/Notification.js
{
  userId:    ObjectId (ref: User, required, indexed)
  type:      String (enum — see event list above)
  actorId:   ObjectId (ref: User)  // who triggered the event
  targetId:  ObjectId              // resource ID (note, comment, etc.)
  targetType: String (enum: 'note', 'flashcardSet', 'task', 'comment', 'message', 'friendRequest')
  message:   String                // pre-rendered human-readable string ("Justin commented on your note")
  read:      Boolean (default: false)
  readAt:    Date
  createdAt: Date (auto, TTL 90 days — match Activity TTL)
}
```

---

## New Endpoints

### Device token registration

```
POST /api/users/device-token
Body: { token: String, platform: 'ios'|'android'|'web' }
Auth: required
Effect: upserts token into user.deviceTokens; deduplicates by token string
```

### In-app notifications

```
GET  /api/notifications          → list unread + recent notifications (limit 50)
PATCH /api/notifications/read    → mark all as read
PATCH /api/notifications/:id/read → mark one as read
DELETE /api/notifications/:id    → dismiss
```

---

## Backend Services

### `backend/services/email.service.js` (new)

Centralizes all outbound email. Exports one function:

```js
sendEmail({ to, subject, html, text })
```

- Wraps the `resend.emails.send` call
- Logs success/failure
- `auth.controller.js` refactors its existing Resend calls to use this service

### `backend/services/push.service.js` (new)

```js
sendPush({ userId, title, body, data })
```

- Looks up device tokens for the user
- Calls `firebase-admin` messaging API
- Handles `messaging/registration-token-not-registered` by pruning the stale token

### `backend/services/notification.service.js` (new)

Single entry point called by all controllers when a notifiable event occurs.

```js
notify({
  recipientId,   // User ObjectId
  actorId,       // User ObjectId (who did the action)
  type,          // event type string
  targetId,
  targetType,
  message,       // human-readable string
})
```

Internally this function:
1. Creates a `Notification` document
2. Fetches recipient's `settings.emailNotifications` and `settings.pushNotifications`
3. Dispatches to `email.service.js` and/or `push.service.js` accordingly
4. Applies debounce logic for high-frequency events (likes, comments) — skip email if another email for the same `type + targetId` was sent to this user in the last 15 minutes

---

## Preference Granularity (future consideration)

The current schema stores one boolean for each channel. A more granular model would allow users to opt in/out per event type (e.g., "email me on shares but not on likes"). This is out of scope for the initial implementation but the Notification model and `notify()` function should be designed to support it without a schema migration — the `type` field on Notification maps directly to a future per-type preference key.

---

## Frontend Changes

### Notification bell (new component)

- Polled or WebSocket-driven (polling is simpler for the initial version)
- Shows unread count badge
- Dropdown lists recent notifications with actor name, event description, and timestamp
- Clicking a notification navigates to the relevant resource and marks it read
- "Mark all read" action

### Settings page — Notifications section

- Toggle for "Email notifications" → `PATCH /api/users/settings` with `{ emailNotifications: Boolean }`
- Toggle for "Push notifications" → same endpoint
- Currently the settings endpoints and UI likely exist but do not write these fields — wire them up

### Device token registration

- On mobile (React Native / PWA): after login, call `POST /api/users/device-token` with the FCM token obtained from the Firebase SDK
- On web: request notification permission and obtain a web push token if web push is supported

---

## Environment Variables to Add

```
FIREBASE_SERVICE_ACCOUNT_JSON=./firebase-service-account.json
```

Update `backend/.env.example` accordingly.

---

## Implementation Order

1. `email.service.js` — refactor existing Resend usage, no new behavior
2. `Notification` model + CRUD endpoints
3. `notification.service.js` — wire in one event first (e.g., comment on your content)
4. In-app notification bell on frontend
5. Email delivery via `email.service.js` gated by user preference
6. `push.service.js` + FCM setup
7. Device token registration endpoint + frontend SDK integration
8. Granular per-event preferences (future)

---

## Files to Create

| File | Purpose |
|---|---|
| `backend/models/Notification.js` | Notification schema |
| `backend/services/notification.service.js` | Central `notify()` dispatcher |
| `backend/services/email.service.js` | Resend wrapper |
| `backend/services/push.service.js` | FCM wrapper |
| `backend/controllers/notifications.controller.js` | CRUD for in-app notifications |
| `backend/routes/notifications.routes.js` | Register notification endpoints |

## Files to Modify

| File | Change |
|---|---|
| `backend/models/User.js` | Add `deviceTokens` array |
| `backend/controllers/auth.controller.js` | Refactor Resend calls to use `email.service.js` |
| `backend/controllers/comments.controller.js` | Call `notify()` on new comment and new like |
| `backend/services/share.service.js` | Call `notify()` alongside auto-DM |
| `backend/controllers/friends.controller.js` | Call `notify()` on friend request accepted |
| `backend/.env.example` | Add `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Frontend settings page | Wire email/push toggles to API |
| Frontend app shell | Add notification bell component |
