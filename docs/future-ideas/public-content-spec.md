# Continuum — Public Notes and Flashcards (Discover)
## Future Ideas Spec

**Status:** Future feature, not yet scheduled  
**Related specs:** `docs/future-ideas/forum.md` (read before implementing)  
**Depends on:** Core notes and flashcards features being stable in production

---

---

## GitHub Workflow — Read Before Writing Any Code

### Step 0: Branch and issues first

Before writing a single line of feature code, Claude Code must:

1. Checkout main and pull the latest: `git checkout main && git pull origin main`
2. Create the feature branch: `git checkout -b feat/DISC-discover`
3. Use the `gh` CLI to create a GitHub issue for every ticket listed below, attaching each to the "Continuum Development Board" project
4. Only after all issues are created, begin implementing ticket by ticket

**Creating an issue and attaching to the project:**
```bash
# Create issue
gh issue create --title "DISC-1: feat: extend note and flashcardset visibility enum to include public" --body "..." --label "feat"

# Get project number (run once):
gh project list --owner JustinBurrell

# Attach issue to project:
gh project item-add PROJECT_NUMBER --owner JustinBurrell --url ISSUE_URL
```

Read the existing agile workflow guide in the repo before running any `gh` commands. Match the existing label names exactly.

### Step 1: One commit per ticket

Each ticket below maps to exactly one commit. The commit message must match the format in the ticket exactly. Do not include `Closes #N` in the commit message — issue closing happens in the PR body.

### Step 2: PR at the end

One PR for the entire discover branch. Title follows the agile guide format. The PR body must include `Closes #N` for every single issue created in Step 0 — one line per issue. GitHub will auto-close all of them on merge.

### Step 3: Codebase investigation before every ticket

The spec repeatedly says "read the codebase before implementing." This is not a suggestion. For every ticket, before writing the implementation:
- Find and read the relevant existing code (schema, endpoint, component, screen, test file)
- Understand the existing pattern
- Match it exactly in the new code

The existing implementation is the baseline. The profile page already shows user content. The comment system already exists. The notification system already handles comment types. The activity feed already has event types. Read all of these before touching them.

---

## Ticket Breakdown — Discover PR

Listed in implementation order. One commit per ticket.

### Schema and Infrastructure

**DISC-1** `feat: extend note and flashcardset visibility enum to include public`
Branch prefix: `feat/`
- Read the Note and FlashcardSet schemas completely before touching them
- Search the entire codebase for every reference to the visibility enum — controllers, middleware, services, permission checks, tests — and list them all before changing anything
- Add `'public'` to the enum on both schemas
- Update every validation and permission check that references the enum
- This is an additive change — no migration script needed — but verify by reading the schema definition

**DISC-2** `feat: add publicMeta savedFrom and tags fields to schema`
Branch prefix: `feat/`
- Read both schemas again before adding fields
- Add `publicMeta` embedded object to Note and FlashcardSet with exact fields from the spec
- Add `savedFrom: ObjectId` to both schemas
- Check whether FlashcardSet already has a `tags` field — if not, add it
- Add compound indexes on `(visibility, publicMeta.madePublicAt)` and `(visibility, publicMeta.likeCount)` — read how existing indexes are defined in the schemas and match the pattern

---

### Backend Endpoints

**DISC-3** `feat: add visibility change endpoints for notes and flashcard sets`
Branch prefix: `feat/`
- Read the existing share/visibility endpoints on Note and FlashcardSet before implementing
- If these endpoints already exist, extend them to handle `'public'` — do not create duplicates
- Populate `publicMeta` defaults when setting to public, including `madePublicAt`
- Generate the correct activity event on publish — read `activity.service.js` before adding a new event type
- Return 403 for non-owners, 400 for invalid enum values

**DISC-4** `feat: add discover feed endpoints for notes and flashcard sets`
Branch prefix: `feat/`
- Read the existing list endpoints for notes and flashcard sets — understand the pagination, filter, and sort patterns before implementing
- `GET /api/discover/notes` and `GET /api/discover/flashcard-sets`
- Only return `visibility: 'public'` and `deletedAt: null`
- Support `q`, `subject`, and `sort` params
- Use the existing MongoDB text index if it covers the query — read the existing index definitions before deciding whether to create new ones
- Use the existing pagination pattern exactly

**DISC-5** `feat: add public view endpoints with async view count increment`
Branch prefix: `feat/`
- `GET /api/discover/notes/:id` and `GET /api/discover/flashcard-sets/:id`
- Returns 404 for non-public items — do not leak existence
- Increments `viewCount` with a non-blocking `updateOne` after sending the response
- Response includes owner username and avatar via the existing `userSnapshot` pattern — read Comment schema for the pattern
- AI summary included in response — visible to all viewers, not just owner

