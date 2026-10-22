# ATLAS WORLD — BẢN ĐỒ CẤU TRÚC TRANG

> Mô tả bản v1.5.24 đang chạy tại `nguyenanhtu.vn/atlas/2026-q3/doc/`.
> Mỗi mục kèm **ý nghĩa đọc**: người đọc rút ra được gì, và không nên hiểu nhầm thành gì.
> Đọc cùng `ATLAS_WORLD_HANDOFF.md` (cấu trúc kỹ thuật) và `ATLAS_WORLD_DATA_SCOPE.md` (phạm vi dữ liệu).

---

## Bố cục tổng thể

Trang chia làm ba lớp:

```
LỚP 1 — PHẦN CHUNG (đọc trước khi chọn nước)
   Thanh chọn 17 quốc gia
   So sánh phân hạng thị trường — 17 nền kinh tế × 5 nhà cung cấp
   Snapshot Q3/2026 — trạng thái công bố GDP

LỚP 2 — PANEL TỪNG QUỐC GIA (17 panel, chọn một lần một)
   Nhóm 11 nước gốc: 15 mục
   Nhóm 6 nước mới:   8 mục

LỚP 3 — PHẦN CUỐI (dùng chung cho cả trang)
   Độ sâu thị trường vốn & cấu trúc nợ
   Nguồn macro quý III/2026
```

---

## LỚP 1 — Phần chung

### 1.1 Thanh chọn quốc gia

17 nút, chạy ngang, bấm một nút là đổi toàn bộ nội dung bên dưới. Không dùng JavaScript.

**Ý nghĩa đọc:** đây là bộ chọn, không phải xếp hạng. Thứ tự nút theo quy mô GDP và vai trò với thị trường Việt Nam, không phải theo mức độ hấp dẫn đầu tư.

### 1.2 So sánh phân hạng thị trường — 17 nền kinh tế × 5 nhà cung cấp

Bảng gập lại. Mỗi hàng một nước, mỗi cột một tổ chức xếp hạng thị trường: FTSE Russell, MSCI, S&P DJI, STOXX, Solactive.

**Ý nghĩa đọc:** cho biết các quỹ chỉ số toàn cầu đang xếp nước đó vào nhóm nào — Phát triển, Mới nổi, Mới nổi thứ cấp hay Cận biên. Quan trọng vì **các quỹ chỉ số bị ràng buộc bởi nhóm này**: một thị trường được nâng hạng thì dòng vốn thụ động có thể vào theo.

**Không nên hiểu nhầm:** đây không phải xếp hạng rủi ro, cũng không phải chấm điểm độ hấp dẫn. Năm nhà cung cấp dùng tiêu chí khác nhau nên xếp khác nhau là bình thường — ví dụ Hàn Quốc được FTSE và S&P DJI xếp Phát triển nhưng MSCI, STOXX, Solactive xếp Mới nổi.

### 1.3 Snapshot Q3/2026 — trạng thái công bố GDP

Hai bảng nối tiếp:

| Bảng | Nội dung | Ý nghĩa đọc |
|---|---|---|
| Bảng GDP | GDP quý III so cùng kỳ, trạng thái ACTUAL hay PENDING, ngày công bố, số quý II giữ lại, số lũy kế 9 tháng | Cho biết **nước nào đã có số thật, nước nào còn chờ**. Chỉ so sánh giữa các nước cùng trạng thái ACTUAL |
| Bảng CPI và lao động | Lạm phát và thất nghiệp mới nhất, kèm kỳ tham chiếu từng nước | Nhịp giá cả và việc làm hiện tại. **Mỗi nước một kỳ khác nhau** nên phải đọc cột "Kỳ" trước khi so |

**Vì sao tách ACTUAL và PENDING:** nếu gộp chung, người đọc sẽ so số quý III của Việt Nam với số quý II của Mỹ mà tưởng cùng kỳ. Nhãn trạng thái chặn lỗi đó.

---

## LỚP 2A — Panel 11 nước gốc

