# Android Security Audit (Primary) — Web & Backend Follow-Up

**Date:** April 14, 2026  
**Auditor:** Codebase review — Android application module, with cross-check against web client and Node backend patterns documented in-repo.  
**Scope:** Security posture of the **native Android app**; **follow-up sections** summarize how backend and web interact with the same threats and where authoritative detail lives in sibling audit documents.

**Android files reviewed (representative, not exhaustive):**

`android/app/src/main/AndroidManifest.xml`  
`android/app/src/main/res/xml/network_security_config.xml`  
`android/app/src/main/res/xml/backup_rules.xml`  
`android/app/src/main/res/xml/data_extraction_rules.xml`  
`android/app/build.gradle.kts`  
`android/app/proguard-rules.pro`  
`android/app/src/main/java/com/continuum/android/MainActivity.kt`  
`android/app/src/main/java/com/continuum/android/core/data/local/TokenManager.kt`  
`android/app/src/main/java/com/continuum/android/core/network/ApiClient.kt`  
`android/app/src/main/java/com/continuum/android/core/network/SocketManager.kt`  
`android/app/src/main/java/com/continuum/android/core/network/NetworkMonitor.kt`  
`android/app/src/main/java/com/continuum/android/di/NetworkModule.kt`  
`android/app/src/main/java/com/continuum/android/di/DatabaseModule.kt`  
`android/app/src/main/java/com/continuum/android/core/data/local/AppDatabase.kt`  
`android/app/src/main/java/com/continuum/android/core/ui/navigation/AppNavHost.kt`  
`android/app/src/main/java/com/continuum/android/feature/auth/presentation/LegalDocumentScreen.kt`  
`android/app/src/main/java/com/continuum/android/feature/auth/data/repository/AuthRepository.kt`  
`android/README.md` (security summary table)

**Related documents (this audit does not duplicate them line-by-line):**

- `docs/security/backend_security_audit.md` — authoritative backend finding list and remediation roadmap.  
- `docs/security/frontend_security_audit.md` — web client historical findings; several items are **superseded by current web code** (see Section 8).

**Purpose:** Establish a **launch-ready threat model for the Android client**, align expectations with **API and auth contracts** shared with web, and record **residual risks** and **follow-up work** at the same level of rigor as the existing folder audits.

---

## Executive Summary

The Android app implements **strong practices** for a consumer productivity client: **AES-GCM–backed EncryptedSharedPreferences** for access and refresh tokens, **Network Security Config** disabling cleartext globally (with a narrow emulator exception), **application backup disabled**, **release minification**, **Google Sign-In via Credential Manager** (avoiding WebView-based OAuth phishing), **centralized Bearer injection**, **401-driven refresh with token rotation contract**, and **DEBUG-only full HTTP body logging**. Sensitive screens use **`FLAG_SECURE`** when the current navigation route matches a curated allowlist.

**Primary residual risks** are **data at rest** (unencrypted **Room** database holding notes, tasks, flashcards, user PII, and **offline sync queue payloads**), **deep link handling** via a **custom URI scheme** with **tokens in query strings**, **no TLS certificate pinning**, and **inconsistent screenshot/recording protection** (notably the **note editor** route is outside the `FLAG_SECURE` route set). Secondary risks include **JWT payload decoding without signature verification** for client-side `userId` (acceptable only if the server remains the sole authority for authorization).

Backend and web **follow-up** sections confirm: the **mobile refresh-token-in-body** model is consistent with tested backend routes; the **web** client improves on older audits by using **httpOnly cookies for refresh** and **OAuth code exchange**, while still storing the **access JWT in `localStorage`**, which keeps **XSS** in the browser as the dominant web threat distinct from Android.

| Severity | Count (Android-focused) |
|----------|-------------------------|
| High | 2 |
| Medium | 5 |
| Low / Info | 6 |

---

## Section 1 — Authentication & Session Management

### A-H1 — Token Storage (EncryptedSharedPreferences) — Mitigated / Good

