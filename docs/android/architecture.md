# Android Architecture Reference

Continuum Android follows MVVM + Clean Architecture with feature-based packaging. This document covers the layer design, data flows, dependency injection graph, and key patterns.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│   Composable Screens  ←→  ViewModels (StateFlow)    │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│         Pure Kotlin data classes + interfaces        │
│         (no Android dependencies, fully testable)    │
├─────────────────────────────────────────────────────┤
│                     Data Layer                       │
│   Repository implementations                        │
│   Retrofit API services  ←→  Room DAOs              │
│   DTOs  ←→  Domain model mappers                    │
├─────────────────────────────────────────────────────┤
│                  Framework Layer                     │
│   OkHttp (interceptors, authenticator)              │
│   EncryptedSharedPreferences (token storage)        │
│   WorkManager (offline sync)                        │
│   Socket.io (real-time messaging)                   │
│   ConnectivityManager (network monitoring)          │
└─────────────────────────────────────────────────────┘
```

---

## Data Flow: Read Operation

```
User opens screen
    │
    ▼
Composable collects ViewModel.state (StateFlow)
    │
    ▼
ViewModel.load() calls Repository
    │
    ├──► Repository calls Retrofit API service
    │       │
    │       ▼
    │    Backend REST API returns JSON
    │       │
    │       ▼
    │    DTO is mapped to Domain model
    │       │
    │       ▼
    │    Repository returns Result<DomainModel>
    │
    ▼
ViewModel updates MutableStateFlow
    │
    ▼
Composable recomposes with new data
```

For offline-capable features, the flow adds a Room layer:
1. Repository emits cached Room data immediately (UI is never blank)
2. Repository fetches from API in parallel
3. On success, Room is updated and a new emission triggers recomposition

---

## Data Flow: Write Operation

```
User taps "Create" / "Save" / "Delete"
    │
    ▼
Composable calls ViewModel method
    │
    ▼
ViewModel calls Repository.create/update/delete()
    │
    ├──► If online: API call → on success → update local state
    │                                     → emit DataRefreshNotifier event
    │
    ├──► If offline: Save to Room → enqueue in SyncQueue
    │                              → WorkManager will sync later
    │
    ▼
ViewModel updates MutableStateFlow (optimistic for online)
    │
    ▼
Composable recomposes
    │
    ▼
DataRefreshNotifier.refreshEvents emits RefreshScope
    │
    ▼
DashboardViewModel (subscribed) auto-reloads
```

---

## Hilt Dependency Injection Graph

### SingletonComponent (Application-scoped)

```
NetworkModule (@Provides)
├── OkHttpClient (with AuthInterceptor + TokenAuthenticator)
├── Retrofit (configured with Moshi + base URL)
├── All API services (NotesApiService, TasksApiService, etc.)
└── TokenManager (EncryptedSharedPreferences)

DatabaseModule (@Provides)
├── AppDatabase (Room)
└── All DAOs (NoteDao, SyncQueueDao, etc.)

SocketModule (@Provides)
└── SocketManager (Socket.io client, application-scoped)

RepositoryModule (@Binds or @Provides)
├── NotesRepository
├── TasksRepository
├── FlashcardsRepository
├── CareerRepository
├── SocialRepository
├── MessagingRepository
├── ProfileRepository
└── AuthRepository

