# Continuum - Design Breakdown
**Figma Design Requirements for Web & Mobile**

This document outlines all pages/screens needed for the Continuum application, organized by Figma pages. Use this to plan your Figma designs for both web and mobile platforms.

**Reference Documents**: [Product Requirements Document](./product/product_requirements_document.md) | [Master Planning Doc](./master_planning_doc.md) | [Figma Breakdown](./figma_breakdown.md)

---

## 🎯 Design Overview

**Total Screens**: 56 (28 Mobile + 28 Web)  
**Figma Pages**: 2  
**Shared Components**: Navigation, modals, forms, cards, buttons, inputs

**Design Priority**: Focus on core user flows first:
1. Authentication → Dashboard → Notes → Flashcards → Tasks
2. Social features (friends, feed, messaging)
3. Career features (resume, applications)

---

## 📄 Page 1: Core Flows (Auth, Notes, Flashcards, Tasks)

### Mobile Screens (15)

1. Mobile - Landing Page
2. Mobile - Signup
3. Mobile - Login
4. Mobile - Dashboard Home
5. Mobile - Notes Dashboard
6. Mobile - Note Viewer
7. Mobile - Note Editor
8. Mobile - Note Import
9. Mobile - Flashcards Dashboard
10. Mobile - Flashcards Viewer
11. Mobile - Flashcards Creation
12. Mobile - Tasks Dashboard
13. Mobile - Tasks Creation
14. Mobile - Tasks Editor
15. Mobile - Calendar View

### Web Screens (15)

1. Web - Landing Page
2. Web - Login
3. Web - Signup
4. Web - Dashboard Home
5. Web - Notes Dashboard
6. Web - Note Viewer
7. Web - Note Editor
8. Web - Note Import
9. Web - Flashcards Dashboard
10. Web - Flashcards Viewer
11. Web - Flashcards Creation
12. Web - Tasks Dashboard
13. Web - Tasks Creation
14. Web - Tasks Editor
15. Web - Calendar View

---

## 📄 Page 2: Social, Career & Settings

### Mobile Screens (13)

1. Mobile - Social Dashboard
2. Mobile - User Search
3. Mobile - Friends List
4. Mobile - Shared Note View
5. Mobile - DM Inbox
6. Mobile - Chat Screen
7. Mobile - Career Dashboard
8. Mobile - Resume Management
9. Mobile - Resume Upload
10. Mobile - Resume Feedback
11. Mobile - Application Dashboard
12. Mobile - Application Detail
13. Mobile - Settings Profile

### Web Screens (13)

1. Web - Social Dashboard
2. Web - Friends List
3. Web - User Search
4. Web - Shared Note View
5. Web - DM Inbox
6. Web - Chat Screen
7. Web - Career Dashboard
8. Web - Resume Management
9. Web - Resume Upload
10. Web - Resume Feedback
11. Web - Application Dashboard
12. Web - Application Detail
13. Web - Settings Profile

---

## 📐 Frame Specifications

### Web Frames
- **Size:** 1440 x 900 px
- **Naming Convention:** `Web - [Screen Name]`
- **Auto Layout:** Required on all containers
- **Vertical Spacing:** 100px between frames

### Mobile Frames
- **Size:** 390 x 844 px (iPhone 14)
- **Naming Convention:** `Mobile - [Screen Name]`
- **Auto Layout:** Required on all containers
- **Vertical Spacing:** 100px between frames

---

## 🎨 Layout Strategy

### Page Organization
```
Left Column (Web)          Gap (200px)          Right Column (Mobile)
1440px wide                                     390px wide

┌──────────────────────┐                    ┌────────────────┐
│ Web - Screen 1       │                    │ Mobile - Screen│
│ 1440 x 900           │                    │ 390 x 844      │
└──────────────────────┘                    └────────────────┘
        ↓ 100px                                    ↓ 100px
┌──────────────────────┐                    ┌────────────────┐
│ Web - Screen 2       │                    │ Mobile - Screen│
└──────────────────────┘                    └────────────────┘
```

---

## ✅ Design Checklist

### Before Building Each Screen:
- [ ] Frame created with correct dimensions
- [ ] Named using convention: `[Platform] - [Screen Name]`
- [ ] Auto Layout enabled on main container
- [ ] All nested elements have descriptive names
- [ ] Consistent spacing (4/8/12/16/24/32/48px)
- [ ] Colors match design system (#6B21A8, #F8F9FA, etc.)
- [ ] Components use Hug/Fill appropriately
- [ ] No absolute positioning inside Auto Layout

### For MCP Compatibility:
- [ ] All layers descriptively named (no "Frame 182")
- [ ] Auto Layout on all containers
- [ ] Consistent component patterns
- [ ] Clear hierarchy in layer structure

---

## 🚀 Build Priority

### Phase 1 (Week 1-2): Authentication & Notes
- Landing, Login, Signup
- Dashboard Home
- Notes Dashboard, Viewer, Editor

### Phase 2 (Week 3-4): Learning & Tasks
- Flashcards Dashboard, Viewer, Creation
- Tasks Dashboard, Creation, Editor
- Calendar View

### Phase 3 (Week 5-6): Social & Collaboration
- Social Dashboard
- Friends List, User Search
- DM Inbox, Chat Screen
- Shared Note View

### Phase 4 (Week 7): Career Management
- Career Dashboard
- Resume Management, Upload, Feedback
- Application Dashboard, Detail

### Phase 5 (Week 8): Polish
- Settings Profile
- Final QA and refinements

---

## 📊 Design Summary by Priority

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
**Total**: 11 web pages + 11 mobile screens = 22 designs

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
- [ ] Settings/Profile
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
- [ ] Settings/Profile
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

*Last Updated: January 2026*  
*Total Designs: 56 screens (28 mobile + 28 web) + 10 shared components*  
*Design Tool: Figma (Free Version)*  
*Export Target: React (Web) + React Native (Mobile) via Figma MCP*
