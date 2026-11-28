with open("b1_review_output.txt", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "kế hoạch gì chưa" in l or "Đạm Thuỷ" in l or "hoàng hôn" in l:
        print(f"Around line {i+1}:")
        for j in range(max(0, i-5), min(len(lines), i+10)):
            print(f"  {j+1}: {lines[j].strip()}")
        print("-" * 50)
