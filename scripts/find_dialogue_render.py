with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'renderDialogue' in line or 'dialogue-bubble' in line or 'line.vi' in line or 'item.vi' in line or 'parseDialogue' in line:
        print(f"Line {i+1}: {line.strip()[:120]}")
