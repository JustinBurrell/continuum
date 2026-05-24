# BUG-5: In-App Notification Banner Too High and Does Not Dismiss on Tap

## Summary
Two issues with the in-app notification banner:
1. The banner renders behind or flush with the status bar — too high on screen
2. Tapping the banner navigates correctly but the banner does not slide away

## Platform
Android

## Steps to Reproduce

**Position issue:**
1. Trigger an in-app notification (e.g. receive a comment while the app is open on a different screen)
2. The banner appears but is clipped by or overlaps the status bar

**Dismiss issue:**
1. Same trigger as above
2. Tap the banner — correct screen is navigated to
3. The banner remains visible on screen instead of sliding out

## Root Cause

**Position:** `MainActivity` calls `enableEdgeToEdge()`, which means app content draws behind the
status bar. The banner is placed at the top of a `Box(Modifier.fillMaxSize())` in `AppNavHost`
with no status bar inset applied, so it sits at y=0 (behind the status bar).
Fix: add `Modifier.statusBarsPadding()` to the `AnimatedVisibility` in `InAppNotificationBanner`.

**Dismiss:** When the user taps the banner, `AppNavHost` sets `inAppNotification = null`.
This causes the `LaunchedEffect(notification)` in the banner to refire with `notification = null`.
The current code has `if (notification == null) return@LaunchedEffect` — so `visible` stays `true`
and the banner never slides out. 
Fix: when `notification == null`, set `visible = false` and wait for the slide-out animation
before clearing `current`, instead of early-returning.

## Affected Files
- `android/app/src/main/java/com/continuum/android/core/ui/components/InAppNotificationBanner.kt`

## Fix (both issues in one file)

```kotlin
// Add statusBarsPadding() to AnimatedVisibility modifier
AnimatedVisibility(
    visible = visible,
    enter = slideInVertically { -it },
    exit = slideOutVertically { -it },
    modifier = modifier.statusBarsPadding(),
)

// Handle null notification to trigger dismiss animation
LaunchedEffect(notification) {
    if (notification == null) {
        visible = false
        delay(300)
        current = null
        return@LaunchedEffect
    }
    current = notification
    visible = true
    delay(4_000)
    visible = false
    delay(300)
    current = null
}
```
