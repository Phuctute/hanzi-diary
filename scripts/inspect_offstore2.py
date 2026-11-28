with open("static/js/offline-store.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(140, min(260, len(lines))):
    print(f"{i+1}: {lines[i]}", end="")
