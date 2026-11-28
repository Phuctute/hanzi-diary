import json

with open('data/lesson_contents.json', 'r', encoding='utf-8') as f:
    lc_list = json.load(f)

print(f"Total items in lesson_contents.json: {len(lc_list)}")

for it in lc_list:
    text_to_check = json.dumps(it, ensure_ascii=False)
    for term in ['Đạm Thủy ngắm hoàng hôn', '你平常不愛逛夜市', '看錶演', 'Cuối tuần này các cậu có kế hoạch']:
        if term in text_to_check:
            print(f"\nTerm '{term}' found in lesson_id={it.get('lesson_id')}, id={it.get('id')}, title={it.get('title')}, type={it.get('type')}, opt={it.get('dropdown_option')}")
            # print snippet of content and vietnamese
            cont = str(it.get('content'))[:200]
            vi = str(it.get('vietnamese'))[:200]
            print(f"  Content: {cont}")
            print(f"  Vietnamese: {vi}")

with open('translation_cache.json', 'r', encoding='utf-8') as f:
    tc = json.load(f)

print("\n--- In translation_cache.json ---")
for k, v in tc.items():
    for term in ['Dia, bình thường', 'Cuối tuần này các cậu', 'Đạm Thủy ngắm']:
        if term in str(v) or term in str(k):
            print(f"  Key: {k[:50]} -> Val: {str(v)[:100]}")
