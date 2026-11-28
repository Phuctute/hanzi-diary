import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

c_lines = contents["121"][0]["content"].splitlines()
print(f"Total lines in ZH: {len(c_lines)}")
for i, l in enumerate(c_lines[:25]):
    print(f"  [{i}] {l}")
