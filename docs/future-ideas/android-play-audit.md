# Continuum Android — Google Play Polish Audit
*Generated: May 11, 2026*

## Git Workflow

Follow the [Agile Workflow Guide](../agile_workflow_guide.md) for every fix. The pattern is:

```bash
# 1. Start from an up-to-date main
git checkout main && git pull origin main

# 2. Create a branch per tier (or per logical group of fixes)
git checkout -b fix/android-polish-critical   # Tier 1
git checkout -b fix/android-polish-high       # Tier 2
# etc.

# 3. Commit after each individual fix — do not batch unrelated changes
git add <files>
git commit -m "fix: change labelSmall from 10sp to 12sp for a11y compliance"

# 4. Push and open PR when the tier is done
git push -u origin fix/android-polish-critical
gh pr create --title "fix: Android polish — critical tier (Play Store blockers)" ...

# 5. Merge in GitHub, then pull main and start the next branch
git checkout main && git pull origin main
```

Branch naming for this work:
| Tier | Branch name |
|------|-------------|
| Critical | `fix/android-polish-critical` |
| High | `fix/android-polish-high` |
| Medium | `fix/android-polish-medium` |
| Low / store listing | `chore/android-play-store-prep` |

---

## Critical (blocks store submission or causes crashes)

1. **File:** `android/app/src/main/java/com/continuum/android/core/ui/theme/Type.kt` (lines 32–40)
   **Composable:** Typography system
   **Problem:** `labelSmall` is set to `10.sp`, which violates the minimum 12sp guideline for captions. This is used in badge text and small UI labels that are often tapped.
   **Fix:** Change `labelSmall` from `10.sp` to `12.sp` to meet Google Play accessibility standards.

2. **File:** `android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt` (lines 165–172)
   **Composable:** `AppNavHost` navigation
   **Problem:** The `sensitiveRoutes` set is incomplete. `Notes.EDITOR`, `Profile.EDIT`, `Profile.SETTINGS`, `Career.APPLICATION_DETAIL` (when viewing resume attachments), and messaging screens with private thread data should also be marked as sensitive. These screens contain editable personal or financial data, not just read-only content.
   **Fix:** Expand `sensitiveRoutes` to include at least `Notes.EDITOR`, `Career.RESUME_FEEDBACK`, `Profile.EDIT`, and `Profile.SETTINGS` — all contain private or sensitive editable information that should have FLAG_SECURE set.

3. **File:** `android/app/src/main/java/com/continuum/android/core/ui/components/EmptyState.kt` (lines 31–43)
   **Composable:** `EmptyState`
   **Problem:** The button `onAction` is optional but no inline text messaging exists on list screens when the CTA button is not shown. Search result screens (Notes, Tasks, Activity with search query active) display only "No results" + "Try a different search term" with no "Clear search" affordance.
   **Fix:** Add a `clearSearchAction: (() -> Unit)?` parameter to `EmptyState` and conditionally render a secondary button (or link) on no-results states with active search queries. Update all search no-results EmptyState calls to pass `clearSearchAction = { viewModel.clearSearch() }`.

## High (visible to any user within the first 5 minutes)

1. **File:** `android/app/src/main/java/com/continuum/android/feature/notes/presentation/NotesListScreen.kt` (lines 141–166)
   **Composable:** `NotesListScreen` empty state rendering
   **Problem:** Empty state for search queries shows "No results" with "Try a different search term" but does not acknowledge the active search term in the empty state headline or include a "Clear search" button. Compare to web client, which shows "No results for 'query'" and offers a clear button.
   **Fix:** Pass the search query text to the EmptyState and render it in the headline (e.g., `headline = "No results for \"$searchQuery\""`). Add a "Clear search" CTA button adjacent to or within the empty state.

2. **File:** `android/app/src/main/java/com/continuum/android/feature/messaging/presentation/ConversationsScreen.kt` (lines 82–140)
   **Composable:** `ConversationsScreen` list with swipe-to-delete
   **Problem:** Swipe-to-delete is implemented for conversations but **no confirmation dialog** is shown before deletion. A single accidental swipe removes a conversation permanently (though the backend may support recovery). Compare to web (Messages list does NOT have destructive swipe-to-delete, only a context menu with confirmation).
   **Fix:** Add an AlertDialog confirmation before calling `onDelete()` in the `SwipeToDismissBox` callback. Show "Delete conversation?" with "Delete" (error red) and "Cancel" buttons.

