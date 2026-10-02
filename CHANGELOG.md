# CHANGELOG — Cẩm Nang BĐS

Quy ước: `2.x.0` = chức năng mới · `2.x.y` = sửa lỗi · Thêm/sửa bài ghi ở mục **Nội dung**, không tăng version.

## [2.6.0] — 2026-10-02 — Phóng to ảnh, nút mở công cụ nổi bật, bảng tính rộng hơn trên máy tính
- **Phóng to ảnh (mới):** file `assets/js/zoom.js` (tự chứa CSS, chỉ tải ở trang bài). Mọi ảnh nội dung trong bài có nút "🔍 Phóng to"; bấm ảnh hoặc nút để mở ảnh lớn bản chất lượng cao nhất, bấm lần nữa để phóng hết cỡ và kéo xem chi tiết, ← → hoặc vuốt để đổi ảnh, Esc/✕ để đóng. Không áp dụng cho ảnh nằm trong liên kết hoặc khối 360°. Ẩn khi in.
- **Khối nút kêu gọi `.p-cta-box` / `.p-cta` (mới, CSS):** nút vàng lớn "Mở bảng tính ngay →" (cao 58px, toàn chiều rộng trên điện thoại). Thay thẻ nhỏ cũ trong SkySOLIS và Nam Mekong.
- **Trang bảng tính SkySOLIS và Nam Mekong:** khung rộng 1440–1500px (trước 1060/960), Nam Mekong chia 2 cột trên máy tính (nhập liệu + mặt bằng bên trái, số liệu + lịch thanh toán bên phải), chữ và ô nhập lớn hơn. Ảnh mặt bằng có nút phóng to kèm chấm đánh dấu vị trí căn đang chọn.
- Template `article.html` nạp thêm `zoom.js`. Tăng `version` lên 2.6.0.

### Nội dung
- 2026-10-02 — `skysolis`: thay toàn bộ 27 ảnh bằng bản độ phân giải gốc (tới 1.865–2.048 px) để phóng to đọc được chữ trên mặt bằng; ảnh cũ 01–27 được thay bằng 28–54 (theo §5, không ghi đè ảnh đã xuất bản).

## Nội dung — 2026-10-02 — SkySOLIS
- **`skysolis`** (trước là bài khung `the-solis`): viết đầy đủ theo khung dự án 01–04 của Nam Mekong/Artisan Park (Prologue, Tổng quan, Chi tiết, Góc nhìn, SWOT + thang điểm 19 chỉ số, TB 4,11), 27 ảnh (tông ấm theo §8.4), dải `facts`, vị trí theo phút, thanh tỷ lệ cơ cấu sản phẩm, khối 360° chế độ mở tab mới. Chuyển `published`, thêm vào nhóm Trục Quốc Lộ 13.
- Đổi slug `the-solis` → `skysolis` (bài khung chưa có nội dung, noindex); đã thêm redirect 301 trong `data/redirects.json` và cập nhật menu/bài vùng `truc-quoc-lo-13`.
- `site.config.json` → `embedHosts`: thêm `360.skysolis.my` (Tú duyệt 2026-10-02; bài dùng chế độ mở tab mới).
- Trang công cụ `assets/tools/skysolis-bang-tinh/`: bảng tính chiết khấu & phương thức thanh toán của SkySOLIS (HTML tĩnh do Tú cung cấp; tách 4 ảnh Base64 thành WebP, gắn `noindex`). Bài dẫn tới trang này bằng liên kết mở tab mới.
- `nam-mekong-grand-plaza`: thêm thẻ "Bảng tính thanh toán" trong mục 🎁 Chính Sách Nổi Bật, dẫn tới trang công cụ `assets/tools/nam-mekong-bang-tinh/` (HTML tĩnh do Tú cung cấp: chọn tòa/tầng/căn, 5 phương thức thanh toán; tách 26 ảnh Base64 thành WebP, file từ 5,1 MB còn khoảng 76 KB + ảnh tải khi cần, gắn `noindex`).

## [2.3.1] — 2026-10-01 — Sửa khối 360° bị lỗi khi nhúng
- **Sửa lỗi:** trang 3D của Tech3Art tự báo "This page couldn't load" khi chạy trong khung nhúng. Nam Mekong chuyển sang **chế độ mở tab mới** (`data-mode="link"`): ảnh nền + 4 liên kết, luôn chạy được. Cơ chế nhúng vẫn giữ sẵn; bật lại bằng cách xóa `data-mode="link"` khi bên Tech3Art xử lý xong.
- Bỏ thuộc tính `sandbox` của iframe (host đã duyệt; sandbox dễ làm hỏng ứng dụng 3D). Build kiểm tra host cả với nút `p-360-play`.

