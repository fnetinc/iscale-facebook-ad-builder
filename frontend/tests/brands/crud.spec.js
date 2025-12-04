import { test, expect } from '@playwright/test';
import { testUser, testBrand, mockLoginSuccess, blockBrowserDialogs } from '../fixtures/test-data.js';

test.describe('Brand Management', () => {

  test.beforeEach(async ({ page }) => {
    blockBrowserDialogs(page);
    await mockLoginSuccess(page);

    // Mock brands API
    await page.route('**/api/v1/brands', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'brand-1', name: 'Existing Brand', primary_color: '#FF0000' }
          ])
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-brand-id',
            ...body,
            created_at: new Date().toISOString()
          })
        });
      } else {
        route.continue();
      }
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('brands page loads and displays brands', async ({ page }) => {
    await page.goto('/brands');

    // Should see the brands list
    await expect(page.getByText('Existing Brand')).toBeVisible({ timeout: 5000 });
  });

  test('create brand modal opens', async ({ page }) => {
    await page.goto('/brands');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    await createButton.first().click();

    // Modal should appear with form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible({ timeout: 3000 });
  });

  test('create brand with valid data', async ({ page }) => {
    await page.goto('/brands');

    // Click create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    await createButton.first().click();

    // Fill form
    await page.fill('input[name="name"], input[placeholder*="name" i]', testBrand.name);

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.first().click();

    // Should show success toast
    await expect(page.locator('.bg-green-500, [class*="success"]')).toBeVisible({ timeout: 5000 });
  });

  test('delete brand shows confirmation modal', async ({ page }) => {
    await page.goto('/brands');

    // Find and click delete button
    const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete"), .delete-btn').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation modal (NOT browser confirm)
      await expect(page.locator('[role="dialog"], .modal, [class*="modal"]')).toBeVisible({ timeout: 3000 });
    }
  });

});

test.describe('Brand Form Validation', () => {

  test.beforeEach(async ({ page }) => {
    blockBrowserDialogs(page);
    await mockLoginSuccess(page);

    await page.route('**/api/v1/brands', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        if (!body.name) {
          route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Name is required' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'new-id', ...body })
          });
        }
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('shows error when submitting empty form', async ({ page }) => {
    await page.goto('/brands');

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    await createButton.first().click();

    // Clear any default value and submit
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    await nameInput.fill('');

    const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
    await submitButton.first().click();

    // Should show validation error (either inline or toast)
    await expect(page.locator('[class*="error"], .bg-red-500, [aria-invalid="true"]')).toBeVisible({ timeout: 3000 });
  });

});
