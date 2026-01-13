# Sprint 6: Messaging & Offline
**March 23-29 | DMs & Offline Support**

## 🎯 Sprint Objectives
Add direct messaging and implement offline functionality for uninterrupted use.

**Key Learning Goals:**
- Messaging systems
- Offline-first architecture
- Data synchronization
- Conflict resolution
- Local storage patterns
- Sync strategies

---

## 📋 Detailed Task Breakdown

### Backend Development (Tickets 59-61)

#### Ticket 59: Conversation and Message Models
**Commit**: `feat: add conversation and message models`

**What to Learn:**
- Messaging data models
- One-to-many relationships
- Message threading
- Timestamp management

**Implementation Steps:**
1. Design Conversation schema (participantIds, createdAt, updatedAt, lastMessage)
2. Design Message schema (conversationId, senderId, content, createdAt, readAt)
3. Create models with Mongoose
4. Add validation
5. Add indexes for queries
6. Create helper methods

**Acceptance Criteria:**
- Models created
- Relationships work
- Can query conversations
- Can query messages
- Validation works

**Resources:**
- Messaging data models
- One-to-many relationships
- Timestamp patterns

---

#### Ticket 60: DM Send and Retrieve Endpoints
**Commit**: `feat: implement dm send and retrieve endpoints`

**What to Learn:**
- Message sending
- Conversation management
- Message retrieval
- Pagination

**Implementation Steps:**
1. Create POST /dm/conversations endpoint (create/get conversation)
2. Create POST /dm/conversations/:id/messages (send message)
3. Create GET /dm/conversations/:id/messages (get messages)
4. Create GET /dm/conversations (list conversations)
5. Add pagination for messages
6. Update conversation lastMessage
7. Handle read receipts

**Acceptance Criteria:**
- Can create conversations
- Can send messages
- Can retrieve messages
- Can list conversations
- Pagination works

**Resources:**
- Messaging APIs
- Pagination patterns
- Read receipts

---

#### Ticket 61: Sync Checkpoint for Offline Support
**Commit**: `feat: create sync checkpoint for offline support`

**What to Learn:**
- Sync strategies
- Timestamp management
- Change detection
- Sync endpoints

**Implementation Steps:**
1. Create GET /sync/checkpoint endpoint
2. Return server timestamp
3. Create GET /sync/changes endpoint
4. Accept since timestamp parameter
5. Return changes since timestamp
6. Support different entity types
7. Handle sync conflicts

**Acceptance Criteria:**
- Returns server time
- Returns changes since timestamp
- Handles all entity types
- Conflict detection works

**Resources:**
- Sync patterns
- Timestamp management
- Change detection

---

### Web Frontend (Tickets 62-64)

#### Ticket 62: Direct Message Inbox UI
**Commit**: `feat: add direct message inbox ui`

**What to Learn:**
- Inbox UI patterns
- Conversation lists
- Unread indicators
- Navigation

**Implementation Steps:**
1. Create Inbox component
2. Fetch conversations
3. Display conversation list
4. Show unread counts
5. Show last message preview
6. Add navigation to chat
7. Style inbox

**Acceptance Criteria:**
- Lists conversations
- Shows unread counts
- Last message preview
- Navigation works
- Updates on new messages

**Resources:**
- Inbox UI patterns
- Conversation lists
- Unread indicators

---

#### Ticket 63: Chat View with Message Bubbles
**Commit**: `feat: implement chat view with message bubbles`

**What to Learn:**
- Chat UI patterns
- Message rendering
- Scroll management
- Auto-scroll

**Implementation Steps:**
1. Create ChatView component
2. Fetch messages for conversation
3. Render message bubbles
4. Style sent/received differently
5. Implement auto-scroll
6. Handle message loading
7. Add timestamps

**Acceptance Criteria:**
- Messages display correctly
- Bubbles styled properly
- Auto-scrolls to bottom
- Timestamps shown
- Loading handled

**Resources:**
- Chat UI patterns
- Message bubbles
- Scroll management

---

#### Ticket 64: Message Input with Emoji Support
**Commit**: `feat: build message input with emoji support`

**What to Learn:**
- Input handling
- Emoji pickers
- Character limits
- Send patterns