3. **File:** `android/app/src/main/java/com/continuum/android/feature/notes/presentation/NotesListScreen.kt` (lines 132–156)
   **Composable:** `NotesListScreen` note list
   **Problem:** Notes list has swipe-to-delete or long-press context menu, but **long-press returns `null` when `onLongClick` is disabled on demo/shared notes**, making the interaction inconsistent. There is no visual feedback (haptic or otherwise) to indicate that long-press is not available.
   **Fix:** Add haptic feedback when a note card is long-pressed in non-demo mode. If on shared tab or demo, disable the clickable modifier entirely or show a subtle toast explaining "Shared notes cannot be deleted."

4. **File:** `android/app/src/main/java/com/continuum/android/core/ui/components/ContinuumButton.kt` (lines 43–56)
   **Composable:** `ContinuumButton`
   **Problem:** Buttons are 48dp tall (correct) but there is **no haptic feedback** on press for primary CTAs (create, save, delete, share). Destructive actions (delete task, remove friend, delete note) and async operations (loading spinners) do not trigger haptic feedback to signal confirmation or state change.
   **Fix:** Inject `LocalHapticFeedback` into `ContinuumButton`. For primary and danger variants, call `hapticFeedback.performHapticFeedback(HapticFeedbackType.LongPress)` on click. For loading state transitions, use `HapticFeedbackType.LongPress` when `loading` changes from false to true.

5. **File:** Multiple screens (NotesListScreen, ApplicationsListScreen, FlashcardSetsListScreen, etc.)
   **Composable:** List screens with no-results empty state
   **Problem:** When search returns zero results (e.g., notes, applications, flashcards, friends), there is **no "Clear search" button** to dismiss the query. Users must manually delete the search text character by character. Desktop web shows "Clear" affordance.
   **Fix:** Modify the empty state renderings for search no-results to include a "Clear search" or "Try again" button that calls `viewModel.setSearchQuery("")`. Example: `actionLabel = "Clear search"` when `searchQuery.isNotBlank()`.

6. **File:** `android/app/src/main/java/com/continuum/android/feature/profile/presentation/SettingsScreen.kt` (lines 89–134)
   **Composable:** `SettingsScreen` notification toggles
   **Problem:** The notification toggles (email, push) do not visually indicate they are "disabled on demo accounts" until the user reads the hint text at the top. The toggle switches are grayed out but no label says "Demo accounts cannot change settings."
   **Fix:** Add a small "(demo account)" label next to each disabled toggle, or display a banner above toggles: "Demo account: notification settings are read-only."

7. **File:** `android/app/src/main/java/com/continuum/android/core/ui/navigation/BottomNavBar.kt` (lines 59–97)
   **Composable:** `ContinuumBottomBar` profile icon avatar loading
   **Problem:** The profile avatar in the bottom nav is loaded via `AsyncImage` with no **error fallback or placeholder** visible while loading. If the image URL is invalid or the network is slow, the user sees a blank circle icon for several seconds before the fallback icon appears.
   **Fix:** Wrap `AsyncImage` in a `SubcomposeAsyncImage` that shows the `AvatarInitials` fallback (from `core/ui/components/AvatarInitials.kt`) during both loading and error states.

## Medium (noticeable on regular use, affects perceived quality)

1. **File:** `android/app/src/main/java/com/continuum/android/feature/tasks/presentation/TaskBoardScreen.kt`
   **Composable:** Task board empty state
   **Problem:** When a board status column has zero tasks, an `EmptyState` is rendered with `"No tasks in this status"`. The same empty state is shown when search query is active and no tasks match. This conflates "no data" with "no search results" — the user may think they've deleted all tasks instead of realizing the search filtered them out.
   **Fix:** Differentiate the empty state headline based on `state.searchQuery.isNotBlank()`. Show `"No tasks match '$query'"` (acknowledging the search) when a query is active.

