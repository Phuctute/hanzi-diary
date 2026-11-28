with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(11310, 11410):
    print(f"{i+1}: {lines[i]}", end="")
