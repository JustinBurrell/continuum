# How Continuum's MongoDB Schema Works
**Understanding Data Flow & Relationships**

---

## Core Concepts

### 1. User-Centric Ownership
**Every resource belongs to a user.**

```javascript
// All documents reference their owner
{
  userId: ObjectId (ref: 'User')
}
```

**Why**: Enables user-scoped queries, prevents data leakage, supports multi-tenancy.

**Example Flow**:
```
User creates Note → Note.userId = User._id
User creates Task → Task.userId = User._id
User uploads Resume → Resume.userId = User._id
```

---

### 2. Referenced vs Embedded Data

**Referenced (Separate Collections)**:
- Large or unbounded data: Notes, Tasks, Messages
- Many-to-many relationships: Friendships
- Shared across documents: Users
- Large collections with independent access patterns: Flashcards

**Embedded (Within Documents)**:
- Small, bounded arrays: User.settings, Task.participants
- Always needed together: Comment.userSnapshot, Note.summary, Resume.feedback
- Performance optimization: Conversation.lastMessage
- 1:1 or 1:few relationships: Note ↔ Summary, Resume ↔ Feedback

**Decision Rule**: If data is >100 items or shared across documents, reference. If data is <20 items and always accessed together, embed.

---

### 3. Soft Deletes (Recovery-First)

**Every model has `deletedAt` field.**

```javascript
// Delete (soft)
note.deletedAt = new Date();
await note.save();

// Restore
note.deletedAt = null;
await note.save();

// Query active only
Note.find({ userId, deletedAt: null })
```

**Why**: Users make mistakes. Soft deletes enable undo, audit trails, and data recovery.

---

### 4. Denormalization for Performance

**Cache frequently-accessed data.**

Examples:
- **Comment.userSnapshot**: Store username/avatar to avoid lookups
- **Conversation.lastMessage**: Display inbox without aggregating messages
- **Note.summary embedded**: Always viewed with the note, avoids extra query
- **Resume.feedback embedded**: Always viewed with the resume
- **FlashcardSet.totalCards**: Count cached to avoid counting flashcards

**Trade-off**: Faster reads, slightly slower writes, potential stale data.

**Update Strategy**:
```javascript
// When user updates profile
await User.findByIdAndUpdate(userId, { avatarUrl: newUrl });

// Also update all comments (background job)
await Comment.updateMany(
  { userId },
  { $set: { 'userSnapshot.avatarUrl': newUrl } }
);
```

---

## Model Overview (13 total)

| # | Model | Collection | Category | Must-Ship |
|---|-------|-----------|----------|-----------|
| 1 | User | users | Auth | Yes |
| 2 | Note | notes | Notes (includes embedded summary) | Yes |
| 3 | FlashcardSet | flashcardsets | Learning | Yes |
| 4 | Flashcard | flashcards | Learning | Yes |
| 5 | Task | tasks | Tasks | Yes |
| 6 | Friendship | friendships | Social | Yes |
| 7 | Comment | comments | Social | Yes |
| 8 | Resume | resumes | Career (includes embedded feedback) | Yes |
| 9 | Application | applications | Career | Yes |
| 10 | Conversation | conversations | Stretch: DMs | No |
| 11 | Message | messages | Stretch: DMs | No |
| 12 | SyncQueue | syncqueues | Stretch: Offline | No |
| 13 | Activity | activities | Stretch: Feed | No |

**9 must-ship models** + 4 stretch models

---

## Data Flow by Feature

### Authentication

**Flow**: Registration → Login → Session Management → Google Linking