Singletons
├── DataRefreshNotifier (cross-screen event bus)
├── ProfileUpdateNotifier (nav avatar refresh)
└── NetworkMonitor (connectivity state)
```

### ViewModelComponent (ViewModel-scoped)

Each `@HiltViewModel` injects the repositories and singletons it needs. ViewModels are scoped to the navigation backstack entry.

---

## StateFlow vs SharedFlow

| Type | Use Case | Example |
|------|----------|---------|
| `StateFlow` | UI state that always has a current value | `DashboardUiState`, `NotesUiState`, `TasksUiState` |
| `SharedFlow` | One-time events that should not be replayed | `TokenManager.logoutEvent`, `DataRefreshNotifier.refreshEvents`, `ProfileUpdateNotifier.updates` |

**Rule:** StateFlow for "what the screen shows." SharedFlow for "something happened."

---

## OkHttp Authenticator vs Interceptor

The app uses both:

**AuthInterceptor (Interceptor):** Runs on every request. Attaches `Authorization: Bearer <jwt>` header and `X-Client-Type: android` header. Also sends a descriptive `User-Agent` for session device labeling.

**TokenAuthenticator (Authenticator):** Fires only when a request receives a 401 response. It:
1. Calls `POST /api/auth/mobile/refresh` with the stored refresh token
2. On success: stores the new JWT + refresh token, retries the original request
3. On failure: calls `tokenManager.clearTokens(LogoutReason.REMOTE_INVALIDATION)` which broadcasts a logout event via SharedFlow
4. `AppNavHost` observes this event and navigates to the login screen with a "Your session was ended from another device" message

The key advantage of Authenticator over an interceptor-based approach: OkHttp automatically queues all concurrent requests behind the refresh call. No application-level deduplication logic is needed (unlike the web app's Axios interceptor which requires an explicit `refreshPromise` guard).

---

## Navigation

The app uses Jetpack Navigation Compose with a single `NavHost` in `AppNavHost.kt`.

### Route Structure

```
Auth graph (auth/)
├── login
├── register
├── forgot-password
├── reset-password/{token}
├── verify-email/{token}
├── legal/{type}

Main graph
├── Dashboard (dashboard)
├── Notes graph (notes/)
│   ├── list
│   ├── detail/{noteId}
│   ├── editor/{noteId}
│   └── drive-import
├── Flashcards graph (flashcards/)
│   ├── list
│   ├── detail/{setId}
│   └── study/{setId}
├── Tasks graph (tasks/)
│   ├── board
│   ├── detail/{taskId}
│   └── calendar
├── Career graph (career/)
│   ├── applications
│   ├── application/{appId}
│   ├── resumes
│   ├── resume/{resumeId}
│   └── resume-feedback/{resumeId}
├── Social graph (social/)
│   ├── activity
│   ├── friends
│   ├── user-search
│   ├── user/{userId}
│   ├── shared-note/{noteId}
│   ├── conversations
│   └── conversations/{conversationId}?participantName={name}
└── Profile graph (profile/)
    ├── screen
    ├── edit
    └── settings
```

### Transitions

All navigation uses slide-in/fade-out transitions (`slideIntoContainer` + `fadeOut`) with 300ms tween easing, providing a native feel without jarring cuts.

### Sensitive Routes

Screens containing private data (`Notes.DETAIL`, `Career.RESUME_DETAIL`, `Career.APPLICATION_DETAIL`, `Social.CONVERSATION_DETAIL`, `Social.SHARED_NOTE`) apply `FLAG_SECURE` to prevent screenshots and remove the screen from the recent apps thumbnail.

### Demo mode (`LocalIsDemo`)

`AppNavHost` provides `CompositionLocalProvider(LocalIsDemo provides navProfile.isDemo)` so feature screens can hide create/share/delete affordances and read-only composers when the signed-in account is the demo user, matching the web app’s read-only demo behavior. Gates are applied across **notes** (lists, detail, editor, Drive import), **tasks** (board, detail), **flashcards** (set list, set detail, study session server sync), **career** (applications list/detail, resumes list, resume PDF viewer actions), **social** (friends, activity mark-seen, user search add), **messaging**, **profile** (edit profile blocked; settings toggles disabled; account rows), and anywhere else mutations would write data. **Dashboard** empty sections and **Calendar** add copy-only demo hints so empty or read-only surfaces do not imply the user can create data there while on demo.

---

## Cross-Screen Reactivity

Three SharedFlow-based event buses handle cross-screen data freshness:

1. **DataRefreshNotifier** — When any ViewModel mutates data (create/update/delete), it emits a `RefreshScope` (NOTES, FLASHCARDS, TASKS, APPLICATIONS, PROFILE, ALL). The `DashboardViewModel` subscribes and auto-reloads.

2. **ProfileUpdateNotifier** — When `ProfileViewModel` successfully updates the user's profile (name, avatar), it emits a `Unit` event. `NavProfileViewModel` subscribes and reloads the nav avatar/display name shown in the bottom nav.

3. **TokenManager.logoutEvent** — When `TokenAuthenticator` fails to refresh (remote session invalidation) or the user logs out manually, a `LogoutReason` event is emitted. `AppNavHost` observes this and navigates to the login screen.
