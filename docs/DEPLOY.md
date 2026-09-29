# Hướng dẫn đưa Cẩm Nang BĐS 2.0 lên nguyenanhtu.vn

Hướng dẫn viết cho người không làm kỹ thuật. Anh không cần gõ lệnh nào. Làm lần đầu mất khoảng 45–60 phút, chưa tính thời gian chờ tên miền. Các lần cập nhật sau chỉ mất khoảng 2 phút.

**Sơ đồ vận hành:**
```
Claude (viết + tích hợp bài) → gói update-*.zip → Anh chép vào thư mục trên máy
→ GitHub Desktop: Commit + Push → GitHub (kho lưu trữ gốc)
→ Cloudflare Pages tự build → nguyenanhtu.vn (khoảng 1–2 phút)
```

Cả ba dịch vụ đều **miễn phí** với quy mô Cẩm nang hiện tại.

> Giao diện của GitHub và Cloudflare thỉnh thoảng thay đổi tên nút. Nếu không thấy đúng chữ như dưới đây, hãy tìm nút có ý nghĩa tương đương, hoặc chụp màn hình gửi Claude để được chỉ tiếp.

---

## PHẦN A — GitHub: kho lưu trữ gốc (làm 1 lần)

### A1. Tạo tài khoản GitHub
1. Vào **https://github.com/signup**.
2. Nhập email, mật khẩu và username. Gợi ý username: `nguyenanhtu-bds` hoặc `nguyenanhtu`. Username sẽ nằm trong địa chỉ kho nên chọn ngắn gọn.
3. Xác minh email và chọn gói **Free**.
4. Nên bật xác thực 2 lớp: Settings → Password and authentication → Two-factor authentication.

### A2. Cài GitHub Desktop (ứng dụng có giao diện, không cần gõ lệnh)
1. Tải tại **https://desktop.github.com** (có bản cho Windows và macOS).
2. Mở ứng dụng → **Sign in to GitHub.com** → đăng nhập tài khoản vừa tạo → cho phép truy cập.

### A3. Đưa project lên GitHub
1. Giải nén file `CamNangBDS-2.0.0-source.zip` vào một thư mục cố định, ví dụ `Documents/camnang-bds`. **Không đổi tên file bên trong.**
2. Trong GitHub Desktop: **File → Add local repository…** → chọn thư mục `camnang-bds`.
3. Ứng dụng báo thư mục chưa phải repository → bấm **"create a repository"** → đặt Name `camnang-bds` → **Create repository**.
4. Bấm **Publish repository** (nút xanh phía trên):
   - Name: `camnang-bds`
   - **BỎ tick "Keep this code private"**. Kho để công khai giúp Claude đọc được bản mới nhất mà không cần mật khẩu. Nội dung vốn đã công khai trên website nên để public không có rủi ro.
   - Bấm **Publish repository** và chờ tải lên xong (khoảng 60 MB).
5. Kho của anh nằm ở `https://github.com/<username>/camnang-bds`. **Gửi đường link này cho Claude** để ghi vào README và PROJECT_RULES.

---

## PHẦN B — Cloudflare Pages: tự động build website (làm 1 lần)

### B1. Tạo tài khoản
Vào **https://dash.cloudflare.com/sign-up**, đăng ký bằng email và xác minh.

### B2. Tạo dự án Pages nối với GitHub
1. Menu trái: **Workers & Pages** → **Create** (hoặc "Create application").
2. Chọn thẻ **Pages** → **Connect to Git** (hoặc "Import an existing Git repository").
3. Chọn **GitHub** → cho phép Cloudflare truy cập → chọn repository **camnang-bds** → **Begin setup**.
4. Điền đúng như sau:

| Mục | Giá trị |
|---|---|
| Project name | `camnang-bds` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `node scripts/build.mjs` |
| Build output directory | `dist` |
| Environment variables | Thêm `NODE_VERSION` = `20` |

5. **Save and Deploy**. Sau khoảng 1–2 phút sẽ có địa chỉ tạm dạng `https://camnang-bds.pages.dev`. Mở thử, bấm vài bài, thử tìm kiếm.

---

## PHẦN C — Chuyển tên miền nguyenanhtu.vn sang bản 2.0 (làm 1 lần)

**Hiện trạng** (theo ảnh chụp DNS tại TenTen):
- Tên miền đăng ký tại **TenTen**, DNS do TenTen quản lý (`ns-b1/b2/b3.tenten.vn`).
- Bản ghi `@` loại A trỏ về `162.159.143.30` và `172.66.3.26`, kèm TXT `_cf-custom-hostname` và `_openai-site-verification`. Nghĩa là website hiện do **nền tảng của OpenAI (bản GPT dựng)** phục vụ.
- Không có bản ghi MX, nên tên miền **không dùng email**. Đổi nameserver không ảnh hưởng gì khác.

Làm theo **đúng thứ tự** dưới đây để website không bị gián đoạn: bản cũ vẫn chạy cho đến phút chuyển.

### C1. Kiểm tra bản mới trước
Mở địa chỉ tạm `https://camnang-bds.pages.dev` (có từ Phần B). Kiểm tra menu, vài bài, World Atlas, Nhật san. **Chưa ổn thì dừng ở đây**, bản cũ vẫn chạy bình thường.

### C2. Thêm tên miền vào Cloudflare
1. Dashboard Cloudflare → **Add a domain** (hoặc "Add site") → nhập `nguyenanhtu.vn` → chọn gói **Free**.
2. Cloudflare tự quét và chép các bản ghi hiện có (2 bản ghi A, 2 bản ghi TXT). **Giữ nguyên**, bấm **Continue**. Nhờ vậy sau khi đổi nameserver, website cũ vẫn chạy.
3. Cloudflare hiển thị **2 nameserver** dạng `xxx.ns.cloudflare.com`. Ghi lại.

