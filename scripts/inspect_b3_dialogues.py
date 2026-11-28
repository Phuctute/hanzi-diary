import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in range(107, 123):
    items = contents.get(str(lid), [])
    diag = items[0] if items else None
    if not diag:
        print(f"L{lid}: NO ITEMS!")
        continue
    c_lines = diag.get("content", "").splitlines()
    v_lines = (diag.get("vietnamese") or "").splitlines()
    print(f"\nL{lid} '{diag.get('title')}' -> ZH lines: {len(c_lines)}, VI lines: {len(v_lines)}")
    # Print sample of first 6 lines
    for i in range(min(6, len(c_lines))):
        zh = c_lines[i]
        vi = v_lines[i] if i < len(v_lines) else "[[NO VI]]"
        print(f"  {zh}  <--->  {vi}")
