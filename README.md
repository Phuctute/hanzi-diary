# 🀄 Hanzi Diary (漢語日記) - Ứng dụng Học Tiếng Trung & Luyện Thi TOCFL

Ứng dụng học tiếng Trung phồn thể và giản thể hiện đại, tích hợp công nghệ PWA (Progressive Web App), luyện thi chứng chỉ TOCFL theo chuẩn Đài Loan, flashcard thông minh SRS, tra cứu Hán tự, luyện viết chữ Hán và phát âm chuẩn bản ngữ.

---

## ✨ Tính Năng Nổi Bật

- **🎯 Luyện thi TOCFL toàn diện (24 đề thi thử theo chuẩn Band A, B, C)**:
  - **Band A (A1–A2)**: 8 đề thi thử (9 phần: Nghe tranh, đối thoại, điền từ, đọc hiểu).
  - **Band B (B1–B2)**: 8 đề thi thử (4 phần: Đối thoại, đoạn văn nghe, điền từ cloze, đọc hiểu đoạn văn).
  - **Band C (C1–C2)**: 8 đề thi thử (4 phần: Hội thoại chuyên sâu, bài giảng/phỏng vấn, từ ngữ nâng cao, đọc hiểu dài).
  - **Thi thích ứng CAT IRT**: Tự động tăng giảm độ khó theo năng lực thí sinh bằng mô hình IRT.
- **🃏 Flashcard & Ôn tập ngắt quãng (SRS)**:
  - Thuật toán lặp lại ngắt quãng (Spaced Repetition System) giúp ghi nhớ từ vựng lâu dài.
  - Tự động lưu tiến trình học dở dang khi chuyển đổi giữa các tab.
  - Hỗ trợ học theo từng bài trong 16 tập giáo trình (Thời Đại, Đương Đại...).
- **✍️ Luyện viết chữ Hán (Stroke Order)**:
  - Minh họa từng nét viết theo chuẩn Hán tự bằng Hanzi Writer.
  - Hỗ trợ chuyển đổi qua lại giữa Phồn thể (Traditional) và Giản thể (Simplified).
- **🗣️ Luyện nói & Shadowing Video**:
  - Hơn 400+ video thực tế kèm phụ đề song ngữ và pinyin.
- **🔊 Phát âm chuẩn bản ngữ (Multi-voice Edge TTS)**:
  - Giọng đọc chuẩn Đài Loan (`zh-TW-HsiaoChenNeural`, `zh-TW-YunJheNeural`).
  - Tự động dự phòng và phát âm offline qua Web Speech API khi mất mạng.
- **📱 PWA Offline First**:
  - Hỗ trợ cài đặt lên màn hình chính điện thoại (iOS, Android, iPad, PC).
  - Hoạt động offline mượt mà kể cả khi không có mạng Internet.

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

### 1. Chạy bằng Docker (Khuyên dùng)

```bash
# Clone repository
git clone https://github.com/Phuctute/hanzi-diary.git
cd hanzi-diary

# Khởi chạy bằng Docker Compose
docker compose up -d
```
Truy cập ứng dụng tại: `http://localhost:8910`

### 2. Chạy trực tiếp bằng Python

```bash
# Cài đặt môi trường ảo
python3 -m venv venv
source venv/bin/activate  # Trên Windows: venv\Scripts\activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server
python app.py
```

### 3. Triển khai 1-Click lên Cloud (Render / Koyeb / Railway)

Repository này đã có sẵn file cấu hình `render.yaml` và `Dockerfile` tối ưu tự động tương thích với biến môi trường `$PORT` của các nền tảng đám mây:
- **Render.com**: Tạo Web Service mới -> Chọn repository `Phuctute/hanzi-diary` -> Render sẽ tự động build Docker và cấp tên miền `https://...onrender.com` miễn phí.
- **Koyeb**: Tạo Service mới -> Kết nối GitHub `Phuctute/hanzi-diary` -> Tự động nhận diện Dockerfile.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Python 3.11, Flask, Gunicorn, SQLite3
- **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript (ES6+), FontAwesome
- **Thư viện Hán tự**: HanziWriter, OpenCC (Chuyển đổi Phồn - Giản), Pinyin-Pro
- **Âm thanh**: Microsoft Edge TTS, Web Speech API
- **Offline & Cache**: Service Worker PWA, IndexedDB, CacheStorage

---

## 📄 Bản Quyền & Giấy Phép

Dự án phục vụ mục đích học tập và nghiên cứu cá nhân.
Phiên bản hiện tại: **v1.6.9**
