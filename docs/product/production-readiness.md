# Production Readiness Checklist

**Status:** In Progress
**Goal:** MVP-ready for real user testing — stable, legal, and publicly accessible

---

## 1. Google OAuth Verification

The app requests three scopes: `profile`, `email`, and `https://www.googleapis.com/auth/drive.readonly`. Because `drive.readonly` is a **sensitive scope**, Google requires full app verification before any non-test user can log in with Google.

### What's blocking verification

| Requirement | Status | Notes |
|---|---|---|
| Homepage describing app functionality | ✅ Done | Landing page revamped with full feature breakdown |
| Privacy Policy page | ✅ Done | Built at `/privacy` |
| Privacy Policy linked on homepage | ✅ Done | Linked in footer of all marketing pages |
| Privacy Policy linked in Google OAuth consent screen | ✅ Done | Set in Google Cloud Console → OAuth consent screen |
| Domain verified in Google Search Console | ✅ Done | Verified by owner |
| Google Sign-In button follows branding guidelines | ✅ Done | Button uses Google colors and logo |
| App demo video showing OAuth consent screen + drive scope usage | ❌ Missing | Required for sensitive scope |
| Justification for `drive.readonly` scope | ❌ Missing | Must explain why narrower scope won't work |
| Project contact info up to date in GCP | ✅ Done | Confirmed in Google Cloud Console |

### Action items

#### 1a. Add a Privacy Policy page

Create `web/src/pages/legal/PrivacyPolicy.jsx` and route it at `/privacy`. Must cover:
- What data is collected (name, email, Google profile)
- How Google user data is accessed, used, and stored
- That Google Drive data is only used for [specific feature] and not shared or sold
- How users can request data deletion
- Contact email for privacy inquiries

Host it at `https://yourcontinuumdomain.com/privacy` and link it:
- In the site footer / homepage
- In Google Cloud Console → APIs & Services → OAuth consent screen → Privacy Policy URL

#### 1b. Add a Terms of Service page

Create `web/src/pages/legal/TermsOfService.jsx` at `/terms`. Link from footer.

#### 1c. Verify domain ownership

