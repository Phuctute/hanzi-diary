with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "karaokeBookSelect" in l or "karaokeLessonSelect" in l or "changeKaraokeLesson" in l or "onKaraokeBookChange" in l or "selectKaraokeLesson" in l or "loadDialogueLesson" in l:
        print(f"Line {i+1}: {l.strip()[:140]}")
