# Continuum - Design Breakdown
**Figma Design Requirements for Web & Mobile**

This document outlines all pages/screens needed for the Continuum application, organized by section. Use this to plan your Figma designs for both web and mobile platforms.

**Reference Documents**: [Product Requirements Document](./product/product_requirements_document.md) | [Master Planning Doc](./master_planning_doc.md)

---

## 🎯 Design Overview

**Total Designs Needed**: ~35-40 unique designs
- **Web Designs**: ~20 pages
- **Mobile Designs**: ~20 screens (may share components with web)
- **Shared Components**: Navigation, modals, forms, cards

**Design Priority**: Focus on core user flows first:
1. Landing → Sign Up → Dashboard → Notes → Tasks
2. Social features (friends, feed, messaging)
3. Career features (resume, applications)

---

## 📱 1. Landing & Public Pages

### 1.1 Landing Page (Web)
**Purpose**: First impression, explain app, encourage sign-up  
**Key Elements**:
- Hero section with tagline and core value proposition
- Feature highlights (Notes, AI Learning, Tasks, Collaboration, Career)
- Social proof/testimonials (optional for MVP)
- Call-to-action buttons (Sign Up, Log In)
- Navigation bar (Home, About, Contact, Log In, Sign Up)
- Footer with links

**Mobile Consideration**: Simplified hero, stacked feature cards, sticky nav

---

### 1.2 About Page (Web)
**Purpose**: Explain the product vision and team  
**Key Elements**:
- Mission statement
- Problem/solution narrative
- Key features overview
- Navigation bar
- Back to landing CTA

**Mobile**: Similar content, mobile-optimized layout

---

### 1.3 Contact Page (Web)
**Purpose**: Support and feedback  
**Key Elements**:
- Contact form or email
- FAQ section (optional)
- Navigation bar
- Social links (optional)

**Mobile**: Simplified contact form

---

## 🔐 2. Authentication Pages

### 2.1 Login Page (Web & Mobile)
**Purpose**: User authentication  
**Key Elements**:
- Email/password input fields
- Google OAuth button
- "Forgot password?" link
- "Don't have an account? Sign up" link
- Error message display area
- Logo/branding

**Mobile**: Full-screen form, keyboard-friendly inputs

---

### 2.2 Sign Up Page (Web & Mobile)
**Purpose**: New user registration  
**Key Elements**:
- Registration form (name, email, password, confirm password)
- Google OAuth sign-up button
- Password strength indicator
- Terms of service checkbox
- "Already have an account? Log in" link
- Error validation display

**Mobile**: Full-screen form, scrollable

---

### 2.3 Forgot Password Page (Web & Mobile)
**Purpose**: Password reset flow  
**Key Elements**:
- Email input field
- Submit button
- Back to login link
- Success message state

**Mobile**: Simple form layout

---

## 📚 3. Notes Section

### 3.1 Notes Dashboard/List Page (Web & Mobile)
**Purpose**: Browse, search, and manage all notes  
**Key Elements**:
- Search bar
- Filter options (tags, date, type)
- Note cards/list view (title, preview, tags, date)
- "Import from Google Drive" button
- "Create New Note" button
- Empty state (when no notes)
- Sort options (date, title, recently viewed)

**Web**: Grid/list toggle, sidebar filters  
**Mobile**: List view, pull-to-refresh, bottom sheet filters

---

### 3.2 Note Viewer/Detail Page (Web & Mobile)
**Purpose**: View note content with AI tools  
**Key Elements**:
- Note title and metadata
- Full note content (scrollable)
- Action buttons: Generate Summary, Generate Flashcards, Edit, Share, Delete
- Tags display and editor
- AI-generated summary section (expandable)
- Flashcards section (link to study)
- Refresh from Google Docs button (if imported)
- Share/visibility controls

**Web**: Side-by-side summary, full-width content  
**Mobile**: Full-screen content, bottom action sheet

---

### 3.3 Note Editor (Web & Mobile)
**Purpose**: Create and edit notes  
**Key Elements**:
- Rich text editor (or markdown)
- Title input
- Content editor
- Tag input (autocomplete)
- Save/Cancel buttons
- Formatting toolbar (bold, italic, lists, etc.)

**Web**: Full editor with toolbar  
**Mobile**: Simplified toolbar, keyboard-friendly

---

### 3.4 Google Drive Import Page (Web & Mobile)
**Purpose**: Select and import Google Docs  
**Key Elements**:
- Google Drive file picker integration
- File list/grid
- Selected file preview
- Import button
- Loading state
- Error handling

**Web**: Modal or sidebar  
**Mobile**: Full-screen picker

---

