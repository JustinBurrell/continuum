# Continuum — Forum Feature

## Overview

The Forum feature adds a Reddit-style community layer to Continuum, allowing students to create and join topic-based forums where they can post, vote, comment, and share academic resources. Unlike Reddit, forums in Continuum are deeply integrated with the rest of the platform — students can attach notes and flashcard sets directly to posts, and other students can save those resources straight into their own library.

Forums exist alongside the existing friends-only sharing model. Where friends-based sharing is closed and personal, forums are open communities organized around courses, subjects, schools, and career topics.

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

**Text Post** — a written question, discussion prompt, or announcement. The bread and butter of forum activity.

**Resource Post** — the key Continuum differentiator. A student attaches a note or flashcard set directly from their Continuum library. Other students viewing the post can save that note to their own library, generate flashcards from it, or link it to a task — all without leaving the forum. This is something no general-purpose forum can offer.

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

This means no new Comment infrastructure is required — the social primitives already exist.

---

## Database

Three new collections are added. Existing models require small targeted changes listed at the end of this section.

### Forum

```js
const forumSchema = new mongoose.Schema({
    name:        { type: String, required: true, unique: true, maxlength: 100 },
    slug:        { type: String, required: true, unique: true }, // url-safe, e.g. "cse-262"
    description: { type: String, maxlength: 500 },
    category:    { type: String, enum: ['course', 'subject', 'school', 'career', 'general'], required: true },
    iconUrl:     { type: String },
    rules:       [{ title: String, description: String }],
    createdBy:   { type: ObjectId, ref: 'User', required: true },
    isOfficial:  { type: Boolean, default: false }, // admin-verified for real courses/schools
    memberCount: { type: Number, default: 0 },      // denormalized — increment/decrement on join/leave
    deletedAt:   { type: Date, default: null },
}, { timestamps: true });

// Indexes
forumSchema.index({ slug: 1 });          // unique lookup by URL slug
forumSchema.index({ category: 1 });      // filter by category
forumSchema.index({ name: 'text' });     // text search
```

**Slug generation**: Auto-derive from `name` on creation (lowercase, spaces → hyphens, strip special chars). Validate uniqueness before saving.

### ForumPost

```js
const forumPostSchema = new mongoose.Schema({
    forumId:                 { type: ObjectId, ref: 'Forum', required: true, index: true },
    userId:                  { type: ObjectId, ref: 'User', required: true, index: true },
    title:                   { type: String, required: true, maxlength: 300 },
    content:                 { type: String },
    postType:                { type: String, enum: ['text', 'resource', 'link'], required: true },

    // Resource post attachments (nullable — only set for postType: 'resource')
    attachedNoteId:          { type: ObjectId, ref: 'Note', default: null },
    attachedFlashcardSetId:  { type: ObjectId, ref: 'FlashcardSet', default: null },

    // Link post (nullable — only set for postType: 'link')
    linkUrl:                 { type: String, default: null },

    // Voting — same ObjectId array pattern as Comment.likes
    upvotes:   [{ type: ObjectId, ref: 'User' }],
    downvotes: [{ type: ObjectId, ref: 'User' }],
    score:     { type: Number, default: 0 }, // denormalized: upvotes.length - downvotes.length

    // Denormalized counts (avoids join queries in list views)
    commentCount: { type: Number, default: 0 },

    // Moderation
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },

    // Denormalized author snapshot — same pattern as Comment.userSnapshot
    // Populated by pre-save hook on creation (see below)
    userSnapshot: {
        username:  String,
        firstName: String,
        lastName:  String,
        avatarUrl: String,
    },

    deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Pre-save hook — same pattern as Comment.js
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

// Indexes
forumPostSchema.index({ forumId: 1, createdAt: -1 });  // new sort
forumPostSchema.index({ forumId: 1, score: -1 });       // top sort
forumPostSchema.index({ userId: 1, createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text' }); // search
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

// Compound unique index — prevents duplicate memberships
forumMembershipSchema.index({ userId: 1, forumId: 1 }, { unique: true });
forumMembershipSchema.index({ forumId: 1 }); // list members of a forum
```

### Existing Models — Changes

**`Note.js`** — add `'public'` to the `visibility` enum:
```js
// Current
enum: ['private', 'friends', 'specific']

// After forum feature
enum: ['private', 'friends', 'specific', 'public']
```
Notes attached to resource posts need to be viewable by non-friends. The API automatically upgrades a note's visibility to `'public'` when it's attached to a post (with a warning in the response if the upgrade happened).

**`Comment.js`** — add `'forumPost'` to `targetType` enum (shown above).

**`Activity.js`** — add forum activity types to both enums, following the existing `verb_noun` naming convention:
```js
// type enum — add:
'forum_post_created'   // user created a post in a forum
'forum_joined'         // user joined a forum

// targetType enum — add:
'forumPost'
```

---

## Backend

### File Naming (project convention)
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

### Response Shape (project convention)
```json
{ "success": true, "forum": { ... } }
{ "success": false, "error": "Forum not found" }
```

