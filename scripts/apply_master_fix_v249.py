import re

# 1. Update sw.js and static/sw.js to be Network-First for APIs
sw_code_fix = '''  // 5. Read-only APIs: Network-First with Cache Fallback (không bao giờ bị kẹt dữ liệu rỗng)
  const isReadOnlyApi = (url.pathname.includes('api.php') || url.pathname.startsWith('/api/')) && (
    !url.search.includes('action=logout') &&
    !url.pathname.includes('/api/tts')
  );

  if (isReadOnlyApi) {
    event.respondWith(
      fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          caches.open(API_CACHE_NAME).then((cache) => cache.put(req, networkRes.clone())).catch(() => {});
        }
        return networkRes;
      }).catch(async () => {
        const cache = await caches.open(API_CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline', data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }'''

for sw_file in ['sw.js', 'static/sw.js']:
    with open(sw_file, 'r', encoding='utf-8') as f:
        sw_text = f.read()
    
    # Replace version
    sw_text = sw_text.replace('2.4.8', '2.4.9').replace('v2.4.8', 'v2.4.9')
    
    # Replace API handler block
    old_api_block = re.search(r'// 5\. Read-only APIs[\s\S]*?(?=// 6\. Book covers)', sw_text)
    if old_api_block:
        sw_text = sw_text.replace(old_api_block.group(0), sw_code_fix + '\n\n  ')
    
    with open(sw_file, 'w', encoding='utf-8') as f:
        f.write(sw_text)
    print(f"Updated {sw_file}!")

# 2. Update index.html and templates/index.html
def patch_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Bump version
    html = html.replace('2.4.8', '2.4.9').replace('v2.4.8', 'v2.4.9')
    html = html.replace('sw.js?v=2.4.7', 'sw.js?v=2.4.9')
    
    # Fix the cache cleanup script at the top: remove indexedDB.deleteDatabase (which hangs connections)
    # and purge ALL caches to guarantee a 100% fresh slate
    old_cleanup = re.search(r'<script>\s*// Tự động dọn dẹp[\s\S]*?</script>', html)
    if old_cleanup:
        new_cleanup = '''<script>
// Tự động dọn dẹp triệt để cache và cập nhật Service Worker lên v2.4.9
(function() {
    const CURRENT_APP_VER = '2.4.9';
    const storedVer = localStorage.getItem('hanzi_app_cache_ver');
    if (storedVer !== CURRENT_APP_VER) {
        localStorage.setItem('hanzi_app_cache_ver', CURRENT_APP_VER);
        localStorage.removeItem('hanzi_offline_version');
        window._vocabCache = {};
        window._lessonContentsCache = {};
        window.rawKaraokeData = null;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
                regs.forEach(function(r) { r.update(); });
            });
        }
        if ('caches' in window) {
            caches.keys().then(function(keys) {
                keys.forEach(function(k) {
                    caches.delete(k);
                });
            }).catch(function() {});
        }
    }
})();
</script>'''
        html = html.replace(old_cleanup.group(0), new_cleanup)

    # Clean up loadVocabulariesAndContent to be 100% reliable
    old_vocab_block = re.search(r'let dataChanged = false;\s*if \(Array\.isArray\(vocabJson\)[\s\S]*?(?=if \(!hadInstant \|\| dataChanged\) \{)', html)
    if old_vocab_block:
        new_vocab_block = '''let dataChanged = false;
                if (Array.isArray(vocabJson) && vocabJson.length > 0) {
                    vocabData = vocabJson;
                    filteredVocabData = [...vocabData];
                    window._vocabCache[lessonId] = vocabData;
                    if (typeof preloadLessonAudio === 'function') preloadLessonAudio(vocabData);
                    window._dictLoadedLessonId = String(lessonId);
                    dataChanged = true;
                }
                if (diagJson && diagJson.success) {
                    if (Array.isArray(diagJson.data) && diagJson.data.length > 0) {
                        rawKaraokeData = diagJson.data;
                        window.rawKaraokeData = rawKaraokeData;
                        window._lessonContentsCache[lessonId] = rawKaraokeData;
                        window._karaokeLoadedLessonId = String(lessonId);
                        dataChanged = true;
                    } else {
                        rawKaraokeData = [];
                        window.rawKaraokeData = [];
                        window._lessonContentsCache[lessonId] = [];
                        window._karaokeLoadedLessonId = String(lessonId);
                        dataChanged = true;
                    }
                }
                '''
        html = html.replace(old_vocab_block.group(0), new_vocab_block)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated {filepath}!")

patch_html('index.html')
patch_html('templates/index.html')

# 3. Update static/js/app.js
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()
app_js = app_js.replace('2.4.8', '2.4.9').replace('v2.4.8', 'v2.4.9')
with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
print("Updated static/js/app.js!")

# 4. Update static/js/offline-store.js
with open('static/js/offline-store.js', 'r', encoding='utf-8') as f:
    off_js = f.read()
off_js = off_js.replace('2.4.8', '2.4.9').replace('v2.4.8', 'v2.4.9')
with open('static/js/offline-store.js', 'w', encoding='utf-8') as f:
    f.write(off_js)
print("Updated static/js/offline-store.js!")
