import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in range(123, 139):
    items = contents.get(str(lid), [])
    print(f"\nLesson {lid}: {len(items)} items")
    for idx, it in enumerate(items):
        print(f"  Item {idx}: type={it.get('type')}, title={it.get('title')}")
        print(f"    ZH: {(it.get('content') or '')[:80]}...")
