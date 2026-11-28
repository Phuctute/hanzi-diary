import os

for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root:
        continue
    for f in files:
        if f.endswith((".json", ".js", ".html", ".php", ".txt", ".sql")):
            p = os.path.join(root, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as file:
                    for line_no, line in enumerate(file, 1):
                        if "Cuối tuần này các cậu" in line or "kế hoạch gì chưa" in line or "ngắm hoàng hôn, nghe nói" in line:
                            print(f"{p}:{line_no} -> {line.strip()[:150]}")
            except:
                pass
