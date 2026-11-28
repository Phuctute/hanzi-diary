import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in range(123, 139):
    items = contents.get(str(lid), [])
    diag = items[0] if items else None
    if not diag:
        print(f"L{lid}: NO ITEMS!")
        continue
    c_lines = diag.get("content", "").splitlines()
    print(f"\nL{lid} '{diag.get('title')}' -> ZH lines: {len(c_lines)}")
    for i in range(min(5, len(c_lines))):
        print(f"  {c_lines[i]}")
