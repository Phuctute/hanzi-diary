const CACHE_NAME = 'hanzi-pwa-v1.6.5';
const API_CACHE_NAME = 'hanzi-api-v1.6.5';
const AUDIO_CACHE_NAME = 'hanzi-audio-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/static/css/tw.css',
  '/static/vendor/fontawesome/css/all.min.css',
  '/static/js/hanzi-writer.min.js',
  '/static/js/opencc-full.js',
  '/static/js/pinyin-pro.js',
  '/static/js/chart.min.js',
  '/static/js/offline-store.js',
  '/static/img/icon-192.png',
  '/static/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Nạp độc lập từng tài nguyên bằng Promise.allSettled để không bao giờ bị huỷ bỏ toàn bộ nếu 1 file gặp sự cố
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Pre-cache item failed:', url, err);
          })
        )
      );
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

  // 3. Navigation (HTML): Fast Network with Cache Fallback & Instant Offline
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // A. Nếu thiết bị đang offline hoàn toàn, lấy trực tiếp từ cache ngay lập tức (không chờ mạng)
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          const cached = (await cache.match(req)) || 
                         (await cache.match('/')) || 
                         (await caches.match(req)) || 
                         (await caches.match('/'));
          if (cached) return cached;
        }

        // B. Thử tải từ mạng với Timeout 1.8s (tránh treo khi Wi-Fi bắt được sóng nhưng không có Internet)
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 1800) : null;

        try {
          const fetchOptions = controller ? { signal: controller.signal } : {};
          const netRes = await fetch(req, fetchOptions);
          if (timeoutId) clearTimeout(timeoutId);

          if (netRes && (netRes.status === 200 || netRes.status === 304)) {
            cache.put(req, netRes.clone()).catch(() => {});
            cache.put('/', netRes.clone()).catch(() => {});
            return netRes;
          }
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
        }

        // C. Mạng hỏng hoặc timeout -> Lấy bản sao từ Cache
        const fallbackCached = (await cache.match(req)) || 
                               (await cache.match('/')) || 
                               (await caches.match(req)) || 
                               (await caches.match('/'));
        if (fallbackCached) {
          return fallbackCached;
        }

        // D. Phòng ngừa tối thượng: không bao giờ để Chrome nhận undefined dẫn đến ERR_FAILED
        return new Response(
          `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hanzi Diary - Ngoại tuyến</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f4f8; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; text-align: center; }
    .card { background: #fff; border-radius: 24px; padding: 32px 24px; max-width: 380px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 18px; font-weight: 800; color: #027AB3; margin: 0 0 8px 0; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px 0; }
    button { background: #027AB3; color: #fff; border: none; border-radius: 14px; padding: 12px 24px; font-size: 14px; font-weight: 700; width: 100%; cursor: pointer; transition: all .2s; }
    button:active { transform: scale(0.97); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Chưa có dữ liệu ngoại tuyến</h1>
    <p>Bạn cần kết nối Internet và mở ứng dụng <b>1 lần</b> để nạp toàn bộ bài học và từ vựng vào máy. Sau đó bạn có thể dùng hoàn toàn offline.</p>
    <button onclick="window.location.reload()">Thử tải lại</button>
  </div>
</body>
</html>`,
          {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          }
        );
      })()
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
