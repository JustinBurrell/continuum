# Continuum — Forum Feature

## Overview

The Forum feature adds a Reddit-style community layer to Continuum, allowing students to create and join topic-based forums where they can post, vote, comment, and share academic resources. Unlike Reddit, forums in Continuum are deeply integrated with the rest of the platform — students can attach notes and flashcard sets directly to posts, and other students can save those resources straight into their own library.

Forums exist alongside the existing friends-only sharing model. Where friends-based sharing is closed and personal, forums are open communities organized around courses, subjects, schools, and career topics.

---

## GitHub Workflow — Read Before Writing Any Code

### Step 0: Branch and issues first

Before writing a single line of feature code, Claude Code must:

1. Checkout main and pull the latest: `git checkout main && git pull origin main`
2. Create the feature branch: `git checkout -b feat/FORUM-forums`
3. Use the `gh` CLI to create a GitHub issue for every ticket listed below, attaching each to the "Continuum Development Board" project
4. Only after all issues are created, begin implementing ticket by ticket

**Creating an issue and attaching to the project:**
```bash
# Create issue
gh issue create \
  --title "FORUM-1: feat: add Forum ForumPost and ForumMembership models" \
  --body "..." \
  --label "feat"

# Get project number (run once):
gh project list --owner JustinBurrell

# Attach issue to project:
gh project item-add PROJECT_NUMBER --owner JustinBurrell --url ISSUE_URL
```

Read the existing agile workflow guide in the repo before running any `gh` commands. Match the existing label names exactly — do not create new labels.

### Step 1: One commit per ticket

Each ticket below maps to exactly one commit. The commit message must match the format in the ticket exactly. Do not include `Closes #N` in the commit message — issue closing happens in the PR body.

### Step 2: PR at the end

One PR for the entire forum branch. Title follows the agile guide format. The PR body must include `Closes #N` for every single issue created in Step 0 — one line per issue. GitHub will auto-close all of them on merge.

### Step 3: Read the codebase before every ticket

The existing implementation is the baseline. The Comment model already exists and is polymorphic. The activity service already has event types. The Note visibility enum is either already extended (if the Discover PR merged first) or needs to be extended here. The userSnapshot pre-save pattern already exists on Comment. Read all of these before touching them.

For every ticket, before writing the implementation:
- Find and read the relevant existing code
- Understand the existing pattern
- Match it exactly in the new code

If anything in the codebase conflicts with this spec, surface the conflict and ask before proceeding.

---

## Ticket Breakdown — Forum PR

Listed in implementation order. One commit per ticket.

### Models

**FORUM-1** `feat: add Forum ForumPost and ForumMembership models`
Branch prefix: `feat/`
- Read every existing model file before creating new ones — match the exact schema definition style, index definition pattern, and export convention
- Read `Comment.js` specifically — `ForumPost` uses the same `userSnapshot` pre-save hook pattern
- Create `backend/models/Forum.js`, `backend/models/ForumPost.js`, `backend/models/ForumMembership.js` with the exact schemas defined in this spec
- Slug auto-generation on Forum pre-save: lowercase, spaces to hyphens, strip special characters
- ForumPost pre-save: snapshot `userSnapshot` on creation using the same pattern as `Comment.js`
- Compound unique index on ForumMembership `(userId, forumId)` prevents duplicate memberships
- All three models use soft delete (`deletedAt`) following the existing convention

**FORUM-2** `feat: extend comment targettype enum and note visibility and activity types`
Branch prefix: `feat/`
- Read `Comment.js`, `Note.js`, and `Activity.js` before touching them
- Check whether `Note.js` visibility already includes `'public'` — if the Discover PR merged first, this change is already done. Do not duplicate it.
- Add `'forumPost'` to `Comment.js` `targetType` enum
- Add `'public'` to `Note.js` visibility enum if not already present
- Add `'forum_post_created'` and `'forum_joined'` to `Activity.js` type enum
- Add `'forumPost'` to `Activity.js` `targetType` enum
- Search the entire codebase for every reference to these enums before changing them — update every validation and permission check

