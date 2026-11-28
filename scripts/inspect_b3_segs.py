import json

with open("b3_yt_segments.json", "r", encoding="utf-8") as f:
    d = json.load(f)

segs = d.get("segments", [])
print(f"Total segs in b3_yt_segments: {len(segs)}")

# Print sample headings
for i, s in enumerate(segs):
    txt = s.get("text", "")
    if any(k in txt for k in ["第", "對話", "课", "課", "刻"]):
        if any(w in txt for w in ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]):
            print(f"Seg {i:4d} ({s.get('start', 0):.1f}s): {txt}")
