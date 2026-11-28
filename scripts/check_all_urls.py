import urllib.request
import re

req = urllib.request.Request('https://p.vql.vn/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')

srcs = re.findall(r'<script[^>]*src="([^"]+)"', html)
srcs += re.findall(r"<script[^>]*src='([^']+)'", html)
print(f"Checking {len(srcs)} script tags...")

failed = []
for s in srcs:
    url = s if s.startswith('http') else f"https://p.vql.vn/{s.lstrip('/')}"
    try:
        r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(r, timeout=4) as res:
            if res.status != 200:
                print(f"FAIL {res.status}: {url}")
                failed.append(url)
    except Exception as e:
        print(f"ERROR: {url} -> {e}")
        failed.append(url)

if not failed:
    print("All external scripts returned 200 OK!")
