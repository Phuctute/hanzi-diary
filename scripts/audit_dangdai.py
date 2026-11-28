import json, re

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

report = []
weird_vi_patterns = ["gà xương", "mèo đỏ", "Dia,", "Maxim", "99 Longji"]

for lid in range(1, 74):
    items = contents.get(str(lid), [])
    for idx, it in enumerate(items):
        title = it.get("title", "")
        ctype = it.get("type", "")
        content = it.get("content", "")
        vi = it.get("vietnamese", "")
        
        c_lines = [l.strip() for l in content.split("\n") if l.strip()]
        v_lines = [l.strip() for l in (vi or "").split("\n") if l.strip()]
        
        if len(c_lines) != len(v_lines) and ctype == "dialogue":
            report.append(f"[Đương Đại] L{lid} Item {idx} '{title}' (dialogue): LỆCH DÒNG! ZH={len(c_lines)} vs VI={len(v_lines)}")
        
        for w in weird_vi_patterns:
            if w.lower() in (vi or "").lower():
                report.append(f"[Đương Đại] L{lid} Item {idx} '{title}': CHỨA TỪ DỊCH LỖI: '{w}'")

print(f"Đương Đại issues found: {len(report)}")
for r in report:
    print(" - ", r)
