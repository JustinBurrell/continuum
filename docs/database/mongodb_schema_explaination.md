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

**Embedded (Within Documents)**:
- Small, bounded arrays: User.settings, Task.participants
- Always needed together: Comment.userSnapshot
- Performance optimization: Conversation.lastMessage

**Decision Rule**: If data is >100 items or shared, reference. If data is <20 items and always needed, embed.

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
- **Note.hasSummary**: Check existence without querying NoteSummary
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

## Data Flow by Feature

### Authentication (Sprint 1)

**Flow**: Registration → Login → Session Management

```
1. User registers
   └─> User.create({ email, username, passwordHash })
   └─> passwordHash auto-hashed via pre-save hook

2. User logs in
   └─> User.findOne({ email })
   └─> user.comparePassword(password) // bcrypt compare
   └─> Generate JWT token
   └─> Return token to client

3. Authenticated requests
   └─> Client sends JWT in Authorization header
   └─> Middleware verifies JWT → extracts userId
   └─> req.user = decoded user from token
```

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

### Notes & Content (Sprint 2)

**Flow**: Import Google Doc → Store as Note → View/Edit

```
1. User connects Google Drive
   └─> OAuth flow stores googleAccessToken in User

2. User browses Google Drive
   └─> GET /api/google-drive/files
   └─> Use googleAccessToken to call Drive API
   └─> Return list of documents

3. User imports document
   └─> GET /api/google-docs/:docId/content
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
   └─> Fetch latest content from Google Docs
   └─> Note.findOneAndUpdate(
       { _id: noteId, userId },
       { content: newContent, lastSyncedAt: now }
     )
```

**Query Pattern**:
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

// Get note with summary
const note = await Note.findById(noteId)
  .populate('summary'); // Virtual populate from NoteSummary
```

---

### AI Learning (Sprint 3)

**Flow**: Note → AI Summary → Flashcard Generation → Study

```
1. User generates summary
   └─> POST /api/notes/:noteId/summary
   └─> Extract note.content
   └─> Call LLM API (GPT-4, Claude, etc.)
   └─> NoteSummary.create({
       noteId,
       userId,
       quickSummary: aiResponse.quick,
       detailedSummary: aiResponse.detailed
     })
   └─> Note.findByIdAndUpdate(noteId, { hasSummary: true })

2. User generates flashcards
   └─> POST /api/notes/:noteId/flashcards
   └─> Extract note.content
   └─> Call LLM API with "extract Q&A pairs" prompt
   └─> FlashcardSet.create({ noteId, userId, title, isAIGenerated: true })
   └─> Flashcard.insertMany(cards.map(c => ({
       setId,
       front: c.question,
       back: c.answer,
       order: c.index
     })))
   └─> Note.findByIdAndUpdate(noteId, { hasFlashcards: true })

3. User studies flashcards
   └─> GET /api/flashcard-sets/:setId/flashcards
   └─> Flashcard.find({ setId }).sort({ order: 1 })
   └─> Client displays flip interface

4. User marks card correct/incorrect
   └─> POST /api/flashcards/:cardId/progress
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

### Tasks & Calendar (Sprint 4)

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
   └─> GET /api/tasks/calendar?start=2026-03-01&end=2026-03-31
   └─> Task.find({
       userId,
       dueDate: { $gte: startDate, $lte: endDate },
       deletedAt: null
     }).sort({ dueDate: 1 })

