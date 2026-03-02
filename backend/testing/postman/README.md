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
