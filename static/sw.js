const CACHE_NAME = 'hanzi-pwa-v1.4.3';
const API_CACHE_NAME = 'hanzi-api-v1.4.3';
const AUDIO_CACHE_NAME = 'hanzi-audio-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/static/css/tw.css',
  '/static/vendor/fontawesome/css/all.min.css',
  '/static/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  '/static/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  '/static/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  '/static/js/chart.min.js',
  '/static/js/opencc-full.js',
  '/static/js/pinyin-pro.js',
  '/static/js/hanzi-writer.min.js',
  '/static/js/offline-store.js',
  '/static/js/app.js',
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
  const allowed = [CACHE_NAME, API_CACHE_NAME, AUDIO_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !allowed.includes(key)).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ can thiệp vào GET request
  if (req.method !== 'GET') return;

  // Bỏ qua offline bundle request để client tự quản lý qua IndexedDB
  if (url.pathname.includes('offline_bundle') || url.pathname.includes('offline-bundle')) {
    return;
  }

  // 1. Audio TTS cache: Cache-First
  if (url.pathname.startsWith('/audio/tts/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((audioCache) => {
        return audioCache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res && res.status === 200) {
              audioCache.put(req, res.clone());
            }
            return res;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // 2. API requests (/api.php hoặc /api/*): Network-First, fallback to API cache
  if (url.pathname.startsWith('/api.php') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/api_')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((c) => c.put(req, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.open(API_CACHE_NAME).then((c) => {
            return c.match(req).then((cached) => {
              if (cached) return cached;
              return c.match(url.pathname + url.search);
            });
          });
        })
    );
    return;
  }

  // 3. Navigation (HTML): Network-First, fallback to cached '/'
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
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 4. Static assets (/static/): Stale-While-Revalidate
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

  // 5. External CDN assets (Google Fonts, cdnjs): Stale-While-Revalidate
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com') || url.origin.includes('cdnjs.cloudflare.com')) {
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
