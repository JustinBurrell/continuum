# MongoDB Schema Implementation Guide
**Continuum Database - Phase-Based Implementation**

---

## Implementation Order

### Phase 1, Session 1: Core Models
**Models to Implement**: 6 (User, Note, FlashcardSet, Flashcard, Task)

#### 1. User Model
**File**: `src/models/User.js`
**Purpose**: Authentication, user profiles, Google OAuth

```javascript
{
  // Authentication
  email: String (unique, indexed),
  username: String (unique, indexed),
  password: String (select: false), // pre-save hook hashes with bcrypt

  // Profile
  firstName: String,
  lastName: String,
  avatarUrl: String,
  bio: String,

  // Google OAuth (linked separately or via Google sign-in)
  googleId: String (unique, sparse index),
  googleAccessToken: String (encrypted, select: false),
  googleRefreshToken: String (encrypted, select: false),
  googleTokenExpiry: Date,

  // Password Reset
  passwordResetToken: String (select: false),
  passwordResetExpires: Date,

  // Settings (embedded — small, always needed)
  settings: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    theme: String (enum: 'light', 'dark', 'auto'),
    defaultNotePrivacy: String (enum: 'private', 'friends')
  },

  // Metadata
  lastLoginAt: Date,
  emailVerified: Boolean,
  deletedAt: Date (soft delete),

  timestamps: true (createdAt, updatedAt)
}
```

**Key Methods**:
- `comparePassword(candidate)` - Verify login password via bcrypt
- `createPasswordResetToken()` - Generate hashed reset token, set expiry (1 hour)
- Virtual: `fullName` - Returns `firstName + lastName`
- Virtual: `hasGoogleLinked` - Returns `!!this.googleId`

**Indexes**:
```javascript
{ email: 1, deletedAt: 1 }
{ username: 1, deletedAt: 1 }
{ googleId: 1 } // sparse
```

**Pre-Save Hook**: Hash password with bcrypt if modified

---

#### 2. Note Model
**File**: `src/models/Note.js`
**Purpose**: Google Docs imports, native notes, content management, **embedded AI summaries**

```javascript
{
  // Ownership
  userId: ObjectId (ref: 'User', indexed),

  // Content
  title: String (max 200),
  content: String (HTML/Markdown),
  contentType: String (enum: 'html', 'markdown', 'plain'),

  // Google Docs Integration
  googleDocId: String (unique, sparse index),
  googleDocUrl: String,
  lastSyncedAt: Date,

  // Organization
  tags: [String] (lowercase),
  subject: String,
  folder: String (default: 'default'),

  // Sharing
  visibility: String (enum: 'private', 'friends', 'specific', indexed),
  sharedWith: [ObjectId] (ref: 'User'),

  // Embedded AI Summary (was separate NoteSummary collection)
  summary: {
    quickSummary: String,        // 2-3 sentences
    detailedSummary: String,     // 1-2 paragraphs
    generatedAt: Date,
    model: String,               // e.g., 'llama-3.1-70b'
    tokenCount: Number
  },

  // Denormalized Flags
  hasFlashcards: Boolean,

  // Metadata
  isPinned: Boolean,
  viewCount: Number,
  lastViewedAt: Date,
  deletedAt: Date,

  timestamps: true
}
```

**Why Embed Summary?**: Summaries are 1:1 with notes and always viewed together. Embedding eliminates an extra query and a whole collection.

**Virtuals**:
- `flashcardSets` - Populates from FlashcardSet collection
- `commentsCount` - Count from Comment collection
- `hasSummary` - Returns `!!this.summary?.quickSummary`

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, createdAt: -1 }
{ userId: 1, tags: 1 }
{ userId: 1, subject: 1 }
{ googleDocId: 1 } // sparse
{ visibility: 1, deletedAt: 1 }
// Text search
{ title: 'text', content: 'text', tags: 'text' }
```

---

#### 3. FlashcardSet Model
**File**: `src/models/FlashcardSet.js`
**Purpose**: Container for flashcard collections

```javascript
{
  userId: ObjectId (ref: 'User', indexed),
  noteId: ObjectId (ref: 'Note', indexed, nullable),

  // Content
  title: String (max 200),
  description: String (max 1000),

  // Study Metadata
  totalCards: Number,
  lastStudiedAt: Date,
  studySessionCount: Number,

  // Sharing
  visibility: String (enum: 'private', 'friends', 'specific'),
  sharedWith: [ObjectId] (ref: 'User'),

  // AI Generation
  isAIGenerated: Boolean,
  generatedAt: Date,
  deletedAt: Date,

  timestamps: true
}
```

**Virtuals**:
- `flashcards` - Populates from Flashcard collection

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, createdAt: -1 }
{ noteId: 1, deletedAt: 1 }
```

