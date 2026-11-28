with open('static/js/offline-store.js', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Restore safe fetch interceptor that only runs in catch (offline fallback)
old_fetch = re.search(r'// Intercept native fetch:[\s\S]*?(?=// Public API)', code)
if old_fetch:
    new_fetch = '''// Intercept native fetch (Chỉ can thiệp khi ngoại tuyến / mất mạng)
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

    '''
    code = code.replace(old_fetch.group(0), new_fetch)
    print("Replaced fetch interceptor successfully!")
else:
    print("Could not find fetch interceptor!")

# Also bump version to 2.4.8 so clients bust any broken cache immediately
code = code.replace("const CURRENT_VERSION = '2.4.7';", "const CURRENT_VERSION = '2.4.8';")

with open('static/js/offline-store.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated static/js/offline-store.js!")
