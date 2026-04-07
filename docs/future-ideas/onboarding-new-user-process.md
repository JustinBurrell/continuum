# Onboarding New User Process

**Status:** Specced — not yet implemented  
**Scope:** Web (primary) + Android (forward-looking, notes inline)  
**Last updated:** 2026-04-07

---

## 1. Overview

Onboarding is a multi-step modal overlay that renders on top of `/dashboard` immediately after a new user completes signup. It is not a separate route. Every step is individually skippable. When dismissed (skipped or completed), the user lands on `/dashboard`. The full flow is resumable at any time from the Profile page.

The modal has two sections: **Profile Setup** (varies by signup method) and the **Feature Tour** (identical for all users, 11 steps).

---

## 2. Triggering Condition

The modal mounts when `user.onboardingCompleted === false`. This field is new and must be added to the backend (see Section 8).

**Detection logic (web — `OnboardingModal.jsx`):**

```js
const { user } = useAuth()
const showModal = user && !user.onboardingCompleted
```

**On resume from Profile page:** a "Resume onboarding" button or banner renders when `!user.onboardingCompleted`. Clicking it opens the modal. The modal re-evaluates user state to compute the correct starting step (see Section 4.3).

**Android:** check `onboardingCompleted` from the `/auth/me` response stored in Room or `SharedPreferences`. Show a bottom sheet (not a modal) when false. On resume, surface an "Finish setup" card on the Profile screen.

---

## 3. Flow Diagrams

### 3.1 Email/Password Signup Path

```
POST /api/auth/register
  └─> JWT issued, user created (onboardingCompleted: false, emailVerified: false)
      └─> navigate to /dashboard
          └─> OnboardingModal renders

  ┌──────────────────────────────────┐
  │  Profile Setup (email/password)  │
  ├──────────────────────────────────┤
  │  Step 1: Email Verification      │  POST /api/auth/send-verification (resend)
  │  Step 2: Connect Google          │  OAuth flow (non-blocking)
  │  Step 3: Profile Photo + Bio     │  PATCH /api/auth/me/profile
  └──────────────────────────────────┘
          │
          ▼
  ┌──────────────────────────────────┐
  │  Feature Tour (11 steps)         │
  │  Dashboard → Notes → Flashcards  │
  │  → Tasks → Calendar →            │
  │  Applications → Resume →         │
  │  Messages → Friends →            │
  │  Activity → Profile              │
  └──────────────────────────────────┘
          │
          ▼
  POST /api/auth/me/onboarding/complete
  onboardingCompleted = true
  Modal closes → user on /dashboard
```

### 3.2 Google OAuth Signup Path

```
GET /api/auth/google → Google consent screen
  └─> GET /api/auth/google/callback → redirect /auth/callback?code=...
      └─> POST /api/auth/google/exchange → JWT
          └─> GET /api/auth/me → user object (emailVerified: true, googleId set)
              └─> navigate('/dashboard')
                  └─> OnboardingModal renders

  ┌──────────────────────────────────┐
  │  Profile Setup (Google OAuth)    │
  ├──────────────────────────────────┤
  │  Step 1: Confirm/Edit Username   │  PATCH /api/auth/me/username (on save)
  │  Step 2: Profile Photo + Bio     │  PATCH /api/auth/me/profile
  │          (avatar pre-filled      │
  │          from Google photo)      │
  └──────────────────────────────────┘
          │
          ▼
  ┌──────────────────────────────────┐
  │  Feature Tour (11 steps)         │  (identical to email/password path)
  └──────────────────────────────────┘
          │
          ▼
  POST /api/auth/me/onboarding/complete
  onboardingCompleted = true
  Modal closes → user on /dashboard
```

---

## 4. Step-by-Step Specification

### 4.1 Profile Setup Steps

#### Step P1 — Email Verification (email/password users only)

- **Shown when:** `!user.emailVerified && !user.googleId`
- **Skipped when:** user signed up via Google OAuth (`user.googleId` is set)

**Content:**
- Heading: "Verify your email"
- Body: "We sent a link to `{user.email}`. Click it to confirm your account."
- Primary CTA: "Open email app" — opens `mailto:{user.email}` (web) or `Intent.ACTION_VIEW` with `mailto:` URI (Android)
- Secondary action: "Resend email" — `POST /api/auth/send-verification` (rate-limit: disable for 60s after tap)
- Tertiary: "I'll do this later" — skip to next step
- "Next" button: advances regardless of verification status (non-blocking)

**Backend:** `POST /api/auth/send-verification` (already exists)

