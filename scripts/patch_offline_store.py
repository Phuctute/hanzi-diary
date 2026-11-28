import re

with open('static/js/offline-store.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Bump version to 2.4.7
content = content.replace("const CURRENT_VERSION = '2.4.6';", "const CURRENT_VERSION = '2.4.7';")

# 2. Optimize populateCacheStorage to be non-blocking with chunking
old_populate_func = re.search(r'async function populateCacheStorage\(bundle\)[\s\S]*?(?=async function fetchBundleFile)', content).group(0)

new_populate_func = '''async function populateCacheStorage(bundle) {
        if (!('caches' in window)) return;
        try {
            const cache = await caches.open(API_CACHE_NAME);
            const jsonResp = (obj) => new Response(JSON.stringify(obj), {
                headers: { 'Content-Type': 'application/json', 'X-Offline-Preload': '1' }
            });

            // 1. Caching nhanh các danh mục cốt lõi
            if (bundle.curriculums) {
                cache.put('/api.php?action=get_curriculum_types', jsonResp(bundle.curriculums)).catch(() => {});
                cache.put('/api/curriculums', jsonResp(bundle.curriculums)).catch(() => {});
            }

            if (bundle.books) {
                cache.put('/api.php?action=get_books', jsonResp(bundle.books)).catch(() => {});
                cache.put('/api/books', jsonResp(bundle.books)).catch(() => {});
                if (bundle.curriculums) {
                    for (const c of bundle.curriculums) {
                        const cb = bundle.books.filter(b => String(b.curriculum_type_id) === String(c.id));
                        cache.put(`/api.php?action=get_books&curriculum_id=${c.id}`, jsonResp(cb)).catch(() => {});
                        cache.put(`/api/books?curriculum_id=${c.id}`, jsonResp(cb)).catch(() => {});
                    }
                }
            }

            if (bundle.lessons) {
                cache.put('/api.php?action=get_lessons', jsonResp(bundle.lessons)).catch(() => {});
                cache.put('/api/lessons', jsonResp(bundle.lessons)).catch(() => {});
                if (bundle.books) {
                    for (const b of bundle.books) {
                        const bl = bundle.lessons.filter(l => String(l.book_id) === String(b.book_id));
                        cache.put(`/api.php?action=get_lessons&book_id=${b.book_id}`, jsonResp(bl)).catch(() => {});
                        cache.put(`/api/lessons?book_id=${b.book_id}`, jsonResp(bl)).catch(() => {});
                    }
                }
            }

            if (bundle.grammar) {
                cache.put('/api.php?action=get_grammar', jsonResp({ success: true, data: bundle.grammar })).catch(() => {});
                cache.put('/api/grammar', jsonResp(bundle.grammar)).catch(() => {});
            }
            if (bundle.radicals) {
                cache.put('/api.php?action=get_radicals', jsonResp({ success: true, data: bundle.radicals })).catch(() => {});
                cache.put('/api/radicals', jsonResp(bundle.radicals)).catch(() => {});
            }
            if (bundle.measure_words) {
                cache.put('/api.php?action=get_measure_words', jsonResp({ success: true, data: bundle.measure_words })).catch(() => {});
                cache.put('/api/measure_words', jsonResp(bundle.measure_words)).catch(() => {});
            }

            // 2. Caching theo đợt ngầm (chunking) cho từ vựng và bài khoá để không bao giờ nghẽn luồng UI
            const scheduleWork = (task) => {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(task, { timeout: 1500 });
                } else {
                    setTimeout(task, 40);
                }
            };

            const vocabEntries = bundle.lesson_vocab ? Object.entries(bundle.lesson_vocab) : [];
            let vIdx = 0;
            function processVocabChunk() {
                const chunk = vocabEntries.slice(vIdx, vIdx + 15);
                vIdx += 15;
                for (const [lid, vocabs] of chunk) {
                    cache.put(`/api.php?action=get_vocabularies&lesson_id=${lid}`, jsonResp(vocabs)).catch(() => {});
                    cache.put(`/api/vocabularies?lesson_id=${lid}`, jsonResp(vocabs)).catch(() => {});
                }
                if (vIdx < vocabEntries.length) scheduleWork(processVocabChunk);
            }
            if (vocabEntries.length > 0) scheduleWork(processVocabChunk);

            const contentEntries = bundle.lesson_contents ? Object.entries(bundle.lesson_contents) : [];
            let cIdx = 0;
            function processContentChunk() {
                const chunk = contentEntries.slice(cIdx, cIdx + 15);
                cIdx += 15;
                for (const [lid, cnt] of chunk) {
                    cache.put(`/api.php?action=get_lesson_contents&lesson_id=${lid}`, jsonResp({ success: true, data: cnt })).catch(() => {});
                    cache.put(`/api/lesson_contents?lesson_id=${lid}`, jsonResp(cnt)).catch(() => {});
                }
                if (cIdx < contentEntries.length) scheduleWork(processContentChunk);
            }
            if (contentEntries.length > 0) scheduleWork(processContentChunk);

        } catch (e) {
            console.warn('[HanziOffline] populateCacheStorage deferred warning:', e);
        }
    }

    '''

content = content.replace(old_populate_func, new_populate_func)

# 3. In syncCore, syncCurriculum, syncAll: don't block on await populateCacheStorage
content = content.replace('await populateCacheStorage(cachedBundle);', 'populateCacheStorage(cachedBundle).catch(() => {});')
content = content.replace('await populateCacheStorage(cData);', 'populateCacheStorage(cData).catch(() => {});')
content = content.replace('await populateCacheStorage(full);', 'populateCacheStorage(full).catch(() => {});')

# 4. Zero-delay Cache-First fetch interceptor
old_fetch_interceptor = re.search(r'// Intercept native fetch[\s\S]*?(?=// Public API)', content).group(0)

new_fetch_interceptor = '''// Intercept native fetch: Zero-Delay Cache-First cho dữ liệu giáo trình / bài học
    const _origFetch = window.fetch;
    window.fetch = async function(input, init) {
        const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
        const method = (init && init.method) ? init.method.toUpperCase() : 'GET';

        // 1. Cache-First: Phục vụ tức thì (0ms) các yêu cầu đọc dữ liệu bài học / từ vựng
        if (method === 'GET' && urlStr && (urlStr.includes('/api.php') || urlStr.includes('/api/'))) {
            const isMutation = /action=(save|update|delete|submit|report|login|register|logout|srs)/i.test(urlStr);
            if (!isMutation) {
                if (!cachedBundle) {
                    try { cachedBundle = await loadBundleFromDB(); } catch (e) {}
                }
                const fastResp = handleOfflineApi(urlStr);
                if (fastResp) {
                    // Stale-While-Revalidate: Kiểm tra cập nhật mạng nền mà không bao giờ chặn UI
                    if (navigator.onLine) {
                        setTimeout(() => {
                            _origFetch(input, init).catch(() => {});
                        }, 500);
                    }
                    return fastResp; // TRẢ VỀ TỨC THÌ (0ms)
                }
            }
        }

        // 2. Yêu cầu ghi hoặc dữ liệu chưa có sẵn trong offline bundle: Gọi mạng bình thường
        try {
            const res = await _origFetch.apply(this, arguments);
            if (res && res.status >= 200 && res.status < 400) return res;
            throw new Error('Response status ' + (res ? res.status : 'null'));
        } catch (err) {
            if (urlStr && (urlStr.includes('/api.php') || urlStr.includes('/api/'))) {
                if (!cachedBundle) {
                    try { cachedBundle = await loadBundleFromDB(); } catch (e) {}
                }
                const fb = handleOfflineApi(urlStr);
                if (fb) return fb;
            }
            throw err;
        }
    };

    '''

content = content.replace(old_fetch_interceptor, new_fetch_interceptor)

# 5. Add preloadActiveCurriculum and update init
old_init = re.search(r'// Khởi tạo[\s\S]*?(?=\n\s*if \(document\.readyState)', content).group(0)

new_init = '''function preloadActiveCurriculum() {
        if (!navigator.onLine) return;
        try {
            let activeCid = parseInt(localStorage.getItem('hanzi_last_curriculum') || '1', 10);
            if (isNaN(activeCid) || activeCid < 1 || activeCid > 3) activeCid = 1;
            
            const scheduleSync = (cid) => {
                if (window.HanziOffline && !window.HanziOffline.isCurriculumDownloaded(cid)) {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(() => window.HanziOffline.syncCurriculum(cid).catch(() => {}), { timeout: 4000 });
                    } else {
                        setTimeout(() => window.HanziOffline.syncCurriculum(cid).catch(() => {}), 1500);
                    }
                }
            };

            // Ưu tiên nạp trước giáo trình đang chọn
            scheduleSync(activeCid);
            // Nạp thêm giáo trình 2 (Thời Đại) nếu đang ở giáo trình 1
            if (activeCid !== 2) {
                setTimeout(() => scheduleSync(2), 6000);
            }
        } catch(e) {}
    }

    // Khởi tạo
    async function init() {
        const storedVer = localStorage.getItem(OFFLINE_VER_KEY);
        if (storedVer !== CURRENT_VERSION) {
            // Phiên bản mới: xoá cache bundle cũ trong IndexedDB để tránh giữ data bài học cũ
            try {
                const db = await openDB();
                if (db) {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).clear();
                }
            } catch(e) {}
            cachedBundle = null;
        } else {
            // 1. Nạp từ IndexedDB nếu đã có sẵn
            cachedBundle = await loadBundleFromDB();
            if (cachedBundle) {
                syncState = 'ready';
                updateUIBadge();
                preloadActiveCurriculum();
            }
        }

        // 2. Tự tải Core Bundle siêu tốc nếu chưa có hoặc cập nhật phiên bản mới
        if (navigator.onLine && (!cachedBundle || localStorage.getItem(OFFLINE_VER_KEY) !== CURRENT_VERSION)) {
            setTimeout(() => {
                syncCore().then(() => {
                    preloadActiveCurriculum();
                }).catch(() => {});
            }, 100);
        }

        // 3. Lắng nghe trạng thái mạng
        window.addEventListener('online', () => {
            updateUIBadge();
            if (!cachedBundle || localStorage.getItem(OFFLINE_VER_KEY) !== CURRENT_VERSION) {
                syncCore().then(() => preloadActiveCurriculum()).catch(() => {});
            }
        });
        window.addEventListener('offline', updateUIBadge);
        setTimeout(updateUIBadge, 300);
    }'''

content = content.replace(old_init, new_init)

with open('static/js/offline-store.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched static/js/offline-store.js!")
