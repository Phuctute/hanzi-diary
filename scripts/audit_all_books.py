import json, re

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

books_info = {
    "Thời Đại 1": range(75, 91),
    "Thời Đại 2": range(91, 107),
    "Thời Đại 3": range(107, 123),
    "Thời Đại 4": range(123, 139)
}

weird_vi_patterns = [
    "gà xương", "mèo đỏ", "Mèo Đỏ", "Dia,", "Maxim", "Longji", "99 Longji",
    "xương gà", "chó xương", "Thành phố Mèo", "người Nhật may mắn"
]

report = []

for bname, lid_range in books_info.items():
    print(f"\n=================== AUDITING {bname} ===================")
    for lid in lid_range:
        items = contents.get(str(lid), [])
        if not items:
            report.append(f"[{bname}] Lesson {lid}: KHÔNG CÓ DỮ LIỆU NỘI DUNG!")
            continue
        
        for idx, it in enumerate(items):
            title = it.get("title", "")
            ctype = it.get("type", "")
            content = it.get("content", "")
            vi = it.get("vietnamese", "")
            audio_url = it.get("audio_url", "")
            
            c_lines = [l.strip() for l in content.split("\n") if l.strip()]
            v_lines = [l.strip() for l in (vi or "").split("\n") if l.strip()]
            
            # 1. Kiểm tra lệch số dòng giữa tiếng Trung và tiếng Việt
            if len(c_lines) != len(v_lines) and ctype == "dialogue":
                report.append(f"[{bname}] L{lid} Item {idx} '{title}' (dialogue): LỆCH DÒNG! ZH={len(c_lines)} vs VI={len(v_lines)}")
            
            # 2. Kiểm tra từ dịch ngớ ngẩn / hallucination
            for w in weird_vi_patterns:
                if w.lower() in (vi or "").lower():
                    report.append(f"[{bname}] L{lid} Item {idx} '{title}': CHỨA TỪ DỊCH LỖI: '{w}'")
            
            # 3. Kiểm tra nhân vật tiếng Trung trong hội thoại
            if ctype == "dialogue":
                speakers = []
                for line in c_lines:
                    colon = re.search(r'[:：]', line)
                    if colon and colon.start() <= 15:
                        speakers.append(line[:colon.start()].strip())
                unique_speakers = list(dict.fromkeys(speakers))
                if "同學" in unique_speakers:
                    report.append(f"[{bname}] L{lid} Item {idx} '{title}': CHỨA NHÂN VẬT CHUNG CHUNG '同學' (chưa gán đúng tên nhân vật thật!)")
                if bname in ["Thời Đại 3", "Thời Đại 4"] and ("良介" in unique_speakers or "美心" in unique_speakers):
                    report.append(f"[{bname}] L{lid} Item {idx} '{title}': CHỨA NHÂN VẬT LẠ '{unique_speakers}' trong sách {bname}!")

print(f"\nTOTAL ISSUES FOUND: {len(report)}")
for r in report:
    print(" - ", r)
