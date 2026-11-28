import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in ["80", "81"]:
    print(f"*** LESSON {lid} ***")
    for idx, it in enumerate(contents.get(lid, [])):
        print(f"Item {idx}: id={it.get('id')} title={it.get('title')} type={it.get('type')}")
        print("  CONTENT:\n", it.get("content"))
        print("  VIETNAMESE:\n", it.get("vietnamese"))
