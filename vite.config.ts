import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'serve-fallback-in-preview',
			configurePreviewServer(server) {
				server.middlewares.use((req, res, next) => {
					const urlPath = req.url ? req.url.split('?')[0] : '';
					if (urlPath.endsWith('/404.html')) {
						const fallbackPath = path.resolve('build/404.html');
						if (fs.existsSync(fallbackPath)) {
							res.setHeader('Content-Type', 'text/html; charset=utf-8');
							res.end(fs.readFileSync(fallbackPath));
							return;
						}
					}
					next();
				});
			}
		}
	],
	server: {
		port: 5173,
		strictPort: true,
		origin: 'http://localhost:5173',
		allowedHosts: ['.iplan.casa', 'lvh.me', 'localhost'],
		hmr: {
			protocol: 'ws',
			host: 'localhost',
			port: 5173,
		}
	},
	preview: {
		port: 4173,
		strictPort: true,
		allowedHosts: ['.iplan.casa', 'lvh.me', 'localhost']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