**DISC-6** `feat: add save endpoints for public notes and flashcard sets`
Branch prefix: `feat/`
- `POST /api/discover/notes/:id/save` and `POST /api/discover/flashcard-sets/:id/save`
- Read the existing note creation and flashcard set creation endpoints — the save endpoint creates a copy using the same service functions
- New document: `userId` = saving user, `visibility: 'private'`, `savedFrom` = original ID
- For flashcard sets: bulk-insert Flashcard copies with new setId, clear `userProgress` arrays
- Increment `saveCount` on original atomically with `$inc`
- Read the existing bulk insert pattern for flashcards before implementing

**DISC-7** `feat: add like toggle endpoints for public content`
Branch prefix: `feat/`
- Read the existing like implementation on notes and flashcard sets — the pattern may already exist for friends-shared content
- If a like pattern already exists, extend it to work on public content — do not duplicate
- Toggle: add userId to likes array and increment `likeCount`, or remove and decrement
- Owner cannot like own content (400)
- `likeCount` never goes below zero

**DISC-8** `feat: add comment and reply support for public content`
Branch prefix: `feat/`
- Read the existing Comment schema and comment endpoints completely before adding anything
- Public comments use the same polymorphic Comment model (`targetId`, `targetType`, `parentId`)
- If the existing comment endpoints already handle any `targetType`, extend them — do not create new comment endpoints
- New top-level comments blocked on private content (400 or 403 — match existing error convention)
- Replies within existing threads still allowed for prior participants after content goes private
- Read the existing comment notification types (`comment_added`, `comment_reply`) and reuse them

**DISC-9** `feat: add thread access endpoint for prior commenters`
Branch prefix: `feat/`
- `GET /api/discover/threads/:targetType/:targetId`
- Returns full comment thread regardless of current visibility
- Prior engagement check: user has at least one comment in the thread or has a notification referencing this targetId/targetType — read the notification schema before implementing this check
- Returns 404 for users with no prior engagement
- Does not include note or flashcard content in the response — thread data only
- Notification navigation must resolve to this endpoint when the parent content is private — read the existing notification navigation data and update if needed

---

### Web UI

**DISC-10** `feat: add discover page with tabs to web social section`
Branch prefix: `feat/`
- Read the existing Social section sidebar and routing before adding a new route
- Read the existing tab component pattern — reuse it, do not create a new tab system
- Tabs: All, From Friends, Popular, Most Saved, Recent, Published (own public content)
- Published tab shows the authenticated user's own public content with engagement stats and manage controls
- Add "Discover" as a fourth item in the Social sidebar nav — read exactly how Messages, Friends, Activity are added to the sidebar and match the pattern
- Read existing list page patterns (notes list, flashcard list) and match the layout approach

**DISC-11** `feat: add public note viewer with ai summary and comments`
Branch prefix: `feat/`
- Read the existing note viewer component completely before modifying or creating a new one
- Determine whether the public viewer should be the existing viewer in read-only mode or a separate route — read the codebase and decide
- Show full note content, AI summary (visible to all), and comment thread below
- Save count shown publicly, owner sees per-item engagement stats
- Comment thread uses the existing comment component — read it before reusing

**DISC-12** `feat: add public flashcard set detail with study and save`
Branch prefix: `feat/`
- Read the existing flashcard set detail page before modifying
- "Study" button opens the existing study view with public set cards — no save required
- Study progress not recorded — read the existing study session recording code and add a guard for public sets not owned by the user
- "Save to my library" button triggers the save endpoint
- Save count shown publicly

**DISC-13** `feat: add published tab for managing own public content`
Branch prefix: `feat/`
- This is a tab within the Discover page — not a separate settings page
- Shows the authenticated user's public notes and flashcard sets
- Per-item: title, subject tag, view count, save count, like count, made-public date
- Controls: edit subject, revert to private
- Read the existing modal/inline edit patterns before implementing edit controls

**DISC-14** `feat: add make public visibility controls to note and flashcard set detail`
Branch prefix: `feat/`
- Read the existing visibility and sharing controls on note and flashcard set detail pages before modifying
- Add "Public" option to the existing visibility UI — extend it, do not replace it
- Confirmation dialog before publishing — read existing confirmation dialog pattern
- Optional subject field after confirming — pre-fills from existing tags
- Public badge appears on the card in the user's own list view

**DISC-15** `feat: update user profile page to show public content first`
Branch prefix: `feat/`
- Read the existing profile page implementation on web completely before modifying
- Reorder content sections: public content first, then shared (friends-only) content
- Creator name in Discover cards links to this existing profile page — verify the route and link work together
- Do not break any existing profile page functionality

**DISC-16** `feat: add discover step to web onboarding tour`
Branch prefix: `feat/`
- Read the existing onboarding step computation logic before adding a step
- Find the goal option that triggers the social onboarding path — read the code, do not guess
- Add Discover step after the existing social steps (Friends, Messages, Activity)
- Highlights the Discover sidebar nav item using the existing portal-rendered backdrop and pulsing ring pattern
- Skippable like all other steps
- Add to the "Show me everything" tour if it exists
- Verify the replay tour (accessible from Profile) includes the new step

---

### Android UI

