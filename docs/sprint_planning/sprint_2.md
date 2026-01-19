# Sprint 2: Content Foundation
**February 23 - March 1 | Google Docs & Notes**

## Sprint Objectives
Connect to Google Drive, import docs as notes, and build note viewing/management features.

**Key Learning Goals:**
- Google Drive API integration
- Google Docs API for content extraction
- Document parsing and storage
- Note management CRUD operations
- File picker UI components
- Scrollable content viewers

---

## Detailed Task Breakdown

### Backend Development (Tickets 14-17)

#### Ticket 14: Google Drive API Client Integration
**Commit**: `feat: add google drive api client integration`

**What to Learn:**
- Google APIs Node.js client library
- OAuth token management for Google APIs
- Drive API file listing and metadata
- API rate limiting and error handling

**Implementation Steps:**
1. Install googleapis package
2. Set up Google Drive API credentials
3. Create Google API service utility
4. Implement token refresh logic
5. Create endpoint to list user's Google Docs
6. Filter for document types only
7. Handle API errors and rate limits

**Acceptance Criteria:**
- Can list user's Google Docs
- Returns document metadata (id, name, modified date)
- Handles expired tokens with refresh
- Respects API rate limits

**Resources:**
- Google Drive API documentation
- googleapis Node.js client
- OAuth token refresh patterns

---

#### Ticket 15: Note Model and CRUD Endpoints
**Commit**: `feat: add note model and crud endpoints`

**What to Learn:**
- MongoDB schema design for notes
- RESTful API endpoint patterns
- Query filtering and pagination
- Data validation with Mongoose

**Implementation Steps:**
1. Design Note schema (title, content, tags, userId, googleDocId, createdAt, updatedAt)
2. Create Note model with Mongoose
3. Implement POST /notes (create manual note)
4. Implement GET /notes (list with filters)
5. Implement GET /notes/:id (get single note)
6. Implement PATCH /notes/:id (update note)
7. Implement DELETE /notes/:id (delete note)
8. Add pagination support

**Acceptance Criteria:**
- Can create notes manually
- Can list notes with filters (tags, search)
- Can retrieve single note
- Can update note properties
- Can delete notes
- All operations require authentication

**Resources:**
- Mongoose CRUD operations
- RESTful API design
- Query filtering patterns

---

#### Ticket 16: Google Doc Import as Note Snapshot
**Commit**: `feat: implement google doc import as note snapshot`

**What to Learn:**
- Google Docs API content extraction
- Document parsing and formatting
- Storing document snapshots
- Linking external documents

**Implementation Steps:**
1. Install Google Docs API client
2. Create endpoint POST /notes/import/google-doc
3. Fetch document content from Google Docs API
4. Parse and format content (preserve structure)
5. Create note with imported content
6. Store Google Doc ID for future refresh
7. Handle large documents (chunking if needed)

**Acceptance Criteria:**
- Can import Google Doc as note
- Content is preserved and readable
- Google Doc ID stored for refresh
- Handles documents of various sizes
- Error handling for inaccessible docs

**Resources:**
- Google Docs API documentation
- Document parsing techniques
- Content formatting best practices

---

#### Ticket 17: Note Refresh from Google Docs
**Commit**: `feat: add note refresh from google docs`

**What to Learn:**
- Updating existing documents
- Change detection
- Version management concepts
- Efficient update patterns

**Implementation Steps:**
1. Create endpoint POST /notes/:id/refresh
2. Check if note has linked Google Doc
3. Fetch latest version from Google Docs API
4. Compare with current content
5. Update note content if changed
6. Update modified timestamp
7. Return refresh status

**Acceptance Criteria:**
- Can refresh note from Google Doc
- Only updates if content changed
- Preserves note metadata (tags, etc.)
- Handles deleted/moved documents
- Returns success/error status

**Resources:**
- Google Docs API updates
- Change detection algorithms
- Update optimization patterns

---

### Web Frontend (Tickets 18-21)

#### Ticket 18: Google Drive File Picker Component
**Commit**: `feat: add google drive file picker component`

**What to Learn:**
- Google Picker API integration
- React component state management
- File selection UI patterns
- Loading states and error handling

**Implementation Steps:**
1. Set up Google Picker API
2. Create FilePicker component
3. Implement file selection dialog
4. Handle file selection callback
5. Display selected file info
6. Add loading and error states
7. Style picker button/UI

**Acceptance Criteria:**
- File picker opens Google Drive
- Can select Google Docs
- Selected file info displays
- Loading states work
- Errors handled gracefully

**Resources:**
- Google Picker API documentation
- React component patterns
- File selection UI/UX

---

#### Ticket 19: Notes List with Search and Filters
**Commit**: `feat: create notes list with search and filters`

**What to Learn:**
- List rendering in React
- Search functionality
- Filtering and sorting
- Pagination UI patterns

**Implementation Steps:**
1. Create NotesList component
2. Fetch notes from API
3. Implement search input
4. Add filter options (tags, date, type)
5. Implement sorting (date, title)
6. Add pagination controls
7. Display note cards/previews
8. Handle empty states

