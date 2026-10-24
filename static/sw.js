const CACHE_NAME = 'hanzi-pwa-v1.0.17';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/static/img/favicon.png',
  '/static/img/icon-192.png',
  '/static/img/icon-512.png',
  '/static/img/icon-maskable-192.png',
  '/static/img/icon-maskable-512.png',
  '/static/img/apple-touch-icon.png',
  '/static/img/hanzidiary.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ can thiệp vào GET request cùng origin
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Bỏ qua các API động, audio TTS, dict cache, PHP endpoints
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/audio') ||
    url.pathname.startsWith('/dict') ||
    url.pathname.endsWith('.php')
  ) {
    return;
  }

  // Đối với trang HTML chính (navigation): Network First, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('/')))
    );
    return;
  }

  // Đối với static assets (CSS, JS, images, fonts): Stale-While-Revalidate
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Mặc định
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
