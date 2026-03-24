# Postman Testing — Session 3-4

API-1 through API-11: Auth, Notes, Google Drive, Groq AI, Flashcards, Tasks, Calendar.

---

## Setup

### 1. Import the files into Postman
- Open Postman → **Collections** tab → **Import** → select `continuum-session3-4.postman_collection.json`
- Open Postman → **Environments** tab (eye icon) → **Import** → select `continuum-local.postman_environment.json`

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown from "No Environment" to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```
You should see:
```
MongoDB Connected: ...
Server running on port 5000
```

---

## Environment Variables

These are pre-defined in `continuum-local.postman_environment.json`.
**Token and IDs are auto-set by test scripts** — you don't need to copy/paste them manually.

| Variable        | Set by              | Used by                          |
|-----------------|---------------------|----------------------------------|
| `baseUrl`       | Pre-set (`localhost:5000`) | All requests                |
| `token`         | Register / Login    | All protected routes             |
| `googleToken`   | Google OAuth callback (paste manually) | Google Drive folder only |
| `userId`        | Register / Login    | Reference                        |
| `noteId`        | Create Note         | Note, Summary, Flashcard routes  |
| `flashcardSetId`| Create/Generate Set | Flashcard card routes            |
| `flashcardId`   | Add Card            | Card update/progress/delete      |
| `taskId`        | Create Task         | Task update/delete/status routes |

To see current values: click the **eye icon** (top-right) while the environment is selected.

---

## Test Order

Run top to bottom within each folder. Each creation request auto-sets the ID for the requests below it.

### 1. Auth
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Register | `{ "username", "email", "password", "firstName", "lastName" }` | `201` — sets `token` + `userId` | ✅ |
| Login | `{ "email", "password" }` | `200` — re-sets `token` + `userId` | ✅ |
| Get Me | none | `200` — confirms token works | ✅ |
| Forgot Password | `{ "email" }` | `200` | ✅ |
| Reset Password | `{ "token", "newPassword" }` | `200` (use token from email) | ✅ |
| [Error] Login — Wrong Password | `{ "email", "password": "wrongpassword" }` | `401` | ✅ |
| [Error] Get Me — No Token | none | `401` | ✅ |

### 2. Notes
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Note | `{ "title", "content", "tags" }` | `201` — sets `noteId` | ✅ |
| **Upload Note PDF** | form-data: `pdf` = PDF file, `title`, `type`, `tags` | `201` — sets `noteId`, `pdfUrl` populated | |
| List Notes | none | `200` | ✅ |
| List Notes — Search | query: `?search=` | `200` | ✅ |
| List Notes — Tag Filter | query: `?tag=` | `200` | ✅ |
| Get Note by ID | none | `200` | ✅ |
| Update Note | `{ "title", "content" }` | `200` | ✅ |
| **Get Note PDF Download URL** | none | `200` — `downloadUrl` is a Cloudinary `fl_attachment` URL | |
| **[Error] Get Note PDF — Note Has No PDF** | none (use a text-only `noteId`) | `404` | |
| [Error] Get Note — Not Found | none | `404` | ✅ |
| Delete Note | none | `200` *(run last in this folder)* | ✅ |

### 3. AI Summary
*(Run before deleting the note)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Generate Summary | none | `200` — takes a few seconds (Groq API call) | ✅ |
| Get Cached Summary | none | `200` — response includes `cached: true` | ✅ |
| Force Regenerate Summary | query: `?force=true` | `200` — regenerates even if cached | ✅ |

### 4. Flashcard Sets
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Generate from Note | none | `201` — sets `flashcardSetId` | ✅ |
| Generate from Content | `{ "title", "content" }` | `201` | ✅ |
| Create Set Manually | `{ "title", "description" }` | `201` | ✅ |
| List Sets | none | `200` | ✅ |
| Get Set by ID | none | `200` — includes populated cards array | ✅ |
| Add Card | `{ "front", "back" }` | `201` — sets `flashcardId` | ✅ |
| Update Card | `{ "front", "back" }` | `200` | ✅ |
| Update Progress — Correct + Confidence | `{ "correct": true, "confidence": "high" }` | `200` | ✅ |
| Update Progress — Incorrect, No Confidence | `{ "correct": false }` | `200` | ✅ |
| Delete Card | none | `200` | ✅ |
| Delete Set | none | `200` | ✅ |
| [Error] Generate — Missing Content | `{ "title" }` only | `400` | ✅ |
| [Error] Add Card — Missing back | `{ "front" }` only | `400` | ✅ |
| [Error] Update Progress — Non-Boolean correct | `{ "correct": "yes" }` | `400` | ✅ |

### 5. Tasks
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Task | `{ "title", "dueDate", "type", "priority", "description", "duration", "reminderMinutes" }` | `201` — sets `taskId` | ✅ |
| List Tasks | none | `200` | ✅ |
| List Tasks — Status Filter | query: `?status=todo` | `200` | ✅ |
| List Tasks — Date Range | query: `?startDate=&endDate=` | `200` | ✅ |
| Get Task by ID | none | `200` | ✅ |
| Update Task | `{ "title", "priority", "description" }` | `200` | ✅ |
| Update Status — in_progress | `{ "status": "in_progress" }` | `200` | ✅ |
| Update Status — completed | `{ "status": "completed" }` | `200` — check `completedAt` is set | ✅ |
| Update Status — back to todo | `{ "status": "todo" }` | `200` — check `completedAt` is null | ✅ |
| Delete Task | none | `200` | ✅ |
| [Error] Create Task — Missing dueDate | `{ "title", "type" }` only | `400` | ✅ |
| [Error] Update Status — Invalid Value | `{ "status": "done" }` | `400` | ✅ |

### 6. Calendar
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Calendar — Week View | query: `?from=&to=&view=week` | `200` — tasks grouped by date in `days` object | ✅ |
| Get Calendar — Month View | query: `?from=&to=&view=month` | `200` | ✅ |
| [Error] Calendar — Missing from/to | none | `400` | ✅ |
| [Error] Calendar — Invalid Dates | query: `?from=notadate&to=notadate` | `400` | ✅ |

### 7. Google Drive
*(Requires a linked Google account. Visit `http://localhost:5001/api/auth/google`, complete sign-in, then copy the token from the callback URL into the `googleToken` environment variable. Do not run Login after — that will only overwrite `token`, not `googleToken`.)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| List Drive Files | none | `200` — returns up to 1000 Google Docs for the file picker | ✅ |
| Import Google Doc | `{ "googleDocId", "googleDocUrl", "title" }` | `201` — values from List Drive Files response | ✅ |
| Refresh Note from Google Doc | none | `200` — check `lastSyncedAt` is updated | ✅ |

