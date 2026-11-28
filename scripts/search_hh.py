import os

term = "ngắm hoàng hôn"

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for f in files:
        if f.endswith(('.json', '.js', '.html', '.php', '.sql', '.py')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    if term in content:
                        print(f"Found '{term}' in {path}")
            except Exception:
                pass
