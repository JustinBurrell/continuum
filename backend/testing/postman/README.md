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
| List Notes | none | `200` | ✅ |
| List Notes — Search | query: `?search=` | `200` | ✅ |
| List Notes — Tag Filter | query: `?tag=` | `200` | ✅ |
| Get Note by ID | none | `200` | ✅ |
| Update Note | `{ "title", "content" }` | `200` | ✅ |
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
| `resumeId`        | Upload Resume           | Feedback routes                              |
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
| [Error] Search — Missing Query | none | `400` | ✅ |

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
| [Error] Upload Non-PDF | form-data: `resume` = any non-PDF file | `400` | ✅ |

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
