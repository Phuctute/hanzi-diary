with open('sw.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'fetch' in line and 'addEventListener' in line:
        for j in range(i, min(i+70, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
