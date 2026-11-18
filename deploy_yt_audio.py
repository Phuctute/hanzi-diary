import json
import os
import subprocess

SEG_FILE = "/home/pc/chinese-learning/data/b1_yt_segments.json"
YT_AUDIO = "/home/pc/chinese-learning/data/b1_yt.m4a"
OUT_DIR = "/home/pc/chinese-learning/data/audio_cache/dialogue/7"
DATA_PATH = "/home/pc/chinese-learning/data/lesson_contents.json"
OFF2_PATH = "/home/pc/chinese-learning/data/offline_curriculum_2.json"
OFF2_GZ = "/home/pc/chinese-learning/data/offline_curriculum_2.json.gz"

LESSON_RANGES = {
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
}

with open(SEG_FILE, "r", encoding="utf-8") as f:
    seg_data = json.load(f)
segs = seg_data["segments"]

with open(DATA_PATH, "r", encoding="utf-8") as f:
    lc_data = json.load(f)

for lid, (r1, r2, r3) in LESSON_RANGES.items():
    s_lid = str(lid)
    items = lc_data.get(s_lid, [])
    if len(items) < 5:
        print(f"Skipping lesson {lid}: less than 5 items")
        continue

    for track_key, r_range, item_idx in [("bd1", r1, 2), ("bd2", r2, 3), ("bd3", r3, 4)]:
        start_idx, end_idx = r_range
        t_start = segs[start_idx]["start"]
        t_end = segs[end_idx]["end"]
        duration = t_end - t_start

        out_mp3 = f"bk_{lid}_{track_key}.mp3"
        out_path = os.path.join(OUT_DIR, out_mp3)

        # Cut audio using ffmpeg
        cmd = [
            "ffmpeg", "-y",
            "-ss", f"{t_start:.3f}",
            "-to", f"{t_end:.3f}",
            "-i", YT_AUDIO,
            "-c:a", "libmp3lame",
            "-b:a", "128k",
            out_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        # Build synced sentences
        script_json = []
        cur_id = 1
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
            cur_id += 1

        target_item = items[item_idx]
        target_item["audio_url"] = f"audio/dialogue/7/{out_mp3}"
        target_item["script_json"] = script_json
        print(f"Lesson {lid} {target_item['dropdown_option']} ({out_mp3}): {len(script_json)} sentences, duration {duration:.1f}s")

    lc_data[s_lid] = items

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(lc_data, f, ensure_ascii=False, indent=2)

import gzip
with open(OFF2_PATH, "r", encoding="utf-8") as f:
    off2 = json.load(f)
off2["lesson_contents"] = lc_data

with open(OFF2_PATH, "w", encoding="utf-8") as f:
    json.dump(off2, f, ensure_ascii=False)
with gzip.open(OFF2_GZ, "wb") as f:
    f.write(json.dumps(off2, ensure_ascii=False).encode("utf-8"))

print("ALL 14 LESSONS UPDATED WITH OFFICIAL YOUTUBE AUDIO AND SYNCED!")
