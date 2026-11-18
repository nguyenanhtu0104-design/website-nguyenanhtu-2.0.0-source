# NGUYENANHTU.VN - BẢN NÂNG CẤP VÒNG LÀM VIỆC
# 5 cải tiến miễn phí - Code để up lên GitHub

## Cấu trúc file trong bộ này:
- index-upgrade.html : Trang chủ cải tiến (giữ nguyên nội dung 5 chương, thêm Tìm kiếm + Lọc + Form PDF + Nút Zalo nổi + Sửa 79/80)
- pages/tpmbd.html : Trang đích Thành phố mới Bình Dương
- pages/thu-thiem.html : Trang đích Vùng Thủ Thiêm
- pages/gamuda.html : Trang đích DNA Gamuda Land
- assets/search-filter.js : Logic tìm kiếm + lọc CH04 (dùng chung)
- assets/lead-form.css : Style form nhận PDF + nút Zalo nổi
- assets/pixel-setup.html : Đoạn code gắn Meta Pixel + GA - dán vào <head>

## Cách up lên GitHub (giữ repo cũ):
1. Backup nhánh hiện tại
2. Copy index-upgrade.html -> đổi tên thành index.html (sau khi đã backup) HOẶC chỉ copy các block cần thiết
3. Copy thư mục pages/ và assets/ vào repo
4. Dán nội dung assets/pixel-setup.html vào <head> của index.html, thay YOUR_PIXEL_ID và YOUR_GA_ID
5. Commit + Push -> Vercel/Netlify/GitHub Pages tự deploy

## Lưu ý quan trọng:
- ĐÃ CHỐT SỐ LIỆU: 19 vùng - 79 dự án (thống nhất toàn web, không còn 80)
- Sun Hiệp Phước -> gắn vào Vùng 14 Đảo Hiệp Phước (ĐÃ SỬA - không thuộc Thành phố Đông Nam)
- The Aspira -> gắn vào Trục Mỹ Phước - Tân Vạn
- Form Nhận PDF hiện đang là demo: nối vào Google Form / Formspree / Zalo OA của bạn bằng cách thay action trong form
- Giọng văn: Advisor - Không quảng cáo - Không ép mua


## SỬA LỖI 18/11:
- Sun Hiệp Phước thuộc Đảo Hiệp Phước (Vùng 14), đảo đô thị trên sông Đồng Nai.
