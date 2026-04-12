# Web ↔ Android route parity audit

**Source of truth (web):** [`web/src/App.jsx`](../../web/src/App.jsx) — desktop routes (inside `AppLayout` for authenticated product, plus public and auth-only paths).

**Android:** [`android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt`](../../android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt) and [`NavRoutes`](../../android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt) (same file).

**Audited:** April 10, 2026.

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
| `/privacy` | `PrivacyPolicy` | `auth/privacy` (`LegalDocumentScreen`) | **Partial** — reachable from auth flows, not a top-level public route. |
| `/terms` | `TermsOfService` | `auth/terms` | **Partial** |

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
| `/notes` | `NotesList` | `notes/list` | **Parity** | |
| `/notes/new` | `NoteEditor` | `notes/editor/new` | **Parity** | |
| `/notes/view` | `NoteDetail` | `notes/detail/{noteId}` | **Parity** | |
| `/notes/edit` | `NoteEditor` | `notes/editor/{noteId}` | **Parity** | |
| — | — | `notes/drive-import` | **Android+** | Drive import is first-class in native. |
| `/flashcards` | `FlashcardSets` | `flashcards/list` | **Parity** | |
| `/flashcards/view` | `FlashcardSetDetail` | `flashcards/set/{setId}` | **Parity** | |
| `/flashcards/study` | `StudyMode` | `flashcards/study/{setId}` | **Parity** | |
| `/flashcards/history` | `FlashcardHistory` | — | **Gap** | No `NavRoutes` destination. `FlashcardsViewModel.loadStudyHistory()` exists but nothing in `AppNavHost` calls it; global study history UI not wired. |
| `/tasks` | `Tasks` | `tasks/board`, `tasks/detail/{taskId}` | **Partial** | Feature parity; **IA:** web sidebar has top-level Tasks; Android bottom nav has Notes, Flashcards, Dashboard, Applications, Profile — Tasks reached via dashboard (and related shortcuts), not a tab. Same pattern for **Calendar**, **Activity**, **Friends**, **Messages** vs web “Social” + “Workspace” groups. |
| `/calendar` | `Calendar` | `calendar/main` | **Partial** | Same IA note as Tasks. |
| `/friends` | `Friends` | `social/friends`, `social/search` | **Parity** | Search is explicit route on Android. |
| `/messages` | `MessagesLayout` | `social/conversations`, conversation detail | **Parity** | |
| `/applications` | `ApplicationsList` | `applications/list` **and** `career/applications` | **Partial** | Same `ApplicationsListScreen` is mounted under two graphs; bottom bar uses `applications/list`. Consider consolidating routes to avoid dual back-stack roots (follow-up). |
| `/applications/view` | `ApplicationDetail` | `career/applications/{appId}` | **Parity** | |
| `/resumes` | `Resumes` | `career/resumes`, `career/resumes/{resumeId}`, feedback route | **Parity** | |
| `/activity` | `Activity` | `social/activity` | **Parity** | |
| `/profile` | `Profile` | `profile/main`, `profile/edit`, `profile/settings` | **Parity** | |
| `/users/view` | `UserProfile` | `social/user/{userId}` | **Parity** | Web passes `state.id`; Android uses path param. |

---

## Information architecture (by design)

The web **Sidebar** groups Dashboard, Notes, Flashcards, Tasks, Calendar, Applications, Resumes, Messages, Friends, and Activity as first-class links.

Android intentionally uses a **narrower bottom bar** (see [`react-to-android.md`](./react-to-android.md) — “UX Revamp”) and relies on **Dashboard**, **Profile**, and cross-links for Tasks, Calendar, Activity, Friends, and Messages. This audit records that as **Partial** parity for *discoverability*, not missing backend capability.

---

## Prioritized follow-ups

Track these as GitHub issues or future PRs.

1. **P1 — Flashcard study history route**  
   Add a `NavHost` destination (e.g. `flashcards/history`) and a screen that uses `FlashcardsViewModel.loadStudyHistory()`, or expose the same data from an existing screen with clear navigation from `FlashcardSetsListScreen` / set detail. Closes the only clear **Gap** in the authenticated table.

2. **P2 — Dual applications list roots**  
   `NavRoutes.Applications.LIST` and `NavRoutes.Career.APPLICATIONS_LIST` both host `ApplicationsListScreen`. Decide: single graph + deep links from bottom bar, or document why two entries are required (e.g. save state / tab behavior).

3. **P3 — IA / discoverability**  
   If product wants closer web parity, consider a Tasks (and/or Social hub) entry on the bottom bar or rail, or a “More” overflow — today parity is “reachable” but not “sidebar-equivalent.”

4. **P4 — Code hygiene**  
   Remove unused `PlaceholderScreen` from `AppNavHost.kt` if it remains unreferenced (cleanup, not user-facing).

---

## Related docs

- [`architecture.md`](./architecture.md) — route tree and navigation patterns.  
- [`api-coverage.md`](./api-coverage.md) — REST surface vs screens.  
- [`react-to-android.md`](./react-to-android.md) — deliberate UX differences from web.