---

### Backend — Server Registration

**FORUM-3** `feat: register forum and forumpost routes in server`
Branch prefix: `feat/`
- Read `server.js` to understand exactly how existing routes are mounted before adding new ones
- Create `backend/routes/forums.routes.js` and `backend/routes/forumPosts.routes.js` — empty route files with correct export pattern
- Create `backend/controllers/forums.controller.js` and `backend/controllers/forumPosts.controller.js` — empty controller stubs
- Mount in `server.js`: `app.use('/api/forums', ...)` and `app.use('/api/posts', ...)`
- Read the existing server.js route registration pattern and match it exactly — order of middleware matters

---

### Backend — Forum Endpoints

**FORUM-4** `feat: add forum crud and search endpoints`
Branch prefix: `feat/`
- Read the existing controller pattern (notes or tasks controller) before implementing — match the response shape `{ success: true, forum: {} }` and error handling exactly
- Read the existing auth middleware to understand how `req.user` is populated
- `POST /api/forums` — create forum, auto-generate slug, set `createdBy`, create ForumMembership with role `'moderator'` for the creator
- `GET /api/forums` — list forums with `?category=` and `?search=` filters. Use MongoDB text index on `name` for search. Pagination follows the existing pattern.
- `GET /api/forums/:slug` — get forum by slug, not by ID. Include `isMember` and `userRole` fields derived from ForumMembership for the requesting user.
- `PUT /api/forums/:id` — update name, description, rules, icon. Moderator only. Read how existing ownership/role checks are done in the codebase.
- `DELETE /api/forums/:id` — soft delete. Admin only.

**FORUM-5** `feat: add forum join leave and member endpoints`
Branch prefix: `feat/`
- Read the existing friendship endpoints — the join/leave pattern is conceptually similar
- `POST /api/forums/:id/join` — create ForumMembership, increment `memberCount` with `$inc`. Return 409 if already a member.
- `DELETE /api/forums/:id/join` — soft delete ForumMembership, decrement `memberCount` with `$inc`. Return 404 if not a member.
- `GET /api/forums/:id/members` — paginated member list. Read the existing pagination pattern before implementing.
- `GET /api/forums/feed` — aggregated posts from all forums the user has joined. Read the existing calendar aggregation endpoint as a reference for multi-source aggregation. Sort by hot score. Paginated.

---

### Backend — Post Endpoints

**FORUM-6** `feat: add forum post crud endpoints`
Branch prefix: `feat/`
- Read the existing note or task controller before implementing post CRUD — match the pattern
- `POST /api/forums/:forumId/posts` — create post. Verify the user is a member of the forum. For resource posts, verify the attached note or flashcard set belongs to the user. If the note's visibility is not `'public'`, upgrade it automatically and include `visibilityUpgraded: true` in the response.
- `GET /api/posts/:id` — get single post. Populate attached note and flashcard set if present.
- `PUT /api/posts/:id` — edit content. Author only. Read how existing author-only checks work.
- `DELETE /api/posts/:id` — soft delete. Author or moderator. Read how existing soft delete and permission checks are implemented.
- `GET /api/forums/:id/posts` — list posts with `?sort=hot|new|top` and cursor pagination. Hot sort: `score / (hoursOld + 2)^1.5` computed inline. Read the existing cursor pagination implementation before implementing this one.

**FORUM-7** `feat: add post voting endpoint`
Branch prefix: `feat/`
- Read the existing like toggle pattern on comments or notes before implementing
- `POST /api/posts/:id/vote` — body: `{ direction: "up" | "down" | "none" }`
- A user can hold only one vote at a time — if switching from up to down, remove from upvotes array and add to downvotes
- `direction: "none"` removes any existing vote
- Update `score` atomically with `findOneAndUpdate` using `$set` after computing the new score
- Score is always `upvotes.length - downvotes.length`
- Idempotent: voting the same direction twice leaves score unchanged