**Files:** `android/.../core/data/local/TokenManager.kt`, `android/app/build.gradle.kts` (`androidx.security.crypto`)

Access and refresh tokens are stored with **MasterKey** (`AES256_GCM`) and **EncryptedSharedPreferences** using **AES256_SIV** for keys and **AES256_GCM** for values. This is the **correct** pattern for native clients that cannot use browser **httpOnly** cookies for refresh.

**Implementation notes:**

- Preference file name: `continuum_secure_prefs`.  
- `clearTokens()` removes both keys and emits `LogoutReason` for UI navigation.  
- `isLoggedIn` is derived from presence of access token.

**Residual note:** EncryptedSharedPreferences has had **rare device-specific issues** (corruption races) in the Android ecosystem; monitor crash reports. No elevated severity assigned.

---

### A-H2 — Refresh Flow and 401 Handling — Good

**Files:** `android/.../core/network/ApiClient.kt` (`AuthInterceptor`, `TokenAuthenticator`)

**AuthInterceptor:**

- Adds `Authorization: Bearer <access>` when a token exists.  
- Adds `X-Client-Type: android` and a descriptive `User-Agent` (app version, manufacturer, model, Android release).

**TokenAuthenticator:**

- On **401**, if the request is not already marked `X-Retry-After-Refresh`, reads **refresh token** from `TokenManager`.  
- Uses a **dedicated short-lived `OkHttpClient`** (no authenticator recursion) to `POST` JSON `{ "refreshToken": ... }` to `{BuildConfig.BASE_URL}auth/mobile/refresh`.  
- On success: parses `token` and `refreshToken` from JSON body, `saveTokens`, retries original request with new Bearer and `X-Retry-After-Refresh: true`.  
- On failure or exception: `clearTokens(LogoutReason.REMOTE_INVALIDATION)` so the UI can show remote logout messaging.

**Concurrency:** Refresh is guarded with `synchronized(this)` on the authenticator instance. Under **parallel 401s**, behavior depends on backend **refresh rotation** semantics; worst case is an extra logout or failed retry — acceptable if server tests cover rotation (`backend/tests/jest/auth-mobile.test.js`).

---

### A-M1 — JWT `userId` Decoded Client-Side Without Signature Verification — Medium (by convention)

**File:** `TokenManager.getJwtUserId()`

The implementation **documents** that the JWT payload is decoded **without** verifying the signature. This is **safe** only if:

- All **authorization** decisions occur on the server, and  
- Client-side `userId` is used only for **UI keys, cache keys, or optimistic labeling**.

**Risk if misused:** Future features might accidentally trust client-derived `userId` for security-sensitive branching.

**Fix (process):** Code review rule — never use `getJwtUserId()` for anything that implies server trust without re-validation. Optional hardening: verify signature locally only if you introduce an offline-first security feature (usually unnecessary).

---

### A-M2 — Google OAuth / Credential Manager — Good

**Files:** `android/README.md`, Google / Credential Manager dependencies in `android/app/build.gradle.kts`

Google Sign-In uses **Credential Manager** and server exchange (`POST .../auth/google/mobile`), not a WebView, reducing phishing and overlay risk compared to embedded OAuth.

**Follow-up:** Ensure **server-side** verification of Google ID tokens remains mandatory (see `docs/security/backend_security_audit.md` — **C4** resolution narrative: never trust client-supplied `googleId` without verification).

---

### A-L1 — Mobile Logout and Refresh Revocation — Good

**File:** `android/.../feature/auth/data/repository/AuthRepository.kt`

Logout path attempts server revocation with refresh token in body (`mobileLogout`), then clears local tokens. Matches defense-in-depth expectation: server invalidates session where possible; client always clears.

---

## Section 2 — Network & Transport

### A-H3 — Cleartext and Trust Configuration — High (dev only) / Low (production default)

**File:** `android/app/src/main/res/xml/network_security_config.xml`

