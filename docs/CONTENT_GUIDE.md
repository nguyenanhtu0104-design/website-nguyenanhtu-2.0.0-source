# Hướng dẫn thêm / sửa bài — Cẩm Nang BĐS 2.0

Tài liệu dành cho AI thực hiện (và cho Tú tham khảo). Nguyên tắc gốc nằm ở `PROJECT_RULES.md`. File này là hướng dẫn thao tác cụ thể.

## 1. Thêm bài mới

```bash
git clone --depth 1 https://github.com/nguyenanhtu0104-design/website-nguyenanhtu-2.0.0-source.git  &&  cd website-nguyenanhtu-2.0.0-source

# (a) Tạo slug + metadata + file khung, gắn vào menu
node scripts/new-article.mjs --title "Eaton Park" --category du-an-chon-loc \
     --parent vung-rach-chiec-truong-tho --nav --star --subtitle "Gamuda Land · An Phú"
#   Bài chiến lược:  --category chien-luoc-quy-hoach --parent chien-luoc-quy-hoach
#   Chủ đầu tư:      --category nha-phat-trien --nav --icon "🇲🇾"

# (b) Viết nội dung: content/articles/<slug>.html (xem §3)
# (c) Ảnh (đã xử lý tông ấm/xóa logo nếu cần)
python3 scripts/images.py add <slug> phoi-canh.jpg mat-bang.jpg     # in ra thẻ <img data-img=…>
python3 scripts/images.py og <slug>                                 # ảnh chia sẻ 1200×630
# (d) Điền description / seoDescription / searchKeywords trong data/articles.json
# (e) Liên kết từ bài cha (vd khối project-hub trong bài vùng) nếu cần
# (f) Kiểm tra & đóng gói
node scripts/build.mjs          # phải báo 0 lỗi
bash scripts/make-update.sh     # → update-YYYYMMDD-HHMM.zip giao cho Tú
```

`new-article.mjs` tự làm các việc sau:
- Với dự án có `--parent` là một vùng ở chương 4, bài được thêm thành chip dưới vùng đó (`--star` để gắn ⭐).
- Với chương khác, bài được thêm thành một dòng cuối chương.
- Khi cần đổi thứ tự hiển thị, sửa tay `data/categories.json`.
- Số đếm trong `badge` của chương phải **cập nhật tay**.

## 2. Sửa bài có sẵn
1. Tìm bài: tra `slug` trong `data/articles.json`. Bài cũ từ v57 có thể tra bằng `legacy.panelId`, ví dụ `"panelId": "marq"`.
2. Sửa `content/articles/<slug>.html` và/hoặc metadata. Cập nhật `updatedDate`.
3. Muốn chuyển bài "đang cập nhật" thành bài đầy đủ: thay nội dung và đổi `status: "stub"` thành `"published"`.
4. Muốn gỡ bài: đổi thành `"archived"` và xóa khỏi `categories.json`. **Không xóa file.**
5. `node scripts/build.mjs`, rồi ghi `CHANGELOG.md`, rồi `bash scripts/make-update.sh`.

## 3. Mẫu HTML nội dung

```html
<img data-img="eaton-park/01" alt="Phối cảnh Eaton Park" style="width:100%;display:block;border-radius:6px">
<p style="font-size:11px;color:var(--muted);font-style:italic;text-align:center;margin:6px 0 18px">Phối cảnh tổng thể — nguồn: Gamuda Land</p>
<div class="zone-badge zone-priority">⭐ Rạch Chiếc · Trường Thọ</div>
<h1 class="p-h1">Eaton Park<br><em style="font-size:.58em;color:#b05040">— Prologue một dòng</em></h1>
<p class="p-lead">Đoạn dẫn 2–3 câu.</p>

<div class="knums">
  <div class="knum"><div class="knum-n">3,8<span style="font-size:14px">ha</span></div><div class="knum-l">Quy mô</div></div>
</div>

<p class="p-h2">📍 Tổng Quan Dự Án</p>
<p class="p-p">Nội dung…</p>

<div class="p-grid">
  <div class="p-card"><strong>Tiêu đề thẻ</strong><p>Nội dung thẻ</p></div>
</div>

<div class="p-call"><div class="p-call-lbl">💡 Góc nhìn</div><p>Nhận định…</p></div>

<!-- Liên kết tới bài khác -->
<div class="project-hub">
  <a href="/cam-nang/gamuda-land/" class="xl-b proj-row"><div class="proj-row-ico">🇲🇾</div><div class="proj-row-name">Gamuda Land</div><div class="proj-row-tag">Chủ đầu tư</div><div class="proj-row-arrow">→</div></a>
</div>
Trong đoạn văn: <a href="/cam-nang/vung-loi-thu-thiem/" class="xl-i"><strong>Vùng Thủ Thiêm</strong></a>
```

Muốn tham khảo cách trình bày thực tế, mở các bài mẫu: `content/articles/the-marq.html` (dự án), `vung-loi-thu-thiem.html` (vùng), `gamuda-land.html` (chủ đầu tư), `phap-luat-bds.html` (FAQ tương tác).

## 4. Lỗi build thường gặp

| Thông báo | Cách sửa |
|---|---|
| `link hỏng tới /cam-nang/x/` | Sai slug. Tra lại trong `articles.json`. |
| `ảnh "x/NN" không có trong data/images.json` | Chưa chạy `images.py add`, hoặc gõ sai khóa. |
| `nội dung chứa ảnh Base64` | Bị cấm. Lưu ảnh ra file rồi `images.py add`. |
| `còn openPanel()` | Thay bằng `<a href="/cam-nang/slug/" class="xl-b …">`. |
| `slug trùng` | Đặt `--slug` khác. |
| Cảnh báo `thiếu ảnh OG` | `python3 scripts/images.py og <slug>`. |

## 5. Đăng kỳ World Atlas / Nhật san (Tú tự làm — không cần AI)

Xem hướng dẫn chi tiết trong `publications/README.md`. Tóm tắt:

1. Tạo thư mục `publications/atlas/<ten-ky>/` (hoặc `publications/nhat-san/<ten-ky>/`).
2. Bỏ vào thư mục: `info.txt`, `bia.jpg`, và nội dung (PDF, ảnh `trang-01.jpg`… hoặc một file `.html`).
3. Để `trang-thai: nhap`, đẩy lên GitHub, rồi mở `nguyenanhtu.vn/atlas/<ten-ky>/` xem thử.
4. Ưng ý thì đổi thành `trang-thai: cong-bo` và đẩy lên lần nữa.
