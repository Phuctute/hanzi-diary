with open("static/js/offline-store.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(0, min(140, len(lines))):
    print(f"{i+1}: {lines[i]}", end="")
