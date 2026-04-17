import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './helpers/auth';

/** Wait for the sign-out navigation (Sidebar calls navigate('/') after logout) to settle,
 *  then clear all cookies so the HttpOnly refresh token cannot re-authenticate the user
 *  before api.post('/auth/logout') completes on the server. */
async function signOut(page: import('@playwright/test').Page) {
  await Promise.all([
    page.waitForURL(url => url.pathname === '/'),
    page.click('button:has-text("Sign out")'),
  ]);
  await page.context().clearCookies();
}

test.describe('Auth', () => {
  test('register with valid data lands on dashboard', async ({ page }) => {
    await registerUser(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('register with duplicate email shows error and stays on register', async ({ page }) => {
    // First registration succeeds
    const user = await registerUser(page);

    // Sign out and confirm navigation to landing page completed
    await signOut(page);

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
    // Wait for the sign-out navigate('/') to settle before visiting /login,
    // otherwise AuthLayout sees the still-authenticated user and bounces to /dashboard
    await signOut(page);
    await loginUser(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with wrong password shows error', async ({ page }) => {
    const user = await registerUser(page);
    await signOut(page);

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

    // Sign out — confirm we land on the public home page (not the dashboard)
    await signOut(page);

    // Navigating to a protected route while logged out should redirect to login
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login|\/register/, { timeout: 8_000 });
  });

  test('session persists on page reload', async ({ page }) => {
    await registerUser(page);
    await page.reload();
    // Auth hydrates from the cookie / /api/auth/me
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