3. Mark task complete
   └─> PATCH /api/tasks/:taskId
   └─> Task.findOneAndUpdate(
       { _id: taskId, userId },
       { status: 'completed', completedAt: now }
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

**Overdue Detection**:
```javascript
// Scheduled job (runs daily)
const overdueTasks = await Task.find({
  dueDate: { $lt: new Date() },
  status: { $in: ['todo', 'in_progress'] },
  deletedAt: null
});

// Send reminders via email/push notifications
```

---

### Social Features (Sprint 5)

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
   └─> POST /api/friendships
   └─> Friendship.create({
       user1: Math.min(senderId, receiverId), // Ordered
       user2: Math.max(senderId, receiverId),
       requestedBy: senderId,
       status: 'pending'
     })

3. Accept friend request
   └─> PATCH /api/friendships/:id/accept
   └─> Friendship.findOneAndUpdate(
       { _id, user2: userId }, // Only receiver can accept
       { status: 'accepted', respondedAt: now }
     )

4. Get friends list
   └─> Friendship.find({
       $or: [{ user1: userId }, { user2: userId }],
       status: 'accepted'
     })
     .populate('user1 user2', 'username fullName avatarUrl')

5. Share note
   └─> PATCH /api/notes/:noteId/share
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
       userSnapshot: { username, fullName, avatarUrl }
     })

7. Like comment
   └─> PATCH /api/comments/:commentId/like
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

### Messaging (Sprint 6)

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
   └─> POST /api/messages
   └─> Message.create({
       conversationId,
       senderId: userId,
       content
     })
   └─> Update conversation:
       Conversation.findByIdAndUpdate(conversationId, {
         lastMessage: {
           senderId: userId,
           content: content.substring(0, 200), // Preview
           sentAt: now
         },
         $inc: { 'unreadCounts.$[elem].count': 1 }
       }, {
         arrayFilters: [{ 'elem.userId': { $ne: userId } }] // Increment for receiver only
       })

3. Get conversation messages
   └─> GET /api/conversations/:id/messages?cursor=lastMessageId
   └─> Message.find({
       conversationId,
       _id: { $gt: cursor } // Cursor pagination
     })
     .sort({ createdAt: -1 })
     .limit(50)

4. Mark messages as read
   └─> PATCH /api/conversations/:id/read
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

**Inbox Query** (fast with denormalized lastMessage):
```javascript
const conversations = await Conversation.find({
  participants: userId,
  deletedAt: null
})
.sort({ 'lastMessage.sentAt': -1 })
.populate('participants', 'username avatarUrl')
.limit(50);

// Without denormalization, would need expensive aggregation:
// Conversation.aggregate([
//   { $lookup: { from: 'messages', ... } },
//   { $sort: { 'messages.createdAt': -1 } },
//   { $limit: 1 } // Last message per conversation
// ]) // Much slower!
```

---

### Offline Sync (Sprint 6)

**Flow**: Offline Operation → Queue → Reconnect → Sync

```
1. User goes offline
   └─> Client detects network loss
   └─> Switch to offline mode (local storage)

2. User creates note offline
   └─> Client saves to IndexedDB/AsyncStorage
   └─> Client queues sync operation:
       {
         operation: 'create',
         collection: 'notes',
         data: { title, content, ... },
         clientTimestamp: now
       }

3. User reconnects
   └─> Client detects network
   └─> POST /api/sync/queue (batch)
   └─> Server processes queue:
       
       for (const op of queue) {
         if (op.operation === 'create') {
           await Note.create({
             ...op.data,
             userId: req.user._id
           });
         }
         else if (op.operation === 'update') {
           await Note.findByIdAndUpdate(op.documentId, op.data);
         }
         else if (op.operation === 'delete') {
           await Note.findByIdAndUpdate(op.documentId, {
             deletedAt: new Date()
           });
         }
       }

4. Conflict resolution (last-write-wins)
   └─> If server has newer version:
       - Compare updatedAt timestamps
       - Keep most recent
       - Notify client of conflict

5. Client receives synced data
   └─> Update local storage with server IDs
   └─> Clear sync queue
```

**SyncQueue Collection** (optional, for complex sync):
```javascript
// Server-side queue
SyncQueue.create({
  userId,
  operation: 'create',
  collection: 'messages',
  documentId: null, // Generated after creation
  data: messageData,
  clientTimestamp,
  status: 'pending'
});

// Process queue (background job)
const pending = await SyncQueue.find({ status: 'pending' })
  .sort({ clientTimestamp: 1 });

for (const item of pending) {
  try {
    // Execute operation
    const result = await executeOperation(item);
    
    // Mark as completed
    item.status = 'completed';
    item.processedAt = new Date();
    await item.save();
  } catch (error) {
    item.status = 'failed';
    item.errorMessage = error.message;
    await item.save();
  }
}
```

