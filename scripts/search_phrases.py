import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

print("Searching for '你平常不愛逛夜市'...")
for lid, items in contents.items():
    for idx, it in enumerate(items):
        if "你平常不愛逛夜市" in it.get("content", "") or "你平常不愛逛夜市" in it.get("vietnamese", ""):
            print(f"FOUND '你平常不愛逛夜市' in Lesson {lid}, Item {idx}, Title: {it.get('title')}")

print("\nSearching for 'Cuối tuần này các cậu có kế hoạch gì chưa'...")
for lid, items in contents.items():
    for idx, it in enumerate(items):
        if "Cuối tuần này các cậu có kế hoạch gì chưa" in it.get("vietnamese", "") or "Cuối tuần này các cậu" in it.get("vietnamese", ""):
            print(f"FOUND 'Cuối tuần này các cậu' in Lesson {lid}, Item {idx}, Title: {it.get('title')}")
