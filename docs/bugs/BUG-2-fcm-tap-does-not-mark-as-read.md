# BUG-2: Tapping a Push Notification Does Not Mark It as Read

## Summary
When a user taps a push notification and is navigated to the target screen, the corresponding
in-app notification remains unread. The bell badge count does not decrement.

## Platform
Android

## Steps to Reproduce
1. Receive a push notification (e.g. `comment_added`)
2. Tap it — app opens the note detail screen
3. Navigate back to the notifications list
4. The notification is still shown as unread

## Root Cause
The FCM tap flow routes the user via `NotificationRouter` → `navController.navigate(route)`.
There is no step in this path that calls `PATCH /api/notifications/:id/read`.
The FCM data payload does not include the notification document `_id`, so there's no direct
way to mark the exact document without a lookup.

## Affected Files
- `android/app/src/main/java/com/continuum/android/core/notification/NotificationRouter.kt`
- `android/app/src/main/java/com/continuum/android/MainActivity.kt`
- Backend: `backend/routes/notifications.routes.js`

## Fix Approach
Two options:

**Option A (preferred):** Include the notification `_id` in the FCM data payload on the backend
(it's available at send time in `notification.service.js`). On Android, when `handleFcmIntent`
fires, read the `notificationId` key and call `PATCH /api/notifications/:id/read` from
`NotificationsRepository` before routing.

**Option B:** After navigating, mark all notifications as read that match `type` + `targetId`.
Less precise but avoids a schema change. A `PATCH /api/notifications/read-by-target` endpoint
that accepts `{ type, targetId }` would mark the matching unread notification(s).
