# MongoDB Schema Implementation Guide
**Continuum Database - Sprint-by-Sprint Implementation**

---

## Implementation Order

### Sprint 1: Foundation (Week 1)
**Models to Implement**: 1

#### 1. User Model
**File**: `src/models/User.js`  
**Purpose**: Authentication, user profiles, Google OAuth

```javascript
{
  // Authentication
  email: String (unique, indexed),
  username: String (unique, indexed),
  passwordHash: String (select: false),
  
  // Profile
  firstName: String,
  lastName: String,
  avatarUrl: String,
  bio: String,
  
  // Google OAuth
  googleId: String (unique, sparse index),
  googleAccessToken: String (encrypted, select: false),
  googleRefreshToken: String (encrypted, select: false),
  googleTokenExpiry: Date,
  
  // Settings
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
- `comparePassword(candidate)` - Verify login password
- Virtual: `fullName` - Returns `firstName + lastName`

**Indexes**:
```javascript
{ email: 1, deletedAt: 1 }
{ username: 1, deletedAt: 1 }
{ googleId: 1 } // sparse
```

**Pre-Save Hook**: Hash password with bcrypt if modified

---

### Sprint 2: Content Foundation (Week 2)
**Models to Implement**: 2

#### 2. Note Model
**File**: `src/models/Note.js`  
**Purpose**: Google Docs imports, native notes, content management

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
  
  // Denormalized Flags
  hasSummary: Boolean,
  hasFlashcards: Boolean,
  
  // Metadata
  isPinned: Boolean,
  viewCount: Number,
  lastViewedAt: Date,
  deletedAt: Date,
  
  timestamps: true
}
```

**Virtuals**:
- `summary` - Populates from NoteSummary collection
- `flashcardSets` - Populates from FlashcardSet collection
- `commentsCount` - Count from Comment collection

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

#### 3. NoteSummary Model
**File**: `src/models/NoteSummary.js`  
**Purpose**: AI-generated summaries (separate for performance)

```javascript
{
  noteId: ObjectId (ref: 'Note', unique, indexed),
  userId: ObjectId (ref: 'User', indexed),
  
  // AI Summaries
  quickSummary: String (2-3 sentences),
  detailedSummary: String (1-2 paragraphs),
  
  // Metadata
  generatedAt: Date,
  model: String (e.g., 'gpt-4', 'claude-sonnet-4'),
  tokenCount: Number,
  deletedAt: Date,
  
  timestamps: true
}
```

**Why Separate?**: Summaries are optional and large. Keeping them separate keeps Note documents lean.

**Indexes**:
```javascript
{ noteId: 1, deletedAt: 1 }
```

---

### Sprint 3: Active Learning (Week 3)
**Models to Implement**: 2

#### 4. FlashcardSet Model
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

#### 5. Flashcard Model
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

**Why Separate?**: Sets can have 50-100+ cards. Individual card updates are common. User progress tracking per card.

**Indexes**:
```javascript
{ setId: 1, deletedAt: 1, order: 1 }
{ 'userProgress.userId': 1 }
```

---

### Sprint 4: Time Management (Week 4)
**Models to Implement**: 1

#### 6. Task Model
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
  
  // Collaboration (Shared Tasks)
  isShared: Boolean (indexed),
  participants: [ObjectId] (ref: 'User', includes creator),
  
  // Completion
  completedAt: Date,
  deletedAt: Date,
  
  timestamps: true
}
```

**Virtuals**:
- `isOverdue` - Computed: `status !== 'completed' && dueDate < now`

**Pre-Save Hook**: Set `completedAt` when status changes to 'completed'

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, dueDate: 1 }
{ userId: 1, status: 1, dueDate: 1 }
{ participants: 1, isShared: 1 } // Shared tasks
{ dueDate: 1, status: 1 } // Overdue detection
```

---

### Sprint 5: Collaboration Layer (Week 5)
**Models to Implement**: 2

#### 7. Friendship Model
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

**Pre-Save Hook**: Ensure `user1 < user2` for consistent ordering (prevents duplicates)

**Indexes**:
```javascript
{ user1: 1, user2: 1 } // unique compound index
{ user1: 1, status: 1 }
{ user2: 1, status: 1 }
{ requestedBy: 1, status: 1 }
```

**Why Unordered?**: Prevents duplicate friendships (A→B and B→A). Simplifies queries.

#### 8. Comment Model
**File**: `src/models/Comment.js`  
**Purpose**: Comments on notes, flashcard sets (polymorphic)

```javascript
{
  // Polymorphic Target
  targetId: ObjectId (indexed),
  targetType: String (enum: 'note', 'flashcardSet', indexed),
  
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
    fullName: String,
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

**Why Denormalize User?**: Comments are read frequently. Denormalizing user info avoids extra lookups.

---

### Sprint 6: Messaging & Offline (Week 6)
**Models to Implement**: 3

#### 9. Conversation Model
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

**Why Denormalize `lastMessage`?**: Avoids expensive aggregation when listing conversations in inbox.

**Indexes**:
```javascript
{ participants: 1, deletedAt: 1 }
{ participants: 1, 'lastMessage.sentAt': -1 }
```

#### 10. Message Model
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
  clientTimestamp: Date (when created offline),
  syncStatus: String (enum: 'pending', 'synced', 'failed'),
  
  deletedAt: Date,
  timestamps: true
}
```