---

## Tips

- If a request fails with `401 Unauthorized`, your token may have expired — re-run **Login** to refresh it
- If a request fails with `404 Not Found`, the ID variable may be stale — re-run the creation request for that resource
- **Upload Note PDF** requires selecting a real PDF file manually via the file picker in Postman
- The Groq summary and flashcard generation requests take 2-5 seconds — this is normal

---

# Postman Testing — Session 5

API-13 through API-18: Friends, Note Sharing, Comments/Likes, Resume Upload, Applications, Shared Tasks.

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session5.postman_collection.json`
- The environment (`continuum-local.postman_environment.json`) is shared with session 3-4 — re-import it to pick up the new variables added for session 5, or just re-use the existing one (new variables will be auto-set by test scripts)

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Environment Variables

New variables added for session 5. All are auto-set by test scripts.

| Variable          | Set by                  | Used by                                      |
|-------------------|-------------------------|----------------------------------------------|
| `secondToken`     | Register User 2         | All "as User 2" requests                     |
| `secondUserId`    | Register User 2         | Send Friend Request, Share Note (specific), Create Shared Task |
| `friendshipId`    | Send Friend Request     | Accept/Remove Friend routes                  |
| `noteId`          | Create Note (for Sharing) | Share, Comment, Get Shared routes           |
| `commentId`       | Add Comment             | Like, Delete Comment routes                  |
| `resumeId`        | Upload Resume           | Feedback, download, delete routes            |
| `applicationId`   | Create Application      | Update, Contacts, Reminders routes           |
| `sharedTaskId`    | Create Shared Task      | Participant Status, Calendar routes          |
| `calFrom` / `calTo` | Pre-request script    | Get Calendar (Shared Tasks folder)           |

---

## Test Order

Run folders top to bottom. **Do not run "Remove Friend" until after all Note Sharing and Shared Tasks tests** — it will break the specific sharing and shared task flows.

### 0. Setup — Second User
*(Run these first, in order)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login User 1 | `{ "email", "password" }` | `200` — sets `token` + `userId` | ✅ |
| Register User 2 | `{ "username", "email", "password", "firstName", "lastName" }` | `201` — sets `secondToken` + `secondUserId` | ✅ |

### 1. Users
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Search Users | query: `?q=testuser2` | `200` — returns array of matching users | ✅ |
| **Get User by ID** | none | `200` — `user` object returned | |
| [Error] Search — Missing Query | none | `400` | ✅ |
| **[Error] Get User by ID — Not Found** | none (uses `000000000000000000000000`) | `404` | |

### 2. Friends
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Send Friend Request | `{ "recipientId": "{{secondUserId}}" }` | `201` — sets `friendshipId` | ✅ |
| Accept Request — as User 2 | `{ "action": "accept" }` | `200` | ✅ |
| List Friends | none | `200` — includes User 2 with `status: accepted` | ✅ |
| List Pending Requests | query: `?status=pending` | `200` — empty after acceptance | ✅ |
| [Error] Send to Self | `{ "recipientId": "{{userId}}" }` | `400` | ✅ |
| [Error] Duplicate Request | `{ "recipientId": "{{secondUserId}}" }` | `400` | ✅ |
| Remove Friend ⚠️ | none | `200` — **run AFTER Note Sharing and Shared Tasks** | ✅ |

### 3. Note Sharing
*(Requires friendship to be accepted — run 2. Friends first)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Note (for Sharing) | `{ "title", "content", "tags" }` | `201` — sets `noteId` | ✅ |
| Share Note — Friends | `{ "visibility": "friends" }` | `200` | ✅ |
| Share Note — Specific Users | `{ "visibility": "specific", "sharedWith": ["{{secondUserId}}"] }` | `200` | ✅ |
| Get Shared Notes — as User 2 | none | `200` — note appears in results | ✅ |
| Get Shared Notes — Search (as User 2) | query: `?search=<title keyword>` | `200` — filtered shared notes matching search | |
| Get Shared Notes — as User 1 | none | `200` — empty (User 1 has no notes shared with them) | ✅ |
| [Error] Share with Non-Friend | `{ "visibility": "specific", "sharedWith": ["000000000000000000000000"] }` | `400` | ✅ |

### 4. Comments & Likes
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Add Comment | `{ "targetType": "note", "targetId": "{{noteId}}", "content": "..." }` | `201` — sets `commentId` | ✅ |
| Get Comments | none | `200` — includes the new comment with `userSnapshot` | ✅ |
| Toggle Like — On | none | `200` — check `liked: true` | ✅ |
| Toggle Like — Off | none | `200` — check `liked: false` | ✅ |
| Delete Comment | none | `200` | ✅ |
| [Error] Add Comment — Missing Content | `{ "targetType", "targetId" }` only | `400` | ✅ |
| [Error] Add Comment — Invalid targetType | `{ "targetType": "invalid", ... }` | `400` | ✅ |

### 5. Resumes
*(Requires a real PDF file — select it manually in the Upload Resume request)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Upload Resume | form-data: `resume` = any PDF file | `201` — sets `resumeId` | ✅ |
| List Resumes | none | `200` | ✅ |
| Generate AI Feedback | none | `200` — takes 2-5s (Groq API call) — check `overallScore`, `strengths`, `improvements` | ✅ |
| Get Feedback History | none | `200` — `feedback` array with the generated entry | ✅ |
| **Download Resume** | none | `200` — `downloadUrl` is a Cloudinary `fl_attachment` URL | |
| [Error] Upload Non-PDF | form-data: `resume` = any non-PDF file | `400` | ✅ |
| **[Error] Delete Resume — Wrong User** | none (runs as User 2) | `404` — resume belongs to User 1 | |
| **Delete Resume** | none | `200` — `resumeId` env variable cleared | |
| **[Error] Delete Resume — Not Found** | none (uses `000000000000000000000000`) | `404` | |

### 6. Applications
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Application | `{ "company", "position", "location", "status", "appliedAt", "notes" }` | `201` — sets `applicationId` | ✅ |
| List Applications | none | `200` | ✅ |
| List Applications — Status Filter | query: `?status=applied` | `200` | ✅ |
| List Applications — Search Filter | query: `?search=Google` | `200` | ✅ |
| Update Application | `{ "status": "interview", "notes": "..." }` | `200` — check `status` updated | ✅ |
| Get Dashboard | none | `200` — check `pipeline` object with counts per status | ✅ |
| Add Contact | `{ "name", "role", "email", "linkedIn", "notes" }` | `201` — contact appears in `application.contacts` | ✅ |
| Add Reminder | `{ "date", "description" }` | `201` — reminder appears in `application.followUpReminders` | ✅ |
| [Error] Create — Missing company | `{ "position": "..." }` only | `400` | ✅ |
| [Error] Create — Missing position | `{ "company": "..." }` only | `400` | ✅ |

### 7. Shared Tasks
*(Requires friendship to be accepted — run 2. Friends first)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Shared Task | `{ "title", "dueDate", "isShared": true, "participants": [{ "userId": "{{secondUserId}}" }] }` | `201` — sets `sharedTaskId`, `participants` array populated | ✅ |
| Get Shared Tasks — as User 2 | none | `200` — shared task appears | ✅ |
| Update Participant Status — as User 2 | `{ "status": "in_progress" }` | `200` — User 2's participant entry updated | ✅ |
| Get Calendar — verify shared task (User 2) | query: `?from=2026-03-01&to=2026-03-31&view=month` | `200` — shared task appears in `days` | ✅ |
| [Error] Participant Status — Invalid Value | `{ "status": "done" }` | `400` | ✅ |
| [Error] Non-Participant Update | `{ "status": "completed" }` (as User 1, on shared task) | `404` — User 1 is the owner, not a participant | ✅ |

---

## Tips

- Run folder **0. Setup** first every time — it ensures `token`, `userId`, `secondToken`, `secondUserId` are all set
- **Remove Friend** (bottom of folder 2) must be run **after** folders 3 and 7 — specific note sharing and shared tasks require an active friendship
- Resume upload requires a real PDF file — select it manually via the file chooser in Postman
- Delete Resume runs last in the Resumes folder — it clears `resumeId`
- The AI Feedback request (Resumes) takes 2-5 seconds — this is normal (Groq API call)

---

# Postman Testing — Session 6

API-20 through API-21: Messaging (Conversations + Messages).

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session6.postman_collection.json`
- The environment (`continuum-local.postman_environment.json`) is shared — re-import it to pick up the new variables, or re-use the existing one

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Environment Variables