**Android:** bottom sheet action sheet instead of button row; "Open email app" fires `Intent.ACTION_VIEW`.

---

#### Step P2 — Connect Google (email/password users only)

- **Shown when:** `!user.googleId`
- **Skipped when:** user signed up via Google OAuth

**Content:**
- Heading: "Connect Google"
- Body: "Link your Google account so you can sign in faster and import notes from Drive."
- Primary CTA: "Connect Google" — initiates `GET /api/auth/google` OAuth flow in a popup (`window.open`) on web. Non-blocking: the modal does not wait for the popup to resolve. After the popup resolves, `GET /api/auth/me` updates user state via `updateUser()`.
- "Skip for now" — advance to next step

**Backend:** `POST /api/auth/me/google/link` (already exists). The OAuth popup must complete the link flow and call this endpoint before closing.

**Android:** opens Chrome Custom Tab for the OAuth flow. After the Custom Tab closes, re-fetch `/auth/me` to check if `googleId` is now set. Do not block the bottom sheet step on this result.

---

#### Step P3 / P1 (Google) — Profile Photo + Bio

- **Shown for:** all users (step 3 for email/password, step 1 after username for Google)

**Content:**
- Heading: "Make it yours"
- Body: "Add a photo and a short bio so friends can find you."
- Avatar upload: circular image picker. For Google OAuth users, pre-populate with Google profile photo URL if available (`user.avatarUrl` already set from OAuth exchange). User can replace it.
- Bio textarea: max 160 characters, character count shown
- Primary CTA: "Save & Continue" — fires `PATCH /api/auth/me/profile` (multipart/form-data with `avatar` file and `bio` text field), then advances
- "Skip" — advance without saving

**Backend:** `PATCH /api/auth/me/profile` (already exists). Fields used: `avatar` (binary), `bio` (string).

**Android:** use `ActivityResultContracts.GetContent` for image picking. Upload via multipart POST with `OkHttp` or `Retrofit`. Show circular `AsyncImage` preview (Coil).

---

#### Step P1 (Google only) — Confirm/Edit Username

This step runs before Profile Photo + Bio for Google OAuth users.

- **Shown when:** `user.googleId` is set and `!user.onboardingCompleted`
- **Skipped when:** user signed up with email/password (username was set at registration)

**Content:**
- Heading: "Choose your username"
- Body: "This is how others will find you on Continuum. You can change it later."
- Input field: pre-filled with the auto-generated username from Google OAuth (`user.username`)
- Inline validation: call `PATCH /api/auth/me/username` on "Save". Show inline error on 409 (taken). On success, call `updateUser({ username })`.
- Primary CTA: "Save & Continue" — fires username PATCH, then advances
- "Keep this one" / "Skip" — advance without changing

**Backend:** `PATCH /api/auth/me/username` (already exists). Body: `{ username: string }`. Returns 409 if taken.

**Android:** standard `TextField` with trailing clear button. Show a checkmark icon when username is available (debounced availability check optional — not required for MVP).

---

### 4.2 Feature Tour Steps

The feature tour is identical for all users regardless of signup method. It runs after all applicable profile setup steps complete. There are 11 steps.

Each step has this structure:
- **Tab name** and route
- **Description:** one sentence on what the section does
- **Key action:** the single most important thing to know
- **Visual hint:** tooltip-style arrow or highlight pointing at the sidebar nav item

The modal does not navigate the user to each tab. It stays on `/dashboard`. The visual hint is an overlay arrow drawn toward the corresponding sidebar item.

---

**Tour Step 1 — Dashboard** (`/dashboard`)

- Description: "Your home base. See your study streak, recent activity, and quick links to everything."
- Key action: Bookmark any section to the top of your dashboard for faster access.
- Visual hint: highlight on "Dashboard" in the sidebar nav.

---

**Tour Step 2 — Notes** (`/notes`)

- Description: "Create, organize, and share rich-text notes."
- Key action: Press Cmd+N (Ctrl+N on Windows) from anywhere in Notes to start a new note instantly.
- Visual hint: arrow pointing at "Notes" sidebar item.

---

**Tour Step 3 — Flashcards** (`/flashcards`)

- Description: "Build flashcard sets and study with spaced repetition to retain what you learn."
- Key action: Open any flashcard set and tap "Study" to start a session that tracks your progress.
- Visual hint: arrow pointing at "Flashcards" sidebar item.

---

**Tour Step 4 — Tasks** (`/tasks`)

- Description: "A kanban board for tracking your work across custom columns."
- Key action: Drag a card between columns to update its status.
- Visual hint: arrow pointing at "Tasks" sidebar item.

