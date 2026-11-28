import urllib.request

req = urllib.request.Request("https://p.vql.vn/", headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=5) as resp:
    html = resp.read().decode("utf-8")
    is_v246 = "v2.4.6" in html
    has_large_font = "text-[27px] sm:text-[30px] md:text-[32px]" in html
    print(f"v2.4.6 live: {is_v246} | Large font live: {has_large_font}")