**DISC-17** `feat: add discover screen to android social navigation`
Branch prefix: `feat/`
- Read the existing Android nav graph and bottom nav definition before modifying
- Read where Social screens (Messages, Friends, Activity) currently live in the nav graph
- Add Discover screen to the Social section following the existing navigation pattern
- Do not restructure the bottom nav — fit Discover into the existing nav without requiring a nav overhaul
- Horizontal scrollable tab row (All, From Friends, Popular, Most Saved, Recent, Published) using `ScrollableTabRow` or the existing tab pattern

**DISC-18** `feat: add public content card and detail screens on android`
Branch prefix: `feat/`
- Read existing Android list card components (note cards, flashcard set cards) before creating public content cards
- Single column feed layout — match the existing list screen pattern
- Detail screen for public notes: read-only, shows AI summary, comment thread as bottom sheet
- Detail screen for public flashcard sets: shows cards, save/like/study actions

**DISC-19** `feat: add study without saving flow for public flashcard sets on android`
Branch prefix: `feat/`
- Read the existing Android `FlashcardStudyScreen` implementation completely before modifying
- "Study" button on public flashcard set detail opens the existing study screen with public cards
- Add a guard that prevents study session recording when `savedFrom != null` or when the set is not owned by the user — read the existing session recording code to find where to add the guard
- No `FLAG_SECURE` on public content screens — public content is intentionally shareable

**DISC-20** `feat: add published management tab to android discover screen`
Branch prefix: `feat/`
- Published tab in the Android discover ScrollableTabRow
- Shows the authenticated user's public content with engagement stats
- Edit subject and revert to private controls — match the Android bottom sheet pattern for inline edits

**DISC-21** `feat: add make public controls to android note and flashcard detail`
Branch prefix: `feat/`
- Read the existing Android note detail and flashcard set detail screens before modifying
- Find the existing visibility/sharing controls and extend them with a "Public" option
- Confirmation bottom sheet before publishing
- Subject input in the same bottom sheet

**DISC-22** `feat: update android profile screen to show public content first`
Branch prefix: `feat/`
- Read the existing Android `UserProfileScreen` implementation completely before modifying — it already handles demo mode, tour replay, and profile editing
- Reorder content sections to show public content first
- Creator name in Android discover cards navigates to this screen

**DISC-23** `feat: add discover step to android onboarding tour`
Branch prefix: `feat/`
- Read the existing Android onboarding `TourOverlay` composable and `OnboardingViewModel` before adding a step
- Add Discover step after the existing social steps
- Highlight the Discover nav destination using the existing tour overlay pattern
- Skippable, included in replay tour

---

### Seed Data

**DISC-24** `test: add 15 seeded community users with friendships`
Branch prefix: `test/`
- Read every existing seed script before writing anything — find the exact file paths, data format, and how users are created
- Read how the demo user and Justin account are identified — do not guess userIds
- Create 15 seeded community users with the profiles listed in the spec
- At least 8 must be accepted friends with both Justin and the demo account — read the existing friendship seeding pattern and match it exactly
- Check for name conflicts with existing seeded users

**DISC-25** `test: seed 75 public notes across all subjects and users`
Branch prefix: `test/`
- Read existing note seed data format before creating new entries
- 75 public notes minimum with the subject distribution in the spec
- `madePublicAt` spread across the past 8 months — generate realistic timestamps
- Deliberate three-tier engagement distribution — not random numbers
- Every title and content must read as real student content — no placeholder text

**DISC-26** `test: seed 60 public flashcard sets with card content`
Branch prefix: `test/`
- Read existing flashcard set and flashcard seed data format before creating
- 60 public flashcard sets minimum with 12 to 30 cards each
- Real front/back content on every card — no placeholder text
- At least half of Justin and demo account sets marked `isAIGenerated: true`
- Same deliberate engagement distribution as notes

**DISC-27** `test: seed likes and comments on public discover content`
Branch prefix: `test/`
- Read how existing likes and comments are seeded before adding new seed data
- Add realistic likes from seeded users on high-engagement items
- Add realistic comments (2 to 5 per high-engagement item) from different seeded users
- Comments must read as real student discussion — not placeholder text
- This makes the comment thread feature testable immediately on first load

---

### Tests

**DISC-28** `test: add backend tests for all discover endpoints`
Branch prefix: `test/`
- Read all existing backend test suites before writing
- Cover every endpoint listed in the Testing Requirements section
- Use `createPublicNote` and `createPublicFlashcardSet` test helpers — read existing test helpers and match the pattern before creating new ones

**DISC-29** `test: add privacy regression tests for visibility changes and threads`
Branch prefix: `test/`
- These are separate from the general endpoint tests because of their importance
- Every privacy rule in the spec must have an explicit test
- Visibility revert removes item from discover feed
- Comments survive visibility change
- Prior commenter can access thread after going private
- Non-commenter cannot access thread after going private
- Saved copies unaffected by original going private
- Notification navigation resolves to thread view for private content

**DISC-30** `test: add web vitest unit tests for discover components`
Branch prefix: `test/`
- Read existing Vitest test files before writing
- Tab rendering and switching, save/like state, public badge, visibility toggle, confirmation dialog, thread-only view

