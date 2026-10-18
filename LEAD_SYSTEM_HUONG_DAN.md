# Hệ thống nhận lead, gửi tài liệu, đo mức độ quan tâm (v1)

## Gói này gồm gì
| File | Việc làm |
|---|---|
| `assets/lead/lead.js`, `lead.css` | Banner cookie, form "Nhận tài liệu", tracking, chấm điểm |
| `assets/lead/lead-data.json` | **Nơi duy nhất bạn điền**: mã GA4, Clarity, Zalo, tài liệu và link của từng dự án |
| `functions/api/lead.js` | Nhận form, gửi email cho khách, báo cho bạn, ghi Google Sheet |
| `google-apps-script/Code.gs` | Mã dán vào Google Sheet để nhận lead |
| `chinh-sach-bao-mat/index.html` | Trang chính sách bảo mật và cookie (bản nháp) |

## Cài đặt (làm một lần)

### Bước 1. Google Sheet nhận lead
1. Tạo Google Sheet mới, đặt tên "Leads website".
2. Menu **Tiện ích mở rộng > Apps Script**, xoá nội dung cũ, dán toàn bộ `Code.gs`.
3. Đổi dòng `SECRET` thành một chuỗi dài bất kỳ, ghi lại chuỗi này.
4. Bấm **Triển khai > Triển khai mới > Loại: Ứng dụng web**. Thực thi bằng: **Tôi**. Người có quyền truy cập: **Bất kỳ ai**. Bấm Triển khai, cấp quyền, rồi sao chép **địa chỉ Web app** (kết thúc bằng `/exec`).

### Bước 2. Resend (gửi email tự động)
1. Tạo tài khoản tại resend.com, vào **Domains > Add Domain**, nhập `nguyenanhtu.vn`.
2. Resend hiển thị vài dòng DNS. Thêm đúng các dòng đó vào Cloudflare (DNS của tên miền), chờ trạng thái **Verified**.
3. Vào **API Keys > Create API Key**, sao chép khoá.

### Bước 3. Cloudflare Pages
Vào project `website-nguyenanhtu-2-0-0-source` > **Settings > Variables and Secrets**, thêm:

| Tên | Giá trị |
|---|---|
| `RESEND_API_KEY` | khoá ở bước 2 (loại Secret) |
| `MAIL_FROM` | `Nguyễn Anh Tú <lead@nguyenanhtu.vn>` |
| `WHATSAPP_PHONE` | (tùy chọn) số WhatsApp nhận báo lead, dạng +84978618149 |
| `WHATSAPP_APIKEY` | (tùy chọn) mã nhận từ CallMeBot: nhắn "I allow callmebot to send me messages" tới +34 644 51 95 23 trên WhatsApp |
| `NOTIFY_TO` | email bạn muốn nhận thông báo lead |
| `SHEET_WEBHOOK_URL` | địa chỉ Web app ở bước 1 |
| `SHEET_SECRET` | chuỗi `SECRET` ở bước 1 (loại Secret) |

### Bước 4. Điền `lead-data.json`
- `settings.ga4`: mã đo lường GA4 (dạng `G-XXXXXXX`). `settings.clarity`: mã Clarity. `settings.zaloPhone`: số Zalo của bạn.
- Mỗi dự án: điền `url` (đường dẫn trang dự án), `docs.bang-tinh.url`, `docs.tong-quan.url`, `video` (nếu có), `areaArticle` (bài phân tích vùng), `region` (tên vùng, ví dụ `long-an`).
- **2 dự án tham khảo** tự lấy từ các dự án cùng `region` và có `ready: true`. Muốn chọn tay thì điền `related` bằng mã dự án.
- Ô nào để trống thì tự ẩn khỏi form và email, không gửi link hỏng. Pháp lý không có trong hệ thống.

### Bước 5. Gắn vào trang dự án
Trước `</body>` của trang dự án:
```html
<meta name="lead-project" content="nam-mekong-grand-plaza">
<link rel="stylesheet" href="/assets/lead/lead.css">
<script src="/assets/lead/lead.js" defer></script>
```
Nút mở form (đặt ở thanh CTA): `<button type="button" data-lead-open>Nhận tài liệu</button>`
Link ở chân trang: `<a href="#" data-cookie-settings>Cài đặt cookie</a>`

### Bước 6. Trang bảng tính gửi kèm phương án của khách
Trên trang bảng tính, đánh dấu các ô để hệ thống đọc được (làm một lần cho mỗi bảng tính):
- Ô nhập: `data-lead-input="gia" data-lead-label="Giá căn"` (khoá `gia` là tên bất kỳ, không trùng nhau)
- Ô kết quả: `data-lead-result data-lead-label="Trả hàng tháng"`

Khi có số liệu, form tự hiện ô tick "Gửi kèm phương án tôi vừa tính". Khách tick thì email có bảng tóm tắt và nút "Mở lại bảng tính của bạn" (điền sẵn số). Không tick thì gửi bảng chuẩn. Bạn nhận phương án trong email "Lead mới" và cột **Phương án khách tính** trong Sheet, cộng thêm 25 điểm.

## Kiểm tra sau khi đưa lên
1. Mở trang dự án ở cửa sổ ẩn danh: banner cookie hiện, **chưa** có Google Analytics chạy cho tới khi bấm đồng ý.
2. Bấm Nhận tài liệu, điền thử bằng số của bạn, chọn **Email**: email tới hộp thư thử, bạn nhận email "Lead mới", Google Sheet có thêm một dòng.
3. Thử lại, chọn **Zalo**: chỉ bạn nhận email "Lead mới" kèm tin nhắn Zalo dán sẵn.

## Đọc mức độ quan tâm
- Cột **Điểm / Mức độ** trong Google Sheet: Nóng từ 60 điểm, Ấm từ 30, còn lại Mới.
- Điểm: gửi form 30, mở link tài liệu 20, quay lại lần 2 trở đi 20, xem từ 2 dự án 15, bấm Zalo hoặc gọi 15, cuộn hết trang 10.
- Khách chưa đồng ý cookie phân tích thì điểm là 0. Đây là đúng theo thiết kế.
- Trong GA4, mỗi lượt khách mở link trong email là sự kiện `lead_link_open`, kèm mã lead (cột **Mã lead** trong Sheet) để biết ai quan tâm gì.

## Cần xử lý trước khi chạy thật
- Trang **Chính sách bảo mật** là bản nháp. Điền email, số Zalo ở mục 8 và nhờ người có chuyên môn pháp lý xem lại trước khi thu số điện thoại thật.
- Link tài liệu dạng PDF tải trực tiếp thì không đo được lượt mở, chỉ đo được khi tài liệu nằm trên trang của site.
