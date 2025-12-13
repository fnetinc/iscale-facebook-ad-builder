// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

test.describe('Brand Scrapes Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });
  });

  test('brand scrapes page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/research/brand-scrapes`);

    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /scrape.*brand|brand.*scrape/i })).toBeVisible({ timeout: 10000 });

    // Check form elements
    await expect(page.locator('input[type="text"], input[placeholder*="brand" i]')).toBeVisible();
    await expect(page.locator('input[type="url"], input[placeholder*="facebook" i]')).toBeVisible();
  });

  test('brand scrapes navigation works', async ({ page }) => {
    // Navigate via sidebar
    await page.click('text=Research');
    await page.click('text=Scrape Brand Ads');

    await expect(page).toHaveURL(/\/research\/brand-scrapes/);
  });

  test('form validation shows error for invalid URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/research/brand-scrapes`);

    // Fill form with invalid URL (missing view_all_page_id)
    await page.fill('input[placeholder*="brand" i], input[type="text"]', 'TestBrand');
    await page.fill('input[placeholder*="facebook" i], input[type="url"]', 'https://facebook.com/invalid');

    // Submit
    await page.click('button[type="submit"]');

    // Should show error (toast or inline)
    await expect(page.locator('text=/view_all_page_id|invalid.*url/i')).toBeVisible({ timeout: 5000 });
  });
});