### C3. Đổi nameserver tại TenTen
1. Đăng nhập **domain.tenten.vn** → tên miền `nguyenanhtu.vn` → mục **Đổi Name Server** (hoặc "Quản lý NS").
2. Thay 3 nameserver `ns-b*.tenten.vn` bằng **2 nameserver của Cloudflare** → Lưu.
3. Chờ Cloudflare gửi email báo tên miền **Active**. Thường mất vài giờ, có khi tới 24–48 giờ. Trong lúc chờ, website cũ vẫn chạy.
   - Không tìm thấy chỗ đổi thì gọi tổng đài TenTen: *"Nhờ đổi nameserver tên miền nguyenanhtu.vn sang 2 máy chủ: …"*.

### C4. Chuyển sang bản 2.0 (khoảng 5 phút)
1. Cloudflare → `nguyenanhtu.vn` → **DNS → Records** → **xóa 2 bản ghi A** của `@` (162.159.143.30 và 172.66.3.26).
2. **Workers & Pages** → `camnang-bds` → **Custom domains** → **Set up a custom domain** → nhập `nguyenanhtu.vn` → **Activate domain**. Cloudflare tự tạo bản ghi mới trỏ về bản 2.0.
3. Làm lại với `www.nguyenanhtu.vn`.
4. Chờ vài phút để có HTTPS, rồi mở **https://nguyenanhtu.vn**. Thấy chữ "CẨM NANG BĐS v2.0.0" ở cuối trang chủ là đã chuyển xong.
5. Sau khi chạy ổn khoảng 1 tuần, có thể xóa TXT `_cf-custom-hostname`. Giữ `_openai-site-verification` cũng không sao.

> Từ lúc này, **không để GPT đưa website lên nền tảng của OpenAI nữa**. Mọi cập nhật đều đi qua GitHub, xem Phần E.

---

## PHẦN D — Kiểm tra sau khi lên sóng (làm 1 lần)

1. **Trang chủ:** mở menu, tìm kiếm, bấm bài, nút ✕, nút Back của trình duyệt, nút 🔗 chia sẻ, nút 📥 PDF.
2. **Chia sẻ Facebook:** vào **https://developers.facebook.com/tools/debug/** → dán `https://nguyenanhtu.vn/cam-nang/the-marq/` → **Debug** → phải thấy ảnh, tiêu đề và mô tả của bài. Nếu thấy thông tin cũ, bấm **Scrape Again**.
3. **Zalo:** gửi link bài vào "Cloud của tôi" để xem khung xem trước.
4. **Google:** vào **https://search.google.com/search-console** → Add property → chọn **Domain** → nhập `nguyenanhtu.vn` → xác minh (Cloudflare có nút tự thêm bản ghi TXT) → mục Sitemaps → gửi `sitemap.xml`.

---

## PHẦN E — Cập nhật hằng ngày (khoảng 2 phút)

1. Trong Project "Cẩm Nang BĐS" trên Claude, mở **chat mới**, gửi nội dung và ảnh, nói: *"Thêm bài này vào Cẩm nang"*.
2. Claude lấy bản mới nhất từ GitHub, viết và tích hợp bài, chạy kiểm tra, rồi gửi lại file **`update-….zip`**.
3. Giải nén `update-….zip` **đè vào** thư mục `camnang-bds` trên máy. Nếu máy hỏi, chọn "Thay thế tất cả / Replace".
   - Nếu trong gói có file `DELETED_FILES.txt`: xóa các file được liệt kê trong đó, rồi xóa luôn `DELETED_FILES.txt`.
4. Mở GitHub Desktop, danh sách file thay đổi hiện ở cột trái. Ô **Summary** ghi ngắn gọn, ví dụ `Thêm bài Eaton Park` → **Commit to main** → **Push origin**.
5. Chờ 1–2 phút, bài xuất hiện trên `nguyenanhtu.vn`. Nếu Cloudflare báo build lỗi (có email), gửi ảnh chụp lỗi cho Claude. Website **vẫn giữ bản cũ đang chạy** nên người đọc không bị ảnh hưởng.

**Đăng kỳ World Atlas / Nhật san (không cần AI):**
1. Trong thư mục `camnang-bds` trên máy, tạo thư mục kỳ mới, ví dụ `publications/atlas/2026-10-ky-01/`. Chép vào đó `info.txt`, `bia.jpg`, và file nội dung (PDF, ảnh trang, hoặc file `.html` GPT xuất ra). Mẫu `info.txt` có trong `publications/README.md`.
2. Để `trang-thai: nhap` → GitHub Desktop: **Commit** + **Push** → mở `nguyenanhtu.vn/atlas/2026-10-ky-01/` xem thử. Link này chỉ ai có mới xem được.
3. Ưng ý thì đổi thành `trang-thai: cong-bo` → **Commit** + **Push**. Kỳ mới hiện trong thư viện.

**Hoàn tác:** GitHub Desktop → thẻ **History** → chuột phải vào commit lỗi → **Revert changes in commit** → Push origin.

**Dùng ChatGPT hoặc AI khác:** trên GitHub, vào repo → **Code → Download ZIP** → gửi file zip kèm yêu cầu *"Đọc PROJECT_RULES.md trước"*. Nhận lại file đã sửa và chép đè như bước 3–4.

---

## Phụ lục — Chạy thử trên máy (tùy chọn, dành cho người kỹ thuật)
```bash
node scripts/build.mjs                          # cần Node ≥ 18
python3 -m http.server 8080 -d dist             # mở http://localhost:8080
pip install Pillow playwright && python3 -m playwright install chromium
python3 tests/smoke.py                          # kiểm thử tự động
```
