# Báo cáo Migration — CamNangBDS v57 → Cẩm Nang BĐS 2.0.0

Ngày: 2026-09-28 · Source of truth: `CamNangBDS_v57.html` (26,66 MB, 1 file)

## 1. Audit hiện trạng v57

| Hạng mục | Hiện trạng |
|---|---|
| Kích thước | 26,66 MB. Khoảng 24,8 MB là **154 ảnh Base64** (150 ảnh khác nhau, 4 ảnh trùng). Riêng bài Nam Mekong nặng 2,7 MB. |
| Bài viết | 164 bài trong object `ART`: 77 bài đầy đủ, 76 bài "đang cập nhật", **11 bài mồ côi** (7 bản `trainghi_*` đã được `tqh_*` thay thế; `cu_lao_hiep_phuoc`, `essensia`, `hamonie`, `pmh2` không có đường vào). |
| Menu | 122 mục (Ch1: 3, Ch2: 3, Ch3: 3, Ch4: 19 vùng + 79 dự án, Ch5: 15). Hơn 40 bài chỉ vào được qua link trong bài hub. |
| Search | `SIDX` có 123/164 bài (thiếu 41 dự án). Trường `kw` lẫn **18 mảnh Base64 rác**. |
| URL | Không có. Mọi bài mở bằng `openPanel()` trong modal, không chia sẻ được link riêng. |
| SEO/OG | Chỉ có 1 bộ meta cho cả site. Không có OG riêng từng bài. |
| CSS | 33,7 KB trong `<style>`. Có vài quy tắc trùng nhưng vô hại. **Giữ nguyên 100%.** |
| JS | Toàn bộ trong 1 `<script>`: ART (≈26 MB), SIDX, UI, search, PDF. 175 lời gọi `openPanel` nằm trong nội dung. |
| Phụ thuộc ngoài | Google Fonts (giữ). `html2pdf.js` từ CDN **được tải nhưng không dùng** (nút PDF dùng `window.print`). |
| Lỗi nhỏ | Tiêu đề PDF luôn là "Bài viết" (`window.SIDX` không tồn tại). Footer ghi "v19". `openFaqCluster()` không còn được gọi ở đâu. |
| Nhãn lệch | Tên vùng trên menu Ch.04 khác tên trong SIDX (vd `zone_cng2`: menu ghi "Đông Thành Phố", SIDX ghi "Cần Giuộc · Nhà Bè"). **Menu là chuẩn** vì đó là bản Tú duyệt gần nhất. |
| Fanpage | v57 không có link Fanpage, chỉ có Facebook cá nhân. Đã thêm trường `author.fanpage`, nút tự hiện khi điền. |

## 2. Quyết định migration

1. **Site tĩnh sinh sẵn (MPA)**, build bằng Node, không thư viện ngoài. Mỗi bài là một file thật `/cam-nang/<slug>/index.html`, nên link trực tiếp, refresh, Back/Forward và OG hoạt động mà không cần JS hay cấu hình server.
2. **Giữ giao diện:** trang chủ được dựng lại từ đúng markup v57. Trang bài dùng lại khung panel, chỉ đổi từ modal sang trang, có hiệu ứng trượt vào và View Transitions.
3. **Slug:** tạo từ tiêu đề trên menu, không dấu. Bài cũ giữ ID panel ở `legacy.panelId`, và link `/#<id>` tự chuyển sang URL mới.
4. **Không mất dữ liệu:** 11 bài mồ côi được giữ với status `archived` (có URL, `noindex`, không hiện trong menu/search). 76 bài "đang cập nhật" có status `stub` (hiển thị, `noindex`).
5. **Ảnh:** 134 ảnh bài được tách ra WebP 640/1280/2048 (không phóng to), `srcset` + lazy load, có sẵn width/height để chống giật layout. Chân dung và avatar tách riêng.
6. **OG:** 164 ảnh 1200×630. Bài có ảnh thì cắt từ ảnh đầu, bài không ảnh thì dùng thẻ thương hiệu. Có thêm ảnh riêng cho trang chủ.
7. **Search:** index nhẹ chỉ gồm metadata, phủ 153 bài (trước chỉ 123), chỉ tải khi dùng. Giữ nguyên thuật toán chấm điểm và tìm không dấu của v57.
8. **Bỏ** `html2pdf.js` (không dùng). PDF vẫn in bằng cửa sổ in như cũ, đã sửa lỗi tiêu đề và chờ ảnh tải xong mới in.
9. **Thêm mới (tối thiểu):** nút 🔗 chia sẻ trên trang bài (Web Share, hoặc sao chép link), `sitemap.xml`, `robots.txt`, JSON-LD, trang 404, `_headers` cache, `_redirects`.

