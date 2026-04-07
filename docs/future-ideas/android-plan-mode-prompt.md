# Continuum Android Plan Mode Prompt
**Branch:** `feat/android-app`
**For Claude Code: Plan Mode. Read completely. Do not write any code yet.**

---

## WHAT THIS DOCUMENT IS

This is the complete specification for building the Continuum Android app in Kotlin + Jetpack Compose. It covers every feature, every architectural decision, every security requirement, every design token, and every documentation update needed.

Read this entire document before producing the plan. The plan must cover every section in the order they appear here.

---

## PHASE 0 — Before Any Code

### Step 0.1 — Branch
```
git checkout main
git pull origin main
git checkout -b feat/android-app
```

### Step 0.3 — Conventional Commits Convention

All commits in this branch follow the same Conventional Commits format used throughout the rest of the Continuum codebase. Read `docs/agile_workflow_guide.md` (or equivalent in the repo) to confirm the exact format used. The rules are:

**Format:** `type: short imperative description`
- No scope in parentheses: `feat: add login screen` NOT `feat(android): add login screen`
- No capital letter after the colon
- No period at the end
- No em dashes anywhere in commit messages
- Imperative mood: "add", "build", "fix", "update" NOT "added", "building", "fixed"

**Types used in this branch:**
- `feat:` — new screens, new features, new endpoints
- `fix:` — bug fixes
- `chore:` — Gradle setup, dependency additions, config files
- `docs:` — README, interview brief, demo script, FCM spec
- `test:` — Jest tests for new backend endpoints, emulator verification
- `refactor:` — code restructuring without behavior change

**One commit per ticket or phase.** Do not batch multiple tickets into one commit. Do not commit partial work.

**Examples of correct commit messages for this branch:**
```
feat: MOB-1 build mobile auth screens
feat: MOB-2 build mobile notes and import screens
chore: add Android project with Gradle dependencies
chore: configure Hilt DI modules and Room database
feat: add mobile auth endpoints to backend
test: add Jest tests for mobile auth endpoints
docs: POL-18 add Android README
docs: update interview brief with Android stack details
```
Before writing anything, do the following reads:

1. Read `backend/routes/` — confirm `POST /api/auth/mobile/login` and `POST /api/auth/google/mobile` do NOT yet exist. These are new endpoints needed for Android auth and must be built in Phase 1.
2. Read `backend/routes/sync.js` (or wherever `POST /api/sync` lives) — confirm the endpoint exists and understand its current implementation. The plan will reference it for offline sync.
3. Read `backend/middleware/` — find the CORS config and note which origins are currently whitelisted.
4. Read `docs/` — note every subdirectory and file that currently exists. Specifically check: does `docs/android/` exist? Does `docs/future-ideas/` exist? Does `docs/backend/api_reference_guide.md` exist? Does `docs/database/` have a schema explanation file? Report the exact structure so Phase 9 knows what to create vs. update.
5. Read `web/README.md` — this is the reference for what the Android README should look like structurally.
6. Check if `android/` directory exists at the monorepo root. It should not. If it does, stop and ask before proceeding.

Report findings from this audit before producing the full plan.

---

## PHASE 1 — Backend Additions (Mobile Auth + CORS)

These backend changes must happen before any Android code is written. They live in the existing `backend/` directory.

### 1.1 — New endpoint: POST /api/auth/mobile/login

**Why this is needed:** The web app uses httpOnly cookies for refresh tokens, which Android's HTTP client cannot read or send. Android needs the refresh token in the response body so it can store it in EncryptedSharedPreferences.

**Implementation:**
- Route: `POST /api/auth/mobile/login`
- Auth: none (public endpoint)
- Body: `{ email, password }`
- Response on success: `{ success: true, token: "<JWT>", refreshToken: "<raw refresh token>", user: { ... } }`
- The refresh token returned must be the raw token string (not hashed) — the hash is stored in MongoDB, the raw token goes to the client
- Behavior is identical to `POST /api/auth/login` except: instead of setting a httpOnly cookie, return the refresh token in the JSON body
- Apply the existing `authLimiter` middleware (10 req/15 min) — same rate limiting as web login
- Add Swagger JSDoc annotation following the same pattern as existing auth routes

**New endpoint: POST /api/auth/mobile/refresh**
- Route: `POST /api/auth/mobile/refresh`
- Body: `{ refreshToken: "<raw refresh token>" }`
- Behavior: identical to `POST /api/auth/refresh` except reads token from body instead of httpOnly cookie
- Response: `{ success: true, token: "<new JWT>", refreshToken: "<new raw refresh token>" }` — rotation applies, old token is revoked
- Add Swagger JSDoc annotation

### 1.2 — New endpoint: POST /api/auth/google/mobile

**Why this is needed:** Android's Credential Manager API produces a Google ID token, not an authorization code. The existing `/api/auth/google` flow expects an authorization code from the browser redirect. A separate mobile endpoint accepts the ID token directly.

**Implementation:**
- Route: `POST /api/auth/google/mobile`
- Auth: none (public endpoint)
- Body: `{ idToken: "<Google ID token from Credential Manager>" }`
- Server-side: verify the ID token using `google-auth-library` (`OAuth2Client.verifyIdToken()`). Extract email, name, googleId, avatar from the verified payload.
- Find or create user by googleId/email (same upsert logic as the web OAuth callback)
- Return: `{ success: true, token: "<JWT>", refreshToken: "<raw refresh token>", user: { ... } }` — same body format as mobile/login
- Rate limit with `authLimiter`
- Add Swagger JSDoc annotation

**Note:** The `WEB_CLIENT_ID` (the backend's OAuth client ID) is used to verify the token. This is already in `GOOGLE_CLIENT_ID` env var. No new env var needed.

### 1.3 — Google Cloud Console: Android OAuth Client

**Why this is needed:** The Credential Manager API on Android requires the app's SHA-1 fingerprint to be registered as an Android OAuth client in Google Cloud Console. Without this, Google Sign-In on Android will fail.

**Steps to document in the plan (these are manual steps the developer must do — include them as a checklist the developer works through before testing auth):**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: Android
4. Package name: `com.continuum.android` (this must match the applicationId in `android/app/build.gradle.kts`)
5. SHA-1 certificate fingerprint — for debug builds, run: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` and copy the SHA-1
6. Save the client ID — it will be used in `android/app/src/main/res/values/strings.xml` as `default_web_client_id`
7. **Important:** The `WEB_CLIENT_ID` used in `GetGoogleIdOption.Builder().setServerClientId()` must be the **web client ID** (already exists), NOT the Android client ID. The Android client ID is only for Google Cloud Console registration.

Include this checklist in the plan as a pre-implementation step that must be completed before MOB-1 auth implementation begins.

### 1.4 — CORS Configuration Update

**Why this is needed:** Android HTTP clients (OkHttp) do not send an `Origin` header or send `null` as the origin. The current CORS whitelist of specific web origins will reject Android requests.

**Find the CORS configuration in `backend/` (likely `server.js` or a middleware file) and add:**
- Allow `null` origin (for Android OkHttp) alongside the existing whitelisted origins
- Alternatively, add a check: if the request has no `Origin` header and has a valid JWT, allow it through
- The cleanest solution: check if the request is from a mobile client via a custom header `X-Client-Type: android` — if present and JWT is valid, bypass origin check
- The Android app must send `X-Client-Type: android` on every request (add this as a default header in the OkHttp client setup)

### 1.5 — FCM Future Spec

**Create `docs/future-ideas/fcm-push-notifications.md`** with the full spec below. This file must be created as part of this branch even though the feature is not being built yet.

```markdown
# FCM Push Notifications

## Status: Planned, not yet implemented

## Why This Is Not Built Yet

The current Android app uses Socket.io for real-time features, which only works
when the app is in the foreground. When the app is backgrounded or the process
is killed, the Socket.io connection is dropped. Android's OS does not allow
persistent TCP connections for background apps without a system-level mechanism.

Firebase Cloud Messaging (FCM) is Google's official solution for background
push notifications on Android. It uses Google's own persistent connection
to the device, which the OS allows because it trusts the Firebase system service.

## What FCM Enables

- Message notifications when the app is backgrounded or closed
- Task reminder notifications (due date approaching)
- Friend request notifications
- Activity feed notifications (someone shared a note with you)
- Any event currently handled by Socket.io, delivered even when offline

## Architecture Overview

### Current flow (Socket.io only)
Backend emits event → Socket.io → user's connected socket → UI updates

### Future flow (Socket.io + FCM)
Backend emits event → Socket.io (if connected) → UI updates
                    → FCM (always, as fallback) → Android notification tray

The two channels are complementary. Socket.io handles in-app real-time updates.
FCM handles background delivery. The backend sends both for every event.

## Backend Changes Required

### 1. New User model field
Add `fcmTokens: [{ token: String, deviceId: String, updatedAt: Date }]` to the
User schema. Array supports multiple devices per user.

### 2. New endpoint
POST /api/users/device-token
Body: { token: string, deviceId: string }
Auth: required (JWT)
Behavior: upsert the FCM token for this deviceId on the authenticated user

### 3. Firebase Admin SDK
Install: npm install firebase-admin
Initialize in backend/lib/firebase.js using a service account JSON from
Firebase Console. Store as FIREBASE_SERVICE_ACCOUNT_JSON env var (base64 encoded).

### 4. Notification send helper
Create backend/lib/notifications.js:

async function sendNotification(userId, { title, body, data }) {
  const user = await User.findById(userId).select('fcmTokens');
  if (!user?.fcmTokens?.length) return;
  const tokens = user.fcmTokens.map(t => t.token);
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data, // extra payload for deep linking
    android: { priority: 'high' }
  });
}