**Offline Support**: `clientTimestamp` and `syncStatus` handle offline message sending.

**Indexes**:
```javascript
{ conversationId: 1, createdAt: -1 }
{ senderId: 1, createdAt: -1 }
```

#### 11. SyncQueue Model
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
  clientTimestamp: Date (when operation was queued),
  processedAt: Date,
  
  timestamps: true
}
```

**Offline Strategy**: Client queues changes. Server processes on reconnect.

**Indexes**:
```javascript
{ userId: 1, status: 1, clientTimestamp: 1 }
{ status: 1, createdAt: 1 }
```

---

### Sprint 7: Career Tools (Week 7)
**Models to Implement**: 3

#### 12. Resume Model
**File**: `src/models/Resume.js`  
**Purpose**: Resume file storage, version management

```javascript
{
  userId: ObjectId (ref: 'User', indexed),
  
  // File Info
  fileName: String,
  fileUrl: String (S3/cloud storage URL),
  fileSize: Number (bytes),
  mimeType: String (default: 'application/pdf'),
  
  // Version Management
  version: String (e.g., 'Software Engineer v2'),
  targetRole: String (e.g., 'Full-Stack Developer'),
  
  // AI Feedback
  hasFeedback: Boolean,
  
  // Metadata
  uploadedAt: Date,
  deletedAt: Date,
  
  timestamps: true
}
```

**Virtuals**:
- `latestFeedback` - Populates most recent ResumeFeedback

**Indexes**:
```javascript
{ userId: 1, deletedAt: 1, createdAt: -1 }
```

#### 13. ResumeFeedback Model
**File**: `src/models/ResumeFeedback.js`  
**Purpose**: AI-generated resume analysis

```javascript
{
  resumeId: ObjectId (ref: 'Resume', indexed),
  userId: ObjectId (ref: 'User', indexed),
  
  // AI Feedback
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
  
  // Metadata
  model: String (AI model used),
  generatedAt: Date,
  deletedAt: Date,
  
  timestamps: true
}
```

**Indexes**:
```javascript
{ resumeId: 1, createdAt: -1 }
{ userId: 1, createdAt: -1 }
```

#### 14. Application Model
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
  
  // Networking
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
  
  // Reminders
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

### Sprint 8: Polish (Week 8)
**Models to Implement**: 1 (Optional)

#### 15. Activity Model (Optional)
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

## Summary by Sprint

| Sprint | Models Added | Total Models | Purpose |
|--------|--------------|--------------|---------|
| Sprint 1 | User (1) | 1 | Authentication |
| Sprint 2 | Note, NoteSummary (2) | 3 | Content management |
| Sprint 3 | FlashcardSet, Flashcard (2) | 5 | AI learning tools |
| Sprint 4 | Task (1) | 6 | Time management |
| Sprint 5 | Friendship, Comment (2) | 8 | Social features |
| Sprint 6 | Conversation, Message, SyncQueue (3) | 11 | Messaging & offline |
| Sprint 7 | Resume, ResumeFeedback, Application (3) | 14 | Career tools |
| Sprint 8 | Activity (1, optional) | 15 | Activity feed |

---

## Database Connection Setup

**File**: `src/config/database.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
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
  NoteSummary: require('./NoteSummary'),
  FlashcardSet: require('./FlashcardSet'),
  Flashcard: require('./Flashcard'),
  Task: require('./Task'),
  Friendship: require('./Friendship'),
  Comment: require('./Comment'),
  Conversation: require('./Conversation'),
  Message: require('./Message'),
  SyncQueue: require('./SyncQueue'),
  Resume: require('./Resume'),
  ResumeFeedback: require('./ResumeFeedback'),
  Application: require('./Application'),
  Activity: require('./Activity'),
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
    { userId: req.user._id }, // Owner
    { sharedWith: req.user._id } // Shared with user
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
  .populate('userId', 'username fullName avatarUrl');
```

---

## Implementation Checklist

### Before Starting Each Sprint:
- [ ] Review models needed for this sprint
- [ ] Create model files in `src/models/`
- [ ] Define schema with all fields
- [ ] Add indexes for performance
- [ ] Add pre/post hooks if needed
- [ ] Add virtual properties if needed
- [ ] Test model creation/querying
- [ ] Export from `src/models/index.js`

### Testing Models:
```javascript
// Example: Test User model
describe('User Model', () => {
  it('should hash password on save', async () => {
    const user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'plainPassword123'
    });
    
    expect(user.passwordHash).not.toBe('plainPassword123');
  });
  
  it('should compare password correctly', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    const isMatch = await user.comparePassword('plainPassword123');
    expect(isMatch).toBe(true);
  });
});
```

---

**Last Updated**: January 2026  
**Total Models**: 15 (14 required + 1 optional)  
**Implementation Timeline**: 8 weeks (1-3 models per sprint)