2. **File:** `android/app/src/main/java/com/continuum/android/core/ui/components/CommentThread.kt`
   **Composable:** Comment thread in note/task detail
   **Problem:** The comment thread component shows comment author names as clickable text to navigate to the user's profile. However, there is **no visual indication (color, underline, or icon)** that these names are links. They appear as plain text.
   **Fix:** Render comment author names in `BrandPurple` with an underline, or add a small external-link icon next to the name to signal that it is clickable.

3. **File:** `android/app/src/main/java/com/continuum/android/feature/flashcards/presentation/StudyModeScreen.kt` (lines 115–183)
   **Composable:** `FlipCard` swipe gesture feedback
   **Problem:** The flashcard study screen supports swipe left/right gestures to answer cards, with haptic feedback implemented. **However, there is no visual feedback** while dragging (no offset indicator, no color change). Users swiping may not realize they've triggered the action until the card has already flipped.
   **Fix:** Add `graphicsLayer { translationX = dragOffsetX }` to the Card modifier to show the drag offset in real-time. Optionally, change the card background color based on drag direction (green for "know," red for "learning").

4. **File:** `android/app/src/main/java/com/continuum/android/feature/social/presentation/FriendsListScreen.kt` (lines 75–90)
   **Composable:** Friends list with friend cards
   **Problem:** Friend cards have a swipe-to-remove action (implemented via `SwipeToDismissBox`), but **no visual feedback or confirmation** is shown when swiped. The card is instantly removed from the list. The action is irreversible if the user accidentally swipes.
   **Fix:** Add a confirmation dialog or undo toast. Option A: Show an AlertDialog asking "Remove [name] from friends?" with confirm/cancel buttons. Option B: After swiping, show a Snackbar "Removed [name]" with an "Undo" action.

5. **File:** `android/app/src/main/java/com/continuum/android/feature/notes/presentation/NoteDetailScreen.kt` (lines 1–60)
   **Composable:** Note detail screen with PDF download
   **Problem:** The note detail screen can download a Google Drive PDF when available. The download is enqueued via `DownloadManager` but there is **no feedback to the user**. No toast, no snackbar, and no download progress indicator tells the user the download has started or completed.
   **Fix:** After enqueueing the download, show a Snackbar: `"PDF download started"` or hook into DownloadManager broadcasts to notify when the download completes.

