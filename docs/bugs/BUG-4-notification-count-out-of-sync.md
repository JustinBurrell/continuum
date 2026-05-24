# BUG-4: Notification Unread Count Out of Sync Between Web and Android

## Summary
The unread notification badge count on Android and web can diverge. Reading notifications on one
platform does not update the badge on the other.

## Platform
Web + Android (cross-platform sync issue)

## Steps to Reproduce
1. Receive 3 unread notifications — both web and Android show badge "3"
2. Open the notifications list on web, mark all as read — web badge clears to 0
3. Android badge still shows "3"
4. (vice versa also happens)

## Root Cause
The backend emits a `new_notification` Socket.io event when a notification is **created**,
carrying the current `unreadCount`. Both clients update their badge from this event.
However, there is no corresponding socket event emitted when a notification is **marked as read**.
The `PATCH /api/notifications/:id/read` and bulk mark-all-read endpoints update the DB but
emit nothing to the user's socket room. The badge only self-corrects when the next new
notification arrives (which re-emits the true count).

## Affected Files
- Backend: `backend/controllers/notifications.controller.js`
- Backend: `backend/services/notification.service.js` (where `getIO().to(...).emit(...)` lives)
- Android: `NotificationsViewModel` (needs to listen for the new event)
- Web: notification bell component (needs to listen for the new event)

## Fix Approach
In the mark-as-read controller(s), after updating the DB, recompute `unreadCount` and emit
a `notification_count_update` event to `user:{userId}` with `{ unreadCount }`.
Both Android and web subscribe to this event the same way they subscribe to `new_notification`
and update their badge accordingly.

The Android `NotificationsViewModel` should also refetch the count on `ON_RESUME` of the
notifications screen as a fallback for cases where the socket event is missed.
