import { test, expect, APIRequestContext } from '@playwright/test';
import { registerUser, registerAndStartOnboarding } from './helpers/auth';

const API = 'http://localhost:5001/api';

async function getToken(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('token') ?? '');
}

async function getMe(request: APIRequestContext, token: string) {
  const res = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Make API calls from the browser context so the same session/token flow is used
async function completeOnboardingViaBrowser(page: import('@playwright/test').Page) {
  await page.evaluate(async (apiBase) => {
    const token = localStorage.getItem('token');
    await fetch(`${apiBase}/api/auth/me/onboarding/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetch(`${apiBase}/api/auth/me/tour/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, 'http://localhost:5001');
}

// Skip steps until a heading is visible, up to `maxSkips` attempts.
// Handles: "Skip" (most steps), "Skip for now" (Google Drive step), "Save & Continue"
async function skipUntilVisible(
  page: import('@playwright/test').Page,
  heading: string,
  maxSkips = 8,
) {
  for (let i = 0; i < maxSkips; i++) {
    const target = page.locator(`text=${heading}`);
    if (await target.isVisible({ timeout: 1_200 }).catch(() => false)) break;
    const btn = page.locator([
      'button:has-text("Save & Continue")',
      'button:text-is("Skip")',
      'button:text-is("Skip for now")',
    ].join(', ')).first();
    if (await btn.isVisible({ timeout: 800 }).catch(() => false)) await btn.click();
    await page.waitForTimeout(500);
  }
}

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------

test.describe('Route guards', () => {
  test('unauthenticated /onboarding redirects to /login', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test('fully-completed user visiting /onboarding is redirected to /dashboard', async ({ page }) => {
    await registerAndStartOnboarding(page);

    // Set both flags via browser fetch (same session context, invalidates cache)
    await completeOnboardingViaBrowser(page);

    // Full page reload → AuthContext re-fetches user with fresh flags → guard redirects
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
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

  test('left panel wordmark is in the upper-left, not centered', async ({ page }) => {
    await registerAndStartOnboarding(page);
    const img = page.locator('img[alt="Continuum"]').first();
    await expect(img).toBeVisible();
    const box = await img.boundingBox();
    expect(box!.x).toBeLessThan(280);  // within left 40% panel
    expect(box!.y).toBeLessThan(120);  // near the top
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

  test('back button is not shown on the Welcome step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await expect(page.locator('button:has-text("← Back")')).not.toBeVisible();
  });

  test('back button is NOT shown on the activation step', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Continue")');
    await skipUntilVisible(page, 'Almost done', 8);
    await expect(page.locator('text=Almost done')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button:has-text("← Back")')).not.toBeVisible();
  });

  test('goal selection is saved to the API', async ({ page, request }) => {
    await registerAndStartOnboarding(page);
    const token = await getToken(page);

    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(600);

    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('skipping goal does not corrupt onboardingGoal when set', async ({ page, request }) => {
    await registerAndStartOnboarding(page);
    const token = await getToken(page);

    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Track my job search")');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(400);

    // Skip photo-bio step
    await page.locator('button:text-is("Skip")').first().click();
    await page.waitForTimeout(300);

    const { user } = await getMe(request, token);
    expect(user.onboardingGoal).toBe('track_job_search');
  });

  test('"Skip setup" exits onboarding and lands on /dashboard', async ({ page }) => {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Skip setup")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 6_000 });
  });
});

// ---------------------------------------------------------------------------
// Integrations step
// ---------------------------------------------------------------------------

test.describe('Integrations step', () => {
  async function reachIntegrationsStep(page: import('@playwright/test').Page) {
    await registerAndStartOnboarding(page);
    // Step through explicitly so each step is fully rendered before advancing
    await page.click('button:has-text("Let\'s go")');
    await expect(page.locator('text=What brought you to Continuum?')).toBeVisible({ timeout: 3_000 });
    await page.click('button:has-text("Continue")');
    // Wait for photo-bio step — unique element is the bio textarea
    await expect(page.locator('textarea')).toBeVisible({ timeout: 3_000 });
    await page.locator('button:text-is("Skip")').first().click();
    // Wait for the Google Drive card — unique to the integrations step content
    await expect(page.locator('text=Import Google Docs directly as notes')).toBeVisible({ timeout: 5_000 });
  }

  test('integrations step shows Google Drive card', async ({ page }) => {
    await reachIntegrationsStep(page);
    await expect(page.getByText('Google Drive', { exact: true })).toBeVisible();
  });

  test('skipping integrations advances to activation', async ({ page }) => {
    await reachIntegrationsStep(page);
    await page.locator('button:text-is("Skip for now")').click();
    await expect(page.locator('text=Almost done')).toBeVisible({ timeout: 5_000 });
  });

  test('continuing integrations advances to activation', async ({ page }) => {
    await reachIntegrationsStep(page);
    await page.getByRole('button', { name: /Save & Continue|^Continue$/ }).click();
    await expect(page.locator('text=Almost done')).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Activation step
// ---------------------------------------------------------------------------

test.describe('Activation step', () => {
  async function reachActivationStep(page: import('@playwright/test').Page, goalLabel: string) {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await page.click(`button:has-text("${goalLabel}")`);
    await page.click('button:has-text("Continue")');
    await skipUntilVisible(page, 'Almost done', 8);
    await expect(page.locator('text=Almost done')).toBeVisible({ timeout: 8_000 });
  }

  test('study_smarter goal shows "Create your first note" CTA', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await expect(page.locator('text=Create your first note')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'Open Notes' })).toBeVisible();
  });

  test('track_job_search goal shows "Add your first application" CTA', async ({ page }) => {
    await reachActivationStep(page, 'Track my job search');
    await expect(page.locator('text=Add your first application')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'Open Applications' })).toBeVisible();
  });

  test('"Open Notes" CTA navigates to /notes', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await page.getByRole('button', { name: 'Open Notes' }).click();
    await expect(page).toHaveURL(/\/notes/, { timeout: 8_000 });
  });

  test('"Skip to dashboard" lands on /dashboard', async ({ page }) => {
    await reachActivationStep(page, 'Study smarter');
    await page.getByRole('button', { name: 'Skip to dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
  });

  test('tourCompleted is set after activation CTA', async ({ page, request }) => {
    await reachActivationStep(page, 'Study smarter');
    const token = await getToken(page);
    await page.getByRole('button', { name: 'Open Notes' }).click();
    await expect(page).toHaveURL(/\/notes/, { timeout: 8_000 });
    await page.waitForTimeout(600);
    const { user } = await getMe(request, token);
    expect(user.tourCompleted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Coach mark
// ---------------------------------------------------------------------------

test.describe('First-run coach mark', () => {
  async function triggerCoachMark(page: import('@playwright/test').Page) {
    await registerAndStartOnboarding(page);
    await page.click('button:has-text("Let\'s go")');
    await page.click('button:has-text("Study smarter")');
    await page.click('button:has-text("Continue")');
    await skipUntilVisible(page, 'Almost done', 8);
    await page.getByRole('button', { name: 'Open Notes' }).click();
    await expect(page).toHaveURL(/\/notes/, { timeout: 8_000 });
  }

  test('coach mark tooltip appears on /notes after activation', async ({ page }) => {
    await triggerCoachMark(page);
    await expect(page.locator('text=Create your first note to get started')).toBeVisible({ timeout: 5_000 });
  });

  test('coach mark disappears after clicking Dismiss', async ({ page }) => {
    await triggerCoachMark(page);
    await expect(page.locator('text=Create your first note to get started')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.locator('text=Create your first note to get started')).not.toBeVisible({ timeout: 3_000 });
  });

  test('backdrop keeps user on target route until dismissed', async ({ page }) => {
    await triggerCoachMark(page);
    await expect(page.locator('text=Create your first note to get started')).toBeVisible({ timeout: 5_000 });

    // Still on /notes — backdrop prevented any navigation
    await expect(page).toHaveURL(/\/notes/);

    // Click the backdrop area (top-left corner — no app UI there, just backdrop)
    await page.mouse.click(10, 10);
    await expect(page.locator('text=Create your first note to get started')).not.toBeVisible({ timeout: 3_000 });
    // Still on /notes after backdrop dismissal
    await expect(page).toHaveURL(/\/notes/);
  });
});

// ---------------------------------------------------------------------------
// Replay tour (Profile page)
// ---------------------------------------------------------------------------

test.describe('Replay tour', () => {
  test('Feature tour card is visible on the Profile tab', async ({ page }) => {
    await registerUser(page);
    await page.goto('/profile');
    // Feature tour is on the Profile tab (default is Overview)
    await page.getByRole('button', { name: 'Profile' }).click();
    await expect(page.locator('text=Feature tour')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking Replay tour opens the tour modal', async ({ page }) => {
    await registerUser(page);
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByRole('button', { name: 'Replay tour' }).click();
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 6_000 });
  });
});
