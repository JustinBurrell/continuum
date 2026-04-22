# Continuum iOS — Full Parity Build Guide

**Source:** Android app at `/android`  
**Target:** iOS app at `/ios`  
**Backend:** `https://api.usecontinuum.dev` (Swagger at `/api-docs`)  
**Goal:** 1:1 feature parity with the Android build, installable on your iPhone via free Xcode signing (no $99 Apple Developer account required for personal device)

---

## Prerequisites

Before starting, confirm you have:

- Mac with Xcode 15+ installed
- iPhone connected via USB (for free signing / direct install)
- CocoaPods installed: `sudo gem install cocoapods`
- The Continuum repo cloned locally
- Font files available: `fraunces_bold.ttf`, `fraunces_black.ttf`, `plus_jakarta_sans_regular.ttf`, `plus_jakarta_sans_medium.ttf`, `plus_jakarta_sans_semibold.ttf`, `plus_jakarta_sans_bold.ttf` (extract from `/android/app/src/main/res/font/`)
- SVG assets: `ic_logo_symbol.xml`, `ic_logo_wordmark.xml`, `ic_linkedin.xml`, `ic_instagram.xml` (convert to PDF or PNG for iOS)

---

## Phase 0: Project Setup

### Step 0.1 — Create the Xcode project

1. Open Xcode → File → New → Project
2. Choose **App** under iOS
3. Set:
   - Product Name: `Continuum`
   - Bundle Identifier: `dev.usecontinuum.app`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Minimum Deployment: **iOS 17.0**
4. Save to `/ios/` in your repo root
5. Delete the default `ContentView.swift` — you will replace it

### Step 0.2 — Create the Podfile

Create `/ios/Podfile`:

```ruby
platform :ios, '17.0'
use_frameworks!

target 'Continuum' do
  # Replaces io.socket:socket.io-client (Android)
  pod 'Socket.IO-Client-Swift', '~> 16.1'
  
  # Replaces io.coil-kt.coil3 (Android image loading)
  pod 'SDWebImageSwiftUI'
  
  # Replaces Lottie Android — same library, Apple version
  pod 'lottie-ios', '~> 4.4'
  
  # Replaces com.mohamedrejeb.richeditor (rich text editing)
  pod 'RichTextKit', '~> 1.0'
end
```

Run `pod install` from `/ios/`, then open `Continuum.xcworkspace` (not `.xcodeproj`) for all subsequent work.

### Step 0.3 — Add fonts to Xcode

1. Drag all 6 `.ttf` font files into Xcode under `Continuum/Resources/Fonts/`
2. Check "Add to target: Continuum" for each
3. In `Info.plist`, add key `Fonts provided by application` (array) with all 6 font filenames:
   - `Fraunces-Bold.ttf`
   - `Fraunces-Black.ttf`
   - `PlusJakartaSans-Regular.ttf`
   - `PlusJakartaSans-Medium.ttf`
   - `PlusJakartaSans-SemiBold.ttf`
   - `PlusJakartaSans-Bold.ttf`

### Step 0.4 — Add logo assets

> **⚠️ STOP — Claude Code must ask the user for PNGs before proceeding.**
>
> For `ic_logo_symbol` and `ic_logo_wordmark`, Claude Code cannot convert Android `.xml` vector drawables to iOS-compatible assets automatically. It must pause and ask:
>
> *"I need two PNG assets before I can continue:*
> *1. `ic_logo_symbol.png` — the infinity/lemniscate logo mark (transparent background, any size 512px+)*
> *2. `ic_logo_wordmark.png` — the full "continuum" text wordmark (transparent background, any size 1024px+)*
>
> *You can export these from Figma, your web frontend's public folder, or by screenshotting the Android app with a white background and removing it. Please provide both files and I will add them to the Xcode asset catalog."*

Once the user provides the PNGs, add them to Xcode:

1. In Xcode → `Assets.xcassets`:
   - Add `ic_logo_symbol` — drag in the PNG, set "Preserve Vector Data" OFF, Single Scale
   - Add `ic_logo_wordmark` — same
   - Add `ic_linkedin` — convert from `ic_linkedin.xml` to PDF via Inkscape/Figma, or use a standard LinkedIn logo PNG
   - Add `ic_instagram` — same approach
2. For app icon: create a 1024×1024 PNG from `ic_launcher_foreground.xml` on a purple background (`#6B21A8`) and add to `AppIcon` in Assets

### Step 0.5 — Register URL schemes (replaces AndroidManifest.xml intent-filters)

In `Info.plist`, add `URL types` with the following schemes (mirrors the 3 deep links in the manifest):

| URL Scheme | Host | Purpose |
|---|---|---|
| `continuum` | `auth` | Email verification + password reset |
| `continuum` | `drive-pick` | Google Drive Picker callback |

In Xcode: Info tab → URL Types → add identifier `dev.usecontinuum.app` with URL Schemes: `continuum`

---

## Phase 1: Core Infrastructure

Build these files in order. Each depends on the previous. **Commit after each step.**

### Step 1.1 — Theme: Colors

**File:** `Core/UI/Theme/Colors.swift`  
**Replaces:** `res/values/colors.xml` + `Color.kt`

All hex values are identical to the Android source:

```swift
import SwiftUI

extension Color {
    static let brandPurple    = Color(hex: 0x6B21A8)
    static let deepPurple     = Color(hex: 0x3B0764)
    static let purpleTint     = Color(hex: 0xF3F0FF)
    static let pageBackground = Color(hex: 0xF8F9FA)
    static let surfaceWhite   = Color(hex: 0xFFFFFF)
    static let border         = Color(hex: 0xE5E7EB)
    static let textPrimary    = Color(hex: 0x111827)
    static let textSecondary  = Color(hex: 0x6B7280)
    static let textMuted      = Color(hex: 0x9CA3AF)
    static let successGreen   = Color(hex: 0x059669)
    static let successGreenBg = Color(hex: 0xECFDF5)
    static let warningAmber   = Color(hex: 0xD97706)
    static let warningAmberBg = Color(hex: 0xFFFBEB)
    static let errorRed       = Color(hex: 0xDC2626)
    static let errorRedBg     = Color(hex: 0xFEE2E2)
    static let bubbleReceived = Color(hex: 0xE9EAEC)

    init(hex: UInt32) {
        self.init(
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8)  & 0xFF) / 255,
            blue:  Double( hex        & 0xFF) / 255
        )
    }
}
```

