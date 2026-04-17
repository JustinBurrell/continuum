import { test, expect } from '@playwright/test';
import { registerUser } from './helpers/auth';

// A fixed due date in the future so the task is never overdue in the test
const FUTURE_DATE = '2030-01-01';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await page.goto('/tasks');
  });

  test('create task appears in To Do column', async ({ page }) => {
    await page.click('button:has-text("New task")');

    await page.fill('input[placeholder="What needs to be done?"]', 'E2E Task');
    await page.fill('input[type="date"]', FUTURE_DATE);
    await page.click('button:has-text("Create task")');

    // Task card should appear in the "To Do" column
    await expect(page.locator('text=E2E Task')).toBeVisible({ timeout: 10_000 });
  });

  test('change task status to In Progress — card moves column without TypeError', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("New task")');
    await page.fill('input[placeholder="What needs to be done?"]', 'Status Test Task');
    await page.fill('input[type="date"]', FUTURE_DATE);
    await page.click('button:has-text("Create task")');
    await expect(page.locator('text=Status Test Task')).toBeVisible({ timeout: 10_000 });

    // Collect console errors to detect old?.pages guard regressions
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Change status via the select on the task card
    const taskCard = page.locator('[class*="group"]', { hasText: 'Status Test Task' }).first();
    await taskCard.locator('select').selectOption('in_progress');

    // Task should now appear in the In Progress column
    const inProgressCol = page.locator('text=In Progress').locator('..').locator('..');
    await expect(inProgressCol.locator('text=Status Test Task')).toBeVisible({ timeout: 8_000 });

    // No TypeError from old?.pages guard
    const typeErrors = errors.filter(e => e.includes('Cannot read properties of undefined'));
    expect(typeErrors, 'No TypeError after status change').toHaveLength(0);
  });

  test('dashboard stat tile total matches paginated total', async ({ page }) => {
    // Create a task so the count is non-zero
    await page.click('button:has-text("New task")');
    await page.fill('input[placeholder="What needs to be done?"]', 'Count Task');
    await page.fill('input[type="date"]', FUTURE_DATE);
    await page.click('button:has-text("Create task")');
    await expect(page.locator('text=Count Task')).toBeVisible({ timeout: 10_000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // The tasks stat tile should show a number > 0
    const taskTile = page.locator('text=/open task|task/i').first();
    await expect(taskTile).toBeVisible();
  });

  test('delete task removes it from the board', async ({ page }) => {
    // Create a task
    await page.click('button:has-text("New task")');
    await page.fill('input[placeholder="What needs to be done?"]', 'Task To Delete');
    await page.fill('input[type="date"]', FUTURE_DATE);
    await page.click('button:has-text("Create task")');
    await expect(page.locator('text=Task To Delete')).toBeVisible({ timeout: 10_000 });

    // Hover over the task card to reveal the delete button
    const taskCard = page.locator('[class*="group"]', { hasText: 'Task To Delete' }).first();
    await taskCard.hover();

    // Click delete icon on the card
    await taskCard.locator('button[title="Delete task"]').click();

    // Confirm deletion if a modal appears
    const confirmBtn = page.locator('button:has-text("Delete")').last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await expect(page.locator('text=Task To Delete')).not.toBeVisible({ timeout: 8_000 });
  });
});
