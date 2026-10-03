# Ấn phẩm theo kỳ — World Atlas & Nhật san

Mỗi kỳ là **một thư mục** trong `publications/atlas/` hoặc `publications/nhat-san/`.

Tên thư mục trở thành đường dẫn. Chỉ dùng chữ thường không dấu, số và dấu `-`.
Ví dụ: thư mục `2026-10-ky-01` sẽ có đường dẫn `nguyenanhtu.vn/atlas/2026-10-ky-01/`.

Trong thư mục cần có:

| File | Bắt buộc | Ghi chú |
|---|---|---|
| `info.txt` | ✔ | Xem mẫu bên dưới |
| `bia.jpg` (hoặc `.png` / `.webp`) | nên có | Ảnh bìa, dùng cho thư viện và khi chia sẻ Facebook/Zalo. Cạnh dài khoảng 1600–2000 px |
| `*.pdf` | một trong ba | Hiện nút "Tải PDF" |
| `trang-01.jpg`, `trang-02.jpg`… | một trong ba | Hiện từng trang ngay trên web, theo thứ tự tên file |
| một file `*.html` | một trong ba | Ấn phẩm dạng trang web tự chứa (ví dụ bản GPT xuất ra). Hiện nút "Đọc trực tuyến". Ảnh nhúng bên trong được tự tách thành file khi build |

Mẫu `info.txt`:
```
tieu-de: World Atlas — Kỳ 01: Dòng vốn FDI 2026
so: 01
ngay: 2026-10-05
mo-ta: Một đến hai câu mô tả, hiện dưới tiêu đề và khi chia sẻ.
trich-doan: (không bắt buộc) Đoạn trích hấp dẫn 2–3 câu về nội dung kỳ, hiện trong thư viện và đầu trang kỳ. Bỏ trống thì dùng mo-ta.
trang-thai: nhap
```

- `trang-thai: nhap` nghĩa là bản nháp. Trang vẫn được tạo để anh xem thử qua đường dẫn, nhưng **không hiện trong thư viện**, không vào Google, và có dải báo "BẢN NHÁP".
- `trang-thai: cong-bo` nghĩa là công bố. Kỳ hiện trong thư viện, vào sitemap, và chia sẻ được đầy đủ.
- Mỗi file không vượt quá 24 MB.

- Nhật san không hiện ảnh bìa trên web (`cover: false` trong `site.config.json`): thư viện hiện số kỳ, tiêu đề và `trich-doan`. File `bia.jpg` vẫn nên có vì dùng làm ảnh khi chia sẻ Facebook/Zalo.