| Config | Behavior |
|--------|----------|
| `base-config` | `cleartextTrafficPermitted="false"` — blocks HTTP in release-like configs. |
| `domain-config` | Cleartext **only** to `10.0.2.2` (emulator → host machine). |
| `debug-overrides` | Trust **user-installed CAs** — enables Charles/mitmproxy on **debug** builds only. |

**Production implication:** Release builds trust **system CAs only** (no user CAs). **No certificate pinning** — any **compromised public CA** trusted by the device could intercept TLS (standard tradeoff).

**Recommendations:**

1. Never ship a **release** variant with user CA trust enabled.  
2. If threat model requires it, add **certificate pinning** for the production API host (operational cost: rotation, breakage on infra moves).

---

### A-M3 — `BASE_URL` Resolution — Medium (misconfiguration / supply chain)

**File:** `android/app/build.gradle.kts`

Resolution order:

1. `local.properties` → `BASE_URL`  
2. Else `backend/.env` → `PORT` → `http://10.0.2.2:$PORT/api/`  
3. Else `https://api.usecontinuum.dev/api/`

**Risk:** A compromised or mistaken developer `local.properties` could point the app at a hostile host during **local** builds. Not a Play Store artifact issue for typical CI, but document **trusted machine** expectations for contributors.

**Fix:** Document in `android/README.md`; CI should inject `BASE_URL` explicitly for release builds.

---

### A-L2 — OkHttp Logging — Low / Good

**File:** `ApiClient.kt`

`HttpLoggingInterceptor` at **`Level.BODY`** is registered **only when `BuildConfig.DEBUG`**.

**Verification:** Confirm release builds never set `DEBUG` true (standard Android Gradle contract).

---

### A-M4 — Socket.io — Medium (inherits REST trust model)

**File:** `android/.../core/network/SocketManager.kt`

- Server URL: `BuildConfig.BASE_URL` with `/api` suffix stripped — connects to same host as API root.  
- Handshake: `setAuth(mapOf("token" to accessJwt))` — aligns with web client pattern.

**Implication:** Socket traffic inherits **same TLS and pinning posture** as REST. If the access token is compromised, realtime channels are compromised until expiry or failed refresh.

**Recommendation:** On logout, ensure `disconnect()` is always called (wired via app lifecycle / auth state); verify no stale listeners after teardown.

---

### A-L3 — Client-Side Rate Limit UX — Low / Good

**File:** `ApiClient.kt` — `RateLimitInterceptor` maps **429** to a user-visible `IOException` message.

Aligns with backend global **`apiLimiter`** (`backend/middleware/rateLimiter.js`); Android should not retry blindly on 429 without backoff (current behavior surfaces error to caller).

---

## Section 3 — Local Data at Rest

### A-H4 — Unencrypted Room Database — High

**Files:** `android/.../di/DatabaseModule.kt`, `android/.../core/data/local/AppDatabase.kt`

- Database file: **`continuum.db`**.  
- **No SQLCipher** (or equivalent) — SQLite is **protected only by the app sandbox** and device full-disk encryption.  
- **`fallbackToDestructiveMigration()`** — on schema mismatch, **local data is wiped** (availability / recovery consideration).

**Entities with security relevance:**

| Entity | Sensitive fields |
|--------|-------------------|
| `NoteEntity` | `title`, `content`, tags JSON |
| `FlashcardEntity` | `front`, `back` |
| `TaskEntity` | `title`, `description`, status, dates |
| `UserEntity` | `firstName`, `lastName`, **`email`**, `avatar` |
| `SyncQueueEntity` | **`payload`** — JSON bodies for pending create/update/delete |

**Threat model:** Rooted device, forensic imaging, malware with access to app-private storage (elevated privilege), or **future** misconfiguration if `allowBackup` were re-enabled.

**Recommendations (prioritized):**