```
1. User registers (email/password)
   └─> User.create({ email, username, password })
   └─> Mongoose validates password: min 8 chars, 1 letter, 1 number, 1 special character
   └─> password auto-hashed via pre-save hook
   └─> createdAt auto-set by Mongoose timestamps (tracks when user joined)
   └─> Google NOT linked yet — user.googleId is null

2. User registers/logs in via Google OAuth
   └─> Find or create User by googleId or email
   └─> Store googleAccessToken, googleRefreshToken on User
   └─> Google IS linked — Drive/Docs features available immediately

3. User logs in (email/password)
   └─> User.findOne({ email }).select('+password')
   └─> user.comparePassword(candidatePassword) // bcrypt compare
   └─> Generate JWT token
   └─> Return token to client

4. Authenticated requests
   └─> Client sends JWT in Authorization header
   └─> Middleware verifies JWT → extracts userId
   └─> req.user = decoded user from token

5. Link Google (for email/password users)
   └─> POST /api/me/google/link → triggers OAuth consent flow
   └─> Stores googleId, googleAccessToken, googleRefreshToken on existing User
   └─> Now user.hasGoogleLinked = true → Drive/Docs unlocked

6. Unlink Google
   └─> DELETE /api/me/google/link { keepNotes: true/false }
   └─> If keepNotes=false: soft-delete notes with googleDocId
   └─> If keepNotes=true: keep notes but clear googleDocId (standalone copies)
   └─> Clear googleId, googleAccessToken, googleRefreshToken from User

7. Forgot password
   └─> POST /api/auth/forgot-password { email }
   └─> user.createPasswordResetToken() → hashed token + 1hr expiry
   └─> Send reset link via email (Resend)
   └─> POST /api/auth/reset-password { token, newPassword }
   └─> Verify token not expired → hash new password → clear reset fields
```

**Google Link Tracking**: `user.hasGoogleLinked` virtual checks if `googleId` exists. Frontend uses this to show/hide Google Docs features and prompt linking.

**Google OAuth Flow**:
```
1. User clicks "Sign in with Google"
   └─> Redirect to Google OAuth consent screen

2. Google returns authorization code
   └─> Exchange code for access/refresh tokens
   └─> Fetch user profile from Google

3. Find or create user
   └─> User.findOne({ googleId })
   └─> If not found: User.create({ googleId, email, ... })
   └─> Store googleAccessToken (encrypted)

4. Generate JWT
   └─> Return token to client
```

---

### Notes & Content

**Flow**: Import Google Doc → Store as Note → View/Edit → Generate Summary

```
1. User connects Google Drive
   └─> OAuth flow stores googleAccessToken in User

2. User browses Google Drive
   └─> GET /api/google/files
   └─> Use googleAccessToken to call Drive API
   └─> Return list of documents

3. User imports document
   └─> POST /api/notes/import
   └─> Fetch document content via Docs API
   └─> Parse HTML/Markdown
   └─> Note.create({
       userId,
       title,
       content,
       googleDocId,
       googleDocUrl,
       lastSyncedAt: now
     })

4. User refreshes note
   └─> PUT /api/notes/:id/refresh
   └─> Fetch latest content from Google Docs
   └─> Note.findOneAndUpdate(
       { _id: noteId, userId },
       { content: newContent, lastSyncedAt: now }
     )

5. User generates AI summary
   └─> POST /api/notes/:id/summary
   └─> Call Groq API with note.content
   └─> Note.findByIdAndUpdate(noteId, {
       summary: {
         quickSummary: aiResponse.quick,
         detailedSummary: aiResponse.detailed,
         generatedAt: now,
         model: 'llama-3.1-70b'
       }
     })
```

**Query Patterns**:
```javascript
// Get user's notes
const notes = await Note.find({
  userId: req.user._id,
  deletedAt: null
})
.sort({ createdAt: -1 })
.limit(50);

// Search notes
const results = await Note.find({
  userId: req.user._id,
  $text: { $search: query },
  deletedAt: null
});

// Get note (summary is already embedded — no populate needed)
const note = await Note.findOne({
  _id: noteId,
  userId: req.user._id,
  deletedAt: null
});
// note.summary.quickSummary is immediately available
```

---

### AI Learning

**Flow**: Note → Flashcard Generation → Study