New variables added for session 6. All are auto-set by test scripts.

| Variable         | Set by                  | Used by                                    |
|------------------|-------------------------|--------------------------------------------|
| `conversationId` | Start Conversation      | Send Message, Get Messages, Mark as Read   |
| `messageId`      | Send Message — User 1   | Mark as Read                               |
| `messageSentAt`  | Send Message — User 1   | Get Messages — Paginated (`before` cursor) |

---

## Test Order

Run folders top to bottom.

### 0. Setup — Second User
*(Run these first, in order)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login User 1 | `{ "email", "password" }` | `200` — sets `token` + `userId` | ✅ |
| Login User 2 | `{ "email", "password" }` | `200` — sets `secondToken` + `secondUserId` | ✅ |

### 1. Conversations
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Start Conversation | `{ "participantId": "{{secondUserId}}" }` | `201` — sets `conversationId`, participants populated | ✅ |
| Start Conversation Again — Idempotent | `{ "participantId": "{{secondUserId}}" }` | `200` — returns existing conversation | ✅ |
| Get Inbox | none | `200` — conversation appears in array | ✅ |

### 2. Messages
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Send Message — User 1 | `{ "content": "..." }` | `201` — sets `messageId` + `messageSentAt`, check `lastMessage` on conversation | ✅ |
| Send Message — User 2 | `{ "content": "..." }` | `201` — check User 1's `unreadCounts` incremented | ✅ |
| Get Messages | none | `200` — both messages in array (newest first), check `hasMore: false` | ✅ |
| Get Messages — Paginated | query: `?limit=1&before={{messageSentAt}}` | `200` — cursor working, empty array when no older messages exist | ✅ |
| Mark as Read — User 1 | none | `200` — check `readBy` includes User 1, unread count reset to `0` | ✅ |
| Get Inbox — Verify lastMessage Updated | none | `200` — `lastMessage.content` matches last sent message | ✅ |