**DISC-31** `test: add playwright e2e tests for discover flows`
Branch prefix: `test/`
- Read existing Playwright spec files before writing
- New spec file for discover
- Feed loads, search, filters, tabs, study without saving, save to library, like toggle, make public flow, revert to private, onboarding step

**DISC-32** `test: add android viewmodel and repository tests for discover`
Branch prefix: `test/`
- Read existing Android MockK test files before writing
- DiscoverViewModel and DiscoverRepository unit tests
- Study session guard test for public sets

---

### Docs

**DISC-33** `docs: update api docs swagger schema docs and readmes for discover`
Branch prefix: `docs/`
- Read the existing docs directory structure before updating
- Swagger annotations on all new route files
- Schema docs for new fields: publicMeta, savedFrom, saveCount, likeCount, tags on FlashcardSet
- Backend README if it lists route groups
- Android architecture doc if it describes the nav graph or screen inventory

## Codebase Investigation — Read Before Writing Anything

This is the most important section in the spec. Claude Code must investigate the following before writing a single line of implementation code, schema change, seed entry, or test. Do not assume any field names, file paths, function names, patterns, or existing behavior. Read the actual codebase.

1. **The Note and FlashcardSet schemas.** Find the exact field names, enum values, and validation on the `visibility` field. Search the entire codebase for every location that references the visibility enum — controllers, middleware, services, tests — and list them before changing anything.
2. **The existing comment system.** Find the Comment schema, the comment endpoints, and how `targetId` and `targetType` are used. The public comment system extends this, not replaces it.
3. **The existing like system.** Find where likes are stored today. Understand the exact data shape before building public likes.
4. **The existing notification system.** Read the 8 notification types, how `targetId` and `targetType` are stored, and how the frontend navigates from a notification to the correct screen. The privacy-aware navigation described in this spec depends on this.
5. **The existing activity feed.** Read `activity.service.js` and understand how activities are created, what event types exist, and what `visibleTo` contains.
6. **The existing seed scripts.** Find every seed file, read the full data format, understand how the demo user and Justin account are identified, and understand how existing notes, flashcard sets, users, and friendships are seeded. Match this pattern exactly.
7. **The existing onboarding flow.** Find the onboarding step definitions — the goal-based flow, the step computation logic, and how the tour overlay works on web and Android. The Discover step must integrate into this without breaking existing steps.
8. **The Android navigation structure.** Read the bottom nav definition, the sidebar structure, and where Social screens live in the Android nav graph. Discover must fit into the existing navigation without requiring a nav restructure.
9. **The existing pagination pattern.** Find the cursor or offset pattern used on notes, flashcard sets, and tasks. Use the same pattern on all Discover endpoints.
10. **The existing test suite structure.** Read at least two existing test suite files to understand setup, teardown, helper functions, assertion style, and mock patterns before writing a single new test.

If anything discovered in the codebase conflicts with this spec, surface the conflict and ask before proceeding. The codebase is the source of truth on existing behavior.

---

## What This Is

A new authenticated page called **Discover** in the Social section of the app. Students who choose to make their notes or flashcard sets public can be found here by every Continuum user. Other students can browse, search, study, like, comment, save, and reply — all without leaving Continuum.

This is the Quizlet content library built natively into a product that also has AI generation, task management, and career tools. The difference is that Continuum's public content feeds directly into the same AI pipeline — a student saves a public note and immediately generates their own flashcards from it.

---

## Visibility Model

```
private   — only the owner sees it (current default, unchanged)
friends   — owner and accepted friends see it (current sharing, unchanged)
public    — any authenticated Continuum user can discover and engage with it (new)
```

Public is opt-in. Nothing becomes public without an explicit owner action. The default for all new content remains private.

The owner can revert from public to private or friends at any time. When reverted:
- The content disappears from Discover immediately for non-owners
- Saves already made by other users are unaffected (they own their copies)
- Likes and comments are preserved and never deleted
- Prior commenters can still access the thread in a limited view (see Comments section)

---

## Schema Changes

### Note and FlashcardSet: extend visibility enum

Add `'public'` to the enum on both schemas. This is additive — no migration needed, no existing documents affected. Claude Code must find every validation, permission check, and enum reference in the codebase before making this change.

### New embedded object: publicMeta

Populated when visibility is set to public. Stores everything needed for discovery and sorting without a separate query.

```js
publicMeta: {
  subject:      String,   // "Organic Chemistry", "Data Structures" — user-entered, optional
  likeCount:    Number,   // denormalized for sort, default 0
  saveCount:    Number,   // incremented on every save, default 0
  viewCount:    Number,   // incremented on every view, default 0
  madePublicAt: Date,     // when visibility was set to public
}
```

### Note and FlashcardSet: savedFrom field

Add `savedFrom: ObjectId` (ref Note or FlashcardSet) to both schemas. Set when a user saves a public item. Null on original content.

### Tags field on FlashcardSet

