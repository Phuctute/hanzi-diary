import json

with open('data/offline_curriculum_2.json', 'r', encoding='utf-8') as f:
    c2 = json.load(f)

for lid, items in c2.get('lesson_contents', {}).items():
    for idx, it in enumerate(items):
        vi = it.get('vietnamese', '')
        if 'Đạm Thủy ngắm hoàng hôn' in vi or 'đạm thủy' in vi.lower():
            print(f"MATCH! lid={lid}, item_idx={idx}, id={it.get('id')}, title={it.get('title')}, opt={it.get('dropdown_option')}")
            print("Content snippet:\n", it.get('content')[:150])
            print("Vietnamese snippet:\n", vi[:150])
