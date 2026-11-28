for lid in [132, 135, 136, 138]:
    with open(f"scripts/b4_raw_{lid}.txt", "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines()[:25] if line.strip()]
    print(f"\n--- L{lid} sample ({len(lines)} lines) ---")
    for l in lines[:12]:
        print(" ", l)
