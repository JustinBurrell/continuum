import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';

test.describe('Career — Applications', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await page.goto('/applications');
  });

  test('create application appears in list', async ({ page }) => {
    await page.click('button:has-text("Add application")');

    await page.fill('input[placeholder="Google"]', 'Anthropic');
    await page.fill('input[placeholder="Software Engineer"]', 'Frontend Engineer');
    // Submit — use .last() because the header button is also "Add application" and sits behind the backdrop
    await page.locator('button:has-text("Add application")').last().click();

    await expect(page.locator('text=Anthropic')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Frontend Engineer')).toBeVisible();
  });

  test('edit application status updates the stage badge', async ({ page }) => {
    // Create an application first
    await page.click('button:has-text("Add application")');
    await page.fill('input[placeholder="Google"]', 'Status Corp');
    await page.fill('input[placeholder="Software Engineer"]', 'SWE');
    await page.locator('button:has-text("Add application")').last().click();
    await expect(page.locator('text=Status Corp')).toBeVisible({ timeout: 10_000 });

    // Open the application detail
    await page.getByRole('link', { name: 'View' }).first().click();
    await page.waitForURL('**/applications/view');

    // Enter edit mode, change stage, save
    await page.click('button:has-text("Edit")');
    await page.locator('select').selectOption('interview');
    await page.click('button:has-text("Save")');

    // Go back to list and verify badge updated
    await page.goto('/applications');
    await expect(page.locator('text=interview').first()).toBeVisible({ timeout: 8_000 });
  });

  test('delete application removes it from list', async ({ page }) => {
    await page.click('button:has-text("Add application")');
    await page.fill('input[placeholder="Google"]', 'Delete Corp');
    await page.fill('input[placeholder="Software Engineer"]', 'PM');
    await page.locator('button:has-text("Add application")').last().click();
    await expect(page.locator('text=Delete Corp')).toBeVisible({ timeout: 10_000 });

    // Open detail and delete — delete button is icon-only with title attr
    await page.getByRole('link', { name: 'View' }).first().click();
    await page.waitForURL('**/applications/view');

    await page.click('button[title="Delete application"]');
    // Confirm in the modal
    await page.locator('button:has-text("Delete")').last().click();

    await page.waitForURL('**/applications');
    await expect(page.locator('text=Delete Corp')).not.toBeVisible({ timeout: 8_000 });
  });

  test('navigate to Resumes tab renders the list', async ({ page }) => {
    await page.goto('/resumes');
    // The resumes page should load (even if empty)
    await expect(page.getByRole('heading').filter({ hasText: /resumes/i })).toBeVisible({ timeout: 8_000 });
  });
});
