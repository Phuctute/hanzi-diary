/**
 * Hanzi Diary Offline Data Engine (v2.0.5)
 * Lưu trữ dạng mô-đun: Core Bundle (~194KB) + Tải theo từng Giáo trình (Curriculum Bundles).
 * Hỗ trợ Web Speech API, IndexedDB và Cache Storage chuẩn đồng bộ với Service Worker.
 */
(function() {
    'use strict';

    const DB_NAME = 'hanzi_offline_db';
    const DB_VERSION = 1;
    const STORE_NAME = 'data';
    const OFFLINE_VER_KEY = 'hanzi_offline_version';
    const CURRENT_VERSION = '2.0.5';
    const API_CACHE_NAME = 'hanzi-api-v' + CURRENT_VERSION;

    let dbInstance = null;
    let cachedBundle = null;
    let syncState = 'idle'; // 'idle' | 'syncing' | 'ready' | 'error'
    const activeSyncs = new Set();

    function openDB() {
        if (dbInstance) return Promise.resolve(dbInstance);
        return new Promise((resolve) => {
            if (!('indexedDB' in window)) return resolve(null);
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            req.onsuccess = (e) => {
                dbInstance = e.target.result;
                resolve(dbInstance);
            };
            req.onerror = () => resolve(null);
        });
    }

    function saveBundleToDB(bundle) {
        return openDB().then((db) => {
            if (!db) return false;
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    store.put(bundle, 'bundle');
                    tx.oncomplete = () => resolve(true);
                    tx.onerror = () => resolve(false);
                } catch (e) { resolve(false); }
            });
        });
    }

    function loadBundleFromDB() {
        return openDB().then((db) => {
            if (!db) return null;
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.get('bundle');
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => resolve(null);
                } catch (e) { resolve(null); }
            });
        });
    }

    async function populateCacheStorage(bundle) {
        if (!('caches' in window)) return;
        try {
            const cache = await caches.open(API_CACHE_NAME);
            const jsonResp = (obj) => new Response(JSON.stringify(obj), {
                headers: { 'Content-Type': 'application/json', 'X-Offline-Preload': '1' }
            });

            // Curriculums
            if (bundle.curriculums) {
                await cache.put('/api.php?action=get_curriculum_types', jsonResp(bundle.curriculums));
                await cache.put('/api/curriculums', jsonResp(bundle.curriculums));
            }

            // Books
            if (bundle.books) {
                await cache.put('/api.php?action=get_books', jsonResp(bundle.books));
                await cache.put('/api/books', jsonResp(bundle.books));
                if (bundle.curriculums) {
                    for (const c of bundle.curriculums) {
                        const cb = bundle.books.filter(b => String(b.curriculum_type_id) === String(c.id));
                        await cache.put(`/api.php?action=get_books&curriculum_id=${c.id}`, jsonResp(cb));
                        await cache.put(`/api/books?curriculum_id=${c.id}`, jsonResp(cb));
                    }
                }
            }

            // Lessons
            if (bundle.lessons) {
                await cache.put('/api.php?action=get_lessons', jsonResp(bundle.lessons));
                await cache.put('/api/lessons', jsonResp(bundle.lessons));
                if (bundle.books) {
                    for (const b of bundle.books) {
                        const bl = bundle.lessons.filter(l => String(l.book_id) === String(b.book_id));
                        await cache.put(`/api.php?action=get_lessons&book_id=${b.book_id}`, jsonResp(bl));
                        await cache.put(`/api/lessons?book_id=${b.book_id}`, jsonResp(bl));
                    }
                }
            }

            // Vocabularies & Contents (Lưu theo từng bài khi có)
            if (bundle.lesson_vocab) {
                for (const lid in bundle.lesson_vocab) {
                    const vocabs = bundle.lesson_vocab[lid] || [];
                    await cache.put(`/api.php?action=get_vocabularies&lesson_id=${lid}`, jsonResp(vocabs));
                    await cache.put(`/api/vocabularies?lesson_id=${lid}`, jsonResp(vocabs));
                }
            }
            if (bundle.lesson_contents) {
                for (const lid in bundle.lesson_contents) {
                    const cnt = bundle.lesson_contents[lid] || [];
                    await cache.put(`/api.php?action=get_lesson_contents&lesson_id=${lid}`, jsonResp({ success: true, data: cnt }));
                    await cache.put(`/api/lesson_contents?lesson_id=${lid}`, jsonResp(cnt));
                }
            }

            // Grammar, Radicals, Measure Words, Dict Tags
            if (bundle.grammar) {
                await cache.put('/api.php?action=get_grammar', jsonResp({ success: true, data: bundle.grammar }));
                await cache.put('/api/grammar', jsonResp(bundle.grammar));
            }
            if (bundle.radicals) {
                await cache.put('/api.php?action=get_radicals', jsonResp({ success: true, data: bundle.radicals }));
                await cache.put('/api/radicals', jsonResp(bundle.radicals));
            }
            if (bundle.measure_words) {
                await cache.put('/api.php?action=get_measure_words', jsonResp({ success: true, data: bundle.measure_words }));
                await cache.put('/api/measure_words', jsonResp(bundle.measure_words));
            }
            if (bundle.dict_tags) {
                await cache.put('/api.php?action=get_dict_tags', jsonResp({ success: true, data: bundle.dict_tags }));
                await cache.put('/api.php?action=get_dict_tags&category=doi-song', jsonResp({ success: true, data: bundle.dict_tags.filter(t => t.category === 'doi-song') }));
                await cache.put('/api.php?action=get_dict_tags&category=chuyen-nganh', jsonResp({ success: true, data: bundle.dict_tags.filter(t => t.category === 'chuyen-nganh') }));
            }
            if (bundle.tag_vocab) {
                for (const tid in bundle.tag_vocab) {
                    const tv = bundle.tag_vocab[tid] || [];
                    await cache.put(`/api.php?action=get_tag_vocab&tag_id=${tid}`, jsonResp({ success: true, data: tv }));
                    await cache.put(`/api/vocab_by_tag&tag_id=${tid}`, jsonResp({ success: true, data: tv }));
                }
            }

            // Topics
            if (bundle.lessons) {
                const topics = Array.from(new Set(bundle.lessons.map(l => l.topic).filter(Boolean)));
                await cache.put('/api.php?action=get_lesson_topics', jsonResp(topics));
            }
            if (bundle.shadowing_topics) {
                await cache.put('/api.php?action=get_shadowing_topics', jsonResp({ success: true, data: bundle.shadowing_topics }));
            }

            // Fallback endpoints
            await cache.put('/api.php?action=get_last_position', jsonResp({ success: true, data: { book_id: 1, lesson_id: 1, module: 'flashcard' } }));
            await cache.put('/api.php?action=notebook_group_list', jsonResp({ success: true, groups: [{ group_id: 1, name: 'Từ vựng yêu thích', word_count: 0, color: 'blue' }] }));
            await cache.put('/api.php?action=get_notebook_groups', jsonResp({ success: true, groups: [{ group_id: 1, name: 'Từ vựng yêu thích', word_count: 0, color: 'blue' }] }));
            await cache.put('/api.php?action=notebook_group_words', jsonResp({ success: true, words: [] }));
            await cache.put('/api_notifications.php?action=GET_UNREAD_COUNT', jsonResp({ success: true, count: 0, notifications: [] }));
        } catch (e) {
            console.warn('[HanziOffline] Cache storage preload warning:', e);
        }
    }

    // Helper: fetch file from local data or API
    async function fetchBundleFile(candidates) {
        for (const url of candidates) {
            try {
                const res = await fetch(url);
                if (res && res.ok) return await res.json();
            } catch(e) {}
        }
        return null;
    }

    // Tải Core Bundle (nhẹ ~194KB)
    async function syncCore() {
        console.log('[HanziOffline] Tải Core Bundle siêu nhẹ (~194KB gzipped)...');
        const core = await fetchBundleFile([
            'data/offline_core.json',
            '/api/offline_bundle?type=core',
            'https://p.vql.vn/api/offline_bundle?type=core'
        ]);
        if (!core) throw new Error('Không thể tải offline_core.json');

        if (!cachedBundle) {
            cachedBundle = {
                version: CURRENT_VERSION,
                lesson_vocab: {},
                lesson_contents: {},
                downloaded_curriculums: []
            };
        }
        Object.assign(cachedBundle, core);
        cachedBundle.lesson_vocab = cachedBundle.lesson_vocab || {};
        cachedBundle.lesson_contents = cachedBundle.lesson_contents || {};
        cachedBundle.downloaded_curriculums = cachedBundle.downloaded_curriculums || [];

        await saveBundleToDB(cachedBundle);
        await populateCacheStorage(cachedBundle);
        localStorage.setItem(OFFLINE_VER_KEY, CURRENT_VERSION);
        syncState = 'ready';
        updateUIBadge();
        console.log('[HanziOffline] Core bundle tải thành công!');
        return cachedBundle;
    }

    // Tải mô-đun riêng của 1 Giáo trình (Curriculum)
    async function syncCurriculum(curriculumId) {
        const cid = parseInt(curriculumId, 10);
        if (isNaN(cid) || activeSyncs.has(cid)) return false;
        activeSyncs.add(cid);

        try {
            console.log(`[HanziOffline] Đang tải mô-đun giáo trình #${cid}...`);
            const cData = await fetchBundleFile([
                `data/offline_curriculum_${cid}.json`,
                `/api/offline_bundle?curriculum_id=${cid}`,
                `https://p.vql.vn/api/offline_bundle?curriculum_id=${cid}`
            ]);
            if (!cData) throw new Error(`Không thể tải giáo trình #${cid}`);

            if (!cachedBundle) await syncCore();

            // Hợp nhất từ vựng và nội dung bài học
            cachedBundle.lesson_vocab = cachedBundle.lesson_vocab || {};
            cachedBundle.lesson_contents = cachedBundle.lesson_contents || {};
            cachedBundle.downloaded_curriculums = cachedBundle.downloaded_curriculums || [];

            if (cData.lesson_vocab) Object.assign(cachedBundle.lesson_vocab, cData.lesson_vocab);
            if (cData.lesson_contents) Object.assign(cachedBundle.lesson_contents, cData.lesson_contents);
            if (!cachedBundle.downloaded_curriculums.includes(cid)) {
                cachedBundle.downloaded_curriculums.push(cid);
            }

            await saveBundleToDB(cachedBundle);
            await populateCacheStorage(cData);

            console.log(`[HanziOffline] Đã tải xong giáo trình #${cid} (${cData.curriculum_name || ''})`);
            try {
                window.dispatchEvent(new CustomEvent('hanzi-curriculum-synced', { detail: { curriculumId: cid } }));
            } catch(e) {}
            return true;
        } catch (err) {
            console.warn(`[HanziOffline] Lỗi tải giáo trình #${cid}:`, err);
            return false;
        } finally {
            activeSyncs.delete(cid);
        }
    }

    // Kiểm tra giáo trình đã tải offline chưa
    function isCurriculumDownloaded(curriculumId) {
        const cid = parseInt(curriculumId, 10);
        if (!cachedBundle || !cachedBundle.books || !cachedBundle.lessons) return false;
        if (cachedBundle.downloaded_curriculums && cachedBundle.downloaded_curriculums.includes(cid)) return true;

        const cBooks = cachedBundle.books.filter(b => parseInt(b.curriculum_type_id, 10) === cid);
        if (cBooks.length === 0) return false;
        const cBids = new Set(cBooks.map(b => b.book_id));
        const cLessons = cachedBundle.lessons.filter(l => cBids.has(l.book_id));
        if (cLessons.length === 0) return false;

        const sampleLid = String(cLessons[0].lesson_id);
        return !!(cachedBundle.lesson_vocab && cachedBundle.lesson_vocab[sampleLid] && cachedBundle.lesson_vocab[sampleLid].length > 0);
    }

    // Tải tất cả giáo trình
    async function syncAll() {
        if (syncState === 'syncing') return;
        syncState = 'syncing';
        updateUIBadge();

        try {
            console.log('[HanziOffline] Bắt đầu tải toàn bộ dữ liệu offline...');
            let full = await fetchBundleFile([
                'data/offline_bundle.json',
                '/api/offline_bundle',
                'https://p.vql.vn/api/offline_bundle'
            ]);
            if (full) {
                cachedBundle = full;
                cachedBundle.downloaded_curriculums = [1, 2, 3];
                await saveBundleToDB(full);
                await populateCacheStorage(full);
            } else {
                await syncCore();
                if (cachedBundle && cachedBundle.curriculums) {
                    for (const c of cachedBundle.curriculums) {
                        await syncCurriculum(c.id);
                    }
                }
            }
            localStorage.setItem(OFFLINE_VER_KEY, CURRENT_VERSION);
            syncState = 'ready';
            updateUIBadge();
            console.log('[HanziOffline] Đã đồng bộ offline 100% tất cả giáo trình.');
        } catch (err) {
            console.warn('[HanziOffline] Lỗi đồng bộ toàn bộ:', err);
            syncState = cachedBundle ? 'ready' : 'error';
            updateUIBadge();
        }
    }

    async function syncOfflineData(target) {
        if (typeof target === 'number' || (typeof target === 'string' && /^[0-9]+$/.test(target))) {
            return syncCurriculum(parseInt(target, 10));
        }
        if (target === 'all') return syncAll();
        // Mặc định: tải core trước
        return syncCore();
    }

    function handleOfflineApi(urlStr) {
        if (!cachedBundle) return null;
        try {
            const u = new URL(urlStr, window.location.origin);
            const action = u.searchParams.get('action') || '';
            const jsonResp = (obj) => new Response(JSON.stringify(obj), {
                headers: { 'Content-Type': 'application/json', 'X-Client-Offline': '1' }
            });

            if (action === 'get_curriculum_types' || (u.pathname === '/api/curriculums' || u.pathname.endsWith('/api/curriculums'))) {
                return jsonResp(cachedBundle.curriculums || []);
            }
            if (action === 'get_books' || (u.pathname === '/api/books' || u.pathname.endsWith('/api/books'))) {
                const cid = u.searchParams.get('curriculum_id');
                const b = cid ? (cachedBundle.books || []).filter(x => String(x.curriculum_type_id) === String(cid)) : (cachedBundle.books || []);
                return jsonResp(b);
            }
            if (action === 'get_lessons' || (u.pathname === '/api/lessons' || u.pathname.endsWith('/api/lessons'))) {
                const bid = u.searchParams.get('book_id');
                const ls = bid ? (cachedBundle.lessons || []).filter(x => String(x.book_id) === String(bid)) : (cachedBundle.lessons || []);
                return jsonResp(ls);
            }
            if (action === 'get_vocabularies' || (u.pathname === '/api/vocabularies' || u.pathname.endsWith('/api/vocabularies'))) {
                const lid = u.searchParams.get('lesson_id');
                const vocabs = (lid && cachedBundle.lesson_vocab) ? (cachedBundle.lesson_vocab[String(lid)] || []) : [];
                return jsonResp(vocabs);
            }
            if (action === 'get_lesson_contents' || (u.pathname === '/api/lesson_contents' || u.pathname.endsWith('/api/lesson_contents'))) {
                const lid = u.searchParams.get('lesson_id');
                const contents = (lid && cachedBundle.lesson_contents) ? (cachedBundle.lesson_contents[String(lid)] || []) : [];
                return jsonResp((u.pathname === '/api/lesson_contents' || u.pathname.endsWith('/api/lesson_contents')) ? contents : { success: true, data: contents });
            }
            if (action === 'get_lessons_by_topic') {
                const topic = u.searchParams.get('topic');
                const ls = (cachedBundle.lessons || []).filter(l => l.topic === topic);
                return jsonResp(ls);
            }
            if (action === 'get_grammar' || (u.pathname === '/api/grammar' || u.pathname.endsWith('/api/grammar'))) {
                return jsonResp((u.pathname === '/api/grammar' || u.pathname.endsWith('/api/grammar')) ? (cachedBundle.grammar || []) : { success: true, data: cachedBundle.grammar || [] });
            }
            if (action === 'get_radicals' || (u.pathname === '/api/radicals' || u.pathname.endsWith('/api/radicals'))) {
                return jsonResp((u.pathname === '/api/radicals' || u.pathname.endsWith('/api/radicals')) ? (cachedBundle.radicals || []) : { success: true, data: cachedBundle.radicals || [] });
            }
            if (action === 'get_measure_words' || (u.pathname === '/api/measure_words' || u.pathname.endsWith('/api/measure_words'))) {
                return jsonResp((u.pathname === '/api/measure_words' || u.pathname.endsWith('/api/measure_words')) ? (cachedBundle.measure_words || {}) : { success: true, data: cachedBundle.measure_words || {} });
            }
            if (action === 'get_dict_tags') {
                const cat = u.searchParams.get('category');
                const dt = cat ? (cachedBundle.dict_tags || []).filter(t => t.category === cat) : (cachedBundle.dict_tags || []);
                return jsonResp({ success: true, data: dt });
            }
            if (action === 'get_tag_vocab' || action === 'get_vocab_by_tag') {
                const tid = u.searchParams.get('tag_id');
                return jsonResp({ success: true, data: (cachedBundle.tag_vocab && cachedBundle.tag_vocab[String(tid)]) || [] });
            }
            if (action === 'get_lesson_topics') {
                const topics = Array.from(new Set((cachedBundle.lessons || []).map(l => l.topic).filter(Boolean)));
                return jsonResp(topics);
            }
            if (action === 'get_char_meta') {
                const chars = u.searchParams.get('chars') || u.searchParams.get('char') || '';
                const res = {};
                if (cachedBundle.char_meta) {
                    for (const c of chars) {
                        if (cachedBundle.char_meta[c]) res[c] = cachedBundle.char_meta[c];
                    }
                }
                return jsonResp({ success: true, data: res });
            }
            if (action === 'get_vocab_by_tocfl_band' || action === 'get_tocfl_vocab') {
                const band = parseInt(u.searchParams.get('band') || u.searchParams.get('level') || '1', 10);
                const allV = [];
                if (cachedBundle.lesson_vocab) {
                    for (const lid in cachedBundle.lesson_vocab) {
                        for (const item of cachedBundle.lesson_vocab[lid]) {
                            if (item.tocfl_band === band) allV.push(item);
                        }
                    }
                }
                return jsonResp({ success: true, data: allV, total: allV.length, band: band });
            }
            if (action === 'notebook_group_list' || action === 'get_notebook_groups') {
                return jsonResp({ success: true, groups: [{ group_id: 1, name: 'Từ vựng yêu thích', word_count: 0, color: 'blue' }] });
            }
            if (action === 'notebook_group_words') {
                return jsonResp({ success: true, words: [] });
            }
            if (action === 'get_last_position') {
                return jsonResp({ success: true, data: { book_id: 1, lesson_id: 1, module: 'flashcard' } });
            }
            if (action.includes('notebook') || action.includes('save') || action.includes('srs')) {
                return jsonResp({ success: true, message: 'OK' });
            }
        } catch (e) {
            console.error('[HanziOffline] Fallback error:', e);
        }
        return null;
    }

    function updateUIBadge() {
        let parent = document.getElementById('hanzi-offline-parent');
        if (parent) {
            parent.style.display = 'none';
            parent.style.cssText = 'display: none !important;';
        }
    }

    // Intercept native fetch
    const _origFetch = window.fetch;
    window.fetch = async function(input, init) {
        try {
            const res = await _origFetch.apply(this, arguments);
            if (res && res.status >= 200 && res.status < 400) return res;
            throw new Error('Response status ' + (res ? res.status : 'null'));
        } catch (err) {
            const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : '');
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

    // Public API
    window.HanziOffline = {
        sync: syncOfflineData,
        syncCore: syncCore,
        syncCurriculum: syncCurriculum,
        syncAll: syncAll,
        isCurriculumDownloaded: isCurriculumDownloaded,
        getBundle: () => cachedBundle,
        getState: () => syncState,
        version: CURRENT_VERSION
    };

    // Khởi tạo
    async function init() {
        // 1. Nạp từ IndexedDB nếu đã có sẵn
        cachedBundle = await loadBundleFromDB();
        if (cachedBundle) {
            syncState = 'ready';
            updateUIBadge();
        }

        // 2. Tự tải Core Bundle nếu chưa có hoặc phiên bản cũ
        if (navigator.onLine && (!cachedBundle || localStorage.getItem(OFFLINE_VER_KEY) !== CURRENT_VERSION)) {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => syncCore().catch(() => {}), { timeout: 8000 });
            } else {
                setTimeout(() => syncCore().catch(() => {}), 3000);
            }
        }

        // 3. Lắng nghe trạng thái mạng
        window.addEventListener('online', () => {
            updateUIBadge();
            if (!cachedBundle || localStorage.getItem(OFFLINE_VER_KEY) !== CURRENT_VERSION) {
                syncCore().catch(() => {});
            }
        });
        window.addEventListener('offline', updateUIBadge);
        setTimeout(updateUIBadge, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
