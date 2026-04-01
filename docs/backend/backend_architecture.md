# Continuum Backend Architecture

**Stack**: Node.js + Express 5 + Mongoose 9 + MongoDB Atlas
**Auth**: JWT (jsonwebtoken) + Google OAuth (passport-google-oauth20)
**AI**: Groq API (Llama 3.1)
**File Storage**: Cloudinary (resume PDFs)
**Deployment**: Railway or Render

---

## Project Structure

```
backend/
├── config/
│   ├── database.js               # MongoDB connection
│   ├── cloudinary.js             # Cloudinary client setup
│   └── passport.js               # Google OAuth strategy (passport-google-oauth20)
├── middleware/
│   └── auth.middleware.js        # JWT verification — attaches req.user
├── models/
│   ├── User.js
│   ├── RefreshToken.js           # Multi-device refresh tokens (SHA-256 hash, 30d expiry)
│   ├── Note.js
│   ├── FlashcardSet.js
│   ├── Flashcard.js
│   ├── StudySession.js           # Study streak + session history
│   ├── Task.js
│   ├── Friendship.js
│   ├── Comment.js
│   ├── Resume.js
│   ├── Application.js
│   ├── Conversation.js
│   ├── Message.js
│   ├── SyncQueue.js              # Stretch: offline operation queue
│   └── Activity.js               # Stretch: activity feed events
├── controllers/
│   ├── auth.controller.js
│   ├── notes.controller.js
│   ├── flashcardSets.controller.js
│   ├── studySessions.controller.js # Study session submit, history, streak
│   ├── tasks.controller.js
│   ├── calendar.controller.js
│   ├── users.controller.js
│   ├── friends.controller.js
│   ├── comments.controller.js
│   ├── resumes.controller.js
│   ├── applications.controller.js
│   ├── conversations.controller.js
│   ├── messages.controller.js
│   ├── google.controller.js
│   ├── sync.controller.js        # Stretch: sync queue processing
│   └── activity.controller.js    # Stretch: activity feed
├── routes/
│   ├── auth.routes.js            # /api/auth/*
│   ├── notes.routes.js           # /api/notes/*
│   ├── google.routes.js          # /api/google/*
│   ├── flashcardSets.routes.js   # /api/flashcard-sets/*
│   ├── studySessions.routes.js   # /api/study-sessions/*
│   ├── tasks.routes.js           # /api/tasks/*
│   ├── calendar.routes.js        # /api/calendar
│   ├── friends.routes.js         # /api/friends/*
│   ├── users.routes.js           # /api/users/*
│   ├── comments.routes.js        # /api/comments/*
│   ├── resumes.routes.js         # /api/resumes/*
│   ├── applications.routes.js    # /api/applications/*
│   ├── conversations.routes.js   # /api/conversations/*
│   ├── messages.routes.js        # /api/messages/*
│   ├── sync.routes.js            # /api/sync (stretch)
│   └── activity.routes.js        # /api/activity (stretch)
├── services/
│   ├── groq.service.js           # Groq API client + prompt templates
│   ├── google.service.js         # Google Drive/Docs API client
│   ├── cloudinary.service.js     # Cloudinary upload helper
│   └── studyStreak.service.js    # computeStreak / getCachedStreak / invalidateStreakCache
├── tests/
│   ├── jest/                     # Jest + Supertest integration tests (8 suites)
│   │   ├── setup.js              # Env vars + skip flags loaded before every suite
│   │   ├── testDb.js             # mongodb-memory-server connect/clear/close helpers
│   │   ├── testHelpers.js        # registerAndLogin() — creates user, returns token
│   │   ├── auth.test.js
│   │   ├── notes.test.js
│   │   ├── tasks.test.js
│   │   ├── flashcards.test.js
│   │   ├── study-sessions.test.js
│   │   ├── applications.test.js
│   │   ├── messages.test.js
│   │   └── activity.test.js
│   ├── mongodb/                  # Seed scripts for dev/demo data
│   └── postman/                  # Postman collections + environment file
├── .env
├── .env.example
├── .gitignore
├── app.js                        # Express app (middleware + routes) — no DB, no listen
├── package.json
└── server.js                     # Entry point: imports app.js, connects DB, starts HTTP server
```

