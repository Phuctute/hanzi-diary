def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the dangerous TDZ lines at 14525 and 14540
    content = content.replace("document.documentElement.setAttribute('data-charmode', charMode);\n            if (typeof __charCache !== 'undefined') __charCache.clear();", "document.documentElement.setAttribute('data-charmode', charMode);")
    content = content.replace("document.documentElement.setAttribute('data-charmode', charMode);\n            if (typeof __charCache !== 'undefined') __charCache.clear();", "document.documentElement.setAttribute('data-charmode', charMode);")
    content = content.replace("if (typeof __charCache !== 'undefined') __charCache.clear();", "")

    # 2. In getChar, use window.__charCache safely
    old_getchar = '''const __charCache = new Map();
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
        }'''

    new_getchar = '''function getChar(text) {
            if (!text) return '';
            if (typeof text !== 'string') return text;
            if (text.includes('/')) return text;

            window.__charCache = window.__charCache || new Map();
            const cacheKey = charMode + ':' + text;
            if (window.__charCache.has(cacheKey)) return window.__charCache.get(cacheKey);

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
            if (window.__charCache.size > 2000) window.__charCache.clear();
            window.__charCache.set(cacheKey, out);
            return out;
        }'''

    if old_getchar in content:
        content = content.replace(old_getchar, new_getchar)
        print(f"Replaced getChar in {filepath}")
    else:
        print(f"Could not find exact old_getchar in {filepath}")

    # 3. In toggleCharMode, clear window.__charCache safely
    content = content.replace(
        "else charMode = charMode === 'traditional' ? 'simplified' : 'traditional';\n\n            document.documentElement.setAttribute('data-charmode', charMode);",
        "else charMode = charMode === 'traditional' ? 'simplified' : 'traditional';\n\n            document.documentElement.setAttribute('data-charmode', charMode);\n            if (window.__charCache) window.__charCache.clear();"
    )

    # 4. Bump version to 2.5.0
    content = content.replace('v2.4.9', 'v2.5.0').replace('2.4.9', '2.5.0')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully fixed {filepath}!")

fix_file('index.html')
fix_file('templates/index.html')

# Bump other files to 2.5.0
for fpath in ['sw.js', 'static/sw.js', 'static/js/app.js', 'static/js/offline-store.js']:
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v2.4.9', 'v2.5.0').replace('2.4.9', '2.5.0')
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"Bumped {fpath} to v2.5.0")
