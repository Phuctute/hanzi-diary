import json

with open("data/lessons.json", "r", encoding="utf-8") as f:
    lessons = json.load(f)

print("First lesson keys & sample:")
print(lessons[0])

print("\nBook 7 lessons:")
for l in lessons:
    if l.get("book_id") == 7:
        print(l)
