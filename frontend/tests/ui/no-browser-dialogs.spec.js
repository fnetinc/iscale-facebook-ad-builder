import { test, expect } from '@playwright/test';
import { testUser, mockLoginSuccess } from '../fixtures/test-data.js';

/**
 * Critical UI tests - ensure no browser alert()/confirm() calls
 *
 * Per specifications.md:
 * - NEVER use browser alert()
 * - NEVER use browser confirm()
 * - Always use Toast/Modal components
 */

test.describe('No Browser Dialogs Policy', () => {

  test('alert() should not be called anywhere in the app', async ({ page }) => {
    let alertCalled = false;

    // Listen for dialogs
    page.on('dialog', async dialog => {
      if (dialog.type() === 'alert') {
        alertCalled = true;
        await dialog.dismiss();
      }
    });

    await mockLoginSuccess(page);

    // Mock common API endpoints
    await page.route('**/api/v1/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);

    // Navigate through various pages
    const pagesToTest = ['/brands', '/products', '/generated-ads', '/facebook-campaigns'];

    for (const pageUrl of pagesToTest) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
    }

    expect(alertCalled).toBe(false);
  });

  test('confirm() should not be called for delete actions', async ({ page }) => {
    let confirmCalled = false;

    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        confirmCalled = true;
        await dialog.dismiss();
      }
    });

    await mockLoginSuccess(page);

    // Mock brands with one item
    await page.route('**/api/v1/brands**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: '1', name: 'Test Brand' }])
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);

    await page.goto('/brands');

    // Try to click delete if available
    const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete"), .delete-btn, [data-action="delete"]');

    if (await deleteButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.first().click();
      await page.waitForTimeout(1000);

      // confirm() should NOT have been called
      expect(confirmCalled).toBe(false);

      // Instead, a modal should appear
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="confirm"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('error responses show toast not alert', async ({ page }) => {
    let alertCalled = false;

    page.on('dialog', async dialog => {
      alertCalled = true;
      await dialog.dismiss();
    });

    // Mock failed login
    await page.route('**/api/v1/auth/login/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' })
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should NOT use alert
    expect(alertCalled).toBe(false);

    // Should use toast instead
    const toast = page.locator('.bg-red-500, [class*="toast"], [class*="error"], [role="alert"]');
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test('success messages use toast not alert', async ({ page }) => {
    let alertCalled = false;

    page.on('dialog', async dialog => {
      alertCalled = true;
      await dialog.dismiss();
    });

    await mockLoginSuccess(page);

    // Mock successful brand creation
    await page.route('**/api/v1/brands**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '1', name: 'New Brand' })
        });
      }
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);

    await page.goto('/brands');

    // Create a brand
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    if (await createButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.first().click();

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      await nameInput.fill('Test Brand');

      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.first().click();

      await page.waitForTimeout(2000);

      // Should NOT use alert
      expect(alertCalled).toBe(false);
    }
  });

});