### 3.5 Flashcard Study Interface (Web & Mobile)
**Purpose**: Quizlet-style flashcard studying  
**Key Elements**:
- Flashcard display (front/back)
- Flip animation
- Navigation buttons (Previous, Next, Shuffle)
- Progress indicator
- "Mark as Known" / "Mark as Unknown" buttons
- Study mode toggle (all cards, unknown only)
- Keyboard shortcuts hint (web)

**Web**: Large card, keyboard navigation  
**Mobile**: Swipe gestures, tap to flip, full-screen

---

### 3.6 Flashcard Editor (Web & Mobile)
**Purpose**: Create and edit flashcards manually  
**Key Elements**:
- List of flashcards
- Add new card button
- Card editor (front/back inputs)
- Delete card button
- Save/Cancel buttons
- Bulk import option

**Web**: Side-by-side editing  
**Mobile**: Full-screen editor, swipe to delete

---

## ✅ 4. Tasks & Calendar Section

### 4.1 Tasks Dashboard/List Page (Web & Mobile)
**Purpose**: View and manage all tasks  
**Key Elements**:
- Task list with filters (All, To Do, In Progress, Completed, Overdue)
- Task cards (title, due date, priority, status, linked note)
- "Create Task" button
- Search bar
- Sort options
- Empty state
- Quick status update (checkbox)

**Web**: Multi-column layout, advanced filters  
**Mobile**: List view, swipe actions, bottom sheet filters

---

### 4.2 Calendar View Page (Web & Mobile)
**Purpose**: Google Calendar-style task visualization  
**Key Elements**:
- Calendar grid (week/month view toggle)
- Tasks displayed on dates
- Navigation (Previous/Next month)
- Today indicator
- Task indicators/colors by priority/status
- Click/tap date to create task
- Click/tap task to view details
- Legend/key

**Web**: Full calendar, drag-and-drop (future)  
**Mobile**: Swipe navigation, tap interactions

---

### 4.3 Task Creation/Edit Modal (Web & Mobile)
**Purpose**: Create and edit tasks  
**Key Elements**:
- Title input
- Description textarea
- Due date picker
- Time picker
- Priority selector (Low, Medium, High)
- Status selector
- Link to note dropdown
- Duration/time estimate
- Category/type selector
- Save/Cancel buttons
- Delete button (edit mode)

**Web**: Modal overlay  
**Mobile**: Bottom sheet or full-screen form

---

### 4.4 Task Detail View (Web & Mobile)
**Purpose**: View full task details  
**Key Elements**:
- Task title
- Full description
- Due date and time
- Priority badge
- Status badge
- Linked note (with link)
- Participants (if shared task)
- Edit button
- Delete button
- Status update quick actions

**Web**: Sidebar or modal  
**Mobile**: Full-screen detail view

---

## 👥 5. Social & Collaboration Section

### 5.1 Social Feed/Activity Page (Web & Mobile)
**Purpose**: Friends' shared content feed  
**Key Elements**:
- Activity feed/list
- Shared note cards (title, preview, sharer, timestamp)
- Like button and count
- Comment button and count
- Share button
- View note button
- Empty state (no friends yet)
- Refresh/pull-to-refresh

**Web**: Feed layout with sidebars  
**Mobile**: Vertical feed, infinite scroll

---

### 5.2 Friends Management Page (Web & Mobile)
**Purpose**: Manage friend connections  
**Key Elements**:
- Friends list (with status indicators)
- Pending friend requests section
- Search users input
- Send friend request button
- Accept/Decline request buttons
- Remove friend option
- User cards (name, mutual friends, profile)

**Web**: Two-column layout (requests, friends)  
**Mobile**: Tabs or sections, swipe actions

---

### 5.3 User Search Page (Web & Mobile)
**Purpose**: Find users to add as friends  
**Key Elements**:
- Search input
- Search results list
- User cards (name, email, profile info)
- "Send Friend Request" button
- "Already Friends" indicator
- "Request Pending" indicator

**Web**: Search results with filters  
**Mobile**: Full-screen search, results list

---

