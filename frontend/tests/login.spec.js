import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // Check page elements are visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error toast
    await expect(page.locator('.bg-red-500, [class*="error"], [class*="toast"]')).toBeVisible({ timeout: 3000 });
  });

  test('successful login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Use the test user credentials
    await page.fill('input[type="email"]', 'test@playwright.com');
    await page.fill('input[type="password"]', 'testpass123');

    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation - should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard)?$/, { timeout: 5000 });

    // Should see dashboard heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 3000 });
  });
});