#### 4. Flashcard Model
**File**: `src/models/Flashcard.js`
**Purpose**: Individual flashcard pairs with study progress

```javascript
{
  setId: ObjectId (ref: 'FlashcardSet', indexed),

  // Content
  front: String (question/term),
  back: String (answer/definition),

  // User Progress (supports shared sets)
  userProgress: [{
    userId: ObjectId (ref: 'User'),
    lastStudied: Date,
    correctCount: Number,
    incorrectCount: Number,
    confidence: String (enum: 'low', 'medium', 'high')
  }],

  // Order
  order: Number (position in set),
  deletedAt: Date,

  timestamps: true
}
```

**Why Separate from FlashcardSet?**: Sets can have 50-100+ cards. Individual card updates (progress tracking) are frequent. Embedding would make the parent document too large.

**Indexes**:
```javascript
{ setId: 1, deletedAt: 1, order: 1 }
{ 'userProgress.userId': 1 }
```

---

#### 5. Task Model
**File**: `src/models/Task.js`
**Purpose**: Task management, calendar integration, group tasks

```javascript
{
  userId: ObjectId (ref: 'User', indexed),

  // Content
  title: String (max 200),
  description: String (max 2000),

  // Linked Note (optional)
  noteId: ObjectId (ref: 'Note', indexed, nullable),

  // Scheduling
  dueDate: Date (indexed, required),
  duration: Number (minutes, default: 60),
  reminderMinutes: Number (default: 30),

  // Categorization
  type: String (enum: 'homework', 'study', 'project', 'exam', 'other', indexed),
  priority: String (enum: 'low', 'medium', 'high', indexed),
  status: String (enum: 'todo', 'in_progress', 'completed', indexed),

  // Recurrence
  recurrence: {
    frequency: String (enum: 'none', 'daily', 'weekly', 'monthly'),
    interval: Number (default: 1),      // every N days/weeks/months
    daysOfWeek: [Number],               // 0=Sun, 1=Mon, ..., 6=Sat (for weekly)
    endDate: Date (nullable),           // null = no end
    parentTaskId: ObjectId (nullable),  // links to original recurring task
  },

  // Collaboration (Shared Tasks)
  isShared: Boolean (indexed),
  participants: [{
    userId: ObjectId (ref: 'User'),
    status: String (enum: 'todo', 'in_progress', 'completed', default: 'todo'),
    completedAt: Date
  }],

  // Completion
  completedAt: Date,
  deletedAt: Date,

  timestamps: true
}
```

**Recurrence Strategy**: When a recurring task is marked complete, auto-generate the next occurrence based on the recurrence rule. The new task links back to the original via `parentTaskId`. Individual occurrences can be modified independently. Deleting the parent does NOT delete generated instances.

**Participants**: Each participant tracks their own status independently. Only the task owner (`userId`) can edit task details (title, description, dueDate). Participants can only update their own status entry.

**Virtuals**:
- `isOverdue` - Computed: `status !== 'completed' && dueDate < now`