### 5. Add notification calls to existing controllers
In messages.controller.js after saving a message: sendNotification(recipientId, ...)
In friends.controller.js after accepting/sending request: sendNotification(...)
In activity.service.js after creating activity: sendNotification(...)

## Android Changes Required

### 1. Add Firebase to the Android project
- Create project in Firebase Console
- Add Android app with package name com.continuum.android
- Download google-services.json → place at android/app/google-services.json
- Add to android/build.gradle.kts plugins: id("com.google.gms.google-services")
- Add to android/app/build.gradle.kts plugins: id("com.google.gms.google-services")

### 2. Add dependencies
implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
implementation("com.google.firebase:firebase-messaging-ktx")

### 3. Implement FirebaseMessagingService
class ContinuumMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        // POST to /api/users/device-token with the new token
        // Store token in DataStore for reference
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // Build and show a NotificationCompat notification
        // Use PendingIntent with deep link to open the right screen
        // e.g. message notification opens ConversationDetail/{conversationId}
    }
}

### 4. Request POST_NOTIFICATIONS permission (Android 13+)
Use Accompanist Permissions or ActivityResultContracts to request
Manifest.permission.POST_NOTIFICATIONS on first launch after login.

### 5. Register service in AndroidManifest.xml
<service android:name=".ContinuumMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
    </intent-filter>
</service>

## Deep Link Strategy for Notifications

Each notification type carries a data payload for deep linking:

| Notification type    | data payload                        | Opens                          |
|---------------------|-------------------------------------|--------------------------------|
| New message         | { type: "message", conversationId } | ConversationDetail/{id}        |
| Friend request      | { type: "friend_request" }          | FriendsList (Pending tab)      |
| Note shared with me | { type: "shared_note", noteId }     | SharedNoteView/{id}            |
| Task assigned       | { type: "task", taskId }            | TaskDetail/{id}                |

The MainActivity handles the incoming Intent from notification tap,
reads the data payload, and navigates via NavController to the correct screen.

## Testing

Use Firebase Console > Cloud Messaging > Send test message to test
FCM delivery to a specific device token. Obtain the token from
EncryptedSharedPreferences or DataStore after first launch.

## Environment Variables to Add

FIREBASE_SERVICE_ACCOUNT_JSON — base64 encoded service account JSON from Firebase Console.
Add to Render dashboard, never commit to source control.
```

**Commit:** `docs: add FCM push notifications future spec`

### 1.6 — Postman Collection Updates

**Add to the existing Postman collection (or create a new "Mobile Auth" folder within the collection):**
- `POST /api/auth/mobile/login` — with example body and tests for token presence
- `POST /api/auth/mobile/refresh` — with example body and rotation test
- `POST /api/auth/google/mobile` — with example body (note: requires a real Google ID token, document how to obtain one for testing)

**Add test scripts to each new endpoint following the existing Postman test patterns in the collection.**

### 1.7 — Jest Tests for New Endpoints

**Add to `backend/tests/auth.test.js` (or create `backend/tests/auth-mobile.test.js`):**

Tests to add:
- `POST /api/auth/mobile/login` with valid credentials → returns JWT + refreshToken in body (not cookie)
- `POST /api/auth/mobile/login` with wrong password → 401
- `POST /api/auth/mobile/refresh` with valid refresh token → new JWT + new refresh token, old token revoked
- `POST /api/auth/mobile/refresh` with expired/invalid token → 401
- Confirm `POST /api/auth/mobile/login` is rate limited (10/15min)
- `POST /api/auth/google/mobile` with invalid ID token → 401

Follow the existing test patterns exactly (mongodb-memory-server, beforeEach cleanup, etc.)

---

## PHASE 2 — Android Project Initialization

### 2.1 — Create Android project

**STOP — developer action required before Claude Code continues.**

Claude Code cannot create an Android Studio project. The initial project must be created manually by the developer in Android Studio. This generates the Gradle wrapper, build system files, and SDK configuration that everything else depends on. The font directory also does not exist until this step completes, so font setup happens after this.

**Do this now:**
1. Open Android Studio
2. File → New → New Project → Empty Activity
3. Configure with exactly these settings:
   - Name: `Continuum`
   - Package name: `com.continuum.android`
   - Save location: `<monorepo root>/android/` (same repo, alongside `web/` and `backend/`)
   - Language: Kotlin
   - Minimum SDK: API 26 (Android 8.0)
   - Build configuration language: Kotlin DSL (`.kts`)
4. Click Finish and let Android Studio complete the initial Gradle sync
5. Confirm the `android/` directory now exists at the monorepo root with `app/`, `gradle/`, `build.gradle.kts`, `settings.gradle.kts`
6. The branch `feat/android-app` was already checked out in Phase 0. Android Studio created the files on that branch. Confirm with `git status` — you should see new untracked files under `android/`

**Tell Claude Code when this is done.** Claude Code will then proceed to font setup.

**Commit after developer completes this step:** `chore: initialize Android Studio project scaffold`

---

## PHASE 3 — Font Setup for Android

**Android uses `.ttf` files, not `.woff2`. This is a hard requirement — `.woff2` files cannot be used as Android font resources. The Android Studio project must exist before this step because the font directory lives inside the project.**

### Step 2.1 — Download font files

The developer must download these manually before implementation continues:

Go to Google Fonts (https://fonts.google.com) and download:

**Fraunces:**
- Go to https://fonts.google.com/specimen/Fraunces
- Click "Download family"
- From the zip, extract these specific files:
  - `Fraunces-Bold.ttf` (weight 700)
  - `Fraunces-Black.ttf` (weight 900)
- Rename to: `fraunces_bold.ttf`, `fraunces_black.ttf`

**Plus Jakarta Sans:**
- Go to https://fonts.google.com/specimen/Plus+Jakarta+Sans
- Click "Download family"
- From the zip, extract:
  - `PlusJakartaSans-Regular.ttf` (weight 400)
  - `PlusJakartaSans-Medium.ttf` (weight 500)
  - `PlusJakartaSans-SemiBold.ttf` (weight 600)
  - `PlusJakartaSans-Bold.ttf` (weight 700)
- Rename to: `plus_jakarta_sans_regular.ttf`, `plus_jakarta_sans_medium.ttf`, `plus_jakarta_sans_semibold.ttf`, `plus_jakarta_sans_bold.ttf`

**Note:** Android font resource file names must be lowercase with underscores only — no hyphens, no spaces.

### Step 2.2 — Place font files

Place all 6 `.ttf` files at:
```
android/app/src/main/res/font/
```

This directory will be created as part of the Android project setup.

### Step 2.3 — Define font families in XML

Create `android/app/src/main/res/font/fraunces.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
    <font
        android:fontStyle="normal"
        android:fontWeight="700"
        android:font="@font/fraunces_bold" />
    <font
        android:fontStyle="normal"
        android:fontWeight="900"
        android:font="@font/fraunces_black" />
</font-family>
```

Create `android/app/src/main/res/font/plus_jakarta_sans.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
    <font android:fontStyle="normal" android:fontWeight="400" android:font="@font/plus_jakarta_sans_regular" />
    <font android:fontStyle="normal" android:fontWeight="500" android:font="@font/plus_jakarta_sans_medium" />
    <font android:fontStyle="normal" android:fontWeight="600" android:font="@font/plus_jakarta_sans_semibold" />
    <font android:fontStyle="normal" android:fontWeight="700" android:font="@font/plus_jakarta_sans_bold" />
