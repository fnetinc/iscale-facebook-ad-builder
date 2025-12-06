import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  // Homepage might redirect to login or show title
  await expect(page).not.toHaveURL(/error/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
});
