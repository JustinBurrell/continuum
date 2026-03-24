# Loading States & Perceived Performance Plan

**Branch:** `feat/loading-states`
**Goal:** Eliminate all visible layout shift and loading flicker so the app feels instant — matching the perceived speed of Instagram, Linear, and Notion.

The backend is already fast (Redis caching, compound indexes). This is entirely a frontend perception problem. Data arrives in under a second; the UI just needs to handle that window gracefully.

---

## Root Cause

The current `Skeleton` component uses `animate-pulse` (a Tailwind opacity fade). This is generic and doesn't reserve space — if a skeleton isn't rendered in exactly the right shape and size, the page layout shifts when real data arrives. The goal is zero layout shift: the skeleton occupies the same pixels as the real content, and data swaps in without moving anything.

---

## Phase 1 — Shimmer Foundation

**File:** `web/src/components/ui/Skeleton.jsx`

Replace the pulse animation with a left-to-right shimmer — a highlight that sweeps across the element. This is the Instagram/LinkedIn pattern. One CSS keyframe, one component, used everywhere.

```jsx
// Skeleton.jsx
// Add a @keyframes shimmer to index.css (or inject via style tag):
// @keyframes shimmer {
//   0%   { background-position: -400px 0; }
//   100% { background-position: 400px 0; }
// }

// The component renders a div with:
// background: linear-gradient(90deg, #f5f0ff 25%, #ede9fe 50%, #f5f0ff 75%)
// background-size: 800px 100%
// animation: shimmer 1.4s ease-in-out infinite
// border-radius: matches whatever shape the real element is
```

The shimmer color uses the app's existing `#f5f0ff` / `#ede9fe` purple tones — it reads as a natural warmup, not a generic loading state.

`Skeleton` gets an optional `circle` prop for avatar placeholders (borderRadius 50%) and an optional `height`/`width` for inline sizing.

---

## Phase 2 — Skeleton Layouts Per Page

Each page that fetches data gets a skeleton that mirrors its exact layout. Rendered when `isLoading && !data`. These are not generic bar placeholders — they match the real component structure.

### Pages and what their skeletons look like

| Page | Real layout | Skeleton shape |
|------|-------------|----------------|
| `NotesList` | List of cards with title, tag chips, date | 6 card skeletons: tall rect + two small pill rects |
| `NoteDetail` | Title, content block, summary card | Title rect (wide), body block (tall), sidebar card |
| `Tasks` | 3 kanban columns, each with cards | 3 column headers + 3–4 card rects per column |
| `FlashcardSets` | Grid of set cards | 6 grid cards: rect + small text rect below |
| `FlashcardSetDetail` | Set header + scrollable card list | Header rect + 8 card pair skeletons |
| `Dashboard` | Stats row + content sections | 4 stat tiles + 2 content blocks |
| `Friends` | List of friend rows with avatar + name | 5 rows: circle + two rects |
| `ApplicationsList` | Kanban pipeline columns | Same pattern as Tasks |
| `Resumes` | List of resume cards | 4 card skeletons with button placeholders |
| `Activity` | Feed of activity rows | 6 rows: circle + rect + small date rect |
| `Messages` / `Conversation` | Conversation list + message bubbles | List rows + alternating bubble shapes |
| `Profile` | Tab content areas | Matches each tab's card structure |

Each skeleton lives as a named component in `web/src/components/skeletons/` — one file per page:
```
web/src/components/skeletons/
  NotesListSkeleton.jsx
  TasksSkeleton.jsx
  FlashcardSetsSkeleton.jsx
  DashboardSkeleton.jsx
  FriendsSkeleton.jsx
  ApplicationsSkeleton.jsx
  ResumesSkeleton.jsx
  ActivitySkeleton.jsx
  ConversationSkeleton.jsx
```

Usage pattern in every page:
```jsx
const { data, isLoading } = useQuery(...)

if (isLoading) return <NotesListSkeleton />;
return <actual content />
```

No conditional renders inside the content — the skeleton is a clean swap at the top level.

---

## Phase 3 — Optimistic Mutations

For write actions, update the React Query cache immediately and let the server confirm in the background. If the server returns an error, roll back and show a toast.

Actions to make optimistic:

