# ATLAS WORLD — HỒ SƠ BÀN GIAO

> Tài liệu này mô tả toàn bộ cấu trúc, quy tắc và nguồn dữ liệu của ấn phẩm **World Atlas** trên nguyenanhtu.vn.
> Mục đích: bất kỳ AI nào (Claude, ChatGPT…) đọc file này là đủ để làm tiếp kỳ sau mà không cần lịch sử chat.
> Chủ dự án: Nguyễn Anh Tú. Cập nhật lần cuối: 22/10/2026.
> File này **không thay thế** `PROJECT_RULES.md` — đó vẫn là hiến pháp của toàn bộ website. File này chỉ bổ sung phần riêng của Atlas World.

---

## 1. Atlas World nằm ở đâu

| Hạng mục | Giá trị |
|---|---|
| Repo | `nguyenanhtu0104-design/website-nguyenanhtu-2.0.0-source`, nhánh `main` |
| Thư mục kỳ | `publications/atlas/2026-q3/` |
| File nội dung | `world-economic-atlas.html` (~3,5 MB, một file tự chứa) |
| Ảnh bìa | `bia.jpg` |
| Metadata | `info.txt` |
| Địa chỉ web | `https://nguyenanhtu.vn/atlas/` (thư viện) · `https://nguyenanhtu.vn/atlas/2026-q3/doc/` (bản đọc) |
| Hosting | Cloudflare Pages, tự build khi có commit mới lên `main` |

Mỗi kỳ là **một thư mục** trong `publications/atlas/`. Tên thư mục trở thành đường dẫn. Chỉ dùng chữ thường không dấu, số và dấu `-`.

### `info.txt` hiện tại

```
tieu-de: World Atlas quý III/2026
so: 01
ngay: 2026-10-05
mo-ta: World Atlas quý III/2026: bản đồ số liệu kinh tế các nền kinh tế lớn, bản nhẹ cho điện thoại, chọn quốc gia để xem GDP, dòng vốn đầu tư và nguồn đối chiếu. Mỗi quý một kỳ.
trich-doan: Chọn một quốc gia, đọc ngay số liệu kinh tế quý III/2026: GDP, dòng vốn đầu tư, kèm liên kết nguồn gốc. Bản nhẹ, không cần JavaScript, mở nhanh trên điện thoại. World Atlas ra mỗi quý một kỳ.
trang-thai: cong-bo
```

- `trang-thai: nhap` = bản nháp. Trang vẫn tạo để xem thử qua link nhưng gắn `noindex`, không hiện trong thư viện, không vào sitemap, có dải báo "BẢN NHÁP".
- `trang-thai: cong-bo` = công bố.
- Kỳ mới mặc định để `nhap` cho tới khi Tú nói "Công bố kỳ…".

---

## 2. Cấu trúc bên trong file HTML

File là **một trang tự chứa, không dùng JavaScript**. Chuyển quốc gia bằng cơ chế radio + CSS thuần.

### Cơ chế chuyển quốc gia

```html
<input class="country-radio" type="radio" name="country" id="country-0" checked>
<input class="country-radio" type="radio" name="country" id="country-1">
...
<label for="country-0">Việt Nam</label>
...
<div class="country-panel panel-0"> ... </div>
```

- 17 radio input, 17 label trong `.country-selector`, 17 `.country-panel`.
- Thứ tự panel **phải khớp** thứ tự label. Thêm nước mới là thêm đủ cả ba: input, label, panel.

### 17 quốc gia theo đúng thứ tự index

| Index | Quốc gia | ISO3 |
|---|---|---|
| 0 | Việt Nam | VNM |
| 1 | Hoa Kỳ | USA |
| 2 | Trung Quốc | CHN |
| 3 | Đức | DEU |
| 4 | Nhật Bản | JPN |
| 5 | Vương quốc Anh | GBR |
| 6 | Ấn Độ | IND |
| 7 | Pháp | FRA |
| 8 | Nga | RUS |
| 9 | Ý | ITA |
| 10 | Canada | CAN |
| 11 | Hàn Quốc | KOR |
| 12 | Thái Lan | THA |
| 13 | Indonesia | IDN |
| 14 | Đài Loan | TWN |
| 15 | Singapore | SGP |
| 16 | Malaysia | MYS |