Việt Nam, Hoa Kỳ, Trung Quốc, Đức, Nhật Bản, Vương quốc Anh, Ấn Độ, Pháp, Nga, Ý, Canada.

| # | Mục | Ý nghĩa đọc |
|---|---|---|
| 1 | **Phân hạng thị trường cổ phiếu** | Bản chi tiết của bảng 1.2 cho riêng nước này, kèm liên kết tài liệu gốc từng nhà cung cấp |
| 2 | **Các quỹ ETF đầu tư vào Việt Nam** *(chỉ Việt Nam)* | Chia ETF nước ngoài và ETF trong nước. Quy mô quỹ và chỉ số tham chiếu. Cho biết **kênh nào đang dẫn vốn ngoại vào chứng khoán Việt** |
| 3 | **Quỹ và nhà đầu tư trực tiếp** *(chỉ Việt Nam)* | Các quỹ rót vốn thẳng vào doanh nghiệp, kèm lịch sử thương vụ đã công bố |
| 4 | **Đầu tư quốc tế — thống kê & xếp hạng nguồn công bố** | Khối lớn nhất, xem chi tiết bên dưới |
| 5 | **Tín nhiệm quốc gia** | Moody's, S&P, Fitch, thêm R&I cho Việt Nam. Ngưỡng hạng đầu tư là Baa3 hoặc BBB− |
| 6 | **Current Economic Pulse** | Nhịp kinh tế hiện tại, tách khỏi lớp số liệu năm |
| 7 | **Chỉ số chính** | GDP danh nghĩa, GDP bình quân đầu người, tăng trưởng GDP thực |
| 8 | **Vĩ mô & ổn định** | Lạm phát, thất nghiệp, GNI đầu người, đô thị hóa |
| 9 | **Con người & phát triển** | Xếp hạng dân số, tỷ trọng tuổi lao động, tuổi trung vị, xếp hạng hạnh phúc |
| 10 | **Vốn & Đầu tư** | Năm nhánh vốn, xem chi tiết bên dưới |
| 11 | **FDI — cùng kỳ để so sánh** | FDI các nước cùng năm, để so sánh ngang hàng |
| 12 | **Capital Intelligence — ETF Anchor** | Một quỹ ETF tiêu biểu làm mẫu kiểm thử phương pháp. **Không phải khuyến nghị đầu tư** |
| 13 | **5 ngành kinh tế trong danh sách** | Tỷ trọng ngành trong GDP |
| 14 | **5 nhóm xuất khẩu trong danh sách** | Tỷ trọng nhóm hàng trong tổng xuất khẩu |
| 15 | **So sánh với quốc gia khác** | 16 bảng gập, so nước đang xem với từng nước còn lại |

### Chi tiết mục 4 — Đầu tư quốc tế

| Phần | Ý nghĩa đọc |
|---|---|
| Khảo sát ý định đầu tư Kearney | Thứ hạng theo **khảo sát ý kiến lãnh đạo doanh nghiệp**, là chỉ báo tâm lý chứ không phải số vốn thật |
| Dòng vốn — đối chiếu 2024 và 2025 | Sáu chỉ tiêu dòng vốn cùng nguồn World Bank, hai năm liền kề để thấy xu hướng |
| *(gập)* Hạ tầng PPI và viện trợ | Vốn cam kết dự án có tư nhân tham gia. Là **cam kết tại thời điểm ký**, không phải tiền đã giải ngân |
| *(gập)* Chuỗi nguồn 2020–2025 | Sáu năm liên tục của từng chỉ tiêu, để nhìn xu hướng dài hơn |
| *(gập)* So sánh 17 nền kinh tế cùng năm 2025 | Bốn bảng xếp các nước cạnh nhau: FDI ròng vào, FDI/GDP, danh mục cổ phiếu, danh mục ròng |
| *(gập)* Công bố của từng quỹ | Số liệu cấp quỹ. **Không cộng gộp thành tổng quốc gia** |
| *(gập)* Phạm vi chưa đủ dữ liệu | Nói thẳng mục nào chưa có số và vì sao |

