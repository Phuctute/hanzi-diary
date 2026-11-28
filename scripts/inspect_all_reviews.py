for fn in ["b1_review_output.txt", "b2_review_output.txt", "b3_review_output.txt", "b4_review_output.txt"]:
    with open(fn, "r", encoding="utf-8", errors="ignore") as f:
        txt = f.read()
        if "kế hoạch gì chưa" in txt:
            print(f"FOUND 'kế hoạch gì chưa' in {fn}")
        if "Đạm Thuỷ ngắm hoàng hôn" in txt or "ngắm hoàng hôn" in txt:
            print(f"FOUND 'ngắm hoàng hôn' in {fn}")
