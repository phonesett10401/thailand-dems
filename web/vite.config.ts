import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale']
		})
	],
	// Fixed dev port so Playwright and the local URL are predictable.
	server: { port: 3001, strictPort: true },
	preview: { port: 3001, strictPort: true },
	test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.js'] }
});
