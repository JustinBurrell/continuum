import { test, expect, APIRequestContext } from '@playwright/test';
import { registerUser, registerAndStartOnboarding, loginUser } from './helpers/auth';

const API = 'http://localhost:5001/api';

async function getMe(request: APIRequestContext, token: string) {
  const res = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getToken(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('token') ?? '');
}

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------

test.describe('Route guards', () => {
  test('unauthenticated /onboarding redirects to /login', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test('fully-completed user visiting /onboarding is redirected to /dashboard', async ({ page, request }) => {
    // Register + skip (marks both onboardingCompleted and tourCompleted)
    await registerUser(page);
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Fresh onboarding flow
// ---------------------------------------------------------------------------

test.describe('Fresh onboarding flow', () => {
  test('registration lands on /onboarding with Welcome step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('text=Welcome to Continuum')).toBeVisible({ timeout: 5_000 });
  });

  test('left panel shows Continuum wordmark at top-left', async ({ page }) => {
    await registerAndStartOnboarding(page);
    const img = page.locator('img[alt="Continuum"]').first();
    await expect(img).toBeVisible();
    // Wordmark should be in the upper-left quadrant of the screen
    const box = await img.boundingBox();
    expect(box!.x).toBeLessThan(300);
    expect(box!.y).toBeLessThan(150);
  });

  test('can advance from Welcome to Goal step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await expect(page.locator('text=What brought you to Continuum?')).toBeVisible({ timeout: 3_000 });
  });

  test('back button returns to previous step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await expect(page.locator('text=What brought you to Continuum?')).toBeVisible();
    await page.click('button:has-text("← Back")');
    await expect(page.locator('text=Welcome to Continuum')).toBeVisible({ timeout: 3_000 });
  });

  test('back button is not shown on the first (Welcome) step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await expect(page.locator('button:has-text("← Back")')).not.toBeVisible();
  });

  test('goal selection is saved to the API', async ({ page, request }) => {
    await registerAndStartOnboarding(page);
    const token = await getToken(page);

    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(400);

    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('skipping goal step does not corrupt onboardingGoal', async ({ page, request }) => {
    await registerAndStartOnboarding(page);
    const token = await getToken(page);

    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(300);

    // Skip the next step (photo/bio or name)
    const skipBtn = page.locator('button:has-text("Skip")').first();
    if (await skipBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(300);
    }

    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('"Skip setup" exits onboarding and lands on /dashboard', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Skip setup")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Input validation (server-side errors surfaced in UI)
// ---------------------------------------------------------------------------

test.describe('Social links validation', () => {
  async function reachSocialLinksStep(page: import('@playwright/test').Page) {
    await registerAndStartOnboarding(page);
    // Welcome → Goal → skip → skip until social-links step
    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Continue")'); // Goal — no selection = skip
    // Keep skipping until we see "Add your social links"
    for (let i = 0; i < 4; i++) {
      const socialHeading = page.locator('text=Add your social links');
      if (await socialHeading.isVisible({ timeout: 800 }).catch(() => false)) break;
      const btn = page.locator('button:has-text("Skip"), button:has-text("Save & Continue")').first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) await btn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('text=Add your social links')).toBeVisible({ timeout: 4_000 });
  }

  test('invalid LinkedIn URL shows server error without advancing', async ({ page }) => {
    await reachSocialLinksStep(page);
    await page.fill('input[placeholder*="linkedin.com"]', 'not-a-linkedin-url');
    await page.click('button:has-text("Save & Continue")');
    await expect(page.locator('text=Invalid LinkedIn URL')).toBeVisible({ timeout: 4_000 });
    // Should still be on the social links step
    await expect(page.locator('text=Add your social links')).toBeVisible();
  });

  test('invalid Instagram handle shows server error without advancing', async ({ page }) => {
    await reachSocialLinksStep(page);
    await page.fill('input[placeholder*="yourhandle"]', 'invalid handle with spaces!');
    await page.click('button:has-text("Save & Continue")');
    await expect(page.locator('text=Invalid Instagram handle')).toBeVisible({ timeout: 4_000 });
    await expect(page.locator('text=Add your social links')).toBeVisible();
  });

  test('valid LinkedIn URL advances to next step', async ({ page }) => {
    await reachSocialLinksStep(page);
    await page.fill('input[placeholder*="linkedin.com"]', 'https://linkedin.com/in/testuser');
    await page.click('button:has-text("Save & Continue")');
    await expect(page.locator('text=Add your social links')).not.toBeVisible({ timeout: 4_000 });
  });

  test('empty social fields advance without error', async ({ page }) => {
    await reachSocialLinksStep(page);
    await page.click('button:has-text("Save & Continue")');
    await expect(page.locator('text=Add your social links')).not.toBeVisible({ timeout: 4_000 });
  });
});

// ---------------------------------------------------------------------------
// Activation step
// ---------------------------------------------------------------------------

test.describe('Activation step', () => {
  async function reachActivationStep(page: import('@playwright/test').Page, goal: string) {
    await registerAndStartOnboarding(page);
    // Welcome
    await page.click('button:has-text("Let\'s go")');
    // Goal
    await page.click(`button:has-text("${goal}")`);
    await page.click('button:has-text("Continue")');
    // Skip remaining profile steps until activation appears
    for (let i = 0; i < 6; i++) {
      const almostDone = page.locator('text=Almost done');
      if (await almostDone.isVisible({ timeout: 600 }).catch(() => false)) break;
      const btn = page.locator('button:has-text("Skip"), button:has-text("Save & Continue")').first();
      if (await btn.isVisible({ timeout: 600 }).catch(() => false)) await btn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('text=Almost done')).toBeVisible({ timeout: 5_000 });
  }

  test('study_smarter goal shows "Create your first note" CTA', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await expect(page.locator('text=Create your first note')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('button:has-text("Open Notes")')).toBeVisible();
  });

  test('track_job_search goal shows "Add your first application" CTA', async ({ page }) => {
    await reachActivationStep(page, 'Track my job search');
    await expect(page.locator('text=Add your first application')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('button:has-text("Open Applications")')).toBeVisible();
  });

  test('"Open Notes" CTA navigates to /notes', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await page.click('button:has-text("Open Notes")');
    await expect(page).toHaveURL(/\/notes/, { timeout: 6_000 });
  });

  test('"Skip to dashboard" skips activation and lands on /dashboard', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await page.click('button:has-text("Skip to dashboard")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 6_000 });
  });

  test('tourCompleted is set after completing activation', async ({ page, request }) => {
    const token = await getToken(page);
    await reachActivationStep(page, 'Study smarter');
    await page.click('button:has-text("Open Notes")');
    await page.waitForURL(/\/notes/, { timeout: 6_000 });
    await page.waitForTimeout(500);
    const { user } = await getMe(request, token);
    expect(user.tourCompleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Coach mark
// ---------------------------------------------------------------------------

test.describe('First-run coach mark', () => {
  test('coach mark appears on /notes after study_smarter activation', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Study smarter")');
    await page.click('button:has-text("Continue")');

    for (let i = 0; i < 6; i++) {
      const almostDone = page.locator('text=Almost done');
      if (await almostDone.isVisible({ timeout: 600 }).catch(() => false)) break;
      const btn = page.locator('button:has-text("Skip"), button:has-text("Save & Continue")').first();
      if (await btn.isVisible({ timeout: 600 }).catch(() => false)) await btn.click();
      await page.waitForTimeout(300);
    }

    await page.click('button:has-text("Open Notes")');
    await expect(page).toHaveURL(/\/notes/, { timeout: 6_000 });
    await expect(page.locator('text=Create your first note to get started')).toBeVisible({ timeout: 4_000 });
  });

  test('coach mark disappears after clicking Dismiss', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Study smarter")');
    await page.click('button:has-text("Continue")');

    for (let i = 0; i < 6; i++) {
      const almostDone = page.locator('text=Almost done');
      if (await almostDone.isVisible({ timeout: 600 }).catch(() => false)) break;
      const btn = page.locator('button:has-text("Skip"), button:has-text("Save & Continue")').first();
      if (await btn.isVisible({ timeout: 600 }).catch(() => false)) await btn.click();
      await page.waitForTimeout(300);
    }

    await page.click('button:has-text("Open Notes")');
    await page.waitForURL(/\/notes/, { timeout: 6_000 });
    await expect(page.locator('text=Create your first note to get started')).toBeVisible({ timeout: 4_000 });
    await page.click('button:has-text("Dismiss")');
    await expect(page.locator('text=Create your first note to get started')).not.toBeVisible({ timeout: 2_000 });
  });
});

// ---------------------------------------------------------------------------
// Replay tour (OnboardingModal from Profile)
// ---------------------------------------------------------------------------

test.describe('Replay tour', () => {
  test('Feature tour card is visible on Profile page', async ({ page }) => {
    await registerUser(page);
    await page.goto('/profile');
    await expect(page.locator('text=Feature tour')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking Replay tour opens the tour modal', async ({ page }) => {
    await registerUser(page);
    await page.goto('/profile');
    await page.click('button:has-text("Replay tour")');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5_000 });
  });
});
