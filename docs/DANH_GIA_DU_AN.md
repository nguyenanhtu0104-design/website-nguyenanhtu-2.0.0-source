# Bộ tiêu chí tự đánh giá dự án — Khung 2.0 (20/11/2026)

> **Hiện hành:** khung 2.0, 27 thẻ · 6 chủ đề · hồ sơ nhu cầu 5 câu. Nội dung và lý do từng thẻ nằm trong tài liệu duyệt "Bộ vấn đề đặt ra — phản biện và bản đề xuất". Nguyên tắc vận hành: PROJECT_RULES §18. Phần dưới là lịch sử khung 1.x, giữ để tham khảo.

# Bộ tiêu chí tự đánh giá dự án — Khung 1.2 (20/11/2026)

> **Chốt 20/11/2026 (Tú):** khách chỉ tự chấm điểm, trang không đưa nhận định tự động và không ghi tên tầng — màu là mã nội bộ. Các mục 2.1 và 2.7 bên dưới nay chỉ dùng trong email báo Tú và CRM (mức 2.7 "Đủ cơ sở" chỉ cần ≥ 75%). Đã bỏ hẳn: 2.2 nguồn nhận định, 2.3 trực giác, 2.6 phép thử hối tiếc. Câu hỏi chi tiết chờ duyệt nằm trong tài liệu "Bộ câu hỏi chi tiết — 9 thẻ".

Trang: `/danh-gia-du-an/` · Dữ liệu: `data/danh-gia/khung.json` (câu hỏi, trọng số khuyến nghị, lời nhận xét) và `data/danh-gia/du-an.json` (dữ kiện Bước 2 và điểm chuyên gia từng dự án). Sửa nội dung ở hai file này, không phải sửa mã.

## 1. Giữ nguyên từ bản đặc tả của Tú

- 9 thẻ, đúng thứ tự phễu tâm lý; mỗi thẻ 5 bước (Vấn đề · Dữ kiện · Tự trả lời · Mức quan trọng x1–x3 · Hài lòng 1–5).
- Mã màu ba tầng: xanh lá Phù hợp, vàng Niềm tin, xanh dương Logic. **Không hiện tên tầng khi đang chấm**, chỉ "lật bài" ở màn kết quả.
- Một bộ câu hỏi chung cho mọi người; nút Mua ở / Đầu tư / Tích sản chỉ gợi ý trọng số.
- Công thức: tổng = Σ(W×S) ÷ Σ(W×5); tỷ trọng tầng = ΣW tầng ÷ ΣW; Ở thực tính trên thẻ `live`+`both`, Đầu tư trên thẻ `invest`+`both`; tầng cao nhất → phong cách chủ đạo, thấp nhất → điểm mù.

## 2. Phần bổ sung trong khung 1.1 (chờ Tú duyệt từng mục)

1. **Điểm chặn (không bù trừ).** Thẻ chấm x3 mà hài lòng ≤ 2, hoặc thẻ pháp lý ≤ 2 dù trọng số nào, thì kết luận là "Chưa nên chốt" dù tổng điểm cao. Cơ sở: luật sàng lọc kết hợp (conjunctive rule) trong ra quyết định đa tiêu chí — điểm cao ở chỗ này không bù được rủi ro chết người ở chỗ khác.
2. **Nguồn của nhận định ở Bước 3** (Tự kiểm chứng · Theo CĐT/tư vấn · Cảm nhận) → **chỉ số tự kiểm chứng** = phần trọng số dựa trên dữ kiện khách tự xác minh. Cơ sở: chính nguyên tắc phân tầng nguồn §8.1 của Cẩm nang, áp cho người mua.
3. **Ghi trực giác trước, đối chiếu sau.** Trước khi chấm, khách ghi "đang nghiêng về mua bao nhiêu %". Cuối bài so với điểm có cấu trúc; lệch từ 20 điểm thì nêu rõ. Cơ sở: Mediating Assessments Protocol (Kahneman, Lovallo, Sibony) — đánh giá từng tiêu chí độc lập, trì hoãn phán đoán tổng thể.
4. **Điểm chuyên gia chỉ hiện sau khi khách chấm xong**, để khách không bị neo theo (hiệu ứng mỏ neo). So từng thẻ; lệch từ 1,5 điểm thì đánh dấu "lạc quan hơn / thận trọng hơn chuyên gia". Có thêm chỉ số "tương thích nếu dùng điểm chuyên gia với trọng số của bạn".
5. **Trọng số khuyến nghị của chuyên gia** cho từng mục tiêu vẽ thành vạch đứt trên biểu đồ ba tầng. Đề xuất (thẻ 1→9):
   - Mua ở: 3 3 3 2 3 1 2 1 2
   - Đầu tư: 3 1 3 3 1 3 1 3 3
   - Tích sản: 3 2 3 3 2 3 2 2 2
   Pháp lý luôn x3 ở mọi mục tiêu.
