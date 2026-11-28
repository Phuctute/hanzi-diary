with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "scrollIntoView" in l or "updateKaraokeHighlight" in l or "active-karaoke-line" in l or "karaokeScroll" in l or "smooth" in l:
        if 11500 <= i <= 12500:
            print(f"Line {i+1}: {l.strip()[:140]}")
