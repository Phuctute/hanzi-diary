import json

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

for lid in ["83", "85", "86", "121"]:
    print(f"\n==================== LESSON {lid} ====================")
    for idx, it in enumerate(contents.get(lid, [])):
        print(f"--- Item {idx}: {it.get('title')} ({it.get('type')}) ---")
        cl = [l.strip() for l in it.get("content", "").split("\n") if l.strip()]
        vl = [l.strip() for l in (it.get("vietnamese") or "").split("\n") if l.strip()]
        for i in range(max(len(cl), len(vl))):
            c_str = cl[i] if i < len(cl) else "[[MISSING ZH]]"
            v_str = vl[i] if i < len(vl) else "[[MISSING VI]]"
            print(f"  [{i}] ZH: {c_str}")
            print(f"      VI: {v_str}")