### Step 1.2 — Theme: Typography

**File:** `Core/UI/Theme/Typography.swift`  
**Replaces:** `Type.kt` (FrauncesFamily + PlusJakartaSansFamily)

```swift
import SwiftUI

extension Font {
    // Fraunces — display/headline (mirrors FrauncesFamily in Kotlin)
    static func fraunces(_ weight: Weight, size: CGFloat) -> Font {
        let name = weight == .black ? "Fraunces-Black" : "Fraunces-Bold"
        return .custom(name, size: size)
    }

    // Plus Jakarta Sans — body/UI (mirrors PlusJakartaSansFamily)
    static func plusJakarta(_ weight: Weight, size: CGFloat) -> Font {
        let name: String
        switch weight {
        case .bold:     name = "PlusJakartaSans-Bold"
        case .semibold: name = "PlusJakartaSans-SemiBold"
        case .medium:   name = "PlusJakartaSans-Medium"
        default:        name = "PlusJakartaSans-Regular"
        }
        return .custom(name, size: size)
    }

    // Mirrors ContinuumTypography scale exactly
    static let displayLarge   = fraunces(.black,    size: 36)
    static let displayMedium  = fraunces(.bold,     size: 28)
    static let displaySmall   = fraunces(.bold,     size: 22)
    static let headlineLarge  = fraunces(.bold,     size: 24)
    static let headlineMedium = plusJakarta(.bold,     size: 20)
    static let headlineSmall  = plusJakarta(.semibold,  size: 16)
    static let bodyLarge      = plusJakarta(.regular,   size: 16)
    static let bodyMedium     = plusJakarta(.regular,   size: 14)
    static let bodySmall      = plusJakarta(.regular,   size: 12)
    static let labelLarge     = plusJakarta(.semibold,  size: 14)
    static let labelMedium    = plusJakarta(.medium,    size: 12)
    static let labelSmall     = plusJakarta(.medium,    size: 10)
}
```

### Step 1.3 — Theme: Spacing + Shapes

**File:** `Core/UI/Theme/Spacing.swift`  
**Replaces:** `Spacing.kt` + `AppShape.kt`

```swift
import SwiftUI

// Mirrors Spacing.kt exactly (4dp grid)
enum Spacing {
    static let xxs: CGFloat = 2
    static let xs:  CGFloat = 4
    static let sm:  CGFloat = 8
    static let md:  CGFloat = 12
    static let lg:  CGFloat = 16
    static let xl:  CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 32
    static let huge: CGFloat = 48
    static let screenH: CGFloat = 16
    static let screenV: CGFloat = 16
    static let cardInner: CGFloat = 16
    static let sectionGap: CGFloat = 24
}

// Mirrors AppShape.kt
enum AppShape {
    static let card  = RoundedRectangle(cornerRadius: 12)
    static let button = RoundedRectangle(cornerRadius: 8)
    static let chip  = RoundedRectangle(cornerRadius: 4)
    static let sheet = UnevenRoundedRectangle(topLeadingRadius: 20, topTrailingRadius: 20)
    static let dialog = RoundedRectangle(cornerRadius: 16)
    static let pill  = Capsule()
}
```

### Step 1.4 — TokenManager (Keychain)

**File:** `Core/Data/TokenManager.swift`  
**Replaces:** `TokenManager.kt` (EncryptedSharedPreferences → Keychain)

The critical difference: Android uses hardware-backed `EncryptedSharedPreferences`. iOS uses Keychain Services with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` — equivalent security, hardware-backed on devices with Secure Enclave.

```swift
import Foundation
import Security
import Combine

enum LogoutReason { case userInitiated, remoteInvalidation }

@Observable
class TokenManager {
    static let shared = TokenManager()

    private let accessKey  = "continuum_access_token"
    private let refreshKey = "continuum_refresh_token"

    var isLoggedIn: Bool = false
    let logoutEvent = PassthroughSubject<LogoutReason, Never>()

    init() { isLoggedIn = getAccessToken() != nil }

    func saveTokens(jwt: String, refreshToken: String) {
        save(key: accessKey,  value: jwt)
        save(key: refreshKey, value: refreshToken)
        isLoggedIn = true
    }

    func getAccessToken()  -> String? { load(key: accessKey)  }
    func getRefreshToken() -> String? { load(key: refreshKey) }

    func clearTokens(reason: LogoutReason = .userInitiated) {
        delete(key: accessKey)
        delete(key: refreshKey)
        isLoggedIn = false
        logoutEvent.send(reason)
    }

    // Mirrors getJwtUserId() — base64 decode JWT payload, no library needed
    func getJwtUserId() -> String? {
        guard let token = getAccessToken() else { return nil }
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        var b64 = String(parts[1])
        let rem = b64.count % 4
        if rem > 0 { b64 += String(repeating: "=", count: 4 - rem) }
        guard let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        return json["userId"] as? String
    }