</font-family>
```

### Step 2.4 — Register in Compose Typography

In `android/app/src/main/java/com/continuum/android/core/ui/theme/Type.kt`:

```kotlin
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.continuum.android.R

val FrauncesFamily = FontFamily(
    Font(R.font.fraunces_bold, FontWeight.Bold),
    Font(R.font.fraunces_black, FontWeight.Black)
)

val PlusJakartaSansFamily = FontFamily(
    Font(R.font.plus_jakarta_sans_regular, FontWeight.Normal),
    Font(R.font.plus_jakarta_sans_medium, FontWeight.Medium),
    Font(R.font.plus_jakarta_sans_semibold, FontWeight.SemiBold),
    Font(R.font.plus_jakarta_sans_bold, FontWeight.Bold)
)

val ContinuumTypography = Typography(
    // Display / hero headlines — Fraunces
    displayLarge = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Black, fontSize = 36.sp),
    displayMedium = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold, fontSize = 28.sp),
    displaySmall = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold, fontSize = 22.sp),
    // Headlines — Fraunces for section titles, Plus Jakarta Sans for card titles
    headlineLarge = TextStyle(fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold, fontSize = 24.sp),
    headlineMedium = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Bold, fontSize = 20.sp),
    headlineSmall = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.SemiBold, fontSize = 16.sp),
    // Body — Plus Jakarta Sans
    bodyLarge = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp),
    // Labels
    labelLarge = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
    labelMedium = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Medium, fontSize = 12.sp),
    labelSmall = TextStyle(fontFamily = PlusJakartaSansFamily, fontWeight = FontWeight.Medium, fontSize = 10.sp)
)
```

**Developer confirms font files are placed before implementation continues — same pause pattern as the web font setup.**

---

## PHASE 4 — Android Project Structure and Dependencies

### 4.1 — Reorganize project structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/continuum/android/
│   │   │   │   ├── ContinuumApp.kt
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── core/
│   │   │   │   │   ├── network/
│   │   │   │   │   │   ├── ApiClient.kt
│   │   │   │   │   │   ├── TokenAuthenticator.kt
│   │   │   │   │   │   └── NetworkMonitor.kt
│   │   │   │   │   ├── data/
│   │   │   │   │   │   ├── local/
│   │   │   │   │   │   │   ├── AppDatabase.kt
│   │   │   │   │   │   │   └── TokenManager.kt
│   │   │   │   │   │   └── remote/dto/
│   │   │   │   │   ├── domain/model/
│   │   │   │   │   └── ui/
│   │   │   │   │       ├── components/
│   │   │   │   │       ├── theme/
│   │   │   │   │       │   ├── Color.kt
│   │   │   │   │       │   ├── Type.kt
│   │   │   │   │       │   └── Theme.kt
│   │   │   │   │       └── navigation/
│   │   │   │   │           ├── AppNavHost.kt
│   │   │   │   │           └── BottomNavBar.kt
│   │   │   │   ├── di/
│   │   │   │   │   ├── NetworkModule.kt
│   │   │   │   │   ├── DatabaseModule.kt
│   │   │   │   │   ├── SocketModule.kt
│   │   │   │   │   └── RepositoryModule.kt
│   │   │   │   └── feature/
│   │   │   │       ├── auth/
│   │   │   │       ├── notes/
│   │   │   │       ├── flashcards/
│   │   │   │       ├── tasks/
│   │   │   │       ├── career/
│   │   │   │       └── social/
│   │   │   ├── res/
│   │   │   │   ├── font/          ← TTF files go here
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   └── colors.xml
│   │   │   │   └── xml/
│   │   │   │       └── network_security_config.xml
│   │   │   └── AndroidManifest.xml
│   │   └── test/ + androidTest/
│   └── build.gradle.kts
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
└── README.md
```

### 3.3 — build.gradle.kts dependencies

Add these exact dependencies to `android/app/build.gradle.kts`:

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.continuum.android"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.continuum.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    buildFeatures { compose = true }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    // Kotlin
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Lifecycle + ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Hilt DI
    implementation("com.google.dagger:hilt-android:2.53.1")
    ksp("com.google.dagger:hilt-android-compiler:2.53.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.2")
    ksp("com.squareup.moshi:moshi-kotlin-codegen:1.15.2")

    // Room (local database)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Secure storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Image loading
    implementation("io.coil-kt.coil3:coil-compose:3.1.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.1.0")

    // Socket.io
    implementation("io.socket:socket.io-client:2.1.1") {
        exclude(group = "org.json", module = "json")
    }

    // Google Auth (Credential Manager)
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // Browser (Custom Tabs for Google Drive picker)
    implementation("androidx.browser:browser:1.8.0")

    // Paging
    implementation("androidx.paging:paging-runtime:3.3.5")
    implementation("androidx.paging:paging-compose:3.3.5")

    // DataStore (non-sensitive preferences)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Rich Text Editor (Compose-native)
    implementation("com.mohamedrejeb.richeditor:richeditor-compose:1.0.0-rc08")

    // PDF rendering
    implementation("androidx.core:core-ktx:1.15.0")
    // PdfRenderer is part of Android SDK — no extra dependency needed

    // Accompanist (for permissions, swipe-to-refresh)
    implementation("com.google.accompanist:accompanist-permissions:0.36.0")
    implementation("com.google.accompanist:accompanist-swiperefresh:0.36.0")

    // WorkManager (for background sync)
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("io.mockk:mockk:1.13.13")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

---

## PHASE 5 — Design System

Before building any screen, the full design system must be in place.

### 4.1 — Color.kt

```kotlin
// android/app/src/main/java/com/continuum/android/core/ui/theme/Color.kt
val BrandPurple = Color(0xFF6B21A8)
val DeepPurple = Color(0xFF3B0764)
val PurpleTint = Color(0xFFF3F0FF)
val PageBackground = Color(0xFFF8F9FA)
val White = Color(0xFFFFFFFF)
val Border = Color(0xFFE5E7EB)
val TextPrimary = Color(0xFF111827)
val TextSecondary = Color(0xFF6B7280)
val TextMuted = Color(0xFF9CA3AF)
val SuccessGreen = Color(0xFF059669)
val SuccessGreenBg = Color(0xFFECFDF5)
val WarningAmber = Color(0xFFD97706)
val WarningAmberBg = Color(0xFFFFFBEB)
val ErrorRed = Color(0xFFDC2626)
val ErrorRedBg = Color(0xFFFEE2E2)
val SurfaceWhite = Color(0xFFFFFFFF)
```

### 4.2 — Theme.kt

```kotlin
private val LightColorScheme = lightColorScheme(
    primary = BrandPurple,
    onPrimary = White,
    primaryContainer = PurpleTint,
    onPrimaryContainer = DeepPurple,
    background = PageBackground,
    onBackground = TextPrimary,
    surface = White,
    onSurface = TextPrimary,
    surfaceVariant = PageBackground,
    onSurfaceVariant = TextSecondary,
    outline = Border,
    error = ErrorRed,
    onError = White,
)

@Composable
fun ContinuumTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = ContinuumTypography,
        content = content
    )
}
```

**The app is light mode only for now. No dark mode.**

### 4.3 — Shared UI components to build before feature screens

Build these reusable Composables in `core/ui/components/` before writing any feature screen:

- `ContinuumButton` — primary (`BrandPurple` bg, white text), secondary (white bg, `BrandPurple` border + text), danger (`ErrorRed` bg, white text). `border-radius: 8.dp` — not pill shape.
- `ContinuumTextField` — with label, placeholder, focus ring (`BrandPurple` 2dp border on focus), error state
- `ContinuumCard` — white bg, `1dp Border` border, `12.dp` corner radius, `4dp` elevation equivalent
- `StatusBadge` — Interview/Applied/Saved/Offer/Rejected variants matching web color system
- `AvatarInitials` — circular avatar with initials, `PurpleTint` bg, `BrandPurple` text
- `SkeletonLoader` — shimmer animation Composable for loading states. Every list screen must use this, not a spinner.
- `EmptyState` — icon + headline + subtext + optional action button. Every list screen must have one.
- `OfflineBanner` — persistent banner at top of screen when `NetworkMonitor` reports disconnected. `ErrorRed` bg, white text, `12.sp` Plus Jakarta Sans.
- `PurpleTopAppBar` — `TopAppBar` with `BrandPurple` background, white title in Fraunces Bold, white back arrow

---

## PHASE 6 — Core Architecture Setup

Build the full architecture layer before any feature screens. This is the skeleton everything plugs into.