6. **File:** `android/app/src/main/java/com/continuum/android/feature/notes/presentation/NoteEditorScreen.kt` (lines 101–108)
   **Composable:** Note editor title and content input
   **Problem:** The note editor has an auto-save feature that triggers when the user edits the note. There is **no "Saving…" indicator** or save status displayed to the user. Auto-save happens silently, and the user has no confirmation that their edits are persisted.
   **Fix:** Add a "Saving…" indicator in the top bar (similar to `TaskDetailScreen`'s `if (detailState.isSaving) { CircularProgressIndicator(...) }`). Replace or update the save button text from "Save" to "Saving…" while `detailState.isSaving` is true.

7. **File:** Multiple screens using `SkeletonLoader`
   **Composable:** Loading state skeletons
   **Problem:** The `SkeletonLoader` component is used for first-load empty states (before data arrives), but there is **no animation**. Skeleton loaders remain static gray boxes, which feels less polished than animated shimmer skeletons common in modern apps.
   **Fix:** Add an `animateFloat` animation that shifts a gradient overlay left-to-right across the skeleton loader to simulate a shimmer effect. Example: `graphicsLayer { translationX = animatedOffset }` with a repeating `animateFloatAsState(targetValue = 1f, ...)` loop.

## Low (nice to have, affects delight)

1. **File:** `android/app/src/main/java/com/continuum/android/feature/dashboard/presentation/DashboardScreen.kt`
   **Composable:** Dashboard empty section states
   **Problem:** Dashboard empty sections (when a user has no notes, tasks, applications, etc.) show an `EmptyState` but do **not include the demo banner or hint text** that copy-only demo users. The user might think they have no data when they are viewing the demo account.
   **Fix:** For demo accounts, modify empty state subtext to remind the user they are on a demo: `"Create your first note to see it here (upgrade to a personal account to start tracking)"`.

2. **File:** `android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt` (lines 297–350)
   **Composable:** Navigation transitions
   **Problem:** All navigation transitions use the same `slideIntoContainer` + `fadeOut` animation (300ms) for both forward and back navigation. This is correct, but there is **no gesture-driven back animation**. Swiping back from a detail screen does not trigger the pop animation — it just instantly returns to the list.
   **Fix:** This is a Jetpack Navigation Compose limitation and not easily fixable without custom navigation. Consider documenting this as a known limitation or use `AnimatedNavHost` with custom back gesture handling (requires significant refactoring).

3. **File:** All list screens (NotesListScreen, etc.)
   **Composable:** List screens
   **Problem:** When pull-to-refresh is triggered, the refresh state is shown but there is **no haptic feedback** when the user releases and the refresh begins. Compare to native iOS, which vibrates on release.
   **Fix:** In the `PullToRefreshBox` `onRefresh` callback, call `HapticFeedback.performHapticFeedback(HapticFeedbackType.LongPress)` to signal the refresh has started.

4. **File:** `android/app/src/main/java/com/continuum/android/feature/social/presentation/UserProfileScreen.kt`
   **Composable:** User profile screen
   **Problem:** User profiles show shared notes, tasks, and flashcard sets but do **not link to friend's recent activity**. Web profile shows a slice of the friend's activity feed. Android should similarly surface 3–5 recent activities from that friend.
   **Fix:** Add a small "Recent activity" section below the friend's shared items. Call `GET /activity?actor={userId}&limit=5` and render the last few activities. If none, show "No recent activity."

5. **File:** `android/app/src/main/java/com/continuum/android/feature/onboarding/presentation/TourOverlay.kt`
   **Composable:** Feature tour overlay
   **Problem:** The feature tour is optional and can be replayed from Settings, but there is **no "skip tour" button** on first load. New users must sit through the entire tour or force-close the app. The web app has a prominent "Skip tour" button in the top-right.
   **Fix:** Add a "Skip" button to the tour overlay card that allows users to exit early and proceed to the dashboard. Call `navController.popBackStack()` and set `tourActive = false`.

## Store Listing Gaps

| Item | Status | Notes |
|------|--------|-------|
| **512×512 PNG app icon (no alpha channel)** | ✅ Ready | Icons present in all density mipmap folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi). Icons are WebP format; convert to PNG and ensure solid background (no alpha) before upload. |
| **Feature graphic (1024×500px banner)** | ❌ Missing | No feature graphic asset found in `res/` directories. Create and add to Play Console during listing submission. |
| **Screenshot assets (2–8 per orientation)** | ⚠️ Not in repo | Screenshots not stored in source; they must be generated via device/emulator and uploaded to Play Console manually. Ensure 2–3 phone screenshots show key flows: dashboard, notes, messages. |
| **Short description (30 char)** | ⚠️ Draft needed | Not present in code. Example: `"Study tools for productivity"` or `"Notes, flashcards, and more."` |
| **Full description (4000 char)** | ⚠️ Draft needed | Not in repo; prepare copy highlighting key features: notes, flashcards, tasks, social. |
| **versionCode and versionName** | ✅ Ready | `build.gradle.kts` sets `versionCode = 1`, `versionName = "1.0.0"`. Ensure incremented for each release. |
| **minSdk and targetSdk** | ✅ Ready | `minSdk = 26` (Android 8.0) supports EncryptedSharedPreferences. `targetSdk = 35` (Android 15) meets Play Store requirement. |
| **ProGuard/R8 rules** | ⚠️ Minimal | `proguard-rules.pro` has minimal rules (comments only). While Kotlin and Compose mostly auto-configure, add explicit rules for Retrofit, Moshi, and Socket.io clients: `-keep class com.squareup.moshi.** { *; }`, `-keep class retrofit2.** { *; }`, etc. |
| **Hardcoded secrets (API keys, etc.)** | ✅ Safe | `BASE_URL` and `WEB_CLIENT_ID` are read from `BuildConfig` (populated from `local.properties` / backend `.env`). No hardcoded tokens or private keys in source. Network security config disallows cleartext in release. |
| **Privacy policy URL** | ❌ Missing | No privacy policy URL in `AndroidManifest.xml` or build config. Add `<meta-data android:name="com.google.android.gms.version" android:value="@integer/google_play_services_version" />` and privacy policy link in Play Console. |
| **Permissions declared** | ✅ Correct | Only `INTERNET`, `ACCESS_NETWORK_STATE`, and `POST_NOTIFICATIONS` (for FCM) are declared. All are necessary and justified. |
| **Deep links configured** | ✅ Correct | Email verify and password reset deep links configured with `android:autoVerify="true"`. Google Drive picker deep link also registered. |
| **App signing ready** | ⚠️ To verify | No signing key found in repo (expected). Ensure `keystore` is created and stored securely outside the repo. Use the same key for all uploads. |