### Why This Structure

- **`app.js`** — Pure Express app: registers middleware and routes. No DB connection, no `listen()`. Imported by `server.js` for production and by Jest test files directly, which lets tests start the app without a real database or port.
- **`server.js`** — Entry point only. Imports `app.js`, calls `connectDB()`, calls `initSocket()`, then `listen()`. Never imported by tests.
- **`lib/`** — Shared infrastructure singletons: `logger.js` (pino) and `socket.js` (Socket.io + Redis adapter). Kept separate from `config/` because these are runtime instances, not connection setup.
- **`routes/`** — Define HTTP endpoints. Thin layer: parse request, call model/service, send response.
- **`models/`** — Mongoose schemas with validation, hooks, virtuals, indexes. Business logic lives here.
- **`middleware/`** — Reusable request pipeline functions (auth, rate limiting, ObjectId validation).
- **`services/`** — External API integrations (Groq, Google, Cloudinary). Keeps routes clean.
- **`config/`** — Connection setup for external services.
- **`tests/jest/`** — Jest + Supertest integration tests. Each suite gets an isolated in-memory MongoDB via `mongodb-memory-server`. See [testing.md](testing.md) for how to add new tests.

---

## Authentication Flow

### Two Ways to Authenticate

Users can register/login with **email/password** OR **Google OAuth**. Both create the same User document and return a JWT. The key difference: Google OAuth users automatically have Google Drive/Docs access. Email/password users can link Google later.

### JWT (Email/Password)

```
Register:
  Client POST /api/auth/register { email, username, password, deviceId? }
  → Validate input
  → Check email/username uniqueness
  → Create User (password hashed via pre-save hook)
  → Sign JWT with { userId }
  → Generate RefreshToken (SHA-256 hash stored in DB, raw returned to client)
  → Return { token, refreshToken, user }
  (Google NOT linked — user.googleId is null)

Login:
  Client POST /api/auth/login { email, password, deviceId? }
  → Find user by email (select: '+password')
  → Compare password with bcrypt
  → Sign JWT with { userId }
  → Generate RefreshToken
  → Return { token, refreshToken, user }

Protected Request:
  Client sends header: Authorization: Bearer <token>
  → auth.js middleware extracts token
  → jwt.verify(token, JWT_SECRET)
  → Find user by decoded userId
  → Attach user to req.user
  → Next middleware/route handler
```

### JWT Token Details

- **Library**: `jsonwebtoken`
- **Payload**: `{ userId: user._id }`
- **Access token expiry**: Controlled by `JWT_EXPIRES_IN` env var (default: `1d`)
- **Refresh token expiry**: 30 days — stored in `RefreshToken` collection as SHA-256 hash
- **Storage (Web)**: `localStorage` for access token; refresh token stored client-side and sent in request body
- **Storage (Mobile)**: Expo `SecureStore` for both tokens

### Refresh Token Flow

```
Login / Register:
  → Returns { token (1d JWT), refreshToken (30d raw token), user }
  → Raw refresh token is stored client-side; SHA-256 hash stored in RefreshToken collection

When access token expires:
  Client POST /api/auth/refresh { refreshToken }
  → Server hashes incoming token → looks up in RefreshToken collection
  → Validates: exists, revokedAt is null, expiresAt > now
  → Returns new { token } (refresh token is NOT rotated)

Logout (single device):
  Client POST /api/auth/logout { refreshToken }
  → Sets revokedAt on the matching RefreshToken document

Logout all devices:
  Client POST /api/auth/logout-all (JWT required)
  → Sets revokedAt on ALL active RefreshToken documents for the user
```

Each device gets its own `RefreshToken` document. Single-device logout only revokes that device's token — other devices remain active. `deviceId` is an optional label (e.g., "iPhone 14", "Chrome on macOS") stored on the token for future "manage devices" UI.