### 5.1 — TokenManager.kt

EncryptedSharedPreferences wrapper. Stores and retrieves:
- `access_token` (JWT)
- `refresh_token` (raw refresh token from mobile/login response)

Methods: `saveTokens(jwt, refreshToken)`, `getAccessToken(): String?`, `getRefreshToken(): String?`, `clearTokens()`

```kotlin
// Uses MasterKey.KeyScheme.AES256_GCM
// Uses EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV
// Uses EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
```

### 5.2 — ApiClient.kt

OkHttp + Retrofit setup:
- Base URL: `BuildConfig.BASE_URL` (set in `build.gradle.kts` from `local.properties` or env)
- Default headers: `X-Client-Type: android` on every request
- `AuthInterceptor` — adds `Authorization: Bearer <token>` from TokenManager on every request
- `TokenAuthenticator` — OkHttp Authenticator (not interceptor) that handles 401 by calling `POST /api/auth/mobile/refresh`, updating stored tokens, and retrying the original request. Uses `runBlocking` to call refresh synchronously. If refresh fails (401 again), clears tokens and returns null (triggers navigation to login).
- `HttpLoggingInterceptor` — DEBUG builds only
- `MoshiConverterFactory` for JSON parsing
- 30s connect timeout, 30s read timeout

### 5.3 — NetworkMonitor.kt

Application-scoped singleton that exposes `val isOnline: StateFlow<Boolean>`. Uses `ConnectivityManager.NetworkCallback`. Every screen observes this to show `OfflineBanner`.

### 5.4 — AppDatabase.kt

Room database with these DAOs and entities for local caching:
- `NoteEntity` + `NoteDao` — cache notes list and individual note content
- `FlashcardSetEntity` + `FlashcardSetDao` — cache flashcard sets
- `FlashcardEntity` + `FlashcardDao` — cache individual cards
- `TaskEntity` + `TaskDao` — cache task board
- `UserEntity` + `UserDao` — cache current user profile
- `SyncQueueEntity` + `SyncQueueDao` — local queue of offline mutations (mirrors the SyncQueue MongoDB model exactly)

### 5.5 — SocketModule.kt + SocketManager.kt

Application-scoped Socket.io singleton via Hilt:
- Connects with `auth: { token: <JWT> }` in handshake (same as web)
- Handles reconnection on network restore (register `NetworkMonitor` callback to call `socket.connect()` when `isOnline` transitions to true)
- Exposes `SharedFlow`s for each event type: `newMessageFlow`, `friendRequestFlow`, `taskUpdatedFlow`, `activityUpdatedFlow`, `noteUpdatedFlow`
- ViewModels collect from these flows — they never register socket callbacks directly

### 5.6 — Navigation

**NavGraph structure:**
```
AppNavHost (root)
├── AuthGraph (when not authenticated)
│   ├── LoginScreen (start)
│   ├── RegisterScreen
│   ├── ForgotPasswordScreen
│   ├── ResetPasswordScreen
│   └── VerifyEmailScreen
└── MainGraph (when authenticated)
    ├── BottomNavBar: Notes | Flashcards | Tasks | Career | Social
    ├── NotesGraph
    │   ├── NotesList (start)
    │   ├── NoteDetail/{noteId}
    │   ├── NoteEditor/{noteId?}  ← null = create, string = edit
    │   └── GoogleDriveImport
    ├── FlashcardsGraph
    │   ├── FlashcardSetsList (start)
    │   ├── FlashcardSetDetail/{setId}
    │   └── StudyMode/{setId}
    ├── TasksGraph
    │   ├── TasksBoard (start — Kanban)
    │   ├── TaskDetail/{taskId}
    │   └── CalendarView
    ├── CareerGraph
    │   ├── ApplicationsList (start)
    │   ├── ApplicationDetail/{appId}
    │   ├── ResumesList
    │   ├── ResumeDetail/{resumeId}   ← PDF viewer
    │   └── ResumeFeedback/{resumeId}
    └── SocialGraph
        ├── ActivityFeed (start)
        ├── FriendsList
        ├── UserSearch
        ├── SharedNoteView/{noteId}
        ├── Conversations
        └── ConversationDetail/{conversationId}
```

**Deep links to register in `AndroidManifest.xml`:**
- `continuum://auth/verify-email?token={token}` → VerifyEmailScreen
- `continuum://auth/reset-password?token={token}` → ResetPasswordScreen

**Bottom nav:** 5 tabs. Icons from `material-icons-extended`. Labels below icons. Active tab: `BrandPurple` icon + label. Inactive: `TextMuted` icon + label. Tab bar background: white with `1dp Border` top border.

**Back stack:** Configure each bottom nav item with `saveState = true` and `restoreState = true` so each tab remembers its scroll position and sub-navigation.

---

## PHASE 7 — Security Implementation

Implement all security measures before writing any feature screen.

### 6.1 — Network Security Config

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <debug-overrides>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

Reference in `AndroidManifest.xml`: `android:networkSecurityConfig="@xml/network_security_config"`

### 6.2 — AndroidManifest.xml security flags

```xml
<application
    android:allowBackup="false"
    android:networkSecurityConfig="@xml/network_security_config"
    android:fullBackupContent="false"
    ...>
```

### 6.3 — FLAG_SECURE on sensitive screens

Apply `FLAG_SECURE` to the Activity for screens containing sensitive content. In `MainActivity.kt`:
```kotlin
// Applied when navigating to: NoteDetail, ResumeDetail, ResumeFeedback, ApplicationDetail, ConversationDetail
window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
// Cleared when navigating away from sensitive screens
window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
```

### 6.4 — Edge-to-edge display

In `MainActivity.kt`:
```kotlin
enableEdgeToEdge()
// All Compose screens must use Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
// or safeContent insets to avoid content being hidden behind system bars
```

---

## PHASE 8 — Feature Implementation

### MOB-1: Auth Screens

**Ticket:** `feat: build mobile auth screens`

**Login Screen (`feature/auth/presentation/LoginScreen.kt`)**

Layout: Split panel — identical concept to the web redesign but adapted for mobile:
- Mobile has no room for a split panel. Instead: dark purple (`DeepPurple`) top section (40% of screen height) with white logo, brand headline in Fraunces Bold, and trust signals. White bottom section (60%) with the form.
- Alternatively (simpler, recommended): full white screen with `BrandPurple` logo at top, centered form. The split panel is a desktop pattern — on mobile the form-only layout is more usable.
- **Recommended approach:** White background, `BrandPurple` logo centered at top (tappable → goes to a "About Continuum" screen or does nothing), `ContinuumCard` wrapping the form area.

Form elements:
- "Welcome back" headline in Fraunces Bold `24.sp` `TextPrimary`
- "Sign in to your Continuum account" in Plus Jakarta Sans `14.sp` `TextSecondary`
- `ContinuumButton` variant: full-width Google Sign-In button with Google `G` icon, white bg, `Border` border — "Continue with Google"
- Divider: "or sign in with email" in `TextMuted` with `Border` lines each side
- Email `ContinuumTextField`
- Password `ContinuumTextField` with eye icon toggle (show/hide)
- "Forgot password?" right-aligned link in `BrandPurple` `12.sp`
- "Sign in" `ContinuumButton` primary — full width, `border-radius: 8.dp` NOT pill
- "Don't have an account? Sign up" centered at bottom

**Google Sign-In flow:**
```kotlin
// Use Credential Manager API
val googleIdOption = GetGoogleIdOption.Builder()
    .setFilterByAuthorizedAccounts(false)
    .setServerClientId(stringResource(R.string.default_web_client_id)) // WEB client ID
    .setNonce(generateNonce()) // SHA-256 hash of random bytes for security
    .build()

val request = GetCredentialRequest.Builder()
    .addCredentialOption(googleIdOption)
    .build()

// On success: extract idToken from GoogleIdTokenCredential
// POST to /api/auth/google/mobile with { idToken }
// On response: save tokens via TokenManager, navigate to MainGraph
```

**Register Screen:** Same layout as Login. Fields: First name + Last name (row), Username, Email, Password (eye toggle). No confirm password field. Legal text. "Create account" primary button.

**ForgotPassword Screen:** Simple — email field, "Send reset link" button, "Back to sign in" link.

**ResetPassword Screen:** New password field (eye toggle), "Reset password" button. Check for existing success/expired states in the component and apply the same visual treatment as web.

**VerifyEmailScreen:** Handle the deep link `continuum://auth/verify-email?token={token}`. Show loading → success (green check, "Email verified", "Continue to Continuum" button) or error (red X, "Verification failed", "Resend" link).

