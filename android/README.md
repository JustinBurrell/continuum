# Continuum Android

Native Android app for Continuum — built with Kotlin and Jetpack Compose. Full feature parity with the React web app, with mobile-first UX patterns inspired by Instagram, Duolingo, Notion, and Quizlet.

---

## Overview

Continuum is a full-stack educational productivity platform for college students. The Android app provides the same functionality as the web app — notes with AI summaries, flashcard study mode, task management, career tracking, social features, and real-time messaging — in a native mobile experience with offline support.

Built for the 2026 All Star Code Technical Entrepreneurship Incubator with Google Play.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Language | Kotlin 2.1 |
| UI | Jetpack Compose (Material 3) with Compose BOM |
| DI | Hilt (Dagger) |
| Navigation | Jetpack Navigation Compose |
| Networking | Retrofit 2 + OkHttp 4 + Moshi |
| Local DB | Room |
| Real-time | Socket.io Java client |
| Image loading | Coil 3 |
| Rich text | richeditor-compose |
| Animations | Lottie Compose |
| Auth | Google Credential Manager + EncryptedSharedPreferences |
| Background sync | WorkManager |
| AI | Groq API (via backend) for summaries, flashcards, resume analysis |

---

## Architecture

MVVM + Clean Architecture with feature-based packaging.

```
android/app/src/main/java/com/continuum/android/
  core/
    data/              TokenManager, DataRefreshNotifier, ProfileUpdateNotifier
      local/           Room DAOs, EncryptedSharedPreferences
      remote/          Base DTOs
    network/           ApiClient (OkHttp + Retrofit), NetworkMonitor, SocketManager
    sync/              SyncQueue, SyncWorker (WorkManager)
    ui/
      animation/       Shared animation utilities (error shake)
      components/      Reusable composables (ContinuumCard, AvatarInitials, etc.)
      navigation/      AppNavHost, NavRoutes, transitions
      theme/           Color.kt, Typography.kt, Spacing.kt, AppShape.kt
    domain/            Shared domain models
  di/                  Hilt modules (NetworkModule, DatabaseModule, SocketModule)
  feature/
    auth/              Login, Register, ForgotPassword, ResetPassword, VerifyEmail, Legal
    dashboard/         Dashboard with stat tiles, recent items, activity preview
    notes/             NotesList, NoteDetail, NoteEditor, GoogleDriveImport
    flashcards/        FlashcardSetsList, SetDetail, StudyMode (flip + swipe)
    tasks/             TaskBoard (status tabs), TaskDetail, CalendarView
    career/            ApplicationsList, ApplicationDetail, ResumesList, ResumeFeedback
    social/            ActivityFeed, FriendsList, UserSearch, UserProfile, SharedNoteView
    messaging/         ConversationsList, ConversationDetail (real-time via Socket.io)
    profile/           Profile, EditProfile, Settings, Sessions
```

