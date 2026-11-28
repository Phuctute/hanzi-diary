import urllib.request
import json

urls = [
    "https://p.vql.vn/api.php?action=get_lesson_contents&lesson_id=109",
    "https://p.vql.vn/api.php?action=get_lesson_contents&lesson_id=121",
    "https://p.vql.vn/api.php?action=get_lesson_contents&lesson_id=134"
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        lid = u.split("lesson_id=")[-1]
        print(f"\n================ LIVE CHECK LESSON {lid} ================")
        if data.get("success") and data.get("data"):
            it = data["data"][0]
            print(f"Title: {it.get('title')}")
            cl = it.get('content', '').splitlines()
            vl = (it.get('vietnamese') or '').splitlines()
            print(f"Lines count: ZH={len(cl)} vs VI={len(vl)}")
            print("ZH 1st:", cl[:2])
            print("VI 1st:", vl[:2])
        else:
            print("FAILED or empty data")
    except Exception as e:
        print("Error fetching", u, e)

# Check index.html version
try:
    req = urllib.request.Request("https://p.vql.vn/", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        html = resp.read().decode("utf-8")
        if "v2.4.5" in html:
            print("\n✅ LIVE SITE https://p.vql.vn/ is running v2.4.5!")
        else:
            print("\n⚠️ Version tag not found in live HTML")
except Exception as e:
    print("Error checking live HTML:", e)
