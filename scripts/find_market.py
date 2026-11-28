import os

pattern = "bình thường cậu không thích đi chợ đêm"
pattern2 = "không thích đi chợ đêm"

for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root:
        continue
    for f in files:
        if f.endswith((".json", ".js", ".html", ".php", ".txt", ".sql")):
            p = os.path.join(root, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as file:
                    txt = file.read()
                    if pattern2 in txt:
                        print(f"FOUND IN: {p}")
            except:
                pass
