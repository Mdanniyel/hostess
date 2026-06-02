/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

// Derive the SPA base from the SW's own URL so this works at any path.
// e.g. SW at /he-IL/corp/hostess-app/service-worker.js → base = '/he-IL/corp/hostess-app/'
const SPA_BASE = new URL('./', self.location.href).pathname;

// Pre-cache all JS/CSS build chunks + static files.
// Note: 200.html (the SPA fallback) is NOT included in `build` or `files` by adapter-static.
// We add it explicitly so it is always available offline.
const ASSETS = [
  ...build,
  ...files.filter((f) => !f.endsWith('.gz')),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // Activate immediately, don't wait for old tabs to close
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only intercept same-origin requests within the SPA's path scope.
  // This prevents the SW from accidentally caching Rails API calls or cross-origin assets.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SPA_BASE)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      // Navigation requests (page loads / browser back-forward) → serve SPA shell
      if (event.request.mode === 'navigate') {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        // Fallback: return the 200.html SPA shell so client-side routing works offline.
        // We try two locations: the exact match first, then the explicit fallback file.
        const shell =
          (await cache.match(`${self.location.origin}${SPA_BASE}200.html`)) ??
          (await cache.match(event.request));

        if (shell) return shell;

        // Last resort: fetch from network (first visit, online)
        return fetch(event.request);
      }

      // All other requests (JS, CSS, images, fonts) → cache-first
      const cached = await cache.match(event.request);
      if (cached) return cached;

      // Not in cache → fetch from network and cache successful responses
      try {
        const response = await fetch(event.request);
        if (response.status === 200) {
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        // Offline and asset not in cache — nothing we can do
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
