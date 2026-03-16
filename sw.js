const CACHE_NAME = 'calc-obras-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Stale-while-revalidate for CDN scripts and fonts
  if (request.url.startsWith('https://cdn') || request.url.startsWith('https://fonts')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => cachedResponse); // fallback to cache if offline
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Network falling back to cache for local assets
  event.respondWith(
    fetch(request).then(response => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response.clone());
        return response;
      });
    }).catch(() => caches.match(request))
  );
});
