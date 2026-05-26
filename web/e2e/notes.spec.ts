import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { registerUser } from './helpers/auth';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await page.goto('/notes');
    await page.locator('h1').waitFor({ state: 'visible', timeout: 10_000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await injectAxe(page);
    await checkA11y(page, null, { detailedReport: true });
  });

  test('create note appears in list', async ({ page }) => {
    await page.click('button:has-text("New note")');
    await page.waitForURL('**/notes/new');

    await page.fill('input[placeholder="Note title..."]', 'E2E Test Note');
    // Editor content (Tiptap) — click inside and type
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('This is a test note body.');

    await page.click('button:has-text("Save")');
    // Wait for save to complete and navigate to note detail before going back to list
    await page.waitForURL('**/notes/view');

    await page.goto('/notes');
    await expect(page.locator('text=E2E Test Note')).toBeVisible({ timeout: 10_000 });
  });

  test('edit note title updates in list and detail', async ({ page }) => {
    // Create a note first
    await page.click('button:has-text("New note")');
    await page.waitForURL('**/notes/new');
    await page.fill('input[placeholder="Note title..."]', 'Original Title');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Some content');
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/notes/view');

    // Now navigate to the notes list and open the note detail
    await page.goto('/notes');
    await expect(page.locator('text=Original Title')).toBeVisible({ timeout: 10_000 });
    await page.locator('text=Original Title').first().click();

    // From detail, click Edit
    await page.click('button:has-text("Edit")');
    await page.waitForURL('**/notes/edit');

    // Clear and retype the title
    const titleInput = page.locator('input[placeholder="Note title..."]');
    await titleInput.clear();
    await titleInput.fill('Updated Title');
    await page.click('button:has-text("Save")');

    // Back on the notes list, updated title should appear
    await page.goto('/notes');
    await expect(page.locator('text=Updated Title')).toBeVisible({ timeout: 10_000 });
  });

  test('delete note removes it from list without TypeError', async ({ page }) => {
    // Create a note — wait for the detail page before navigating away
    await page.click('button:has-text("New note")');
    await page.waitForURL('**/notes/new');
    await page.fill('input[placeholder="Note title..."]', 'Note To Delete');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Content');
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/notes/view');

    await page.goto('/notes');
    await expect(page.locator('text=Note To Delete')).toBeVisible({ timeout: 10_000 });

    // Capture console errors before navigating to note detail
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Open the note detail via the Link (passes state.id)
    await page.locator('text=Note To Delete').first().click();
    await page.waitForURL('**/notes/view');

    // The delete button is an icon-only danger button (red) with class bg-[#dc2626]
    await page.locator('button[class*="dc2626"]').click();
    // Confirm deletion in the modal
    await page.locator('button:has-text("Delete")').last().click();

    // Should navigate back to notes list after delete
    await page.waitForURL('**/notes', { timeout: 15_000 });
    await expect(page.locator('text=Note To Delete')).not.toBeVisible();

    // Regression: no Cannot read properties of undefined (reading 'length') errors
    const typeErrors = errors.filter(e => e.includes("Cannot read properties of undefined"));
    expect(typeErrors, 'No TypeError in console after delete').toHaveLength(0);
  });

  test('type filter chips filter the notes list', async ({ page }) => {
    // Create a "lecture" note
    await page.click('button:has-text("New note")');
    await page.waitForURL('**/notes/new');
    await page.fill('input[placeholder="Note title..."]', 'Lecture Note');
    await page.locator('select').selectOption('lecture');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Lecture content');
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/notes/view');

    await page.goto('/notes');
    await expect(page.locator('text=Lecture Note')).toBeVisible({ timeout: 10_000 });

    // Filter by "lecture"
    await page.locator('button', { hasText: /^lecture$/i }).click();
    await expect(page.locator('text=Lecture Note')).toBeVisible();
  });

  test('search bar returns matching notes and clears', async ({ page }) => {
    // Create a note with a distinct title
    await page.click('button:has-text("New note")');
    await page.waitForURL('**/notes/new');
    await page.fill('input[placeholder="Note title..."]', 'SearchableXYZ Note');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('Content');
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/notes/view');

    await page.goto('/notes');

    // Search for the note
    await page.fill('input[placeholder="Search notes..."]', 'SearchableXYZ');
    await expect(page.locator('text=SearchableXYZ Note')).toBeVisible({ timeout: 8_000 });

    // Clear search
    await page.fill('input[placeholder="Search notes..."]', '');
  });
});