---

**Tour Step 5 — Calendar** (`/calendar`)

- Description: "A unified view of all your tasks that have due dates."
- Key action: Click any day on the calendar to add a task directly from that date.
- Visual hint: arrow pointing at "Calendar" sidebar item.

---

**Tour Step 6 — Applications** (`/applications`)

- Description: "Track every job application through a built-in pipeline."
- Key action: Add your first application and set its stage (Applied, Interview, Offer, etc.).
- Visual hint: arrow pointing at "Applications" sidebar item.

---

**Tour Step 7 — Resume** (`/resumes`)

- Description: "Upload and manage versions of your resume in one place."
- Key action: Upload a PDF to keep your resume on file and accessible from anywhere.
- Visual hint: arrow pointing at "Resume" sidebar item.

---

**Tour Step 8 — Messages** (`/messages`)

- Description: "Direct messages with your friends on Continuum."
- Key action: Start a conversation from a friend's profile or from the Messages tab.
- Visual hint: arrow pointing at "Messages" sidebar item.

---

**Tour Step 9 — Friends** (`/friends`)

- Description: "Find and connect with other Continuum users."
- Key action: Search by username to send a friend request.
- Visual hint: arrow pointing at "Friends" sidebar item.

---

**Tour Step 10 — Activity** (`/activity`)

- Description: "See what your friends have been studying and working on."
- Key action: Control who sees your activity in your Profile settings under Visibility.
- Visual hint: arrow pointing at "Activity" sidebar item.

---

**Tour Step 11 — Profile** (`/profile`)

- Description: "Your public page, account settings, and social links."
- Key action: Add your LinkedIn or Instagram handle so friends can connect with you outside the app.
- Visual hint: arrow pointing at "Profile" sidebar item.

---

**After Tour Step 11:**

- Show a final "You're all set" slide with a single CTA: "Go to Dashboard"
- Tapping it fires `POST /api/auth/me/onboarding/complete`, sets `onboardingCompleted = true` via `updateUser()`, then closes the modal
- If user skips the entire tour (or skips out mid-tour), fire the same completion endpoint before closing

---

### 4.3 Resume Logic

When the user opens the modal from the Profile page (via "Finish setup" button), the modal re-evaluates which profile steps still apply:

```
1. If !user.emailVerified && !user.googleId    → start at P1 (Email Verification)
2. Else if !user.googleId                      → start at P2 (Connect Google)
3. Else if user.googleId && needsUsername      → start at P1-Google (Username Confirm)
   (username was never changed; detect by comparing user.username against
    a generated pattern, or always show for Google users since it's a confirm step)
4. If !user.avatarUrl || !user.bio             → include Profile Photo + Bio step
5. Always append Feature Tour                  → start at Tour Step 1 (Dashboard)
```

The modal is stateless across sessions. It always starts from the beginning of the applicable remaining steps. Local step state lives in React `useState` / Compose `remember` and is not persisted.

---

## 5. Modal Behavior and UX Rules

**Web:**
- Renders as a centered overlay (`position: fixed`, `inset-0`), with a backdrop (`bg-black/40`)
- Modal card: `max-w-[480px]`, `w-full`, `rounded-2xl`, white background (`#fef7ff`), `shadow-xl`
- Clicking the backdrop does NOT close the modal (prevents accidental dismissal)
- The X button in the top-right corner skips all remaining steps: fires the completion endpoint and closes
- Progress indicator: a row of dots at the top of the modal. Filled dot = current step. Total dots = total steps for this user's path (profile steps + 11 tour steps). Dots are not clickable (no backwards navigation).
- Step transitions: horizontal slide animation (`transform translateX`, 250ms ease-in-out)
- "Skip" links are right-aligned below the primary CTA on every step

**Android:**
- Render as a `ModalBottomSheet` (Material 3) anchored to the bottom of the screen
- Step transitions: `AnimatedContent` with horizontal slide
- Drag-to-dismiss is disabled (same reasoning as web backdrop click)
- X button in top-right of the sheet header skips all remaining steps and fires the completion endpoint
- Progress indicator: linear `LinearProgressIndicator` at the top of the sheet, not dots
- "Skip" is a `TextButton` below the primary `Button`

---

## 6. Design Tokens

These are consistent with the rest of the app. Do not introduce new values.