    private func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String:            kSecClassGenericPassword,
            kSecAttrAccount as String:      key,
            kSecValueData as String:        data,
            kSecAttrAccessible as String:   kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    private func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String:  true,
            kSecMatchLimit as String:  kSecMatchLimitOne
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

### Step 1.5 — Event Buses

**Files:** `Core/Data/DataRefreshNotifier.swift`, `Core/Data/ProfileUpdateNotifier.swift`, `Core/Data/ScrollToTopNotifier.swift`  
**Replaces:** The three Kotlin notifier classes (MutableSharedFlow → PassthroughSubject, MutableStateFlow → CurrentValueSubject)

```swift
// Replaces DataRefreshNotifier.kt
import Combine

enum RefreshScope { case notes, flashcards, tasks, applications, profile, all }

class DataRefreshNotifier {
    static let shared = DataRefreshNotifier()
    let refreshEvents = PassthroughSubject<RefreshScope, Never>()
    func notifyDataChanged(_ scope: RefreshScope = .all) { refreshEvents.send(scope) }
}

// Replaces ProfileUpdateNotifier.kt
class ProfileUpdateNotifier {
    static let shared = ProfileUpdateNotifier()
    let updates = PassthroughSubject<Void, Never>()
    func notifyProfileUpdated() { updates.send() }
}

// Replaces ScrollToTopNotifier.kt (MutableStateFlow<Int> → CurrentValueSubject<Int,Never>)
class ScrollToTopNotifier {
    static let shared = ScrollToTopNotifier()
    let counter = CurrentValueSubject<Int, Never>(0)
    func notifyScrollToTop() { counter.send(counter.value + 1) }
}
```

### Step 1.6 — NetworkMonitor

**File:** `Core/Network/NetworkMonitor.swift`  
**Replaces:** `NetworkMonitor.kt` (ConnectivityManager → NWPathMonitor)

```swift
import Network
import Combine

@Observable
class NetworkMonitor {
    static let shared = NetworkMonitor()
    var isOnline: Bool = true
    let onNetworkRestored = PassthroughSubject<Void, Never>()
    private let monitor = NWPathMonitor()

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                let nowOnline = path.status == .satisfied
                let wasOffline = self?.isOnline == false
                self?.isOnline = nowOnline
                if nowOnline && wasOffline { self?.onNetworkRestored.send() }
            }
        }
        monitor.start(queue: DispatchQueue(label: "dev.usecontinuum.network"))
    }
}
```

### Step 1.7 — OwnerRef Codable

**File:** `Core/Network/OwnerRef.swift`  
**Replaces:** `OwnerRefJsonAdapter.kt` (Moshi custom adapter → custom Codable)

Backend returns `userId` as either a plain string `"abc123"` or a populated object `{"_id": "abc123", "firstName": "..."}`. This custom decoder handles both shapes identically to the Android adapter.

```swift
struct OwnerRef: Codable {
    let id: String
    let firstName: String?
    let lastName: String?
    let username: String?
    let avatarUrl: String?

    var displayName: String? {
        let fn = firstName ?? ""; let ln = lastName ?? ""
        if !fn.isEmpty || !ln.isEmpty { return "\(fn) \(ln)".trimmingCharacters(in: .whitespaces) }
        return username
    }

    init(from decoder: Decoder) throws {
        // Handle both: plain string OR populated object
        if let id = try? decoder.singleValueContainer().decode(String.self) {
            self.id = id; firstName = nil; lastName = nil; username = nil; avatarUrl = nil
        } else {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            id        = try  c.decode(String.self,          forKey: .id)
            firstName = try? c.decode(String.self,          forKey: .firstName)
            lastName  = try? c.decode(String.self,          forKey: .lastName)
            username  = try? c.decode(String.self,          forKey: .username)
            avatarUrl = try? c.decode(String.self,          forKey: .avatarUrl)
        }
    }

    enum CodingKeys: String, CodingKey {
        case id = "_id"; case firstName; case lastName; case username; case avatarUrl
    }
}
```

### Step 1.8 — APIClient

**File:** `Core/Network/APIClient.swift`  
**Replaces:** `ApiClient.kt` + `AuthInterceptor.kt` + `TokenAuthenticator.kt` + `RateLimitInterceptor.kt`

The iOS equivalent uses `URLSession` with `async/await`. Token refresh deduplication mirrors the `synchronized` block in `TokenAuthenticator.authenticate()`.

```swift
import Foundation

enum APIError: LocalizedError {
    case unauthorized, rateLimited, serverError(String), decodingError(String)
    var errorDescription: String? {
        switch self {
        case .unauthorized:       return "Your session has expired. Please sign in again."
        case .rateLimited:        return "Too many requests. Please wait a moment and try again."
        case .serverError(let m): return m
        case .decodingError(let m): return m
        }
    }
}

class APIClient {
    static let shared = APIClient()
    let baseURL = URL(string: "https://api.usecontinuum.dev/api/")!

    private let session: URLSession
    // Deduplicate concurrent refresh calls (mirrors TokenAuthenticator synchronized block)
    private var refreshTask: Task<String, Error>?

    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        // Backend uses _id, not id — handled per-DTO with CodingKeys
        return d
    }()

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest  = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        responseType: T.Type,
        retrying: Bool = false
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json",  forHTTPHeaderField: "Content-Type")
        request.setValue("ios",               forHTTPHeaderField: "X-Client-Type")

        // AuthInterceptor equivalent: inject Bearer token
        if let token = TokenManager.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body { request.httpBody = try JSONEncoder().encode(body) }

        let (data, response) = try await session.data(for: request)
        let http = response as! HTTPURLResponse

        // RateLimitInterceptor equivalent
        if http.statusCode == 429 { throw APIError.rateLimited }

        // TokenAuthenticator equivalent: refresh on 401
        if http.statusCode == 401 && !retrying {
            let newToken = try await refreshAccessToken()
            request.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
            return try await self.request(path, method: method, body: body,
                                          responseType: responseType, retrying: true)
        }

        return try Self.decoder.decode(T.self, from: data)
    }

    // Mirrors TokenAuthenticator.authenticate() + synchronized refresh deduplication
    private func refreshAccessToken() async throws -> String {
        if let existing = refreshTask { return try await existing.value }

        let task = Task<String, Error> {
            defer { refreshTask = nil }
            guard let refreshToken = TokenManager.shared.getRefreshToken() else {
                throw APIError.unauthorized
            }
            struct Body: Encodable { let refreshToken: String }
            struct Response: Decodable { let token: String; let refreshToken: String }

            var req = URLRequest(url: baseURL.appendingPathComponent("auth/mobile/refresh"))
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(Body(refreshToken: refreshToken))

            let (data, _) = try await session.data(for: req)
            let resp = try JSONDecoder().decode(Response.self, from: data)
            TokenManager.shared.saveTokens(jwt: resp.token, refreshToken: resp.refreshToken)
            return resp.token
        }
        refreshTask = task
        do {
            return try await task.value
        } catch {
            TokenManager.shared.clearTokens(reason: .remoteInvalidation)
            throw error
        }
    }
}
```

### Step 1.9 — ErrorUtils

**File:** `Core/Network/ErrorUtils.swift`  
**Replaces:** `ErrorUtils.kt`

```swift
private let errorMap: [String: String] = [
    "Invalid credentials":        "Incorrect email or password.",
    "Email already registered":   "An account with this email already exists.",
    "Username already taken":     "This username is not available.",
    "User not found":             "No account found with that email address.",
    "Token expired":              "Your session has expired. Please sign in again.",
    "Invalid token":              "Your session is invalid. Please sign in again.",
    "Incorrect password":         "The current password you entered is incorrect.",
    "Internal server error":      "Something went wrong on our end. Please try again.",
    "Internal Server Error":      "Something went wrong on our end. Please try again."
]

func friendlyError(_ error: Error, fallback: String = "Something went wrong. Please try again.") -> String {
    if let apiError = error as? APIError { return apiError.localizedDescription }
    let message = error.localizedDescription
    return errorMap[message] ?? message.ifBlank(fallback)
}

extension String {
    func ifBlank(_ fallback: String) -> String { trimmingCharacters(in: .whitespaces).isEmpty ? fallback : self }
}
```

### Step 1.10 — SocketManager

**File:** `Core/Network/SocketManager.swift`  
**Replaces:** `SocketManager.kt` (Socket.IO Android → Socket.IO-Client-Swift)

Each Android `MutableSharedFlow<String>` becomes a `PassthroughSubject<String, Never>`:

```swift
import SocketIO
import Combine

class SocketManager: ObservableObject {
    static let shared = SocketManager()

    private var manager: SocketIO.SocketManager?
    private var socket: SocketIOClient?

    // Mirrors each MutableSharedFlow in SocketManager.kt
    let newMessageFlow    = PassthroughSubject<String, Never>()
    let friendRequestFlow = PassthroughSubject<String, Never>()
    let taskUpdatedFlow   = PassthroughSubject<String, Never>()
    let activityUpdatedFlow = PassthroughSubject<String, Never>()
    let noteUpdatedFlow   = PassthroughSubject<String, Never>()

    func connect() {
        guard socket?.status != .connected else { return }
        guard let token = TokenManager.shared.getAccessToken() else { return }

        let url = URL(string: "https://api.usecontinuum.dev")!
        manager = SocketIO.SocketManager(socketURL: url, config: [
            .connectParams(["token": token]),
            .reconnects(true),
            .reconnectAttempts(-1),
            .reconnectWait(1),
            .reconnectWaitMax(5)
        ])
        socket = manager?.defaultSocket

        socket?.on("new_message")      { [weak self] data, _ in self?.emit(data, to: self?.newMessageFlow) }
        socket?.on("friend_request")   { [weak self] data, _ in self?.emit(data, to: self?.friendRequestFlow) }
        socket?.on("task_updated")     { [weak self] data, _ in self?.emit(data, to: self?.taskUpdatedFlow) }
        socket?.on("activity_updated") { [weak self] data, _ in self?.emit(data, to: self?.activityUpdatedFlow) }
        socket?.on("note_updated")     { [weak self] data, _ in self?.emit(data, to: self?.noteUpdatedFlow) }

        socket?.connect()
    }

    func disconnect() { socket?.disconnect(); socket = nil; manager = nil }
    func onNetworkAvailable() { if socket?.status != .connected { connect() } }

    private func emit(_ data: [Any], to subject: PassthroughSubject<String, Never>?) {
        guard let first = data.first else { return }
        if let str = first as? String { subject?.send(str); return }
        if let dict = first as? [String: Any],
           let json = try? JSONSerialization.data(withJSONObject: dict),
           let str  = String(data: json, encoding: .utf8) { subject?.send(str) }
    }
}
```

### Step 1.11 — SwiftData Persistence Layer

**File:** `Core/Persistence/Models.swift`  
**Replaces:** All `@Entity` classes in `AppDatabase.kt` (Room → SwiftData)

Every field name and type mirrors the Android entity exactly:

```swift
import SwiftData

@Model class NoteEntity {
    @Attribute(.unique) var id: String
    var title: String; var content: String
    var tags: String          // comma-separated, same as Room
    var isFavorite: Bool; var updatedAt: String; var createdAt: String
    init(id: String, title: String, content: String, tags: String,
         isFavorite: Bool, updatedAt: String, createdAt: String) {
        self.id = id; self.title = title; self.content = content
        self.tags = tags; self.isFavorite = isFavorite
        self.updatedAt = updatedAt; self.createdAt = createdAt
    }
}

@Model class FlashcardSetEntity {
    @Attribute(.unique) var id: String
    var title: String; var descriptionText: String
    var cardCount: Int; var updatedAt: String
}

@Model class FlashcardEntity {
    @Attribute(.unique) var id: String
    var setId: String; var front: String; var back: String; var position: Int
}

@Model class TaskEntity {
    @Attribute(.unique) var id: String
    var title: String; var descriptionText: String
    var status: String; var priority: String?; var dueDate: String?; var updatedAt: String
}

@Model class ConversationEntity {
    @Attribute(.unique) var id: String
    var participantId: String; var participantName: String
    var participantAvatar: String?; var participantRoles: String
    var lastMessage: String; var lastMessageAt: String; var unreadCount: Int
}

@Model class ApplicationEntity {
    @Attribute(.unique) var id: String
    var company: String; var position: String; var status: String
    var appliedDate: String?; var jobUrl: String?; var notes: String?; var updatedAt: String
}

@Model class UserEntity {
    @Attribute(.unique) var id: String
    var firstName: String; var lastName: String; var email: String; var avatar: String?
}

@Model class SyncQueueEntity {
    var localId: UUID = UUID()
    var operation: String     // "create" | "update" | "delete"
    var resourceType: String  // "note" | "task" | "flashcard_set"
    var resourceId: String?
    var payload: String       // JSON body to send
    var createdAt: Date = Date()
    var retryCount: Int = 0
}
```

**File:** `Core/Persistence/PersistenceController.swift`

```swift
import SwiftData

class PersistenceController {
    static let shared = PersistenceController()
    let container: ModelContainer

    init() {
        container = try! ModelContainer(for:
            NoteEntity.self, FlashcardSetEntity.self, FlashcardEntity.self,
            TaskEntity.self, ConversationEntity.self, ApplicationEntity.self,
            UserEntity.self, SyncQueueEntity.self
        )
    }
}
```

### Step 1.12 — SyncWorker

**File:** `Core/Sync/SyncWorker.swift`  
**Replaces:** `SyncWorker.kt` (WorkManager → BGTaskScheduler)

Register the task identifier in `Info.plist` under `BGTaskSchedulerPermittedIdentifiers`: `dev.usecontinuum.sync`

```swift
import BackgroundTasks

class SyncWorker {
    static let shared = SyncWorker()
    static let taskIdentifier = "dev.usecontinuum.sync"

    // Call from App init — mirrors WorkManager registration in ContinuumApp.kt
    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.taskIdentifier,
            using: nil
        ) { task in
            Task { await self.processPendingOperations(task: task as! BGProcessingTask) }
        }
    }

    // Mirrors SyncWorker.enqueueOnce() — called by NetworkMonitor on restore
    func scheduleIfNeeded() {
        let request = BGProcessingTaskRequest(identifier: Self.taskIdentifier)
        request.requiresNetworkConnectivity = true
        try? BGTaskScheduler.shared.submit(request)
    }

    private func processPendingOperations(task: BGProcessingTask) async {
        task.expirationHandler = { task.setTaskCompleted(success: false) }
        await SyncRepository.shared.processPendingOperations()
        task.setTaskCompleted(success: true)
    }
}
```

---

## Phase 2: Shared UI Components

Each component is a direct translation of the Kotlin composable with identical visual output.

### Step 2.1 — SkeletonLoader
**Replaces:** `SkeletonLoader.kt`

```swift
import SwiftUI

struct SkeletonLoader: View {
    var cornerRadius: CGFloat = 8
    @State private var phase: CGFloat = -300

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(shimmerGradient)
            .onAppear {
                withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                    phase = 1000
                }
            }
    }

    private var shimmerGradient: LinearGradient {
        LinearGradient(
            colors: [Color(hex: 0xE5E7EB), Color(hex: 0xF9FAFB), Color(hex: 0xE5E7EB)],
            startPoint: UnitPoint(x: phase / 1000, y: 0),
            endPoint:   UnitPoint(x: (phase + 300) / 1000, y: 1)
        )
    }
}
```

### Step 2.2 — ContinuumButton
**Replaces:** `ContinuumButton.kt` (Primary / Secondary / Danger variants)

```swift
import SwiftUI

enum ButtonVariant { case primary, secondary, danger }

struct ContinuumButton: View {
    let text: String; let action: () -> Void
    var variant: ButtonVariant = .primary
    var enabled: Bool = true; var loading: Bool = false

    var body: some View {
        Button(action: action) {
            Group {
                if loading { ProgressView().tint(foreground) }
                else { Text(text).font(.labelLarge) }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
        }
        .background(background)
        .foregroundStyle(foreground)
        .clipShape(AppShape.button)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(borderColor, lineWidth: variant == .secondary ? 1 : 0))
        .disabled(!enabled || loading)
        .opacity((!enabled || loading) ? 0.6 : 1)
    }

    private var background: Color {
        switch variant {
        case .primary:   return .brandPurple
        case .secondary: return .clear
        case .danger:    return .errorRed
        }
    }
    private var foreground: Color { variant == .secondary ? .brandPurple : .white }
    private var borderColor: Color { variant == .secondary ? .brandPurple : .clear }
}
```

### Step 2.3 — ContinuumCard
**Replaces:** `ContinuumCard.kt` (Flat / Elevated styles)

```swift
struct ContinuumCard<Content: View>: View {
    var style: CardStyle = .flat
    var action: (() -> Void)? = nil
    @ViewBuilder let content: () -> Content

    enum CardStyle { case flat, elevated }

    var body: some View {
        Group {
            if let action {
                Button(action: action) { cardContent }
            } else {
                cardContent
            }
        }
    }

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: 0) { content() }
            .background(Color.white)
            .clipShape(AppShape.card)
            .overlay(
                style == .flat
                    ? AppShape.card.stroke(Color.border, lineWidth: 1)
                    : AppShape.card.stroke(Color.clear, lineWidth: 0)
            )
            .shadow(
                color: style == .elevated ? .black.opacity(0.08) : .clear,
                radius: style == .elevated ? 2 : 0, y: 1
            )
    }
}
```

### Step 2.4 — ContinuumTextField
**Replaces:** `ContinuumTextField.kt`

```swift
struct ContinuumTextField: View {
    let label: String
    @Binding var text: String
    var placeholder: String = ""
    var errorMessage: String? = nil
    var isSecure: Bool = false
    var trailingIcon: AnyView? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ZStack(alignment: .trailing) {
                if isSecure {
                    SecureField(label, text: $text, prompt: Text(placeholder).foregroundColor(.textMuted))
                } else {
                    TextField(label, text: $text, prompt: Text(placeholder).foregroundColor(.textMuted))
                }
                trailingIcon
            }
            .padding(12)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(errorMessage != nil ? Color.errorRed : Color.border, lineWidth: 1)
            )

            if let error = errorMessage {
                Text(error).font(.labelSmall).foregroundStyle(Color.errorRed)
            }
        }
    }
}
```

### Step 2.5 — AvatarInitials
**Replaces:** `AvatarInitials.kt`

```swift
import SDWebImageSwiftUI

struct AvatarInitials: View {
    let name: String
    var imageUrl: String? = nil
    var size: CGFloat = 40

    private var initials: String {
        name.split(separator: " ").prefix(2)
            .compactMap { $0.first.map { String($0).uppercased() } }
            .joined()
            .ifEmpty("?")
    }

    var body: some View {
        if let url = imageUrl.flatMap(URL.init) {
            WebImage(url: url)
                .resizable().scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
        } else {
            Circle()
                .fill(Color.purpleTint)
                .frame(width: size, height: size)
                .overlay(Text(initials).font(.labelMedium).fontWeight(.semibold).foregroundStyle(Color.brandPurple))
        }
    }
}

extension String {
    func ifEmpty(_ fallback: String) -> String { isEmpty ? fallback : self }
}
```

### Step 2.6 — OfflineBanner + DemoBanner + EmptyState

Translate directly from `OfflineBanner.kt`, `DemoBanner.kt`, `EmptyState.kt`. Each is a straightforward SwiftUI `View` — the layout, colors, and text match exactly.

### Step 2.7 — StatusBadge
**Replaces:** `StatusBadge.kt` — translate the `colorsFor(status)` mapping to a Swift switch statement using the same `ApplicationStatus` enum values.

### Step 2.8 — CommentThread + ShareToFriendsSheet
**Replaces:** `CommentThread.kt` + `ShareToFriendsSheet.kt` — these are the most complex shared components. Translate the nested `Column`/`Row` layouts to `VStack`/`HStack`. `ModalBottomSheet` → `.sheet(isPresented:)`.

---

## Phase 3: Navigation

### Step 3.1 — Route enum + AppNavHost

**File:** `Core/UI/Navigation/AppNavHost.swift`  
**Replaces:** `AppNavHost.kt` + `NavRoutes` object

```swift
enum Route: Hashable {
    // Auth
    case login, register, forgotPassword
    case resetPassword(token: String), verifyEmail(token: String)
    case privacy, terms
    // Main tabs
    case dashboard
    case notesList, noteDetail(id: String), noteEditor(id: String), driveImport
    case flashcardSetsList, flashcardSetDetail(id: String), studyMode(id: String), studyHistory
    case taskBoard, taskDetail(id: String), calendar
    case applicationsList, applicationDetail(id: String)
    case resumesList, resumeDetail(id: String), resumeFeedback(id: String)
    case activityFeed, friendsList, userSearch
    case userProfile(id: String), sharedNote(id: String)
    case conversations, conversationDetail(id: String, name: String, participantId: String)
    case profileScreen, editProfile, settings
}
```

The tab structure mirrors `bottomNavItems` in `BottomNavBar.kt` exactly: Notes → Flashcards → Dashboard (logo center) → Career → Profile.

### Step 3.2 — Deep link handling

**In `Info.plist`** add URL types with scheme `continuum`. In your `@main App` struct:

```swift
.onOpenURL { url in
    // Mirrors AndroidManifest.xml intent-filters
    // continuum://auth/verify-email?token=...
    // continuum://auth/reset-password?token=...
    // continuum://drive-pick?id=...&name=...&url=...
    handleDeepLink(url)
}
```

---

## Phase 4: Feature Modules

Build features in this order — each builds on the previous. For each feature, the pattern is always:

1. DTOs (`Codable` structs mirroring the Kotlin `@JsonClass` DTOs)
2. Domain models (plain Swift structs mirroring the Kotlin domain data classes)
3. API service (protocol + implementation using `APIClient`)
4. Repository (cache-first flow mirroring the Kotlin repository pattern)
5. ViewModel (`@Observable` class mirroring the Kotlin `@HiltViewModel`)
6. Screens (SwiftUI `View` structs mirroring the Kotlin `@Composable` functions)

### Step 4.1 — Auth Feature
**Reference files:** `AuthApiService.kt`, `AuthDtos.kt`, `AuthRepository.kt`, `User.kt`, `AuthViewModel.kt`, all 6 auth presentation screens

**Key translation notes:**
- `AuthUiState` sealed class → Swift `enum AuthUiState`
- Google Sign-In: replace `CredentialManager` + `GetGoogleIdOption` with `import GoogleSignIn` SDK. Get `idToken` from `GIDSignIn.sharedInstance` and POST to `POST /api/auth/google/mobile` — same endpoint as Android
- Password validation regex: copy the same rules from `RegisterScreen.kt` (8+ chars, letter, digit, special char)

### Step 4.2 — Notes Feature
**Reference files:** `NotesApiService.kt`, `NoteDtos.kt`, `NotesRepository.kt`, `Note.kt`, `NotesViewModel.kt`, 4 presentation screens

**Key translation notes:**
- Rich text editor: use `RichTextKit` pod (same HTML input/output format)
- Google Drive import: use `ASWebAuthenticationSession` to open the CCT picker URL. Register the `continuum://drive-pick` deep link in `Info.plist` — the same backend URL works
- PDF download: use `URLSession` to download bytes, save to temp file, open with `PDFKit.PDFDocument`
- `useInfiniteQuery` pattern → fetch all pages in parallel using Swift `async let`, merge results

### Step 4.3 — Flashcards Feature
**Reference files:** `FlashcardsApiService.kt`, `FlashcardDtos.kt`, `FlashcardsRepository.kt`, `Flashcard.kt`, `FlashcardsViewModel.kt`, 5 presentation screens

**Key translation notes:**
- Card flip animation: use SwiftUI `rotation3DEffect` with `withAnimation(.easeInOut(duration: 0.4))` — identical to `animateFloatAsState` flip in Android
- Swipe gestures on revealed card: use `DragGesture` with `onEnded` threshold check (`>120pt` mirrors the Android `120f` threshold)
- Study session submit: `POST /api/study-sessions` — same endpoint, same DTO

### Step 4.4 — Tasks Feature
**Reference files:** `TasksApiService.kt`, `TaskDtos.kt`, `TaskParticipantDtoAdapter.kt`, `TasksRepository.kt`, `Task.kt`, `TasksViewModel.kt`, 4 presentation screens

**Key translation notes:**
- `TaskParticipantDtoAdapter` (Moshi) → custom `init(from decoder:)` in `TaskParticipantDto` Codable
- Kanban status tabs: use SwiftUI `Picker(style: .segmented)` for the 3-tab todo/in_progress/completed selector
- Swipe to delete/move: `.swipeActions(edge: .trailing)`

### Step 4.5 — Career Feature
**Reference files:** `CareerApiService.kt`, `CareerDtos.kt`, `CareerRepository.kt`, `Career.kt`, `CareerViewModel.kt`, 5 presentation screens

**Key translation notes:**
- Resume PDF upload: use `UIDocumentPickerViewController` wrapped as `UIViewControllerRepresentable` (replaces `ActivityResultContracts.GetContent()`)
- PDF viewer: use `PDFKit.PDFView` wrapped as `UIViewRepresentable` (much simpler than Android's `PdfRenderer` — PDFKit handles rendering natively)
- Multipart upload: construct `URLRequest` with multipart/form-data body manually (no Retrofit `@Multipart` annotation)

### Step 4.6 — Social Feature
**Reference files:** `SocialApiService.kt`, `SocialDtos.kt`, `SocialRepository.kt`, `Social.kt`, `SocialViewModel.kt`, 6 presentation screens

**Key translation notes:**
- `CommentThread` and `ShareToFriendsSheet` are already built in Phase 2 — wire them up to the social ViewModel here
- Cursor-based activity feed pagination: track `nextCursor` in ViewModel state, load more when last visible item is within 3 of the end (same as Android `shouldLoadMore` derived state)
- `getFriendProfileExtras` parallel fetch: use `async let` for all 4 concurrent requests

### Step 4.7 — Messaging Feature
**Reference files:** `MessagingApiService.kt`, `MessagingDtos.kt`, `MessagingRepository.kt`, `Messaging.kt`, `MessagingViewModel.kt`, 2 presentation screens

**Key translation notes:**
- Real-time message delivery: subscribe to `SocketManager.shared.newMessageFlow` in `ConversationDetailScreen` using `.onReceive`
- Optimistic message send: add optimistic `Message` with `UUID` id to local list immediately, replace with confirmed server message on success (same pattern as Android)
- Shared content deep links in messages: parse `[shared:note:id]` prefix pattern from message content (same regex as Android)
- Reverse layout (newest at bottom): `LazyVStack` reversed, or `List` with `.scrollPosition` anchored to bottom

### Step 4.8 — Profile Feature
**Reference files:** `ProfileApiService.kt`, `ProfileDtos.kt`, `ProfileRepository.kt`, `Profile.kt`, `ProfileViewModel.kt`, 4 presentation screens

**Key translation notes:**
- Avatar upload: use `PhotosUI.PhotosPicker` (iOS 16+) to pick image, compress to JPEG, upload as multipart
- Session management: `GET /api/auth/sessions` + `DELETE /api/auth/sessions/:id` — same endpoints
- Account deletion grace period: same 30-day flow, confirm with username input + password (same validation as Android `DeleteAccountDialog`)
- Google unlink: `DELETE /api/auth/me/google/link` — same endpoint

### Step 4.9 — Dashboard Feature
**Reference files:** `DashboardViewModel.kt`, `DashboardScreen.kt`

**Key translation notes:**
- Parallel data loading: use `async let` for the 5 concurrent fetches (profile, notes, tasks, sets, applications)
- Instagram-style header: `ContinuumTopHeader` — a custom `HStack` with logo wordmark + 3 icon buttons
- Pull-to-refresh: `.refreshable { await viewModel.refresh() }`
- Stat tiles horizontal scroll: `ScrollView(.horizontal, showsIndicators: false)` + `HStack`

---

## Phase 5: Entry Point + Environment

### Step 5.1 — App entry point

**File:** `ContinuumApp.swift`  
**Replaces:** `ContinuumApp.kt` (@HiltAndroidApp) + `MainActivity.kt`

```swift
import SwiftUI
import SwiftData

@main
struct ContinuumApp: App {
    @State private var tokenManager = TokenManager.shared
    @State private var networkMonitor = NetworkMonitor.shared

    init() {
        // Register background sync task (mirrors WorkManager setup)
        SyncWorker.shared.registerBackgroundTask()
        // Connect socket when network restores
        NetworkMonitor.shared.onNetworkRestored
            .sink { SocketManager.shared.onNetworkAvailable() }
            .store(in: &cancellables)
    }

    var body: some Scene {
        WindowGroup {
            AppNavHost()
                .modelContainer(PersistenceController.shared.container)
                .environment(tokenManager)
                .environment(networkMonitor)
                .environment(\.isDemo, false) // set from JWT after login
        }
    }
    
    @State private var cancellables = Set<AnyCancellable>()
}
```

### Step 5.2 — Demo mode environment key

**Replaces:** `LocalIsDemo` CompositionLocal

```swift
// Core/UI/LocalEnvironment.swift
import SwiftUI

struct IsDemoKey: EnvironmentKey { static let defaultValue = false }
extension EnvironmentValues {
    var isDemo: Bool {
        get { self[IsDemoKey.self] }
        set { self[IsDemoKey.self] = newValue }
    }
}
// Usage in any View: @Environment(\.isDemo) var isDemo
```

---

## Phase 6: Install on Your iPhone

### Step 6.1 — Free signing (no $99 account needed)

1. Connect your iPhone via USB
2. In Xcode → Signing & Capabilities tab:
   - Team: select your personal Apple ID (free)
   - Bundle Identifier: `dev.usecontinuum.app`
   - Signing Certificate: "Sign to Run Locally"
3. Select your iPhone as the run target
4. Press ▶ Run

On first run, iOS will block the app. On your iPhone: Settings → General → VPN & Device Management → [your Apple ID] → Trust. Run again — it opens.

### Step 6.2 — Re-signing (every 7 days)

Free certificates expire every 7 days. To renew:
1. Plug in your iPhone
2. Press ▶ Run in Xcode
3. The app re-signs and reinstalls automatically

Set a phone reminder for 6 days from now so you don't get surprised at a demo.

---

## Claude Code Prompt — Phase 1 Kickoff

Copy this exact prompt into Claude Code to begin:

```
You are building a SwiftUI iOS app called Continuum — a 1:1 port of the Android 
app at /android/app/src/main/java/com/continuum/android/. 

The iOS project will live at /ios/. The backend is live at:
https://api.usecontinuum.dev (Swagger at /api-docs)

REFERENCE BEFORE WRITING ANY CODE:
- Read /android/app/src/main/java/com/continuum/android/core/ completely
- Read /android/app/src/main/java/com/continuum/android/di/ completely
- Read the continuum-ios-build-guide.md in the project root

ARCHITECTURE (non-negotiable):
- @Observable class for all ViewModels (iOS 17)
- URLSession + async/await for all networking (no Alamofire)
- SwiftData for local persistence (mirrors Room entities exactly)
- Keychain Services for token storage (mirrors EncryptedSharedPreferences)
- Combine PassthroughSubject for all event buses (mirrors SharedFlow)
- NWPathMonitor for network (mirrors ConnectivityManager)
- Socket.IO-Client-Swift pod for real-time (mirrors Socket.IO Android)

DESIGN SYSTEM (exact matches from Android):
- Fraunces-Bold / Fraunces-Black for headlines (FrauncesFamily)
- PlusJakartaSans for all body/UI text (PlusJakartaSansFamily)
- BrandPurple #6B21A8, PageBackground #F8F9FA, Border #E5E7EB (all exact hex)

LOGO ASSETS — STOP AND ASK THE USER:
Before creating any Xcode asset catalog entries for ic_logo_symbol or
ic_logo_wordmark, stop and ask me:
"I need two PNG assets to continue:
1. ic_logo_symbol.png — the infinity/lemniscate logo mark, transparent background, 512px+
2. ic_logo_wordmark.png — the 'continuum' wordmark, transparent background, 1024px+
Please provide both files."
Do not proceed with the asset catalog until I provide them.

GIT WORKFLOW — follow this exactly for every file you create or modify:

Branch: create feat/ios-app from main before writing any code
  git checkout -b feat/ios-app

Commit format: Conventional Commits, imperative mood, no periods, no em dashes, no scoped prefixes
  CORRECT:   feat: add TokenManager with Keychain storage
  CORRECT:   chore: add Socket.IO-Client-Swift to Podfile
  INCORRECT: feat(ios): add TokenManager
  INCORRECT: feat: added TokenManager.

One commit per step from the build guide. After each commit, continue to the next step.

After ALL phases are complete, create the PR:
  git push origin feat/ios-app
  gh issue list --repo JustinBurrell/continuum --state open --json number,title
  gh pr create \
    --title "feat: Continuum iOS app — full feature parity with Android" \
    --body "## Summary
  Full SwiftUI iOS port of the Continuum Android app with 1:1 feature parity.

  ## What was built
  - Core infrastructure: TokenManager (Keychain), APIClient (URLSession), SocketManager (Socket.IO), SwiftData persistence, BGTaskScheduler sync
  - All 9 features: Auth, Notes, Flashcards, Tasks, Career, Social, Messaging, Profile, Dashboard
  - Shared UI component library matching Android design system exactly
  - Navigation with deep link handling (continuum:// URL scheme)
  - Demo mode via @Environment(\.isDemo)
  - Offline-first with SyncQueue

  ## Architecture
  - @Observable ViewModels (iOS 17)
  - URLSession + async/await (no Alamofire)
  - SwiftData replacing Room
  - Keychain replacing EncryptedSharedPreferences
  - Combine PassthroughSubject replacing Kotlin SharedFlow
  - NWPathMonitor replacing ConnectivityManager
  - BGTaskScheduler replacing WorkManager

  ## Test plan
  - [ ] Install on device via Xcode free signing
  - [ ] Auth: login, register, Google OAuth, forgot password
  - [ ] Notes: create, edit, delete, Google Drive import, AI summary, generate flashcards
  - [ ] Flashcards: study mode flip animation, swipe gestures, session recording
  - [ ] Tasks: kanban board, status change, shared tasks
  - [ ] Career: upload resume, AI feedback, application tracking
  - [ ] Social: friends, activity feed, comments, sharing
  - [ ] Messaging: send/receive, real-time delivery via Socket.IO
  - [ ] Profile: edit, avatar upload, settings
  - [ ] Offline: disconnect wifi, verify cached data shows, reconnect and sync

  Closes #<fill in from gh issue list output>" \
    --base main

BUILD PHASE 1 — in this exact order, one file at a time, commit after each:
1. Create branch: feat/ios-app
2. /ios/Podfile with Socket.IO-Client-Swift, SDWebImageSwiftUI, lottie-ios, RichTextKit
   Commit: chore: add iOS Podfile with core dependencies
3. Core/UI/Theme/Colors.swift
   Commit: feat: add design system colors matching Android Color.kt
4. Core/UI/Theme/Typography.swift
   Commit: feat: add Fraunces and PlusJakartaSans typography scale
5. Core/UI/Theme/Spacing.swift (includes AppShape)
   Commit: feat: add spacing constants and shape tokens
6. Core/Data/TokenManager.swift
   Commit: feat: add TokenManager with Keychain storage
7. Core/Data/DataRefreshNotifier.swift + ProfileUpdateNotifier.swift + ScrollToTopNotifier.swift
   Commit: feat: add event bus notifiers replacing Kotlin SharedFlow
8. Core/Network/NetworkMonitor.swift
   Commit: feat: add NetworkMonitor using NWPathMonitor
9. Core/Network/OwnerRef.swift
   Commit: feat: add OwnerRef Codable for polymorphic userId field
10. Core/Network/APIClient.swift
    Commit: feat: add APIClient with URLSession auth interceptor and token refresh
11. Core/Network/ErrorUtils.swift
    Commit: feat: add error message mapping matching Android ErrorUtils
12. Core/Network/SocketManager.swift
    Commit: feat: add SocketManager with Socket.IO event streams
13. Core/Persistence/Models.swift + PersistenceController.swift
    Commit: feat: add SwiftData models mirroring Room entities
14. Core/Sync/SyncWorker.swift
    Commit: feat: add SyncWorker using BGTaskScheduler

Ask clarifying questions before writing anything. Enter plan mode, confirm
scope for each file, then implement one file at a time. Do not skip ahead.
```

---

## Asset Conversion Reference

| Android resource | iOS equivalent | Notes |
|---|---|---|
| `ic_logo_symbol.xml` | `ic_logo_symbol.pdf` in Assets | Export from Figma/Inkscape as PDF, single scale |
| `ic_logo_wordmark.xml` | `ic_logo_wordmark.pdf` in Assets | Same |
| `ic_linkedin.xml` | `ic_linkedin.pdf` in Assets | White paths, use as template image |
| `ic_instagram.xml` | `ic_instagram.pdf` in Assets | White paths, use as template image |
| `fraunces_bold.ttf` | Same file, added to Xcode target | Copy from `/android/app/src/main/res/font/` |
| `fraunces_black.ttf` | Same file | Copy from same location |
| `plus_jakarta_sans_*.ttf` (4 files) | Same files, added to Xcode target | Copy from same location |
| `privacy_policy.txt` | Add to Xcode bundle as-is | `Bundle.main.url(forResource:)` to load |
| `terms_of_service.txt` | Add to Xcode bundle as-is | Same |
| `network_security_config.xml` | `Info.plist` → `NSAppTransportSecurity` | For local dev: add `NSExceptionDomains` for `10.0.2.2` (simulator) and `localhost` |

---

## Known Differences from Android

These behaviors exist in Android but have no iOS equivalent or require a different approach:

| Android | iOS approach |
|---|---|
| `FLAG_SECURE` on sensitive screens | Not available on iOS — iOS enforces screenshot privacy at OS level for system features. Omit entirely. |
| `EncryptedSharedPreferences` + Android KeyStore | Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` — equivalent hardware-backed security |
| `WorkManager` one-time + periodic tasks | `BGTaskScheduler` + `BGProcessingTaskRequest` |
| `ConnectivityManager` + `NetworkCallback` | `NWPathMonitor` |
| Chrome Custom Tabs (CCT) for Drive Picker | `ASWebAuthenticationSession` opening same backend URL |
| `DownloadManager` for PDF download | `URLSession` download task + save to `FileManager` |
| `PdfRenderer` for PDF display | `PDFKit.PDFView` — significantly simpler API |
| `ActivityResultContracts.GetContent()` | `PhotosUI.PhotosPicker` (images) or `UIDocumentPickerViewController` (PDFs) |
| `CredentialManager` + Google Sign-In | `GoogleSignIn` iOS SDK + `GIDSignIn.sharedInstance` |
| `RichTextEditor` (Compose Rich Editor) | `RichTextKit` pod — same HTML in/out contract |
| `HiltViewModel` + `@Inject constructor` | `@Observable class` with direct init — no DI framework needed at this scale |
| `CompositionLocal` | SwiftUI `@Environment` with custom `EnvironmentKey` |

---

*Generated from Android source at `/android` — April 2026*
