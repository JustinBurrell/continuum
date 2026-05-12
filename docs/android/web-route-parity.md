# Web ↔ Android route parity audit

**Source of truth (web):** [`web/src/App.jsx`](../../web/src/App.jsx) — desktop routes (inside `AppLayout` for authenticated product, plus public and auth-only paths).

**Android:** [`android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt`](../../android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt) and [`NavRoutes`](../../android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt) (same file).

**Last reviewed:** April 15, 2026.

---

## Legend

| Status | Meaning |
|--------|---------|
| **Parity** | Same product surface is reachable in the Android shell (path style may differ). |
| **Partial** | Behavior exists but entry point, IA, or URL shape differs materially from web. |
| **Gap** | Web exposes a dedicated route/screen with no matching `NavHost` destination (or dead ViewModel API). |
| **N/A** | Web-only (marketing site, browser OAuth) or out of scope for the native app shell. |

---

## Public marketing (web only)

| Web path | Component | Android | Status |
|----------|-----------|---------|--------|
| `/` | `Landing` | — | **N/A** — native app starts at auth or main graph; marketing lives on web / Play listing. |
| `/product` | `Product` | — | **N/A** |
| `/about` | `About` | — | **N/A** |
| `/privacy` | `PrivacyPolicy` (desktop) / `MobilePrivacyPage` (mobile) | Opens `https://usecontinuum.dev/privacy` in device browser via `LocalUriHandler` | **Done** — `LegalDocumentScreen` removed; external browser link from Login, Register, and Profile screens. |
| `/terms` | `TermsOfService` (desktop) / `MobileTermsPage` (mobile) | Opens `https://usecontinuum.dev/terms` in device browser via `LocalUriHandler` | **Done** |

---

## Auth

| Web path | Component | Android | Status |
|----------|-----------|---------|--------|
| `/login` | `Login` | `auth/login` | **Parity** |
| `/register` | `Register` | `auth/register` | **Parity** |
| `/forgot-password` | `ForgotPassword` | `auth/forgot-password` | **Parity** |
| `/reset-password` | `ResetPassword` | `auth/reset-password` + `continuum://auth/reset-password?token=` | **Parity** |
| `/auth/callback` | `AuthCallback` | — | **N/A** — web Google OAuth redirect; Android uses `POST /api/auth/google/mobile` + Credential Manager. |
| `/auth/verify-email` | `EmailVerified` | `auth/verify-email` + `continuum://auth/verify-email?token=` | **Parity** |

---

## Authenticated product (web `AppLayout` vs Android)

Web uses query / location `state` for some ids (e.g. `/notes/view`, `/users/view`). Android uses path arguments (`notes/detail/{noteId}`, `social/user/{userId}`). That is an implementation difference, not a functional gap.

| Web path | Web page | Android route(s) | Status | Notes |
|----------|-----------|-------------------|--------|-------|
| `/dashboard` | `Dashboard` | `dashboard/home` | **Parity** | Logo on bottom bar also jumps here. |
| `/notes` | `NotesList` | `notes/list` | **Parity** | Web uses `useInfiniteQuery` with "Load more"; Android fetches all pages on load (feat/android-parity-fixes). |
| `/notes/new` | `NoteEditor` | `notes/editor/new` | **Parity** | |
| `/notes/view` | `NoteDetail` | `notes/detail/{noteId}` | **Parity** | Comments + replies wired in feat/android-parity-fixes (Fix 2). |
| `/notes/edit` | `NoteEditor` | `notes/editor/{noteId}` | **Parity** | |
| — | — | `notes/drive-import` | **Android+** | Drive import is first-class in native. |
| `/flashcards` | `FlashcardSets` | `flashcards/list` | **Parity** | Web uses `useInfiniteQuery` with "Load more"; Android fetches all pages on load (feat/android-parity-fixes). |
| `/flashcards/view` | `FlashcardSetDetail` | `flashcards/set/{setId}` | **Parity** | Cards + **History** tab loads `GET /study-sessions/set/:id` (same as web). |
| `/flashcards/study` | `StudyMode` | `flashcards/study/{setId}` | **Parity** | |
| `/flashcards/history` | `FlashcardHistory` | `flashcards/history` | **Parity** | `FlashcardStudyHistoryScreen` + header entry from flashcards list. |
| `/tasks` | `Tasks` | `tasks/board`, `tasks/detail/{taskId}` | **Partial** | Same features; Android uses a narrower primary chrome (see below). Web Kanban auto-fetches all pages; Android fetches all pages on load (feat/android-parity-fixes). |
| `/calendar` | `Calendar` | `calendar/main` | **Partial** | Same as Tasks — reachable, not a bottom-tab peer of web sidebar. |
| `/friends` | `Friends` | `social/friends`, `social/search` | **Parity** | Search is explicit route on Android. |
| `/messages` | `MessagesLayout` | `social/conversations`, conversation detail | **Parity** | Conversation avatar now navigates to participant profile (Fix 9d). |
| `/applications` | `ApplicationsList` | `career/applications` | **Parity** | Single graph: bottom bar “Applications” uses `NavRoutes.Career.ROOT` → applications list. |
| `/applications/view` | `ApplicationDetail` | `career/applications/{appId}` | **Parity** | |
| `/resumes` | `Resumes` | `career/resumes`, `career/resumes/{resumeId}`, feedback route | **Parity** | |
| `/activity` | `Activity` | `social/activity` | **Parity** | |
| `/profile` | `Profile` | `profile/main`, `profile/edit`, `profile/settings` | **Parity** | Role badges and LinkedIn/Instagram logo links now shown (Fix 7); Tasks nav row added. |
| `/users/view` | `UserProfile` | `social/user/{userId}` | **Parity** | Web passes `state.id`; Android uses path param. |

---

## Information architecture (intentional)

The web **Sidebar** lists Dashboard, Notes, Flashcards, Tasks, Calendar, Applications, Resumes, Messages, Friends, and Activity as first-class links.

Android uses a **narrower bottom bar / rail** and surfaces Tasks, Calendar, Activity, Friends, and Messages through **Dashboard**, **Profile**, and in-feature navigation. That is an intentional native UX choice (see [`react-to-android.md`](./react-to-android.md) — “UX Revamp”), not a parity gap for backend capability.

---

## Related docs

- [`architecture.md`](./architecture.md) — route tree and navigation patterns.  
- [`api-coverage.md`](./api-coverage.md) — REST surface vs screens.  
- [`react-to-android.md`](./react-to-android.md) — deliberate UX differences from web.
