import subprocess, json

commits = ["HEAD~3", "HEAD~2", "HEAD~1", "HEAD"]
for c in commits:
    try:
        out = subprocess.check_output(["git", "show", f"{c}:data/lesson_contents.json"], text=True, encoding="utf-8")
        data = json.loads(out)
        l81 = data.get("81", [])
        print(f"\n--- Commit {c} - Lesson 81 items count: {len(l81)} ---")
        if l81:
            it0 = l81[0]
            print("  Title:", it0.get("title"))
            print("  ZH 1st:", (it0.get("content") or "").splitlines()[:2])
            print("  VI 1st:", (it0.get("vietnamese") or "").splitlines()[:2])
    except Exception as e:
        print(f"Error {c}: {e}")
