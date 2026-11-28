import urllib.request
import json

urls = [
    "https://p.vql.vn/api.php?action=get_lesson_contents&lesson_id=74",
    "https://p.vql.vn/api.php?action=get_lesson_contents&lesson_id=81",
    "https://p.vql.vn/api.php?action=get_lessons&book_id=7"
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        print("\nURL:", u)
        if "get_lesson_contents" in u:
            print("  success:", data.get("success"))
            d = data.get("data", [])
            print("  items:", len(d))
            for it in d:
                print("    id:", it.get("id"), "title:", it.get("title"), "type:", it.get("type"))
                print("    ZH 1st:", (it.get("content") or "").splitlines()[:1])
                print("    VI 1st:", (it.get("vietnamese") or "").splitlines()[:1])
        else:
            print("  sample:", str(data)[:200])
    except Exception as e:
        print("Error:", u, e)
