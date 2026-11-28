import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

print("Searching for 'Đạm Thuỷ' or 'Đạm Thủy'...")
for lid, items in contents.items():
    for idx, it in enumerate(items):
        vi = it.get("vietnamese", "")
        if "Đạm Thuỷ" in vi or "Đạm Thủy" in vi or "hoàng hôn" in vi:
            print(f"FOUND in Lesson {lid}, Item {idx}, Title: {it.get('title')}")
            for line in vi.split("\n")[:4]:
                print("   ", line)