**Implementation Steps:**
1. Create MessageInput component
2. Add text input
3. Integrate emoji picker
4. Add send button
5. Handle enter to send
6. Show character count
7. Disable when empty

**Acceptance Criteria:**
- Input works
- Emoji picker works
- Can send messages
- Character limit enforced
- Enter to send works

**Resources:**
- Input components
- Emoji pickers
- Send patterns

---

### Mobile Development (Tickets 65-68)

#### Ticket 65: Mobile Messaging Interface
**Commit**: `feat: add mobile messaging interface`

**What to Learn:**
- Mobile chat UI
- Touch interactions
- Keyboard handling
- Mobile navigation

**Implementation Steps:**
1. Create ChatScreen
2. Display messages
3. Add message input
4. Handle keyboard
5. Auto-scroll on new messages
6. Style for mobile
7. Add navigation

**Acceptance Criteria:**
- Chat displays
- Input works
- Keyboard handled
- Auto-scrolls
- Mobile-optimized

**Resources:**
- Mobile chat UI
- Keyboard handling
- Touch interactions

---

#### Ticket 66: Offline Storage for Notes and Tasks
**Commit**: `feat: add offline storage for notes and tasks`

**What to Learn:**
- Local storage
- Data persistence
- Storage patterns
- Cache management

**Implementation Steps:**
1. Create offline storage utility
2. Store notes locally
3. Store tasks locally
4. Implement cache invalidation
5. Handle storage limits
6. Add storage management

**Acceptance Criteria:**
- Notes cached locally
- Tasks cached locally
- Cache updates
- Handles storage limits
- Works offline

**Resources:**
- AsyncStorage
- Local storage patterns
- Cache management

---

#### Ticket 67: Sync on Reconnect
**Commit**: `feat: implement sync on reconnect`

**What to Learn:**
- Network detection
- Sync strategies
- Conflict resolution
- Error handling

**Implementation Steps:**
1. Detect network reconnection
2. Get sync checkpoint
3. Fetch changes from server
4. Merge local and server changes
5. Handle conflicts
6. Update local cache
7. Show sync status

**Acceptance Criteria:**
- Detects reconnection
- Syncs changes
- Handles conflicts
- Updates cache
- Shows status

**Resources:**
- Network detection
- Sync strategies
- Conflict resolution

---

#### Ticket 68: Offline/Sync Status in UI
**Commit**: `feat: show offline/sync status in ui`

**What to Learn:**
- Status indicators
- User feedback
- Network state
- UI patterns

**Implementation Steps:**
1. Create network status hook
2. Detect online/offline
3. Show status indicator
4. Show sync progress
5. Show sync errors
6. Update UI based on status

**Acceptance Criteria:**
- Shows offline status
- Shows sync status
- Shows errors
- Updates correctly
- Clear to users

**Resources:**
- Status indicators
- Network state
- User feedback

---

## ✅ Demo Checkpoint

**What to Demonstrate:**
1. User can send direct messages
2. User can view conversation history
3. User can use app offline (notes, tasks, flashcards)
4. User can compose messages offline
5. App syncs when back online
6. Sync status is visible
7. Conflicts are resolved

**Success Criteria:**
- Messaging works
- Offline functionality works
- Sync works correctly
- Status indicators clear
- Conflicts handled

---

## 📚 Learning Resources

### Messaging Systems
- Chat UI patterns
- Message delivery
- Read receipts

### Offline Patterns
- Offline-first architecture
- Sync strategies
- Conflict resolution

### Local Storage
- AsyncStorage patterns
- Cache management
- Storage optimization

---

## 🐛 Common Issues & Solutions

**Issue**: Message delivery reliability
- **Solution**: Implement retry logic, queue messages, handle failures gracefully

**Issue**: Sync conflicts
- **Solution**: Use timestamps, implement merge strategies, allow manual resolution

**Issue**: Offline storage limits
- **Solution**: Implement storage quotas, cache eviction, prioritize important data

**Issue**: Network detection
- **Solution**: Use network APIs, handle edge cases, test thoroughly

---

## 📝 Notes

- Offline-first is complex - start simple
- Sync conflicts need good UX
- Message delivery should be reliable
- Storage limits need consideration
- Network detection can be tricky

