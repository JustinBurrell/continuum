# React to Android: How Continuum Was Ported to Native Kotlin

This document explains how the Continuum React web app was ported to a native Android app using Kotlin and Jetpack Compose. It covers the architectural decisions, mental model mappings, and technical trade-offs that shaped the native implementation.

---

## Why Native Kotlin + Jetpack Compose Over React Native

1. **Hardware-backed security** — EncryptedSharedPreferences with Android KeyStore is a native-only API. The AES-256-GCM master key lives in the device's secure enclave on supported hardware and cannot be extracted even with root access. React Native's JS bridge has no direct access to KeyStore.

2. **Google Credential Manager** — The Credential Manager API for Google Sign-In is a native Android API. React Native requires third-party wrappers that may lag behind API changes. Native gives direct access with zero abstraction overhead.

3. **FLAG_SECURE** — Preventing screenshots on sensitive screens (notes, resumes, career data) is a native Android window flag. No React Native equivalent exists.

4. **Performance** — No JS bridge overhead for gesture-heavy screens like the flashcard study mode (swipe + flip animation at 60fps). Compose renders directly to the Android canvas.

5. **TEI signal** — Google Play is a co-sponsor of the All Star Code Technical Entrepreneurship Incubator. Shipping a native Kotlin app with Jetpack Compose is a direct signal of Android ecosystem investment.

6. **Declarative model parity** — Compose's declarative model (`@Composable` functions, state-driven recomposition) maps closely to React's component model, making the port conceptually straightforward despite being a different language.

---

## Mental Model Mapping: React to Compose

| React Concept | Android/Compose Equivalent | Notes |
|--------------|---------------------------|-------|
| `useState` | `remember { mutableStateOf() }` | Both trigger recomposition/re-render on value change |
| `useEffect` | `LaunchedEffect(key)` | Runs suspend function when key changes; cancels on leave |
| `useContext` | `CompositionLocal` | Ambient values available to the composable tree |
| React Query | `ViewModel` + `StateFlow` + Room | ViewModel survives rotation; StateFlow drives UI; Room provides offline cache |
| Axios interceptors | OkHttp `Interceptor` + `Authenticator` | Authenticator handles 401 recovery with automatic request queuing |
| React Router | Jetpack Navigation Compose | `NavHost` + `composable()` routes with type-safe arguments |
| Tailwind CSS | `MaterialTheme` + `Color.kt` + `Spacing.kt` + `AppShape.kt` | Design tokens translated from CSS variables to Kotlin objects |
| `localStorage` | `EncryptedSharedPreferences` | Stronger security: hardware-backed encryption vs. plaintext browser storage |
| Context Provider | Hilt `@Singleton` + `@HiltViewModel` | Dependency injection replaces React context for service access |
| `useMemo` | `remember { derivedStateOf {} }` | Computed values that only recompute when dependencies change |
| React.lazy | Compose Navigation (screens loaded on-demand) | Navigation destinations are lazily composed |
| CSS transitions | `AnimatedVisibility`, `animateContentSize`, `Animatable` | Compose animation APIs with coroutine integration |

---

## Same REST API, Zero Backend Changes

Both the React web app and the Android app consume the same Express backend REST API. The only backend additions were 4 mobile-specific auth endpoints:

| Endpoint | Why It's Needed |
|----------|----------------|
| `POST /api/auth/mobile/login` | Web uses httpOnly cookies for refresh tokens. Android's HTTP client can't read cookies, so the refresh token is returned in the JSON body for storage in EncryptedSharedPreferences. |
| `POST /api/auth/mobile/refresh` | Same as above — reads the refresh token from the request body instead of a cookie. Token rotation still applies. |
| `POST /api/auth/google/mobile` | Android's Credential Manager produces a Google ID token, not an authorization code. The web OAuth flow uses redirect-based authorization codes. |
| `POST /api/auth/mobile/logout` | Server-side logout that accepts the refresh token in the body for revocation, matching the mobile token storage pattern. |

Every other endpoint (notes, flashcards, tasks, applications, social, messaging, sync) is consumed identically by both clients. The backend identifies the client via the `X-Client-Type: android` header.

---

## Auth: httpOnly Cookies vs. EncryptedSharedPreferences

**Web approach:** The backend sets a `refreshToken` httpOnly cookie on login. The browser automatically sends it on every request. The JWT access token is stored in memory (React state). This is secure because httpOnly cookies are inaccessible to JavaScript (XSS-resistant).

**Android approach:** Android's OkHttp client does not participate in browser cookie management. Instead:

1. Login response includes `{ token, refreshToken }` in the JSON body
2. Both tokens are stored in `EncryptedSharedPreferences`, which uses Android KeyStore for key management
3. On supported devices, the AES-256-GCM master key never leaves the secure enclave — it cannot be extracted even with root access
4. An OkHttp `AuthInterceptor` attaches the JWT to every request via the `Authorization: Bearer` header
5. An OkHttp `TokenAuthenticator` handles 401 responses by calling `/mobile/refresh` with the stored refresh token, updating both tokens, and retrying the original request

This is equivalent security to the web's httpOnly cookie approach, and arguably stronger on devices with hardware-backed KeyStore.

---

## Google OAuth: Redirect Flow vs. Credential Manager

**Web approach:** User clicks "Sign in with Google" → browser redirects to Google consent screen → Google redirects back with an authorization code → backend exchanges code for tokens via Google's server-to-server API.

