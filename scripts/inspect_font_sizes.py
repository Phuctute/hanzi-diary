with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "prose-word" in l or "prose-char" in l or "prose-hanzi" in l or "dialogue-char" in l or "dialogue-word" in l or "renderProse" in l or "lesson_text" in l:
        if 11200 <= i <= 11800:
            print(f"Line {i+1}: {l.strip()[:140]}")