### 3. Error Cases
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| [Error] Start Conversation — Missing participantId | `{}` | `400` | ✅ |
| [Error] Start Conversation — Send to Self | `{ "participantId": "{{userId}}" }` | `400` | ✅ |
| [Error] Send Message — Empty Content | `{ "content": "" }` | `400` | ✅ |
| [Error] Get Messages — No Token | none | `401` | ✅ |
| [Error] Mark as Read — Not Found | none | `404` | ✅ |

---

## Tips

- Run folder **0. Setup** first every time — both users need fresh tokens
- `messageSentAt` is the `createdAt` of User 1's first message — used as the `before` cursor for pagination testing
- User 2 is already registered from session 5 — use **Login User 2** instead of Register

---

# Postman Testing — Session 7

API-22: Refresh Tokens (Multi-Device Auth). API-27: Email Verification.

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session7.postman_collection.json`
- Re-import `continuum-local.postman_environment.json` to pick up the new variables

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Environment Variables

New variables added for session 7. Token variables are auto-set by test scripts. `verificationToken` must be set manually.

| Variable                  | Set by                  | Used by                                  |
|---------------------------|-------------------------|------------------------------------------|
| `refreshToken`            | Login / Re-Login        | Refresh, Logout, post-logout error cases |
| `secondDeviceRefreshToken`| Login — Second Device   | Logout All verification                  |
| `verificationToken`       | **Set manually** from email link | Verify Email request            |

---

## Test Order

### 1. Login & Register
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login | `{ "email", "password", "deviceId": "Postman — Desktop" }` | `200` — sets `token`, `refreshToken` — check `refreshToken` in response | ✅ |
| Login — Second Device | `{ "email", "password", "deviceId": "Postman — Mobile Sim" }` | `200` — sets `secondDeviceRefreshToken` | ✅ |

### 2. Refresh Token
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Refresh — Get New Access Token | `{ "refreshToken": "{{refreshToken}}" }` | `200` — new `token` returned, auto-set | ✅ |
| Get Me — Verify New Token Works | none | `200` — confirms new access token is valid | ✅ |

### 3. Logout (Single Device)
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Logout | `{ "refreshToken": "{{refreshToken}}" }` | `200` — "Logged out" | ✅ |
| [Error] Refresh After Logout — Revoked | `{ "refreshToken": "{{refreshToken}}" }` | `401` — token revoked | ✅ |
| Second Device — Still Works After Single Logout | `{ "refreshToken": "{{secondDeviceRefreshToken}}" }` | `200` — other device unaffected | ✅ |

### 4. Logout All Devices
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Re-Login to Get Fresh Tokens | `{ "email", "password" }` | `200` — resets `token` + `refreshToken` | ✅ |
| Logout All | none | `200` — "Logged out of all devices" | ✅ |
| [Error] Refresh — Device 1 Revoked by Logout All | `{ "refreshToken": "{{refreshToken}}" }` | `401` | ✅ |
| [Error] Refresh — Device 2 Revoked by Logout All | `{ "refreshToken": "{{secondDeviceRefreshToken}}" }` | `401` | ✅ |

### 5. Email Verification

> **Setup:** After running "Send Verification Email", copy the `?token=` value from the link in your inbox (or from the backend console log if Resend is in test mode) and paste it into the `verificationToken` environment variable before running "Verify Email".

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| **Send Verification Email** | none | `200` — email sent via Resend | |
| **Verify Email** | query: `?token={{verificationToken}}` | `200` — `emailVerified: true` written to MongoDB | |
| **[Error] Send Verification — Already Verified** | none | `400` — "already verified" | |
| **[Error] Verify Email — Invalid Token** | query: `?token=thisisnotavalidtoken` | `400` | |
| **[Error] Verify Email — Missing Token** | no query param | `400` | |
| **[Error] Send Verification — No JWT** | none (no `Authorization` header) | `401` | |

### 6. Error Cases
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| [Error] Refresh — Missing refreshToken | `{}` | `400` | ✅ |
| [Error] Refresh — Invalid Token | `{ "refreshToken": "thisisnotavalidtoken" }` | `401` | ✅ |
| [Error] Logout All — No Token | none | `401` | ✅ |

---

## Tips

- Run folders top to bottom — each folder depends on the state set by the previous one
- `deviceId` is optional on login/register — if omitted it's stored as `null` but the token still works
- The "Second Device — Still Works After Single Logout" test proves per-device isolation — the key benefit of this design
- For email verification in dev, check your Resend dashboard (test mode) or backend `console.log` to get the raw token if the email is not delivered to your inbox

---

# Postman Testing — Session 8

API-23: Profile Update | API-24: Activity Feed | API-25: Flashcard Set Sharing | API-26: Sync Queue.

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session8.postman_collection.json`
- Re-import `continuum-local.postman_environment.json` to pick up the new `activityId` variable

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Prerequisites

