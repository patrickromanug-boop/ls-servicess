const CACHE_NAME = 'ls-services-v3';
const APP_SHELL_URLS = [
  '/manifest.webmanifest',
  '/favicon.png',
  '/ls-services-logo.png'
];

// Install – cache only small static assets, never HTML pages.
// Caching HTML caused the "This page didn't load" error: after each deploy the
// cached page referenced old hashed JS files that no longer exist.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) await cache.put(url, response);
          } catch (error) {
            console.warn('Optional app shell asset was not cached:', url, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate – clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy:
// - Page navigations (HTML): always go to the network, never serve cached HTML.
// - Static assets (JS/CSS/images): network first, cache as an offline fallback.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache HTML pages – a stale page breaks after every new deploy.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