**Pre-Save Hook**: Set `completedAt` when status changes to 'completed'. If task has recurrence, generate next occurrence.

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, dueDate: 1 }
{ userId: 1, status: 1, dueDate: 1 }
{ participants: 1, isShared: 1 } // Shared tasks
{ dueDate: 1, status: 1 } // Overdue detection
```

---

### Phase 1, Session 2: Social & Career Models
**Models to Implement**: 4 (Friendship, Comment, Resume, Application)

#### 6. Friendship Model
**File**: `src/models/Friendship.js`
**Purpose**: Friend requests, friend relationships

```javascript
{
  // Unordered Relationship (user1 < user2)
  user1: ObjectId (ref: 'User', indexed),
  user2: ObjectId (ref: 'User', indexed),

  // Request Flow
  requestedBy: ObjectId (ref: 'User'),
  status: String (enum: 'pending', 'accepted', 'rejected', 'blocked', indexed),

  // Timestamps
  requestedAt: Date,
  respondedAt: Date,
  deletedAt: Date,

  timestamps: true
}
```

**Pre-Save Hook**: Ensure `user1 < user2` for consistent ordering (prevents duplicate friendships)

**Indexes**:
```javascript
{ user1: 1, user2: 1 } // unique compound index
{ user1: 1, status: 1 }
{ user2: 1, status: 1 }
{ requestedBy: 1, status: 1 }
```

**Why Unordered?**: Prevents duplicate friendships (A→B and B→A). Always store the smaller ObjectId as user1.

#### 7. Comment Model
**File**: `src/models/Comment.js`
**Purpose**: Comments on notes, flashcard sets (polymorphic)

```javascript
{
  // Polymorphic Target
  targetId: ObjectId (indexed),
  targetType: String (enum: 'note', 'flashcardSet', 'task', indexed),

  // Author
  userId: ObjectId (ref: 'User', indexed),

  // Content
  content: String (max 2000),

  // Threading (optional for MVP)
  parentId: ObjectId (ref: 'Comment', indexed, nullable),

  // Reactions
  likes: [ObjectId] (ref: 'User'),

  // Denormalized User Info (performance)
  userSnapshot: {
    username: String,
    firstName: String,
    lastName: String,
    avatarUrl: String
  },

  deletedAt: Date,
  timestamps: true
}
```

**Pre-Save Hook**: Snapshot user info on creation (avoids N+1 queries when displaying comments)

**Indexes**:
```javascript
{ targetId: 1, targetType: 1, createdAt: -1 }
{ userId: 1, createdAt: -1 }
{ parentId: 1 }
```

---

#### 8. Resume Model
**File**: `src/models/Resume.js`
**Purpose**: Resume file storage, version management, **embedded AI feedback**

```javascript
{
  userId: ObjectId (ref: 'User', indexed),

  // File Info
  fileName: String,
  fileUrl: String (cloud storage URL),
  fileSize: Number (bytes),
  mimeType: String (default: 'application/pdf'),

  // Version Management
  version: String (e.g., 'Software Engineer v2'),
  targetRole: String (e.g., 'Full-Stack Developer'),

  // Embedded AI Feedback (was separate ResumeFeedback collection)
  feedback: [{
    overallScore: Number (0-100),
    strengths: [String],
    improvements: [String],

    sections: [{
      name: String (e.g., 'Experience', 'Skills'),
      feedback: String,
      score: Number (0-100)
    }],

    keywordOptimization: {
      presentKeywords: [String],
      missingKeywords: [String]
    },

    model: String (AI model used),
    generatedAt: Date
  }],

  // Extracted Text (cached on upload for AI processing)
  extractedText: String (select: false),

  // Metadata
  uploadedAt: Date,
  deletedAt: Date,

  timestamps: true
}
```

**Why Embed Feedback?**: Feedback is 1:few (a user might regenerate 2-3 times per resume version). It's always viewed with the resume. Embedding eliminates a whole collection and avoids extra queries.

**Why Cache extractedText?**: PDF text extraction happens once on upload (using `pdf-parse`). Storing the result means AI feedback requests are instant — no re-parsing the PDF each time. Field is `select: false` to avoid loading large text on normal queries.

**Virtuals**:
- `hasFeedback` - Returns `this.feedback.length > 0`
- `latestFeedback` - Returns `this.feedback[this.feedback.length - 1]`

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, createdAt: -1 }
```

#### 9. Application Model
**File**: `src/models/Application.js`
**Purpose**: Job/internship application tracking

```javascript
{
  userId: ObjectId (ref: 'User', indexed),

  // Job Info
  company: String,
  position: String,
  location: String,
  jobUrl: String,

  // Status Pipeline
  status: String (enum: 'draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn', indexed),

  // Timeline
  appliedAt: Date,
  interviewDates: [Date],
  offerReceivedAt: Date,
  deadlineDate: Date,

  // Networking (embedded — bounded, always needed)
  contacts: [{
    name: String,
    role: String,
    email: String,
    linkedIn: String,
    lastContactDate: Date,
    notes: String
  }],

  // Notes & Prep
  notes: String (max 5000, interview prep, company research),
  resumeUsed: ObjectId (ref: 'Resume', nullable),

  // Reminders (embedded — bounded)
  followUpReminders: [{
    date: Date,
    description: String,
    completed: Boolean
  }],

  deletedAt: Date,
  timestamps: true
}
```

