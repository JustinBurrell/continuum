import { Page } from '@playwright/test';

export const TEST_USER = {
  firstName: 'E2E',
  lastName: 'User',
  email: 'e2e@continuum.test',
  username: 'e2euser',
  password: 'TestPass123!',
};

export async function registerUser(page: Page, overrides: Partial<typeof TEST_USER> = {}) {
  const user = { ...TEST_USER, ...overrides };
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

export async function loginUser(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password,
) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/dashboard');
}
