with open("static/js/offline-store.js", "r", encoding="utf-8") as f:
    off_code = f.read()

with open("index.html", "r", encoding="utf-8") as f:
    index_code = f.read()

# Kiểm tra cách app tải dữ liệu khi chuyển bài hoặc chuyển tab
print("1. Kiểm tra kích thước bundle & chiến lược nạp:")
for word in ["offline_bundle.json", "offline_curriculum", "JSON.parse", "fetch(", "localStorage"]:
    cnt_off = off_code.count(word)
    cnt_idx = index_code.count(word)
    print(f"  - '{word}': offline-store.js={cnt_off}, index.html={cnt_idx}")

# Tìm các đoạn chuyển tab hoặc chuyển bài
print("\n2. Kiểm tra hàm switchTab / switchView / loadLesson:")
import re
for fn in ["switchTab", "switchView", "loadVocabulariesAndContent", "renderKaraokeContent"]:
    m = re.findall(rf'function\s+{fn}\b[^{{]*\{{', index_code)
    print(f"  - Tìm thấy {fn}: {len(m)}")