**Android approach:** User taps "Sign in with Google" → Credential Manager shows a native bottom sheet (powered by Google Play Services) → user selects their Google account → Credential Manager returns a Google ID token → app sends the ID token to `POST /api/auth/google/mobile` → backend verifies the token directly with Google's `google-auth-library`.

WebView-based OAuth is banned by Google Play because users cannot verify they are on Google's real authentication page (phishing risk). Credential Manager uses Google Play Services as a trusted intermediary — the authentication UI is rendered by the OS, not the app.

---

## Real-Time: Socket.io on Android

Both clients use Socket.io for real-time messaging. The Android implementation uses the `io.socket:socket.io-client` Java library.

**Key difference:** Android Activities are destroyed and recreated on screen rotation. The Socket.io connection is bound to the `Application` lifecycle (not an Activity) via Hilt's `@InstallIn(SingletonComponent::class)`. This means:

- The socket survives screen rotation
- The socket lives for the entire app process lifetime
- `SocketManager` exposes `newMessageFlow: SharedFlow<String>` which ViewModels collect
- The `MessagingViewModel` observes this flow and updates the message list in real-time

---

## Offline Support: Room + WorkManager + SyncQueue

The web app has no offline support — it requires an active network connection. The Android app adds a full offline layer:

1. **Room Database** — Local SQLite cache. ViewModels read from Room first (instant UI), then fetch from the API to update.
2. **SyncQueue** — A Room entity that mirrors the backend's `SyncQueue` MongoDB collection. When a mutation happens offline, it is saved locally and queued for sync.
3. **WorkManager** — Android's guaranteed job scheduler. When `NetworkMonitor` detects reconnection, it enqueues a `SyncWorker` that reads pending items from the SyncQueue, batches them, and calls `POST /api/sync`.
4. **NetworkMonitor** — A `ConnectivityManager`-based `StateFlow<Boolean>` that all screens observe. An `OfflineBanner` composable appears globally when offline.
5. **DataRefreshNotifier** — A cross-screen event bus. When any ViewModel mutates data (create, update, delete), it emits a `RefreshScope` event. The `DashboardViewModel` subscribes to all events and auto-reloads, ensuring the dashboard always shows fresh data after navigating back from a mutation.

---

## Design System Translation

The same visual language is maintained across platforms:

| Web (Tailwind) | Android (Compose) |
|----------------|-------------------|
| `text-purple-800` / CSS custom property | `BrandPurple = Color(0xFF6B21A8)` in `Color.kt` |
| `bg-gray-50` | `PageBackground = Color(0xFFF8F9FA)` |
| `border-gray-200` | `Border = Color(0xFFE5E7EB)` |
| `font-family: 'Fraunces'` | `FontFamily(Font(R.font.fraunces_...))` in `Typography.kt` |
| `font-family: 'Plus Jakarta Sans'` | `FontFamily(Font(R.font.plusjakartasans_...))` in `Typography.kt` |
| `rounded-lg` (8px) | `AppShape.sm = RoundedCornerShape(8.dp)` |
| `rounded-xl` (12px) | `AppShape.md = RoundedCornerShape(12.dp)` |
| `p-4` (16px) | `Spacing.lg = 16.dp` |
| `gap-6` (24px) | `Spacing.sectionGap = 24.dp` |
| Tailwind breakpoints | Not applicable — single-column mobile layout |

Card styling uses a mixed approach informed by mobile UX research:
- **Flat cards** (1dp border, no elevation) for list items — Notion-style
- **Elevated cards** (2dp shadow, no border) for interactive elements like dashboard stat tiles — Duolingo-style

---

## UX Revamp: Beyond Web Parity

The Android app went through a comprehensive UX revamp to feel native rather than like a mobile website. Key changes from the initial implementation:

| Area | Before | After |
|------|--------|-------|
| Top bar | Purple `TopAppBar` on every screen | Instagram-style header on dashboard; `MinimalTopBar` (white, back arrow) on detail screens; `InlineScreenHeader` (inline text) on root screens |
| Bottom nav | 7 items with labels | 5 icon-only items: Notes, Flashcards, Center Logo (dashboard), Applications, Profile |
| Navigation | No transitions | Slide-in/fade-out transitions with 300ms tween easing |
| Pull to refresh | Accompanist SwipeRefresh (deprecated) | Material 3 `PullToRefreshBox` |
| Study mode | "Again" button, swipe always enabled | "Still Learning" / "Got it" buttons, swipe disabled until answer revealed |
| Auth | Local-only logout | Server-side refresh token revocation + reactive remote logout detection |
| Profile | Static nav avatar | Auto-refresh via `ProfileUpdateNotifier` SharedFlow |
| Dashboard | Static data | Auto-reload via `DataRefreshNotifier` when data mutates on other screens |
| Task cards | Not clickable | Clickable with full detail screen (status, priority, type, due date, overdue warning) |
| Comments | Not implemented | Reusable `CommentThread` with nested replies, likes, delete |
| User names | Static text | Clickable everywhere — navigates to `UserProfileScreen` |
| Messages | Broken currentUserId | Fixed via `tokenManager.getJwtUserId()`, added search and swipe-to-delete |
| Cards | Inconsistent styling | Flat for lists, Elevated for interactive — via `ContinuumCard` with `CardStyle` enum |
| Error feedback | None | Keyframe-based horizontal shake animation on validation errors |
| Haptics | None | `HapticFeedbackType` on key interactions |
