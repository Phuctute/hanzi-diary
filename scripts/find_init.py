with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'DOMContentLoaded' in line or 'window.addEventListener(\'load\'' in line or 'window.addEventListener("load"' in line or 'initApp' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
