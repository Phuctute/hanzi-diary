import json

with open('translation_cache.json', 'r', encoding='utf-8') as f:
    tc = json.load(f)

for k, v in tc.items():
    if 'ngắm hoàng hôn' in str(v):
        print(f"KEY: {repr(k)}")
        print(f"VAL: {repr(v)}\n")