| Action | Cache update | Rollback |
|--------|-------------|---------|
| Create note | Prepend to `['notes']` list | Remove prepended item + error toast |
| Delete note | Remove from `['notes']` list | Re-insert + error toast |
| Create task | Prepend to correct status column in `['tasks']` | Remove + error toast |
| Update task status | Move card to new column immediately | Move back + error toast |
| Send friend request | Mark user as "pending" in search results | Revert + error toast |
| Send message | Append bubble to conversation immediately | Remove bubble + error toast |

Pattern using React Query `onMutate` / `onError` / `onSettled`:
```js
useMutation({
  mutationFn: createNote,
  onMutate: async (newNote) => {
    await queryClient.cancelQueries({ queryKey: ['notes'] });
    const prev = queryClient.getQueryData(['notes']);
    queryClient.setQueryData(['notes'], old => [tempNote, ...old]);
    return { prev }; // snapshot for rollback
  },
  onError: (err, _, ctx) => {
    queryClient.setQueryData(['notes'], ctx.prev);
    toast({ type: 'error', message: 'Failed to create note' });
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
})
```

---

## Phase 4 — Prefetch on Sidebar Hover

When the user hovers a sidebar nav item, prefetch that page's primary query. By the time they click, the data is already in cache — skeleton never appears on any navigation after the first.

```js
// In Sidebar.jsx, on each NavLink's onMouseEnter:
const prefetchMap = {
  '/notes':        () => queryClient.prefetchQuery({ queryKey: ['notes'], queryFn: fetchNotes }),
  '/tasks':        () => queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: fetchTasks }),
  '/flashcards':   () => queryClient.prefetchQuery({ queryKey: ['flashcard-sets'], queryFn: fetchSets }),
  '/friends':      () => queryClient.prefetchQuery({ queryKey: ['friends'], queryFn: fetchFriends }),
  '/applications': () => queryClient.prefetchQuery({ queryKey: ['applications'], queryFn: fetchApps }),
  '/resumes':      () => queryClient.prefetchQuery({ queryKey: ['resumes'], queryFn: fetchResumes }),
  '/activity':     () => queryClient.prefetchQuery({ queryKey: ['activity'], queryFn: fetchActivity }),
};
```

Prefetch respects `staleTime` — if data is already fresh in cache, it's a no-op. No double fetching.

---

## Phase 5 — Per-Query `staleTime` Tuning

Override `staleTime` per query for data that rarely changes. Current global is 30s — this is correct for feed/social data. Static-ish data can go longer.

| Query key | Recommended staleTime | Reason |
|-----------|----------------------|--------|
| `['notes']` | 60s | Notes change only on user action |
| `['flashcard-sets']` | 2 min | Low mutation frequency |
| `['resumes']` | 5 min | Almost never changes mid-session |
| `['friends']` | 2 min | Friend list is stable |
| `['me']` | 5 min | Profile rarely changes |
| `['applications']` | 60s | User edits explicitly |
| `['tasks']` | 30s (keep default) | Shared tasks can change from others |
| `['activity']` | 30s (keep default) | Social feed — freshness matters |
| `['conversations']` | 15s | Inbox should be relatively fresh |
| `['messages', id]` | 10s | Active conversation |

Combined with optimistic updates, users never wait for their own mutations. The staleTime only affects cross-device/cross-user freshness.

---

## Implementation Order

1. Phase 1 — Shimmer (1 file, 30 min) — unlocks all other phases
2. Phase 2 — Skeleton layouts (1 file per page, ~3 hrs total)
3. Phase 5 — staleTime tuning (inline per query, 30 min) — quick win
4. Phase 4 — Sidebar prefetch (Sidebar.jsx, 45 min)
5. Phase 3 — Optimistic mutations (per action, ~2 hrs)

Total estimate: ~6–7 hours of focused implementation.

---

## Files Changed

| File | Change |
|------|--------|
| `web/src/components/ui/Skeleton.jsx` | Shimmer animation replacing pulse |
| `web/src/index.css` | `@keyframes shimmer` definition |
| `web/src/components/skeletons/*.jsx` | One skeleton layout per page (new files) |
| `web/src/pages/**/*.jsx` | Swap `isLoading` render to use skeleton components |
| `web/src/components/layout/Sidebar.jsx` | `onMouseEnter` prefetch per nav item |
| `web/src/lib/queryClient.js` | No change — staleTime overrides are per-query inline |
| `web/src/pages/**/*.jsx` (mutations) | Add `onMutate`/`onError`/`onSettled` to write mutations |
