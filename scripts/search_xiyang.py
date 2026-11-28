import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid, items in contents.items():
    for idx, it in enumerate(items):
        c = it.get("content", "")
        if "夕陽" in c or "淡水" in c:
            print(f"Lesson {lid}, Item {idx}, Title: {it.get('title')}")
            for line in c.split("\n")[:4]:
                print("   ZH:", line)
            for line in (it.get("vietnamese") or "").split("\n")[:4]:
                print("   VI:", line)
