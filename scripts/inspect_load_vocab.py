with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "function loadVocabulariesAndContent" in l or "async function loadVocabulariesAndContent" in l:
        print(f"Around line {i+1}:")
        for j in range(i, min(len(lines), i + 80)):
            print(f"{j+1}: {lines[j]}", end="")
        break
