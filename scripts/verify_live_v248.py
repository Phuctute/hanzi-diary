import urllib.request
import re

req = urllib.request.Request('https://p.vql.vn/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=5) as resp:
    html = resp.read().decode('utf-8')
    ver = set(re.findall(r'v2\.4\.[0-9]+', html))
    print('Live HTML version:', ver)

req_js = urllib.request.Request('https://p.vql.vn/static/js/offline-store.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_js, timeout=5) as resp:
    js = resp.read().decode('utf-8')
    m = re.search(r"CURRENT_VERSION\s*=\s*'([^']+)'", js)
    print('Live offline-store.js version:', m.group(1) if m else 'Not found')