1. **Product decision:** Accept sandbox-only encryption for MVP vs. **SQLCipher** / **field-level encryption** for regulated or high-sensitivity users.  
2. **Minimize retention:** Shorten cache lifetime or omit bodies for certain resource types if offline UX allows.  
3. **Incident response:** Document that local wipe on migration can destroy unsynced queued mutations.

---

## Section 4 — Deep Links, WebView, and UI Exfiltration

### A-H5 — Custom-Scheme Deep Links with Tokens — High

**Files:** `AndroidManifest.xml`, `AppNavHost.kt`

**Manifest:** `MainActivity` exports `VIEW` intent-filters for:

- `continuum://auth/verify-email` (path prefix)  
- `continuum://auth/reset-password` (path prefix)  

Both use `android:autoVerify="true"`. **Digital Asset Links verification applies to HTTPS links**, not arbitrary custom schemes — this attribute does not meaningfully “verify” `continuum://` ownership.

**Navigation:** Compose `navDeepLink` patterns bind `token` query parameter into reset and verify screens.

**Risks:**

1. **Intent hijacking / confusion:** Another installed app could register the same scheme; user may see a disambiguation dialog — social engineering remains possible.  
2. **Token in URI:** Query parameters can appear in **logs, crash breadcrumbs, analytics**, or shoulder-surfing via recents.

**Recommendations:**

1. Prefer **HTTPS App Links** (`https://usecontinuum.dev/...`) with **Digital Asset Links** and a **short-lived, one-time server code** exchanged in-app over TLS — same pattern family as web OAuth **code exchange** (backend audit **C3**).  
2. Server-side: keep reset/verify tokens **high entropy** and **short TTL** (already expected; re-validate on backend audit cadence).

---

### A-M5 — Legal / Policy WebView — Medium / Mostly Good

**File:** `android/.../feature/auth/presentation/LegalDocumentScreen.kt`

- **`javaScriptEnabled = false`** — materially reduces XSS within that WebView.  
- URL: derived from `BuildConfig.BASE_URL` host with a path segment (`privacy`, `terms`) — keeps docs aligned with environment.

**Residual:** Default `WebViewClient()` — if you later enable links or JS, add **`shouldOverrideUrlLoading`**, mixed-content hardening, and a strict allowlist of hosts.

---

### A-M6 — `FLAG_SECURE` Coverage Gaps — Medium

**Files:** `MainActivity.kt`, `AppNavHost.kt`

`MainActivity` passes callbacks to `AppNavHost`: on sensitive route → `window.setFlags(FLAG_SECURE)`; else clear.

**`sensitiveRoutes` set** includes (route pattern constants): notes **detail**, flashcard **history**, career resume/application **detail**, shared note, **conversation detail**. Matching uses `currentRoute?.startsWith(pattern.substringBefore("{"))`.

**Concrete gap:** **`NavRoutes.Notes.EDITOR`** (`notes/editor/{noteId}`) is **not** in `sensitiveRoutes`. **Note detail** is protected; **note editor** may allow **screenshots and screen recording** while editing the same class of content.

**Recommendations:**

1. Add **`NavRoutes.Notes.EDITOR`** (and any route showing equivalent sensitivity) to `sensitiveRoutes`, **or** drive `FLAG_SECURE` from a **content classification** or ViewModel flag rather than only a static route list.  
2. Parity review: flashcard **study** / set detail, **task detail**, **profile**, **notes list** — decide product policy for each.

---

## Section 5 — Manifest, Backup, and Process Surface

### A-L4 — Exported Components — Low / Good

**File:** `AndroidManifest.xml`

Only **`MainActivity`** is `android:exported="true"` — appropriate for a single-activity Compose app. No exported content providers, services, or receivers identified in the main manifest reviewed.

---

### A-L5 — Backup and Transfer Rules — Low / Info

**Files:** `AndroidManifest.xml`, `backup_rules.xml`, `data_extraction_rules.xml`

Application attributes: **`allowBackup="false"`**, **`fullBackupContent="false"`** — strong default against ADB/cloud backup exfiltration of prefs and DB.