**Indexes**:
```javascript
{ userId: 1, status: 1, createdAt: -1 }
{ userId: 1, deadlineDate: 1 }
{ userId: 1, deletedAt: 1 }
```

---

### Stretch Models (Build if time permits)
**Models**: 4 (Conversation, Message, SyncQueue, Activity)

#### 10. Conversation Model
**File**: `src/models/Conversation.js`
**Purpose**: DM conversation containers

```javascript
{
  // Participants (always 2 for DMs)
  participants: [ObjectId] (ref: 'User', indexed, length: 2),

  // Last Message (denormalized for inbox performance)
  lastMessage: {
    senderId: ObjectId (ref: 'User'),
    content: String (max 200, truncated preview),
    sentAt: Date
  },

  // Unread Counts (per participant)
  unreadCounts: [{
    userId: ObjectId (ref: 'User'),
    count: Number
  }],

  deletedAt: Date,
  timestamps: true
}
```

**Indexes**:
```javascript
{ participants: 1, deletedAt: 1 }
{ participants: 1, 'lastMessage.sentAt': -1 }
```

#### 11. Message Model
**File**: `src/models/Message.js`
**Purpose**: Individual messages within conversations

```javascript
{
  conversationId: ObjectId (ref: 'Conversation', indexed),
  senderId: ObjectId (ref: 'User', indexed),

  // Content
  content: String (max 5000),

  // Read Status
  readBy: [{
    userId: ObjectId (ref: 'User'),
    readAt: Date
  }],

  // Offline Sync
  clientTimestamp: Date,
  syncStatus: String (enum: 'pending', 'synced', 'failed'),

  deletedAt: Date,
  timestamps: true
}
```

**Indexes**:
```javascript
{ conversationId: 1, createdAt: -1 }
{ senderId: 1, createdAt: -1 }
```

#### 12. SyncQueue Model
**File**: `src/models/SyncQueue.js`
**Purpose**: Queue offline operations for server sync

```javascript
{
  userId: ObjectId (ref: 'User', indexed),

  // Operation Details
  operation: String (enum: 'create', 'update', 'delete'),
  collection: String (enum: 'notes', 'tasks', 'flashcards', 'messages'),
  documentId: ObjectId,

  // Data
  data: Mixed (operation payload),

  // Status
  status: String (enum: 'pending', 'processing', 'completed', 'failed', indexed),
  errorMessage: String,

  // Timestamps
  clientTimestamp: Date,
  processedAt: Date,

  timestamps: true
}
```

**Indexes**:
```javascript
{ userId: 1, status: 1, clientTimestamp: 1 }
{ status: 1, createdAt: 1 }
```

#### 13. Activity Model (Optional)
**File**: `src/models/Activity.js`
**Purpose**: Social activity feed for friends

```javascript
{
  userId: ObjectId (ref: 'User', indexed),

  // Activity Type
  type: String (enum: 'note_shared', 'flashcard_shared', 'task_created', 'comment_added', 'like_added', indexed),

  // Target Resource
  targetId: ObjectId,
  targetType: String (enum: 'note', 'flashcardSet', 'task', 'comment'),

  // Visibility
  visibleTo: [ObjectId] (ref: 'User', friends who should see),

  // Metadata
  metadata: Mixed (additional context),

  createdAt: Date (indexed)
}
```

**TTL Index**: Auto-delete activities older than 90 days
```javascript
{ createdAt: 1 } // expireAfterSeconds: 7776000 (90 days)
```

**Indexes**:
```javascript
{ visibleTo: 1, createdAt: -1 }
{ userId: 1, type: 1, createdAt: -1 }
```

---

## Summary