### API Endpoints

#### Forums (`forums.routes.js`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/forums` | ✅ | Create a new forum |
| GET | `/api/forums` | ✅ | List/search forums (`?category=&search=`) |
| GET | `/api/forums/:slug` | ✅ | Get forum details and metadata |
| PUT | `/api/forums/:id` | ✅ moderator | Update forum name, description, rules, icon |
| DELETE | `/api/forums/:id` | ✅ admin | Soft delete forum |
| POST | `/api/forums/:id/join` | ✅ | Join a forum — creates ForumMembership, increments memberCount |
| DELETE | `/api/forums/:id/join` | ✅ | Leave a forum — soft deletes ForumMembership, decrements memberCount |
| GET | `/api/forums/:id/members` | ✅ | List members (paginated) |
| GET | `/api/forums/:id/posts` | ✅ | List posts in a forum (`?sort=hot\|new\|top&limit=&cursor=`) |

#### Posts (`forumPosts.routes.js`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/forums/:forumId/posts` | ✅ member | Create a post |
| GET | `/api/posts/:id` | ✅ | Get single post |
| PUT | `/api/posts/:id` | ✅ author | Edit post content |
| DELETE | `/api/posts/:id` | ✅ author/moderator | Soft delete post |
| POST | `/api/posts/:id/vote` | ✅ | Vote (`{ direction: "up" \| "down" \| "none" }`) |
| POST | `/api/posts/:id/pin` | ✅ moderator | Toggle pin |
| POST | `/api/posts/:id/lock` | ✅ moderator | Toggle lock |
| POST | `/api/posts/:id/save-note` | ✅ | Copy attached note into user's own library |
| POST | `/api/posts/:id/save-flashcards` | ✅ | Copy attached flashcard set into user's own library |

#### Comments (existing routes — no changes)
The existing `POST /api/comments` and `GET /api/comments/:targetType/:targetId` handle forum post comments by passing `targetType: 'forumPost'`. No new routes needed.

#### Feed

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/forums/feed` | ✅ | Aggregated posts from all joined forums (sorted by hot, paginated) |

---

## Service Logic

**Voting** — when a vote is cast, update `upvotes`/`downvotes` arrays and recalculate `score` atomically using `findOneAndUpdate`. A user can only hold one vote at a time. Passing `direction: "none"` removes their vote. Score is always `upvotes.length - downvotes.length`.

**Hot sorting** — computed at query time: `score / (hoursOld + 2)^1.5`. Simple enough to compute inline; cache on a short TTL if performance demands it later.

**memberCount** — maintained via increment/decrement on join/leave using `$inc`. Never recomputed from scratch.

**commentCount** — incremented on Comment creation with `targetType: 'forumPost'`, decremented on soft delete. Stored on ForumPost for display in list views without a separate count query.

**Resource post visibility** — when creating a resource post, the attached Note or FlashcardSet must belong to the requesting user. If the note's visibility is not `'public'`, the API automatically upgrades it and includes a `visibilityUpgraded: true` flag in the response so the frontend can show a notice.

**save-note / save-flashcards** — these duplicate the source resource and create a new Note or FlashcardSet owned by the requesting user. The copy stores an `originPostId` field for attribution. Attempting to save the same post's resource twice returns 409.

---

## Testing

### Integration Tests (Postman — Session N)

**Forum lifecycle**
1. Create a forum → verify slug is generated correctly
2. Search forums by name (`?search=`) and category (`?category=course`)
3. Join a forum → ForumMembership created, `memberCount` incremented
4. Leave a forum → ForumMembership soft deleted, `memberCount` decremented
5. [Error] Join a forum twice → `409`

**Post lifecycle**
1. Create a text post in a joined forum → `201`
2. Create a resource post with an attached note → `201`, note visibility upgraded to `'public'`
3. Fetch forum posts sorted by new → order correct
4. Fetch forum posts sorted by hot → hot score computed
5. Edit a post as the author → `200`
6. [Error] Edit a post as a non-author → `403`
7. Soft delete a post as a moderator → post no longer returned in list

**Voting**
1. Upvote a post → `score` increases by 1
2. Upvote the same post again → idempotent, score unchanged
3. Downvote after upvoting → upvote removed, downvote added, score changes by −2
4. Remove vote (`direction: "none"`) → score returns to original

**Comments (regression — existing routes)**
1. POST `/api/comments` with `targetType: "forumPost"` → stored correctly
2. GET `/api/comments/forumPost/:postId` → returns comments
3. Reply via `parentId` → thread structure correct

**Resource saving**
1. Save an attached note from a post → new Note in user's library with matching content
2. [Error] Save the same note twice → `409`
3. [Error] Save from a post with no attached note → `400`

**Feed**
1. Join two forums, create posts in each → both appear in `/api/forums/feed`
2. Leave one forum → its posts no longer appear in feed
3. Pagination → page 2 returns next set with no duplicates

---

*Last Updated: March 2026*
