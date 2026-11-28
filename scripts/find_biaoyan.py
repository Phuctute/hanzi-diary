import json

for fname in ['data/offline_curriculum_2.json', 'data/offline_bundle.json', 'data/lesson_contents.json']:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"\nChecking {fname}...")
        if isinstance(data, dict):
            lc = data.get('lesson_contents', {})
            if isinstance(lc, dict):
                for lid, items in lc.items():
                    for it in items:
                        c_str = json.dumps(it, ensure_ascii=False)
                        if '看錶演' in c_str:
                            print(f"  Found in LID {lid}, title: {it.get('title')}, opt: {it.get('dropdown_option')}")
        elif isinstance(data, list):
            for it in data:
                c_str = json.dumps(it, ensure_ascii=False)
                if '看錶演' in c_str:
                    print(f"  Found in list item id: {it.get('id')}, lesson_id: {it.get('lesson_id')}, title: {it.get('title')}")
    except Exception as e:
        print(f"Error {fname}: {e}")
