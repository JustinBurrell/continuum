# BUG-6: New Message in Conversation Jumps to Top Instead of Bottom

## Summary
When a new message is sent or received in a conversation, the message list scrolls to the top
instead of the bottom. Expected behavior (Instagram/iMessage style): newest messages appear at
the bottom and the view stays anchored there.

## Platform
Android (possibly web too — needs verification)

## Steps to Reproduce
1. Open a conversation with existing messages
2. Send a new message or receive one
3. The list scrolls to the top instead of staying at / scrolling to the bottom

## Root Cause
The conversation message list is likely using a standard `LazyColumn` with messages in
chronological order (oldest first, newest last). One of the following is happening:
- The list is not calling `scrollToItem(lastIndex)` or `animateScrollToItem(lastIndex)`
  after new messages are appended
- OR the `reverseLayout = true` flag is not set, meaning the list grows downward but the
  scroll state isn't following the tail
- OR a `key` is missing from `LazyColumn` items, causing full recomposition that resets
  scroll position to 0

## Affected Files
- `android/app/src/main/java/com/continuum/android/feature/messaging/presentation/ConversationDetailScreen.kt`
- Possibly the ViewModel that appends new messages to the list state

## Fix Approach
Two valid patterns — pick one and apply consistently:

**Option A — `reverseLayout = true` (Instagram/WhatsApp style):**
Set `reverseLayout = true` on the `LazyColumn`. Messages are rendered bottom-up, newest at the
bottom. The list starts scrolled to the bottom automatically. No manual `scrollToItem` needed
for new messages — they appear at the visual bottom since the list is reversed.

**Option B — Forward layout with auto-scroll:**
Keep `reverseLayout = false`. After the messages list updates (observe the list size change),
call `listState.animateScrollToItem(messages.lastIndex)`. Use `LaunchedEffect(messages.size)`
to trigger this. Ensure each item has a stable `key` to avoid scroll position resets on
recomposition.

Option A is simpler and more robust for chat UIs.