### Chi tiết mục 10 — Vốn & Đầu tư

Năm nhánh, cố ý tách riêng vì **có thể giao nhau, không được cộng lại**:

| Nhánh | Nội dung |
|---|---|
| 1. Tổng quan vốn quốc tế | FDI, đầu tư danh mục, đầu tư khác |
| 2. Các kênh đầu tư chuyên sâu | VC, PE, ETF, quỹ chủ động, private credit |
| 3. Lĩnh vực nhận vốn | Vốn phân theo ngành |
| 4. Nhà đầu tư & xuất xứ vốn | Ai rót và rót từ đâu |
| 5. Tài chính phát triển & kiều hối | ODA, viện trợ, kiều hối |

Cuối mục có khối **"Dữ liệu cần bổ sung · 18 chỉ tiêu"** — liệt kê các ô chưa có số kèm lý do.

---

## LỚP 2B — Panel 6 nước mới

Hàn Quốc, Thái Lan, Indonesia, Đài Loan, Singapore, Malaysia.

| # | Mục | Ý nghĩa đọc |
|---|---|---|
| 1 | Phân hạng thị trường cổ phiếu | Như nhóm trên |
| 2 | Đầu tư quốc tế — thống kê dòng vốn | Gọn hơn nhóm 11 nước |
| 3 | Tín nhiệm quốc gia | Như nhóm trên |
| 4 | Kinh tế và dân số — số liệu năm | Gộp ba mục 7, 8, 9 của nhóm trên vào một |
| 5 | Cơ cấu sản xuất | Tương đương mục 13 |
| 6 | Thương mại, tài chính và dự trữ | Mục mới, nhóm 11 nước chưa có |
| 7 | ETF, quỹ chủ động và đầu tư trực tiếp | Gọn hơn |
| 8 | So sánh cùng kỳ 2025 | Tương đương mục 15 nhưng rút gọn |

---

## LỚP 3 — Phần cuối

| Mục | Ý nghĩa đọc |
|---|---|
| **Độ sâu thị trường vốn & cấu trúc nợ** | Hai mục con: tỷ trọng tín dụng và nợ công toàn cầu; nợ nước ngoài. Đây là **lớp năng lực thị trường và bảng cân đối**, chưa đưa vào điểm số nào |
| **Q3/2026 — nguồn macro** | Liệt kê cơ quan thống kê đã dùng cho từng nước, để người đọc tự đối chiếu |

---

## Ba điều cần biết khi đọc bất kỳ phần nào

1. **Luôn đọc cột "Kỳ" trước khi so sánh.** Các nước công bố lệch nhau; Atlas giữ nguyên kỳ gốc thay vì ép về cùng một mốc.
2. **Phân hạng không phải điểm số.** Atlas không tự chấm điểm, không xếp hạng độ hấp dẫn đầu tư.
3. **Các nhánh vốn không cộng được.** Năm nhánh trong mục Vốn & Đầu tư có thể giao nhau; cộng lại sẽ tính trùng.

---

## Điểm chưa nhất quán, nên xử lý

**Hai nhóm quốc gia đang có cấu trúc khác nhau.** 11 nước gốc có 15 mục, 6 nước mới có 8 mục với tên gọi khác. Hệ quả:

- Người đọc chuyển từ Việt Nam sang Hàn Quốc sẽ thấy bố cục đổi hẳn.
- Mục "Thương mại, tài chính và dự trữ" chỉ có ở 6 nước mới; 11 nước gốc không có.
- Ba mục "Chỉ số chính", "Vĩ mô & ổn định", "Con người & phát triển" ở nhóm gốc bị gộp thành một ở nhóm mới.

**Hai hướng xử lý:** đưa 6 nước mới lên cấu trúc đầy đủ của nhóm gốc, hoặc rút cả 17 nước về một bộ mục chung gọn hơn. Hướng thứ hai ít việc hơn và trang sẽ dễ đọc hơn trên điện thoại.