**FORUM-8** `feat: add moderator controls and resource save endpoints`
Branch prefix: `feat/`
- Read how moderator role is stored on ForumMembership and how to check it in a controller
- `POST /api/posts/:id/pin` — toggle `isPinned`. Moderator only.
- `POST /api/posts/:id/lock` — toggle `isLocked`. Moderator only. Locked posts return 403 on new comment creation.
- `POST /api/posts/:id/save-note` — duplicate the attached note into the requesting user's library. Read the existing note creation service and reuse it. Store `originPostId` on the copy. Return 409 if user has already saved from this post.
- `POST /api/posts/:id/save-flashcards` — duplicate the attached flashcard set and all its Flashcard documents. Read the existing flashcard set creation and bulk insert service and reuse it. Return 409 if already saved.

---

### Backend — Comment Integration

**FORUM-9** `feat: verify existing comment routes handle forumpost target type`
Branch prefix: `feat/`
- This ticket is verification, not new code
- Read `POST /api/comments` and `GET /api/comments/:targetType/:targetId` completely
- After adding `'forumPost'` to the Comment targetType enum in FORUM-2, these routes should handle forum post comments with no additional changes
- Test in Postman: create a comment with `targetType: 'forumPost'` and a valid ForumPost ID, verify storage and retrieval
- If any validation in the comment controller explicitly blocks unrecognized targetTypes, update the validation — this is the only code change allowed in this ticket
- Update `commentCount` on ForumPost when a comment is created or soft deleted — read how existing denormalized counts are maintained and add the same increment/decrement logic

---

### Web UI

**FORUM-10** `feat: add forums browse and search page to web social section`
Branch prefix: `feat/`
- Read the existing Social section sidebar and routing before adding a new route
- Read the existing page layout and list patterns (notes list, discover page) before creating the forums page
- Forums page lives in Social — add it as a nav item following the exact same pattern as Messages, Friends, Activity, and Discover
- Page shows: joined forums at the top, browseable category sections below (course, subject, school, career, general)
- Search bar filters forums by name using the existing debounced search pattern
- Each forum card shows: name, category badge, member count, joined status
- "Create Forum" button opens a creation modal or form — read the existing modal pattern

**FORUM-11** `feat: add forum detail page with post feed on web`
Branch prefix: `feat/`
- Read the existing note list and discover feed pages before creating the post feed
- Forum detail page: header with name, description, member count, join/leave button, rules sidebar
- Post feed with sort tabs (Hot, New, Top) — read the existing tab component and reuse it
- Each post card: title, post type badge, author avatar and username, vote score, comment count, timestamp
- Resource post cards show an attached note or flashcard set preview with a "Save to library" button
- Clicking author username navigates to the existing user profile page — verify the route before linking
- Pinned posts appear at the top regardless of sort

**FORUM-12** `feat: add post creation form on web`
Branch prefix: `feat/`
- Read the existing note creation and task creation forms before building the post form
- Post type toggle: Text, Resource, Link — switching changes the form fields shown
- For resource posts: a picker showing the user's own notes and flashcard sets. Read the existing notes list API and reuse it for the picker.
- Title field (required), content field (text posts and resource posts), URL field (link posts)
- Submit calls `POST /api/forums/:forumId/posts`
- If `visibilityUpgraded: true` in the response, show a notice: "Your note was made public so forum members can view it."

**FORUM-13** `feat: add post detail page with voting and comments on web`
Branch prefix: `feat/`
- Read the existing note viewer and comment thread component before building the post detail page
- Full post content, vote buttons (up/down/score), comment count
- Comment thread below the post — reuse the existing comment component with `targetType: 'forumPost'`
- Resource posts: attached note or flashcard set shown as a card with "Save to my library" and "Study" (flashcard sets only) actions
- Locked post shows a notice and disables new comment input
- Author sees an edit button. Author and moderator see a delete button.

