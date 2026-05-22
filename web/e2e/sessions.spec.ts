import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './helpers/auth';

async function goToSecurityTab(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.waitForURL('**/profile', { timeout: 8_000 });
  await page.click('button:has-text("Security")');
}

test.describe('Active Sessions', () => {
  test('sessions list shows at least one session with a "This device" badge', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);

    await expect(page.locator('text=Active sessions')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=This device')).toBeVisible({ timeout: 8_000 });
  });

  test('sessions list shows "Last active" text on each session row', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);

    await expect(page.locator('text=/Last active/i').first()).toBeVisible({ timeout: 8_000 });
  });

  test('current session row is not removable (no delete button for it)', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);

    await page.waitForSelector('text=This device', { timeout: 8_000 });

    // The delete button for the current session row should be disabled
    const currentRow = page.locator('div', { has: page.locator('text=This device') }).first();
    const deleteBtn = currentRow.locator('button[title="Cannot remove your current session"]');
    await expect(deleteBtn).toBeDisabled({ timeout: 5_000 });
  });
});

test.describe('Sign out all devices', () => {
  test('sign out all clears auth and lands on /login — not /dashboard', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);

    // Click "Sign out of all devices" button in the danger zone
    await page.click('button:has-text("Sign out all")');

    // Confirm the dialog
    await page.click('button:has-text("Sign out all"):not([disabled])');

    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /dashboard after sign out all redirects back to /login', async ({ page }) => {
    await registerUser(page);
    await goToSecurityTab(page);

    await page.click('button:has-text("Sign out all")');
    await page.click('button:has-text("Sign out all"):not([disabled])');
    await page.waitForURL('**/login', { timeout: 10_000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

test.describe('Session deduplication after re-login', () => {
  test('re-login from same browser shows only one session in the list', async ({ page }) => {
    const user = await registerUser(page);

    // Sign out cleanly (uses the sidebar Sign out button)
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      page.click('button:has-text("Sign out")'),
    ]);
    await page.context().clearCookies();

    // Log back in
    await loginUser(page, user.email, user.password);

    await goToSecurityTab(page);
    await page.waitForSelector('text=Active sessions', { timeout: 8_000 });

    const sessionRows = page.locator('text=This device');
    await expect(sessionRows).toHaveCount(1, { timeout: 8_000 });
  });
});
