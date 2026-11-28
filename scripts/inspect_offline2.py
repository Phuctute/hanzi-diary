import json

# Check offline_curriculum_2.json
with open("data/offline_curriculum_2.json", "r", encoding="utf-8") as f:
    off2 = json.load(f)

print("offline_curriculum_2 keys:", list(off2.keys()) if isinstance(off2, dict) else len(off2))

if isinstance(off2, dict):
    # check lesson_contents or whatever key it has
    for k in off2.keys():
        print(f"Key: {k}, type: {type(off2[k])}")
        if isinstance(off2[k], dict):
            print(f"  Subkeys sample: {list(off2[k].keys())[:10]}")