| Element | Value |
|---|---|
| Modal background | `#fef7ff` |
| Backdrop | `rgba(0,0,0,0.4)` |
| Heading font | Fraunces (serif), weight 600 |
| Body font | Plus Jakarta Sans, weight 400 |
| Primary button bg | `#6b21a8` |
| Primary button text | `#ffffff` |
| Primary button hover | `#581c87` |
| Skip / tertiary link | `#a087b0` |
| Step dot (active) | `#6b21a8` |
| Step dot (inactive) | `#e5d3f0` |
| Input border (focus) | `#6b21a8` |
| Border radius (modal) | `1rem` (`rounded-2xl`) |
| Border radius (inputs) | `0.5rem` (`rounded-lg`) |

---

## 7. Component Structure (Web)

```
src/
  components/
    onboarding/
      OnboardingModal.jsx          # root modal shell, step router, progress dots
      steps/
        EmailVerificationStep.jsx
        ConnectGoogleStep.jsx
        ProfileSetupStep.jsx
        UsernameConfirmStep.jsx
        TourStep.jsx               # generic tour step (receives tour config object)
      tourConfig.js                # array of 11 tour step definitions (title, desc, keyAction, sidebarTarget)
      useOnboarding.js             # hook: computes steps for this user, manages currentStep state
```

`OnboardingModal.jsx` reads from `useAuth()` and is mounted in `AppLayout.jsx` (the protected route wrapper that already wraps all authenticated pages).

---

## 8. Backend Changes Required

### 8.1 New Field: `User.onboardingCompleted`

Add to the User Mongoose schema:

```js
onboardingCompleted: {
  type: Boolean,
  default: false,
}
```

For existing users (pre-onboarding feature), run a one-time migration that sets `onboardingCompleted: true` for all users created before this feature ships. New users default to `false`.

### 8.2 New Endpoint: `POST /api/auth/me/onboarding/complete`

**Auth:** required (`authMiddleware`)  
**Body:** none  
**Action:** sets `user.onboardingCompleted = true`  
**Response:**
```json
{ "success": true, "user": { ...updatedUser } }
```

Add to `auth.routes.js`:
```js
router.post('/me/onboarding/complete', authMiddleware, authController.completeOnboarding);
```

Add `completeOnboarding` to `auth.controller.js`:
```js
exports.completeOnboarding = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { onboardingCompleted: true },
    { new: true }
  );
  res.json({ success: true, user });
};
```

### 8.3 Docs Files to Update

When implementing, update these three files to reflect the schema and endpoint additions:

| File | Change |
|---|---|
| `docs/database/schema_diagram.md` | Add `Boolean onboardingCompleted` to the `User` entity block |
| `docs/database/mongodb_schema_explaination.md` | Add entry for `onboardingCompleted` in the User section |
| `docs/backend/api_reference_guide.md` | Add `POST /api/auth/me/onboarding/complete` to the Auth section |

---

## 9. Android Implementation Notes

These notes are forward-looking. The Android project does not yet exist. When built, it will live in `/android`.

| Concern | Android approach |
|---|---|
| Storage | `SharedPreferences` or `DataStore` for `token`; `Room` optional for user cache |
| Modal pattern | `ModalBottomSheet` (Material 3 Compose) instead of dialog overlay |
| Step transitions | `AnimatedContent` with `slideInHorizontally` / `slideOutHorizontally` |
| Navigation between steps | Compose `State<Int>` step index; no Jetpack Navigation needed inside the sheet |
| Email client open | `Intent(Intent.ACTION_VIEW, Uri.parse("mailto:${user.email}"))` |
| Google OAuth (link step) | Chrome Custom Tab via `CustomTabsIntent`; re-fetch `/auth/me` on return |
| Image picker (avatar) | `ActivityResultContracts.PickVisualMedia` (Photo Picker API) |
| Image upload | Multipart POST via Retrofit with `RequestBody.create(MediaType, file)` |
| Sidebar visual hint | Highlight the corresponding `NavigationDrawerItem` or `NavigationBarItem` using a pulsing border or a `BadgedBox`; draw an arrow using `Canvas` if needed |
| Drag-to-dismiss | Set `sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)` and handle `onDismissRequest` by firing the completion endpoint rather than just closing |
| Resume from Profile | "Finish setup" card renders in `ProfileScreen.kt` when `onboardingCompleted == false`; tapping it calls `showOnboardingSheet = true` in a shared `OnboardingViewModel` |
| API call (complete) | `POST /api/auth/me/onboarding/complete` via existing Retrofit auth service; update local user state on success |

---

## 10. Out of Scope

- No animated illustrations per step (static icon/text only for MVP)
- No onboarding checklist widget on Dashboard (resumable via Profile page only)
- No A/B testing hooks
- No email drip campaign triggered by incomplete onboarding (separate future spec)
- No deep-link from verification email back into the onboarding modal