**FORUM-14** `feat: add forum feed to web social section`
Branch prefix: `feat/`
- Read the existing activity feed implementation before building the forum feed
- Forum feed is a separate view (not the activity feed) — a chronological hot-sorted feed of posts from all joined forums
- Add "Forum Feed" as a navigation option within the Social section or as a tab within the forums page — read the existing nav structure and choose the most natural fit
- Each post card in the feed shows the source forum name as a label

**FORUM-15** `feat: add moderator controls to web forum and post ui`
Branch prefix: `feat/`
- Read the existing admin/owner control patterns (visibility controls, delete buttons) before adding moderator controls
- Forum settings page (moderator only): edit name, description, rules, icon
- Post moderator controls: pin toggle, lock toggle, delete — only visible when `userRole === 'moderator'` or `'admin'`
- Pin and lock status visible to all users (pinned badge, "Comments locked" notice)

---

### Android UI

**FORUM-16** `feat: add forums browse screen to android social navigation`
Branch prefix: `feat/`
- Read the existing Android nav graph and Social screen navigation before adding forums
- Read the existing Android list screen patterns (notes list, discover screen) before creating the forums browse screen
- Add Forums as a destination in the Social section nav — read where Messages, Friends, Activity, and Discover live in the nav graph and place Forums consistently
- Scrollable list of joined forums + category browse sections
- Forum card: name, category chip, member count, joined indicator
- Search via top bar search following the existing Android search pattern

**FORUM-17** `feat: add forum detail and post feed screen on android`
Branch prefix: `feat/`
- Read the existing Android detail screen patterns (note detail, flashcard set detail) before building
- Forum header: name, description, member count, join/leave button
- Post feed as a `LazyColumn` with sort tab row (Hot, New, Top) using the existing tab pattern
- Post card: title, post type chip, author avatar and username (navigates to profile), vote score, comment count
- Resource post cards include attached content preview with "Save" action
- Pull to refresh following the existing Android pattern

**FORUM-18** `feat: add post creation flow on android`
Branch prefix: `feat/`
- Read the existing Android note creation and task creation screens before building
- Post type selection as chips or a tab row at the top of the creation screen
- Resource type: note/flashcard picker using the existing library data (read how notes and flashcard sets are listed in other Android screens)
- If `visibilityUpgraded: true` in response, show a Snackbar or dialog notice

**FORUM-19** `feat: add post detail with voting and comments on android`
Branch prefix: `feat/`
- Read the existing Android comment implementation before building
- Vote buttons with score display — follow existing Android button patterns
- Comment thread as a `LazyColumn` below the post content — reuse the existing comment composable with `targetType: "forumPost"`
- Resource post: attached content card with Save and Study (flashcard sets) actions
- Locked post notice disables comment input

**FORUM-20** `feat: add forum feed to android social section`
Branch prefix: `feat/`
- Read existing Android social feed screens before building
- Forum feed screen showing hot-sorted posts from joined forums
- Post cards include forum name label
- Place consistently with the web forum feed in the Android Social section nav

---

### Seed Data

**FORUM-21** `test: seed forums posts memberships and votes`
Branch prefix: `test/`
- Read every existing seed script before writing — find the exact file paths and data format
- Read how the demo user and Justin account are identified — do not guess
- Read how existing seeded users are created so seeded forum members do not conflict

**Forums to seed (minimum 8):**
- `CSE 262 — Programming Languages` (course)
- `Organic Chemistry I` (course)
- `Data Structures and Algorithms` (subject)
- `Computer Science` (subject)
- `Lehigh University` (school)
- `SWE Internships 2026` (career)
- `Finance Recruiting` (career)
- `Pre-Med` (subject)

Justin and the demo account should be members of at least 5 forums each.