**Acceptance Criteria:**
- Notes list displays correctly
- Search filters notes in real-time
- Filters work independently and together
- Sorting changes list order
- Pagination works
- Empty states display properly

**Resources:**
- React list rendering
- Search and filter patterns
- Pagination components

---

#### Ticket 20: Scrollable Note Viewer
**Commit**: `feat: add scrollable note viewer`

**What to Learn:**
- Content rendering
- Scroll handling
- Text formatting
- Responsive design

**Implementation Steps:**
1. Create NoteViewer component
2. Fetch note content from API
3. Render formatted content
4. Implement smooth scrolling
5. Add scroll position indicators
6. Handle long content
7. Style for readability

**Acceptance Criteria:**
- Note content displays correctly
- Scrolling is smooth
- Content is readable
- Handles very long notes
- Formatting preserved

**Resources:**
- React content rendering
- CSS scrolling techniques
- Typography and readability

---

#### Ticket 21: Note Editing and Tag Management
**Commit**: `feat: implement note editing and tag management`

**What to Learn:**
- Rich text editing (or markdown)
- Tag input components
- Form state management
- Optimistic UI updates

**Implementation Steps:**
1. Create NoteEditor component
2. Implement content editing (textarea or rich editor)
3. Add tag input with autocomplete
4. Implement save functionality
5. Add cancel/discard changes
6. Show save status
7. Handle validation errors

**Acceptance Criteria:**
- Can edit note content
- Can add/remove tags
- Changes save correctly
- Validation works
- UI updates optimistically

**Resources:**
- React form editing
- Tag input components
- Rich text editors (optional)
- Optimistic updates

---

### Mobile Development (Tickets 22-24)

#### Ticket 22: Mobile Document List Screen
**Commit**: `feat: add mobile document list screen`

**What to Learn:**
- React Native list components
- Mobile UI patterns
- Touch interactions
- Mobile navigation

**Implementation Steps:**
1. Create DocumentList screen
2. Fetch Google Docs from API
3. Use FlatList for rendering
4. Add pull-to-refresh
5. Implement item selection
6. Add loading states
7. Style for mobile

**Acceptance Criteria:**
- List displays on mobile
- Can scroll through documents
- Pull-to-refresh works
- Tapping item navigates
- Loading states show

**Resources:**
- React Native FlatList
- Mobile list patterns
- Touch interactions

---

#### Ticket 23: Mobile Scrollable Note Viewer
**Commit**: `feat: create mobile scrollable note viewer`

**What to Learn:**
- Mobile content viewing
- ScrollView component
- Mobile typography
- Responsive mobile design

**Implementation Steps:**
1. Create NoteViewer screen
2. Fetch note content
3. Use ScrollView for content
4. Format text for mobile
5. Add navigation header
6. Handle long content
7. Style for mobile reading

**Acceptance Criteria:**
- Note displays on mobile
- Scrolling works smoothly
- Text is readable
- Navigation works
- Handles long notes

**Resources:**
- React Native ScrollView
- Mobile typography
- Mobile reading patterns

---

#### Ticket 24: Note Import and Refresh on Mobile
**Commit**: `feat: implement note import and refresh on mobile`

**What to Learn:**
- Mobile file selection
- Mobile API integration
- Mobile UI feedback
- Touch gestures

**Implementation Steps:**
1. Add import button to document list
2. Implement import action
3. Show loading indicator
4. Navigate to imported note
5. Add refresh action to note viewer
6. Show refresh status
7. Handle errors

**Acceptance Criteria:**
- Can import notes on mobile
- Import shows progress
- Refresh works
- Errors handled
- UI feedback clear

**Resources:**
- Mobile file operations
- Mobile loading patterns
- Touch feedback

---

## Demo Checkpoint

**What to Demonstrate:**
1. User can browse their Google Drive documents
2. User can import a Google Doc as a note
3. User can view imported notes on web
4. User can view imported notes on mobile
5. User can edit notes and add tags
6. User can refresh note from Google Doc
7. User can search and filter notes

**Success Criteria:**
- Google Drive integration works
- Notes import correctly
- Viewing works on both platforms
- Editing and tags functional
- Search and filters work

---

## Learning Resources

### Google APIs
- Google Drive API documentation
- Google Docs API documentation
- OAuth 2.0 for Google APIs

### Content Management
- Document parsing techniques
- Content storage patterns
- Search and filter algorithms

### Mobile Development
- React Native components
- Mobile UI/UX patterns
- Touch interactions

---

## 🐛 Common Issues & Solutions

**Issue**: Google Drive API permissions
- **Solution**: Ensure OAuth scopes include drive.readonly, verify consent screen

**Issue**: Large document import fails
- **Solution**: Implement chunking, add progress indicators, handle timeouts

**Issue**: Note content formatting lost
- **Solution**: Preserve formatting in parsing, use structured storage

**Issue**: Mobile list performance
- **Solution**: Use FlatList optimization, implement pagination, lazy loading

---

## Notes

- Focus on understanding API integration patterns
- Test with various document sizes and formats
- Consider performance for large note lists
- Mobile UI should be touch-friendly
- Keep note structure flexible for future features

