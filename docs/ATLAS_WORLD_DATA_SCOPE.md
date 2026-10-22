# ATLAS WORLD — PHẠM VI DỮ LIỆU VÀ CÁC Ô CÒN TRỐNG

> Tài liệu này phân loại từng chỉ tiêu của Atlas World theo khả năng lấy được dữ liệu, theo nguyên tắc Tú duyệt ngày 22/10/2026.
> Đọc cùng `ATLAS_WORLD_HANDOFF.md` và `PROJECT_RULES.md`.

---

## 1. Nguyên tắc phạm vi (Tú duyệt 22/10/2026)

Thay cho cách làm cũ — chờ đủ dữ liệu tổ chức mới công bố bất cứ thứ gì — Atlas áp dụng ba mức:

| Nhóm chỉ tiêu | Nguyên tắc |
|---|---|
| **Chỉ số cơ bản** (GDP, dân số, nợ quốc gia, lạm phát, lao động) | Lấy đủ. Nguồn chính thức, hoặc thông cáo tổng hợp uy tín. Đây là số liệu công khai, không có lý do để trống. |
| **Vốn đầu tư — mức tổng** | Lấy **số tổng** và **tỷ trọng theo loại vốn**. Phải cùng khái niệm, cùng kỳ, so sánh được giữa các nước. |
| **Vốn đầu tư — mức chi tiết** (quỹ nào, ngành nào, nước nào rót vốn) | Chỉ lấy **tối đa 5 mục có tỷ trọng cao nhất**. Ghi rõ đây là mẫu, không phải danh sách đầy đủ. |

**Hệ quả quan trọng:** vì mức chi tiết được công bố rõ là "top 5", nó không còn giả vờ là tổng quốc gia. Nhờ vậy không vi phạm nguyên tắc chống so sánh sai của `Capital_Methodology` — thứ bị cấm là **cộng vài mảnh rời rồi gọi đó là tổng**, chứ không phải việc trình bày một mẫu có nhãn trung thực.

---

## 2. Nhóm A — Lấy được ngay, dữ liệu đã có sẵn trong kho

Đây là phát hiện đáng chú ý nhất khi rà soát: **một số chỉ tiêu đang hiện "Chưa có dữ liệu" trong mục Vốn & Đầu tư, nhưng số liệu đã nằm sẵn trong file nguồn World Bank Tú tải về ngày 21/10/2026.** Hai mục này chưa được nối với nhau.

| Chỉ tiêu | Mã World Bank | Độ phủ trong file đã có |
|---|---|---|
| Đầu tư danh mục ròng | `BN.KLT.PTXL.CD` | **11/11 nước** có số 2025 |
| Đầu tư danh mục: cổ phiếu, dòng vào ròng | `BX.PEF.TOTL.CD.WD` | **10/11 nước** có số 2025 (thiếu Việt Nam) |
| Kiều hối nhận được | `BX.TRF.PWKR.CD.DT` | **10/11 nước** có số 2025 (thiếu Việt Nam) |

**Việc cần làm:** nối dữ liệu có sẵn vào các ô `PORT_EQ_FLOW`, `PORT_DEBT_FLOW`, `REMITTANCES`. Không cần tra cứu thêm, không cần nguồn mới.

**Riêng Việt Nam:** World Bank không có Việt Nam trong hai chuỗi cổ phiếu và kiều hối. Kiều hối Việt Nam được Ngân hàng Nhà nước và Ủy ban Nhà nước về người Việt Nam ở nước ngoài công bố hằng năm — lấy từ đó, ghi rõ nguồn khác với 10 nước còn lại và **không xếp hạng chung**.

---

## 3. Nhóm B — Lấy được từ nguồn chính thức, cần tra thêm

Số tổng, công khai, miễn phí. Chỉ cần công sức tra cứu.

| Chỉ tiêu | Nguồn | Ghi chú |
|---|---|---|
| Đầu tư khác (vay, tiền gửi, tín dụng thương mại) | IMF Balance of Payments, mục Other Investment | Cùng khung BoP với FDI và danh mục nên so sánh được |
| Nợ nước ngoài/GDP | Suy từ `EXTERNAL_DEBT_USD` chia GDP, cả hai đều đã có | Chỉ có 3/11 nước vì World Bank IDS chỉ theo dõi nước đi vay |
| ODA — viện trợ và vốn vay ưu đãi | OECD DAC, bảng Table 2a | Chỉ áp dụng cho nước nhận viện trợ. Các nước phát triển để trống là đúng bản chất |
| Vốn cam kết hạ tầng (PPI) | World Bank PPI Database | Đã có 2–4 nước trong file. Bản chất chỉ có ở nước đang phát triển |

