import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
srcs = re.findall(r'<script[^>]*src="([^"]+)"', html)
for s in srcs:
    print(s)
