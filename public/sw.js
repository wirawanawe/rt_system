const CACHE_NAME = 'rt-warga-v1';
const STATIC_ASSETS = [
    '/warga',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Network-first for API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for static assets and pages
    if (url.pathname.startsWith('/warga') || url.pathname.startsWith('/_next/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const fetchPromise = fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                        return response;
                    })
                    .catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }
});
