import json, re

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

print("AUDIT SUMMARY FOR LESSONS 75 - 138:")
mismatched_lessons = []

for lid in range(75, 139):
    items = contents.get(str(lid), [])
    for idx, it in enumerate(items):
        cl = [l.strip() for l in it.get("content", "").split("\n") if l.strip()]
        vl = [l.strip() for l in (it.get("vietnamese") or "").split("\n") if l.strip()]
        if len(cl) != len(vl):
            mismatched_lessons.append((lid, idx, it.get("title"), it.get("type"), len(cl), len(vl)))

print(f"Total mismatched items: {len(mismatched_lessons)}")
for m in mismatched_lessons:
    print(f"Lesson {m[0]} Item {m[1]} '{m[2]}' ({m[3]}): ZH={m[4]} lines, VI={m[5]} lines")
