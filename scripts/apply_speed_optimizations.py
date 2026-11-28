import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Bump version
    content = content.replace('v2.4.6', 'v2.4.7')
    content = content.replace('2.4.6', '2.4.7')

    # 2. Patch getChar and toggleCharMode
    old_getchar = re.search(r'function getChar\(text\)[\s\S]*?(?=\n\s*function toggleCharMode)', content)
    if old_getchar:
        new_getchar = '''const __charCache = new Map();
        function getChar(text) {
            if (!text) return '';
            if (typeof text !== 'string') return text;
            if (text.includes('/')) return text;

            const cacheKey = charMode + ':' + text;
            if (__charCache.has(cacheKey)) return __charCache.get(cacheKey);

            ensureOpenCC();
            let out = text;
            if (charMode === 'simplified') {
                out = (converterT2S ? converterT2S(text) : text);
            } else {
                if (converterS2T) {
                    out = converterS2T(text);
                    // Sửa lỗi OpenCC S2T: 表 (biểu diễn/bày tỏ) bị chuyển nhầm thành 錶 (đồng hồ)
                    if (out.includes('錶演')) out = out.replace(/錶演/g, '表演');
                    if (out.includes('錶達')) out = out.replace(/錶達/g, '表達');
                    if (out.includes('錶現')) out = out.replace(/錶現/g, '表現');
                    if (out.includes('錶示')) out = out.replace(/錶示/g, '表示');
                }
            }
            if (__charCache.size > 2000) __charCache.clear();
            __charCache.set(cacheKey, out);
            return out;
        }\n\n'''
        content = content.replace(old_getchar.group(0), new_getchar)

    # 3. Clear __charCache in toggleCharMode
    if 'document.documentElement.setAttribute(\'data-charmode\', charMode);' in content:
        content = content.replace(
            "document.documentElement.setAttribute('data-charmode', charMode);",
            "document.documentElement.setAttribute('data-charmode', charMode);\n            if (typeof __charCache !== 'undefined') __charCache.clear();"
        )

    # 4. Patch loadLessons with curriculum auto-preload
    old_load_lessons = re.search(r'async function loadLessons\(bookId\) \{[\s\S]*?(?=if \(!bookId\) return;)', content)
    if old_load_lessons:
        target_head = 'async function loadLessons(bookId) {\n\n            if (!bookId) return;'
        repl_head = '''async function loadLessons(bookId) {

            if (!bookId) return;

            // Tự động kích hoạt nạp trước mô-đun giáo trình ngoại tuyến ngầm (0ms cho các bài kế tiếp)
            try {
                const bNum = parseInt(bookId, 10);
                let curId = 1;
                if (bNum >= 7 && bNum <= 10) curId = 2;
                else if (bNum >= 11) curId = 3;
                localStorage.setItem('hanzi_last_curriculum', String(curId));
                if (window.HanziOffline && typeof window.HanziOffline.isCurriculumDownloaded === 'function' && !window.HanziOffline.isCurriculumDownloaded(curId)) {
                    window.HanziOffline.syncCurriculum(curId).catch(() => {});
                }
            } catch(e) {}'''
        content = content.replace(target_head, repl_head)

    # 5. Patch loadVocabulariesAndContent to eliminate redundant re-rendering
    old_sync_block = re.search(r'let dataChanged = false;\s*if \(Array\.isArray\(vocabJson\) && vocabJson\.length > 0\) \{[\s\S]*?(?=if \(!hadInstant \|\| dataChanged\) \{)', content)
    if old_sync_block:
        new_sync_block = '''let dataChanged = false;
                if (Array.isArray(vocabJson) && vocabJson.length > 0) {
                    const isSame = hadInstant && vocabData && vocabData.length === vocabJson.length &&
                                   vocabData[0] && vocabJson[0] && vocabData[0].id === vocabJson[0].id;
                    if (!isSame) {
                        vocabData = vocabJson;
                        filteredVocabData = [...vocabData];
                        window._vocabCache[lessonId] = vocabData;
                        if (typeof preloadLessonAudio === 'function') preloadLessonAudio(vocabData);
                        window._dictLoadedLessonId = String(lessonId);
                        dataChanged = true;
                    }
                }
                if (diagJson && diagJson.success) {
                    if (Array.isArray(diagJson.data) && diagJson.data.length > 0) {
                        const isSame = hadInstant && rawKaraokeData && rawKaraokeData.length === diagJson.data.length &&
                                       rawKaraokeData[0] && diagJson.data[0] && rawKaraokeData[0].id === diagJson.data[0].id &&
                                       rawKaraokeData[0].content === diagJson.data[0].content;
                        if (!isSame) {
                            rawKaraokeData = diagJson.data;
                            window.rawKaraokeData = rawKaraokeData;
                            window._lessonContentsCache[lessonId] = rawKaraokeData;
                            window._karaokeLoadedLessonId = String(lessonId);
                            dataChanged = true;
                        }
                    } else if (rawKaraokeData.length > 0) {
                        rawKaraokeData = [];
                        window.rawKaraokeData = [];
                        window._lessonContentsCache[lessonId] = [];
                        window._karaokeLoadedLessonId = String(lessonId);
                        dataChanged = true;
                    }
                }
                '''
        content = content.replace(old_sync_block.group(0), new_sync_block)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath} successfully!")

# Apply to index.html and templates/index.html
patch_file('index.html')
patch_file('templates/index.html')

# Patch sw.js and static/sw.js
for sw_path in ['sw.js', 'static/sw.js']:
    with open(sw_path, 'r', encoding='utf-8') as f:
        sw_c = f.read()
    sw_c = sw_c.replace('v2.4.6', 'v2.4.7')
    sw_c = sw_c.replace('2.4.6', '2.4.7')
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(sw_c)
    print(f"Patched {sw_path} to v2.4.7!")

# Patch static/js/app.js
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    app_c = f.read()
app_c = app_c.replace('v2.4.6', 'v2.4.7')
app_c = app_c.replace('2.4.6', '2.4.7')
with open('static/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_c)
print("Patched static/js/app.js to v2.4.7!")
