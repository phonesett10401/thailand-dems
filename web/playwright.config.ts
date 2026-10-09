import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	webServer: {
		command: 'npm run build && npm run preview',
		port: 3001,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	use: { ...devices['Pixel 7'], baseURL: 'http://localhost:3001' }
});
