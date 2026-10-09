import { expect, test } from './fixtures';

test('admin area redirects signed-out visitors to the admin login', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/admin\/login$/);
	await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
});

test('volunteer area redirects signed-out visitors to the volunteer login', async ({ page }) => {
	await page.goto('/volunteer');
	await expect(page).toHaveURL(/\/volunteer\/login$/);
	await expect(page.getByLabel('Username')).toBeVisible();
});

test('empty sign-in is rejected before contacting Supabase', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByText('Please fill in both fields.')).toBeVisible();
});

test('admin report list is closed to the public', async ({ request }) => {
	expect((await request.get('/api/reports')).status()).toBe(401);
});
