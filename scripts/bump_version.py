import os

files_to_update = [
    "index.html",
    "templates/index.html",
    "static/js/offline-store.js",
    "static/js/app.js",
    "sw.js",
    "static/sw.js"
]

for fpath in files_to_update:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = content.replace("2.4.4", "2.4.5").replace("v2.4.4", "v2.4.5")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated version to 2.4.5 in {fpath}")

print("Version bump to 2.4.5 complete.")