6. **Phép thử hối tiếc** cuối bài: "Giả sử 3 năm nữa bạn hối hận, lý do nhiều khả năng nhất là gì?" Cơ sở: pre-mortem (Gary Klein). Câu trả lời là insight quý nhất cho CRM.
7. **Bốn mức kết luận:** Chưa nên chốt (có điểm chặn) · Đủ cơ sở để ra quyết định (≥ 75% và tự kiểm chứng ≥ 50%) · Nghiêng về phù hợp, cần kiểm chứng thêm (≥ 60%) · Chưa phù hợp với tiêu chí của bạn.
8. **Phiên bản hoá khung** (`phienBan`) và lưu dữ liệu thô W/S/nguồn từng thẻ vào CRM, để định kỳ xem thẻ nào khách hay bỏ trống, hay coi nhẹ, hay lệch chuyên gia — căn cứ cải tiến câu hỏi.

Nền lý thuyết của ba tầng: tương ứng ba phương thức thuyết phục của Aristotle — Logos (Logic), Ethos (Niềm tin vào người làm), Pathos (Phù hợp, cảm xúc và bản sắc).

## 3. Điểm chuyên gia Nam Mekong Grand Plaza — bản nháp

Quy đổi từ Thang điểm 1–5 đã đăng trong bài (hồ sơ 9/2026), trung bình các chỉ số con, làm tròn 0,5. **Tú duyệt hoặc sửa**, rồi đặt `"duyet": true`.

| Thẻ | Điểm | Lấy từ |
|---|---|---|
| 1 Mục tiêu & nắm giữ | 4 | Quan trọng trong cấu trúc đầu tư 4,5 · Chính sách 3 |
| 2 Lối sống & di chuyển | 4,5 | Tiện ích 10 phút 4,5 · Kết nối 4,5 |
| 3 Pháp lý | 4 | Pháp lý an tâm 4 |
| 4 Chủ đầu tư | 4 | CĐT uy tín 4 |
| 5 Không gian | 4 | Lợi ích cư dân TB 4,07 |
| 6 Hạ tầng & quy hoạch | 4,5 | Vùng chức năng 4,5 · Hạ tầng 4 · Tiềm năng 4,5 |
| 7 Cộng đồng | 4 | Vận hành cộng đồng 3,5 · Dịch vụ cá nhân hoá 4 |
| 8 Thanh khoản | 4,5 | Mật độ dân 4 · Tài sản vận hành dòng tiền 4,5 |
| 9 Định giá & tài chính | 3 | Chính sách 3 |

## 4. Gửi báo cáo và CRM

- Xuất báo cáo bắt buộc gửi form (tên, SĐT/Zalo, email, ngân sách, đồng ý). Sau khi gửi mới mở nút tải PDF.
- Email: khách nhận báo cáo ngay; **ngày 3** tự gửi khách bài đọc bổ trợ điểm mù; Tú nhận email "Đánh giá dự án" kèm insight và kế hoạch chăm sóc, cùng tin WhatsApp; **ngày 7** tự nhắc Tú gọi lại.
- Zalo: Zalo cá nhân không có API (§17.5). Khách chọn Zalo thì Tú nhận tin nhắn soạn sẵn kèm link báo cáo để dán gửi.
- Google Sheet: dòng vào tab "Tất cả lead" như lead thường (chạy ngay với Apps Script hiện tại). Tab riêng **"Đánh giá dự án"** (ba tầng, điểm mù, điểm chặn, lệch chuyên gia, phép thử hối tiếc, ghi chú, dữ liệu thô, kế hoạch chăm sóc, dự án gợi ý) cần dán lại `google-apps-script/Code.gs` mới và triển khai lại.
- Dự án gợi ý: lấy 2 dự án cùng vùng trong `assets/lead/lead-data.json` (hoặc chọn tay ở trường `related`).

## 5. Thêm một dự án

Thêm một khoá vào `data/danh-gia/du-an.json` theo mẫu Nam Mekong: `ten`, `khuVuc`, `capNhat`, `the` (dữ kiện Bước 2 từng thẻ, chỉ số đã có trong bài hoặc hồ sơ), `chuyenGia` (điểm 1–5 từng thẻ + nhận xét). Build tự kiểm slug, số thẻ, điểm, liên kết.
