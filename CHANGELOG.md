# CHANGELOG — Cẩm Nang BĐS

Quy ước: `2.x.0` = chức năng mới · `2.x.y` = sửa lỗi · Thêm/sửa bài ghi ở mục **Nội dung**, không tăng version.

## [2.1.0] — 2026-10-01 — Nâng cấp trang dự án
- **Thanh CTA cố định** (Gọi 0978 618 149 / Nhắn Zalo) ở đáy màn hình điện thoại; chỉ trên nhóm Dự Án Chọn Lọc (`ctaCategories` trong `site.config.json`). Ẩn trên máy tính và khi in.
- **Thanh điều hướng nổi** trong bài (Tổng quan · Chi tiết · Góc nhìn · SWOT) nằm trong thanh đầu trang đang dính, đánh dấu mục đang đọc khi cuộn; bấm mục không thêm lịch sử (nút Back vẫn thoát khỏi bài).
- **Dải số liệu lớn** đầu trang từ trường `facts` mới trong `articles.json` (tùy chọn, 2–4 số).
- **Thanh tỷ lệ** tự thêm vào mọi bảng có cột "Tỷ lệ" (số % + thanh ngang dưới tên loại hình; bảng gốc giữ nguyên).
- **Khối `p-travel`**: vị trí quy ra thời gian di chuyển.
- Build **cảnh báo** khi SWOT còn ghi "Chưa ghi nhận" ở ô Điểm yếu, hoặc bài có đủ mục 01–04 mà thiếu `facts`.
- **Sửa lỗi (có từ 2.0.0):** hiệu ứng trượt `pageIn` làm trang bài rộng thêm 28px, khiến điện thoại thu nhỏ trang và lệch các thanh cố định. Giữ nguyên hiệu ứng, chặn tràn ngang ở trang bài.
- `tests/smoke.py` thêm phần kiểm thử trang dự án (giả lập điện thoại thật). Trang chủ không đổi (49,8 KB).

### Nội dung
- 2026-10-01 — `nam-mekong-grand-plaza`, `artisan-park`: thêm `facts`, thời gian di chuyển, điểm yếu thật cho SWOT (soạn từ dữ kiện và thang điểm có sẵn trong bài, chờ Tú duyệt); Artisan thêm bảng tỷ lệ cơ cấu (174/349 = 49,9% · 175/349 = 50,1%); bỏ khối `.knums` ở mục 01 vì đã chuyển lên dải `facts`.

## [2.0.0] — 2026-09-28 — Kiến trúc nền
- Chuyển từ single-file v57 (26,7 MB) sang website tĩnh tách Code / Data / Content / Media.
- 164 bài có URL riêng `/cam-nang/<slug>/`, SEO + OG riêng, ảnh chia sẻ 1200×630.
- 134 ảnh Base64 được tách thành WebP responsive, lazy load.
- Search index nhẹ, tải lười, phủ 153 bài. Link cũ `/#id` tự chuyển hướng.
- Giữ nguyên giao diện v57 (đã so sánh pixel). Thêm nút chia sẻ 🔗. Bỏ html2pdf.js không dùng. Sửa tiêu đề PDF.
- Gộp phần vỏ website đang chạy (bản GPT): thanh menu NAT, nút Liên hệ, trang World Atlas, trang Nhật san, nút "Sao chép liên kết", dòng tác giả mới. Giữ đúng 164 địa chỉ `/cam-nang/<slug>/` đã công khai; link `?bai=<id>` tự chuyển. Đã so pixel với bản đang chạy: trùng khớp.
- Cơ chế đăng ấn phẩm theo kỳ bằng thư mục `publications/` (PDF, ảnh trang, hoặc HTML; hỗ trợ bản nháp).
- PROJECT_RULES.md, hướng dẫn deploy (GitHub + Cloudflare Pages + nguyenanhtu.vn), hướng dẫn nội dung.

### Nội dung
- 2026-09-29 — tài liệu: ghi địa chỉ kho GitHub, Cloudflare Pages; quy trình rút gọn cho Tú (PROJECT_RULES §11.0)
- 2026-09-29 — ấn phẩm nháp: `atlas/world-economic-atlas-v1-5-16`, `nhat-san/so-00-demo` (chưa công bố)
