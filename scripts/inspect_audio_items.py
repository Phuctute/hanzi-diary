import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in range(123, 139):
    items = contents.get(str(lid), [])
    for idx, it in enumerate(items):
        if it.get("audio_url"):
            print(f"L{lid} Item {idx} ({it.get('type')}) title='{it.get('title')}' audio='{it.get('audio_url')}'")