### Quy ước id các mục trong mỗi panel

Mỗi quốc gia có 5 section mang id theo mẫu `c<index>-<tên mục>`:

| id | Nội dung |
|---|---|
| `cN-macro` | Kinh tế và dân số — số liệu năm |
| `cN-capital` | Đầu tư quốc tế — thống kê dòng vốn |
| `cN-credit` | **Tín nhiệm quốc gia** |
| `cN-market` | **Phân hạng thị trường cổ phiếu** |
| `cN-compare` | So sánh cùng kỳ |

Ví dụ: Việt Nam là `c0-credit`, `c0-market`. Hàn Quốc là `c11-credit`, `c11-market`.

**Quy tắc bắt buộc:** giữ nguyên quy ước id này. Mọi script cập nhật đều dựa vào nó để tìm đúng bảng.

### Các section dùng chung (ngoài panel quốc gia)

| id | Nội dung |
|---|---|
| `provider-comparison` | Bảng so sánh phân hạng 11 quốc gia × 5 nhà cung cấp |
| `current-pulse-ranking` | Snapshot Q3/2026 — GDP release state |
| `vietnam-etfs` | Các quỹ ETF đầu tư vào Việt Nam |
| `vietnam-direct-funds` | Quỹ và nhà đầu tư trực tiếp vào doanh nghiệp Việt Nam |
| `market-debt-v1518` | Độ sâu thị trường vốn và cấu trúc nợ |

---

## 3. Quy tắc biên tập số liệu

Đây là phần dễ sai nhất. Bản gốc do công cụ xuất ra thường để số thô, phải biên tập lại trước khi đăng.

### 3.1 Định dạng số

| Loại | Quy tắc | Ví dụ đúng |
|---|---|---|
| Giá trị USD lớn | Quy đổi sang **tỷ USD**, làm tròn **2 chữ số thập phân** | `21,99 tỷ USD` |
| Tỷ lệ phần trăm | Làm tròn 2 chữ số, ghi rõ đơn vị | `4,27 % GDP` |
| Số đếm | Dấu chấm ngăn hàng nghìn | `3.908` công ty |
| Dấu thập phân | **Dấu phẩy** theo chuẩn Việt Nam | `157.770,9` |

**Cấm:** để số thô kiểu `21990000000`, để số thập phân dài kiểu `4.27241480079657`, trộn dấu chấm và phẩy lẫn lộn.

### 3.2 Ô không có dữ liệu

- Dùng dấu `—`, **không bao giờ thay bằng 0**.
- Ghi chú rõ: "—: không có giá trị trong chuỗi đã truy xuất; không thay bằng 0".
- Nếu một nước không có trong bảng nguồn, ghi "Không có trong bảng đã đối chiếu", không suy ra mức thấp nhất.

### 3.3 Không trộn kỳ

- Số liệu khác kỳ **không được xếp hạng chung**. Gắn nhãn `STALE` hoặc `LATEST AVAILABLE`.
- Không trộn tăng trưởng so cùng kỳ (YoY) với so quý trước hoặc SAAR.
- Ví dụ đang áp dụng: vốn hóa cổ phiếu của Pháp chỉ có số 2018 nên **không** tính tỷ trọng toàn cầu 2025, ghi `NR`.

### 3.4 Không tự chấm điểm

Atlas **chỉ trình bày lại** mức hạng và phân hạng do tổ chức nguồn công bố. Không quy đổi phân hạng thành điểm số, không xếp hạng sức hấp dẫn đầu tư, không suy mức của hãng này từ hãng khác.

---

## 4. Quy tắc ghi nguồn và mức xác minh

Mỗi số liệu phải ghi rõ **lấy từ đâu** và **đã kiểm chứng tới mức nào**. Dùng đúng bốn nhãn sau:

| Nhãn | Nghĩa |
|---|---|
| `đã đối chiếu nguồn sơ cấp` | Đã mở trực tiếp thông cáo, báo cáo hoặc bảng dữ liệu của chính tổ chức công bố |
| `hai nguồn độc lập` / `hai nguồn tổng hợp trùng khớp` | Hai nguồn khác nhau cho cùng kết quả |
| `nguồn báo chí` | Lấy từ bài báo dẫn lại, chưa đối chiếu bản gốc |
| `nguồn tổng hợp` | Lấy từ bảng tổng hợp của bên thứ ba, chưa đối chiếu bản gốc |