```
1. User generates flashcards from note
   └─> POST /api/notes/:noteId/flashcards/generate
   └─> Extract note.content
   └─> Call Groq API (Llama 3.1 8B) with "extract Q&A pairs" prompt
   └─> FlashcardSet.create({ noteId, userId, title, isAIGenerated: true })
   └─> Flashcard.insertMany(cards.map(c => ({
       setId,
       front: c.question,
       back: c.answer,
       order: c.index
     })))
   └─> Note.findByIdAndUpdate(noteId, { hasFlashcards: true })

2. User studies flashcards
   └─> GET /api/flashcard-sets/:setId
   └─> FlashcardSet + Flashcard.find({ setId }).sort({ order: 1 })
   └─> Client displays flip interface

3. User marks card correct/incorrect
   └─> PUT /api/flashcard-sets/:setId/cards/:cardId/progress
   └─> Flashcard.findOneAndUpdate(
       { _id: cardId, 'userProgress.userId': userId },
       { $inc: { 'userProgress.$.correctCount': 1 } }
     )
```

**Shared Flashcard Study**:
```javascript
// Multiple users can study the same set
flashcard.userProgress = [
  { userId: user1, correctCount: 5, confidence: 'high' },
  { userId: user2, correctCount: 2, confidence: 'medium' }
]
```

---

### Tasks & Calendar

**Flow**: Create Task → Link to Note → View in Calendar

```
1. User creates task
   └─> POST /api/tasks
   └─> Task.create({
       userId,
       noteId: linkedNote._id, // Optional
       title,
       dueDate,
       type: 'homework',
       status: 'todo'
     })

2. Calendar view query
   └─> GET /api/calendar?start=2026-03-01&end=2026-03-31
   └─> Task.find({
       userId,
       dueDate: { $gte: startDate, $lte: endDate },
       deletedAt: null
     }).sort({ dueDate: 1 })

3. Mark task complete
   └─> PATCH /api/tasks/:taskId/status
   └─> Task.findOneAndUpdate(
       { _id: taskId, userId },
       { status: 'completed' }
     )
   └─> Pre-save hook auto-sets completedAt

4. Shared task
   └─> Task.create({
       userId: creator,
       participants: [creator, user2, user3],
       isShared: true
     })
   └─> All participants see task in their calendar:
       Task.find({
         $or: [
           { userId: req.user._id },
           { participants: req.user._id }
         ]
       })
```

---

### Social Features

**Flow**: Add Friend → Share Note → Comment → Like

```
1. User searches for friends
   └─> GET /api/users/search?q=username
   └─> User.find({
       $or: [
         { username: { $regex: query, $options: 'i' } },
         { email: { $regex: query, $options: 'i' } }
       ],
       deletedAt: null
     })

2. Send friend request
   └─> POST /api/friends/request
   └─> Friendship.create({
       user1: Math.min(senderId, receiverId), // Ordered
       user2: Math.max(senderId, receiverId),
       requestedBy: senderId,
       status: 'pending'
     })

3. Accept friend request
   └─> PUT /api/friends/request/:id
   └─> Friendship.findOneAndUpdate(
       { _id, status: 'pending' },
       { status: 'accepted', respondedAt: now }
     )

4. Get friends list
   └─> Friendship.find({
       $or: [{ user1: userId }, { user2: userId }],
       status: 'accepted'
     })
     .populate('user1 user2', 'username firstName lastName avatarUrl')

5. Share note
   └─> PUT /api/notes/:noteId/share
   └─> Note.findOneAndUpdate(
       { _id: noteId, userId },
       { visibility: 'friends' }
     )

6. Comment on shared note
   └─> POST /api/comments
   └─> Verify user has access to note:
       - Owner: note.userId === userId
       - Friend: note.visibility === 'friends' AND friendship exists
       - Specific: note.sharedWith includes userId
   └─> Comment.create({
       targetId: noteId,
       targetType: 'note',
       userId,
       content,
       userSnapshot: { username, firstName, lastName, avatarUrl }
     })

7. Like comment
   └─> POST /api/comments/:commentId/like
   └─> Comment.findOneAndUpdate(
       { _id: commentId },
       { $addToSet: { likes: userId } } // Prevents duplicates
     )
```

