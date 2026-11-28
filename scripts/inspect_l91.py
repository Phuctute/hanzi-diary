import json

with open('data/offline_curriculum_2.json', 'r', encoding='utf-8') as f:
    c2 = json.load(f)

items = c2.get('lesson_contents', {}).get('91', [])
for i, it in enumerate(items):
    print(f"Item {i}: {it.get('dropdown_option')} - {it.get('title')}")
    print("Content:", it.get('content'))
