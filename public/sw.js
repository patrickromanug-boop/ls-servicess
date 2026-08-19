const CACHE_NAME = 'ls-services-v2';
const APP_SHELL_URLS = [
  '/',
  '/dashboard',
  '/jobs',
  '/manifest.webmanifest'
];

// Install – cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) await cache.put(url, response);
          } catch (error) {
            // A single unavailable route must not abort PWA installation.
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

// Fetch – network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/');
        });
      })
  );
});
