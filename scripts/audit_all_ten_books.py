import json, re

with open("data/books.json", "r", encoding="utf-8") as f:
    books = json.load(f)

with open("data/lessons.json", "r", encoding="utf-8") as f:
    lessons = json.load(f)

with open("data/lesson_contents.json", "r", encoding="utf-8") as f:
    contents = json.load(f)

# Group lessons by book_id
book_lessons = {}
for l in lessons:
    bid = l.get("book_id")
    if bid not in book_lessons:
        book_lessons[bid] = []
    book_lessons[bid].append(l)

results = {}

for b in books:
    bid = b.get("book_id")
    bname = b.get("book")
    ls = book_lessons.get(bid, [])
    
    total_dialogues = 0
    mismatched_lines = []
    fragmented_dialogues = [] # turns > 30 for standard dialogue indicating choppy turns
    fake_speaker_dialogues = [] # contains generic speakers like 同學, 良介 when not appropriate
    missing_audio = []
    
    for l in ls:
        lid = str(l.get("lesson_id"))
        items = contents.get(lid, [])
        for idx, it in enumerate(items):
            ctype = it.get("type")
            title = it.get("title", "")
            c = it.get("content", "")
            vi = it.get("vietnamese", "")
            audio = it.get("audio_url", "")
            
            c_lines = [x.strip() for x in c.splitlines() if x.strip()]
            v_lines = [x.strip() for x in (vi or "").splitlines() if x.strip()]
            
            if ctype == "dialogue":
                total_dialogues += 1
                # Check line mismatch
                if len(c_lines) != len(v_lines):
                    mismatched_lines.append((lid, title, len(c_lines), len(v_lines)))
                
                # Check choppy fragmentation (> 40 lines in a single short dialogue)
                if len(c_lines) > 40:
                    fragmented_dialogues.append((lid, title, len(c_lines)))
                
                # Check speakers
                speakers = set()
                for line in c_lines:
                    m = re.match(r'^([^：:]{1,10})[：:]', line)
                    if m:
                        speakers.add(m.group(1).strip())
                if "同學" in speakers:
                    fake_speaker_dialogues.append((lid, title, "Chứa tên '同學'"))
                if bid in [9, 10] and ("良介" in speakers or "美心" in speakers):
                    fake_speaker_dialogues.append((lid, title, f"Nhân vật lệch '{speakers}'"))
            
            if audio and not audio.startswith("audio/"):
                missing_audio.append((lid, title, audio))

    results[bid] = {
        "name": bname,
        "lesson_count": len(ls),
        "total_dialogues": total_dialogues,
        "mismatched_lines": mismatched_lines,
        "fragmented_dialogues": fragmented_dialogues,
        "fake_speaker_dialogues": fake_speaker_dialogues,
        "missing_audio": missing_audio
    }

for bid, r in results.items():
    print(f"\n========================================================")
    print(f"Book {bid}: {r['name']} ({r['lesson_count']} bài học, {r['total_dialogues']} bài hội thoại)")
    if r['mismatched_lines']:
        print(f"  ❌ Lệch số dòng dịch ({len(r['mismatched_lines'])} bài):")
        for m in r['mismatched_lines'][:3]:
            print(f"     - L{m[0]} '{m[1]}': Trung {m[2]} dòng vs Việt {m[3]} dòng")
        if len(r['mismatched_lines']) > 3:
            print(f"     ... và {len(r['mismatched_lines'])-3} bài khác.")
    else:
        print("  ✅ Số dòng Trung - Việt: 100% khớp.")
        
    if r['fake_speaker_dialogues']:
        print(f"  ❌ Tên nhân vật chưa chuẩn ({len(r['fake_speaker_dialogues'])} bài):")
        for f in r['fake_speaker_dialogues'][:3]:
            print(f"     - L{f[0]} '{f[1]}': {f[2]}")
        if len(r['fake_speaker_dialogues']) > 3:
            print(f"     ... và {len(r['fake_speaker_dialogues'])-3} bài khác.")
    else:
        print("  ✅ Tên nhân vật: 100% chuẩn xác.")
        
    if r['fragmented_dialogues']:
        print(f"  ⚠️ Bị ngắt vụn xen kẽ từng chữ/câu cụt ({len(r['fragmented_dialogues'])} bài):")
        for fg in r['fragmented_dialogues'][:3]:
            print(f"     - L{fg[0]} '{fg[1]}': {fg[2]} dòng vụn")
        if len(r['fragmented_dialogues']) > 3:
            print(f"     ... và {len(r['fragmented_dialogues'])-3} bài khác.")
    else:
        print("  ✅ Độ liền mạch lượt thoại: Chuẩn.")
