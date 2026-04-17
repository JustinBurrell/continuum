import { Page } from '@playwright/test';

function makeUser(overrides: Partial<{ firstName: string; lastName: string; email: string; username: string; password: string }> = {}) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return {
    firstName: 'E2E',
    lastName: 'User',
    email: `e2e+${id}@continuum.test`,
    username: `e2e${id}`,
    password: 'TestPass123!',
    ...overrides,
  };
}

export async function registerUser(page: Page, overrides: Parameters<typeof makeUser>[0] = {}) {
  const user = makeUser(overrides);
  await page.goto('/register');
  await page.fill('input[name="firstName"]', user.firstName);
  await page.fill('input[name="lastName"]', user.lastName);
  await page.fill('input[name="username"]', user.username);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button:has-text("Create account")');
  await page.waitForURL('**/dashboard');
  return user;
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/dashboard');
}
