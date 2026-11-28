import json

with open('data/offline_curriculum_2.json', 'r', encoding='utf-8') as f:
    c2 = json.load(f)

items = c2.get('lesson_contents', {}).get('81', [])
print(f"Total items in LID 81: {len(items)}")
for idx, it in enumerate(items):
    print(f"\n--- ITEM {idx}: opt={it.get('dropdown_option')} title={it.get('title')} type={it.get('type')} ---")
    print("CONTENT:\n", it.get('content'))
    print("VIETNAMESE:\n", it.get('vietnamese'))
    print("SCRIPT_JSON:")
    for s in it.get('script_json', []):
        print(" ", s)