| # | Model | File | Category | Must-Ship |
|---|-------|------|----------|-----------|
| 1 | User | `src/models/User.js` | Auth | Yes |
| 2 | Note | `src/models/Note.js` | Notes (summary embedded) | Yes |
| 3 | FlashcardSet | `src/models/FlashcardSet.js` | Learning | Yes |
| 4 | Flashcard | `src/models/Flashcard.js` | Learning | Yes |
| 5 | Task | `src/models/Task.js` | Tasks | Yes |
| 6 | Friendship | `src/models/Friendship.js` | Social | Yes |
| 7 | Comment | `src/models/Comment.js` | Social | Yes |
| 8 | Resume | `src/models/Resume.js` | Career (feedback embedded) | Yes |
| 9 | Application | `src/models/Application.js` | Career | Yes |
| 10 | Conversation | `src/models/Conversation.js` | Stretch: DMs | No |
| 11 | Message | `src/models/Message.js` | Stretch: DMs | No |
| 12 | SyncQueue | `src/models/SyncQueue.js` | Stretch: Offline | No |
| 13 | Activity | `src/models/Activity.js` | Stretch: Feed | No |

**9 must-ship models** (down from 11 — consolidated NoteSummary into Note, ResumeFeedback into Resume)

---

## Database Connection Setup

**File**: `src/config/database.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Enable debugging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Environment Variables** (`.env`):
```
MONGODB_URI=mongodb://localhost:27017/continuum
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/continuum
```

---

## Model Import Pattern

**File**: `src/models/index.js`

```javascript
module.exports = {
  User: require('./User'),
  Note: require('./Note'),
  FlashcardSet: require('./FlashcardSet'),
  Flashcard: require('./Flashcard'),
  Task: require('./Task'),
  Friendship: require('./Friendship'),
  Comment: require('./Comment'),
  Resume: require('./Resume'),
  Application: require('./Application'),
  // Stretch models — uncomment when implemented
  // Conversation: require('./Conversation'),
  // Message: require('./Message'),
  // SyncQueue: require('./SyncQueue'),
  // Activity: require('./Activity'),
};
```

**Usage in Controllers**:
```javascript
const { User, Note, Task } = require('../models');

// Use models
const user = await User.findById(userId);
const notes = await Note.find({ userId });
```

---

## Key Patterns

### 1. Soft Deletes
All models include `deletedAt` for soft deletes:
```javascript
// Soft delete
note.deletedAt = new Date();
await note.save();

// Query excluding deleted
const notes = await Note.find({ userId, deletedAt: null });
```

### 2. User-Scoped Queries
Always scope queries by user to prevent data leakage:
```javascript
const note = await Note.findOne({
  _id: noteId,
  $or: [
    { userId: req.user._id },       // Owner
    { sharedWith: req.user._id }     // Shared with user
  ],
  deletedAt: null
});
```

### 3. Timestamps
All models use `timestamps: true` for automatic `createdAt` and `updatedAt`:
```javascript
const schema = new mongoose.Schema({
  // fields...
}, {
  timestamps: true // Automatic createdAt & updatedAt
});
```

### 4. Indexes
Define indexes in schema for performance:
```javascript
// Compound index
schema.index({ userId: 1, deletedAt: 1, createdAt: -1 });

// Text search
schema.index({ title: 'text', content: 'text' });

// Sparse index (for optional fields)
schema.index({ googleId: 1 }, { sparse: true });

// Unique compound index
schema.index({ user1: 1, user2: 1 }, { unique: true });
```

### 5. Virtual Properties
Use virtuals for computed fields:
```javascript
schema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Enable virtuals in JSON
schema.set('toJSON', { virtuals: true });
```

### 6. Population
Use `ref` for relationships, populate when needed:
```javascript
// Define reference
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

// Populate in query
const note = await Note.findById(noteId)
  .populate('userId', 'username firstName lastName avatarUrl');
```

---

## Implementation Checklist

### For Each Model:
- [ ] Create model file in `src/models/`
- [ ] Define schema with all fields and types
- [ ] Add indexes for common queries
- [ ] Add pre/post hooks if needed
- [ ] Add virtual properties if needed
- [ ] Export from `src/models/index.js`
- [ ] Write seed data to test
- [ ] Verify queries work as expected

---

**Last Updated**: February 2026
**Total Models**: 13 (9 must-ship + 4 stretch)
**Implementation Timeline**: Phase 1 (Sessions 1-2)
