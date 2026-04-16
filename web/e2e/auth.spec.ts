import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './helpers/auth';

test.describe('Auth', () => {
  test('register with valid data lands on dashboard', async ({ page }) => {
    await registerUser(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('register with duplicate email shows error and stays on register', async ({ page }) => {
    // First registration succeeds
    const user = await registerUser(page);

    // Sign out so we can try again
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\//);

    // Second registration with same email should fail
    await page.goto('/register');
    await page.fill('input[name="firstName"]', user.firstName);
    await page.fill('input[name="lastName"]', user.lastName);
    await page.fill('input[name="username"]', 'differentusername');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button:has-text("Create account")');

    // Should stay on register with an error banner visible
    await expect(page).toHaveURL(/\/register/);
    // Backend returns 'Email or username already in use' — friendlyError falls back to 'Registration failed'
    await expect(page.locator('text=Registration failed')).toBeVisible({ timeout: 5000 });
  });

  test('login with correct credentials lands on dashboard', async ({ page }) => {
    const user = await registerUser(page);
    await page.click('button:has-text("Sign out")');
    await loginUser(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with wrong password shows error', async ({ page }) => {
    const user = await registerUser(page);
    await page.click('button:has-text("Sign out")');

    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'WrongPassword99!');
    await page.click('button:has-text("Sign in")');

    await expect(page).toHaveURL(/\/login/);
    // Error banner should appear
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({ timeout: 5000 });
  });

  test('logout redirects to home; protected routes redirect to login', async ({ page }) => {
    await registerUser(page);

    // Click "Sign out" in the sidebar
    await page.click('button:has-text("Sign out")');

    // Navigating to a protected route after logout should redirect to login
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login|\/register/);
  });

  test('session persists on page reload', async ({ page }) => {
    await registerUser(page);
    await page.reload();
    // Auth hydrates from the cookie / /api/auth/me
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