- **Flashcard sharing tests** require `flashcardSetId` and `secondUserId` to be set, and User A and User B must be accepted friends
- **Note sharing & task participant tests** require User A and User B to be accepted friends
- Run session 5 setup first if starting fresh (Login User 1 + Login User 2 + Accept Friend Request)
- `taskId` and `noteId` must be set for the Sync Queue batch test — re-run Create Task and Create Note from session 3-4 if needed

---

## Environment Variables

New variables added for session 8. Auto-set by test scripts.

| Variable       | Set by                                 | Used by                                    |
|----------------|----------------------------------------|--------------------------------------------|
| `activityId`   | Get Activity Feed (if feed non-empty)  | Reference only                             |
| `shareNoteId`  | Create Note (for sharing tests)        | Note sharing, unshare, auto-message tests  |
| `shareTaskId`  | Create Shared Task with User B         | PATCH participants, shared tasks tests     |

---

## Test Order

Run folders top to bottom.

### 1. Login
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login — User A | `{ "email", "password" }` | `200` — sets `token` + `userId` + `refreshToken` | ✅ |
| Login — User B | `{ "email", "password" }` (second account) | `200` — sets `secondToken` + `secondUserId` | ✅ |

### 2. Profile Update (API-23)
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Update Profile — Text Fields | form-data: `firstName`, `bio` | `200` — updated fields in response | ✅ |
| Update Profile — activityVisibility: friends | form-data: `settings.activityVisibility = friends` | `200` — setting updated | ✅ |
| Update Profile — activityVisibility: public | form-data: `settings.activityVisibility = public` | `200` — setting updated | ✅ |
| [Error] Invalid activityVisibility | form-data: `settings.activityVisibility = everyone` | `400` | ✅ |
| [Error] No Token | form-data: `firstName` | `401` | ✅ |

### 3. Activity Feed (API-24)
*(Set `activityVisibility` to `friends` or `public` first — private produces no activities)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Activity Feed — Default | none | `200` — `feed` array, each entry has `userId` populated | ✅ |
| Get Activity Feed — Paginated (limit=5, offset=0) | query: `?limit=5&offset=0` | `200` | ✅ |
| Get Activity Feed — Page 2 (offset=5) | query: `?limit=5&offset=5` | `200` — empty or next page | ✅ |
| [Error] No Token | none | `401` | ✅ |