Each feature follows the same layered pattern:
- **presentation/** — Composable screens + ViewModel (StateFlow-based)
- **domain/** — Pure Kotlin data classes (no Android dependencies)
- **data/** — Repository, Retrofit API service, DTOs, Room entities

---

## Prerequisites

- Android Studio Ladybug (2024.2.1) or newer
- JDK 11+
- Android SDK API 35
- Emulator or physical device running Android 8.0+ (API 26+)

---

## Setup

1. Clone the monorepo:
   ```bash
   git clone https://github.com/JustinBurrell/continuum
   ```

2. Open `android/` in Android Studio (File > Open > select the `android/` directory)

3. Create `android/local.properties` if it does not exist and add:
   ```properties
   BASE_URL=https://compacter-groovy-conclude.ngrok-free.dev/api/
   WEB_CLIENT_ID=<your Google Web OAuth client ID>
   ```

   For local backend development, omit `BASE_URL` — the build script auto-detects `PORT` from `backend/.env` and uses `http://10.0.2.2:<PORT>/api/`. For production or to test the Google Drive CCT Picker (which requires HTTPS), set `BASE_URL=https://api.usecontinuum.dev/api/`.

4. Sync Gradle: File > Sync Project with Gradle Files

5. Run on emulator: Run > Run 'app'

---

## Google Sign-In Setup

Google Sign-In uses the Credential Manager API (no WebView). To configure:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create an OAuth 2.0 Client ID of type **Web application** (not Android — the Web client ID is what the backend verifies)
3. Copy the Client ID and add it to `local.properties` as `WEB_CLIENT_ID`
4. Ensure the backend's `GOOGLE_CLIENT_ID` environment variable matches this same Web client ID
5. The backend endpoint `POST /api/auth/google/mobile` verifies the ID token from Credential Manager

## Google Drive Import (Android)

The Android app uses `drive.file` scope — users select specific Google Docs rather than browsing their entire Drive.

### Primary flow — Google Picker via Chrome Custom Tab (CCT)

1. In the app, go to Notes → Import from Drive → "Choose from Google Drive"
2. A Chrome Custom Tab opens the backend picker page
3. Google Identity Services (GIS) authenticates for the specific Google account linked in Continuum (not Chrome's default account)
4. User selects a Google Doc → the page redirects to `continuum://drive-pick?id=...&name=...&url=...`
5. The deep link returns to the app and the import begins automatically

### Fallback flow — paste a Google Doc link

Works on any device or environment where the CCT Picker can't run. Go to Notes → Import from Drive, paste the full Google Doc URL, and tap Import.

The note detail screen shows "View in Google Docs" and "Download PDF" actions for imported notes.

---

## Building an APK

### Debug APK
```bash
cd android
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release APK
```bash
cd android
./gradlew assembleRelease
```
Requires signing configuration in `app/build.gradle.kts`. See [Android signing docs](https://developer.android.com/studio/publish/app-signing).

---

## Features

| Feature | Description |
|---------|-------------|
| Notes | Rich-text editor, AI-generated summaries, auto-generated flashcard sets, Google Drive import (URL-based, drive.file scope) |
| Flashcards | Study mode with card flip + swipe, "Still Learning" / "Got it" tracking, study session recording |
| Tasks | Status-based board (To Do, In Progress, Completed), task detail with full metadata, calendar view |
| Calendar | Event calendar with date-based task filtering |
| Career | Application tracker with status pipeline, contacts, reminders, resume PDF viewer, AI resume feedback |
| Social | Activity feed, friends with requests, user profile screens, clickable names, comment threads with replies |
| Messaging | Real-time DMs via Socket.io, conversation search, swipe-to-delete |
| Profile | Avatar upload, edit profile, settings persistence, session management with device labels, Google unlink |
| Offline | Room local cache, WorkManager sync queue, offline banner, seamless reconnection |

---

## Offline Support

The app uses a multi-layer offline strategy:

1. **Room Database** — Local cache for all major data types. UI reads from Room first, then fetches from API.
2. **SyncQueue** — Mutations made while offline are queued in a local Room table.
3. **WorkManager** — On network reconnection, `SyncWorker` reads pending queue items and calls `POST /api/sync` to batch-apply them to the backend.
4. **NetworkMonitor** — ConnectivityManager-based flow that all screens observe. An `OfflineBanner` composable appears when offline.
5. **DataRefreshNotifier** — Cross-screen event bus that triggers dashboard reload when data is mutated from any feature screen.

---

## Security

| Measure | Implementation |
|---------|---------------|
| Token storage | EncryptedSharedPreferences backed by Android KeyStore (AES-256-GCM) |
| OAuth | Google Credential Manager (no WebView, no phishing surface) |
| Network | Network Security Config prevents cleartext except emulator localhost |
| Screen protection | FLAG_SECURE on sensitive screens (notes, resumes, career data) |
| Backup | `android:allowBackup="false"` prevents ADB extraction |
| Auth | JWT access tokens (1d) + refresh token rotation (30d) with server-side revocation |
| Remote logout | TokenAuthenticator detects 401, broadcasts LogoutReason.REMOTE_INVALIDATION via SharedFlow |
| Client ID | `X-Client-Type: android` header on every request + descriptive User-Agent for session device labels |

---

## Backend

The Android app connects to the same Express backend as the web app, plus 4 mobile-specific auth endpoints:

- `POST /api/auth/mobile/login` — Returns refresh token in response body (instead of httpOnly cookie)
- `POST /api/auth/mobile/refresh` — Token rotation with body-based refresh token
- `POST /api/auth/google/mobile` — Accepts Google ID token from Credential Manager
- `POST /api/auth/mobile/logout` — Server-side logout with refresh token revocation

API docs: https://api.usecontinuum.dev/api-docs

---

## Design System

The Android app uses the same visual language as the web app:

| Token | Value | Usage |
|-------|-------|-------|
| BrandPurple | `#6B21A8` | CTAs, active states, icons, progress bars |
| PageBackground | `#F8F9FA` | Screen backgrounds |
| White | `#FFFFFF` | Cards, surfaces |
| Border | `#E5E7EB` | Card borders, dividers |
| TextPrimary | `#111827` | Headlines |
| TextSecondary | `#6B7280` | Body text |
| SuccessGreen | `#059669` | Completed states |
| WarningAmber | `#D97706` | In progress |
| ErrorRed | `#DC2626` | Overdue, errors |

Spacing follows a 4dp grid system (`Spacing.kt`). Corner radii are standardized in `AppShape.kt` (8dp buttons, 12dp cards). Card styling uses a mixed approach: flat 1dp-border cards for lists (Notion-style) and subtle 2dp-elevation cards for interactive elements (Duolingo-style).