`backup_rules.xml` / `data_extraction_rules.xml` are largely **template** placeholders. If backup is ever re-enabled, **rewrite** them explicitly to **exclude** encrypted prefs and `continuum.db`.

---

### A-L6 — Permissions — Low / Info

**Declared:** `INTERNET`, `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS` (comment: future FCM).

**Follow-up:** When implementing FCM, avoid **PII or secrets** in notification **plaintext**; use generic text and load sensitive content in-app after unlock.

---

## Section 6 — Build & Release Hardening

### A-L7 — Release Minification — Good

**File:** `android/app/build.gradle.kts`

```kotlin
release {
    isMinifyEnabled = true
    isShrinkResources = true
    proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
    )
}
```

**Recommendation:** Revisit `proguard-rules.pro` when adding reflection-heavy libraries or Moshi/Retrofit model changes that need keep rules.

---

### A-L8 — BuildConfig and Secrets — Low / Info

**File:** `android/app/build.gradle.kts`

- `WEB_CLIENT_ID` from `local.properties` — OAuth **client IDs are public identifiers** by design; still never commit `local.properties`.  
- `BASE_URL` embedded as `BuildConfig` — not secret; confirms environment at build time.

---

## Section 7 — Follow-Up: Backend (Contract & Shared Threats)

**Authoritative detail:** `docs/security/backend_security_audit.md`

### B-1 — What Android Depends On

| Concern | Backend expectation relevant to Android |
|---------|-------------------------------------------|
| **Mobile auth** | Login/refresh return tokens in **JSON body**; refresh rotation and revocation semantics must stay consistent with `TokenAuthenticator`. |
| **Authorization** | Every sensitive operation **server-enforced**; Android must never be trusted for ownership. |
| **Rate limiting** | `apiLimiter` + `authLimiter` + per-route AI limits reduce abuse; Android surfaces 429 via interceptor. |
| **Input hygiene** | Global `mongo-sanitize`, body size limits, regex escaping (per backend audit resolutions) protect APIs used identically from web and Android. |

### B-2 — Entry Configuration (verified pattern)

**File:** `backend/app.js` (Express app; mounted by `backend/server.js`)

- `helmet({ contentSecurityPolicy: false })` — appropriate for **JSON API** (CSP is principally a browser concern).  
- `cookieParser`, JSON/urlencoded **200kb** limits.  
- Global **`/api`** `apiLimiter`.  
- CORS with **`credentials: true`** and explicit **methods** / **allowedHeaders** (includes `Authorization`, `X-Client-Type`).

### B-3 — Residual operational items (from backend audit Section 11)

Not Android code, but **affect mobile users** if neglected:

- Provider **spend alerts / caps** (Groq, etc.).  
- **`npm audit`** on every deploy.  
- **Key rotation** policy.  
- **Atlas network access** / IP allowlist where applicable.  
- **`NODE_ENV=production`**, **HTTPS** verification after deploy.

---

## Section 8 — Follow-Up: Web (Contrast to Android)

**Authoritative detail:** `docs/security/frontend_security_audit.md` (historical narrative). **Current code** should be verified in `web/src/lib/api.js`, `web/src/context/AuthContext.jsx`, `web/src/pages/auth/AuthCallback.jsx`.

### W-1 — Credential isolation differs from Android

| Mechanism | Web (current pattern) | Android |
|-----------|----------------------|---------|
| **Refresh** | **httpOnly cookie** + `withCredentials: true` on axios and refresh `POST` | **EncryptedSharedPreferences** |
| **Access JWT** | **`localStorage`** (any JS / XSS can read) | Stored encrypted; not exposed to DOM XSS |
| **Primary XSS vector** | **DOM / stored content in browser** | **Minimal WebView** surface (legal docs, JS off) |

### W-2 — Refresh and logout (supersedes older frontend audit claims)

**Files:** `web/src/lib/api.js`, `web/src/context/AuthContext.jsx`