### 4. Flashcard Set Sharing (API-25)
*(Requires User A and User B to be friends, and `flashcardSetId` to be set)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Share Set — friends | `{ "visibility": "friends" }` | `200` | ✅ |
| Get Shared Sets — as User B (friends) | none (User B token) | `200` — User A's set in results | ✅ |
| Share Set — specific (User B) | `{ "visibility": "specific", "sharedWith": ["{{secondUserId}}"] }` | `200` | ✅ |
| Get Shared Sets — as User B (specific) | none (User B token) | `200` — set still visible | ✅ |
| Revert to private | `{ "visibility": "private" }` | `200` | ✅ |
| Get Shared Sets — as User B (empty) | none (User B token) | `200` — empty array | ✅ |
| [Error] Invalid visibility | `{ "visibility": "everyone" }` | `400` | ✅ |
| [Error] specific with non-friend | `{ "visibility": "specific", "sharedWith": ["000000000000000000000001"] }` | `400` | ✅ |
| [Error] No Token | `{ "visibility": "friends" }` | `401` | ✅ |

### 5. Sync Queue (API-26)
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Sync — Create Note Offline | `{ operations: [create note] }` | `200` — entry `status: completed` | ✅ |
| Sync — Update Task Offline | `{ operations: [update task] }` | `200` — entry `status: completed` | ✅ |
| Sync — Mixed Batch | `{ operations: [create + update + delete] }` | `200` — all three entries in results | ✅ |
| Sync — Update on Deleted Doc | `{ operations: [update non-existent note] }` | `200` — entry `status: completed` (silent discard) | ✅ |
| Sync — Delete Already-Deleted Doc | `{ operations: [delete already-deleted note] }` | `200` — entry `status: completed` (idempotent) | ✅ |
| [Error] Invalid collection | `{ operations: [create resumes] }` | `200` — first entry `status: failed`, second entry `status: completed` | ✅ |
| [Error] Message update | `{ operations: [update message] }` | `200` — entry `status: failed` ("Message updates are not supported") | ✅ |
| [Error] Empty operations array | `{ "operations": [] }` | `400` | ✅ |
| [Error] No Token | operations array | `401` | ✅ |

### 6. Note Sharing & Auto-Message (API-27)
*(Requires User A and User B to be accepted friends)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Note (for sharing tests) | `{ "title", "content", "contentType", "tags" }` | `201` — sets `shareNoteId` | |
| Share Note — specific (User B) | `{ "visibility": "specific", "sharedWith": ["{{secondUserId}}"] }` | `200` | |
| Get Shared Notes — as User B (should see note) | none (User B token) | `200` — note appears in results | |
| Get Note by ID — as User B (shared access) | none (User B token, `shareNoteId`) | `200` — non-owner can view shared note | |
| Verify Auto-Message — User B inbox | none (User B token) | `200` — `lastMessage.content` contains `[shared:note:` | |
| Unshare Note — remove User B | `{ "visibility": "specific", "sharedWith": [] }` | `200` | |
| Get Shared Notes — as User B (empty after unshare) | none (User B token) | `200` — note no longer in results | |
| Verify Activity — note_shared entry exists | none | `200` — feed contains `type: note_shared` | |

### 7. Task Participant Management (API-28)
*(Requires User A and User B to be accepted friends)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Create Shared Task with User B | `{ "title", "dueDate", "isShared": true, "participants": [{ "userId" }] }` | `201` — sets `shareTaskId` | |
| Get Shared Tasks — as User B (should see task) | none (User B token) | `200` — task appears | |
| Verify Auto-Message — User B inbox (task) | none (User B token) | `200` — `lastMessage.content` contains `[shared:task:` | |
| PATCH Participants — remove User B | `{ "participants": [] }` | `200` — `isShared: false` | |
| Get Shared Tasks — as User B (empty after removal) | none (User B token) | `200` — task no longer in results | |
| PATCH Participants — re-add User B | `{ "participants": [{ "userId": "{{secondUserId}}" }] }` | `200` — `isShared: true` | |
| Get Shared Tasks — as User B (visible again) | none (User B token) | `200` — task appears | |
| Verify Activity — task_created entry exists | none | `200` — feed contains `type: task_created` | |
| [Error] PATCH Participants — non-friend userId | `{ "participants": [{ "userId": "000000000000000000000001" }] }` | `400` | |
| [Error] PATCH Participants — No Token | `{ "participants": [] }` | `401` | |

---

## Tips

- Run folder **1. Login** first every time — all other folders depend on fresh tokens
- Profile update uses `multipart/form-data` (not JSON) — the body type in Postman must be set to **form-data**
- Activity feed will return empty if `activityVisibility` is still `private` — run "Set activityVisibility to friends" first, then trigger an activity (e.g. share a note), then check the feed
- Flashcard sharing tests depend on an active friendship between User A and User B — run session 5 friend flow if starting fresh
- Note sharing and task participant tests also require an active friendship — run session 5 friend flow if starting fresh
- The sync "Update on Deleted Doc" and "Delete Already-Deleted" requests intentionally return `status: completed` — this is correct social-app behavior, not a bug
- Auto-message tests check `GET /conversations` for `[shared:type:id]` prefix in `lastMessage.content`

