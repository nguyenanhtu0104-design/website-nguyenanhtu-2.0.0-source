# Lưu trữ: script chuyển đổi v57 → 2.0.0 (đã chạy xong ngày 2026-09-28)

Các script trong thư mục này **không dùng cho vận hành**. Chúng chỉ được giữ lại để truy vết cách dữ liệu v57 được tách ra.
Đường dẫn trong script trỏ tới môi trường chuyển đổi cũ (`/home/claude/...`). Các bước đã thực hiện:
1. Trích object `ART` (164 bài) và `SIDX` (123 mục tìm kiếm) từ `CamNangBDS_v57.html` bằng Node.
2. `nav.py`: đọc menu 5 chương từ HTML → `nav.json`.
3. `migrate.py`: tạo metadata và slug, tách 134 ảnh Base64 ra WebP, đổi `openPanel()` thành link thật, ghi `content/`, `data/`, `assets/images/`.
4. Ảnh OG được tạo bằng `scripts/images.py og --all`. Tiêu đề SEO được lấy từ thẻ h1 của từng bài.