## 3. Kết quả kiểm thử (Playwright, Chromium, desktop 1280 px + mobile 390 px)

- **So sánh pixel với v57:** trang chủ giống hệt, chỉ khác dòng footer version. Menu Chương 4 mở ra: 0 pixel khác biệt.
- **164/164 trang bài:** chiều cao nội dung khớp v57 (sai lệch 0 px trên mobile).
- **46 bài kiểm tra chức năng đạt** (gồm Xuất PDF: đúng tiêu đề, đủ 14/14 ảnh ở bài Nam Mekong): accordion, 19 vùng/79 dự án, chip → bài, Back giữ trạng thái chương, Forward, refresh, tìm kiếm có dấu và không dấu, bấm kết quả, nút ✕, link cũ `/#marq`, FAQ, bộ lọc 22 nguyên tắc, link vùng → dự án, Back giữa các bài, không tràn ngang, 0 lỗi console/JS, 164 trang HTTP 200 có đủ OG, 0 ảnh lỗi, mọi link nội bộ và ảnh OG đều tồn tại.

## 4. Hiệu năng

| | v57 | 2.0.0 |
|---|---|---|
| Tải ban đầu trang chủ | ≈ 26,7 MB + html2pdf (≈ 0,9 MB) | **≈ 62 KB gzip** (HTML 8,7 + CSS 8,1 + JS 2,4 + chân dung 39,8 KB) + font |
| Mở 1 bài | 0 (đã tải sẵn 26 MB) | 3–7 KB HTML + ảnh của riêng bài đó (lazy) |
| Tăng theo số bài | Tuyến tính theo toàn kho | Chỉ menu tăng (≈ 0,3 KB/bài) |

## 5. Việc còn mở
- Điền `author.fanpage` trong `site.config.json` khi có link Fanpage.
- Cập nhật URL repo GitHub vào `README.md` sau khi tạo kho.
- Ngày đăng gốc của bài v57 không được lưu, nên tạm dùng 2026-09-28.
- Có thể dọn các bài `archived` trùng lặp sau khi Tú xác nhận.

## 6. Bổ sung 2026-09-29 — Gộp phần vỏ website đang chạy (bản GPT)

- **Nguồn đối chiếu:** trang đã lưu từ `nguyenanhtu.vn` (trang chủ, /atlas/, /nhat-san/), file `cam-nang-4e096bc3dd2e.js`, ảnh chụp DNS tại TenTen.
- **Bản đang chạy đã có:** 164 URL `/cam-nang/<slug>/`, nội dung tải theo từng bài dạng JSON, `?bai=<id>`, thanh menu NAT, nút Liên hệ, trang World Atlas và Nhật san (thư viện trống), nút "Sao chép liên kết", dòng tác giả "Nguyễn Anh Tú · Tư vấn bất động sản". Hosting là nền tảng OpenAI, qua Cloudflare custom hostname.
- **Cách gộp:**
  - Slug của 2.0 lấy đúng 164 slug đang chạy, nên không link nào đã chia sẻ bị hỏng.
  - CSS thanh menu, nút Liên hệ và trang ấn phẩm được lấy nguyên văn từ bản đang chạy.
  - Không lấy các CSS do tiện ích trình duyệt chèn vào lúc lưu trang (Monica, Ant Design…).
- **So sánh pixel với bản đang chạy** (desktop 1280, mobile 390):
  - Trang chủ toàn trang: chỉ khác dòng số phiên bản ở chân trang.
  - Trang World Atlas: giống hệt.
- **Kiểm thử tự động: 62/62 mục đạt.** Có thêm các mục cho thanh menu, nút Liên hệ, /atlas/, kỳ nháp, bản đọc HTML và nút sao chép liên kết.
- **Ghi chú:** các bài "đang cập nhật" rất ngắn thấp hơn khoảng 10px so với v57. Đó là do chiều cao khung trang, nội dung không đổi.