---

# Postman Testing — Session 9

API-29: Server-Side Search across all list endpoints — shared tasks, shared flashcard sets, friends, conversations inbox, in-conversation messages, and activity feed.

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session9.postman_collection.json`
- Re-import `continuum-local.postman_environment.json` to ensure all variables are up to date

### 2. Select the environment
- Top-right corner of Postman — switch the dropdown to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Prerequisites

- User A and User B must be accepted friends
- User A must have created tasks (including at least one shared with User B) and flashcard sets
- User A must have shared at least one note with User B (so User B has shared notes/sets to search)
- User B must have a conversation with User A containing multiple messages
- `flashcardSetId`, `taskId`, `noteId`, `conversationId`, `secondUserId` must all be set
- Run **Login** folders first to get fresh tokens before running any search tests

---

## Environment Variables

No new variables — session 9 reuses existing ones.

| Variable         | Required from        |
|------------------|----------------------|
| `token`          | Login User A         |
| `secondToken`    | Login User B         |
| `conversationId` | Session 6            |
| `flashcardSetId` | Session 3-4 or 8     |
| `taskId`         | Session 3-4          |

---

## Test Order

Run folders top to bottom. Folder 0 must run first.

### 0. Setup
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login — User A | `{ "email", "password" }` | `200` — sets `token` + `userId` | |
| Login — User B | `{ "email", "password" }` | `200` — sets `secondToken` + `secondUserId` | |

### 1. Shared Tasks — Search
*(User B must be a participant on at least one of User A's tasks)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Shared Tasks — No Search (User B) | none | `200` — full list of shared tasks | |
| Get Shared Tasks — Search Hit (User B) | query: `?search=<word from a shared task title>` | `200` — only matching tasks returned | |
| Get Shared Tasks — Search Miss (User B) | query: `?search=zzznomatchzzz` | `200` — empty `tasks` array | |
| [Error] Get Shared Tasks — No Token | none | `401` | |

### 2. Shared Flashcard Sets — Search
*(User A must have shared at least one set with User B)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Shared Sets — No Search (User B) | none | `200` — full list of shared sets | |
| Get Shared Sets — Search Hit (User B) | query: `?search=<word from a shared set title>` | `200` — only matching sets returned | |
| Get Shared Sets — Search Miss (User B) | query: `?search=zzznomatchzzz` | `200` — empty `sets` array | |
| [Error] Get Shared Sets — No Token | none | `401` | |

### 3. Friends — Search
*(User A and User B must be accepted friends)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| List Friends — No Search | none | `200` — full friends list | |
| List Friends — Search by First Name | query: `?search=<User B firstName>` | `200` — only matching friendship returned | |
| List Friends — Search by Username | query: `?search=<User B username>` | `200` — matching friendship returned | |
| List Friends — Search Miss | query: `?search=zzznomatchzzz` | `200` — empty `friendships` array | |
| List Friends — Search does not apply to pending (status=pending) | query: `?status=pending&search=anything` | `200` — search param ignored for pending tab | |
| [Error] List Friends — No Token | none | `401` | |

### 4. Conversations — Search by Participant Name
*(User A must have a conversation with User B)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Conversations — No Search | none | `200` — full inbox | |
| Get Conversations — Search Hit | query: `?search=<User B firstName or username>` | `200` — conversation with User B returned | |
| Get Conversations — Search Miss | query: `?search=zzznomatchzzz` | `200` — empty `conversations` array | |
| [Error] Get Conversations — No Token | none | `401` | |

### 5. In-Conversation Messages — Search by Content
*(Conversation must have at least a few messages)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Messages — No Search | none | `200` — all messages in conversation | |
| Get Messages — Search Hit | query: `?search=<word that appears in a message>` | `200` — only matching messages returned | |
| Get Messages — Search Miss | query: `?search=zzznomatchzzz` | `200` — empty `messages` array, `hasMore: false` | |
| [Error] Get Messages — No Token | none | `401` | |
| [Error] Get Messages — Not a Participant | none (use User C token if available, or a fake conversationId) | `403` or `404` | |

### 6. Activity Feed — Search by Actor Name or Metadata
*(Feed must contain at least some activities. Two-step lookup: matches users by firstName/lastName/username first, then returns activities where `userId` is in that set OR any metadata field matches.)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Activity Feed — No Search | none | `200` — full feed | |
| Get Activity Feed — Search by Actor Name | query: `?search=<User B firstName or username>` | `200` — activities where User B is the actor returned | |
| Get Activity Feed — Search by Note Title | query: `?search=<word from a shared note title>` | `200` — matching `note_shared` activities returned | |
| Get Activity Feed — Search by Set Title | query: `?search=<word from a shared flashcard set title>` | `200` — matching `flashcard_shared` activities returned | |
| Get Activity Feed — Search by Task Title | query: `?search=<word from a shared task title>` | `200` — matching `task_created` activities returned | |
| Get Activity Feed — Search by Comment Preview | query: `?search=<word from a comment>` | `200` — matching `comment_added` activities returned | |
| Get Activity Feed — Search Miss | query: `?search=zzznomatchzzz` | `200` — empty `feed` array, `total: 0` | |
| Get Activity Feed — Search with Pagination | query: `?search=<keyword>&limit=5&offset=0` | `200` — paginated search results | |
| [Error] Get Activity Feed — No Token | none | `401` | |

### 7. Resumes — Search
*(User A must have uploaded at least one resume)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Get Resumes — No Search | none | `200` — full list of resumes | |
| Get Resumes — Search by File Name | query: `?search=<word from resume fileName>` | `200` — only matching resumes returned | |
| Get Resumes — Search by Target Role | query: `?search=<targetRole keyword>` | `200` — only matching resumes returned | |
| Get Resumes — Search Miss | query: `?search=zzznomatchzzz` | `200` — empty `resumes` array | |
| [Error] Get Resumes — No Token | none | `401` | |

---

## Tips

- Run folder **0. Setup** first — fresh tokens are required for all requests
- Search is case-insensitive on all endpoints — `?search=test` matches `Test`, `TEST`, `testing`
- Friends search only applies to `status=accepted` (the friends tab) — pending/sent request lists ignore the `search` param
- Activity search uses a two-step lookup: first finds users matching the term by `firstName`/`lastName`/`username`, then returns activities where the actor is one of those users OR any metadata field (`noteTitle`, `setTitle`, `taskTitle`, `commentPreview`) matches the regex
- In-conversation message search disables the 5-second polling interval on the frontend while active
- If the activity feed is empty, trigger some sharing activity first: share a note with User B, then check the feed
- Resume search matches against `fileName`, `version`, and `targetRole` — does NOT search extracted PDF text

---

# Postman Testing — Session 10

API-30: Change Username | API-31: Change Password — new settings endpoints added in the settings revamp.

---

## Setup

### 1. Import the collection
- Open Postman → **Collections** tab → **Import** → select `continuum-session10.postman_collection.json`
- Environment: `continuum-local.postman_environment.json` (no new variables needed)

### 2. Select the environment
- Top-right corner of Postman — switch to **Continuum — Local**

### 3. Start the backend server
```bash
cd backend && npm run dev
```

---

## Prerequisites

- User A (`test@example.com` / `Password123!`) must exist with email/password credentials
- User B (`test2@example.com`) must exist so the "username taken" test has a real conflict
- Run **Login** first to get a fresh token before the username/password tests

---

## Environment Variables

No new variables — Session 10 reuses existing ones.

| Variable   | Set by     |
|------------|------------|
| `token`    | Login User A |
| `userId`   | Login User A |

---

## Test Order

Run folders top to bottom. Folder 1 must run first.

### 1. Login
| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Login — User A | `{ "email", "password" }` | `200` — sets `token` + `userId` | |

### 2. Change Username (API-30)
*(User A must not already have username `testuser_new`; User B must have username `testuser2` for the conflict test)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Change Username — valid | `{ "username": "testuser_new" }` | `200` — returns updated user with new username | |
| Change Username — restore original | `{ "username": "testuser" }` | `200` — username restored | |
| [Error] Too short (< 3 chars) | `{ "username": "ab" }` | `400` — format validation error | |
| [Error] Invalid characters (spaces) | `{ "username": "invalid username" }` | `400` — format validation error | |
| [Error] Username already taken | `{ "username": "testuser2" }` | `409` — "Username is already taken" | |
| [Error] No token | `{ "username": "newname" }` | `401` | |

### 3. Change Password (API-31)
*(Run in order — changes password then restores it so other sessions still work)*

| Request | Body Input | Expected | Tested |
|---------|------------|----------|--------|
| Change Password — valid | `{ currentPassword, newPassword: "NewPassword456@" }` | `200` — success | |
| Change Password — restore original | `{ currentPassword: "NewPassword456@", newPassword: "Password123!" }` | `200` — password restored | |
| [Error] Wrong current password | `{ currentPassword: "WrongPassword999!", newPassword }` | `401` — "Current password is incorrect" | |
| [Error] New password no special char | `{ currentPassword, newPassword: "weakpassword1" }` | `400` — validation error | |
| [Error] New password too short | `{ currentPassword, newPassword: "Ab1!" }` | `400` — validation error | |
| [Error] Missing newPassword field | `{ currentPassword }` | `400` | |
| [Error] No token | full body | `401` | |

---

## Tips

- Run the Change Password tests in order — they mutate and then restore the password so downstream sessions aren't broken
- The "restore original" requests are intentionally included so test data stays clean after the session runs
- Username validation: 3–30 chars, letters/numbers/underscores/hyphens only — spaces, dots, and special chars are rejected with 400
- Google-only users (no password set) receive a `400` with message "No password set — use Forgot Password to create one first" if they attempt the change-password endpoint
