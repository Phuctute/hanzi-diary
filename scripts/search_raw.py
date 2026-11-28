import json, os

results = []
for root, dirs, files in os.walk("."):
    if ".git" in root or "node_modules" in root:
        continue
    for f in files:
        if f.endswith((".json", ".js", ".html", ".php")):
            p = os.path.join(root, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as file:
                    txt = file.read()
                    if "ngắm hoàng hôn" in txt or "hoàng hôn" in txt or "kế hoạch gì chưa" in txt:
                        results.append((p, f))
            except:
                pass

print("Files containing 'hoàng hôn' or 'kế hoạch gì chưa':", results)
