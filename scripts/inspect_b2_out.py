with open("b2_review_output.txt", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "Dia, bình thường" in l or "bình thường cậu không thích đi chợ đêm" in l:
        print(f"Around line {i+1}:")
        for j in range(max(0, i-10), min(len(lines), i+15)):
            print(f"  {j+1}: {lines[j].strip()}")
        break
