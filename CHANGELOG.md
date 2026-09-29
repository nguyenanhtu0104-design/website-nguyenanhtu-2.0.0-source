# CHANGELOG — Cẩm Nang BĐS

Quy ước: `2.x.0` = chức năng mới · `2.x.y` = sửa lỗi · Thêm/sửa bài ghi ở mục **Nội dung**, không tăng version.

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
