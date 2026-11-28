with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "book-select" in l or "lesson-select" in l or "bookSelect" in l or "lessonSelect" in l or "currentBookId" in l or "currentLessonId" in l:
        if i < 4000 or i > 10000:
            print(f"Line {i+1}: {l.strip()[:140]}")
