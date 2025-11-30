import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Video Ad Builder/i);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('text=Sign In')).toBeVisible();
});