## Recommended Implementation Order

### Tier 1 (Critical — blocks submission)
1. **Fix `labelSmall` typography to 12sp** — Effort: XS. Unblock accessibility compliance in 1 minute.
2. **Expand `sensitiveRoutes` to include editor and settings screens** — Effort: XS. Add 2–3 route patterns to set. Ensures private screens have FLAG_SECURE.
3. **Add "Clear search" button to all no-results empty states** — Effort: S. Modify `EmptyState` component and update 5–6 screens (Notes, Tasks, Applications, Flashcards, Friends, Activity, Messages). Improves search UX significantly.

### Tier 2 (High — visible in first 5 min)
4. **Add confirmation dialogs to destructive swipe actions** — Effort: S. Conversations delete, Friends remove, Notes delete. Wrap SwipeToDismissBox callbacks with AlertDialog.
5. **Add haptic feedback to ContinuumButton and destructive actions** — Effort: S. Inject HapticFeedback and trigger on primary CTAs and loading state changes.
6. **Fix avatar loading in bottom nav (add error fallback)** — Effort: XS. Replace `AsyncImage` with `SubcomposeAsyncImage` to show initials on error.
7. **Add demo account indicators on disabled toggles/settings** — Effort: XS. Add "(demo account)" label or banner to SettingsScreen.

### Tier 3 (Medium — affects perceived quality)
8. **Differentiate "no data" vs. "no search results" empty states** — Effort: S. Update 3–4 screens to check `searchQuery.isNotBlank()` and adjust headline/subtext.
9. **Add visual feedback to comment author links** — Effort: XS. Render author names in `BrandPurple` with underline in CommentThread.
10. **Add visual drag feedback to flashcard swipe gestures** — Effort: S. Translate card with `dragOffsetX` and optionally change background color. Optional color: blue for swiping right, red for left.
11. **Add undo/confirmation for friend removal** — Effort: M. Show Snackbar with "Undo" action after swipe-to-remove, or add AlertDialog confirmation.
12. **Add "Saving…" indicator to note editor** — Effort: XS. Show spinner in top bar while `detailState.isSaving`.

### Tier 4 (Low — delight)
13. **Add shimmer animation to SkeletonLoader** — Effort: M. Animate a gradient overlay across the skeleton for a professional shimmer effect.
14. **Add recent activity section to user profile** — Effort: M. Fetch and render 5 recent activities from the friend's feed.
15. **Add "Skip tour" button to onboarding** — Effort: XS. Allow users to exit the feature tour early.
16. **Generate and upload feature graphic, screenshots, and metadata** — Effort: L. Work outside the repo with designers/marketing. Critical for Play Store listing.

---

## Summary

**Most critical path to submission:**
1. Fix typography (1 min).
2. Expand sensitive routes (2 min).
3. Add "Clear search" to EmptyState (30 min).
4. Add confirmation dialogs to swipes (20 min).
5. Add haptic feedback to buttons (15 min).
6. Test on physical device and emulator across API 26, 30, 34, 35.
7. Generate Play Store assets (screenshots, feature graphic, descriptions) — coordinate with design team.
8. Create signing key, build release APK/AAB, and upload to Play Console for review.

**Timeline estimate:** 4–6 hours of engineering for critical + high priority items. 1–2 days for design/marketing assets.

