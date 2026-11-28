with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'@app\.route\([^)]+\)[\s\S]*?def [a-zA-Z0-9_]+\([^)]*\):[\s\S]*?return[^\n]+', text)
for m in matches[:10]:
    if 'index' in m or '/' in m:
        print(m[:300])
        print("---")
