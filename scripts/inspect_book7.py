import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

print("Type of contents:", type(contents))
if isinstance(contents, dict):
    print("Keys (sample):", list(contents.keys())[:10])
    for k in ["74", "75", "76", "80", "81"]:
        if k in contents:
            print(f"Key {k}:", type(contents[k]))
            if isinstance(contents[k], list):
                print(f"  Length: {len(contents[k])}")
                for item in contents[k]:
                    print("  Item keys:", item.keys())
                    print("  Title:", item.get("title"))
                    print("  ZH 1st line:", item.get("content", "").split("\n")[:1])
                    print("  VI 1st line:", (item.get("vietnamese") or "").split("\n")[:1])
elif isinstance(contents, list):
    print("Length of list:", len(contents))
    print("First item type:", type(contents[0]))
