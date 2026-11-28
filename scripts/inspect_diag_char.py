with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(11265, 11310):
    print(f"{i+1}: {lines[i]}", end="")
