const CACHE_NAME = 'hanzi-pwa-v1.5.7';
const API_CACHE_NAME = 'hanzi-api-v1.5.7';
const AUDIO_CACHE_NAME = 'hanzi-audio-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/static/css/fontawesome.min.css',
  '/static/js/hanzi-writer.min.js',
  '/static/img/icon-192.png',
  '/static/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME && key !== AUDIO_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ cache GET
  if (req.method !== 'GET') return;

  // 1. Audio TTS: Cache-First with Range Support and Sudden Network Drop Timeout
  if (url.pathname.startsWith('/audio/tts/') || url.pathname.startsWith('/static/sounds/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const cleanUrl = url.origin + url.pathname;
        
        // 1. Tra cứu nhanh từ cache (bỏ qua Range header)
        const cached = (await cache.match(cleanUrl)) || (await cache.match(req));
        if (cached) {
          return cached;
        }

        // 2. Fetch có timeout 3.2s để tránh treo khi đang dùng thì đột ngột mất mạng
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3200) : null;

        try {
          const fetchOptions = controller ? { signal: controller.signal } : {};
          const fullRes = await fetch(cleanUrl, fetchOptions);
          if (timeoutId) clearTimeout(timeoutId);

          if (fullRes && (fullRes.status === 200 || fullRes.status === 206)) {
            if (fullRes.status === 200) {
              cache.put(cleanUrl, fullRes.clone()).catch(() => {});
            }
            return fullRes;
          }
          return fullRes;
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          return new Response('', { status: 408, statusText: 'Network Unavailable' });
        }
      })()
    );
    return;
  }

  // 2. Dict JSON / Hanzi Writer Data: Stale-While-Revalidate
  if (url.pathname.startsWith('/dict/') || url.pathname.includes('hanzi-writer-data')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
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

  // 4. Static assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // 5. Read-only APIs: Stale-While-Revalidate
  const isReadOnlyApi = url.pathname.includes('api.php') && (
    url.search.includes('action=get_curriculum_types') ||
    url.search.includes('action=get_books') ||
    url.search.includes('action=get_lessons') ||
    url.search.includes('action=get_vocabularies') ||
    url.search.includes('action=get_lesson_contents') ||
    url.search.includes('action=get_grammar_tags') ||
    url.search.includes('action=get_top_shadowing_videos')
  );

  if (isReadOnlyApi) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: pass-through network
});