## [2.3.0] — 2026-10-01 — Khối tham quan 360° / mặt bằng nhúng
- **Khối `.p-360`**: tab (Tổng quan 3D · Mặt bằng tầng · Layout điển hình · Nội thất căn hộ) + ảnh nền + nút "Bắt đầu tham quan 360°". iframe chỉ được tạo khi người đọc bấm nên trang vẫn nhẹ; luôn có nút "Mở toàn màn hình ↗". Không có JS thì các tab là liên kết mở tab mới.
- **Chốt chặn:** chỉ nhúng host trong `embedHosts` (`site.config.json`, hiện có `360nmkbd.tech3art.com`). Build báo lỗi nếu nội dung có host khác hoặc viết tay `<iframe>`. iframe có `sandbox`.
- Xuất PDF và in ẩn khối này.

### Nội dung
- 2026-10-01 — `nam-mekong-grand-plaza`: thêm ảnh bản đồ vị trí dự án (vòng xoay WTC) vào mục 📍 Vị Trí; ảnh được làm nét 2x, tông ấm 70% theo §8.4.
- 2026-10-01 — **Đồng bộ từ CamNangBDS v64** (đối chiếu từng bài, kho giờ khớp v64 ở cả 180 bài, trừ Nam Mekong và Artisan là bản nâng cấp mới hơn): thêm **16 bài khung** (Sora Gardens 1–3; Midori The View / The Glory / The Ten / The Nest; Palm Height / Residence / River; Blanca City: Casa Villa, Beacon Tower, Beachtro Tower, Cụm B1·B2·B3, Cụm B5·B6·B7; nhà phát triển Hướng Việt); cập nhật 4 bài hub (Garden City, Midori Park, Palm City — đổi chủ đầu tư thành Hướng Việt, Blanca City — thêm mục "Các Phân Khu") và trang Becamex Tokyu; sửa nhãn trên 2 trang vùng (Rạch Chiếc – Trường Thọ, KHCN cao TPM Bình Dương); menu Chương 5 thêm Hướng Việt (16 chủ đầu tư); trang chủ: đoạn giới thiệu "05 giá trị cốt lõi" và nhãn tác giả "ERA Vietnam · Project Director". Bài cũ `sora-gardens` v64 không còn dẫn tới, vẫn giữ nguyên trong kho.
- 2026-10-01 — `nam-mekong-grand-plaza`: thêm thẻ "Website chủ đầu tư" (trang dự án trên nammekonggroup.vn, website chính thức của Tập đoàn Nam Mê Kông) trong mục 🏢 Nhà Phát Triển.
- 2026-10-01 — `nam-mekong-grand-plaza`: thêm mục "🧭 Tham Quan 360° — Mặt Bằng Tầng & Layout Căn Hộ" trong mục 02 Chi tiết dự án (trước Chính Sách Nổi Bật).

## [2.2.0] — 2026-10-01 — Bố cục máy tính cho mọi bài
- **Mọi trang bài** trên laptop (≥ 1100px) rộng hơn: một cột 860px (trước là 640px kiểu điện thoại).
- **Mục lục tự sinh** cho bài thường có ≥ 3 tiêu đề `p-h2` (52 bài): cột phải 1180px, mục đang đọc sáng lên, mục lục dài tự cuộn trong khung. Build tự gắn `id="h-N"` cho tiêu đề; không phải sửa nội dung bài.
- Trang dự án (Dự Án Chọn Lọc) luôn có cột phải: mục lục (nếu có) + khung liên hệ Gọi / Zalo.
- Trang chủ giữ nguyên (đã là bố cục máy tính 1100px). Điện thoại không đổi.

## [2.1.1] — 2026-10-01 — Bố cục máy tính cho trang dự án
- **Sửa lỗi:** trên laptop trang bài vẫn là một cột hẹp 640px (kiểu ngăn kéo của bản gốc), hai bên trống. Từ 1100px trở lên, trang dự án (có đủ ≥ 3 mục 01–04) rộng 1180px: nội dung bên trái, **cột phải dính theo khi cuộn** gồm mục lục (đánh dấu mục đang đọc) và khung liên hệ Gọi / Zalo (nhóm Dự Án Chọn Lọc).
- Trên máy tính: ẩn thanh mục dạng viên thuốc và thanh CTA đáy (chỉ dùng cho điện thoại). Điện thoại và bài thường không đổi.
- Template bọc `#pBody` trong `.p-layout`; `build.mjs` sinh `<aside id="pAside">` và gắn `html.has-aside`.

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
