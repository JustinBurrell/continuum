import { test, expect, APIRequestContext } from '@playwright/test';
import { registerUser } from './helpers/auth';

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

test.describe('Onboarding flow', () => {
  test('new user sees modal at P0 (WelcomeStep)', async ({ page }) => {
    await registerUser(page);
    await expect(page.locator('text=Welcome to Continuum')).toBeVisible({ timeout: 5000 });
  });

  test('goal selection persists to GET /api/auth/me', async ({ page, request }) => {
    await registerUser(page);

    // P0 → Let's go
    await page.click('button:has-text("Let\'s go")');

    // P1 — select "Track job search"
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');

    // Wait for the next step to appear (P2 or P3 depending on signup method)
    await page.waitForTimeout(500);

    const token = await getToken(page);
    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('skipping a step does not corrupt onboardingGoal', async ({ page, request }) => {
    await registerUser(page);

    // P0 → Let's go
    await page.click('button:has-text("Let\'s go")');

    // P1 — select goal and continue
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(300);

    // P2 or P3 — skip (photo/bio step)
    const skipBtn = page.locator('button:has-text("Skip")').first();
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(300);
    }

    // Verify goal is still intact
    const token = await getToken(page);
    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('completing tour sets tourCompleted to true', async ({ page, request }) => {
    await registerUser(page);
    const token = await getToken(page);

    // Click through all profile setup steps by clicking Continue or Skip
    for (let i = 0; i < 8; i++) {
      const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Let\'s go"), button:has-text("Save & Continue")').first();
      const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Skip for now")').first();

      if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await continueBtn.click();
      } else if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await skipBtn.click();
      }
      await page.waitForTimeout(300);
    }

    // Now click through all 11 tour steps
    for (let i = 0; i < 11; i++) {
      const nextBtn = page.locator('button:has-text("Next")').first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(250);
      }
    }

    // Should see "You're all set" final slide
    await expect(page.locator('text=You\'re all set')).toBeVisible({ timeout: 5000 });

    // Click "Go to Dashboard"
    await page.click('button:has-text("Go to Dashboard")');
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(page.locator('text=You\'re all set')).not.toBeVisible();

    // tourCompleted should be true
    const { user } = await getMe(request, token);
    expect(user.tourCompleted).toBe(true);
  });

  test('Replay tour from Profile opens modal at Dashboard tour step', async ({ page, request }) => {
    await registerUser(page);
    const token = await getToken(page);

    // Skip through all onboarding quickly using X button
    const xBtn = page.locator('button[aria-label="Skip onboarding"]');
    if (await xBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await xBtn.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Profile → Notifications tab (where Replay tour button lives)
    await page.goto('/profile');
    await page.click('button:has-text("Notifications")');
    await page.waitForTimeout(300);

    // Click Replay tour
    await page.click('button:has-text("Replay tour")');
    await page.waitForTimeout(500);

    // Modal should appear at the Dashboard tour step (first tour step)
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });
    // Should NOT show the Welcome step (P0)
    await expect(page.locator('text=Welcome to Continuum')).not.toBeVisible();
  });
});