**AuthViewModel:** Exposes `uiState: StateFlow<AuthUiState>` with sealed class states: `Idle`, `Loading`, `Success(user)`, `Error(message)`. Methods: `login(email, password)`, `loginWithGoogle(idToken)`, `register(data)`, `forgotPassword(email)`, `resetPassword(token, newPassword)`.

**Token persistence on app restart:** On `MainGraph` entry, check `TokenManager.getAccessToken()`. If present, call `GET /api/auth/me`. If 401, call `TokenAuthenticator` refresh flow automatically. If refresh fails, navigate to `AuthGraph`.

**Commit:** `feat: MOB-1 build mobile auth screens`

---

### MOB-2: Notes Screens

**Ticket:** `feat: build mobile notes and import screens`

**Notes List Screen:**
- `PurpleTopAppBar` with title "Notes" + search icon + FAB (floating action button, `BrandPurple`, `+` icon) for creating new note
- Pull-to-refresh (Accompanist `SwipeRefresh`)
- Search bar (collapsible from top app bar icon) — filters notes list client-side first, debounced API call for server search
- `SkeletonLoader` while loading
- `EmptyState` with notebook icon when no notes
- `OfflineBanner` when offline
- Note cards: `ContinuumCard`, note title in Plus Jakarta Sans SemiBold `16.sp`, preview text `14.sp TextSecondary`, tag chips (`PurpleTint` bg `BrandPurple` text `10.sp`), AI badge if summary exists
- Swipe-to-delete with `SwipeToDismiss` composable → confirmation dialog before DELETE
- Long-press → context menu (Edit, Share, Delete, Generate Flashcards)

**Note Detail Screen:**
- `PurpleTopAppBar` with note title + edit icon + share icon + more (⋮) menu
- Render note content as rich text (display-only mode using `RichTextState.setHtml()` from richeditor-compose)
- AI Summary section: collapsible card at bottom — "Quick Summary" and "Detailed Summary" tabs. Generate button if no summary exists (calls `POST /api/notes/:id/summary`)
- "Generate Flashcards" button if `!note.hasFlashcards` (calls `POST /api/notes/:id/flashcards/generate`)
- Flag sensitive content — apply `FLAG_SECURE` on this screen
- Google Doc badge + "Refresh from Drive" button if note has `googleDocId`

**Note Editor Screen:**
- Full-screen editor
- `richeditor-compose` `RichTextEditor` composable for rich text input with formatting toolbar
- Formatting toolbar: Bold, Italic, Underline, H1, H2, bullet list, numbered list — in `BrandPurple` when active
- Auto-save: debounced 2-second PATCH to `/api/notes/:id` on every keystroke
- Tag input: chip-based tag entry below title field
- Visibility toggle: Private / Friends (bottom sheet)
- Keyboard-aware layout: `Modifier.imePadding()` so toolbar stays above keyboard

**Google Drive Import Screen:**
- Call `GET /api/google/files` to list Google Drive docs
- Display as list with Google Docs icon, file name, last modified
- Search/filter list client-side
- On tap: call `POST /api/notes/import` with `{ googleDocId, title }`
- Progress indicator during import (this can take a few seconds — PDF export + Cloudinary upload)
- Handle "Google account not linked" state: show a "Link Google Account" button that triggers `AuthorizationClient` to request `drive.readonly` scope, then sends the resulting access token to `POST /api/me/google/link`
- On success: navigate to the newly created NoteDetail screen

**Repository pattern:**
```kotlin
// NetworkBoundResource pattern — emit cached first, then fresh
fun getNotes(): Flow<Result<List<Note>>> = flow {
    val cached = noteDao.getAll()
    if (cached.isNotEmpty()) emit(Result.Success(cached.map { it.toDomain() }))
    try {
        val fresh = api.getNotes()
        noteDao.upsertAll(fresh.map { it.toEntity() })
        emit(Result.Success(noteDao.getAll().map { it.toDomain() }))
    } catch (e: IOException) {
        if (cached.isEmpty()) emit(Result.Error("Unable to load notes"))
        // else: cached data already emitted, offline banner handles UI
    }
}
```

**Commit:** `feat: MOB-2 build mobile notes and import screens`

---

### MOB-3: Flashcard Screens

**Ticket:** `feat: build mobile flashcard study screen`

**Flashcard Sets List:**
- Same pattern as Notes List: `PurpleTopAppBar`, pull-to-refresh, skeleton, empty state, offline banner
- Set cards: title, card count badge, "AI Generated" badge if `isAIGenerated`, last studied timestamp
- Swipe-to-delete
- FAB → Create set dialog (title input, optional note link via dropdown)
- "Generate from content" option: bottom sheet with text input, calls `POST /api/flashcard-sets/generate`

**Study Mode Screen:**
This is the most UI-intensive screen on the app. Must feel native and polished.

- Full-screen immersive layout (hide system bars while studying)
- Card flip animation: `AnimatedContent` with `rotationY` animation:
  ```kotlin
  var flipped by remember { mutableStateOf(false) }
  val rotation by animateFloatAsState(
      targetValue = if (flipped) 180f else 0f,
      animationSpec = tween(400)
  )
  ```
  Front: question text. Back: answer text in `BrandPurple` italic. Card background white, `ContinuumCard` shadow.
- Tap card to flip
- Swipe left = "Again" (incorrect) — subtle red flash on card edge
- Swipe right = "Got it" (correct) — subtle green flash on card edge
- `HorizontalPager` or custom swipe gesture handling via `detectHorizontalDragGestures`
- Progress bar at top: `BrandPurple` fill showing X/Total cards
- Bottom action row: "Again" button (white bg, `Border` border, `TextSecondary` text) and "Got it" button (`BrandPurple` bg, white text) — `border-radius: 8.dp`
- On "Again"/"Got it": call `PUT /api/flashcard-sets/:setId/cards/:cardId/progress`
- Session summary screen when all cards complete: correct count, incorrect count, "Study again" and "Back to sets" buttons

**Flashcard Set Detail Screen:**
- List all cards in the set with front text visible
- Tap card → inline expand to show back
- Add card FAB → bottom sheet with front/back text fields
- Edit card: swipe right on card → edit bottom sheet
- Delete card: swipe left

**Haptic feedback:** Add `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.LongPress)` on card flip, `HapticFeedbackType.TextHandleMove` on swipe actions.

**Commit:** `feat: MOB-3 build mobile flashcard study screens`

---

### MOB-4: Tasks + Calendar Screens

**Ticket:** `feat: build mobile task and calendar screens`

**Task Board Screen (Kanban):**
- Three-column horizontal scroll: TO DO, IN PROGRESS, DONE
- Each column is a `LazyColumn` of task cards
- Column headers: TO DO in `BrandPurple` on `PurpleTint`, IN PROGRESS in `WarningAmber` on `WarningAmberBg`, DONE in `SuccessGreen` on `SuccessGreenBg`
- Task cards: `ContinuumCard`, title, due date (red if overdue), priority badge
- Drag-and-drop between columns: use `reorderable` composable or implement via `detectDragGestures` — on drop, call `PATCH /api/tasks/:id/status`
- FAB → Task creation bottom sheet
- Long-press on task card → context menu (Edit, Delete, Share, View details)
- "Shared with me" toggle at top to switch between own tasks and shared tasks

**Task Creation Bottom Sheet:**
- Title input
- Due date + time picker (`DatePickerDialog` + `TimePickerDialog`)
- Priority: Low / Medium / High segmented button in `BrandPurple`
- Type: Homework / Study / Project / Exam Prep chips
- Link to note: searchable dropdown of user's notes
- Duration input (minutes)
- Reminder toggle
- Is Shared toggle → shows friend picker when enabled
- "Create task" button