**Nguyên tắc:** thà ghi "chưa đối chiếu được" còn hơn ghi một con số trông chắc chắn mà không kiểm được. Người đọc Cẩm Nang là nhà đầu tư, họ cần biết mức tin cậy.

---

## 5. Nguồn dữ liệu đã dùng — bảng đầy đủ

### 5.1 Phân hạng thị trường cổ phiếu

| Nhà cung cấp | Nguồn đã dùng | Ngày/hiệu lực | Mức xác minh | Phạm vi |
|---|---|---|---|---|
| **FTSE Russell** | Thông cáo LSEG về kết quả rà soát phân hạng | 07/04/2026 và 06/10/2026 | Nguồn sơ cấp | Việt Nam (lên Secondary Emerging, hiệu lực 21/09/2026) |
| **MSCI** | Bảng *Current Market Classification* trên `msci.com/market-classification` | Chụp 22/10/2026 | Nguồn sơ cấp | 16/17 nước |
| **MSCI** | *Previous Market Reclassifications* (file xlsx tải từ cùng trang) | 22/10/2026 | Nguồn sơ cấp | Nga — chuyển sang Standalone từ 03/2022 |
| **MSCI** | Danh sách chỉ số MSCI Frontier Markets, `app2.msci.com/eqb/fm/MSCI_Aug26_FM_PublicList.pdf` | 12/08/2026 | Nguồn sơ cấp | Việt Nam (xác nhận thuộc Frontier) |
| **S&P DJI** | Tài liệu tham vấn phân hạng quốc gia 2026 (có phụ lục đầy đủ) | 01/06/2026 | Nguồn sơ cấp | 16/17 nước (Nga không có) |
| **STOXX** | `SW_Country_Classification_20250922.xlsx` | Hiệu lực 22/09/2025 | Nguồn sơ cấp | 16/17 nước (Nga không có), tổng 68 nước |
| **Solactive** | Tài liệu tham vấn phân hạng quốc gia | 27/10/2025 | Tài liệu tham vấn | 9/17 nước; Việt Nam và Nga không có trong tài liệu |

**Liên kết đầy đủ:**

- FTSE Russell: `https://www.lseg.com/en/media-centre/press-releases/ftse-russell/2026/ftse-country-classification-review-september-2026`
- MSCI: `https://www.msci.com/market-classification`
- MSCI Frontier list: `https://app2.msci.com/eqb/fm/MSCI_Aug26_FM_PublicList.pdf`
- S&P DJI: `https://www.spglobal.com/spdji/en/documents/indexnews/announcements/20260601-1483549/1483549_spdj-2026-country-classification-consult-20260601.pdf`
- STOXX: `https://www.stoxx.com/documents/stoxxnet/Documents/Resources/Methodology/Country_Classification/SW_Country_Classification_20250922.xlsx`
- Solactive: `https://www.solactive.com/wp-content/uploads/2025/10/Market-Consultation-Solactive-Country-Classification-2025-pdf.pdf`

### 5.2 Tín nhiệm quốc gia

| Hãng | Nguồn đã dùng | Mức xác minh | Phạm vi |
|---|---|---|---|
| **Moody's** | Thông cáo hành động xếp hạng Việt Nam 04/05/2026 trên `events.moodys.com` | Nguồn sơ cấp | Việt Nam (Ba2, triển vọng tích cực) |
| **Moody's** | Bảng tổng hợp danh sách xếp hạng tín nhiệm các nước | Nguồn tổng hợp | 16 nước còn lại |
| **S&P** | Bảng TradingEconomics `tradingeconomics.com/country-list/rating` + bảng tổng hợp | Hai nguồn trùng khớp | 17/17 nước |
| **Fitch** | Thông cáo riêng từng nước (có liên kết trong bảng) | Nguồn sơ cấp | 6 nước: Hàn Quốc, Thái Lan, Indonesia, Đài Loan, Singapore, Malaysia |
| **Fitch** | TechNode 09/10/2026 + FXEmpire | Hai nguồn | Việt Nam (BB+, ổn định, 08/12/2023) |
| **Fitch** | Bảng tổng hợp | Nguồn tổng hợp | 10 nước còn lại |
| **R&I (Nhật Bản)** | FiinRatings + TechNode | Hai nguồn độc lập | Việt Nam (BBB−, ổn định, 08/10/2026) |

