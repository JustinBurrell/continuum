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
| Request | Expected |
|---------|----------|
| Register | `201` — sets `token` + `userId` |
| Login | `200` — re-sets `token` + `userId` |
| Get Me | `200` — confirms token works |
| Forgot Password | `200` |
| Reset Password | `200` (use token from email) |
| [Error] Login — Wrong Password | `401` |
| [Error] Get Me — No Token | `401` |

### 2. Notes
| Request | Expected |
|---------|----------|
| Create Note | `201` — sets `noteId` |
| List Notes | `200` |
| List Notes — Search | `200` |
| List Notes — Tag Filter | `200` |
| Get Note by ID | `200` |
| Update Note | `200` |
| [Error] Get Note — Not Found | `404` |
| Delete Note | `200` *(run last in this folder)* |

### 3. AI Summary
*(Run before deleting the note)*

| Request | Expected |
|---------|----------|
| Generate Summary | `200` — takes a few seconds (Groq API call) |
| Get Cached Summary | `200` — response includes `cached: true` |
| Force Regenerate Summary | `200` — regenerates even if cached |

### 4. Flashcard Sets
| Request | Expected |
|---------|----------|
| Generate from Note | `201` — sets `flashcardSetId` |
| Generate from Content | `201` |
| Create Set Manually | `201` |
| List Sets | `200` |
| Get Set by ID | `200` — includes populated cards array |
| Add Card | `201` — sets `flashcardId` |
| Update Card | `200` |
| Update Progress — Correct + Confidence | `200` |
| Update Progress — Incorrect, No Confidence | `200` |
| Delete Card | `200` |
| Delete Set | `200` |
| [Error] Generate — Missing Content | `400` |
| [Error] Add Card — Missing back | `400` |
| [Error] Update Progress — Non-Boolean correct | `400` |

### 5. Tasks
| Request | Expected |
|---------|----------|
| Create Task | `201` — sets `taskId` |
| List Tasks | `200` |
| List Tasks — Status Filter | `200` |
| List Tasks — Date Range | `200` |
| Get Task by ID | `200` |
| Update Task | `200` |
| Update Status — in_progress | `200` |
| Update Status — completed | `200` — check `completedAt` is set in response |
| Update Status — back to todo | `200` — check `completedAt` is null |
| Delete Task | `200` |
| [Error] Create Task — Missing dueDate | `400` |
| [Error] Update Status — Invalid Value | `400` |

### 6. Calendar
| Request | Expected |
|---------|----------|
| Get Calendar — Week View | `200` — tasks grouped by date in `days` object |
| Get Calendar — Month View | `200` |
| [Error] Calendar — Missing from/to | `400` |
| [Error] Calendar — Invalid Dates | `400` |

### 7. Google Drive
*(Requires a linked Google account — skip if not set up)*

| Request | Expected |
|---------|----------|
| List Drive Files | `200` — returns list of Google Docs |
| Import Google Doc | `201` — paste a real `googleDocId` in the body |
| Refresh Note from Google Doc | `200` |

---

## Tips

- If a request fails with `401 Unauthorized`, your token may have expired — re-run **Login** to refresh it
- If a request fails with `404 Not Found`, the ID variable may be stale — re-run the creation request for that resource
- The Groq summary and flashcard generation requests take 2-5 seconds — this is normal
