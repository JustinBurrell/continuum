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

```js
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
```

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
```kotlin
implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
implementation("com.google.firebase:firebase-messaging-ktx")
```

### 3. Implement FirebaseMessagingService
```kotlin
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
```

### 4. Request POST_NOTIFICATIONS permission (Android 13+)
Use Accompanist Permissions or ActivityResultContracts to request
Manifest.permission.POST_NOTIFICATIONS on first launch after login.

### 5. Register service in AndroidManifest.xml
```xml
<service android:name=".ContinuumMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
    </intent-filter>
</service>
```

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
