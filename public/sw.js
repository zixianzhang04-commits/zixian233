const CACHE = 'ledger-v4';

// Install: pre-cache key assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './',
      './index.html',
      './sql-wasm.wasm',
      './manifest.json',
      './icon-192.png',
      './icon-512.png',
    ]).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch: cache every successful request
self.addEventListener('fetch', (e) => {
  // Only handle GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Return cached immediately, update cache in background
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok || response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