**Friendship Query Pattern** (unordered):
```javascript
// Check if users are friends
const friendship = await Friendship.findOne({
  user1: Math.min(userId1, userId2),
  user2: Math.max(userId1, userId2),
  status: 'accepted'
});
```

---

### Career Tools

**Flow**: Upload Resume → AI Feedback → Track Applications

```
1. User uploads resume
   └─> POST /api/resumes/upload (multipart/form-data)
   └─> Upload file to cloud storage
   └─> Resume.create({
       userId,
       fileName,
       fileUrl: storageUrl,
       version: 'SWE Intern v1',
       targetRole: 'Software Engineer Intern'
     })

2. Generate AI feedback
   └─> POST /api/resumes/:resumeId/feedback
   └─> Extract text from PDF (using pdf-parse)
   └─> Call Groq API (Llama 3.1 70B) with resume analysis prompt
   └─> Resume.findByIdAndUpdate(resumeId, {
       $push: {
         feedback: {
           overallScore: aiResponse.score,
           strengths: aiResponse.strengths,
           improvements: aiResponse.improvements,
           sections: aiResponse.sectionScores,
           keywordOptimization: aiResponse.keywords,
           model: 'llama-3.1-70b',
           generatedAt: now
         }
       }
     })

3. Create job application
   └─> POST /api/applications
   └─> Application.create({
       userId,
       company: 'Google',
       position: 'SWE Intern',
       status: 'draft',
       resumeUsed: resumeId
     })

4. Update application status
   └─> PUT /api/applications/:id
   └─> Application.findOneAndUpdate(
       { _id: appId, userId },
       { status: 'applied', appliedAt: now }
     )

5. Add networking contact
   └─> POST /api/applications/:id/contacts
   └─> Application.findOneAndUpdate(
       { _id: appId, userId },
       { $push: {
         contacts: {
           name: 'Jane Recruiter',
           role: 'Tech Recruiter',
           email: 'jane@google.com',
           lastContactDate: now,
           notes: 'Met at career fair'
         }
       }}
     )

6. Dashboard query
   └─> GET /api/applications/dashboard
   └─> Application.aggregate([
       { $match: { userId, deletedAt: null } },
       { $group: {
         _id: '$status',
         count: { $sum: 1 },
         applications: { $push: '$$ROOT' }
       }}
     ])
   └─> Returns: { draft: 3, applied: 12, interview: 5, offer: 1, rejected: 8 }
```

---

### Messaging (Stretch)

**Flow**: Start Conversation → Send Message → Read Message

```
1. Start conversation (or find existing)
   └─> Conversation.findOne({
       participants: { $all: [user1, user2] }
     })
   └─> If not found: Conversation.create({
       participants: [user1, user2],
       unreadCounts: [
         { userId: user1, count: 0 },
         { userId: user2, count: 0 }
       ]
     })

2. Send message
   └─> POST /api/conversations/:id/messages
   └─> Message.create({
       conversationId,
       senderId: userId,
       content
     })
   └─> Update conversation:
       Conversation.findByIdAndUpdate(conversationId, {
         lastMessage: {
           senderId: userId,
           content: content.substring(0, 200),
           sentAt: now
         },
         $inc: { 'unreadCounts.$[elem].count': 1 }
       }, {
         arrayFilters: [{ 'elem.userId': { $ne: userId } }]
       })

3. Get conversation messages
   └─> GET /api/conversations/:id/messages?cursor=lastMessageId
   └─> Message.find({
       conversationId,
       _id: { $gt: cursor }
     })
     .sort({ createdAt: -1 })
     .limit(50)

4. Mark messages as read
   └─> PUT /api/messages/:id/read
   └─> Message.updateMany(
       { conversationId, 'readBy.userId': { $ne: userId } },
       { $push: { readBy: { userId, readAt: now } } }
     )
   └─> Conversation.findOneAndUpdate(
       { _id: conversationId },
       { $set: { 'unreadCounts.$[elem].count': 0 } },
       { arrayFilters: [{ 'elem.userId': userId }] }
     )
```

---

## Query Optimization Patterns

### 1. User-Scoped Queries (Security)
**Always filter by userId** to prevent data leakage:

```javascript
// Bad (returns any note)
const note = await Note.findById(noteId);

// Good (only returns user's note)
const note = await Note.findOne({
  _id: noteId,
  userId: req.user._id,
  deletedAt: null
});

// Also good (for shared content)
const note = await Note.findOne({
  _id: noteId,
  $or: [
    { userId: req.user._id },     // Owner
    { sharedWith: req.user._id },  // Shared with
    { visibility: 'friends' }      // + check friendship
  ],
  deletedAt: null
});
```

### 2. Pagination (Performance)

**Cursor-based** (recommended for large datasets):
```javascript
const tasks = await Task.find({
  userId,
  _id: { $gt: lastSeenId },
  deletedAt: null
})
.limit(20)
.sort({ _id: 1 });
```

**Offset-based** (simpler for small datasets):
```javascript
const page = 2;
const pageSize = 20;

const tasks = await Task.find({ userId, deletedAt: null })
  .skip(page * pageSize)
  .limit(pageSize)
  .sort({ createdAt: -1 });
```

### 3. Lean Queries (Performance)

**Use `.lean()` for read-only data** (5x faster):
```javascript
// Slower (returns Mongoose documents)
const notes = await Note.find({ userId });

// Faster (returns plain JavaScript objects)
const notes = await Note.find({ userId }).lean();

// Trade-off: No Mongoose methods (save, populate, etc.)
```

### 4. Select Only Needed Fields

```javascript
// Returns entire document
const user = await User.findById(userId);

// Returns only needed fields
const user = await User.findById(userId)
  .select('username firstName lastName avatarUrl');

// Exclude sensitive fields
const user = await User.findById(userId)
  .select('-password -googleAccessToken');
```

### 5. Batch Operations

```javascript
// Slow (N queries)
for (const noteId of noteIds) {
  await Note.findByIdAndUpdate(noteId, { isPinned: true });
}

// Fast (1 query)
await Note.updateMany(
  { _id: { $in: noteIds }, userId },
  { $set: { isPinned: true } }
);
```

---

## Security & Privacy

### 1. Never Trust Client Input

```javascript
// Dangerous (NoSQL injection risk)
const note = await Note.findOne({ _id: req.params.id });

// Safe (validate ObjectId)
const mongoose = require('mongoose');
if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({ error: 'Invalid ID' });
}

// Also safe (sanitize input)
const clean = require('mongo-sanitize');
const query = clean(req.body.query);
```

### 2. Exclude Sensitive Fields by Default

```javascript
// Schema definition
password: { type: String, select: false }
googleAccessToken: { type: String, select: false }

// Must explicitly select to retrieve
const user = await User.findById(userId).select('+password');
```

### 3. Authorization Checks

```javascript
// Check ownership before mutation
const note = await Note.findOne({
  _id: noteId,
  userId: req.user._id
});

if (!note) {
  return res.status(404).json({ error: 'Note not found' });
}

// Check friendship before sharing
const friendship = await Friendship.findOne({
  user1: Math.min(req.user._id, friendId),
  user2: Math.max(req.user._id, friendId),
  status: 'accepted'
});

if (!friendship) {
  return res.status(403).json({ error: 'Not friends' });
}
```

---

## Key Takeaways

### 1. **User-Centric Design**
Everything belongs to a user. All queries are scoped by `userId`.

### 2. **Embed What Belongs Together**
Summary lives inside Note. Feedback lives inside Resume. No extra queries for 1:1 data.

### 3. **Reference What Scales Independently**
Flashcards are separate from FlashcardSets (50-100+ cards per set). Messages are separate from Conversations.

### 4. **Denormalize for Speed**
Cache frequently-accessed data (user snapshots, last message, counts) to avoid expensive lookups.

### 5. **Soft Deletes for Recovery**
Never hard-delete user content. Use `deletedAt` for undo and audit trails.

### 6. **Indexes for Performance**
All common queries have compound indexes. Text search enabled on searchable fields.

### 7. **Security First**
Always validate input, scope queries by user, exclude sensitive fields, check authorization.
