# Sprint 5: Collaboration Layer
**March 16-22 | Friends & Sharing**

## 🎯 Sprint Objectives
Enable social features - friend system, sharing notes, comments, and shared tasks.

**Key Learning Goals:**
- Social data modeling
- Friend request workflows
- Sharing and permissions
- Comment systems
- Activity feeds
- Real-time updates (optional)

---

## 📋 Detailed Task Breakdown

### Backend Development (Tickets 47-51)

#### Ticket 47: Friendship and Friend Request Models
**Commit**: `feat: add friendship and friend request models`

**What to Learn:**
- Many-to-many relationships
- Request/response patterns
- Status management
- Data modeling for social features

**Implementation Steps:**
1. Design FriendRequest schema (fromUserId, toUserId, status, createdAt)
2. Design Friendship schema (user1Id, user2Id, createdAt)
3. Create models with Mongoose
4. Add validation (can't friend self, prevent duplicates)
5. Add indexes for queries
6. Create helper methods

**Acceptance Criteria:**
- Models created correctly
- Relationships work
- Validation prevents duplicates
- Queries are efficient

**Resources:**
- Many-to-many relationships
- Social data modeling
- Request patterns

---

#### Ticket 48: Friend Request Send and Respond
**Commit**: `feat: implement friend request send and respond`

**What to Learn:**
- Request workflows
- Status transitions
- Notification patterns
- Error handling

**Implementation Steps:**
1. Create POST /friends/requests endpoint
2. Validate request (not already friends, not pending)
3. Create friend request
4. Create POST /friends/requests/:id/respond endpoint
5. Handle accept/decline
6. Create friendship on accept
7. Delete request after response

**Acceptance Criteria:**
- Can send friend requests
- Can accept/decline requests
- Prevents duplicate requests
- Creates friendship on accept
- Handles errors

**Resources:**
- Request workflows
- Status management
- API design patterns

---

#### Ticket 49: Comment and Like Models
**Commit**: `feat: create comment and like models`

**What to Learn:**
- Polymorphic relationships
- Comment threading
- Like/dislike patterns
- Data modeling

**Implementation Steps:**
1. Design Comment schema (content, userId, noteId, createdAt, parentId for replies)
2. Design Like schema (userId, noteId, createdAt)
3. Create models
4. Add validation
5. Add indexes
6. Create helper methods

**Acceptance Criteria:**
- Models created
- Relationships work
- Can query comments
- Can query likes
- Validation works

**Resources:**
- Comment systems
- Like patterns
- Polymorphic relationships

---

#### Ticket 50: Note Sharing with Visibility Controls
**Commit**: `feat: add note sharing with visibility controls`

**What to Learn:**
- Permission systems
- Visibility controls
- Access control
- Sharing patterns

**Implementation Steps:**
1. Add visibility field to Note model (private, friends-only)
2. Create POST /notes/:id/share endpoint
3. Update note visibility
4. Modify GET /notes to filter by visibility
5. Check permissions on note access
6. Add friends-only filtering

**Acceptance Criteria:**
- Can change note visibility
- Private notes hidden from others
- Friends-only notes visible to friends
- Permissions checked correctly

**Resources:**
- Permission systems
- Access control patterns
- Sharing models

---

#### Ticket 51: Shared Tasks with Participants
**Commit**: `feat: implement shared tasks with participants`

**What to Learn:**
- Multi-user task ownership
- Participant management
- Calendar aggregation
- Collaboration patterns

**Implementation Steps:**
1. Add participants array to Task model
2. Create POST /tasks/:id/share endpoint
3. Add/remove participants
4. Update calendar endpoint to include shared tasks
5. Ensure participants can view/edit
6. Handle permissions

**Acceptance Criteria:**
- Can share tasks
- Participants can see task
- Calendar includes shared tasks
- Permissions work correctly

**Resources:**
- Multi-user ownership
- Collaboration patterns
- Permission systems

---

### Web Frontend (Tickets 52-55)

#### Ticket 52: User Search and Friend Request UI
**Commit**: `feat: add user search and friend request ui`

**What to Learn:**
- Search UI patterns
- User lists
- Request management
- State management

**Implementation Steps:**
1. Create UserSearch component
2. Implement search input
3. Display search results
4. Add send request button
5. Show request status
6. Create FriendsList component
7. Show pending requests

**Acceptance Criteria:**
- Can search users
- Can send requests
- Shows request status
- Lists friends
- Shows pending requests

**Resources:**
- Search UI patterns
- User management UI
- Request workflows

---

#### Ticket 53: Friends Activity Feed
**Commit**: `feat: create friends activity feed`

**What to Learn:**
- Feed algorithms
- Activity aggregation
- Real-time updates (optional)
- Feed UI patterns

**Implementation Steps:**
1. Create Feed component
2. Fetch friends' shared notes
3. Sort by recent activity
4. Display feed items
5. Show note previews
6. Add pagination
7. Style feed

**Acceptance Criteria:**
- Feed displays shared notes
- Sorted by activity
- Shows note previews
- Pagination works
- Updates when new shares

**Resources:**
- Activity feed patterns
- Aggregation techniques
- Feed UI design

---

#### Ticket 54: Comments and Likes on Shared Notes
**Commit**: `feat: implement comments and likes on shared notes`

**What to Learn:**
- Comment UI patterns
- Like interactions
- Real-time updates
- Social interactions

**Implementation Steps:**
1. Add comment section to note viewer
2. Display existing comments
3. Add comment input
4. Implement like button
5. Show like count
6. Handle comment submission
7. Update UI optimistically

**Acceptance Criteria:**
- Can view comments
- Can add comments
- Can like notes
- Like count updates
- Comments display correctly

**Resources:**
- Comment UI patterns
- Like interactions
- Social features

---

#### Ticket 55: Display Shared Tasks in Calendar View
**Commit**: `feat: display shared tasks in calendar view`

**What to Learn:**
- Calendar integration
- Multi-user data
- Visual differentiation
- Collaboration UI

**Implementation Steps:**
1. Update calendar to fetch shared tasks
2. Display shared tasks differently
3. Show participant info
4. Add visual indicators
5. Handle task updates
6. Update calendar on changes

**Acceptance Criteria:**
- Shared tasks show in calendar
- Visually distinct
- Shows participants
- Updates correctly

**Resources:**
- Calendar integration
- Multi-user UI
- Collaboration patterns

---

### Mobile Development (Tickets 56-58)

#### Ticket 56: Mobile Friends Management Screen
**Commit**: `feat: add mobile friends management screen`

**What to Learn:**
- Mobile social UI
- Touch interactions
- Mobile navigation
- List patterns

**Implementation Steps:**
1. Create FriendsScreen
2. Show friends list
3. Show pending requests
4. Add search functionality
5. Implement request actions
6. Style for mobile
7. Add navigation

**Acceptance Criteria:**
- Lists friends
- Shows requests
- Can search
- Actions work
- Mobile-friendly

**Resources:**
- Mobile social UI
- Touch interactions
- List patterns

---

#### Ticket 57: Shared Note Viewing on Mobile
**Commit**: `feat: implement shared note viewing on mobile`

**What to Learn:**
- Mobile content viewing
- Sharing indicators
- Mobile interactions
- Permission display

**Implementation Steps:**
1. Update note viewer for shared notes
2. Show sharing status
3. Display comments
4. Add like functionality
5. Show owner info
6. Handle permissions

**Acceptance Criteria:**
- Can view shared notes
- Shows sharing info
- Comments work
- Likes work
- Permissions clear

**Resources:**
- Mobile content viewing
- Sharing UI
- Social interactions

---

#### Ticket 58: Mobile Comment Interface
**Commit**: `feat: build mobile comment interface`

**What to Learn:**
- Mobile comment UI
- Touch interactions
- Keyboard handling
- Mobile forms

**Implementation Steps:**
1. Create CommentSection component
2. Display comments list
3. Add comment input
4. Handle keyboard
5. Submit comments
6. Style for mobile
7. Add reply functionality

**Acceptance Criteria:**
- Comments display
- Can add comments
- Keyboard handled
- Replies work
- Mobile-optimized

**Resources:**
- Mobile comment UI
- Keyboard handling
- Touch interactions

---

## ✅ Demo Checkpoint

**What to Demonstrate:**
1. User can search for other users
2. User can send friend requests
3. User can accept/decline requests
4. User can share notes with friends
5. User can comment on shared notes
6. User can like shared notes
7. User can create shared tasks
8. Shared tasks appear on all participants' calendars

**Success Criteria:**
- Friend system works
- Sharing works
- Comments and likes functional
- Shared tasks work
- All features work on mobile

---

## 📚 Learning Resources

### Social Features
- Friend system patterns
- Sharing models
- Permission systems

### Comment Systems
- Comment threading
- Real-time updates
- UI patterns

### Collaboration
- Multi-user patterns
- Shared ownership
- Activity feeds

---

## 🐛 Common Issues & Solutions

**Issue**: Friend request duplicates
- **Solution**: Add unique constraints, check before creating, handle race conditions

**Issue**: Permission checking performance
- **Solution**: Cache permissions, optimize queries, use indexes

**Issue**: Comment threading complexity
- **Solution**: Use parentId pattern, limit nesting depth, optimize queries

**Issue**: Real-time updates
- **Solution**: Consider WebSockets for future, use polling for MVP, optimize updates

---

## 📝 Notes

- Focus on permission system - security is important
- Friend requests need good UX
- Comments should be performant even with many comments
- Shared tasks are key collaboration feature
- Consider notification system for future

