import json
import os
import subprocess
import gzip
import re

DATA_DIR = "/home/pc/chinese-learning/data"
OUT_DIR = "/home/pc/chinese-learning/data/audio_cache/dialogue/7"
DATA_PATH = "/home/pc/chinese-learning/data/lesson_contents.json"
OFF2_PATH = "/home/pc/chinese-learning/data/offline_curriculum_2.json"
OFF2_GZ = "/home/pc/chinese-learning/data/offline_curriculum_2.json.gz"

os.makedirs(OUT_DIR, exist_ok=True)

with open(DATA_PATH, "r", encoding="utf-8") as f:
    lc_data = json.load(f)

# ========================================================
# 1. BOOK 1 (Lessons 75 to 90)
# ========================================================
print("=== PROCESSING BOOK 1 (Lessons 75-90) ===")
B1_SEG_FILE = f"{DATA_DIR}/b1_yt_segments.json"
B1_YT_AUDIO = f"{DATA_DIR}/b1_yt.m4a"

with open(B1_SEG_FILE, "r", encoding="utf-8") as f:
    b1_segs = json.load(f)["segments"]

B1_RANGES = {
    75: ((2, 11), (13, 23), (25, 34)),
    76: ((38, 47), (49, 60), (62, 74)),
    77: ((78, 87), (89, 104), (106, 118)),
    78: ((122, 143), (145, 156), (158, 171)),
    79: ((175, 190), (192, 209), (211, 224)),
    80: ((226, 241), (243, 257), (259, 275)),
    81: ((277, 293), (295, 310), (312, 327)),
    82: ((331, 356), (358, 378), (380, 399)),
    83: ((403, 421), (423, 439), (441, 462)),
    84: ((466, 488), (490, 504), (506, 526)),
    85: ((528, 546), (548, 567), (569, 592)),
    86: ((596, 614), (616, 644), (646, 662)),
    87: ((666, 689), (691, 714), (716, 741)),
    88: ((745, 776), (778, 812), (814, 835)),
    89: ((838, 866), (867, 890), (891, 935)),
    90: ((938, 975), (976, 1011), (1012, 1043)),
}

