import re

def update_ver(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('v2.4.7', 'v2.4.8')
    c = c.replace('2.4.7', '2.4.8')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"Bumped {filepath} to v2.4.8")

for p in ['index.html', 'templates/index.html', 'sw.js', 'static/sw.js', 'static/js/app.js', 'static/js/offline-store.js']:
    update_ver(p)
