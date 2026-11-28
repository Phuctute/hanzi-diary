import json
from opencc import OpenCC

cc = OpenCC('s2twp')

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

with open("b3_yt_segments.json", "r", encoding="utf-8") as f:
    b3_segs = json.load(f)["segments"]

# Danh sách nhân vật chuẩn cho từng bài Quyển 3 (L107-122)
# L107: 朋子 & 東賢 (xong)
# L108: 東賢 & 馬丁 (xong)
# L109: 明哲 & 芳草
# L110: 家豪 & 芳草
# L111: 馬丁 & 朋子
# L112: 淑芬 & 東賢
# L113: 朋子 & 東賢
# L114: 東賢 & 朋子
# L115: 家豪 & 東賢
# L116: 朋子 & 家豪
# L117: 馬丁 & 芳草
# L118: 林家豪 & 王經理
# L119: 芳草 & 明哲
# L120: 朋子 & 馬丁
# L121: 東賢 & 家豪
# L122: 芳草 & 東賢

print("Ready.")
