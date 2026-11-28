import urllib.request
import re

req = urllib.request.Request('https://p.vql.vn/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=5) as resp:
    html = resp.read().decode('utf-8')
    ver = set(re.findall(r'v2\.4\.[0-9]+', html))
    print('Live HTML version:', ver)

req_sw = urllib.request.Request('https://p.vql.vn/sw.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req_sw, timeout=5) as resp:
    sw = resp.read().decode('utf-8')
    m = re.search(r"CACHE_NAME\s*=\s*'([^']+)'", sw)
    print('Live sw.js CACHE_NAME:', m.group(1) if m else 'Not found')