for lid, (r1, r2, r3) in B1_RANGES.items():
    s_lid = str(lid)
    items = lc_data.get(s_lid, [])
    if len(items) < 2:
        # Create default 2 items if empty
        items = [
            {"title": "Hội thoại 1", "dropdown_option": "Hội thoại 1", "type": "dialogue", "content": "", "audio_url": "", "script_json": []},
            {"title": "Hội thoại 2", "dropdown_option": "Hội thoại 2", "type": "dialogue", "content": "", "audio_url": "", "script_json": []}
        ]
    else:
        items[0]["dropdown_option"] = "Hội thoại 1"
        items[1]["dropdown_option"] = "Hội thoại 2"

    # Make sure items list has at least 5 slots
    while len(items) < 5:
        items.append({"title": "", "dropdown_option": "", "type": "dialogue", "content": "", "audio_url": "", "script_json": []})

    for track_key, r_range, item_idx, opt_name in [("bd1", r1, 2, "Bài khoá 1"), ("bd2", r2, 3, "Bài khoá 2"), ("bd3", r3, 4, "Bài khoá 3")]:
        start_idx, end_idx = r_range
        t_start = b1_segs[start_idx]["start"]
        t_end = b1_segs[end_idx]["end"]
        duration = t_end - t_start

        out_mp3 = f"bk_{lid}_{track_key}.mp3"
        out_path = os.path.join(OUT_DIR, out_mp3)

        cmd = [
            "ffmpeg", "-y",
            "-ss", f"{t_start:.3f}",
            "-to", f"{t_end:.3f}",
            "-i", B1_YT_AUDIO,
            "-c:a", "libmp3lame",
            "-b:a", "128k",
            out_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        script_json = []
        cur_id = 1
        lines_text = []
        for i in range(start_idx, end_idx + 1):
            s = b1_segs[i]
            s_start = max(0.0, round(s["start"] - t_start, 2))
            s_end = min(round(duration, 2), round(s["end"] - t_start, 2))
            script_json.append({
                "id": cur_id,
                "text": s["text"],
                "start_time": s_start,
                "end_time": s_end
            })
            lines_text.append(s["text"])
            cur_id += 1

        target_item = items[item_idx]
        target_item["dropdown_option"] = opt_name
        if not target_item.get("title"):
            target_item["title"] = f"{opt_name} (課本錄音)"
        if not target_item.get("content"):
            target_item["content"] = "\n".join(lines_text)
        target_item["audio_url"] = f"audio/dialogue/7/{out_mp3}"
        target_item["script_json"] = script_json

    lc_data[s_lid] = items[:5]
    print(f"Book 1 Lesson {lid}: Configured 5 items successfully")


# ========================================================
# 2. HELPER FOR BOOKS 2, 3, 4 (2 tracks per lesson)
# ========================================================
def process_book_2_tracks(bnum, start_lid, end_lid, markers):
    print(f"\n=== PROCESSING BOOK {bnum} (Lessons {start_lid}-{end_lid}) ===")
    seg_file = f"{DATA_DIR}/b{bnum}_yt_segments.json"
    yt_audio = f"{DATA_DIR}/b{bnum}_yt.m4a"

    with open(seg_file, "r", encoding="utf-8") as f:
        segs = json.load(f)["segments"]

    for idx_in_book, lid in enumerate(range(start_lid, end_lid + 1)):
        s_lid = str(lid)
        items = lc_data.get(s_lid, [])
        if len(items) < 2:
            items = [
                {"title": "Hội thoại 1", "dropdown_option": "Hội thoại 1", "type": "dialogue", "content": "", "audio_url": "", "script_json": []},
                {"title": "Hội thoại 2", "dropdown_option": "Hội thoại 2", "type": "dialogue", "content": "", "audio_url": "", "script_json": []}
            ]
        else:
            items[0]["dropdown_option"] = "Hội thoại 1"
            items[1]["dropdown_option"] = "Hội thoại 2"

        while len(items) < 4:
            items.append({"title": "", "dropdown_option": "", "type": "dialogue", "content": "", "audio_url": "", "script_json": []})

        r_dialogue, r_reading = markers[idx_in_book]

        for track_key, r_range, item_idx, opt_name in [("bd1", r_dialogue, 2, "Bài khoá 1"), ("bd2", r_reading, 3, "Bài khoá 2")]:
            start_idx, end_idx = r_range
            t_start = segs[start_idx]["start"]
            t_end = segs[end_idx]["end"]
            duration = t_end - t_start

            out_mp3 = f"bk_{lid}_{track_key}.mp3"
            out_path = os.path.join(OUT_DIR, out_mp3)

            cmd = [
                "ffmpeg", "-y",
                "-ss", f"{t_start:.3f}",
                "-to", f"{t_end:.3f}",
                "-i", yt_audio,
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                out_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            script_json = []
            cur_id = 1
            lines_text = []
            for i in range(start_idx, end_idx + 1):
                s = segs[i]
                s_start = max(0.0, round(s["start"] - t_start, 2))
                s_end = min(round(duration, 2), round(s["end"] - t_start, 2))
                script_json.append({
                    "id": cur_id,
                    "text": s["text"],
                    "start_time": s_start,
                    "end_time": s_end
                })
                lines_text.append(s["text"])
                cur_id += 1

            target_item = items[item_idx]
            target_item["dropdown_option"] = opt_name
            if not target_item.get("title") or "主題課文" in target_item.get("title", ""):
                target_item["title"] = f"{opt_name} (課本錄音)"
            if not target_item.get("content") or "在今天的中文課上" in target_item.get("content", ""):
                target_item["content"] = "\n".join(lines_text)
            target_item["audio_url"] = f"audio/dialogue/7/{out_mp3}"
            target_item["script_json"] = script_json

        lc_data[s_lid] = items[:4]
        print(f"Book {bnum} Lesson {lid}: Configured 4 items successfully (D={duration:.1f}s)")


# ========================================================
# 3. BOOK 2 RANGES (16 lessons: 91 to 106)
# ========================================================
B2_RANGES = [
    ((0, 18), (20, 42)),      # L1 (91)
    ((44, 71), (73, 92)),     # L2 (92)
    ((94, 121), (123, 139)),  # L3 (93)
    ((140, 169), (170, 185)), # L4 (94)
    ((187, 205), (207, 220)), # L5 (95)
    ((221, 250), (252, 278)), # L6 (96)
    ((279, 314), (316, 339)), # L7 (97)
    ((340, 360), (362, 378)), # L8 (98)
    ((380, 399), (401, 419)), # L9 (99)
    ((420, 449), (451, 469)), # L10 (100)
    ((471, 493), (495, 511)), # L11 (101)
    ((513, 542), (544, 568)), # L12 (102)
    ((570, 598), (600, 625)), # L13 (103)
    ((626, 659), (661, 676)), # L14 (104)
    ((677, 705), (707, 724)), # L15 (105)
    ((726, 755), (757, 787)), # L16 (106)
]
process_book_2_tracks(2, 91, 106, B2_RANGES)


# ========================================================
# 4. BOOK 3 RANGES (16 lessons: 107 to 122)
# ========================================================
B3_RANGES = [
    ((3, 82), (84, 141)),
    ((143, 218), (220, 284)),
    ((286, 383), (385, 436)),
    ((438, 524), (526, 595)),
    ((597, 685), (687, 743)),
    ((747, 816), (818, 889)),
    ((893, 995), (997, 1064)),
    ((1066, 1143), (1145, 1211)),
    ((1213, 1291), (1293, 1347)),
    ((1349, 1409), (1411, 1477)),
    ((1479, 1580), (1582, 1641)),
    ((1643, 1722), (1724, 1800)),
    ((1802, 1871), (1873, 1920)),
    ((1922, 1997), (1999, 2039)),
    ((2041, 2137), (2139, 2220)),
    ((2222, 2290), (2292, 2366)),
]
process_book_2_tracks(3, 107, 122, B3_RANGES)


# ========================================================
# 5. BOOK 4 RANGES (16 lessons: 123 to 138)
# ========================================================
B4_RANGES = [
    ((1, 45), (46, 106)),       # L1 (123)
    ((108, 139), (141, 161)),   # L2 (124)
    ((163, 190), (192, 205)),   # L3 (125)
    ((207, 239), (241, 264)),   # L4 (126)
    ((266, 282), (284, 303)),   # L5 (127)
    ((305, 329), (331, 366)),   # L6 (128)
    ((368, 392), (394, 451)),   # L7 (129)
    ((453, 506), (508, 599)),   # L8 (130)
    ((601, 666), (668, 834)),   # L9 (131)
    ((836, 880), (881, 937)),   # L10 (132)
    ((939, 1001), (1003, 1053)),# L11 (133)
    ((1055, 1083), (1085, 1117)),# L12 (134)
    ((1119, 1150), (1152, 1170)),# L13 (135)
    ((1171, 1197), (1199, 1210)),# L14 (136)
    ((1211, 1220), (1221, 1227)),# L15 (137)
    ((1228, 1230), (1231, 1233)),# L16 (138)
]
process_book_2_tracks(4, 123, 138, B4_RANGES)


# ========================================================
# 6. SAVE & UPDATE BUNDLES
# ========================================================
print("\n=== SAVING LESSON CONTENTS & OFFLINE CURRICULUM ===")
with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(lc_data, f, ensure_ascii=False, indent=2)

with open(OFF2_PATH, "r", encoding="utf-8") as f:
    off2 = json.load(f)
off2["lesson_contents"] = lc_data

with open(OFF2_PATH, "w", encoding="utf-8") as f:
    json.dump(off2, f, ensure_ascii=False)

with gzip.open(OFF2_GZ, "wb") as f:
    f.write(json.dumps(off2, ensure_ascii=False).encode("utf-8"))

print("SUCCESS: ALL 4 BOOKS (64 LESSONS) CONFIGURED WITH AUTHENTIC AUDIO!")