**Posts to seed (minimum 30 total across all forums):**
- At least 3 to 5 posts per forum
- Mix of text, resource, and link post types
- Resource posts attach notes or flashcard sets from the seeded Justin and demo accounts — verify these exist before referencing them
- Realistic titles and content — no placeholder text. Examples: "Best resources for the midterm?", "Anyone have notes from last Tuesday's lecture?", "Sharing my algo cheat sheet before finals"
- Realistic vote scores with variance (some posts at 0, some at 5 to 20, a few popular ones at 50 to 150)
- Realistic comment counts (incrementing `commentCount` to match any seeded comments)

**Comments to seed (minimum 15 across all posts):**
- Seed 2 to 4 comments on popular posts using the existing Comment model
- Realistic student discussion content
- Use seeded community users from the Discover seed data (DISC-24) as comment authors if that PR has already merged

**Memberships:**
- All seeded community users from the Discover PR should be members of at least 2 to 3 forums
- Seed realistic `joinedAt` timestamps spread across the past 6 months

---

### Tests

**FORUM-22** `test: add backend integration tests for forum lifecycle`
Branch prefix: `test/`
- Read all existing backend test suites before writing
- Match the exact test file structure, setup, teardown, and assertion style
- Forum CRUD: create, slug generation, search by name, search by category
- Membership: join, leave, double-join returns 409, memberCount incremented and decremented correctly
- Forum feed: posts from joined forums appear, posts from non-joined forums do not, leaving a forum removes its posts from the feed

**FORUM-23** `test: add backend tests for post voting resource saving and moderation`
Branch prefix: `test/`
- Post CRUD: create text post, create resource post with visibility upgrade, create link post, edit as author, edit as non-author returns 403, soft delete as author, soft delete as moderator
- Voting: upvote increases score, double upvote is idempotent, switch from up to down changes score by -2, direction none removes vote
- Resource saving: save-note creates a copy with originPostId, save-flashcards creates copies with cleared userProgress, saving twice returns 409, saving from a post with no resource returns 400
- Moderation: pin toggle works for moderator, pin returns 403 for non-moderator, lock prevents new comments (400 or 403 on comment creation)

**FORUM-24** `test: add comment regression tests for forumpost target type`
Branch prefix: `test/`
- `POST /api/comments` with `targetType: 'forumPost'` stores correctly
- `GET /api/comments/forumPost/:postId` returns the thread
- Reply via `parentId` produces correct thread structure
- Like toggle on a forum post comment works
- commentCount on ForumPost increments on comment creation and decrements on soft delete

**FORUM-25** `test: add web unit and e2e tests for forum feature`
Branch prefix: `test/`
- Read existing Vitest and Playwright test files before writing
- Vitest unit tests: forum card renders correctly, post type badge displays, vote buttons toggle state, resource post shows save button, moderator controls visible only to moderators
- Playwright E2E: browse forums, join a forum, create a text post, create a resource post (verify visibility upgrade notice), vote on a post, comment on a post, save an attached note to library, moderator pin and lock controls

**FORUM-26** `test: add android viewmodel and repository tests for forums`
Branch prefix: `test/`
- Read existing Android MockK test files before writing
- ForumsViewModel: browse, search, join, leave
- ForumDetailViewModel: load posts, sort change, vote action, join/leave
- ForumPostViewModel: load comments, create comment, vote
- ForumsRepository: all endpoints mapped correctly, error states surface

---

### Docs

**FORUM-27** `docs: update api docs swagger and readmes for forum feature`
Branch prefix: `docs/`
- Read the existing docs directory structure before updating anything
- Swagger/OpenAPI annotations on `forums.routes.js` and `forumPosts.routes.js`
- Backend README if it lists route groups
- Schema diagram update for the three new collections (Forum, ForumPost, ForumMembership)
- Note any dependency on the Discover PR (Note visibility enum, seeded community users)

---

## What a Forum Is

A forum is a named community with a specific topic. Students join forums that are relevant to them and see posts from those forums in a dedicated feed. Example forums:

- Course-specific: `CSE 262`, `Organic Chemistry I`
- Subject-area: `Computer Science`, `Pre-Med`, `Finance`
- School-specific: `Lehigh University`, `Penn State`
- Career: `SWE Internships 2026`, `Finance Recruiting`, `Resume Review`

Forums can be created by any user or designated as official (admin-verified for recognized courses and schools). Each forum has a name, description, category, icon, a set of rules, and a member count. The user who creates a forum becomes its moderator by default.

---

## Posts

A post belongs to a forum and is created by a user. There are three post types:

**Text Post** — a written question, discussion prompt, or announcement.

**Resource Post** — the key Continuum differentiator. A student attaches a note or flashcard set directly from their Continuum library. Other students viewing the post can save that note to their own library, generate flashcards from it, or link it to a task — all without leaving the forum.

**Link Post** — an external URL, useful for sharing job postings, articles, or documentation.

Posts support upvotes and downvotes. Sorting is available by hot (score + recency), new, and top. Posts can be pinned by moderators and locked to prevent further comments.

---

## Comments and Replies

Forum post comments reuse the existing `Comment` model, which is already built to be polymorphic via `targetId` and `targetType` fields. The only change needed is adding `'forumPost'` to the `targetType` enum in `Comment.js`:

```js
// Comment.js — targetType enum (current)
enum: ['note', 'flashcardSet', 'task']

// After forum feature
enum: ['note', 'flashcardSet', 'task', 'forumPost']
```

Threaded replies already work via `parentId`. Likes on comments carry over as-is. The pre-save hook that snapshots `userSnapshot` on creation also carries over unchanged.

---

## Database

Three new collections are added. Existing models require small targeted changes listed at the end of this section.

### Forum

```js
const forumSchema = new mongoose.Schema({
    name:        { type: String, required: true, unique: true, maxlength: 100 },
    slug:        { type: String, required: true, unique: true },
    description: { type: String, maxlength: 500 },
    category:    { type: String, enum: ['course', 'subject', 'school', 'career', 'general'], required: true },
    iconUrl:     { type: String },
    rules:       [{ title: String, description: String }],
    createdBy:   { type: ObjectId, ref: 'User', required: true },
    isOfficial:  { type: Boolean, default: false },
    memberCount: { type: Number, default: 0 },
    deletedAt:   { type: Date, default: null },
}, { timestamps: true });

forumSchema.index({ slug: 1 });
forumSchema.index({ category: 1 });
forumSchema.index({ name: 'text' });
```

### ForumPost

```js
const forumPostSchema = new mongoose.Schema({
    forumId:                 { type: ObjectId, ref: 'Forum', required: true, index: true },
    userId:                  { type: ObjectId, ref: 'User', required: true, index: true },
    title:                   { type: String, required: true, maxlength: 300 },
    content:                 { type: String },
    postType:                { type: String, enum: ['text', 'resource', 'link'], required: true },
    attachedNoteId:          { type: ObjectId, ref: 'Note', default: null },
    attachedFlashcardSetId:  { type: ObjectId, ref: 'FlashcardSet', default: null },
    linkUrl:                 { type: String, default: null },
    upvotes:   [{ type: ObjectId, ref: 'User' }],
    downvotes: [{ type: ObjectId, ref: 'User' }],
    score:     { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    userSnapshot: {
        username:  String,
        firstName: String,
        lastName:  String,
        avatarUrl: String,
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

forumPostSchema.pre('save', async function () {
    if (!this.isNew) return;
    const User = mongoose.model('User');
    const user = await User.findById(this.userId).select('username firstName lastName avatarUrl');
    if (user) {
        this.userSnapshot = {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
        };
    }
});

forumPostSchema.index({ forumId: 1, createdAt: -1 });
forumPostSchema.index({ forumId: 1, score: -1 });
forumPostSchema.index({ userId: 1, createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text' });
```

### ForumMembership

