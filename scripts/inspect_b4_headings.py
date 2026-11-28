import json

with open("b4_yt_segments.json", "r", encoding="utf-8") as f:
    d = json.load(f)

segs = d["segments"]
for i, s in enumerate(segs):
    txt = s.get("text", "")
    if any(k in txt for k in ["第", "對話", "对话", "短文", "課", "刻"]):
        if any(w in txt for w in ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]):
            print(f"Index {i:4d} | ID {s['id']:4d} | Start: {s['start']:7.2f}s | {txt}")
