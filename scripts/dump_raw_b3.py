import json
from opencc import OpenCC

cc = OpenCC('s2twp')

with open("b3_yt_segments.json", "r", encoding="utf-8") as f:
    b3_segs = json.load(f)["segments"]

B3_RANGES = {
    109: (286, 383, "明哲", "芳草", "Minh Triết", "Phương Thảo"),
    110: (438, 524, "家豪", "芳草", "Gia Hào", "Phương Thảo"),
    111: (597, 685, "馬丁", "朋子", "Martin", "Tomoko"),
    112: (747, 816, "淑芬", "東賢", "Thục Phân", "Dong-hyun"),
    113: (893, 995, "朋子", "東賢", "Tomoko", "Dong-hyun"),
    114: (1066, 1143, "東賢", "朋子", "Dong-hyun", "Tomoko"),
    115: (1213, 1291, "家豪", "東賢", "Gia Hào", "Dong-hyun"),
    116: (1349, 1409, "朋子", "家豪", "Tomoko", "Gia Hào"),
    117: (1479, 1580, "馬丁", "芳草", "Martin", "Phương Thảo"),
    118: (1643, 1722, "林家豪", "王經理", "Lâm Gia Hào", "Trưởng phòng Vương"),
    119: (1802, 1871, "芳草", "明哲", "Phương Thảo", "Minh Triết"),
    120: (1922, 1997, "朋子", "馬丁", "Tomoko", "Martin"),
    121: (2041, 2137, "東賢", "家豪", "Dong-hyun", "Gia Hào"),
    122: (2222, 2290, "芳草", "東賢", "Phương Thảo", "Dong-hyun")
}

for lid, (start, end, spk1, spk2, vi1, vi2) in B3_RANGES.items():
    chunk = b3_segs[start:end+1]
    raw_text = " ".join([cc.convert(s["text"]) for s in chunk])
    with open(f"scripts/b3_raw_{lid}.txt", "w", encoding="utf-8") as out:
        out.write(f"=== Lesson {lid}: {spk1} ({vi1}) & {spk2} ({vi2}) ===\n")
        out.write(raw_text + "\n")

print("Exported raw dialogue text for B3 lessons.")