**Lưu ý về ODA và PPI:** các chỉ tiêu này **trống là đúng** với Hoa Kỳ, Đức, Nhật, Anh, Pháp, Ý, Canada — họ là nước cấp viện trợ, không phải nước nhận. Nên ghi "Không áp dụng" thay vì "Chưa có dữ liệu", để người đọc không hiểu nhầm là thiếu sót.

---

## 4. Nhóm C — Chỉ lấy dạng top 5 theo nguyên tắc mới

Không có tổng quốc gia miễn phí, nhưng lấy được 5 mục lớn nhất từ nguồn chính thức.

| Chỉ tiêu | Nguồn cho top 5 | Phạm vi khả thi |
|---|---|---|
| Vốn theo lĩnh vực | Bộ Tài chính / Cục Đầu tư nước ngoài công bố FDI theo ngành | Việt Nam: đủ. Nước khác: tùy cơ quan thống kê |
| Vốn theo quốc gia xuất xứ | Cùng nguồn trên, bảng FDI theo đối tác | Việt Nam: đủ, thường công bố top 10 |
| Quỹ ETF và quỹ chủ động | Bản công bố hằng tháng của chính quỹ | Việt Nam: đã có VanEck, VEIL, VOF, Xtrackers, SSIAM |
| VC và PE | KPMG Venture Pulse, báo cáo quý | Đã có 8/9 nước ở mức tổng năm |

**Cách trình bày bắt buộc:** tiêu đề ghi rõ "5 mục lớn nhất", kèm một dòng nói đây là mẫu chứ không phải toàn bộ, và **không cộng 5 mục thành tổng**.

---

## 5. Nhóm D — Thật sự không lấy được miễn phí

Đây là các ô nên để trống và ghi rõ lý do. Không có cách lách.

| Chỉ tiêu | Vì sao không lấy được |
|---|---|
| ETF — dòng vốn cấp quốc gia | Cần dòng vốn hằng tháng của **mọi** quỹ nhân tỷ trọng phân bổ cùng kỳ. Dữ liệu này nằm ở EPFR và LSEG, đều thu phí |
| ETF — tài sản phân bổ theo quốc gia | Cần danh mục nắm giữ chi tiết của toàn bộ tập quỹ |
| Active Fund — dòng vốn và tài sản | Như trên, cộng thêm việc quỹ chủ động không công bố danh mục theo tháng |
| Private Credit | Thị trường tư nhân, số liệu nằm ở Preqin và PitchBook, thu phí |
| VC có nguồn vốn nước ngoài | Cần phân loại xuất xứ vốn ở cấp từng thương vụ |
| Vốn theo loại nhà đầu tư | Cần dữ liệu nắm giữ phân theo loại tổ chức |
| Vốn giải ngân hạ tầng | Không cơ quan nào công bố giải ngân theo chuỗi thống nhất; chỉ có vốn cam kết |

**Cách ghi trên trang:** thay "Chưa có dữ liệu" bằng câu nêu lý do, ví dụ *"Cần dữ liệu dòng vốn theo tháng của toàn bộ tập quỹ — chỉ có ở nguồn thu phí"*. Người đọc hiểu đây là giới hạn của dữ liệu công khai, không phải Atlas làm thiếu.

---

## 6. Thứ tự đề xuất

| Ưu tiên | Việc | Công sức |
|---|---|---|
| 1 | Nối Nhóm A vào mục Vốn & Đầu tư | Thấp — dữ liệu đã có sẵn |
| 2 | Đổi nhãn Nhóm D sang câu nêu lý do | Thấp — chỉ sửa chữ |
| 3 | Tách "Không áp dụng" khỏi "Chưa có dữ liệu" cho ODA và PPI | Thấp |
| 4 | Thêm top 5 ngành và top 5 đối tác FDI cho Việt Nam | Trung bình |
| 5 | Bổ sung kiều hối Việt Nam từ nguồn trong nước | Trung bình |
| 6 | Tra Nhóm B cho các nước còn lại | Cao |

Làm xong bước 1 đến 3 là mục Vốn & Đầu tư đã hết phần lớn ô trống trông như thiếu sót, trong khi không phải mua dữ liệu và không phải phá nguyên tắc nào.

---

## 7. Nguyên tắc giữ nguyên

Ba điều sau **không đổi** dù phạm vi đã nới:

1. Không cộng các mảnh rời thành tổng quốc gia rồi đem so sánh giữa các nước.
2. Không suy mức của chỉ tiêu này từ chỉ tiêu khác, hoặc của hãng này từ hãng khác.
3. Mỗi số phải có nguồn và nhãn mức xác minh. Không có nguồn thì ghi rõ chưa có, không bịa.
