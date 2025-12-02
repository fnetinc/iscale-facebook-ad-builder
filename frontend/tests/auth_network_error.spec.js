import { test, expect } from '@playwright/test';

test.describe('Auth Network Error Handling', () => {
    test('should NOT logout on network error during token refresh', async ({ page }) => {
        // Mock the API calls
        await page.route('**/api/v1/auth/login/json', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'fake_access_token',
                    refresh_token: 'fake_refresh_token',
                    token_type: 'bearer'
                })
            });
        });

        await page.route('**/api/v1/auth/me', async route => {
            const headers = route.request().headers();
            if (headers['authorization'] === 'Bearer fake_access_token') {
                // First call succeeds
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 1, email: 'test@example.com' })
                });
            } else {
                // Subsequent calls fail with 401 to trigger refresh
                await route.fulfill({
                    status: 401,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Unauthorized' })
                });
            }
        });

        // Go to login page
        await page.goto('/login');

        // Perform login
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Wait for login to complete (tokens set)
        await page.waitForFunction(() => localStorage.getItem('accessToken') === 'fake_access_token');

        // Now, simulate a scenario where the token expires and refresh fails due to NETWORK ERROR
        // 1. Mock /me to return 401 (already done above for non-matching tokens, but let's force it)
        await page.route('**/api/v1/auth/me', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'Token expired' })
            });
        });

        // 2. Mock /refresh to fail with a network error
        await page.route('**/api/v1/auth/refresh', async route => {
            await route.abort('failed'); // Simulates network failure
        });

        // Trigger a re-fetch or reload the page to trigger initAuth
        await page.reload();

        // Wait a bit for the auth logic to run
        await page.waitForTimeout(1000);

        // Verify tokens are STILL present in localStorage
        const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
        const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

        expect(accessToken).toBe('fake_access_token');
        expect(refreshToken).toBe('fake_refresh_token');

        // Verify we are NOT redirected to login (or at least tokens are preserved)
        // Note: The UI might show an error or loading state, but the critical thing is that credentials are safe.
    });

    test('should logout on 401 error during token refresh', async ({ page }) => {
        // Mock login again
        await page.route('**/api/v1/auth/login/json', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'fake_access_token',
                    refresh_token: 'fake_refresh_token',
                    token_type: 'bearer'
                })
            });
        });

        await page.goto('/login');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForFunction(() => localStorage.getItem('accessToken') === 'fake_access_token');

        // Mock /me to fail
        await page.route('**/api/v1/auth/me', async route => {
            await route.fulfill({ status: 401 });
        });

        // Mock /refresh to fail with 401 (Explicit denial)
        await page.route('**/api/v1/auth/refresh', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'Invalid refresh token' })
            });
        });

        await page.reload();
        await page.waitForTimeout(1000);

        // Verify tokens are REMOVED
        const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(accessToken).toBeNull();
    });
});