---

### Career Tools (Sprint 7)

**Flow**: Upload Resume → AI Feedback → Track Applications

```
1. User uploads resume
   └─> POST /api/resumes (multipart/form-data)
   └─> Upload file to S3/cloud storage
   └─> Resume.create({
       userId,
       fileName,
       fileUrl: s3Url,
       version: 'SWE Intern v1',
       targetRole: 'Software Engineer Intern'
     })

2. Generate AI feedback
   └─> POST /api/resumes/:resumeId/feedback
   └─> Extract text from PDF (using pdf-parse or similar)
   └─> Call LLM API with resume analysis prompt
   └─> ResumeFeedback.create({
       resumeId,
       userId,
       overallScore: aiResponse.score,
       strengths: aiResponse.strengths,
       improvements: aiResponse.improvements,
       sections: aiResponse.sectionScores,
       keywordOptimization: aiResponse.keywords
     })
   └─> Resume.findByIdAndUpdate(resumeId, { hasFeedback: true })

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
   └─> PATCH /api/applications/:id
   └─> Application.findOneAndUpdate(
       { _id: appId, userId },
       { status: 'applied', appliedAt: now }
     )

5. Add networking contact
   └─> PATCH /api/applications/:id/contacts
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

**Application Pipeline Visualization**:
```javascript
// Frontend displays as columns:
Draft     Applied    Interview    Offer    Rejected
  3         12          5          1         8
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
    { userId: req.user._id }, // Owner
    { sharedWith: req.user._id }, // Shared with
    { visibility: 'friends' } // + check friendship
  ],
  deletedAt: null
});
```

### 2. Pagination (Performance)

**Cursor-based** (recommended for large datasets):
```javascript
// Get tasks after cursor
const tasks = await Task.find({
  userId,
  _id: { $gt: lastSeenId }, // Cursor
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
  .select('username fullName avatarUrl');

// Exclude sensitive fields
const user = await User.findById(userId)
  .select('-passwordHash -googleAccessToken');
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

### 6. Aggregation Pipelines (Complex Queries)

```javascript
// Get notes with comment counts
const notesWithComments = await Note.aggregate([
  { $match: { userId: mongoose.Types.ObjectId(userId), deletedAt: null } },
  {
    $lookup: {
      from: 'comments',
      localField: '_id',
      foreignField: 'targetId',
      as: 'comments'
    }
  },
  {
    $project: {
      title: 1,
      createdAt: 1,
      commentsCount: { $size: '$comments' }
    }
  },
  { $sort: { commentsCount: -1 } },
  { $limit: 10 }
]);
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
passwordHash: { type: String, select: false }
googleAccessToken: { type: String, select: false }

// Must explicitly select to retrieve
const user = await User.findById(userId).select('+passwordHash');
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

### 2. **References for Scalability**
Large collections (Notes, Tasks, Messages) are separate. Small data (settings, contacts) is embedded.

### 3. **Denormalization for Speed**
Cache frequently-accessed data (user snapshots, last message, counts) to avoid expensive lookups.

### 4. **Soft Deletes for Recovery**
Never hard-delete user content. Use `deletedAt` for undo and audit trails.

### 5. **Indexes for Performance**
All common queries have compound indexes. Text search enabled on searchable fields.

### 6. **Offline-First Architecture**
Client timestamps and sync queues enable offline operation with eventual consistency.

### 7. **Security First**
Always validate input, scope queries by user, exclude sensitive fields, check authorization.

---

This schema design supports **rapid development**, **performance at scale**, and **user privacy** — perfect for your 8-week MERN sprint! 