Go to [Google Search Console](https://search.google.com/search-console) → Add property → verify ownership of the production domain. The GCP project owner must be the one who verifies.

#### 1d. `drive.readonly` scope justification

`drive.readonly` is a sensitive scope — required for Google Docs/Drive integration. Keep it. When submitting for verification, the justification must explain:
- What specific feature uses Drive data (e.g., importing notes/documents from Google Drive)
- Why read-only access is the narrowest scope that works
- That Drive data is not transferred, sold, or used for ads

Example justification: *"Our app uses `drive.readonly` to allow users to import documents from their Google Drive into Continuum as notes. Read-only is the narrowest scope that enables this — we do not write to Drive. Drive data is displayed only to the authenticated user and is never stored or shared."*

#### 1e. Record the OAuth demo video

Must show:
1. Full OAuth consent screen (with all requested scopes visible, language set to English)
2. End-to-end flow: user clicks "Continue with Google" → grants access → lands in app
3. The feature that uses the Drive data in action

#### 1f. Submit for verification

Google Cloud Console → APIs & Services → OAuth consent screen → **Publish App** → Submit for verification.

---

## 2. Legal Pages

| Page | Route | Status |
|---|---|---|
| Privacy Policy | `/privacy` | ✅ Built |
| Terms of Service | `/terms` | ✅ Built |

Links appear:
- ✅ In the footer of the landing page, product page, and about page
- ✅ On the Register page: "By signing up, you agree to our Terms and Privacy Policy"
- ✅ Privacy Policy URL entered in Google Cloud Console → OAuth consent screen

---

## 3. Email Sending — Custom Domain

Currently using `onboarding@resend.dev` as the sender address. All verification and password reset emails show this address, which looks unofficial.

**Fix:** Configure a custom sending domain in Resend.
1. Add your domain in Resend dashboard → Domains
2. Add the DNS records Resend provides (SPF, DKIM, DMARC)
3. Update `auth.controller.js` from address to `noreply@yourcontinuumdomain.com`

---

## 4. Redis (Upstash)

Redis is optional — the app gracefully degrades without it. However without Redis:
- The Socket.io Redis adapter is not active (real-time messages work only on a single server instance)
- Server-side query caching is disabled
- Daily AI rate limit counter uses in-memory fallback (resets on redeploy)

**If using Upstash:** Upstash is the Redis provider — just ensure the `REDIS_URL` env var on the Render backend service is set to your Upstash connection string. No separate Render Redis instance needed. If `REDIS_URL` is already set on Render, this item is done.

---

## 6. Error Monitoring

No error monitoring is configured. Unhandled exceptions in prod are only visible in Render logs, which don't alert anyone.

**Recommended:** Add [Sentry](https://sentry.io) — free tier covers MVP usage.

**Backend (`backend/app.js`):**
```js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });
```

**Frontend (`web/src/main.jsx`):**
```js
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

Add `SENTRY_DSN` to backend env vars and `VITE_SENTRY_DSN` to frontend env vars on Render.

---

## 7. Environment Variables Audit

Verify all the following are set on the Render backend service:

| Var | Purpose | Required |
|---|---|---|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Set to `production` | Yes |
| `MONGODB_URI` | Prod MongoDB connection | Yes |
| `JWT_SECRET` | Must be a long random string | Yes |
| `JWT_EXPIRES_IN` | e.g. `1d` | Yes |
| `GOOGLE_CLIENT_ID` | OAuth | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth | Yes |
| `GOOGLE_CALLBACK_URL` | Must match prod domain exactly | Yes |
| `FRONTEND_URL` | Prod frontend URL — used for CORS + email links | Yes |
| `RESEND_API_KEY` | Email sending | Yes |
| `GROQ_API_KEY` | AI features | Yes |
| `CLOUDINARY_CLOUD_NAME` | Avatar uploads | Yes |
| `CLOUDINARY_API_KEY` | Avatar uploads | Yes |
| `CLOUDINARY_API_SECRET` | Avatar uploads | Yes |
| `REDIS_URL` | Caching + sockets | Recommended |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Google token encryption at rest | Recommended |
| `SENTRY_DSN` | Error monitoring | Recommended |

**Common gotcha:** `GOOGLE_CALLBACK_URL` must be exactly `https://yourbackenddomain.com/api/auth/google/callback` and must match the Authorized redirect URI in Google Cloud Console.

---

## 8. Favicon & Browser Tab Logo

The favicon is what appears in the browser tab, bookmarks, and on mobile when a user adds the site to their home screen. Without it, the browser shows a blank page icon.

**What to add in `web/public/`:**

| File | Purpose |
|---|---|
| `favicon.ico` | Classic browser tab icon (32x32) |
| `favicon.svg` | Modern scalable version (preferred by Chrome/Firefox) |
| `apple-touch-icon.png` | iOS home screen icon (180x180) |
| `favicon-192.png` | Android home screen (192x192) |
| `favicon-512.png` | Android splash screen (512x512) |

Use the Continuum "C" logo mark. A free tool like [realfavicongenerator.net](https://realfavicongenerator.net) generates all sizes from one source image.

**Update `web/index.html`:**

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

**Also add Open Graph meta tags** (controls how the link looks when shared on iMessage, Twitter, Slack, etc.):

```html
<meta property="og:title" content="Continuum" />
<meta property="og:description" content="The all-in-one workspace for students." />
<meta property="og:image" content="https://yourcontinuumdomain.com/og-image.png" />
<meta property="og:url" content="https://yourcontinuumdomain.com" />
<meta name="twitter:card" content="summary_large_image" />
```

Create a 1200x630px `og-image.png` (the preview image that appears when the link is shared) and place it in `web/public/`.

---

## 9. SEO

Without SEO basics, the landing page, product page, and about page won't appear in Google search results even after the domain is verified.

### `web/index.html` — base meta tags

```html
<title>Continuum — The Student Workspace</title>
<meta name="description" content="Continuum is the all-in-one workspace for students — notes, flashcards, tasks, job applications, and more." />
<meta name="keywords" content="student productivity, notes app, flashcards, task manager, job application tracker" />
<link rel="canonical" href="https://yourcontinuumdomain.com" />
```

### Per-page titles and descriptions

React Router doesn't update `<title>` automatically. Use a small utility or the `react-helmet-async` package to set unique titles and descriptions per page:

| Page | Title | Description |
|---|---|---|
| Landing `/` | Continuum — Student Workspace | The all-in-one workspace built for students |
| Product `/product` | Features — Continuum | Notes, flashcards, tasks, and career tools in one place |
| About `/about` | About — Continuum | Learn about the team behind Continuum |
| Privacy `/privacy` | Privacy Policy — Continuum | How Continuum handles your data |
| Terms `/terms` | Terms of Service — Continuum | Terms governing use of Continuum |
| Login `/login` | Sign In — Continuum | — |
| Register `/register` | Create Account — Continuum | — |

### Sitemap

Create `web/public/sitemap.xml` listing all public routes so Google can discover and index them:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://yourcontinuumdomain.com/</loc></url>
  <url><loc>https://yourcontinuumdomain.com/product</loc></url>
  <url><loc>https://yourcontinuumdomain.com/about</loc></url>
  <url><loc>https://yourcontinuumdomain.com/login</loc></url>
  <url><loc>https://yourcontinuumdomain.com/register</loc></url>
  <url><loc>https://yourcontinuumdomain.com/privacy</loc></url>
  <url><loc>https://yourcontinuumdomain.com/terms</loc></url>
</urlset>
```

Reference the sitemap in `robots.txt`:
```
Sitemap: https://yourcontinuumdomain.com/sitemap.xml
```

### Submit to Google Search Console

After domain verification, go to Google Search Console → Sitemaps → submit `https://yourcontinuumdomain.com/sitemap.xml`. This tells Google to crawl and index the site immediately rather than waiting for organic discovery.

---

## 10. robots.txt

Without a `robots.txt`, crawlers index everything including `/login`, `/dashboard`, and API routes.

Add `web/public/robots.txt`:

```
User-agent: *
Disallow: /dashboard
Disallow: /notes
Disallow: /tasks
Disallow: /flashcards
Disallow: /applications
Disallow: /messages
Disallow: /friends
Disallow: /profile
Disallow: /calendar
Allow: /
Allow: /about
Allow: /product
Allow: /login
Allow: /register
Allow: /privacy
Allow: /terms
```

---

## 11. Accessibility (WCAG)

Not blocking for MVP but important before a public launch. The app already uses semantic HTML and `aria-label` attributes in newer components — a full audit would catch remaining gaps.

**Key areas to audit:**

| Area | What to check |
|---|---|
| Color contrast | All text must meet WCAG AA ratio (4.5:1 for normal text, 3:1 for large) — the `#a087b0` secondary color is borderline |
| Keyboard navigation | Every interactive element (buttons, inputs, modals, dropdowns) must be reachable and operable via Tab + Enter/Space |
| Focus indicators | Visible focus ring on all focusable elements — don't suppress `outline` without a replacement |
| Screen reader labels | All icon-only buttons need `aria-label`. All form inputs need associated `<label>` |
| Modal focus trap | When a modal opens, focus must be trapped inside it and returned to the trigger on close |
| Image alt text | All `<img>` tags need descriptive `alt` attributes |
| Live regions | Dynamic content changes (toasts, loading states) should use `aria-live` |

**Tools:**
- [axe DevTools](https://www.deque.com/axe/) Chrome extension — run on each page and fix reported violations
- Lighthouse accessibility audit (built into Chrome DevTools)

---

## 12. MongoDB Backups

MongoDB Atlas enables automated backups by default on M10+ clusters. For free/shared tier (M0):

- **Automated backups are not available** on M0 — Atlas does not snapshot free clusters
- **Manual option:** Set up a cron job or Render cron service that runs `mongodump` on a schedule and uploads the dump to an S3 bucket or Cloudinary
- **Recommended:** Upgrade to M2 or M5 ($9–$25/mo) when real user data is at stake — continuous backups, point-in-time recovery included

For now, the demo seed data is fully reproducible via `seed-jane.js --clean`, so the only irreplaceable data is real user accounts created in prod.

---

## 14. What's Already Good

These are production-ready and don't need changes:

- ✅ **Helmet.js** — security headers configured
- ✅ **Rate limiting** — auth (10/15min), API (300/15min), writes (30/1min), AI (5/1min)
- ✅ **CORS** — locked to `FRONTEND_URL` only
- ✅ **Health check** — `GET /health` returns `200 OK`
- ✅ **Password hashing** — bcrypt pre-save hook on User model
- ✅ **JWT + refresh token rotation** — short-lived access tokens, hashed refresh tokens
- ✅ **MongoDB sanitization** — `express-mongo-sanitize` applied
- ✅ **Refresh token cookie** — httpOnly, sameSite
- ✅ **Demo account guard** — isDemo blocks all writes at middleware level
- ✅ **Jest integration tests** — 130+ tests across 12 suites (auth, profile, users, friends, calendar, notes, tasks, flashcards, comments, resumes, applications, messages, activity)

---

## 12. Logo Replacement (Assets Pending)

Every place the word "Continuum" or the placeholder "C" mark appears as text needs to be replaced with the real logo assets once provided.

**Locations to update:**

| Location | File | Current |
|---|---|---|
| Sidebar header | `web/src/components/layout/Sidebar.jsx` | "C" box + "Continuum" text |
| Mobile app header | `web/src/components/layout/AppLayout.jsx` | "C" box + "Continuum" text |
| Auth pages (Login, Register, etc.) | `web/src/pages/auth/` | "C" logo mark + "Continuum" heading |
| Browser tab title | `web/index.html` | `<title>Continuum</title>` — keep as text, add favicon |
| Landing / product / about pages | marketing pages | wherever "Continuum" wordmark appears |
| Open Graph image | `web/public/og-image.png` | needs logo embedded in the image |

**What to provide:**
- Full wordmark (logo + "Continuum" text) — SVG preferred, PNG fallback
- Logo mark only (the "C" icon) — SVG preferred, for favicon and compact use
- Dark and light variants if applicable

Once assets are received, do a codebase-wide search for the placeholder `C` mark and "Continuum" text renders and swap them in.

---

## 15. Priority Order for MVP Launch

1. **Logo assets (user to provide)** — replace all "C" placeholders and "Continuum" text renders site-wide
2. **Favicon + browser tab logo** — depends on logo asset being finalized
3. ~~**Privacy Policy page**~~ ✅ Done — built at `/privacy`, linked in footer and Register form
4. ~~**Terms of Service page**~~ ✅ Done — built at `/terms`, linked in footer and Register form
5. **SEO meta tags + sitemap** — get the public pages indexed by Google
6. **Custom email domain in Resend** — emails currently send from `onboarding@resend.dev`
7. **Confirm `REDIS_URL` is set on Render** — points to Upstash instance
8. **`robots.txt` + sitemap reference** — tell crawlers what to index
9. **Sentry** — know when things break in prod without checking logs manually
10. **Google OAuth verification** — enter Privacy Policy URL in Google Cloud Console, verify domain in Search Console, then submit