**Điểm nhấn nội dung:** ngày 08/10/2026, R&I nâng Việt Nam từ BB+ lên **BBB−**, triển vọng ổn định. Đây là **lần đầu Việt Nam đạt hạng đầu tư** ở một hãng xếp hạng. Ba hãng lớn vẫn để Việt Nam dưới ngưỡng đầu tư một bậc.

### 5.3 Số liệu kinh tế và dòng vốn

| Nhóm | Nguồn | Ghi chú |
|---|---|---|
| GDP, tăng trưởng, lạm phát, nợ công, thất nghiệp | IMF WEO / DataMapper | Lớp annual comparable |
| FDI, kiều hối, đầu tư danh mục, PPI hạ tầng, viện trợ | World Bank WDI (API) | Giữ mã chỉ tiêu gốc, ví dụ `BX.KLT.DINV.CD.WD` |
| Vốn hóa cổ phiếu niêm yết | World Bank `CM.MKT.LCAP.CD` | Mẫu số toàn cầu 157.770,9 tỷ USD (SIFMA 2026 Fact Book / WFE, 2025) |
| Cấu trúc nợ | IMF Global Debt Database 2024 | |
| Nợ nước ngoài | World Bank IDS 2024 | Phạm vi hạn chế, nhiều nước không có |
| GDP quý, CPI, lao động | Cơ quan thống kê từng nước | Việt Nam: Cục Thống kê |
| Cơ cấu ngành | Cơ quan thống kê từng nước (NSO, BEA, NBS, Eurostat, MoSPI…) | |
| Xuất khẩu theo nhóm hàng | HS 1988/92 (H0), số liệu 2023 | |
| VC/PE | KPMG Venture Pulse (dữ liệu PitchBook) | Giá trị thương vụ, không phải giải ngân |
| Quỹ đầu tư vào Việt Nam | VanEck, Dragon Capital (VEIL), VinaCapital (VOF) | Số cấp quỹ, **không cộng gộp** |
| Kearney FDI Confidence Index | Báo cáo Kearney 2026 | Khảo sát ý kiến, không phải số đo trực tiếp |

---

## 6. Cảnh báo — những nguồn KHÔNG nên dùng

Đây là các bẫy đã gặp thật trong quá trình làm. AI tiếp nhận cần biết để không lặp lại.

| Nguồn | Vấn đề |
|---|---|
| **FXEmpire (trang tổng hợp tất cả các nước)** | **Dữ liệu cũ.** Ghi Moody's Hoa Kỳ là Aaa trong khi đã bị hạ xuống Aa1 từ 16/05/2025; ghi Nga là Ca trong khi Moody's đã rút xếp hạng. Nếu lấy theo trang này, Atlas sẽ sai đi. Trang riêng từng nước của FXEmpire thì cập nhật hơn, dùng được để đối chiếu. |
| **Ô tìm kiếm trên stoxx.com** | Chỉ tìm chỉ số, không tìm file tài liệu. Phải vào thẳng trang `stoxx.com/country-classification` rồi bấm nút tải XLS/PDF. |
| **Trang `msci.com/market-classification` khi lưu bằng "Save as"** | Bảng phân hạng là **ảnh**, lưu trang không kéo theo ảnh. Phải chụp màn hình. |
| **Các file PDF/XLSX trên stoxx.com** | Chặn truy cập tự động. Người dùng phải tải thủ công bằng trình duyệt rồi gửi file. |
| **Bài báo VnEconomy 22/06/2024 về S&P Việt Nam** | Tiêu đề ghi BB+ nhưng thân bài ghi BB — mâu thuẫn trong chính bài. Mức đúng là **BB+**. |

---

## 7. Những mục chưa xác minh (tình trạng 22/10/2026)

