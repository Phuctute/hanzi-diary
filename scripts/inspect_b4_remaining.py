import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in ["128", "129", "130", "131", "137"]:
    it = contents[lid][0]
    cl = [l.strip() for l in it.get("content", "").splitlines() if l.strip()]
    vl = [l.strip() for l in (it.get("vietnamese") or "").splitlines() if l.strip()]
    print(f"\n--- Lesson {lid} ({it.get('title')}) -> ZH={len(cl)} lines, VI={len(vl)} lines ---")
    if len(cl) > 0 and len(vl) > 0:
        print("ZH 1st:", cl[0])
        print("VI 1st:", vl[0])
