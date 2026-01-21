# Sprint 7: Career Tools
**March 30 - April 5 | Resumes & Applications**

## Sprint Objectives
Add career management features - resume uploads with AI feedback and application tracking dashboard.

**Key Learning Goals:**
- File upload handling
- PDF processing
- AI analysis integration
- Dashboard data aggregation
- Pipeline visualization
- Status management

---

## Detailed Task Breakdown

### Backend Development (Tickets 69-73)

#### Ticket 69: Resume PDF Upload Endpoint
**Commit**: `feat: add resume pdf upload endpoint`

**What to Learn:**
- File upload handling
- Multipart form data
- File validation
- Storage integration

**Implementation Steps:**
1. Install multer for file uploads
2. Create POST /resumes endpoint
3. Accept multipart/form-data
4. Validate file type (PDF only)
5. Validate file size (max 5MB)
6. Store file (local or cloud storage)
7. Save resume metadata to database
8. Return resume ID and file URL

**Acceptance Criteria:**
- Can upload PDF files
- Validates file type
- Validates file size
- Stores file correctly
- Saves metadata

**Resources:**
- Multer documentation
- File upload patterns
- Storage solutions

---

#### Ticket 70: Resume and Feedback Models
**Commit**: `feat: add resume and feedback models`

**What to Learn:**
- File metadata modeling
- Feedback storage
- Version management
- Relationship patterns

**Implementation Steps:**
1. Design Resume schema (userId, label, fileUrl, targetRole, createdAt, version)
2. Design ResumeFeedback schema (resumeId, feedback, strengths, improvements, createdAt)
3. Create models with Mongoose
4. Add validation
5. Add indexes
6. Create helper methods

**Acceptance Criteria:**
- Models created
- Relationships work
- Can store feedback
- Version tracking works
- Validation works

**Resources:**
- File metadata modeling
- Feedback systems
- Version management

---

#### Ticket 71: AI Resume Analysis
**Commit**: `feat: implement ai resume analysis`

**What to Learn:**
- PDF text extraction
- Groq API analysis prompts (Llama 3.1 70B)
- Structured feedback
- Rate limit management

**Implementation Steps:**
1. Install PDF parsing library
2. Extract text from PDF
3. Design analysis prompt
4. Call Groq API (Llama 3.1 70B) with resume text
5. Parse structured feedback
6. Store feedback in database
7. Return feedback to client

**Acceptance Criteria:**
- Extracts text from PDF
- Generates feedback
- Feedback is structured
- Stored correctly
- Respects rate limits

**Resources:**
- PDF parsing libraries
- Groq AI Integration Strategy (../database/groq_ai_integration.md)
- Text extraction

---

#### Ticket 72: Application Tracking Model and Endpoints
**Commit**: `feat: add application tracking model and endpoints`

**What to Learn:**
- Application data modeling
- Status workflows
- CRUD operations
- Query patterns

**Implementation Steps:**
1. Design Application schema (userId, company, position, status, appliedDate, notes, networking, links, createdAt)
2. Create Application model
3. Implement POST /applications
4. Implement GET /applications (with filters)
5. Implement PATCH /applications/:id
6. Implement DELETE /applications/:id
7. Add status validation

**Acceptance Criteria:**
- Can create applications
- Can list with filters
- Can update applications
- Can delete applications
- Status validation works

**Resources:**
- Application tracking models
- Status workflows
- CRUD patterns

---

#### Ticket 73: Applications Dashboard Endpoint
**Commit**: `feat: create applications dashboard endpoint`

**What to Learn:**
- Data aggregation
- Dashboard queries
- Pipeline statistics
- Timeline generation

**Implementation Steps:**
1. Create GET /applications/dashboard endpoint
2. Aggregate by status (counts)
3. Calculate pipeline metrics
4. Generate activity timeline
5. Include recent applications
6. Optimize queries
7. Format for dashboard

**Acceptance Criteria:**
- Returns status counts
- Returns pipeline metrics
- Returns timeline
- Query is efficient
- Formatted correctly

**Resources:**
- Dashboard aggregation
- Pipeline visualization
- Timeline generation

---

### Web Frontend (Tickets 74-77)

#### Ticket 74: Resume Upload with Drag and Drop
**Commit**: `feat: create resume upload with drag and drop`

**What to Learn:**
- File input handling
- Drag and drop UI
- Upload progress
- File preview

**Implementation Steps:**
1. Create ResumeUpload component
2. Add drag and drop area
3. Add file input
4. Handle file selection
5. Show upload progress
6. Validate file before upload
7. Display uploaded resumes

**Acceptance Criteria:**
- Drag and drop works
- File input works
- Progress shown
- Validation works
- Resumes display

**Resources:**
- Drag and drop patterns
- File upload UI
- Progress indicators

---

#### Ticket 75: Resume Feedback Display Component
**Commit**: `feat: build resume feedback display component`

