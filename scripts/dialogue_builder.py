import json
from opencc import OpenCC

cc = OpenCC('s2twp')

with open("b3_yt_segments.json", "r", encoding="utf-8") as f:
    b3_segs = json.load(f)["segments"]

def get_text(start_id, end_id):
    chunk = b3_segs[start_id:end_id+1]
    return " ".join([cc.convert(s["text"]) for s in chunk])

print("Ready to process dialogues.")
