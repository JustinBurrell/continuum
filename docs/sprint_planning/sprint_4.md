# Sprint 4: Time Management
**March 9-15 | Tasks & Calendar**

## Sprint Objectives
Build task management with calendar views to track assignments and deadlines.

**Key Learning Goals:**
- Task data modeling
- Calendar UI components
- Date/time handling
- Task relationships
- Filtering and sorting
- Mobile calendar views

---

## Detailed Task Breakdown

### Backend Development (Tickets 36-39)

#### Ticket 36: Task Model with Note Linking
**Commit**: `feat: add task model with note linking`

**What to Learn:**
- Database relationships
- Reference fields in Mongoose
- Task data modeling
- Optional relationships

**Implementation Steps:**
1. Design Task schema (title, description, dueDate, priority, status, duration, noteId, userId, createdAt)
2. Add reference to Note model
3. Create Task model with Mongoose
4. Add validation rules
5. Add indexes for queries
6. Test model creation

**Acceptance Criteria:**
- Task model created
- Can link to notes
- Validation works
- Indexes created
- Relationships queryable

**Resources:**
- Mongoose references
- Task modeling patterns
- Database indexing

---

#### Ticket 37: Task CRUD Endpoints
**Commit**: `feat: implement task crud endpoints`

**What to Learn:**
- RESTful task operations
- Date handling
- Query filtering
- Status management

**Implementation Steps:**
1. Implement POST /tasks (create)
2. Implement GET /tasks (list with filters)
3. Implement GET /tasks/:id (get single)
4. Implement PATCH /tasks/:id (update)
5. Implement DELETE /tasks/:id (delete)
6. Add filtering (status, priority, date range)
7. Add sorting options

**Acceptance Criteria:**
- Can create tasks
- Can list with filters
- Can update tasks
- Can delete tasks
- Filters work correctly

**Resources:**
- RESTful API patterns
- Query filtering
- Date handling in APIs

---

#### Ticket 38: Calendar Aggregation Endpoint
**Commit**: `feat: create calendar aggregation endpoint`

**What to Learn:**
- Data aggregation
- Date range queries
- Efficient querying
- Response formatting

**Implementation Steps:**
1. Create GET /calendar endpoint
2. Accept date range parameters
3. Query tasks in date range
4. Include shared tasks
5. Format for calendar display
6. Group by date
7. Optimize query performance

**Acceptance Criteria:**
- Returns tasks for date range
- Includes shared tasks
- Formatted for calendar
- Query is efficient
- Handles edge cases

**Resources:**
- MongoDB aggregation
- Date range queries
- Calendar data structures

---

#### Ticket 39: Overdue Task Detection
**Commit**: `feat: add overdue task detection`

**What to Learn:**
- Date comparison
- Background jobs (optional)
- Status updates
- Notification patterns

**Implementation Steps:**
1. Add overdue field to Task model
2. Create function to detect overdue
3. Update task status when overdue
4. Add endpoint to check overdue
5. Consider background job for updates
6. Add overdue filter

**Acceptance Criteria:**
- Detects overdue tasks
- Updates status correctly
- Can filter overdue tasks
- Handles timezones

**Resources:**
- Date comparison
- Background jobs
- Status management

---

### Web Frontend (Tickets 40-43)

#### Ticket 40: Task Creation Modal with Date Picker
**Commit**: `feat: add task creation modal with date picker`

**What to Learn:**
- Modal components
- Date picker libraries
- Form validation
- Time input handling

**Implementation Steps:**
1. Create TaskModal component
2. Add form fields (title, description, due date, priority, duration)
3. Integrate date picker library
4. Add note linking dropdown
5. Implement form validation
6. Handle submission
7. Close modal on success

**Acceptance Criteria:**
- Modal opens/closes
- Date picker works
- Form validates
- Can link to notes
- Saves correctly

**Resources:**
- React modal patterns
- Date picker libraries
- Form validation

---

#### Ticket 41: Task List with Status Filters
**Commit**: `feat: create task list with status filters`

**What to Learn:**
- List rendering
- Filter state management
- Status indicators
- Task actions

**Implementation Steps:**
1. Create TaskList component
2. Fetch tasks from API
3. Add filter buttons (all, todo, in-progress, completed, overdue)
4. Implement filtering logic
5. Display task cards
6. Add status indicators
7. Add quick actions (complete, delete)

**Acceptance Criteria:**
- List displays tasks
- Filters work
- Status shown clearly
- Actions work
- Updates reflect immediately

**Resources:**
- React filtering
- Status UI patterns
- List components

---

