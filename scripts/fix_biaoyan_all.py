import os, json

for fname in ['data/offline_curriculum_2.json', 'data/offline_bundle.json', 'data/lesson_contents.json']:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        if '看錶演' in content:
            content = content.replace('看錶演', '看表演')
            with open(fname, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed 看錶演 in {fname}")
        else:
            print(f"No 看錶演 in {fname}")
