# BUG-6: Conversation Messages Display in Wrong Order (Newest at Top)

## Summary
Messages in a conversation appear with the newest message at the top and oldest at the bottom,
the opposite of expected chat behavior (Instagram, iMessage, WhatsApp all show newest at bottom).

## Platform
Android

## Steps to Reproduce
1. Open any conversation with multiple messages
2. Observe that the most recent message is at the top of the list
3. Older messages are below it — scrolling down shows older content, not newer

## Root Cause
One of two scenarios (need to verify by reading `ConversationDetailScreen.kt`):

**Scenario A — API order + no reversal:**
The API returns messages in descending order (newest first, `sort: { createdAt: -1 }`).
The `LazyColumn` renders them top-to-bottom without `reverseLayout`, so newest appears first
(top of screen).

**Scenario B — API order mismatch with reverseLayout:**
The API returns messages in descending order AND `reverseLayout = true` is set on the
`LazyColumn`. With reversal, the first item in the list (newest) is rendered at the bottom,
but since the list grows from the bottom up, the visual order ends up inverted from what
the user sees when they first open the screen.

The simplest diagnosis: check whether the API sorts by `createdAt: -1` or `createdAt: 1`,
and whether the `LazyColumn` has `reverseLayout`.

## Affected Files
- `android/app/src/main/java/com/continuum/android/feature/messaging/presentation/ConversationDetailScreen.kt`
- `android/app/src/main/java/com/continuum/android/feature/messaging/data/repository/MessagingRepository.kt` (API sort order)

## Fix Approach
Standard chat pattern used by Instagram/WhatsApp:

1. **API**: sort messages `createdAt: 1` (ascending — oldest first)
2. **LazyColumn**: set `reverseLayout = true`

With `reverseLayout = true`, Compose renders list items from bottom to top. The first item
in the list (oldest message) ends up at the bottom of the visible area, newest items stack
upward, and the list starts scrolled to the bottom. New incoming messages appended to the end
of the list appear at the bottom automatically — no manual `scrollToItem` needed.

Do not use `reverseLayout = true` with a descending API sort — that would doubly reverse
and produce the wrong order.