### Google OAuth (Login/Register)

```
1. Client clicks "Sign in with Google"
2. Client redirects to GET /api/auth/google
3. Server redirects to Google consent screen (passport-google-oauth20)
   → Scopes: profile, email, drive.readonly, documents.readonly
4. User grants permission
5. Google redirects to GET /api/auth/google/callback with auth code
6. Server exchanges code for Google tokens (access + refresh)
7. Server finds or creates User (match by googleId or email)
8. Server stores googleAccessToken and googleRefreshToken on User
9. Server signs JWT with { userId, email }
10. Server redirects to frontend with JWT as query param
    → e.g., http://localhost:5173/auth/callback?token=<jwt>
11. Frontend stores JWT, same as email/password flow
```

Google is automatically linked after this flow — Drive/Docs features work immediately.

### Google Account Linking (for email/password users)

```
Link:
  Client POST /api/me/google/link
  → Same OAuth flow as above, but instead of creating a new User:
  → Attach googleId, googleAccessToken, googleRefreshToken to EXISTING User
  → user.hasGoogleLinked virtual now returns true
  → Drive/Docs features unlocked

Unlink:
  Client DELETE /api/me/google/link { keepNotes: true/false }
  → If keepNotes=false: soft-delete all notes with googleDocId
  → If keepNotes=true: keep notes, clear googleDocId (standalone copies)
  → Clear googleId, googleAccessToken, googleRefreshToken from User
  → user.hasGoogleLinked = false → Drive/Docs features locked
```

**Frontend behavior**: Check `user.hasGoogleLinked` to show/hide Google Docs import buttons. If not linked, show a "Connect Google" prompt instead.

### Forgot Password

```
Request Reset:
  Client POST /api/auth/forgot-password { email }
  → Find user by email
  → user.createPasswordResetToken() → generates crypto token, stores hash + 1hr expiry
  → Send email via Resend with reset link:
    http://localhost:5173/reset-password?token=<plaintext_token>
  → Return success (even if email not found, to prevent enumeration)

Reset Password:
  Client POST /api/auth/reset-password { token, newPassword }
  → Hash the token from URL
  → Find user where passwordResetToken matches AND passwordResetExpires > now
  → Set new password (pre-save hook hashes it)
  → Clear passwordResetToken and passwordResetExpires
  → Return success (user logs in normally)
```

**Email service**: Resend — free tier (3,000 emails/month). Add `RESEND_API_KEY` to `.env`.

### Middleware Pattern

```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.deletedAt) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
```

---

## Error Handling

### Error Response Format

All errors follow the same shape (from API Reference Guide):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descriptive error message",
    "details": []
  }
}
```

### Custom Error Class

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = AppError;
```

### Error Codes

| Code | HTTP Status | When |
|------|------------|------|
| `VALIDATION_ERROR` | 400 | Bad input, missing fields, invalid format |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Valid JWT but no permission (not owner, not friend) |
| `NOT_FOUND` | 404 | Resource doesn't exist or was soft-deleted |
| `CONFLICT` | 409 | Duplicate email, existing friend request |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: { code: 'CONFLICT', message: `${field} already exists`, details: [] }
    });
  }

  // Custom AppError
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: [] }
    });
  }

  // Unexpected error
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', details: [] }
  });
};

module.exports = errorHandler;
```

Usage in `server.js`:
```javascript
const errorHandler = require('./middleware/errorHandler');

// ... all routes ...

// Must be AFTER all routes
app.use(errorHandler);
```

---

## Cloudinary Integration

### Purpose

Resume PDFs are uploaded to Cloudinary and stored as URLs in the Resume model's `fileUrl` field.

### Setup

```javascript
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Upload Flow

```
1. Client sends POST /api/resumes/upload (multipart/form-data)
   → File: resume.pdf
   → Body: { label, targetRole }
2. multer middleware parses file into buffer
3. Upload buffer to Cloudinary (folder: "continuum/resumes")
4. Cloudinary returns { secure_url, bytes, format }
5. Create Resume document with fileUrl = secure_url
6. Return resume metadata to client
```

