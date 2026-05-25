import { test, expect } from '@playwright/test';
import { checkA11y } from 'axe-playwright';
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
    await checkA11y(page, null, { detailedReport: true });
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

    // Should stay on register with a specific error banner visible
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('text=An account with this email already exists')).toBeVisible({ timeout: 5000 });
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

// ─── Google OAuth regressions ─────────────────────────────────────────────────

test.describe('Google OAuth — login flow regression', () => {
  test('Continue with Google uses full-page redirect, not a popup', async ({ page, context }) => {
    await page.goto('/login');

    const popupPromise = context.waitForEvent('page', { timeout: 2_000 }).catch(() => null);

    // Intercept the OAuth redirect so we don't actually hit Google
    await page.route('**/api/auth/google', (route) => route.fulfill({ status: 302, headers: { Location: '/login?error=oauth_failed' } }));

    await page.click('button:has-text("Continue with Google")');

    const popup = await popupPromise;
    // No popup/new tab should have opened — this is a full-page redirect flow
    expect(popup).toBeNull();
  });
});

test.describe('Google OAuth — AuthCallback fallback UI', () => {
  test('/auth/callback?source=linking shows Close this tab button when window.close() is blocked', async ({ page }) => {
    // Stub the exchange and /auth/me endpoints so AuthCallback can complete the flow
    await page.route('**/api/auth/google/exchange', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'fake-token' }) })
    );
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ user: { _id: '1', email: 'test@test.com', googleId: 'g1', onboardingCompleted: false, tourCompleted: false } }),
      })
    );

    // Stub window.close so it never actually closes — simulates the blocked case
    await page.addInitScript(() => {
      window.close = () => {};
      window.BroadcastChannel = class {
        constructor() {}
        postMessage() {}
        close() {}
      };
    });

    await page.goto('/auth/callback?code=fake-code&source=linking');

    await expect(page.locator('text=Google connected!')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button:has-text("Close this tab")')).toBeVisible();
    await expect(page.locator('text=return to the app')).toBeVisible();
  });
});