**Calendar View Screen:**
- `CalendarMonth` custom Composable (there's no official Compose calendar — build a simple grid)
- Month navigation: left/right arrows, month+year title in Fraunces
- Date cells: highlight dates with tasks using `BrandPurple` dot indicator
- Tap date → bottom sheet showing tasks for that day
- Week view toggle: horizontal `LazyRow` of 7 days with task list below
- Overdue tasks: `ErrorRed` indicator

**Commit:** `feat: MOB-4 build mobile task and calendar screens`

---

### MOB-5: Social Screens

**Ticket:** `feat: build mobile social screens`

**Activity Feed Screen (Social home):**
- `LazyColumn` of activity items with cursor pagination (load more on scroll to bottom)
- Activity item types: note shared, flashcard shared, task created, friend accepted — each with distinct icon in `BrandPurple`
- Avatar (`AvatarInitials` or `AsyncImage` from Coil), action text, timestamp
- Tap shared note → SharedNoteView
- Pull-to-refresh
- `SkeletonLoader`, `EmptyState`

**Friends List Screen:**
- Tabs: Friends | Pending (incoming) | Sent (outgoing)
- Friend cards: avatar, name, username, mutual friends count
- Swipe-to-remove friend → confirmation dialog
- Accept/Decline buttons on pending requests
- FAB → User Search Screen

**User Search Screen:**
- `SearchBar` composable at top, autofocus on enter
- Debounced calls to `GET /api/users/search?q=`
- User cards with "Add Friend" / "Pending" / "Friends" state button

**Shared Note View Screen:**
- Read-only note content rendered with `RichTextState.setHtml()`
- Comments section below note: `LazyColumn` of comment cards
- Comment input at bottom (stays above keyboard with `imePadding`)
- Like button on each comment
- Add comment → text field + send button
- Reply threading: indented replies under parent comments
- `FLAG_SECURE` on this screen

**Commit:** `feat: MOB-5 build mobile social screens`

---

### MOB-6: Career Screens

**Ticket:** `feat: build mobile career screens`

**Applications List Screen:**
- Status filter tabs: All | Saved | Applied | Interview | Offer | Rejected — horizontal `ScrollableTabRow` in `BrandPurple`
- Application cards: `ContinuumCard`, company name, position, `StatusBadge`, applied date
- `SkeletonLoader`, `EmptyState`, pull-to-refresh
- FAB → Application creation bottom sheet
- Swipe-to-delete with confirmation

**Application Detail Screen:**
- Company, position, status (editable via dropdown → `PATCH /api/applications/:id`)
- Applied date
- Contacts section: list with name, role, LinkedIn chip
- Notes text area (auto-save)
- Follow-up reminders section
- Job URL → opens in Chrome Custom Tab
- Resume used: shows which resume was attached, tap to view

**Resume List Screen:**
- Resume cards: file name, version, target role, upload date, AI score badge (overall score `84/100` in `BrandPurple`)
- Upload FAB → file picker using `ActivityResultContracts.GetContent()` for `application/pdf`
  - On file selected: upload to `POST /api/resumes/upload` using multipart form data
  - Progress indicator during upload
- Swipe-to-delete

**Resume Detail Screen (PDF Viewer):**
- Use Android's `PdfRenderer` API to render the PDF from Cloudinary URL:
  1. Download PDF to a temp file using OkHttp
  2. Open with `ParcelFileDescriptor`
  3. Render pages with `PdfRenderer.Page.render()` to `Bitmap`
  4. Display pages in `LazyColumn` as `Image` composables
- `FLAG_SECURE` on this screen
- "Get AI Feedback" button → calls `POST /api/resumes/:id/feedback`, shows loading spinner

**Resume Feedback Screen:**
- Overall score: large `BrandPurple` number in Fraunces Black
- Score breakdown bars: all `BrandPurple` fill (NOT multi-color) — Experience, Education, Skills, Keywords, Formatting
- Strengths: green check icons + text
- Improvements: amber warning icons + text
- Keyword gap section
- Generated timestamp and model used

**Commit:** `feat: MOB-6 build mobile career screens`

---

### MOB-7: Messaging + Offline Sync

**Ticket:** `feat: add stretch mobile features`

**Conversations Screen:**
- `LazyColumn` of conversation cards
- Last message preview, unread count badge (`BrandPurple` circle with white number), timestamp
- Pull-to-refresh
- `EmptyState`: "No conversations yet. Message a friend from their profile."
- Real-time: `SocketManager.newMessageFlow.collect {}` → add new message to conversation list, update last message preview

**Conversation Detail Screen:**
- `LazyColumn` reversed (newest at bottom) — `reverseLayout = true`
- Sent bubbles: `BrandPurple` bg, white text, right-aligned
- Received bubbles: `PageBackground` bg, `TextPrimary` text, left-aligned
- Bubble corner radius: 18dp, 4dp on the sender-side bottom corner
- Online indicator: `SuccessGreen` dot next to recipient name in app bar
- Message input: `ContinuumTextField` + send button (`BrandPurple` icon)
- On send: optimistically add to list, call `POST /api/conversations/:id/messages`
- Real-time: new messages arrive via `SocketManager.newMessageFlow` — filter by `conversationId` and add to list

**Offline Sync Implementation:**

The `SyncQueue` model already exists in MongoDB. The Android implementation:

**Local SyncQueueEntity (Room):**
```kotlin
@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val operation: String,          // "create" | "update" | "delete"
    val collectionType: String,     // "notes" | "tasks" | "flashcards" | "messages"
    val documentId: String?,
    val data: String,               // JSON string of the payload
    val status: String = "pending", // "pending" | "processing" | "completed" | "failed"
    val clientTimestamp: Long = System.currentTimeMillis()
)
```

**SyncWorker (WorkManager):**
```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncRepository: SyncRepository
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            syncRepository.processPendingOperations()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

**Trigger sync:**
- When `NetworkMonitor.isOnline` transitions from `false` to `true`: enqueue `SyncWorker` as a one-time work request
- `SyncWorker` reads all `pending` items from local `SyncQueueEntity`, batches them, calls `POST /api/sync` with the operations array, marks each item as `completed` or `failed`

**Offline mutation pattern (in repositories):**
```kotlin
// Instead of directly calling API:
suspend fun createNoteOfflineFirst(note: NoteCreationDto): Note {
    val localNote = note.toEntity().copy(id = UUID.randomUUID().toString())
    noteDao.insert(localNote)  // save locally immediately
    if (networkMonitor.isOnline.value) {
        try {
            val remote = api.createNote(note)
            noteDao.update(remote.toEntity())
            return remote.toDomain()
        } catch (e: IOException) {
            // Queue for later
        }
    }
    syncQueueDao.insert(SyncQueueEntity(
        operation = "create",
        collectionType = "notes",
        data = moshi.adapter(NoteCreationDto::class.java).toJson(note)
    ))
    return localNote.toDomain()
}
```

**Connectivity banner:** `OfflineBanner` shown on every screen when `NetworkMonitor.isOnline = false`. Shows "You are offline. Changes will sync when connected."

**Commit:** `feat: MOB-7 add mobile messaging and offline sync`

---

## PHASE 9 — POL Tickets

### POL-10: Verify functionality on Android emulator

Before marking implementation complete, verify these on the emulator (API 35):
- [ ] Full auth flow: register, login, Google Sign-In, logout
- [ ] Deep link: `continuum://auth/verify-email?token=test` opens VerifyEmailScreen
- [ ] Deep link: `continuum://auth/reset-password?token=test` opens ResetPasswordScreen
- [ ] Notes: create, edit (rich text formatting), save, delete, Google Drive import
- [ ] Flashcards: create set, study mode (flip + swipe), progress saves
- [ ] Tasks: kanban drag-and-drop, calendar view, create task
- [ ] Career: create application, upload resume, view PDF, generate AI feedback
- [ ] Social: send friend request, accept, view shared note, comment
- [ ] Messaging: send message, receive message in real-time
- [ ] Offline: turn off emulator network → create a note → confirm it's in local DB → turn network back on → confirm sync fires
- [ ] OfflineBanner appears and disappears with network changes
- [ ] Back gesture works correctly on all screens (no crash, correct destination)
- [ ] Edge-to-edge: content not hidden behind status bar or nav bar

**Commit:** `test: POL-10 verify functionality on Android emulator`

### POL-13: Backup demo video spec

**Create `docs/future-ideas/demo-video-script.md`** with a scene-by-scene demo script:
- Scene 1: Launch app → auth screen → Google Sign-In (shows one-tap experience)
- Scene 2: Notes list → create note → rich text formatting → AI summary
- Scene 3: Generate flashcards → study mode → flip + swipe
- Scene 4: Tasks kanban → drag task from To Do to In Progress → calendar view
- Scene 5: Career → application tracker → resume PDF → AI feedback scores
- Scene 6: Social → activity feed → shared note → comment
- Scene 7: Messaging → real-time message
- Scene 8: Turn off network → create note → turn on network → sync fires (show the sync happening)

Record the actual video using Android Studio's screen recording (Run > Screen Record) or ADB: `adb shell screenrecord /sdcard/demo.mp4`

**Commit:** `docs: POL-13 add demo video script`

### POL-18: Android README

**Create `android/README.md`** covering:

```markdown
# Continuum Android

Native Android app for Continuum — built with Kotlin and Jetpack Compose.

## Overview
[What the app is — same product description as root README but mobile-focused]

## Tech Stack
[Table: Kotlin, Jetpack Compose, Hilt, Room, Retrofit, OkHttp, Socket.io, Coil, WorkManager, richeditor-compose]

## Architecture
[MVVM + Clean Architecture diagram — feature → presentation/domain/data layers]

## Prerequisites
- Android Studio Ladybug (2024.2.1) or newer
- JDK 17
- Android SDK API 35
- Emulator or physical device running Android 8.0+ (API 26+)

## Setup
1. Clone the monorepo: `git clone https://github.com/JustinBurrell/continuum`
2. Open `android/` in Android Studio (File → Open → select the android/ directory)
3. Copy `android/local.properties.example` to `android/local.properties`
4. Add `BASE_URL=https://continuum-backend-yrrr.onrender.com/api/`
5. Add `WEB_CLIENT_ID=<your Google Web OAuth client ID>`
6. Download font files (see Fonts section below)
7. Sync Gradle: File → Sync Project with Gradle Files
8. Run on emulator: Run > Run 'app'

## Fonts
This project uses self-hosted fonts. You must download the TTF files manually:
[Exact same instructions as Phase 2 of this spec]

## Google Sign-In Setup
[Exact checklist from Phase 1.3 of this spec]

## Building an APK
### Debug APK
./gradlew assembleDebug
Output: app/build/outputs/apk/debug/app-debug.apk

### Release APK
[Signing instructions from the technical reference]

## Project Structure
[Abbreviated tree of the android/ directory]

## Backend
The Android app connects to the same Express backend as the web app.
Backend docs: https://continuum-backend-yrrr.onrender.com/api-docs

## Features
[Same feature list as web — Notes, Flashcards, Tasks, Calendar, Social, Career, Messaging, Offline Sync]

## Offline Support
[Explanation of SyncQueue pattern, WorkManager, what works offline]

## Security
[EncryptedSharedPreferences, Network Security Config, FLAG_SECURE, no backup]
```

**Commit:** `docs: POL-18 add Android README`

---

## PHASE 10 — Documentation Updates

All documentation updates happen after POL-10 verification passes and before the PR is created. Every doc in this phase gets its own commit.

### 9.1 — Create `docs/android/` folder

Create a new `docs/android/` directory. This is the home for all Android-specific documentation. Create the following files:

---

**`docs/android/react-to-android.md`**

This document explains how the React web app was ported to a native Android app. It is a technical narrative useful for interviews, the TEI pitch, and future contributors.

Contents to cover:
- Why native Kotlin + Jetpack Compose was chosen over React Native (hardware-backed security APIs, no bridge overhead, Google Play partnership signal, Compose's declarative model maps closely to React)
- The mental model mapping between React and Compose: useState → remember/mutableStateOf, useEffect → LaunchedEffect, React Query → ViewModel + StateFlow + Room, Axios interceptor → OkHttp Authenticator, React Router → Jetpack Navigation, Tailwind → MaterialTheme + Color.kt tokens
- How the same REST API backend serves both clients with zero changes except the two new mobile auth endpoints
- How httpOnly cookies (web) became EncryptedSharedPreferences (Android) and why this is equivalent security-wise
- How the Google OAuth redirect flow (web) became Credential Manager API (Android) and why WebView OAuth is banned by Google Play
- How Socket.io works identically on Android using the java socket.io-client library, with the singleton pattern surviving screen rotation
- How offline support was added using Room as a local cache and WorkManager + SyncQueue for mutation queuing
- The design system translation: Tailwind color classes to Compose Color tokens, web font-family to Android FontFamily with TTF files, Tailwind breakpoints to Compose WindowSizeClass

---

**`docs/android/api-coverage.md`**

A complete mapping of every backend endpoint to its Android implementation status. Format:

```markdown
# Android API Coverage

Last updated: [date of this branch]
Backend API docs: https://continuum-backend-yrrr.onrender.com/api-docs

## Coverage Summary
| Feature group   | Endpoints | Android covered | Notes |
|----------------|-----------|-----------------|-------|
| Auth           | 12        | 12              | Includes 2 new mobile endpoints |
| Notes          | 9         | 9               |       |
| Flashcards     | 10        | 10              |       |
| Tasks          | 7         | 7               |       |
| Social         | 8         | 8               |       |
| Career         | 8         | 8               |       |
| Messaging      | 5         | 5               |       |
| Sync           | 1         | 1               |       |
| Google Drive   | 2         | 2               |       |
| **Total**      | **~70**   | **~70**         |       |

## Endpoint Detail

For each route group, list every endpoint with:
- Method + path
- Android screen or component that calls it
- ViewModel method name
- Whether it is cached in Room

Example format:
### Auth
| Endpoint | Screen | ViewModel method | Room cached |
|---------|--------|-----------------|-------------|
| POST /api/auth/mobile/login | LoginScreen | AuthViewModel.login() | No |
| POST /api/auth/google/mobile | LoginScreen | AuthViewModel.loginWithGoogle() | No |
| GET /api/auth/me | App startup | AuthViewModel.hydrateUser() | Yes (UserDao) |
...
```

Fill in this table completely for all 16 route groups by reading the Swagger docs at the API docs URL above and matching each endpoint to the Android implementation.

---

**`docs/android/architecture.md`**

A reference document for the Android MVVM + Clean Architecture pattern used in this project.

Contents:
- Layer diagram: Presentation (Composables, ViewModels) → Domain (UseCases, Repository interfaces) → Data (Repository implementations, Room DAOs, Retrofit APIs)
- Data flow for a typical read operation: Composable collects StateFlow → ViewModel → Repository → NetworkBoundResource (emit Room cache, fetch API, update Room, re-emit) → ViewModel maps to UiState → Composable renders
- Data flow for a typical write operation: Composable calls ViewModel method → ViewModel calls Repository → if online: API call + Room update; if offline: Room update + SyncQueue entry → ViewModel updates UiState optimistically
- Hilt DI graph: how NetworkModule, DatabaseModule, SocketModule, RepositoryModule are wired together
- StateFlow vs SharedFlow: when each is used (StateFlow for UI state, SharedFlow for one-time events like navigation)
- Why OkHttp Authenticator is used instead of an interceptor for 401 handling

---

**Commit:** `docs: add android docs folder with react-to-android, api-coverage, and architecture docs`

---

### 9.2 — Update Interview Brief

**Update `continuum-interview-brief.md`:**

**In "The Numbers" table:**
- Mobile row: update from "in progress" to reflect actual counts (screens built, ViewModels, etc.)
- Add new backend test count (add the mobile auth tests count)

**In "Tech Stack" table:**
- Mobile row: `Kotlin, Jetpack Compose, Hilt, Room, Retrofit + OkHttp, Socket.io, Coil, richeditor-compose, WorkManager`

**Add a new section: "Android Architecture and Design Decisions"**

This section must cover these talking points at interview depth:

1. **MVVM + Clean Architecture** — why the domain layer has zero Android dependencies (pure Kotlin, testable without an emulator), how feature packages map to the web app's page structure

2. **EncryptedSharedPreferences vs localStorage** — web uses localStorage for JWT (acceptable because httpOnly cookie protects the refresh token). Android uses EncryptedSharedPreferences backed by Android KeyStore hardware security module. On supported devices, the AES-256-GCM master key never leaves the secure enclave — it cannot be extracted even with root access. This is stronger than web's localStorage.

3. **Google Credential Manager vs redirect flow** — why WebView OAuth is banned by Google Play (phishing risk — user can't verify they're on Google's real page). Credential Manager uses Google Play Services as a trusted intermediary, same as the system Google account selector. Zero phishing surface.

4. **OkHttp Authenticator vs Axios interceptor** — both solve the same problem (401 recovery with token refresh) but Android's Authenticator fires synchronously at the OkHttp network layer, which means all concurrent requests automatically queue behind the refresh without any application-level deduplication code needed. The Axios solution required explicit `refreshPromise` deduplication logic. OkHttp's design makes this free.

5. **Application-scoped Socket.io singleton** — Android's Activity lifecycle destroys and recreates Activities on screen rotation. Binding the socket to the Application (not an Activity) means it survives rotation. Combined with Hilt's `@InstallIn(SingletonComponent::class)`, the socket lives for the app process lifetime.

6. **WorkManager + SyncQueue offline sync** — WorkManager is Android's job scheduler with guaranteed execution — it retries on failure and survives process death. The SyncQueue model already existed in MongoDB for this purpose. On reconnect, WorkManager reads pending local Room entries, batches them, and calls POST /api/sync. The user's changes are never lost.

7. **NetworkBoundResource pattern** — emits cached Room data immediately (so the UI is never blank), then fetches from the API, updates Room, and re-emits. The UI always has something to show. This is the mobile equivalent of React Query's staleWhileRevalidate.

8. **Design system parity** — same color tokens (#6B21A8 BrandPurple, #F8F9FA PageBackground, etc.), same fonts (Fraunces for headlines, Plus Jakarta Sans for body), same border-radius rules (8dp buttons, 12dp cards) as the web app. A user switching between platforms sees the same visual language.

**In "Talking Points" section, add:**

```
### Android-Specific Security Interview
Walk through the layered security model:
- EncryptedSharedPreferences with hardware-backed KeyStore (AES-256-GCM, master key in secure enclave on supported devices)
- Google Credential Manager for OAuth (no WebView, no phishing surface, verified by Play Services)
- Network Security Config preventing cleartext traffic at the OS level
- FLAG_SECURE on sensitive screens (notes, resumes, career data) — prevents screenshots and removes screen from recents thumbnail
- android:allowBackup="false" preventing ADB backup extraction of EncryptedSharedPreferences data
- X-Client-Type: android header on every request enabling server-side mobile client identification

### Why Native Android Over React Native
1. Hardware security: EncryptedSharedPreferences with KeyStore is not accessible from React Native's JS bridge. Native gives direct access.
2. Google Credential Manager API is a native-only Android API. React Native requires a third-party wrapper that may not be current.
3. FLAG_SECURE is a native Android window flag. No React Native equivalent.
4. Performance: no JS bridge overhead for gesture-heavy screens like the flashcard study mode (swipe + flip animation).
5. TEI signal: Google Play is a co-sponsor of this incubator. Shipping a native Kotlin app is a direct signal that you took the partnership seriously.
```

**Commit:** `docs: update interview brief with Android architecture and design system sections`

---

### 9.3 — Update Swagger / OpenAPI Documentation

The three new backend endpoints added in Phase 1 must have full Swagger JSDoc annotations matching the existing pattern in the codebase. This was specified in Phase 1 but confirm here that it was done.

After Phase 1 is complete, verify the following appear correctly in the live Swagger UI at `https://continuum-backend-yrrr.onrender.com/api-docs` (after the branch is deployed or tested locally):

- `POST /api/auth/mobile/login` — tag: Auth, summary, request body schema, response 200 with token + refreshToken + user, response 401, response 429
- `POST /api/auth/mobile/refresh` — tag: Auth, summary, request body schema, response 200 with new token + new refreshToken, response 401
- `POST /api/auth/google/mobile` — tag: Auth, summary, request body schema (idToken), response 200, response 401

If any annotation is missing or incomplete, fix it before the PR is created.

**No separate commit needed** — Swagger annotations are part of the Phase 1 backend implementation commits. This is a verification step only.

---

### 9.4 — Update backend docs

**Update `docs/backend/api_reference_guide.md`** (or equivalent backend API reference in the docs/ folder — check what exists during Phase 0 audit):

Add entries for the three new mobile endpoints with:
- Full URL
- Method
- Auth requirement
- Request body
- Response shape
- Rate limiting applied
- Mobile-only note (explain these endpoints are for Android and differ from web equivalents)

---

### 9.5 — Update database docs

**Update `docs/database/mongodb_schema_explanation.md`** (or equivalent — check during Phase 0 audit):

Add a note to the SyncQueue schema section explaining that this collection is now actively used by the Android app. Update the schema explanation to reflect:
- The Android `SyncQueueEntity` Room model mirrors this collection field-for-field
- The `collectionType` enum values (notes, tasks, flashcards, messages) map to the Android feature packages
- The `POST /api/sync` endpoint processes batches sent from WorkManager on network reconnection
- The `clientTimestamp` field is set to `System.currentTimeMillis()` on Android

---

### 9.6 — Update root README

**Update `README.md` at the monorepo root:**
- Add `android/` to the directory structure table with description "Native Android app (Kotlin + Jetpack Compose)"
- Add Kotlin, Jetpack Compose, Hilt, Room to the tech stack overview
- Add "Android app" to the Features section with a one-line description
- Add to the quickstart section: "To run the Android app: open `android/` in Android Studio, see `android/README.md` for setup"
- Update the "What Makes This Stand Out" section to mention native Android with full feature parity

**Commit:** `docs: update root README and backend/database docs with Android additions`

---

### 9.7 — Create `docs/future-ideas/` files

Two files need to be created (the FCM spec was defined in Phase 1.5 and gets committed there). Confirm both exist after Phase 1 and Phase 8:

1. `docs/future-ideas/fcm-push-notifications.md` — created in Phase 1.5 commit
2. `docs/future-ideas/demo-video-script.md` — created in POL-13 commit

If the `docs/future-ideas/` directory does not exist, create it. Check during Phase 0 audit.

---

## PHASE 11 — Pull Request

After all commits are complete and POL-10 verification passes:

```bash
git push origin feat/android-app
gh pr create \
  --title "feat: Continuum Android app, full feature parity with web" \
  --body "$(cat .github/pr-template.md)" \
  --base main
```

**PR body must include:**
- Summary of what was built (all MOB tickets + POL tickets)
- Backend additions (mobile auth endpoints, CORS update)
- Architecture decisions (MVVM, Hilt, Room, offline sync)
- Security measures implemented
- Test plan: emulator verification checklist from POL-10
- Screenshots (attach at least 5: login, notes list, study mode, kanban, career)
- Issue references — fetch open issues from the GitHub project and close the relevant ones:

```bash
gh issue list --repo JustinBurrell/continuum --state open --json number,title
```

Include `Closes #<number>` for each issue that corresponds to:
- MOB-1, MOB-2, MOB-3, MOB-4, MOB-5, MOB-6, MOB-7
- POL-10, POL-13, POL-18

**Commit before PR:** `docs: update interview brief and root README with Android app details`

---

## WHAT THE PLAN MUST INCLUDE

When you produce the plan from this spec, it must contain:

1. **Branch creation** — first action
2. **Phase 0 audit** — read existing files, report findings
3. **Phase 1 backend additions** — before any Android code
4. **Phase 2 Android Studio project init** — developer pause, creates `android/` directory
5. **Phase 3 font setup** — developer pause for manual TTF download, fonts go into directory created in Phase 2
6. **Phase 4 project structure and Gradle** — exact dependencies, reorganize generated project
7. **Phase 5 design system** — all color tokens, typography, shared components built first
8. **Phase 6 architecture** — TokenManager, ApiClient, NetworkMonitor, Room, Socket, NavGraph
9. **Phase 7 security** — Network Security Config, FLAG_SECURE, edge-to-edge, before feature screens
10. **Phase 8 features** — MOB-1 through MOB-7 in order, each with full screen-by-screen detail
11. **Phase 9 POL tickets** — verification, demo video script, README
12. **Phase 10 docs updates** — `docs/android/` folder, interview brief, Swagger, backend/database docs, root README
13. **Phase 11 PR** — with issue list fetch and close

**One commit per phase/ticket. Commit messages follow the Conventional Commits format described in Step 0.3. No scoped commits like feat(android):, no em dashes, no periods at the end.**

**Ask before touching anything in `backend/` beyond the four additions in Phase 1. Ask before touching anything in `web/`. Ask if any file or directory is ambiguous.**

---

## DESIGN SYSTEM REFERENCE — DO NOT DEVIATE

| Token | Value | Usage |
|-------|-------|-------|
| BrandPurple | `#6B21A8` | CTAs, active states, icons, progress bars |
| DeepPurple | `#3B0764` | Dark backgrounds |
| PurpleTint | `#F3F0FF` | Icon containers, info backgrounds |
| PageBackground | `#F8F9FA` | Screen backgrounds |
| White | `#FFFFFF` | Cards, surfaces |
| Border | `#E5E7EB` | Card borders, dividers |
| TextPrimary | `#111827` | Headlines |
| TextSecondary | `#6B7280` | Body text |
| TextMuted | `#9CA3AF` | Placeholders |
| SuccessGreen | `#059669` | Completed states |
| WarningAmber | `#D97706` | In progress |
| ErrorRed | `#DC2626` | Overdue, errors |

**Buttons: `border-radius: 8.dp` — NOT pill shape.**
**Headlines: Fraunces. Everything else: Plus Jakarta Sans.**
**No dark mode. Light only.**
**Progress bars: single `BrandPurple` fill — NOT multi-color.**
