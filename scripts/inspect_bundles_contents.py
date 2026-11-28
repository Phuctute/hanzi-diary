import json

for fn in ["data/offline_bundle.json", "data/offline_curriculum_2.json"]:
    print(f"\n================ FILE: {fn} ================")
    with open(fn, "r", encoding="utf-8") as f:
        data = json.load(f)
    lc = data.get("lesson_contents", {})
    print(f"Total lesson_contents keys: {len(lc)}")
    for lid in ["74", "75", "81", "94"]:
        items = lc.get(lid, [])
        print(f"  Lesson {lid} items count: {len(items)}")
        for idx, it in enumerate(items):
            print(f"    Item {idx}: title={it.get('title')}, type={it.get('type')}")
            print(f"      ZH 1st: {(it.get('content') or '').splitlines()[:1]}")
            print(f"      VI 1st: {(it.get('vietnamese') or '').splitlines()[:1]}")