Notes already have `tags`. Check whether FlashcardSet has `tags`. If not, add it — it is the subject tagging mechanism for discovery filters.

---

## New Endpoints

All endpoints require authentication. No anonymous access.

**Visibility:**
- `PUT /api/notes/:id/visibility`
- `PUT /api/flashcard-sets/:id/visibility`

Accept `{ visibility: 'public', publicMeta: { subject: '' } }`. Populate `publicMeta` defaults on public. Follow the existing share endpoint pattern.

**Discovery feeds:**
- `GET /api/discover/notes`
- `GET /api/discover/flashcard-sets`

Query params: `q` (search), `subject` (filter), `sort` (recent / popular / saved). Pagination follows the existing pattern. Only return `visibility: 'public'` and `deletedAt: null`.

**Public view:**
- `GET /api/discover/notes/:id`
- `GET /api/discover/flashcard-sets/:id`

Returns 404 for non-public items. Increments `viewCount` asynchronously. Response includes owner username and avatar via the existing `userSnapshot` pattern — do not populate the full User document.

**Save:**
- `POST /api/discover/notes/:id/save`
- `POST /api/discover/flashcard-sets/:id/save`

Creates a private copy in the saving user's library. Sets `savedFrom`. Increments `saveCount` on the original atomically with `$inc`. For flashcard sets: copies all Flashcard documents with new setId, clears `userProgress` arrays.

**Like toggle:**
- `POST /api/discover/notes/:id/like`
- `POST /api/discover/flashcard-sets/:id/like`

Toggle. Uses the existing likes array pattern on the document. Updates `publicMeta.likeCount` with `$inc` / `$dec`. Owner cannot like their own content.

**Thread access after going private:**
- `GET /api/discover/threads/:targetType/:targetId`

Returns the full comment thread regardless of current visibility, but only for users with prior engagement (at least one comment in the thread or a notification referencing it). Returns 404 for users with no prior engagement. Note/flashcard content is not included in this response — only the thread. Claude Code must determine the most elegant prior-engagement check given the existing data model.

---

## Comments, Likes, and Replies

Any authenticated user can like, comment, and reply on public content.

**Likes** — toggle, one per user per item. Denormalized `likeCount` on `publicMeta`. Read and extend the existing like implementation.

**Comments and replies** — use the existing polymorphic Comment schema (`targetId`, `targetType`, `userId`, `content`, `parentId`). Read the schema and endpoints before building. Do not create a new comment system.

**When content goes private:**
- Likes preserved, no new likes allowed
- Comments preserved, never deleted on a visibility change
- Prior commenters can access the thread via activity history via the thread endpoint
- Thread view shows: comment thread fully interactive, note/flashcard content replaced with "This content is no longer public"
- New top-level comments blocked, replies within existing threads still allowed for prior participants
- Notifications about comments on now-private content navigate to the thread view, not a 404

---

## Web UI

Discover lives in the sidebar under Social, as a fourth item below Messages, Friends, and Activity. Read the existing sidebar component before adding the nav item to match the exact pattern.

**Layout:**
- Full-width page with a sticky search bar and tab row at the top
- 2-column card grid on desktop, 1-column on tablet breakpoint
- Left rail optional: subject filter chips that update the active query
- Cards show: title, creator avatar and username, subject tag if set, save count (public), like count, content type badge (Note or Flashcard Set)
- Tapping or clicking a creator's name navigates to their existing Continuum profile page — read the existing profile page implementation before modifying it
- Profile page updated to show public content first, then shared (friends-only) content, then the rest
- Hover state on cards shows a quick-action row: Study (flashcard sets only), Save, Like

