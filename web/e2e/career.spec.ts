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
    // Submit
    await page.click('button:has-text("Add application")');

    await expect(page.locator('text=Anthropic')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Frontend Engineer')).toBeVisible();
  });

  test('edit application status updates the stage badge', async ({ page }) => {
    // Create an application first
    await page.click('button:has-text("Add application")');
    await page.fill('input[placeholder="Google"]', 'Status Corp');
    await page.fill('input[placeholder="Software Engineer"]', 'SWE');
    await page.click('button:has-text("Add application")');
    await expect(page.locator('text=Status Corp')).toBeVisible({ timeout: 10_000 });

    // Open the application detail
    await page.locator('button:has-text("View")').first().click();
    await page.waitForURL('**/applications/view');

    // Change status — look for a status select or stage buttons
    const stageSelect = page.locator('select[class*="input"], select').first();
    if (await stageSelect.isVisible()) {
      await stageSelect.selectOption('interview');
    } else {
      // Some views use click-based stage chips
      await page.locator('button:has-text("interview"), text=interview').first().click();
    }

    // Go back to list and verify badge updated
    await page.goto('/applications');
    await expect(page.locator('text=interview')).toBeVisible({ timeout: 8_000 });
  });

  test('delete application removes it from list', async ({ page }) => {
    await page.click('button:has-text("Add application")');
    await page.fill('input[placeholder="Google"]', 'Delete Corp');
    await page.fill('input[placeholder="Software Engineer"]', 'PM');
    await page.click('button:has-text("Add application")');
    await expect(page.locator('text=Delete Corp')).toBeVisible({ timeout: 10_000 });

    // Open detail and delete
    await page.locator('button:has-text("View")').first().click();
    await page.waitForURL('**/applications/view');

    await page.click('button:has-text("Delete")');
    // Confirm if modal
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.goto('/applications');
    await expect(page.locator('text=Delete Corp')).not.toBeVisible({ timeout: 8_000 });
  });

  test('navigate to Resumes tab renders the list', async ({ page }) => {
    await page.goto('/resumes');
    // The resumes page should load (even if empty)
    await expect(page.locator('h1:has-text("Resumes"), text=Resumes')).toBeVisible({ timeout: 8_000 });
  });
});
