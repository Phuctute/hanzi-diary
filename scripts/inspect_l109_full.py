import json

with open("b3_yt_segments.json", "r", encoding="utf-8") as f:
    d = json.load(f)

segs = d["segments"][286:384]
full_text = " ".join([s["text"] for s in segs])
print("FULL TEXT OF L109:")
print(full_text)
