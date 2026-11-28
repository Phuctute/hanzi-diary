import json

with open("translation_cache.json", "r", encoding="utf-8") as f:
    tc = json.load(f)

for k, v in tc.items():
    if "hoàng hôn" in str(v) or "kế hoạch gì chưa" in str(v):
        print(f"KEY: {k}\nVAL: {v}\n")
