import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid, items in contents.items():
    for idx, it in enumerate(items):
        vi = it.get("vietnamese", "")
        if "không thích đi chợ đêm" in vi:
            print(f"FOUND in Lesson {lid}, Item {idx}")
            print("  Title:", it.get("title"))
            print("  Dropdown:", it.get("dropdown_option"))
            print("  ZH 1st:", it.get("content", "").split("\n")[:2])
            print("  VI 1st:", vi.split("\n")[:2])
