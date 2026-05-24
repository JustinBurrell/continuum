# BUG-1: FCM Tap Crash on Cold Start

## Summary
Tapping a system tray push notification when the app is fully killed crashes the app after the splash screen.

## Platform
Android

## Steps to Reproduce
1. Receive a push notification (app must be killed, not backgrounded)
2. Tap the notification in the system tray
3. Splash screen appears with the C icon
4. App crashes

## Root Cause
`handleFcmIntent()` fires in `MainActivity.onCreate()` before `setContent {}` runs.
It emits a route to `NotificationRouter.destination` (a `SharedFlow` with `extraBufferCapacity = 1`).
The `LaunchedEffect(Unit)` in `AppNavHost` that collects this flow doesn't start collecting until
the composable finishes its first composition. By that point, the `NavHost` may not have finished
initializing its route graph, causing `navController.navigate(route)` to throw:

```
IllegalArgumentException: Navigation destination ... is unknown to this NavController
```

Secondary risk: if `tokenManager.isLoggedIn` resolves as `false` during cold start (async read),
the NavHost starts at `auth/login`. The buffered FCM route (e.g. `notes/detail/{noteId}`)
then fires, navigating to a screen that's in the authenticated graph — which crashes.

## Affected Files
- `android/app/src/main/java/com/continuum/android/MainActivity.kt`
- `android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt`
- `android/app/src/main/java/com/continuum/android/core/notification/NotificationRouter.kt`

## Fix Approach
Do not call `handleFcmIntent()` in `onCreate()`. Instead, store the raw FCM intent data in
`NotificationRouter` as a pending route. Emit it only after `isAuthenticated = true` is observed
in `AppNavHost`, inside `LaunchedEffect(isAuthenticated)`. This guarantees the NavHost is composed
and the user is confirmed authenticated before any navigation fires.