| Mục | Tình trạng | Cách lấy |
|---|---|---|
| Moody's cho 16 nước ngoài Việt Nam | Nguồn tổng hợp | Đăng ký tài khoản miễn phí trên `moodys.com`, tra từng nước, mục Ratings, dòng "Foreign currency long-term" |
| Fitch cho 10 nước | Nguồn tổng hợp | Tương tự trên `fitchratings.com` |
| Fitch Việt Nam | Hai nguồn, chưa có bản gốc | Ưu tiên làm mục này trước vì liên quan trực tiếp tới khách hàng |
| Solactive | Tài liệu tham vấn 27/10/2025 | Tìm bản chính thức sau kỳ tham vấn |
| S&P DJI và STOXX cho Nga | Không có trong bảng nguồn | Nga bị loại khỏi hầu hết bộ chỉ số sau 2022, nhiều khả năng không có |

**Khuyến nghị:** không nên đổ công sức vào Moody's và Fitch cho 15 nước nền. Các trang tổng hợp miễn phí có độ trễ khác nhau, đối chiếu chéo giữa chúng tạo mâu thuẫn chứ không tăng độ tin cậy. Bảng hiện tại đã ghi rõ mức xác minh từng dòng — đó là cách trình bày trung thực và đủ dùng.

---

## 8. Quy trình làm việc

### Vai trò

- **Tú** chỉ làm hai việc: gửi nội dung, và thả gói cập nhật lên GitHub Desktop.
- **AI** làm toàn bộ phần kỹ thuật: tích hợp, xử lý số liệu, build 0 lỗi, kiểm thử.

### Các bước chuẩn khi cập nhật Atlas

1. Lấy bản mới nhất: `git clone --depth 1 https://github.com/nguyenanhtu0104-design/website-nguyenanhtu-2.0.0-source.git`
2. Sửa file `publications/atlas/2026-q3/world-economic-atlas.html`
3. Ghi `CHANGELOG.md` — mục "Nội dung" hoặc mục ấn phẩm, **không tăng version site** nếu chỉ sửa nội dung kỳ
4. `node scripts/build.mjs` phải báo **0 lỗi**
5. `node scripts/check-dist.mjs` phải **ĐẠT**
6. `bash scripts/make-update.sh` để có `update-*.zip`
7. Giao zip cho Tú kèm 1–2 câu tóm tắt

### Kiểm tra bắt buộc trước khi giao

- [ ] Build 0 lỗi, check-dist ĐẠT
- [ ] Số thẻ mở và đóng cân bằng: `<section>`, `<table>`, `<tr>`, `<div>`, `<details>`
- [ ] Không còn số thô (`\d{9,}`) hay số thập phân dài (`\.\d{4,}`) trong bảng
- [ ] Mở thử trên bề ngang 390 px, không tràn ngang
- [ ] Mỗi số mới đều có nguồn và nhãn mức xác minh
- [ ] Zip chỉ chứa file đã đổi, không chứa `dist/`

### Cách Tú đưa lên web

Giải nén **đè** vào thư mục kho trên máy → GitHub Desktop → Summary → Commit to main → Push origin. Khoảng 1–2 phút sau website cập nhật.

**Lưu ý thư mục kho nằm trong OneDrive:** OneDrive hay tạo file trùng tên kiểu `-LAPTOP-RM95SQTA`, kể cả bên trong `.git`, và đã từng làm hỏng build Cloudflare. Nên tạm dừng đồng bộ OneDrive trước khi giải nén zip và commit.

---

## 9. Lịch sử các đợt cập nhật lớn

| Ngày | Nội dung |
|---|---|
| 05/10/2026 | Phát hành kỳ quý III/2026, 11 quốc gia |
| 21/10/2026 | Bản v1.5.22: biên tập lại toàn bộ số liệu sang tỷ USD làm tròn 2 chữ số; thêm bảng tín nhiệm quốc gia |
| 21/10/2026 | Bản v1.5.23: mở rộng lên 17 quốc gia; thêm bảng so sánh 5 nhà cung cấp phân hạng |
| 21/10/2026 | Bổ sung R&I: Việt Nam BBB−, lần đầu đạt hạng đầu tư |
| 22/10/2026 | Chuẩn hóa bảng tín nhiệm 17 nước về cùng format 6 cột |
| 22/10/2026 | Đối chiếu nguồn sơ cấp: S&P DJI, MSCI, STOXX; đối chiếu chéo S&P tín nhiệm |