- Axios instance uses **`withCredentials: true`**.  
- Refresh uses **standalone `axios.post('/api/auth/refresh', {}, { withCredentials: true })`** with **deduped `refreshPromise`** on concurrent 401s.  
- **Logout** calls **`queryClient.clear()`** — addresses historical “cache survives logout” concern from `frontend_security_audit.md`.

### W-3 — Google OAuth callback

**File:** `web/src/pages/auth/AuthCallback.jsx`

Uses **`code`** query param and **`POST /auth/google/exchange`** — aligned with backend remediation for **JWT in URL** (backend audit **C3**).

### W-4 — Content Security Policy (web)

**File:** `web/index.html`

Meta CSP includes **`script-src 'self' 'unsafe-inline'`** and a **broad** `connect-src` (includes `https:` / `wss:`). Meaningful baseline; **not** strict nonce-based CSP.

**Android implication:** None directly; product risk is **browser XSS → access token theft** while Android session theft leans toward **device / DB / deep link** vectors.

---

## Section 9 — Cross-Platform Matrix

| Threat | Android | Web | Backend primary control |
|--------|---------|-----|---------------------------|
| **Credential theft** | Root + prefs; phishing mitigated by Credential Manager | XSS → access token in `localStorage` | Short JWT TTL, refresh rotation, rate limits |
| **MITM** | System CA; debug user CA | Same + extensions | TLS; HSTS at edge |
| **Broken access** | Malicious client calls API | Same | Controller ownership checks |
| **Data at rest** | **Room plaintext** | React Query memory / cache | DB provider encryption |
| **Deep link token** | **Custom scheme + query** | HTTPS-first in browser | Short TTL, high entropy, HTTPS migration |

---

## Section 10 — Remediation Roadmap (Android-Centric)

| # | Finding | Layer | Effort | Must do before |
|---|---------|-------|--------|----------------|
| 1 | **Room / sync queue plaintext** (A-H4) | Android | M–L | High-sensitivity or regulated launch |
| 2 | **HTTPS App Links** replacing **custom scheme tokens** (A-H5) | Android + Backend | M | Broad marketing of email links to app |
| 3 | **`FLAG_SECURE`** includes **note editor** + parity pass (A-M6) | Android | S | Screenshot-sensitive user base |
| 4 | **TLS pinning** (optional) | Android | M | Enterprise / high-assurance customers |
| 5 | **Document `getJwtUserId()` trust boundary** (A-M1) | Process | S | Ongoing |
| 6 | **Tighten web CSP** (`unsafe-inline`, narrow `connect-src`) | Web | M | Large-scale public web |
| 7 | **Backend Section 11 ops items** | Ops | S–M | Production scale |

Effort key: **S** small (hours–1 day), **M** medium (days), **L** large (week+).

---

## Section 11 — Verification Checklist (Pre-Release)

- [ ] Release build: **`DEBUG` false**, no user CA trust in network config for release flavor.  
- [ ] **`BASE_URL`** for store build points to **production API**.  
- [ ] Manual: **401** → refresh → single successful retry; **invalid refresh** → logout / remote invalidation message.  
- [ ] Manual: deep link opens **only** official app when multiple apps claim scheme (understand resolver UX).  
- [ ] Policy: **Room encryption** decision documented for privacy policy / support.  
- [ ] Re-read **`docs/security/backend_security_audit.md`** Section 11 for any new open items since this document’s date.

---

## Section 12 — Ongoing Security Practices (Android)

1. **Dependency updates:** Android Gradle Plugin, `androidx.security:security-crypto`, OkHttp, Socket.IO client — track security bulletins.  
2. **Play App Signing / upload key hygiene:** Restrict who can sign release bundles.  
3. **Per-release diff review:** Manifest, network security config, new exported components, new permissions.  
4. **Align with backend:** When auth or sync contracts change, update **mobile tests** and **`auth-mobile.test.js`** expectations in lockstep.

---

## Document History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-14 | Initial Android-focused audit with web/backend follow-up. |
