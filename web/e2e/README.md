# Web E2E Testing

## Overview

The web layer has Playwright E2E tests that run against a real backend and real browser.

| Layer | Tool | When to use |
|-------|------|-------------|
| **E2E tests** | Playwright (Chromium) | Automated — runs on every PR via GitHub Actions |
| **Unit / integration** | Jest + Supertest (backend) | API contract and business logic |
| **ViewModel tests** | MockK + coroutines-test (Android) | Android state machine logic |

---

## What's tested

| Spec | File | What it covers |
|------|------|----------------|
| Auth | `auth.spec.ts` | Register valid user, duplicate email error, login correct/wrong password, logout redirects, session persists on reload |
| Notes | `notes.spec.ts` | Create note, edit title, delete note (no TypeError regression), type filter chips, search bar |
| Flashcards | `flashcards.spec.ts` | Create set, add card, study mode (reveal → Got it! → Set complete!), history tab visible |
| Tasks | `tasks.spec.ts` | Create task, change status (no TypeError regression), dashboard stat count, delete task |
| Career | `career.spec.ts` | Create application, edit status, delete application, Resumes tab renders |

---

## How it works

**Two real servers start automatically.** Playwright's `webServer` config (in `playwright.config.ts`) boots:

1. **E2E backend** (`backend/tests/e2e/server.js`) — the same Express app as production, wired to a `mongodb-memory-server` in-RAM database. No Atlas credentials needed. All external service keys are set to stub values so no real Cloudinary, Resend, or Groq calls are made.
2. **Vite dev server** — the React frontend served on `localhost:5173`, pointed at the E2E backend via `VITE_API_URL`.

Playwright starts both servers before running tests and shuts them down when done. On local runs, if the servers are already running (`reuseExistingServer: true`) they are reused — no double boot.

---

## Running locally

```bash
cd web
npm run test:e2e         # headless Chromium, list reporter
npm run test:e2e:ui      # Playwright UI — step through tests visually
```

On the first run, Playwright will prompt you to install the Chromium binary if it isn't already installed:

```bash
npx playwright install chromium
```

---

## How to add a new spec

1. Create `web/e2e/<feature>.spec.ts`
2. Use this boilerplate:

```ts
import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);        // creates a fresh E2E user and lands on /dashboard
    await page.goto('/your-route');
  });

  test('does the thing', async ({ page }) => {
    await page.click('button:has-text("Action")');
    await expect(page.locator('text=Expected Result')).toBeVisible();
  });
});
```

Each spec gets an isolated in-memory database — the E2E server does not wipe state between tests, so use unique test data (e.g. distinct titles) within a spec file.

---

## What's not tested in E2E

| What | Why | Where it IS covered |
|------|-----|---------------------|
| Google OAuth login | Requires real Google consent — can't automate in CI | Jest: `auth.test.js` covers the `/api/auth/google` route with a mock token |
| AI generation (Groq) | Groq SDK called with a stub key; will return an error | Manual QA |
| File uploads (Cloudinary) | Cloudinary mocked in E2E backend | Jest: `resumes.test.js` covers the upload route |
| Email sending (Resend) | Resend mocked in E2E backend | Jest: `auth.test.js` covers forgot-password flow |

---

## Mocked external services

The E2E backend (`backend/tests/e2e/server.js`) sets stub env vars before requiring the Express app. The same pattern as the Jest suite:

| Service | Env var stub | Effect |
|---------|-------------|--------|
| Cloudinary | `CLOUDINARY_*=e2e-test-*` | SDK initialises without error; upload routes return an API error |
| Resend | `RESEND_API_KEY=e2e-test-resend-key` | SDK initialises; emails are not sent |
| Groq | `GROQ_API_KEY=e2e-test-groq-key` | SDK initialises; AI generation routes return an error |

---

## CI

The **Playwright E2E (web)** job runs in parallel with the Jest test suite on every PR. If any spec fails, the `playwright-report/` artifact (including traces and screenshots) is uploaded for 7 days. Look for it under **Actions → your workflow run → Artifacts**.
