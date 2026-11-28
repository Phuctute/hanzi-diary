import json
from opencc import OpenCC

cc = OpenCC('s2twp')

with open("b4_yt_segments.json", "r", encoding="utf-8") as f:
    b4_segs = json.load(f)["segments"]

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in [132, 133, 134, 135, 136, 138]:
    it = contents[str(lid)][0]
    title = it.get("title")
    lines = it.get("content", "").splitlines()
    with open(f"scripts/b4_raw_{lid}.txt", "w", encoding="utf-8") as out:
        out.write(f"=== Lesson {lid}: {title} ===\n")
        out.write("\n".join(lines) + "\n")

print("Exported b4 raw.")