```js
const forumMembershipSchema = new mongoose.Schema({
    userId:               { type: ObjectId, ref: 'User', required: true },
    forumId:              { type: ObjectId, ref: 'Forum', required: true },
    role:                 { type: String, enum: ['member', 'moderator', 'admin'], default: 'member' },
    notificationsEnabled: { type: Boolean, default: true },
    joinedAt:             { type: Date, default: Date.now },
    deletedAt:            { type: Date, default: null },
}, { timestamps: true });

forumMembershipSchema.index({ userId: 1, forumId: 1 }, { unique: true });
forumMembershipSchema.index({ forumId: 1 });
```

### Existing Models — Changes

**`Note.js`** — add `'public'` to the `visibility` enum if not already added by the Discover PR.

**`Comment.js`** — add `'forumPost'` to `targetType` enum.

**`Activity.js`** — add `'forum_post_created'`, `'forum_joined'` to type enum and `'forumPost'` to targetType enum.

---

## Backend

### File Naming
- `backend/models/Forum.js`
- `backend/models/ForumPost.js`
- `backend/models/ForumMembership.js`
- `backend/controllers/forums.controller.js`
- `backend/controllers/forumPosts.controller.js`
- `backend/routes/forums.routes.js`
- `backend/routes/forumPosts.routes.js`

Mounted in `server.js`:
```js
app.use('/api/forums', require('./routes/forums.routes'));
app.use('/api/posts',  require('./routes/forumPosts.routes'));
```

### Response Shape
```json
{ "success": true, "forum": { ... } }
{ "success": false, "error": "Forum not found" }
```

### API Endpoints

#### Forums

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/forums` | Yes | Create a new forum |
| GET | `/api/forums` | Yes | List/search forums |
| GET | `/api/forums/:slug` | Yes | Get forum details |
| PUT | `/api/forums/:id` | Moderator | Update forum |
| DELETE | `/api/forums/:id` | Admin | Soft delete forum |
| POST | `/api/forums/:id/join` | Yes | Join a forum |
| DELETE | `/api/forums/:id/join` | Yes | Leave a forum |
| GET | `/api/forums/:id/members` | Yes | List members |
| GET | `/api/forums/:id/posts` | Yes | List posts with sort |
| GET | `/api/forums/feed` | Yes | Aggregated feed from joined forums |

#### Posts

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/forums/:forumId/posts` | Member | Create a post |
| GET | `/api/posts/:id` | Yes | Get single post |
| PUT | `/api/posts/:id` | Author | Edit post |
| DELETE | `/api/posts/:id` | Author/Mod | Soft delete |
| POST | `/api/posts/:id/vote` | Yes | Vote up/down/none |
| POST | `/api/posts/:id/pin` | Moderator | Toggle pin |
| POST | `/api/posts/:id/lock` | Moderator | Toggle lock |
| POST | `/api/posts/:id/save-note` | Yes | Copy attached note to library |
| POST | `/api/posts/:id/save-flashcards` | Yes | Copy attached set to library |

#### Comments (existing routes, no new endpoints)

`POST /api/comments` and `GET /api/comments/:targetType/:targetId` handle forum post comments via `targetType: 'forumPost'`.

---

## Service Logic

**Voting** — update `upvotes`/`downvotes` arrays and recalculate `score` atomically using `findOneAndUpdate`. One vote per user at a time. Score is always `upvotes.length - downvotes.length`.

**Hot sorting** — `score / (hoursOld + 2)^1.5` computed inline at query time.

**memberCount** — maintained via `$inc` on join/leave. Never recomputed from scratch.

**commentCount** — incremented on Comment creation with `targetType: 'forumPost'`, decremented on soft delete.

**Resource post visibility** — when creating a resource post, if the note's visibility is not `'public'`, the API upgrades it and includes `visibilityUpgraded: true` in the response.

**save-note / save-flashcards** — duplicates the source resource, creates a new document owned by the requesting user, stores `originPostId`. Returns 409 if already saved from this post.

---

*Last Updated: May 2026*
