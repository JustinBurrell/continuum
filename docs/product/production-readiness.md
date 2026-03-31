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
| Justification for `drive.readonly` scope | ✅ Done | Submitted in Google Cloud Console OAuth consent screen |
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

**Status: ✅ Done** — `REDIS_URL` is set on Render pointing to Upstash. Socket.io adapter, caching, and AI rate limiting are all active.

---

## 6. Error Monitoring ✅ Done

`@sentry/node` initialized in `backend/instrument.js`, loaded at the top of `server.js`. `Sentry.setupExpressErrorHandler(app)` wired into `backend/app.js` before the global error handler.

`@sentry/react` initialized in `web/src/main.jsx`. Both are guarded — Sentry only activates when the DSN env var is present, so local dev is unaffected.

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

## 8. Favicon & Browser Tab Logo ✅ Done

`web/public/favicon.svg` - purple square with infinity symbol placeholder (to be replaced with final icon mark)
`web/public/wordmark.svg` - full brand wordmark, used across all layouts
`web/public/og-image.png` - 1200x630 OG image for social link previews
`web/index.html` - favicon link tags added, OG image wired up

---

## 9. SEO ✅ Done

- `web/index.html` - base title, meta description, canonical URL, full OG and Twitter card block added
- `web/src/components/TitleManager.jsx` - per-page titles (`Continuum | Page` format), descriptions, og:title, og:description, og:url, and canonical updated on every route change
- All public pages covered: `/`, `/product`, `/about`, `/privacy`, `/terms`, `/login`, `/register`

**Pending (post-deploy):** Submit sitemap to Google Search Console at `https://usecontinuum.dev/sitemap.xml`

---

## 10. robots.txt ✅ Done

`web/public/robots.txt` created. Disallows all authenticated app routes, allows all public marketing/auth routes, references sitemap at `https://usecontinuum.dev/sitemap.xml`.

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

## 12. Logo Replacement ✅ Done

All placeholder "C" marks and "Continuum" text renders replaced with `/wordmark.svg` across:
- `Sidebar.jsx`, `AppLayout.jsx` (loading state + mobile header), `AuthLayout.jsx`, `MarketingNav.jsx`, `MarketingFooter.jsx`, `Landing.jsx` mockup
- Tagline removed from auth layout
- `favicon.svg` uses standalone infinity mark (separate from wordmark)

---

## 15. Priority Order for MVP Launch

1. ~~**Logo assets**~~ ✅ Done — wordmark, logo mark, and OG image added; all layouts updated
2. ~~**Favicon + browser tab logo**~~ ✅ Done — favicon.svg placeholder in place, wired to index.html
3. ~~**Privacy Policy page**~~ ✅ Done — built at `/privacy`, linked in footer and Register form
4. ~~**Terms of Service page**~~ ✅ Done — built at `/terms`, linked in footer and Register form
5. ~~**SEO meta tags + sitemap**~~ ✅ Done — TitleManager extended, robots.txt and sitemap.xml created
6. ~~**`robots.txt` + sitemap reference**~~ ✅ Done — see above
7. **Custom email domain in Resend** — emails currently send from `onboarding@resend.dev`
8. ~~**Confirm `REDIS_URL` is set on Render**~~ ✅ Done — Upstash connection string confirmed in Render env vars
9. ~~**Sentry**~~ ✅ Done — `@sentry/node` on backend, `@sentry/react` on frontend; guarded by `SENTRY_DSN` / `VITE_SENTRY_DSN`
10. **Google OAuth verification** — demo video still needed; justification submitted
