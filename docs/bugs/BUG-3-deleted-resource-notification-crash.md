# BUG-3: Tapping a Notification for a Deleted Comment or Note Crashes the App

## Summary
If a comment or note is deleted after a push notification for it was sent, tapping that notification
navigates to the detail screen which then crashes when the API returns a 404.

## Platform
Android (also affects in-app notification taps in the notifications list screen)

## Steps to Reproduce
1. User A comments on User B's note → push notification sent to User B
2. User A deletes the comment (or User B deletes the note)
3. User B taps the push notification
4. App navigates to `NoteDetailScreen` (or `FlashcardSetDetailScreen`)
5. The screen attempts to fetch the resource → API returns 404
6. App crashes

## Root Cause
`NoteDetailScreen` and `FlashcardSetDetailScreen` do not handle a 404 response gracefully.
When the ViewModel receives the error, the UI attempts to render a null/empty state that
results in a crash (NPE or unhandled exception propagation).
The same applies when the note exists but the `commentId` passed via `scrollToCommentId` no
longer exists in the comment list — the scroll-to logic may throw.

## Affected Files
- `android/app/src/main/java/com/continuum/android/feature/notes/presentation/NoteDetailScreen.kt`
- `android/app/src/main/java/com/continuum/android/feature/flashcards/presentation/FlashcardSetDetailScreen.kt`
- Their corresponding ViewModels

## Fix Approach
In the ViewModels, catch 404 responses and expose a `resourceNotFound: Boolean` state.
In the screens, when `resourceNotFound = true`, show a `Snackbar` ("This content is no longer
available") and call `navController.popBackStack()`.
For missing `commentId`: silently ignore scroll if the comment ID is not found in the list —
do not throw, just skip the scroll.
