import json

with open("b4_yt_segments.json", "r", encoding="utf-8") as f:
    d = json.load(f)

print(type(d))
if isinstance(d, dict):
    print(d.keys())
    for k, v in d.items():
        print(f"Key {k}: type {type(v)}, len {len(v) if hasattr(v, '__len__') else ''}")
        if isinstance(v, list) and len(v) > 0:
            print("  First item:", v[0])