**Tabs:** All, From Friends, Popular, Most Saved, Recent, Published (owner's own public content with engagement stats) — displayed as a horizontal tab row. Tab changes update the sort/filter on the existing query. The Published tab is always present but only meaningful to the authenticated user — it shows only their own public content with view count, save count, and like count per item, plus controls to edit subject or revert to private. Read the existing tab component pattern in the codebase and reuse it.

**Note viewer in Discover:**
- Opens in a right panel or full-page route (Claude Code decides based on existing note viewer patterns)
- Read-only for non-owners — no editing affordances
- Shows full note content, the AI-generated summary if one exists (visible to all viewers, not just the owner), and the comment thread below
- Save count shown publicly. Full list of who saved is not shown.
- Owner sees an edit button, visibility controls, and per-item engagement stats (views, saves, likes)
- Regenerating the AI summary is owner-only

**Flashcard set in Discover:**
- Opens in a detail page showing card count, subject, creator, save/like counts
- "Study" button opens the existing flashcard study view directly — no save required
- Progress from studying public sets is not saved (no point tracking progress on content you do not own)
- "Save to my library" button saves a copy

**Making content public from note/set detail:**
- Extend the existing visibility/sharing UI — read how it currently works before changing it
- Add "Public" option with one-line explanation
- Confirmation dialog before publishing
- Optional subject field after confirming — pre-fills from existing tags
- Public badge appears on the card in the user's own library list

---

## Android UI

**Navigation placement:**
Read the existing Android bottom nav and nav graph before deciding where Discover lives. The current bottom nav has 5 items. Options: add Discover as a tab within the existing Social screen (if Social is a nested nav), or surface it from a menu/fab within the Social section. Claude Code must read the nav graph and make the best fit decision. Do not restructure the bottom nav without explicit approval.

**Layout:**
- Single column vertical feed — cards stack like Instagram posts, not a grid
- Each card: title, creator avatar and username, subject tag, save count, like count, content type chip
- Horizontal scrollable tab row at the top (All, From Friends, Popular, Most Saved, Recent, Published) — use Material 3 `ScrollableTabRow` or the existing tab component pattern in the Android codebase. Published tab shows the user's own public content with engagement stats and management controls.
- Filter is a bottom sheet: subject chips — triggered by a filter icon in the top bar
- Pull to refresh following the existing pattern in the codebase

**Study without saving:**
- Tapping a flashcard set opens the existing `FlashcardStudyScreen` directly using the public set's cards
- Study progress is not recorded (read the existing study session recording code and add a guard for public sets not owned by the user)
- No `FLAG_SECURE` on public content screens — public content is intentionally shareable

**Saving:**
- "Save" button on the card or detail screen
- Triggers the existing save flow — read how the Android app handles mutations before implementing
- Optimistic UI update following the existing `onMutate` pattern

**Comments:**
- Comment thread appears as a bottom sheet on the detail screen
- Follows the existing comment UI pattern in the Android codebase — read it before building
- Reply within the sheet using the existing reply input component if one exists

**Making content public on Android:**
- Extend the existing visibility controls in the note detail and flashcard set detail screens
- Read exactly how visibility is currently shown and toggled on Android before adding the public option
- Confirmation bottom sheet before publishing
- Optional subject input in the same sheet

---

## Onboarding Integration

Read the existing onboarding flow implementation on both web and Android before touching anything. Specifically:
- Find the goal-based step computation logic
- Find which goal option triggers the social/community onboarding path (Claude Code will know which one from reading the code)
- Find how the existing tour overlay renders on web (portal-rendered backdrop, pulsing ring) and Android (TourOverlay composable)

When a user selects the goal option that currently leads to the social onboarding path, add a Discover step to that sequence. The step should:
- Highlight the Discover nav item (web: sidebar item; Android: wherever Discover lives in the nav)
- Show coach mark copy: "Find notes and flashcard sets shared by other students. Study, save, and like content — all in one place."
- Be skippable like all other tour steps
- Come after the existing social steps (Friends, Messages, Activity) in the sequence — do not reorder existing steps

Also add Discover to the "Show me everything" goal tour if one exists — check the codebase.

The replay tour (available from Profile on both platforms) must include the Discover step.

---

## Seed Data

**This section is the highest priority after the core feature works. Read every instruction carefully and do not skip any step.**

### Before writing a single seed entry

Claude Code must:
1. Read every existing seed file in the codebase — find the exact file paths, do not guess
2. Read how the demo user and Justin account are identified in seed scripts — read the code, do not assume userIds
3. Read the exact fields required on Note and FlashcardSet seed entries — no extra fields, no missing required fields
4. Read how existing flashcard seed entries structure front/back card data
5. Read how existing friendships are seeded — match the exact pattern
6. Run through the existing seed data mentally to understand what already exists before adding new data so nothing conflicts

If any of the above is unclear, surface the question before writing seed data.

### Scale requirement — 100+ items minimum

The Discover feed must look like a real, active student platform. The seed data volume must be large enough that:
- The paginated feed has at least 4 to 5 pages of content
- All sort modes return meaningfully different orderings
- The subject filter returns at least 8 to 10 results for every major subject
- The From Friends tab shows content from at least 5 different friends
- Search returns results for any common college subject keyword
- No filter, sort, or tab combination hits an empty state during development and testing

### Seeded community users — 15 users minimum

Create 15 distinct seeded users with public content. At least 8 must be accepted friends with the Justin account and the demo account so the From Friends tab is populated.

Each user needs: realistic first name, last name, username (college-student style — no user1, user2), avatar via the existing seeding approach, and a subject focus area. Read the existing seeded users to avoid name conflicts.

Suggested profiles — Claude Code adjusts based on what already exists:

| Name | Username | Subject focus |
|---|---|---|
| Sofia Rodriguez | sofia.r | Psychology, Sociology |
| Marcus Johnson | marcus.j | Economics, Finance |
| Priya Patel | priya.p | Biology, Organic Chemistry |
| Ethan Kim | ethan.k | Computer Science, Algorithms |
| Aisha Williams | aisha.w | Political Science, History |
| Jordan Chen | jordan.c | Linear Algebra, Calculus |
| Taylor Brooks | taylor.b | English Literature, Writing |
| Nadia Hassan | nadia.h | Neuroscience, Biology |
| Caleb Torres | caleb.t | Data Structures, Systems |
| Emma Fischer | emma.f | Accounting, Business |
| Dev Sharma | dev.s | Machine Learning, Statistics |
| Olivia Park | olivia.p | Art History, Philosophy |
| Ryan Mitchell | ryan.m | Physics, Engineering |
| Zoe Campbell | zoe.c | Environmental Science, Geography |
| Liam Nguyen | liam.n | Computer Networks, Security |

### Public notes — 75 minimum total

Distribution:
- Justin account: 15 public notes (senior CS student, algorithms, systems, data structures, compilers)
- Demo account: 20 public notes (broad subjects — showcase the range of the platform)
- 15 seeded community users: 2 to 4 notes each in their subject area

Subject coverage — at least 5 public notes per subject across all users:
- Algorithms and Data Structures
- Computer Systems and Networks
- Organic Chemistry
- Biology and Neuroscience
- Economics and Finance
- Linear Algebra and Calculus
- Psychology and Sociology
- Political Science and History
- English Literature
- Machine Learning and Statistics
- Business and Accounting
- Philosophy and Art History
- Physics and Engineering
- Environmental Science

Each note must have:
- A specific, realistic title. Not "Study Notes" — something like "Dijkstra's Algorithm — Step by Step with Examples" or "Krebs Cycle — Every Step and Why It Matters"
- Realistic content length — at minimum match what existing seed notes contain. Read them first.
- A subject tag
- `madePublicAt` spread across the past 8 months so Recent sort shows a real timeline — not all the same date
- Deliberate saveCount and likeCount distribution (see below)
- viewCount significantly higher than saveCount

### Public flashcard sets — 60 minimum total

Distribution:
- Justin account: 12 to 15 public sets (CS-focused, at least half `isAIGenerated: true`)
- Demo account: 15 to 18 public sets (broad subjects)
- 15 seeded community users: 2 to 3 sets each

Each set must have:
- A specific title — "Organic Chemistry: Functional Groups and Reactions," not "Chemistry Flashcards"
- 12 to 30 cards per set. Read existing flashcard seed data to match the format exactly.
- Real front and back content. Every card must pass the test: could a real student have written this? Examples of acceptable content:
  - Front: "What is dynamic programming?" / Back: "An optimization technique that solves complex problems by breaking them into overlapping subproblems and storing results to avoid redundant computation."
  - Front: "Carbonyl group" / Back: "A functional group with a carbon atom double-bonded to an oxygen atom (C=O). Present in aldehydes, ketones, carboxylic acids, and esters."
  - Front: "Opportunity cost" / Back: "The value of the next best alternative forgone when making a decision. Central to economic reasoning — every choice has a cost."
- `isAIGenerated: true` on at least half of Justin and demo account sets
- `madePublicAt` spread across the past 8 months
- Deliberate engagement distribution (see below)

### Engagement distribution — deliberate, not random

Do not use random numbers. Seed a deliberate three-tier distribution:

**Top tier — 8 to 10 items** (the platform hits that dominate Popular sort):
- saveCount: 180 to 400
- likeCount: 90 to 220
- viewCount: 800 to 2000

**Middle tier — 30 to 40 items** (solid, useful content):
- saveCount: 25 to 120
- likeCount: 12 to 70
- viewCount: 100 to 500

**Long tail — the rest** (newer or niche content):
- saveCount: 1 to 20
- likeCount: 0 to 15
- viewCount: 5 to 80

Vary numbers within each tier. No two items should have the same saveCount. Distribute the top-tier items across different users and subjects — do not cluster all popular items on one user.

### Seed quality rule — non-negotiable

Every title, every note body paragraph, every flashcard front and back must read as if a real college student wrote it. If it reads like placeholder text, lorem ipsum, or a generic description, replace it. The Discover feed is the first impression of Continuum's social layer. Poor seed content makes the feature feel unfinished regardless of how well the code works.

Before finalizing seed data: read through every seeded title and ask — would a student share this? Would another student want to save or study from this? If the answer is no for any item, replace it before committing.

---

## Testing Requirements

Claude Code must read all existing test suites before writing a single new test. Match the exact test structure, setup and teardown pattern, assertion style, and helper function approach already in the codebase.

### Backend tests

**Visibility change endpoints** — test that:
- Setting to public populates `publicMeta` with correct defaults and `madePublicAt`
- Reverting to private excludes the item from discover feed immediately
- Returns 403 for non-owners, 404 for missing items, 400 for invalid enum values
- Auth middleware rejects unauthenticated requests
- Subject can be updated while already public
- Correct activity event generated on publish

**Discovery feed endpoints** — test that:
- Only public, non-deleted items returned
- Correct pagination shape matching existing pattern
- `q`, `subject`, and `sort` params work correctly and independently
- All three sort modes return different orderings when data supports it
- Auth middleware rejects unauthenticated requests

**Save endpoints** — test that:
- Creates a new owned document with `visibility: 'private'` and `savedFrom` set
- `saveCount` incremented atomically on original
- Flashcard copies have cleared `userProgress`
- Saving private content returns 404
- Auth middleware rejects unauthenticated requests

**Like toggle** — test that:
- First call adds userId to likes, increments `likeCount`
- Second call removes userId, decrements `likeCount`
- Owner cannot like own content (400)
- `likeCount` never goes below zero
- Auth middleware rejects unauthenticated requests

**Comment and thread endpoints** — test that:
- Comments can be added to public content
- Comments cannot be added to private content
- Replies can be added by prior participants after content goes private
- New top-level comments blocked on private content
- Thread endpoint returns thread for prior commenters regardless of visibility
- Thread endpoint returns 404 for users with no prior engagement
- Thread endpoint does not include note/flashcard content when item is private

**Privacy regression tests — most important:**
- Public note reverted to private does not appear in discover feed
- Public note reverted to private returns 404 from public view endpoint for non-owners
- Saved copy remains accessible to saving user after original goes private
- Comments not deleted when visibility changes
- Prior commenter can access thread after content goes private
- Non-commenter cannot access thread after content goes private
- Notifications about comments on private content resolve to thread view, not 404
- Likes preserved and `likeCount` unchanged after going private
- New likes blocked on private content
- `saveCount` unchanged after going private (existing saves remain)

**Permission isolation tests:**
- User A cannot change visibility on User B's content
- User A cannot access User B's private content via discover endpoints
- Unauthenticated requests to all discover endpoints return 401

### Web tests

**Vitest unit tests:**
- Discover page renders correct tabs
- Tab switching updates the active query
- Save button shows correct state
- Like button toggles with optimistic update
- Save count and like count display correctly
- Public badge renders on cards in user's own library when visibility is public
- Visibility toggle shows correct current state
- Confirmation dialog renders before making content public
- Thread-only view renders correctly when content is private (content replaced, thread visible)

**Playwright E2E tests:**
- Discover page loads with content cards
- Search filters results
- Subject filter works
- Tab switching works for all tabs
- Flashcard study opens without saving
- Save button adds item to library
- Like toggles and count updates
- Making note public: confirmation dialog appears, public badge shows in library, note appears in Discover
- Reverting to private: note disappears from Discover
- Thread-only view accessible from activity after content goes private
- Onboarding Discover step renders and is skippable
- Onboarding replay includes Discover step

### Android tests

Add ViewModel and Repository unit tests following the existing MockK pattern. Claude Code must read existing ViewModel and Repository test files before writing new ones.

- `DiscoverViewModel` loads public content, handles search, handles tab/filter changes
- `DiscoverViewModel` handles save action with optimistic update
- `DiscoverViewModel` handles like toggle with optimistic update
- `DiscoverRepository` calls correct endpoints and maps to existing data classes
- Error states surface correctly
- Study mode opens without triggering save logic
- Prior-engagement thread access handled correctly by ViewModel

### Test data helpers

Create `createPublicNote` and `createPublicFlashcardSet` helpers in the test utilities following the existing helper pattern. Accept optional overrides for `saveCount`, `likeCount`, `subject`, `madePublicAt`, and `ownerId` to make sorted and filtered test scenarios easy to set up without repeating boilerplate.

---

## Documentation

After implementation, Claude Code must update all relevant documentation. Read the existing docs directory structure before updating anything — match the existing format exactly.

At minimum update:
- API reference docs for all new Discover endpoints
- Backend README if it lists route groups
- Schema docs for `publicMeta`, `savedFrom`, `saveCount`, `likeCount`, `tags` on FlashcardSet
- Swagger/OpenAPI annotations on all new route files
- Seed script documentation if any exists
- Android architecture doc if it describes the nav graph or screen inventory

---

## Product Decisions

These have been decided by the owner. Claude Code implements these as specified — do not deviate.

**AI summary visibility on public notes.**
All viewers see the AI-generated summary on a public note, not just the owner. A public note without its summary is a wall of text — the summary is what makes the content immediately useful to someone discovering it. Viewing an existing summary costs nothing. Regenerating the summary is owner-only since it consumes Groq quota.

**Creator profiles.**
Tapping a creator's name in Discover navigates to their existing Continuum profile page. Do not build a separate Discover-scoped profile view. The existing profile page must be updated to show public content first, then shared content (friends-only shared notes and sets). Claude Code must read the existing profile page implementation on both web and Android before modifying it to understand what is currently shown and in what order.

**Public content management.**
A dedicated management tab lives inside the Discover page — not in settings. Settings is for account configuration. This tab shows everything the authenticated user has made public: each item with its engagement stats (view count, save count, like count), the subject tag, when it was made public, and controls to edit the subject or revert to private. Tab label suggestion: "Your Public Content" or "Published" — Claude Code can assess what fits the existing tab naming convention in the codebase.

This tab is only visible to the authenticated user for their own content. It does not appear for other users viewing Discover.

**Content moderation.**
No report or flag mechanism in V1. Backlogged for a future release. Do not build moderation infrastructure speculatively.

**Save count visibility.**
The save count (number) is shown publicly on every content card and detail page in Discover — any viewer can see it. The full list of who saved the content is private, visible only to the owner. Do not build a "saved by" user list in V1.