### 5.4 Shared Note View Page (Web & Mobile)
**Purpose**: View and interact with shared notes  
**Key Elements**:
- Note content (same as Note Viewer)
- Sharer information
- Like button and count
- Comments section
- Add comment input
- Comment thread (with replies)
- Share options
- Owner controls (if you're the owner)

**Web**: Sidebar comments, note content  
**Mobile**: Comments below content, bottom sheet

---

### 5.5 Direct Messaging Inbox (Web & Mobile)
**Purpose**: List of conversations  
**Key Elements**:
- Conversation list
- User avatar and name
- Last message preview
- Timestamp
- Unread indicator
- Search conversations
- New message button
- Empty state

**Web**: Sidebar conversations, message view  
**Mobile**: Full-screen list, tap to open chat

---

### 5.6 Chat/Message View (Web & Mobile)
**Purpose**: Individual conversation  
**Key Elements**:
- Message bubbles (sent/received styling)
- Timestamps
- User avatars
- Message input field
- Send button
- Emoji picker
- Typing indicator (optional)
- Scroll to bottom button
- Read receipts (optional)

**Web**: Chat panel with message list  
**Mobile**: Full-screen chat, keyboard handling

---

## 💼 6. Career Section

### 6.1 Career Dashboard (Web & Mobile)
**Purpose**: Overview of career tools  
**Key Elements**:
- Resume section (list of resumes, upload button)
- Application tracking summary (counts by status)
- Quick actions (Upload Resume, Add Application)
- Recent applications list
- Pipeline visualization (optional)
- Stats/metrics (optional)

**Web**: Dashboard layout with widgets  
**Mobile**: Vertical cards, scrollable

---

### 6.2 Resume Management Page (Web & Mobile)
**Purpose**: Manage resume versions  
**Key Elements**:
- Resume list (version, label, upload date)
- "Upload Resume" button (drag-and-drop on web)
- Resume preview/thumbnail
- "Get AI Feedback" button
- Delete resume option
- Version comparison (optional)

**Web**: Grid or list view  
**Mobile**: List view, swipe actions

---

### 6.3 Resume Upload Page (Web & Mobile)
**Purpose**: Upload and configure resume  
**Key Elements**:
- File upload area (drag-and-drop web, file picker mobile)
- File name display
- Label/version name input
- Target role input
- Upload button
- Progress indicator
- Error handling

**Web**: Upload area with preview  
**Mobile**: Full-screen upload form

---

### 6.4 Resume Feedback View (Web & Mobile)
**Purpose**: Display AI-generated resume feedback  
**Key Elements**:
- Resume preview/PDF viewer
- Feedback sections:
  - Strengths list
  - Areas for improvement
  - Keyword optimization
  - Formatting suggestions
- Version history (previous feedback)
- Download resume button
- Generate new feedback button
- Action items list

**Web**: Side-by-side resume and feedback  
**Mobile**: Tabs or scrollable sections

---

### 6.5 Application Tracking Dashboard (Web & Mobile)
**Purpose**: Pipeline view of applications  
**Key Elements**:
- Pipeline visualization (columns: Draft, Applied, Interview, Offer, Rejected)
- Application cards in columns
- Drag-and-drop (web) or tap to move (mobile)
- Status counts
- Filter options
- Search applications
- "Add Application" button
- Timeline view toggle (optional)

**Web**: Kanban-style board  
**Mobile**: List view with status filters, tap for detail

---

### 6.6 Application Detail/Form Page (Web & Mobile)
**Purpose**: Create and edit job applications  
**Key Elements**:
- Form fields:
  - Company name
  - Position title
  - Status dropdown
  - Applied date
  - Notes/description
  - Job posting URL
  - Salary range (optional)
- Networking section:
  - Contact names
  - Interaction history
  - Follow-up reminders
- Status timeline
- Save/Cancel buttons
- Delete application button
- Link to resume version

**Web**: Form layout with sections  
**Mobile**: Scrollable form, bottom sheet for networking

---

### 6.7 Application List View (Web & Mobile)
**Purpose**: List all applications with filters  
**Key Elements**:
- Application list/cards
- Status badges
- Company and position
- Applied date
- Next action/reminder
- Filter buttons (status, date, company)
- Search input
- Sort options
- Empty state

**Web**: Table or card grid  
**Mobile**: List view, swipe actions

---

## 🔧 7. Common/Shared Pages

### 7.1 Dashboard/Home Page (Web & Mobile)
**Purpose**: Main navigation hub  
**Key Elements**:
- Quick access to all sections
- Recent notes preview
- Upcoming tasks preview
- Quick stats (notes count, tasks due, etc.)
- Navigation menu/sidebar
- Search bar (global)
- Notification indicators (optional)

**Web**: Dashboard with widgets  
**Mobile**: Tab navigation, cards

---

### 7.2 Settings/Profile Page (Web & Mobile)
**Purpose**: User settings and profile  
**Key Elements**:
- Profile information (name, email, school, major)
- Profile picture upload
- Account settings
- Google Drive connection status
- Privacy settings
- Notification preferences
- Logout button
- Delete account option

**Web**: Settings layout with sections  
**Mobile**: List view, sections

---

### 7.3 Navigation Components

#### Web Navigation
- **Top Navigation Bar**: Logo, main nav items, user menu, search
- **Sidebar Navigation** (optional): Quick access, sections
- **Breadcrumbs** (optional): For deep navigation

#### Mobile Navigation
- **Bottom Tab Bar**: Home, Notes, Tasks, Social, Career
- **Top Navigation Bar**: Title, actions, user menu
- **Drawer Navigation** (optional): Full menu

---

## 📊 Design Summary

### Phase 1: Core User Flow (MVP Priority)
**Total**: 9 web pages + 9 mobile screens = 18 designs

#### Web Pages
- [ ] Landing Page
- [ ] Login Page
- [ ] Sign Up Page
- [ ] Dashboard/Home
- [ ] Notes Dashboard
- [ ] Note Viewer
- [ ] Tasks Dashboard
- [ ] Calendar View
- [ ] Task Creation Modal

#### Mobile Screens
- [ ] Landing Page
- [ ] Login Page
- [ ] Sign Up Page
- [ ] Dashboard/Home
- [ ] Notes Dashboard
- [ ] Note Viewer
- [ ] Tasks Dashboard
- [ ] Calendar View
- [ ] Task Creation Modal

---

### Phase 2: Essential Features
**Total**: 8 web pages + 8 mobile screens = 16 designs

#### Web Pages
- [ ] Note Editor
- [ ] Google Drive Import
- [ ] Flashcard Study Interface
- [ ] Flashcard Editor
- [ ] Task Detail View
- [ ] Social Feed
- [ ] Friends Management
- [ ] Shared Note View

#### Mobile Screens
- [ ] Note Editor
- [ ] Google Drive Import
- [ ] Flashcard Study Interface
- [ ] Flashcard Editor
- [ ] Task Detail View
- [ ] Social Feed
- [ ] Friends Management
- [ ] Shared Note View

---

### Phase 3: Collaboration & Career
**Total**: 14 web pages + 14 mobile screens = 28 designs

#### Web Pages
- [ ] User Search
- [ ] Messaging Inbox
- [ ] Chat View
- [ ] Career Dashboard
- [ ] Resume Management
- [ ] Resume Upload
- [ ] Resume Feedback
- [ ] Application Dashboard
- [ ] Application Detail/Form
- [ ] Application List
- [ ] Settings/Profile
- [ ] About Page
- [ ] Contact Page
- [ ] Forgot Password Page

#### Mobile Screens
- [ ] User Search
- [ ] Messaging Inbox
- [ ] Chat View
- [ ] Career Dashboard
- [ ] Resume Management
- [ ] Resume Upload
- [ ] Resume Feedback
- [ ] Application Dashboard
- [ ] Application Detail/Form
- [ ] Application List
- [ ] Settings/Profile
- [ ] About Page
- [ ] Contact Page
- [ ] Forgot Password Page

---

### Shared Components
**Can be designed once and reused**:
- [ ] Buttons (primary, secondary, icon)
- [ ] Input fields
- [ ] Cards (note cards, task cards, application cards)
- [ ] Modals/Dialogs
- [ ] Navigation components
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Status badges
- [ ] Avatars

---

### Overall Design Count

**Total Web Pages**: 31 unique pages  
**Total Mobile Screens**: 31 unique screens  
**Total Shared Components**: 10 component types  
**Grand Total**: ~62 unique designs (31 web + 31 mobile)

---

## 💡 Design Guidelines

### Web Design Considerations
- **Responsive**: Desktop-first, but consider tablet/tablet portrait
- **Layout**: Sidebars, multi-column, modal overlays
- **Interactions**: Hover states, keyboard navigation
- **Space**: More whitespace, larger click targets
- **Navigation**: Top nav, sidebar optional

### Mobile Design Considerations
- **Screen Sizes**: iOS (iPhone) and Android (various sizes)
- **Layout**: Single column, bottom tabs, full-screen modals
- **Interactions**: Touch gestures (swipe, pull-to-refresh), tap targets (min 44px)
- **Space**: Compact, scrollable, thumb-friendly zones
- **Navigation**: Bottom tabs primary, drawer menu secondary

### Shared Design System
- **Colors**: Primary, secondary, accent, success, error, warning
- **Typography**: Heading hierarchy, body text, labels
- **Spacing**: Consistent spacing scale
- **Components**: Reusable UI components library
- **States**: Default, hover, active, disabled, loading, error

---

## 📝 Notes for Figma Design

1. **Start with Design System**: Create color palette, typography, spacing, component library first
2. **Mobile-First Approach**: Consider mobile constraints, then adapt to web
3. **Component Reusability**: Design shared components that work for both platforms
4. **State Variations**: Design loading, error, empty states for key pages
5. **User Flows**: Connect pages to show complete user journeys
6. **Accessibility**: Ensure proper contrast, touch target sizes, keyboard navigation
7. **Responsive Breakpoints**: Define breakpoints for web (mobile, tablet, desktop)

---

*Last Updated: [Date]*  
*Total Designs: 62 unique designs (31 web pages + 31 mobile screens) + 10 shared components*
