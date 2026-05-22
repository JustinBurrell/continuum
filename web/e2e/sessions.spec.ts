import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './helpers/auth';

/** Navigate to the Profile Security tab and wait for the sessions section to be ready. */
async function goToSecurityTab(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.waitForURL('**/profile', { timeout: 8_000 });
  // Wait for the profile page's initial data fetch to finish before interacting
  await page.waitForLoadState('networkidle', { timeout: 10_000 });
  await page.locator('button:has-text("Security")').click();
  // Use exact match — 'text=Active sessions' is a substring match that also hits
  // "Revokes all active sessions" in the danger zone, causing ambiguous results
  await expect(page.getByText('Active sessions', { exact: true })).toBeVisible({ timeout: 10_000 });
}

/** Open the "Sign out all" confirm dialog and click the confirm button inside it.
 *  Both the danger-zone trigger and the ConfirmModal confirm button share the same
 *  label. The modal renders via createPortal at the bottom of document.body, so the
 *  confirm button is always the LAST matching element in the DOM.
 */
async function clickSignOutAllAndConfirm(page: import('@playwright/test').Page) {
  await page.locator('button:has-text("Sign out all")').first().click();
  // Wait for the dialog message to confirm the modal is open
  await page.waitForSelector('text=You will be signed out of all devices', { timeout: 5_000 });
  await page.locator('button:has-text("Sign out all")').last().click();
}

test.describe('Active Sessions', () => {
  test('sessions list shows at least one session with a "This device" badge', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);
    // React Query fetches sessions asynchronously — allow time for the API round-trip
    await expect(page.locator('text=This device')).toBeVisible({ timeout: 12_000 });
  });

  test('sessions list shows "Signed in" timestamp on each session row', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);
    await expect(page.locator('text=This device')).toBeVisible({ timeout: 12_000 });
    // lastUsedAt is null on a fresh session — only populated after a token refresh.
    // Verify the always-present "Signed in" label instead.
    await expect(page.locator('text=/Signed in/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('current session delete button is disabled', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);
    await page.waitForSelector('text=This device', { timeout: 12_000 });
    await expect(
      page.locator('button[title="Cannot remove your current session"]')
    ).toBeDisabled({ timeout: 5_000 });
  });
});

test.describe('Sign out all devices', () => {
  test('sign out all clears auth and lands on /login — not /dashboard', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);
    await clickSignOutAllAndConfirm(page);
    await page.waitForURL('**/login', { timeout: 12_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /dashboard after sign out all redirects back to /login', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);
    await clickSignOutAllAndConfirm(page);
    await page.waitForURL('**/login', { timeout: 12_000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

test.describe('Session deduplication after re-login', () => {
  test('re-login from same browser shows only one session in the list', async ({ page }) => {
    const user = await registerUser(page);

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      page.click('button:has-text("Sign out")'),
    ]);
    await page.context().clearCookies();

    await loginUser(page, user.email, user.password);

    await goToSecurityTab(page);
    await page.waitForSelector('text=This device', { timeout: 12_000 });

    // After re-login the old session is revoked — exactly one "This device" badge
    await expect(page.locator('text=This device')).toHaveCount(1, { timeout: 8_000 });
  });
});
