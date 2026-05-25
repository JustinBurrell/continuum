import { test, expect, devices } from '@playwright/test';
import { checkA11y } from 'axe-playwright';

const DESKTOP = { width: 1280, height: 800 };

// Strip defaultBrowserType so test.use() works inside describe blocks
const { defaultBrowserType: _bt, ...IPHONE_14 } = devices['iPhone 14'];

// ─── Mobile gate (phone UA) ───────────────────────────────────────────────────

test.describe('Mobile gate', () => {
  test.use(IPHONE_14);

  test('shows mobile gate (not app) at mobile viewport', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, null, { detailedReport: true });
    await expect(page.locator('h1')).toContainText('Stop switching between 8 apps');
    await expect(page.locator('text=Dashboard')).not.toBeVisible();
  });

  test('nav bar renders with logo and join-waitlist link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav img[alt="Continuum"]')).toBeVisible();
    await expect(page.locator('nav button:has-text("Join the waitlist")')).toBeVisible();
  });

  test('nav "Join the waitlist" scrolls to the form section', async ({ page }) => {
    await page.goto('/');
    await page.click('nav button:has-text("Join the waitlist")');
    await expect(page.locator('#waitlist-form')).toBeInViewport({ timeout: 2000 });
  });

  test('hero CTA scrolls to form', async ({ page }) => {
    await page.goto('/');
    const heroCTA = page.locator('section').first().locator('button:has-text("Join the waitlist")');
    await heroCTA.click();
    await expect(page.locator('#waitlist-form')).toBeInViewport({ timeout: 2000 });
  });

  test('renders all 6 feature items', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Notes & AI summaries', 'Tasks & deadlines', 'Smart flashcards', 'Career pipeline', 'Social & collaboration', 'Tool integrations']) {
      await expect(page.locator(`text=${label}`)).toBeVisible();
    }
  });
});

// ─── Desktop UA — gate does not show ─────────────────────────────────────────

test.describe('Mobile gate (desktop UA)', () => {
  test('shows landing page (not mobile gate) at desktop viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/');
    await expect(page.locator('text=Stop switching between 8 apps')).toBeVisible();
    await expect(page.locator('h1')).not.toContainText('Your student workspace');
  });

  test('shows landing page on desktop UA regardless of viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await expect(page.locator('text=Stop switching between 8 apps')).toBeVisible();
  });
});

// ─── Waitlist form ────────────────────────────────────────────────────────────

test.describe('Mobile waitlist form', () => {
  test.use(IPHONE_14);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('nav button:has-text("Join the waitlist")');
  });

  test('submit button is disabled until all three fields are filled', async ({ page }) => {
    const submit = page.locator('#waitlist-form button[type="submit"]');
    await expect(submit).toBeDisabled();

    await page.fill('#waitlist-form input[type="text"]', 'Alex');
    await expect(submit).toBeDisabled();

    await page.fill('#waitlist-form input[type="email"]', 'alex@example.com');
    await expect(submit).toBeDisabled();

    await page.click('#waitlist-form button:has-text("iOS")');
    await expect(submit).not.toBeDisabled();
  });

  test('platform pills are mutually exclusive', async ({ page }) => {
    await page.click('#waitlist-form button:has-text("Android")');
    await page.click('#waitlist-form button:has-text("Both")');
    const androidBtn = page.locator('#waitlist-form button:has-text("Android")');
    const bothBtn = page.locator('#waitlist-form button:has-text("Both")');
    await expect(bothBtn).toHaveCSS('background-color', 'rgb(107, 33, 168)');
    await expect(androidBtn).not.toHaveCSS('background-color', 'rgb(107, 33, 168)');
  });

  test('shows inline error for invalid email', async ({ page }) => {
    await page.fill('#waitlist-form input[type="text"]', 'Alex');
    await page.fill('#waitlist-form input[type="email"]', 'notanemail');
    await page.click('#waitlist-form button:has-text("iOS")');
    await page.click('#waitlist-form button[type="submit"]');
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('successful submission shows success state with correct platform copy', async ({ page }) => {
    await page.click('#waitlist-form button:has-text("Android")');
    await page.fill('#waitlist-form input[type="text"]', 'Test');
    await page.fill('#waitlist-form input[type="email"]', `gate-test-${Date.now()}@example.com`);
    await page.click('#waitlist-form button[type="submit"]');
    await expect(page.locator("text=You're on the list.")).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Android app is ready')).toBeVisible();
  });

  test('duplicate email shows 409 error', async ({ page }) => {
    const email = `dup-gate-${Date.now()}@example.com`;

    await page.click('#waitlist-form button:has-text("iOS")');
    await page.fill('#waitlist-form input[type="text"]', 'Test');
    await page.fill('#waitlist-form input[type="email"]', email);
    await page.click('#waitlist-form button[type="submit"]');
    await expect(page.locator("text=You're on the list.")).toBeVisible({ timeout: 8000 });

    await page.reload();
    await page.click('nav button:has-text("Join the waitlist")');
    await page.click('#waitlist-form button:has-text("iOS")');
    await page.fill('#waitlist-form input[type="text"]', 'Test');
    await page.fill('#waitlist-form input[type="email"]', email);
    await page.click('#waitlist-form button[type="submit"]');
    await expect(page.locator('text=already on the waitlist')).toBeVisible({ timeout: 8000 });
  });
});

// ─── Legal pages accessible on mobile ────────────────────────────────────────

test.describe('Mobile legal pages', () => {
  test.use(IPHONE_14);

  test('/privacy is accessible at mobile viewport and shows policy content', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(page.locator('h2:has-text("Information We Collect")')).toBeVisible();
    await expect(page.locator('text=Dashboard')).not.toBeVisible();
  });

  test('/terms is accessible at mobile viewport and shows terms content', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service');
    await expect(page.locator('h2:has-text("Acceptance of Terms")')).toBeVisible();
  });

  test('/privacy nav has logo and "Join the waitlist" link', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('nav img[alt="Continuum"]')).toBeVisible();
    await expect(page.locator('nav a:has-text("Join the waitlist")')).toBeVisible();
  });

  test('"Join the waitlist" on /privacy navigates to gate and scrolls to form', async ({ page }) => {
    await page.goto('/privacy');
    await page.click('nav a:has-text("Join the waitlist")');
    await expect(page).toHaveURL('/');
    await expect(page.locator('#waitlist-form')).toBeInViewport({ timeout: 3000 });
  });

  test('table of contents anchor links work on /privacy', async ({ page }) => {
    await page.goto('/privacy');
    await page.click('a:has-text("Google Drive Data")');
    await expect(page.locator('#google-drive')).toBeInViewport({ timeout: 2000 });
  });
});

// ─── Legal pages (desktop UA) ─────────────────────────────────────────────────

test.describe('Legal pages (desktop UA)', () => {
  test('/privacy and /terms show desktop versions at desktop viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/privacy');
    await expect(page.locator('nav img[alt="Continuum"]')).not.toBeVisible();
  });
});

