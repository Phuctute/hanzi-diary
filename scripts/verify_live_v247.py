import urllib.request
import re

print("=== Verifying Live Server https://p.vql.vn/ ===")
req = urllib.request.Request('https://p.vql.vn/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=5) as resp:
    html = resp.read().decode('utf-8')
    ver_matches = re.findall(r'v2\.4\.[0-9]+', html)
    print('Version tags in live index.html:', set(ver_matches))

req_js = urllib.request.Request('https://p.vql.vn/static/js/offline-store.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_js, timeout=5) as resp:
    js = resp.read().decode('utf-8')
    m = re.search(r"CURRENT_VERSION\s*=\s*'([^']+)'", js)
    print('CURRENT_VERSION in live offline-store.js:', m.group(1) if m else 'Not found')
    has_cache_first = 'TRẢ VỀ TỨC THÌ (0ms)' in js
    print('Zero-Delay Cache-First Active in offline-store.js:', has_cache_first)

req_sw = urllib.request.Request('https://p.vql.vn/sw.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_sw, timeout=5) as resp:
    sw = resp.read().decode('utf-8')
    m_sw = re.search(r"CACHE_NAME\s*=\s*'([^']+)'", sw)
    print('Service Worker CACHE_NAME:', m_sw.group(1) if m_sw else 'Not found')