### Dependencies

```bash
npm install cloudinary multer
```

`multer` handles multipart form parsing. Use memory storage (buffer) since files go straight to Cloudinary, not local disk.

### When to Set Up

- **Cloudinary config**: Phase 1 (when creating Resume model, DB-8)
- **Upload route**: Phase 2 (API-16: resume upload endpoint)
- **Activate your Cloudinary account** before Session 2

---

## Third-Party Services Summary

| Service | Purpose | Env Vars | When Needed |
|---------|---------|----------|-------------|
| MongoDB Atlas | Database | `MONGODB_URI` | Session 1 (ready) |
| Cloudinary | Resume PDF storage | `CLOUDINARY_*` | Session 2 (DB-8) / Session 5 (API-16) |
| Google OAuth | Authentication + Drive/Docs linking | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Session 3 (API-2) |
| Google Drive API | Note import | Uses Google OAuth tokens | Session 3 (API-5) |
| Groq | AI summaries, flashcards, resume feedback | `GROQ_API_KEY` | Session 4 (API-7) |
| Resend | Password reset emails | `RESEND_API_KEY` | Session 3 (API-1) |

---

## MongoDB Database Environments

The app uses a single Atlas cluster (`continuum-dev`) with two separate databases — one per environment. The database name is the path segment in `MONGODB_URI` before the `?`.

### Local Dev (test database)
```
MONGODB_URI=mongodb+srv://...@continuum-dev.iygdp9l.mongodb.net/test?appName=continuum-dev
```
- All dev, seed, and mock data lives here
- Safe to wipe and re-seed at any time

### Production (prod database)
```
MONGODB_URI=mongodb+srv://...@continuum-dev.iygdp9l.mongodb.net/prod?appName=continuum-dev
```
- Set this in the backend hosting platform's environment variable panel (Railway/Render)
- Never set in `.env` — that file is for local only
- Real user data lives here; never run seed scripts against it

### Future: Separate Prod Cluster
Atlas allows one free M0 cluster per project. You can create a second Atlas **project** (not just a database) to get a completely isolated free cluster for prod — separate host, separate credentials, full isolation. Recommended before any significant user growth.

### How Database.js Reads It
`config/database.js` calls `mongoose.connect(process.env.MONGODB_URI)` with no database name override — the name comes entirely from the URI. The connected database name is logged on startup:
```
MongoDB Connected: continuum-dev.iygdp9l.mongodb.net
Database: test   ← this tells you which database is active
```

---

## Deployment Notes

### Backend: Railway or Render

- Deploy Node.js server directly from GitHub
- Set all env vars in the platform dashboard (including the prod `MONGODB_URI`)
- MongoDB Atlas is already cloud-hosted, no change needed
- Cloudinary is already cloud-hosted, no change needed
- Lock Atlas IP Access List to the static server IP before launch (currently `0.0.0.0/0` for dev)

### Web: Vercel

- Deploy Vite React app from GitHub
- Set `VITE_API_URL` to point to deployed backend URL
- Automatic builds on push
- Keep Atlas warm by setting up an uptime monitor (UptimeRobot) to ping `/health` every 5 minutes — prevents the backend process from sleeping on free hosting tiers, which also keeps the Mongoose connection pool alive

### Mobile: Expo / EAS Build

- Use `expo build:android` or EAS Build for APK/AAB
- Set `API_URL` to deployed backend URL
- Android build for Google Play submission

---

## Packages to Install (by Phase)

### Phase 1: Database Layer
Already installed: `express`, `mongoose`, `cors`, `dotenv`, `body-parser`

```bash
# Add for dev workflow
npm install --save-dev nodemon
```

Update `package.json` scripts:
```json
"dev": "nodemon server.js"
```

### Phase 2: Backend APIs
```bash
npm install jsonwebtoken bcryptjs passport passport-google-oauth20
npm install cloudinary multer
npm install groq-sdk
npm install resend
```

### Phase 3+: No new backend packages expected
