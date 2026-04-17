import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';

test.describe('Flashcards — core value path', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await page.goto('/flashcards');
  });

  test('create flashcard set appears in list', async ({ page }) => {
    await page.click('button:has-text("New set")');

    await page.fill('input[placeholder="e.g. Biology Chapter 5"]', 'E2E Test Set');
    await page.click('button:has-text("Create set")');

    await expect(page.locator('text=E2E Test Set')).toBeVisible({ timeout: 10_000 });
  });

  test('add card to set — card count updates', async ({ page }) => {
    // Create a set
    await page.click('button:has-text("New set")');
    await page.fill('input[placeholder="e.g. Biology Chapter 5"]', 'Card Test Set');
    await page.click('button:has-text("Create set")');

    // Navigate into the set detail
    await page.locator('text=Card Test Set').first().click();
    await page.waitForURL('**/flashcards/view');

    // Add a card
    await page.click('button:has-text("Add card")');
    await page.fill('textarea[placeholder="Question or term..."]', 'What is 2+2?');
    await page.fill('textarea[placeholder="Answer or definition..."]', '4');
    // Click the submit button inside the modal
    await page.locator('[role="dialog"] button:has-text("Add card"), div[class*="space"] button:has-text("Add card")').last().click();

    // Card should appear in the set
    await expect(page.locator('text=What is 2+2?')).toBeVisible({ timeout: 10_000 });
  });

  test('study mode: reveal answer then mark known — completes session', async ({ page }) => {
    // Create a set and add one card
    await page.click('button:has-text("New set")');
    await page.fill('input[placeholder="e.g. Biology Chapter 5"]', 'Study Test Set');
    await page.click('button:has-text("Create set")');

    await page.locator('text=Study Test Set').first().click();
    await page.waitForURL('**/flashcards/view');

    await page.click('button:has-text("Add card")');
    await page.fill('textarea[placeholder="Question or term..."]', 'Capital of France?');
    await page.fill('textarea[placeholder="Answer or definition..."]', 'Paris');
    await page.locator('button:has-text("Add card")').last().click();
    await expect(page.locator('text=Capital of France?')).toBeVisible({ timeout: 10_000 });

    // Click Study button (in set detail header)
    await page.click('button:has-text("Study")');
    await page.waitForURL('**/flashcards/study');

    // The front of the card should be visible
    await expect(page.locator('text=Question')).toBeVisible({ timeout: 5_000 });

    // Reveal the answer
    await page.click('button:has-text("Reveal answer")');
    await expect(page.locator('text=Answer')).toBeVisible({ timeout: 3_000 });

    // Mark as known
    await page.click('button:has-text("Got it!")');

    // Session complete screen should appear
    await expect(page.locator('text=Set complete!')).toBeVisible({ timeout: 5_000 });
  });

  test('study history link is visible on set detail', async ({ page }) => {
    // Create a set and navigate to its detail
    await page.click('button:has-text("New set")');
    await page.fill('input[placeholder="e.g. Biology Chapter 5"]', 'History Link Set');
    await page.click('button:has-text("Create set")');
    await page.locator('text=History Link Set').first().click();
    await page.waitForURL('**/flashcards/view');

    // History tab should be present (even if empty)
    await expect(page.getByRole('button', { name: /history/i })).toBeVisible();
  });
});