#### Ticket 42: Calendar Grid View Component
**Commit**: `feat: build calendar grid view component`

**What to Learn:**
- Calendar UI components
- Grid layouts
- Date calculations
- Event rendering

**Implementation Steps:**
1. Create CalendarView component
2. Generate calendar grid (weeks/days)
3. Fetch tasks for date range
4. Render tasks on calendar
5. Add navigation (prev/next month)
6. Highlight current date
7. Show task indicators

**Acceptance Criteria:**
- Calendar displays correctly
- Tasks show on dates
- Navigation works
- Current date highlighted
- Responsive layout

**Resources:**
- Calendar UI libraries
- Grid layouts
- Date calculations

---

#### Ticket 43: Inline Task Editing
**Commit**: `feat: implement inline task editing`

**What to Learn:**
- Inline editing patterns
- Optimistic updates
- Form state management
- User experience

**Implementation Steps:**
1. Add edit mode to task cards
2. Make fields editable inline
3. Add save/cancel buttons
4. Implement save functionality
5. Show loading state
6. Handle errors
7. Update UI optimistically

**Acceptance Criteria:**
- Can edit inline
- Changes save
- Cancel works
- Loading shown
- Errors handled

**Resources:**
- Inline editing patterns
- Optimistic updates
- UX best practices

---

### Mobile Development (Tickets 44-46)

#### Ticket 44: Mobile Task Creation Form
**Commit**: `feat: add mobile task creation form`

**What to Learn:**
- Mobile forms
- Mobile date pickers
- Touch-friendly inputs
- Mobile navigation

**Implementation Steps:**
1. Create TaskForm screen
2. Add form fields
3. Use mobile date picker
4. Add note selection
5. Implement save
6. Navigate back on success
7. Style for mobile

**Acceptance Criteria:**
- Form works on mobile
- Date picker mobile-friendly
- Can link notes
- Saves correctly
- Navigation works

**Resources:**
- React Native forms
- Mobile date pickers
- Touch interactions

---

#### Ticket 45: Mobile Calendar View
**Commit**: `feat: implement mobile calendar view`

**What to Learn:**
- Mobile calendar UI
- Touch navigation
- Mobile layouts
- Responsive design

**Implementation Steps:**
1. Create CalendarScreen
2. Display month view
3. Show tasks on dates
4. Add swipe navigation
5. Tap date to view tasks
6. Style for mobile
7. Handle orientation

**Acceptance Criteria:**
- Calendar displays
- Tasks show
- Swipe works
- Tap navigation works
- Mobile-optimized

**Resources:**
- Mobile calendar patterns
- Swipe navigation
- Mobile layouts

---

#### Ticket 46: Swipe Actions for Task Status
**Commit**: `feat: add swipe actions for task status`

**What to Learn:**
- Swipe gestures
- Action patterns
- Status updates
- Mobile interactions

**Implementation Steps:**
1. Add swipe handlers to task items
2. Implement swipe left/right
3. Show action buttons
4. Update status on action
5. Add haptic feedback
6. Handle edge cases

**Acceptance Criteria:**
- Swipe works
- Actions trigger
- Status updates
- Feedback provided
- Smooth interaction

**Resources:**
- React Native gestures
- Swipe patterns
- Mobile interactions

---

## Demo Checkpoint

**What to Demonstrate:**
1. User can create tasks with due dates
2. User can link tasks to notes
3. User can view tasks in calendar
4. User can filter tasks by status
5. User can mark tasks complete
6. User can view calendar on mobile
7. Overdue tasks are detected

**Success Criteria:**
- Task creation works
- Calendar displays correctly
- Filters work
- Mobile views functional
- Status updates work

---

## Learning Resources

### Task Management
- Task modeling patterns
- Calendar algorithms
- Date/time handling

### UI Components
- Calendar libraries
- Date pickers
- Filter components

### Mobile
- Mobile calendar patterns
- Swipe interactions
- Touch feedback

---

## 🐛 Common Issues & Solutions

**Issue**: Calendar date calculations
- **Solution**: Use date libraries (date-fns, moment), handle timezones correctly

**Issue**: Task filtering performance
- **Solution**: Implement client-side filtering, use indexes, paginate results

**Issue**: Mobile calendar layout
- **Solution**: Use responsive design, test on various screen sizes, optimize touch targets

**Issue**: Date picker timezone issues
- **Solution**: Store dates in UTC, convert for display, handle user timezone

---

## Notes

- Focus on date handling - timezones are tricky
- Calendar UI can be complex - consider using a library
- Mobile calendar needs to be touch-friendly
- Task relationships to notes are important for workflow
- Consider recurring tasks for future features