**What to Learn:**
- Feedback UI patterns
- Structured data display
- Comparison views
- Action items

**Implementation Steps:**
1. Create FeedbackDisplay component
2. Fetch feedback from API
3. Display strengths section
4. Display improvements section
5. Show action items
6. Add version comparison
7. Style feedback display

**Acceptance Criteria:**
- Feedback displays
- Structured clearly
- Action items shown
- Comparison works
- Easy to read

**Resources:**
- Feedback UI patterns
- Structured displays
- Comparison views

---

#### Ticket 76: Application Pipeline Dashboard
**Commit**: `feat: implement application pipeline dashboard`

**What to Learn:**
- Dashboard UI patterns
- Pipeline visualization
- Data visualization
- Interactive charts

**Implementation Steps:**
1. Create Dashboard component
2. Fetch dashboard data
3. Display status counts
4. Create pipeline visualization
5. Show activity timeline
6. Add filters
7. Style dashboard

**Acceptance Criteria:**
- Dashboard displays
- Pipeline visualized
- Timeline shown
- Filters work
- Updates correctly

**Resources:**
- Dashboard patterns
- Pipeline visualization
- Data visualization

---

#### Ticket 77: Application Detail Modal with Networking
**Commit**: `feat: add application detail modal with networking`

**What to Learn:**
- Modal patterns
- Form handling
- Networking tracking
- Detail views

**Implementation Steps:**
1. Create ApplicationModal component
2. Display application details
3. Add status update
4. Add networking section
5. Track contacts
6. Add notes section
7. Handle save

**Acceptance Criteria:**
- Modal displays
- Details shown
- Can update status
- Networking tracked
- Saves correctly

**Resources:**
- Modal patterns
- Detail views
- Form handling

---

### Mobile Development (Tickets 78-80)

#### Ticket 78: Mobile Resume Management Screen
**Commit**: `feat: add mobile resume management screen`

**What to Learn:**
- Mobile file handling
- Mobile lists
- Mobile navigation
- Touch interactions

**Implementation Steps:**
1. Create ResumeList screen
2. Display resume list
3. Add upload button
4. Handle file selection
5. Show resume details
6. Add delete action
7. Style for mobile

**Acceptance Criteria:**
- Lists resumes
- Can upload
- Can view details
- Can delete
- Mobile-friendly

**Resources:**
- Mobile file handling
- Mobile lists
- Touch interactions

---

#### Ticket 79: Mobile Application Tracking
**Commit**: `feat: implement mobile application tracking`

**What to Learn:**
- Mobile forms
- Mobile lists
- Status updates
- Mobile navigation

**Implementation Steps:**
1. Create ApplicationList screen
2. Display applications
3. Add create button
4. Create ApplicationForm screen
5. Add status update
6. Show application details
7. Style for mobile

**Acceptance Criteria:**
- Lists applications
- Can create
- Can update status
- Details shown
- Mobile-optimized

**Resources:**
- Mobile forms
- Mobile lists
- Status management

---

#### Ticket 80: Application Status Update UI
**Commit**: `feat: build application status update ui`

**What to Learn:**
- Status workflows
- Mobile interactions
- Quick actions
- User feedback

**Implementation Steps:**
1. Add status selector
2. Show status options
3. Handle status change
4. Show confirmation
5. Update UI optimistically
6. Handle errors
7. Add quick actions

**Acceptance Criteria:**
- Status selector works
- Can update status
- Confirmation shown
- Updates correctly
- Quick actions work

**Resources:**
- Status workflows
- Mobile interactions
- Quick actions

---

## Demo Checkpoint

**What to Demonstrate:**
1. User can upload resume PDF
2. User receives AI feedback on resume
3. User can create application entries
4. User can track application status
5. User can view pipeline dashboard
6. User can log networking contacts
7. User can manage applications on mobile

**Success Criteria:**
- Resume upload works
- AI feedback generated
- Application tracking works
- Dashboard displays correctly
- Mobile features work

---

## Learning Resources

### File Handling
- File upload patterns
- PDF processing
- Storage solutions

### AI Analysis
- Groq API prompts (Llama 3.1 70B)
- Text extraction
- Feedback generation

### Dashboards
- Dashboard design
- Pipeline visualization
- Data aggregation

---

## 🐛 Common Issues & Solutions

**Issue**: PDF text extraction quality
- **Solution**: Use reliable libraries, handle various PDF formats, test with different resumes

**Issue**: File upload size limits
- **Solution**: Validate size, compress if needed, show clear error messages

**Issue**: AI feedback quality
- **Solution**: Refine prompts, add validation, allow manual editing

**Issue**: Dashboard performance
- **Solution**: Optimize queries, cache data, paginate if needed

---

## Notes

- File uploads need good error handling
- AI feedback should be actionable
- Dashboard should be performant
- Mobile file handling can be tricky
- Consider resume versioning for future

