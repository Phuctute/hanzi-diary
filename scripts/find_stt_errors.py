import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

suspect_terms = [
    "骨雞", "紅貓城", "四秒", "家傷", "餐館龍山寺", "克的", "發採", "錄習", "年盡", "漢民族各方面",
    "堂帶", "元帶", "迅習", "拜文不如一見"
]

found = []
for lid in range(107, 139):
    items = contents.get(str(lid), [])
    for idx, it in enumerate(items):
        c = it.get("content", "")
        for term in suspect_terms:
            if term in c:
                found.append((lid, idx, it.get("title"), term))

print(f"Suspect STT terms found: {len(found)}")
for f in found:
    print(f"Lesson {f[0]} Item {f[1]} '{f[2]}': found '{f[3]}'")
