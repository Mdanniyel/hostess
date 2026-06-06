/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Take control of open tabs immediately and activate the service worker
self.addEventListener('install', () => self.skipWaiting());
clientsClaim();

// Derive the base path of the app
const SPA_BASE = new URL('./', self.location.href).pathname;

// Build the precache manifest
// We include:
// 1. SvelteKit compiled JS/CSS build chunks (already hashed, so revision is null)
// 2. Files in the static directory (without hashes, so we use version as revision)
// 3. The fallback shell page '404.html' (used for offline navigation)
const precacheManifest = [
  ...build.map((url) => ({ url, revision: null })),
  ...files
    .filter((f) => !f.endsWith('.gz'))
    .map((url) => ({ url, revision: version })),
  { url: `${SPA_BASE}404.html`, revision: version }
];

// Precache all assets - Workbox serves these Cache-First automatically
precacheAndRoute(precacheManifest);

// Handle navigation requests (page refreshes / URL changes)
// This intercepts page requests like http://localhost:5173/he-IL/corp/hostess-app/events/251580/invitations/63052586
// and serves the cached '404.html' fallback page so SvelteKit's client-side routing works offline.
const handler = createHandlerBoundToURL(`${SPA_BASE}404.html`);
const navigationRoute = new NavigationRoute(handler, {
  // Only intercept navigation requests under the app's base path
  allowlist: [new RegExp(`^${SPA_BASE}`)],
  // Ignore request paths with extensions (like .js, .css, etc.) or API endpoints
  denylist: [
    new RegExp(`\\.[a-zA-Z0-9]+$`),
    new RegExp(`${SPA_BASE}api/`)
  ]
});
registerRoute(navigationRoute);
