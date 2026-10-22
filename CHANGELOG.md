# CHANGELOG — Cẩm Nang BĐS

Quy ước: `2.x.0` = chức năng mới · `2.x.y` = sửa lỗi · Thêm/sửa bài ghi ở mục **Nội dung**, không tăng version.


## 2026-10-22 — Nam Mekong Grand Plaza: cập nhật mục Hỏi & Đáp (Nội dung)
- Bỏ 3 câu (giá bán, thời gian mở bán/bàn giao, số căn theo loại) — trùng hoặc đã có ở mục Tổng quan/Giá bán.
- Thêm 8 câu mới lấy từ tài liệu Hỏi–Đáp dự án của chủ đầu tư: chủ đầu tư là ai; tổng số căn và số căn mỗi tòa; sở hữu lâu dài/người nước ngoài 50 năm; đơn vị tư vấn thiết kế; số căn/sàn mỗi tòa; thiết kế đặc biệt (căn sân vườn, căn thông tầng, sảnh, hành lang); đơn vị bảo lãnh và ngân hàng hỗ trợ vay; ký hợp đồng với công ty nào.
- Giữ câu "Pháp lý dự án thế nào?" và "Có nên mua không?" (chuyển xuống cuối). Tổng 10 câu, đánh số lại 01–10.
- `updatedDate` bài → 2026-10-22. Không đổi `version` site (chỉ sửa nội dung bài).

## 2026-10-22 — Trang chủ, Chương 04: tên vùng/dự án đánh dấu ⭐ hiển thị chữ to hơn (2.21.2)
- Tên vùng có `star: true` (vd "Thành Phố Mới Bình Dương") đổi sang 19px, màu vàng thương hiệu, đậm hơn so với 17px mặc định — thêm class `.art-title.is-star` trong `main.css`, build gán class khi `it.star` đúng.
- Chip dự án có `star: true` (vd "Nam Mekong Grand Plaza") tăng từ 11px lên 13px, in đậm; viền/màu vàng giữ nguyên như trước.
- Chỉ ảnh hưởng Chương 04 "Dự Án Đã Chọn Lọc" (nơi duy nhất dùng cờ `star` trong `categories.json`); không đổi các chương khác, không đổi HTML trang bài.
- Tăng `version` lên 2.21.2 vì có sửa CSS/JS (build.mjs).

## 2026-10-21 — World Atlas quý III/2026: bản v1.5.23, mở rộng 17 quốc gia, thay bản Atlas World cũ (ấn phẩm)
- Thay toàn bộ bản đọc của kỳ quý III/2026 bằng bản v1.5.23 Tú duyệt: thêm 6 quốc gia (Hàn Quốc, Thái Lan, Indonesia, Đài Loan, Singapore, Malaysia), nâng tổng số lên 17; thêm các mục dòng vốn, cơ cấu sản xuất, thương mại - dự trữ, ETF và quỹ chủ động cho nhóm mới; thêm bảng "So sánh phân hạng thị trường — 5 nhà cung cấp".
- **Chuẩn hóa bảng "Tín nhiệm quốc gia" cho cả 17 nước về cùng một format**: Tổ chức · Loại đánh giá · Mức · Triển vọng · Ngày công bố · Nguồn. Trước đó 11 nước cũ và 6 nước mới dùng hai kiểu bảng khác nhau.
- **Bổ sung R&I (Nhật Bản): Việt Nam BBB− triển vọng ổn định, 08/10/2026**, nâng từ BB+ — lần đầu Việt Nam đạt hạng đầu tư ở một hãng xếp hạng. Đối chiếu hai nguồn độc lập (FiinRatings, TechNode).
- Điền Moody's và S&P cho cả 17 nước (trước đó bỏ trống hoặc chỉ có Fitch). Việt Nam: Moody's Ba2 tích cực (nguồn sơ cấp), S&P BB+ và Fitch BB+ (nguồn báo chí). Giữ nguyên các dòng Fitch đã có liên kết công bố của 6 nước mới.
- Mỗi bảng có ghi chú giải thích chức năng từng tổ chức, ngưỡng hạng đầu tư (Baa3 / BBB−) và mức xác minh của từng dòng.
- Thêm ghi chú đối chiếu độc lập ngày 21/10/2026 dưới bảng 5 nhà cung cấp: đã xác nhận FTSE (Việt Nam lên Secondary Emerging, hiệu lực 21/09/2026) và Solactive (9 nước); chưa đối chiếu được bảng đầy đủ của S&P DJI và STOXX.
- Số liệu giữ định dạng đã biên tập (tỷ USD, làm tròn 2 chữ số). Không đổi version site, URL, trạng thái công bố hay giao diện.

## 2026-10-21 — Menu Atlas: mở thẳng trang nội dung (2.21.1)
- Trong menu "Atlas ▾", World Atlas và Atlas VietNam nay mở thẳng kỳ mới nhất đã công bố (bản đọc), không qua trang thư viện. Chưa có kỳ nào công bố thì vẫn về trang thư viện.
- Chỉ đổi đích liên kết của hai mục trong menu (`templates/partials/global-nav.html`, `scripts/build.mjs`). Giao diện không đổi.

## 2026-10-20 — Thương hiệu: logo chân dung và icon màn hình chính (2.21.0)
- Thay chữ NAT ở đầu trang bằng ảnh chân dung tác giả trong vòng tròn viền vàng (`assets/images/site/nat-logo-256.webp`). Favicon đổi sang `nat-logo-96.webp`.
- Thêm icon khi thêm vào màn hình chính: `apple-touch-icon-180.png` (iPhone) và `app-icon-192/512.png` (Android), kèm `assets/manifest.webmanifest` tên "Nguyễn Anh Tú". Các file này để PNG vì iOS và manifest yêu cầu PNG.
- Ảnh chân dung ở watermark, khối tác giả và schema không đổi (vẫn dùng `avatar-96.webp` và `tac-gia-nguyen-anh-tu.webp`).

## 2026-10-20 — Nội dung: bài mới "TOD Là Gì — Vì Sao Là Lời Giải Đô Thị Cho Việt Nam" (chương Tư Duy Đầu Tư)
- Biên tập từ kịch bản TOD 5.0 của Tú: 5 vấn đề hiện tại, định nghĩa TOD, 3 thành phần, 3 nhiệm vụ tái cấu trúc, 4 yếu tố đánh giá vùng TOD và nhà ga trung tâm. 5 sơ đồ tư duy (ảnh WebP tách file), liên kết tới TOD 5.0, Hành lang Metro, Metro 2030, Compact City. Đã gọn phần lặp giữa sơ đồ và chữ, trau chuốt câu từ, thêm câu phân biệt "thế hệ TOD 1.0–5.0" với "cấp 1–5" của thị trường. Thêm phần kết "Nhận diện hồng tâm" với hình bia bắn (Thủ Thiêm, Thành phố mới Bình Dương).
- Số liệu đối chiếu nguồn: 77 triệu xe máy (UBATGT quốc gia, 9/2024), dân số thành thị 38,6% (Cục Thống kê, 2025), thiệt hại ô nhiễm 4,5–5,7% GDP (NEU, 2018). Badge chương 3: 5 bài.

## 2026-10-20 — Chỉ số đô thị số 01: bản đồ metro trong thẻ "Phân tích mô hình"
- Thêm sơ đồ mạng đường sắt đô thị vào cả 15 thẻ: Hong Kong, Barcelona, Tokyo, Singapore, Ahmedabad, Seoul, Paris, Medellín, Thâm Quyến, Curitiba (sơ đồ đề xuất, không chính thức), Copenhagen, Portland, Hà Nội và TP.HCM mới (2 sơ đồ quy hoạch cũ: 8 tuyến và bản MAUR tiếng Pháp, kèm ghi chú quy hoạch 2040 và liên kết bản đồ Cẩm Nang). Ảnh do Tú cung cấp, xử lý tông ấm 70% theo §8.4, lưu WebP tách file ở `assets/clips/do-thi-nen/metro-*.webp` (bản 900 px để hiện, bản lớn mở khi bấm). Mỗi ảnh có chú thích và nguồn.

## 2026-10-20 — Bản tính tài chính, mục 03: tổng kết kỳ chốt bán và so sánh với gửi ngân hàng (2.20.0)
- Khối mới "Tổng kết lợi nhuận theo kỳ chốt bán" (cam, BỔ SUNG): chọn tối đa 8 kỳ chốt bán; mỗi kỳ cho tiền tự bỏ ra ròng, tiền thu về khi bán (sau trả nợ, phí tất toán, chi phí bán), lãi/lỗ, tỷ suất, IRR.
- So sánh với gửi ngân hàng cùng dòng tiền và cùng thời điểm (vốn đầu + trả nợ + giữ nhà − thuê): lãi gửi, chênh lệch bán nhà − gửi, kết luận. Lãi gửi nhập tay hoặc lấy lãi 12 tháng từ mục 01 (kèm nhãn độ mới); lãi kép hoặc lãi đơn.
- Kiểm tra: khi lãi gửi bằng IRR của nhà thì chênh lệch ≈ 0. Các cột cũ của mục 03 và mục 01, 02 không đổi. Ghi chú người lập có thêm mục giải thích.

## 2026-10-20 — Bản tính tài chính, mục 01 Lãi suất ngân hàng: giao diện mới + ngày cập nhật tự động (2.19.0)
- Chỉ đổi mục 01; mục 02 và 03 giữ nguyên. Số liệu lãi suất KHÔNG đổi (chưa có nguồn chính thức mới).
- Dải ngày tự động: "Rà soát số liệu gần nhất" (lấy từ ngày quan sát/hiệu lực trong dữ liệu), "Rà soát kế tiếp" (chu kỳ 7 ngày, báo quá hạn), "Trang được cập nhật lần cuối" (ngày dựng bản, build.mjs thay `__BUILD_DATE__`, giờ Việt Nam), đếm độ mới Mới ≤30 ngày / Cần kiểm tra 31–90 / Cũ >90 / Chưa có số. Số cũ hiện mờ. Nhập kỳ JSON mới thì các ngày tự đổi.
- Chuyển nhanh Tiền gửi ↔ Vay mua nhà; lọc kỳ hạn, sắp xếp (không xếp hạng theo lãi), ẩn ngân hàng chưa có số, bấm "Chi tiết & nguồn" từng dòng, thẻ gọn trên điện thoại. Đối soát nguồn và quản trị JSON gập lại.
- Lưu ý: trang không tự lấy số từ ngân hàng; số chỉ đổi khi đối chiếu nguồn chính thức và đăng lại.

## 2026-10-20 — Công cụ: Bản đồ dự án — hướng tuyến Metro số 1 bám đường ray
- Đoạn Thảo Điền – Suối Tiên (dọc Xa lộ Hà Nội): vẽ theo hình học đường trên OpenStreetMap (lấy qua dịch vụ định tuyến OSRM), bỏ nhánh rẽ nút giao, làm mượt, rồi dời ngang (khoảng 50–65 m về phía bắc, phía đường ray) cho đi qua đúng 9 ga. Đoạn Bến Thành – Thảo Điền (ngầm, qua rạch Thị Nghè và sông Sài Gòn): đường cong mềm qua các ga. Mọi ga nằm đúng trên tuyến; đoạn ngầm/trên cao tô theo chỉ số mới.

## 2026-10-20 — Công cụ: Bản đồ dự án — thiết kế lại giao diện, bản đồ to trên điện thoại
- Bảng bên trái gom thành 3 thẻ: **Dự án** (thống kê, lọc tình trạng, khu vực, danh sách, lớp "Dự án quanh ga metro" và "Dự án mở bán từ 2017" dạng mục mở/gập), **Tuyến & ga** (chú giải bằng hình, bật/tắt tuyến; vành đai và quy hoạch dài hạn gập sẵn), **Ghi chú** (lưu ý và nguồn). Ô tìm kiếm luôn ở đầu bảng. Trình duyệt nhớ thẻ đang mở.
- Máy tính: thanh tiêu đề gọn có nút quay về Cẩm Nang và nút "Ẩn bảng" để bản đồ chiếm toàn màn hình.
- Điện thoại: bản đồ chiếm toàn màn hình; bảng điều khiển thành bảng kéo từ dưới lên với 3 mức (thu gọn chỉ còn ô tìm kiếm + thẻ, nửa màn hình, toàn màn hình) — kéo tay nắm hoặc bấm để đổi mức. Chạm bản đồ, chọn dự án/ga/tuyến hay mở cửa sổ thông tin thì bảng tự thu gọn. Nút chọn nền thu thành biểu tượng, nút điều khiển to hơn, dòng nguồn bản đồ gọn một dòng, cửa sổ thông tin tránh bị bảng che.

## 2026-10-19 — Công cụ: Bản đồ dự án — vị trí ga theo bản đồ mạng lưới Mạnh Vũ, lớp "Dự án quanh ga metro"
- Nguồn: các trang bando.manhvu.com do Tú lưu và gửi (bản đồ mạng lưới Vành đai 1–4 & Metro; trang tuyến Metro số 1, Metro số 1 kéo dài, Metro số 1 kéo dài Đồng Nai, Metro số 2 Thủ Dầu Một – Tao Đàn, Đường sắt Thủ Thiêm – Long Thành, Quốc lộ 13). Chỉ lấy tọa độ ga, tọa độ và tên dự án; không lấy giá hay thông tin chi tiết.
- Vị trí ga: chuyển nhãn ga trên bản đồ mạng lưới (MapLibre, mức phóng 15) sang tọa độ, căn theo 14 ga Tuyến 1 (sai lệch 7–60 m). Kiểm tra độc lập bằng khoảng cách dự án–ga ở các trang tuyến: 190 dự án, trung bình 17–19 m, lớn nhất 105 m.
  - Tuyến 1: cả 14 ga; ga Bình Thái dời 446 m (khớp Wikipedia 10°49′57″B 106°45′50″Đ).
  - Tuyến TP mới Bình Dương – Suối Tiên: 16/17 ga (S8 giữ vị trí cũ vì nhãn bị ẩn).
  - Metro số 2 Thủ Dầu Một – Tao Đàn: thay 9 ga ước lượng (lệch tới vài km) bằng 24 ga C0–C23; C5 tính từ khoảng cách dự án–ga; C0–C10 trên cao, C11–C23 ngầm.
  - Tuyến 2 (Bến Thành – Tham Lương, Bến Thành – Thủ Thiêm): sửa 15 ga (lệch 28–506 m); Bảy Hiền giữ vị trí cũ.
  - Thủ Thiêm – Long Thành: 19 ga theo nguồn (trước là 20 ga số hóa từ đồ án). Tuyến 1 kéo dài Đồng Nai: 17 ga theo nguồn (trước 15), ga Tân Vạn (QL1) tính từ khoảng cách dự án–ga.
  - Bến Thành – Cần Giờ: sửa 4 ga (17–48 m). Tuyến 3, 4, 7: giữ theo quy hoạch 2040 (Ankapong) vì bản đồ nguồn vẽ phương án khác.
- Dự án: Norton Park, Nam Mekong Grand Plaza (lớp Cẩm Nang) và Moonlight Avenue, Masteri Grand View (lớp 2017) trước ở vị trí ước lượng, nay theo tọa độ nguồn (dời 225–763 m).
- Thêm lớp "Dự án quanh ga metro" (`du-an-quanh-ga.json`, tải riêng): 114 dự án đang mở bán, đang xây, sắp triển khai quanh 5 tuyến metro/đường sắt và trục Quốc lộ 13; chỉ gồm tên, loại hình, tình trạng, tọa độ. Bỏ trùng với lớp Cẩm Nang/2017 và giữa các tuyến; Alta Height bị ghi 2 vị trí trong nguồn, giữ vị trí cạnh The 9 Stellars (CafeLand). Chấm tròn nhỏ theo tình trạng, lọc, tìm kiếm, liên kết `#g=…`, vòng 500 m/1 km, chỉ đường Google Maps. Ghi nguồn bando.manhvu.com ở popup, ghi chú tuyến và chân trang.

## 2026-10-19 — Nhật san kỳ 4 (công bố)
- Thêm `publications/nhat-san/2026-10-19-so-04/`: "Sức mua — bài toán phải giải cho quý 4/2026" (tin tuần 12–18/10, bổ sung 19/10), 7 ảnh, 33 nguồn, trạng thái `cong-bo` (Tú duyệt công bố 19/10); bổ sung bản đồ khung chiến lược 100 năm (BCG) , sơ đồ 14 ga metro số 1 và 6 ảnh hạ tầng (cầu đi bộ, metro 1, metro 2, quỹ đất trung tâm; đã xóa logo).

## 2.17.4 — PDF phương án gửi lead dùng bản trình bày đầy đủ
- File PDF tự tạo dùng bản trình bày đầy đủ (báo giá, lịch thanh toán, phương án vay ngân hàng, bảng trả nợ, so sánh, lưu ý) thay vì bản 1 trang; trang dài tự thu nhỏ vừa khổ A4, không méo.

## 2.17.3 — Lead: chống trình duyệt giữ bản cũ, báo lý do khi chưa tạo được PDF
- Trang bảng tính nạp lead.js kèm số phiên bản; thư mục assets/lead luôn kiểm tra bản mới.
- Email báo lead ghi rõ lý do khi chưa tạo được file PDF.

## 2.17.2 — Lead: tự tạo PDF phương án của khách
- Khi khách tick "gửi kèm phương án", trình duyệt tự tạo file PDF đúng bảng tính khách đã nhập (Palm River, Norton Park, Nam Mekong).
- Email báo lead đính kèm file PDF; file cũng lưu vào Google Drive (thư mục "Lead - Phương án PDF") kèm link ở cột "File PDF phương án" trong Sheet và tin WhatsApp.
- Thư viện tạo PDF (html2canvas, jsPDF) nằm trong assets/vendor, chỉ tải khi khách gửi phương án.

## 2.17.1 — Lead: WhatsApp, PDF sẵn, sổ lead theo cấu phần
- Báo lead qua WhatsApp (CallMeBot: WHATSAPP_PHONE, WHATSAPP_APIKEY).
- Email báo lead có nút "Xuất PDF sẵn của khách" (bảng tính tự điền số khách và mở hộp thoại lưu PDF).
- Google Sheet chia nhóm cột, tab theo dự án, tab Tổng quan; lưu khu vực, số lần vào, số tương tác, số dự án đã xem.

## 2026-10-18 — Bản tính tài chính: IRR, hỗ trợ lãi của chủ đầu tư, chi phí bán mặc định 2%, ghi chú cho người lập
- Cột "Quy năm" thay bằng **IRR %/năm** tính theo dòng tiền từng tháng (cột cũ coi mọi vốn bỏ từ đầu nên thấp hơn thực tế, ví dụ kỳ 120: 3,4% so với IRR 6,4%).
- Thêm ô "Số tháng đầu lãi vay do chủ đầu tư chịu" (mặc định 0); phần lãi đó không tính vào tiền của người mua (cột "Anh trả ngân hàng", vốn cá nhân, quỹ và IRR).
- Chi phí/thuế khi bán mặc định 2% (trước là 0) kèm gợi ý; có thể sửa.
- Thêm khung ghi chú cho người lập bản tính: định nghĩa từng cột, công thức, cách đọc IRR và các giả định/giới hạn. Đổi chân trang theo tên mới.

## 2026-10-18 — Bản tính tài chính: nối bản tính vay với tích góp, thêm phí tất toán và tỷ suất lợi nhuận
- Thông số ở mục 02 (ngày vay, thời hạn, phương pháp, lãi, ân hạn, các đợt giải ngân, tổng lãi, tổng trả) tự chuyển sang mục 03, hiện dạng thẻ màu xanh "từ mục 02". Vốn tự có tự tính = giá mua − tổng giải ngân (có thể bỏ chọn để tự nhập).
- Mục 03 thêm phần bổ sung màu cam: bảng phí tất toán trước hạn theo từng đợt giải ngân (theo năm kể từ ngày nhận nợ, mặc định 3/2/1/0/0% là giả định để minh họa) và chi phí/thuế khi bán.
- Bảng dòng tiền thêm 7 cột màu cam: vốn gộp lũy kế (gồm phí tất toán), thuê ròng lũy kế, phí tất toán nếu bán, tiền thu về nếu bán, lãi/lỗ, tỷ suất lợi nhuận trên vốn, tỷ suất quy năm. Bán tại kỳ nào thì trừ dư nợ, phần đợt giải ngân chưa tới hạn và chi phí bán; phí tất toán từng đợt được cộng vào vốn gộp để tính tỷ suất lợi nhuận. Cách tính cuối (theo yêu cầu của Tú): vốn cá nhân đã chi = vốn ban đầu + gốc và lãi đã trả + chi phí giữ nhà + phí tất toán + chi phí bán; doanh thu thuần = giá bán + thuê ròng lũy kế − dư nợ còn lại − phần chưa thanh toán cho chủ đầu tư; lợi nhuận ròng = doanh thu thuần − vốn cá nhân; tỷ suất = lợi nhuận ròng ÷ vốn cá nhân. Các ô nhập tiền hiển thị dấu phẩy ngăn cách hàng nghìn (kết quả cũng dùng dấu phẩy). Phương án JSON và CSV lưu thêm các trường mới (file JSON cũ vẫn mở được). Đã đối chiếu độc lập các cột với công thức, sai lệch bằng 0.

## 2026-10-18 — 2.17.0: Menu "Atlas" xổ xuống + "Bản tính tài chính" (thay Atlas Banking)
- Thanh menu: World Atlas và Atlas VietNam gộp thành một mục "Atlas ▾" xổ xuống (mục tự sáng khi đang ở một trong hai trang). Bấm ra ngoài thì menu tự đóng.
- "Atlas Banking" đổi tên thành **Bản tính tài chính**, địa chỉ mới `/ban-tinh-tai-chinh/`. Không chia kỳ: bấm menu là vào thẳng trang (mục cấu hình `direct: true` trong `site.config.json`; nguồn vẫn ở `publications/atlas-banking/lai-suat-ngan-hang/`, khai báo bằng `src`).
- Đầu trang thêm khung "LƯU Ý QUAN TRỌNG · BẢN MÔ PHỎNG THAM KHẢO": không phải bản tính chính thức/báo giá của ngân hàng, tác giả và website không chịu trách nhiệm. Thêm thanh liên kết nhỏ về các mục của website; đổi tên tiêu đề trang.
- Chuyển hướng 301: `/atlas-banking/`, `/atlas-banking/lai-suat-ngan-hang/` và `/doc/` → `/ban-tinh-tai-chinh/` (`data/redirects.json`).

## 2026-10-17 — Atlas Banking số 01: thay bằng bản v4.6 (đủ 3 thẻ)
- Trang `/atlas-banking/lai-suat-ngan-hang/doc/` thay bằng bản Atlas Banking Vietnam v4.6 do Tú cung cấp: thẻ 01 Lãi suất (22 ngân hàng, mỗi mức kèm nguồn và ngày), thẻ 02 Khoản vay nhiều đợt (mô phỏng vay mua nhà), thẻ 03 Tích góp. Độ phủ: 14/22 ngân hàng có số huy động, 7 có thống kê cho vay bình quân (không phải báo giá vay mua nhà). Lãi suất sau ưu đãi do người dùng tự điền, bảng tính không phải báo giá ngân hàng.
- Lưu nhật ký nguồn dữ liệu v4.6 vào `data/atlas-banking/DATA_SOURCES_v4_6_2026-10-17.json` (chỉ để lưu trong repo, không đưa lên website). Kỳ tiếp theo thêm file mới cùng thư mục, không ghi đè bản cũ.

## 2026-10-17 — Công cụ: Bảng tính Palm River — thay bằng bản mới (bảng giá CĐT 17/10)
- Thay bảng tính Palm River bằng bản Tú cung cấp: chọn căn có giá trong bảng giá CĐT 17/10/2026, gợi ý đơn giá, Early Bird/KH thân thiết không cộng dồn, gói nội thất 268 triệu, quà tặng, hỗ trợ lãi suất 0% trong 24 tháng.
- Bản gửi nhúng 20 ảnh dạng Base64 (~2 MB); đã trả về file WebP tách riêng `img-01…20.webp` sẵn có (giống hệt, không đổi) để trang nhẹ (~90 KB), đúng quy tắc không Base64.
- Giữ nguyên các phần đã ghép: khối Vay Ngân Hàng + PDF trình bày, ô số điện thoại người tư vấn kèm mã QR Zalo, điểm đo lead, `noindex`.

## 2026-10-17 — Công bố Atlas Banking số 01
- Kỳ `lai-suat-ngan-hang` (số 01) chuyển từ nháp sang công bố: hiện trong thư viện `/atlas-banking/`, vào sitemap, bỏ `noindex`.

## 2026-10-17 — 2.16.0: Chuẩn hoá bảng tính các dự án theo phong cách Norton Park + khối vay ngân hàng cho cả 5 dự án
- Khôi phục sau sự cố triển khai: `data/articles.json` và `data/images.json` trên GitHub bị mất bài "Fed tăng lãi suất…" (còn trong `categories.json`) nên build báo lỗi và trang web không cập nhật; đã trả lại. Ba bảng tính Nam Mekong, Norton Park, Palm River được ghép lại giữ nguyên các điểm đo lead (`data-lead-input`, `data-lead-result`, nút "Nhận phương án này") của hệ thống lead.
- Bảng tính Nam Mekong dựng lại theo bố cục/giao diện Norton Park (dùng chung `assets/tools/shared/bang-tinh.css`): thông tin căn, thuế & phí, chiết khấu, thanh tổng giá bán, so sánh 5 phương thức, lịch thanh toán theo giai đoạn, điều khoản. Giữ nguyên chọn tòa/tầng/căn, mặt bằng, ghim vị trí, phóng to ảnh.
- Sửa số liệu Nam Mekong: tiền booking 50.000.000 đ trước đây bị cộng dư vào tổng lịch thanh toán (tổng lệch giá cuối đúng 50 triệu). Nay booking được trừ vào Đợt 1; tổng lịch thanh toán khớp tổng giá bán ở cả 5 phương thức. VAT, KPBT, tiền booking giờ chỉnh được.
- Norton Park, Palm River, SkySOLIS, Artisan Park: thêm khối "Vay Ngân Hàng" (module dùng chung) theo chính sách từng phương thức, kèm nút "PDF Trình Bày (A4, có phương án vay)". Các nút/PDF báo giá cũ giữ nguyên.
- Module vay: thêm `NATLoan.deckPages` (trang báo giá, lịch thanh toán, so sánh dùng chung); nới dung sai 1.000 đ khi so với trần vay để tránh cảnh báo sai do làm tròn.
- Artisan Park chưa có phương thức vay riêng → khối vay mô phỏng khách tự vay thêm tại đợt bàn giao. SkySOLIS không có hỗ trợ lãi trong bảng chính sách → mặc định không hỗ trợ lãi.
- Ô "Số điện thoại của người tư vấn" (đổi tên từ "SĐT Chuyên Viên") có ở cả 5 bảng tính; khi xuất PDF (cả bản trình bày lẫn bản báo giá cũ) tự hiện số điện thoại kèm mã QR Zalo `zalo.me/<số>`. Mã QR tự viết trong `assets/tools/shared/zalo-qr.js` (không thư viện ngoài, tạo ngay trên máy người dùng, không gửi số đi đâu); đã quét thử cả 9 bản PDF đều ra đúng liên kết. Artisan Park thêm ô nhập khách hàng/tư vấn/số điện thoại.

## 2026-10-17 — Công cụ: Bảng tính Nam Mekong — khối vay ngân hàng + xuất PDF A4 (bản mẫu, chưa nhân sang dự án khác)
- Thêm module dùng chung `assets/tools/shared/vay-ngan-hang.js` (không thư viện ngoài, biểu đồ SVG tự vẽ, chỉ nạp ở trang bảng tính). Bảng tính Nam Mekong gắn khối "Phương án vay ngân hàng theo từng phương thức" dưới phần so sánh.
- Khoản vay lấy theo chính sách từng phương thức: Vay NH 30% (ngân hàng giải ngân 65% giá trị căn, T2) và Vay NH 20% (50%, T2), kèm hỗ trợ lãi suất của chủ đầu tư (tối đa 70% giá trị căn, 24 tháng, vay tối đa 35 năm). TT Chuẩn, TT Sớm 70%, TT Sớm 95% không có vay theo chính sách; TT Chuẩn và TT Sớm 70% có ô "vay thêm tại đợt bàn giao" (mặc định 0%) để xem phương án tự vay.
- Lãi suất là giả định do người dùng nhập (mặc định ưu đãi 7%/năm trong 12 tháng, thả nổi 10,5%/năm, vay 25 năm), không gắn tên ngân hàng; có cách trả gốc + lãi chia đều hoặc gốc đều lãi giảm dần, ân hạn gốc, tỷ lệ và số tháng chủ đầu tư hỗ trợ lãi (mặc định giả định chịu 100% lãi trong 24 tháng, sửa được). Cảnh báo khi khoản vay vượt mức tối đa theo chính sách.
- Khoản khách trả hàng tháng: bảng theo giai đoạn (được hỗ trợ lãi / ưu đãi / thả nổi, gốc đều hiện mức đầu → cuối), bảng trả nợ từng tháng đầy đủ trong trang và 30 tháng đầu trong PDF.
- Hiển thị: 5 chỉ số chính, dòng thời gian khoản vay, biểu đồ tiền trả mỗi năm (gốc, lãi khách trả, lãi chủ đầu tư hỗ trợ), dư nợ theo năm, bảng trả nợ theo năm, so sánh tổng chi phí sở hữu giữa 5 phương thức.
- Nút "Xuất PDF trình bày (A4)": 8 trang dọc (báo giá căn kèm mặt bằng, lịch thanh toán, so sánh phương thức, phương án vay, bảng trả nợ từng tháng, bảng trả nợ theo năm, so sánh tổng chi phí, lưu ý). Dùng hộp thoại in của trình duyệt, chọn "Lưu dạng PDF".
- Kiểm tra: công thức niên kim, gốc đều và tổng lãi hỗ trợ khớp tính tay; chạy thử trên trình duyệt (máy tính, điện thoại), không lỗi JS, không tràn ngang.

## 2026-10-17 — 2.15.0: Menu mới "Atlas Banking" (bản nháp)
- Thêm mục **Atlas Banking** (`/atlas-banking/`) vào thanh menu NAT, nằm sau "Atlas VietNam". Cùng cơ chế ấn phẩm theo kỳ: khai báo trong `site.config.json` → `publications` (`navKey: nav_atlasbank`), nội dung ở `publications/atlas-banking/<kỳ>/`. Không đổi CSS/JS.
- Kỳ đầu `lai-suat-ngan-hang`: dựng từ báo cáo quét nguồn ATLAS_BANKING v4.5 (quét 17/10/2026): 22 ngân hàng theo dõi, 12 có số huy động, 7 có bình quân cho vay chung, 10 chưa điền; hai chỉ số bổ sung của LPBank; ba cảnh báo nguồn (UOB, HDBank, VIB). Trang chỉ trình bày số có trong file, không thêm số mới.
- Trạng thái **nháp** (`trang-thai: nhap`): trang không hiện trong thư viện, không vào Google, có dải "BẢN NHÁP". Menu hiện ngay khi đẩy lên GitHub, thư viện hiện "Chưa có ấn phẩm được công bố" cho tới khi công bố kỳ. Ảnh bìa tạm dùng ảnh trang chủ.

## 2026-10-17 — Công cụ: Bản đồ dự án — nền vệ tinh, sửa vị trí dự án Bình Dương

- Nền bản đồ: thêm nút chọn nền ở góc phải, mặc định "Vệ tinh" (ảnh Esri World Imagery kèm lớp tên đường, địa danh của Esri), vẫn chọn được "Bản đồ đường" (OpenStreetMap). Trình duyệt nhớ lựa chọn của người xem. Đoạn vành đai có viền trắng để nổi trên ảnh vệ tinh.
- Vị trí dự án: Artisan Park lấy tọa độ từ liên kết Google Maps trên trang chính thức Gamuda Land (vị trí cũ lệch khoảng 9,5 km); One Central Saigon theo Guland (lệch khoảng 160 m); Nam Mekong Grand Plaza dời về khu vòng xoay WTC, Thành phố mới Bình Dương (vị trí cũ lệch khoảng 9 km), vẫn ghi là vị trí gần đúng. Norton Park, Blanca City, Sun Thủ Thiêm 2C, The Petropolis ghi rõ mốc vị trí gần đúng.
- Rà các dự án lớp 2017 ở Thủ Đức theo ranh giới phường (dữ liệu Free-GIS-Data): tọa độ CBRE/Guland khớp phường ghi trong địa chỉ hoặc nằm sát ranh giới.

## 2026-10-17 — Công cụ: Bản đồ dự án — nhẹ hơn khi phóng to, chỉ hiện dữ liệu đã xác minh

- Hiệu năng: chuyển các lớp tuyến, ga, vòng bán kính sang vẽ bằng canvas, bỏ lớp bấm trùng, nhãn ga cập nhật trễ 0,18 giây, nền bản đồ không tải lại ô trong lúc đang phóng. Đo thử 20 lần phóng to/thu nhỏ: khung hình chậm nhất giảm từ khoảng 730 ms xuống khoảng 33 ms; số phần tử trên bản đồ giảm từ 449 xuống 157.
- Vành đai: mặc định chỉ hiện các đoạn vẽ theo đường thật; đoạn ước lượng ẩn, bật lại bằng ô "Hiện cả đoạn vành đai ước lượng".
- Vị trí dự án: 7 dự án Cẩm Nang lấy lại tọa độ có nguồn (CBRE, Guland): The MarQ, Grand Marina, Eaton Park, Palm River, Global City (lệch khoảng 1,45 km), SkySOLIS (lệch khoảng 2 km), Vinhomes Green Paradise (lệch khoảng 5,6 km). 7 dự án còn lại chưa có tọa độ có nguồn, hiện bằng chấm nhỏ mờ viền đứt. Lớp dự án 2017 bỏ các dự án trùng với lớp Cẩm Nang (thông tin mở bán đưa vào popup dự án gốc) và mặc định ẩn 9 dự án vị trí ước lượng.

## 2026-10-17 — Công cụ: Bản đồ dự án — vành đai và metro theo đường thật

- Lấy hình học đường từ OpenStreetMap qua dịch vụ định tuyến OSRM (router.project-osrm.org; ODbL), kiểm tra từng đoạn bằng chiều dài trả về: Vành đai 2 đoạn Quốc lộ 1 (Gò Dưa – An Sương – An Lạc) và Nguyễn Văn Linh – cầu Phú Mỹ – Võ Chí Công; Vành đai 1 đoạn Phạm Văn Đồng và Bạch Đằng – Trường Sơn – Trần Quốc Hoàn – Hoàng Văn Thụ; Vành đai 3 đoạn Long Trường – cầu Nhơn Trạch; Metro Thủ Dầu Một – Tao Đàn đoạn Đại lộ Bình Dương.
- Vành đai 1 sửa thành tuyến hở 4 đoạn (khoảng 26,4 km) thay vì vòng khép kín; nút Linh Đông và Gò Dưa đặt lại theo đường thật.
- Vành đai hiển thị hai mức: dải đậm là đoạn theo đường thật, dải mờ nét chấm là đoạn ước lượng hoặc chưa xây.

## 2026-10-17 — Công cụ: Bản đồ dự án — lớp "Dự án mở bán từ 2017" (đợt 1: TP.HCM cũ)

- Thêm dữ liệu `assets/tools/ban-do-du-an-hcm/du-an-2017.json`: 55 dự án căn hộ và thấp tầng ở TP.HCM cũ, mỗi dự án có chủ đầu tư, vị trí, quy mô, khởi công, mở bán và giá mở bán, bàn giao, giá hiện tại (giá rao/giá chào kèm thời điểm), tọa độ (CBRE hoặc Guland; 9 dự án ước lượng theo địa chỉ), độ tin cậy và nguồn.
- Bản đồ thêm lớp ô vuông màu theo tình trạng bàn giao, lọc theo năm mở bán, loại hình, bàn giao; popup có ga gần nhất, khoảng cách tới tuyến, nguồn; tìm kiếm và liên kết chia sẻ dạng #q=…
- File rà soát cho Tú: ra-soat-du-an-2017-nay-dot-1.xlsx (không đưa vào kho).

## 2026-10-17 — Công cụ: Bản đồ dự án TP.HCM — cập nhật dữ liệu và tăng tương tác

- Đánh dấu đoạn ngầm (gạch đen hai bên tuyến) và đoạn trên cao (viền trắng) cho Tuyến 1, Tuyến 2 (cả đoạn Thủ Thiêm), Thủ Dầu Một – Tao Đàn, Bến Thành – Cần Giờ, Bình Dương – Suối Tiên; có nút bật/tắt và chú giải. Tuyến 6, Thủ Thiêm – Long Thành và Tuyến 2 nối dài chưa công bố vị trí đoạn ngầm nên chưa tô.

- Rà lại vị trí ga: Tuyến 1 lấy đủ 14 ga theo bản đồ ga của hochiminhcitymetro.com (sửa ga Ba Son lệch khoảng 650 m và ga Bình Thái lệch khoảng 470 m); ga Thủ Thiêm (Tuyến 2 và Thủ Thiêm – Long Thành) theo bản đồ riêng của ga; đối chiếu ga Bà Quẹo khớp trong 10 m. Mỗi tuyến ghi rõ nguồn và độ tin cậy của vị trí ga trong cửa sổ thông tin.

- Dữ liệu: Metro số 2 Thủ Dầu Một – Tao Đàn theo hướng tuyến UBND TP.HCM duyệt (33,2 km, 24 ga, C0–C10 trên cao, C11–C23 ngầm, depot Hiệp Bình Phước); Metro số 2 nối dài đến ranh Tây Ninh (Viet Him Lam đề xuất, khởi công quý IV/2026); Bến Thành – Cần Giờ: đoạn Bến Thành – Tân Thuận đi ngầm, Tân Thuận – Cần Giờ trên cao; Tuyến 6: hướng tuyến nối ba nhà ga Tân Sơn Nhất, depot Bình Triệu, khoảng 3,3 tỷ USD. Eaton Park xác minh đã bán hết (bàn giao từ quý III/2027).
- Tương tác: ô tìm dự án/ga/tuyến (gõ không dấu được, dùng phím mũi tên); nút "Xem" đưa bản đồ tới từng tuyến; tên ga hiện khi phóng to từ mức 14; ga ngầm tô đặc; bật vòng 500 m quanh ga (TOD); popup dự án có ga gần nhất và khoảng cách tới hướng tuyến; vẽ vòng 500 m/1 km quanh dự án hoặc ga; công cụ đo khoảng cách, vị trí của tôi, về toàn cảnh; thước tỷ lệ; liên kết chia sẻ (#p=…, #l=…, #s=…) để mở thẳng một dự án, tuyến hoặc ga; popup gọn hơn và cuộn được trên điện thoại.

## 2026-10-16 — Công cụ: Bản đồ dự án TP.HCM, metro và vành đai (bản xem thử, chưa gắn vào bài)

- Cửa sổ thông tin và danh sách tuyến của 9 dự án MAUR ghi thêm: chiều dài, số ga, tuyến nổi hay ngầm (số km và số ga), danh sách tên ga, depot. Ga Tuyến 1 và Tuyến 2 đoạn Thủ Thiêm ghi rõ ga ngầm hoặc ga trên cao. Dự án nào nguồn chưa nêu thì ghi "chưa rõ".

- Theo yêu cầu của Tú, lớp metro chính hiển thị 9 dự án MAUR (Tuyến 1; Tuyến 2 Bến Thành – Tham Lương; Bến Thành – Cần Giờ; Bến Thành – Thủ Thiêm; Thủ Thiêm – Long Thành; Tuyến 6 giai đoạn 1; Tuyến 1 kéo dài Bình Dương – Suối Tiên; Thủ Dầu Một – Tao Đàn; Tuyến 2 nối dài Tham Lương – An Hạ – Tây Bắc). Các tuyến quy hoạch 2040 chuyển sang mục "Quy hoạch metro dài hạn", mặc định ẩn.

- Vành đai 1–4 đổi kiểu hiển thị khác metro: dải màu rộng mô phỏng đường bộ, nét gạch chấm, không có vòng tròn ga; ô chú giải bên trái đổi theo.

- Vẽ lại đường đi theo tọa độ ga trên bản đồ quy hoạch (Ankapong, số hóa đồ án điều chỉnh quy hoạch chung TP.HCM sau sáp nhập): Tuyến 1 (vận hành, phía tây, kéo dài Biên Hòa – Long Thành), 3, 4, 5, 7, 8, 9, 10, Thủ Thiêm – Long Thành, Bến Thành – Cần Giờ. Tuyến 3A gộp vào Tuyến 3 theo quy hoạch mới. Vành đai 1 và 2 vẽ lại theo mốc nút giao. Cổng quyhoachquocgia.mpi.gov.vn không truy cập được từ môi trường làm việc.

- Tú duyệt gắn bản đồ: thêm mục "Bản đồ" vào thanh điều hướng chung (templates/partials/global-nav.html) và khung nút "Mở bản đồ" trong 3 bài: truc-metro-so-1-hcm, muc-tieu-metro-hcm-2030, mo-hinh-tod-hanh-lang-metro.

- Bổ sung đủ Tuyến 7, 8, 9, 10 (hướng tuyến sơ đồ, ghi chú nguồn hochiminhcitymetro.com). Tổng 18 tuyến metro và 4 vành đai.
- Tuyến 6 giai đoạn 1 (17 ga), tuyến TP mới Bình Dương – Suối Tiên (17 ga) và 4 ga Thủ Thiêm – Long Thành dùng tọa độ từ bản đồ My Maps; Tuyến 1 lấy 3 ga có tọa độ, các ga còn lại nội suy.
- Tuyến Thủ Dầu Một – Tao Đàn neo ga đầu (S5) và cầu Bình Lợi; đoạn giữa là sơ đồ (bản đồ My Maps của tuyến này chưa đọc được).
- Sửa tên ga Tuyến 2 đoạn Thủ Thiêm thành Đại lộ Vòng Cung; cập nhật số liệu Cần Giờ, Tuyến 4, 4B, 5.
- Thêm công cụ tĩnh `assets/tools/ban-do-du-an-hcm/` (noindex): bản đồ OpenStreetMap, 14 dự án trong Cẩm Nang đánh dấu theo tình trạng (chưa mở bán / đang mở bán / đã mở bán), thống kê số dự án theo bộ lọc tình trạng và khu vực. Dữ liệu nằm trong khối JSON ở đầu file.
- Metro: Tuyến 1 (14 ga, đang chạy), Tuyến 2 (11 ga, đang xây), cùng Tuyến 2 Bến Thành – Thủ Thiêm, Tuyến 2 nối dài Tham Lương – Tây Bắc, Thủ Dầu Một – Tao Đàn, Tuyến 1 kéo dài về TP mới Bình Dương, Tuyến 3, 3A, 4, 4B, 5, 6, đường sắt Thủ Thiêm – Long Thành và Bến Thành – Cần Giờ; Vành đai 1, 2, 3, 4. Nét liền = đang vận hành, nét đứt = đang xây, nét chấm = nghiên cứu/đề xuất. Mỗi tuyến bật/tắt riêng, có chiều dài, tình trạng, nguồn.
- Tuyến 2: 11 ga giai đoạn 1 và 6 ga giai đoạn 2 (Hàm Nghi – Thủ Thiêm) lấy theo bản đồ Google My Maps "Line 2 HCMC Metro" do Tú gửi link (ghi chú của bản đồ: vị trí gần đúng, không chính thức).
- Tuyến 3 đổi hướng tuyến theo hochiminhcitymetro.com: An Hạ (Bình Chánh) – Tân Kiên – Cộng Hòa – Hiệp Bình Phước, 45,8 km (bản trước vẽ nhầm lên Củ Chi). Tuyến 3A: 17 ga (10 ngầm, 7 trên cao).
- Chỉ Tuyến 1 và Tuyến 2 có tên ga; các tuyến còn lại là hướng tuyến sơ đồ nối các điểm đầu – cuối, vì tài liệu công bố chưa có tên ga hay tọa độ.
- Thư viện Leaflet 1.9.4 (BSD-2) được lưu ngay trong `vendor/` của công cụ, không tải từ CDN; nền ô bản đồ lấy từ tile.openstreetmap.org (có ghi nguồn). Tú duyệt dùng Leaflet + OpenStreetMap ngày 2026-10-15.
- Vị trí dự án và nhà ga là tham chiếu khu vực; 5/14 dự án chưa xác minh tình trạng mở bán và được vẽ bằng vòng rỗng. Chưa có nút mở bản đồ trong bài nào.

## 2026-10-15 — Ấn phẩm: Chỉ số đô thị — báo cáo Mật độ Đô thị Nén thêm tab phân tích mô hình và clip bản đồ
- `urban-compactness-report.html` thay bằng bản mới của Tú: thêm hai tab "Phân tích mô hình" và "Phố & nút giao", cùng 3 clip bản đồ Hong Kong, Tokyo, Singapore. Giữ nguyên thư mục kỳ, URL (`/chi-so-do-thi/2026-10-05-mat-do-do-thi-nen/doc/`), `bia.jpg`, trạng thái `cong-bo`; `info.txt` đổi ngày 2026-10-15.
- Clip (mp4 + ảnh poster, 3 × ~12–15 MB) đặt ở `assets/clips/do-thi-nen/`; đường dẫn trong báo cáo đổi thành `/assets/clips/do-thi-nen/…` vì build chỉ xuất file HTML của kỳ vào `/doc/`. Video `preload="none"` nên không tải khi chưa bấm phát.
- Bản mới thiếu khung `<!doctype>/<head>/<body>`; đã thêm lại giống bản trước để trình duyệt không chạy chế độ quirks.
- Dọn các bản sao clip thừa ở thư mục gốc kho (`clips/`, `bao-cao-do-thi-nen/`, `*.mp4`, `*.jpg` ở gốc) — xem `DELETED_FILES.txt`. Không đổi giao diện, CSS/JS hay version.

## 2026-10-14 — Ấn phẩm: Chỉ số đô thị — thay báo cáo Mật độ Đô thị Nén bằng bản dựng lại
- `publications/chi-so-do-thi/2026-10-05-mat-do-do-thi-nen/urban-compactness-report.html` thay bằng bản mới của Tú (14 khu đô thị, 5 chỉ số Core có nguồn, thay toàn bộ số ước lượng bản cũ). Giữ nguyên thư mục kỳ và URL (`/chi-so-do-thi/2026-10-05-mat-do-do-thi-nen/doc/`), `bia.jpg`, trạng thái `cong-bo`.
- `info.txt`: cập nhật tiêu đề, mô tả, trích đoạn, ngày 2026-10-14 (bản cũ ghi "ước lượng", "11 chỉ số", "Vũng Tàu" không còn đúng).

## 2026-10-13 — Nội dung: bài mới "Fed Tăng Lãi Suất: Vì Sao Việt Nam Chịu Áp Lực?" (chương Tư duy đầu tư)
- Thêm bài `fed-fdi-etf-ty-gia-viet-nam` (`/cam-nang/fed-fdi-etf-ty-gia-viet-nam/`) từ gói hồ sơ Fed–FDI–ETF–tỷ giá của Tú; thêm vào cuối chương 03, badge "4 bài phân tích". Cấu trúc 7 mục theo gợi ý trong hồ sơ, kèm 3 kịch bản, bảng chỉ số theo dõi theo quý, hộp phân tầng nguồn và danh sách nguồn đối chiếu.
- Đã kiểm chứng lại các số liệu mà hồ sơ cảnh báo chưa xác minh (đến 13/10/2026): Fed tăng 25 điểm cơ bản ngày 16/9 lên 3,75–4,00% (CNBC, Dân trí); FDI 9 tháng 50,36 tỷ USD đăng ký, 21,07 tỷ USD thực hiện (Cục Thống kê, 3/10); FTSE Russell nâng hạng hiệu lực 21/9/2026; NHNN giữ nguyên lãi suất điều hành, bơm thanh khoản 21/9 (họp báo 7/10); khối ngoại bán ròng hơn 100.000 tỷ đồng đến 7/10. Các số ETF 1,67 / 5–6 / 8 tỷ USD ghi rõ là dự báo của công ty chứng khoán.
- 4 hình minh họa do tác giả dựng từ số liệu trên (sơ đồ chuỗi truyền dẫn, bảng so sánh FDI–ETF–quỹ chủ động, biểu đồ FDI 9 tháng, biểu đồ khối ngoại bán ròng), khổ dọc cho điện thoại; không dùng ảnh bên thứ ba. Ảnh OG cắt từ ảnh đầu bài.
- Chưa có: số dự trữ ngoại hối, xuất nhập khẩu, kiều hối (ghi "Đang cập nhật" trong bảng chỉ số). Không đổi giao diện, CSS/JS hay version.

## 2026-10-13 — Nội dung: Nam Mekong Grand Plaza — thay bảng tính bằng bản mới của Tú
- `assets/tools/nam-mekong-bang-tinh/index.html` thay bằng bản mới: thêm khối "So sánh giá cuối & thời hạn dòng tiền giữa các phương thức" (giá cuối, chênh lệch VNĐ và %, thời hạn dòng tiền, vốn khách tự bỏ ra của 5 phương thức; dòng đang chọn tô nổi).
- Giữ nguyên các chỉnh sửa khung của site: `noindex, nofollow`, khung rộng 2 cột trên máy tính, tự phóng to ảnh mặt bằng (`zoom.js`). 26 ảnh nhúng base64 trong file mới trùng nội dung với ảnh WebP đang có (đã so sánh) nên dùng lại, không thêm ảnh; file HTML 80 KB thay vì 5,1 MB.

## 2026-10-12 (bảng tính) — Nội dung: Palm River — đưa bảng tính phương thức thanh toán vào web
- Thêm công cụ tĩnh `assets/tools/palm-river-bang-tinh/` từ file `PalmRiver_BangTinh_PTTT.html` của Tú (noindex): giữ nguyên logic và giao diện; chỉ tách 21 ảnh Base64 (mẫu căn, mặt bằng tầng) thành 20 file WebP (620 KB, file HTML từ 2,1 MB còn 71 KB) và thêm thẻ noindex.
- Trang `palm-river` mục Giá & Chính sách có khối nút "Mở bảng tính ngay" (mở tab mới), giống Nam Mekong và Norton Park; câu trả lời Hỏi & Đáp về giá dẫn tới bảng tính.

## 2026-10-12 (bổ sung) — Nội dung: Palm River — thêm ảnh, Prologue, góc nhìn, SWOT, thang điểm, chính sách; chuyển sang published
- Thêm Prologue và thông điệp "Một resort giữa lòng thành phố"; mục 03 "Vì sao tôi chọn Palm River?" (cư dân / nhà đầu tư) và mục 04 SWOT + thang điểm theo bản Word của Tú (sửa lỗi chính tả, giữ ý). Điểm: Vị trí 4,20 · Cư dân 4,14 · Nhà đầu tư 4,00 · tổng 3,97/5.
- Giá & chính sách: 4 phương án thanh toán (Chuẩn, Đặc biệt, Vay, Nhanh), ưu đãi mua nhiều căn, theo tài liệu chủ đầu tư. Ưu đãi Early Birds đã hết hạn (30/9/2026) nên không trình bày như đang áp dụng. Chưa có giá tham chiếu.
- 27 ảnh (phối cảnh CĐT, tổng mặt bằng, tiện ích, 6 mặt bằng tầng, 6 mẫu căn): ảnh phối cảnh xử lý tông ấm, bản đồ 70%, mặt bằng giữ nguyên; không có logo cần xóa. Không dùng 3 ảnh GPT (chưa rõ nguồn) và ảnh có chữ "PALM CITY".
- Cập nhật website dự án palm-city.com.vn/palm-river, hồ sơ năng lực Hướng Việt; diện tích Palm City ghi "hơn 30 ha" (brochure CĐT 30,2 ha, ERA/thông cáo 30,6 ha).
- Bố cục chi tiết kiểu Norton Park: ảnh kèm từng nhóm tiện ích (hồ bơi & trị liệu, thể thao & gia đình, thư giãn & cảnh quan), ảnh tổng mặt bằng ở Vị trí, bốn panel phương án thanh toán với số liệu nổi bật, dải vuốt ngang 6 mặt bằng tầng (tháp 3, tháp 4) và 6 mẫu căn tiêu biểu (cắt từ tờ rơi, bỏ phần có logo ERA); bỏ bảng diện tích dài.
- Trạng thái đổi `stub` → `published`; tạo lại ảnh OG từ ảnh hero. Chưa có: clip giới thiệu, tham quan 360° (cần duyệt host nhúng), giá tham chiếu, tổng thầu, FAR.

## 2026-10-12 — Nội dung: Palm River — dựng trang dự án từ landing ERA (chưa có ảnh, chưa có SWOT)
- Bài `palm-river` (phân khu của Palm City) viết lại theo khung trang dự án 01–04: Tổng quan (vị trí + thời gian di chuyển, quy mô, nhà phát triển, giai đoạn) · Chi tiết (giá & chính sách, loại hình, phối cảnh, tiện ích, ngoại khu) · Góc nhìn · Phân tích & đánh giá + 7 câu Hỏi & Đáp. Thêm dải số liệu `facts` (620 căn hộ · 36 tầng · 1,89 ha · Q1/2029), cập nhật tiêu đề SEO, mô tả, từ khóa, tag, bài liên quan; tạo lại ảnh OG.
- Nguồn: landing ERA (cập nhật 9/2026) đối chiếu báo chí: Tuổi Trẻ/KTSG (16/6/2026), Thị trường Tài chính Tiền tệ (16/6/2026), thông cáo Hướng Việt Properties đăng VietnamPlus (13/8/2026). Số khớp giữa các nguồn: 4 tháp, 36 tầng, 1,89–1,9 ha, mật độ ~40%, khởi công 16/6/2026, bàn giao dự kiến Q1/2029.
- Số liệu lệch giữa các nguồn, đã ghi theo tài liệu dự án và cần Tú xác nhận: tổng diện tích Palm City 30,6 ha (ERA, thông cáo) so với 30,2 ha (một số báo); tiện ích nội khu 68 (ERA, brochure CĐT) so với "hơn 40" (thông cáo 13/8); ERA ghi "2,7 km mặt tiền sông" cho khu đất 1,89 ha, không ghép được với các nguồn khác nên không đưa vào.
- Thời gian di chuyển và mốc metro Thủ Thiêm – Long Thành 2030 là số của tài liệu chủ đầu tư, đã ghi rõ nguồn; trang dẫn tới `muc-tieu-metro-hcm-2030` để đối chiếu tiến độ thực tế.
- Phần chưa có: giá và chính sách (landing không công bố), clip giới thiệu, bảng tính, tham quan 360°, website chủ đầu tư, tổng thầu, FAR, toàn bộ ảnh, "Vì sao tôi chọn", SWOT và thang điểm 1–5. Các mục này để khối "Nội dung đang được cập nhật" hoặc "Đang cập nhật".
- Trạng thái giữ `stub` (noindex) cho tới khi Tú bổ sung phần phân tích; chưa đổi `categories.json`, `pages.json` hay bài `palm-city`. Không đổi giao diện, CSS/JS hay version.

## 2026-10-13 — Nội dung: Norton Park — thay bảng tính bằng bản mới của Tú
- `assets/tools/norton-park-bang-tinh/index.html` thay bằng bản mới: PT 01 tính theo giá niêm yết và chiết khấu từng phương thức (mặc định 5% · 1% · 2% · 10% · 0%), PT 05 đổi tên "Thanh Toán Vay" (chủ đầu tư hỗ trợ lãi suất tối đa 10% trong 24 tháng).
- Giữ nguyên chỉnh sửa khung của site: `noindex, nofollow`, canonical về trang Norton Park; 16 ảnh Base64 trong file mới không đưa vào, dùng lại ảnh webp đã tách file (nội dung ảnh không đổi).

## 2026-10-12 — Nội dung: Norton Park — thay bảng tính phương thức thanh toán bằng bản mới của Tú
- `assets/tools/norton-park-bang-tinh/index.html` thay bằng bản mới (đủ tầng 1–19, mặt bằng theo nhóm tầng, mã căn dạng Tháp.Tầng.Căn). Giữ noindex và canonical về bài.
- Ảnh nhúng Base64 trong bản gốc được tách thành file WebP (mặt bằng 7 nhóm tầng + 9 layout), bỏ các ảnh của bản cũ không còn dùng.

## 2026-10-12 — v2.14.0: dải cuộn ngang `.p-hscroll` + chỉnh lần 3 trang mặt bằng Norton Park
- `assets/css/main.css`: thêm `.p-hscroll` (cuộn ngang, scroll-snap) cho nhóm thẻ/ảnh dài; version 2.14.0.
- Bài `norton-park`: "Mẫu căn tiêu biểu" và mặt bằng tầng điển hình dùng đúng ảnh trong tờ rơi PDF (ảnh 31–45), xếp dải cuộn ngang thay cho cuộn dọc.
- Trang `norton-park-mat-bang`: bỏ chấm đỏ thừa trên mặt bằng tầng, loại căn khác giữ màu gốc nhạt đi, loại được chọn nổi màu đầy đủ kèm viền; mặt bằng tiện ích dựng lại độ phân giải cao, 57 điểm đánh dấu (xanh: Phân khu B, đỏ: công viên) liên kết hai chiều với danh sách, có lọc nhóm và phóng/thu.

## 2026-10-12 — Nội dung: Norton Park — trang "Mặt bằng tầng & mẫu căn" và danh mục tiện ích Phân khu B
- Thêm trang công cụ tĩnh `assets/tools/norton-park-mat-bang/` (noindex, không thư viện ngoài, ảnh tách file WebP): chọn loại căn (Studio, 1PN+, 2PN, 2PN+, 3PN, căn hộ sân vườn, Duplex, Duplex sân vườn) thì mặt bằng tầng 1, 2, 3, 4–9, 10–15, 16 & 18, 17 & 19 tô sáng đúng các căn thuộc loại đó (theo bảng màu loại căn của tài liệu chủ đầu tư), kèm layout nội thất 22 mẫu, diện tích, cảnh quan, mã căn tương đương và số căn của từng mẫu trên tầng điển hình 4–9. Có mặt bằng tiện ích Phân khu B (30 hạng mục khuôn viên + 24 hạng mục công viên) lọc theo nhóm. Có nút phóng to (dùng `zoom.js` sẵn có).
- Số liệu lấy từ tờ rơi Phân khu B (10/2026): 3 tòa, 645 căn, 95% căn 2 mặt thoáng, bố trí công năng theo tầng, bảng "loại tương đương" của từng mẫu. Vị trí căn trên tầng 4–9 dùng dữ liệu mặt bằng đã có trong bảng tính Norton Park, đối chiếu lại với nhãn trên mặt bằng PDF (căn B1.1a/B1.1b thuộc nhóm mẫu B1.4, không phải B1.3).
- Chỉnh lần 2 (Tú yêu cầu): mặt bằng tầng đổi cách hiển thị, các căn được chọn viền cam đậm, loại khác chuyển xám nhạt; bài `norton-park` tinh gọn mục Cơ Cấu Sản Phẩm (bỏ hai thẻ trùng và cột "Mã căn", còn một bảng), đưa khối "Xem mặt bằng & layout" lên ngay trước Mẫu Căn Tiêu Biểu, bỏ thẻ liên kết mô hình 3D và thay bằng thẻ "Tham Quan 360°" trỏ tour chính thức (mở tab mới, không nhúng). Thư mục `assets/tools/norton-park-3d/` vẫn còn trên kho nhưng không còn liên kết tới; có thể xóa khi tiện.
- Bài `norton-park`: thêm khối nút mở trang mặt bằng ở mục 02, danh mục tiện ích Phân khu B và bố trí công năng theo tầng; bổ sung "3 tòa, 645 căn" vào mô tả Phân khu B; cập nhật `updatedDate`. Không đổi URL, giao diện hay CSS/JS (không tăng version).

## 2026-10-12 — Nội dung: Chỉ số đô thị — thay báo cáo Mật độ Đô thị Nén bằng bản mới của Tú
- `publications/chi-so-do-thi/2026-10-05-mat-do-do-thi-nen/urban-compactness-report.html` thay bằng bản mới (giữ nguyên thư mục kỳ, URL `/chi-so-do-thi/2026-10-05-mat-do-do-thi-nen/doc/`, `info.txt` và `bia.jpg`; trạng thái vẫn `cong-bo`).
- Khác bản cũ: hai biểu đồ có ô chọn "Benchmark quốc tế" (12 đô thị: Hong Kong, Paris, Barcelona, Tokyo, Singapore, Seoul, Copenhagen, Ahmedabad, Curitiba, Thâm Quyến, Medellín, Portland). Radar so TP.HCM hiện trạng, Bình Dương, Vũng Tàu với benchmark chọn; Gap Analysis đặt TP.HCM hiện trạng, TP.HCM mục tiêu cạnh benchmark chọn (bản cũ cố định Hong Kong và so Hà Nội). Ma trận, 15 mô hình, tab Việt Nam, khung 11 chỉ số và nguồn giữ nguyên.
- Bản Tú gửi tải Chart.js từ CDN; không đưa vào vì trái §12.9. Hai biểu đồ vẽ bằng SVG thuần như bản đang chạy (màu theo chế độ sáng/tối), không thêm thư viện nào.
- Kiểm thử: build 0 lỗi, `check-dist` ĐẠT; trình duyệt desktop 1360 px và điện thoại 390 px: không lỗi JavaScript, không cuộn ngang, đổi benchmark vẽ lại đúng, không có yêu cầu mạng tới bên thứ ba ngoài Google Fonts đã có sẵn.

## 2026-10-11 — v2.13.2: sửa lỗi dấu tiếng Việt bị tách (ố, ắ, ầ, ế…) trên Windows
- Nguyên nhân: font Georgia trên Windows không có dấu chồng (mũ + dấu sắc/huyền…), trình duyệt tự ghép nên dấu rời khỏi chữ.
- `assets/css/main.css`: tiêu đề bài, thẻ thư viện dùng `'Noto Serif'` (tải qua Google Fonts, có tiếng Việt) rồi mới tới Georgia; `site.config.json` thêm font Noto Serif, version 2.13.2.
- Nhật san kỳ 3: nhúng sẵn Noto Serif (latin + vietnamese) trong file nên hiển thị đúng dù offline/in PDF.
- Nhật san kỳ 1, kỳ 2: thêm Noto Serif làm font dự phòng cho các ký tự font nhúng "News Serif" còn thiếu (ỡ, ỷ, ẹ…).
- Đã rà Atlas, VietNam Atlas, Chỉ số đô thị và các công cụ: dùng font sans/Playfair/Be Vietnam Pro/Space Grotesk có đủ tiếng Việt, không cần sửa.
- Kiểm thử: build 0 lỗi, `check-dist` ĐẠT, kiểm tra font thực dùng bằng trình duyệt.

## 2026-10-11 — Nội dung: bảng tính SkySOLIS bản mới (bảng giá căn 09/10/2026)
- `assets/tools/skysolis-bang-tinh/index.html` thay bằng bản "Bảng tính chiết khấu & 3 phương thức thanh toán" mới của Tú: thêm 43 căn có giá niêm yết sẵn (bảng giá 09/10/2026, chưa VAT & KPBT; 36 căn trong bảng + 7 căn ngoài bảng đánh dấu *), tab mặc định "💰 Có giá sẵn", căn mặc định C.07.06, nhãn "GIÁ NIÊM YẾT 09/10" và ghi chú nguồn giá.
- Giữ nguyên các chỉnh sửa khung của site đã áp dụng cho bản trước: `noindex, nofollow`, khung rộng 1440px, tự phóng to ảnh mặt bằng (`zoom.js`). 4 ảnh mặt bằng nhúng base64 trong file mới (cùng kích thước 1700 px, cùng nội dung) được thay bằng 4 file WebP đang có sẵn, nên trang vẫn nhẹ (80 KB thay vì 997 KB) và không thêm ảnh mới.
- Kiểm thử trình duyệt: không lỗi JavaScript; 43 căn có giá sẵn; C.07.06 ra 3.656.380.103 đ khớp bảng giá; chọn căn khác vẫn hiện đúng mặt bằng. Không đổi bài `skysolis`, không đổi URL.

## 2026-10-11 — Nội dung: Nhật san kỳ 3 "Thời kỳ chọn giá đúng" (đã công bố)
- Thêm và **công bố** kỳ `publications/nhat-san/2026-10-12-so-03/` (Nhật san đầu tuần 12/10/2026, Số 03, `trang-thai: cong-bo` theo yêu cầu của Tú): hiện trong thư viện Nhật san và sitemap; mở thẳng bản đọc `/nhat-san/2026-10-12-so-03/doc/`.
- Nội dung biên tập từ file Word của Tú trên khung trình bày của bản HTML GPT (giữ CSS, mục lục, lightbox, nút In/PDF). Sửa lỗi chính tả và câu cụt trong bài nhận xét tuần, giữ nguyên lập luận; ghép 11 ảnh trong Word (phối cảnh Nam Mekong dùng hai lần; chuyển WebP, tách file khi build). Dựng ảnh bìa `bia.jpg` 1200×630 cùng kiểu số 01–02.
- Đối chiếu nguồn: số liệu trái phiếu (ngân hàng 49,2%, bất động sản 41,5%, dữ liệu đến 24/9) và SSI (cổ phiếu bất động sản điều chỉnh 30–50%; NLG, KDH P/B 0,8 lần) khớp bài Mekong ASEAN 11/10; Kỳ Hòa theo VOV, VnExpress, Vietstock qua PHS (8,2 ha, 45 tầng, 10.000 người, đang lấy ý kiến, chưa phê duyệt). Về Kỳ Hòa, Tú xác nhận giữ thông tin "một trong ba quỹ đất Vinhomes được bàn giao đối ứng khi đầu tư đường sắt tốc độ cao Cần Giờ" (ghi là thông tin tác giả tiếp nhận); lưu ý nguồn Vietstock qua PHS chỉ nêu đối ứng đường vượt biển Cần Giờ – Vũng Tàu. Câu bỏ trống ở bài nhận xét tuần theo Tú: "khả năng nắm giữ tài sản dài hạn vẫn là của nhà đầu tư". Chú thích bản đồ R1–R5 ghi rõ vòng khoanh đỏ rộng hơn năm ô đấu giá.
- Đánh lại số nguồn liên tục 1–20 (bản gốc nhảy cách 5, 9, 15–17); thêm breadcrumb, JSON-LD (`WebSite`, `Person`, `WebPage`, `Article`, `BreadcrumbList`), canonical về `/doc/` và liên kết nội bộ tới Norton Park, Nam Mekong Grand Plaza, SkySOLIS, Gamuda Land, Vinhomes, SkyWorld, TOD 5.0, "Định kiến về dòng tiền bất động sản", hồ sơ tác giả, thư viện Nhật san.
- Sửa lỗi bố cục của file GPT: trên điện thoại (390 px) bảng làm trang rộng 432 px gây cuộn ngang; nay khớp màn hình, bảng tự cuộn trong khung. Mục lục có dòng "03 Nguồn cung" hiện lặp số, đã sửa.
- Thư mục nháp cũ `publications/nhat-san/2026-10-05-so-03/` (bản sao Số 02 đặt nhầm tên, `nhap`, chưa từng công bố) vẫn còn trên kho do gói cập nhật không xóa được file; nó không hiện ra ngoài và có thể xóa khi tiện.
- Kiểm thử: build 0 lỗi 0 cảnh báo, `check-dist` ĐẠT; kiểm tra trình duyệt desktop 1360 px và điện thoại 390 px (ảnh tải đủ, lightbox mở/đóng, không lỗi JavaScript).

## 2026-10-10 — Nội dung: sửa bài "Mục Tiêu Metro HCM 2030" (thêm bản đồ ③, chú giải ①–⑨)
- Thêm ảnh 10 (thẻ thông tin + bản đồ Metro Bến Thành – Cần Giờ) vào mục ③, thay đoạn "chưa có ảnh hồ sơ riêng"; cập nhật bảng thông số ③ (2 ga giai đoạn đầu, 350 km/h, khổ 1.435 mm, tàu 3 → 6 toa, depot Cần Giờ, 115.214 tỷ).
- Đầu bài: thêm mục "Chú Giải Bản Đồ" liệt kê ① đến ⑨ theo dạng số – tên tuyến – điểm kết nối – trạng thái (ô số cùng màu với đường trên bản đồ), kèm khối "Bảy nút chuyển tuyến". Chuyển khung "Cách đọc số hiệu" xuống ngay dưới chú giải.
- Mục "Hồ Sơ 9 Hạng Mục": thêm bảng "Nhìn nhanh: vốn dồn vào đâu?" (vốn, vốn/km, tỷ lệ có thanh ngang) cho 8 hạng mục chưa vận hành; phép tính là của tác giả.
- Kiểm thử: build 0 lỗi, `check-dist` ĐẠT.

## 2026-10-10 — Nội dung: bài mới "Định Kiến Về Dòng Tiền Bất Động Sản" (chương Tư Duy Đầu Tư)
- Thêm `dinh-kien-ve-dong-tien-bat-dong-san` (`/cam-nang/dinh-kien-ve-dong-tien-bat-dong-san/`) từ bài của Tú: giữ lập luận gốc (3 vai trò của bất động sản, phân định phát triển đô thị khác đầu cơ thổi giá), thêm khung "Bộ Lọc 3 Tầng Của Dòng Tiền" (loại hình – mục đích – gắn kết), 4 dấu hiệu nhận ra dòng tiền đúng chỗ và liên kết sang `muc-tieu-metro-hcm-2030`, `ban-do-dau-tu-cong-2026-2030`, `quy-hoach-100-nam-tp-hcm`.
- Bổ sung số liệu đến 10/10/2026 (Ngân hàng Nhà nước, Tổng cục Thống kê qua báo chí): tín dụng BĐS 25,73% tổng dư nợ (cuối 5/2026), 5,146 triệu tỷ (cuối 6/2026), 51,97% tự sử dụng, nợ xấu 2,3% nhưng tăng 10,5% so cuối 2025; CPI 9 tháng 4,52%; FDI thực hiện vào BĐS 1,59 tỷ USD (7,5%). Có nêu cả phía quan ngại (Thủ tướng 26/2/2026, đại biểu Quốc hội 21/4/2026) và ghi rõ đâu là số liệu, đâu là ý kiến. Bài không kết luận nguyên nhân lạm phát hay tỷ giá.
- Bài Word không kèm ảnh nên tự vẽ 2 ảnh gốc: sơ đồ "Cùng một dòng vốn, hai kết cục" (ảnh chính, OG) và biểu đồ cơ cấu tín dụng BĐS (kiểm tra màu bằng validator, có nguồn và ngày số liệu). Ảnh OG dựng riêng để không bị cắt tiêu đề.
- Gắn vào menu chương 3 (`categories.json`, badge 2 → 3 bài), `relatedArticles`, nhóm "Tư duy đầu tư" trong `data/pages.json`.
- Kiểm thử: build 0 lỗi, `check-dist` ĐẠT.

## 2026-10-10 — Nội dung: bài mới "Mục Tiêu Metro HCM 2030" (chương Chiến Lược & Quy Hoạch)
- Thêm `muc-tieu-metro-hcm-2030` (`/cam-nang/muc-tieu-metro-hcm-2030/`) từ tài liệu của Tú: khung "4 Trục Hội Tụ" (Tây · Nam · Bắc · hai sân bay), phát hiện "xương sống chung" Thủ Thiêm – Long Thành, hồ sơ 9 hạng mục ①–⑨ kèm 9 ảnh bản đồ (tông ấm 70%, WebP qua `images.py`), bảng nấc trạng thái và 3 rủi ro (vốn, quỹ đất BT, thời gian), bộ lọc 4 câu hỏi và liên kết sang các vùng liên quan.
- Cập nhật số liệu đến 10/10/2026 theo Ban MAUR và báo chí; ghi rõ chỗ các nguồn lệch (Bến Thành – Thủ Thiêm 36.744 / ~46.300 tỷ, mốc hoàn thành 2028 / quý III/2030; Thủ Thiêm – Long Thành 84.753 → 175.000 → ~134.169 tỷ; mốc Metro 1 kéo dài 2030 / trước 2035). Tổng vốn Cần Giờ 115.214 tỷ = 102.430 tỷ + ~12.784 tỷ giải phóng mặt bằng.
- Gắn vào bài hub `chien-luoc-quy-hoach` (thêm thẻ, 12 → 13 phân tích, badge chương 20 → 21), `relatedArticles` của hub và `mo-hinh-tod-hanh-lang-metro`, và nhóm "Metro và TOD" trong `data/pages.json` (trang `/bat-dong-san/tphcm/`).
- Ảnh ③ (Bến Thành – Cần Giờ) chưa có trong bộ ảnh nên hồ sơ ③ chỉ có văn bản; hướng tuyến xem trên bản đồ tổng quan.
- Kiểm thử: build 0 lỗi 0 cảnh báo, `check-dist` ĐẠT (82 URL khóa, 0 link hỏng), `smoke.py` ĐẠT.

## 2026-10-09 — 2.13.1: Sửa lỗi phóng to ảnh bằng 2 ngón trên điện thoại
- **Lỗi:** mở ảnh lớn rồi chụm 2 ngón để phóng thì trình duyệt phóng cả trang (không phải ảnh) nên ảnh trượt ra ngoài màn hình, không xem được.
- **Sửa (`assets/js/zoom.js`):** trong khung xem ảnh, chặn trình duyệt tự phóng trang; chụm 2 ngón phóng thẳng ảnh (1×–6×, phóng quanh điểm giữa 2 ngón), kéo 1 ngón để di chuyển, chạm đúp để phóng/thu, vuốt ngang để đổi ảnh khi chưa phóng. Ảnh có giới hạn biên nên không bao giờ trượt mất. Chuột/máy tính giữ nguyên cách cũ (bấm để phóng, kéo để di chuyển). Áp dụng cả trang bài và trang bảng tính.

## 2026-10-09 — Nội dung: Norton Park — chỉnh SWOT
- Điểm Mạnh: thay dòng "Chính sách tốt" bằng "Kết nối ngay nhà ga" (nhà ga C8 hỗ trợ điểm đến KCN VSIP 1, sân golf Sông Bé, AEON Mall là nhà ga tiêu điểm kéo traffic nhận diện dự án). Thách Thức: tiêu đề mục thành "Số lượng sản phẩm tại Đại lộ Bình Dương tung ra thị trường đồng loạt lớn". Không đổi URL, không tăng version.

## 2026-10-08 — 2.13.0: watermark chân dung tác giả; Norton Park: ảnh chính, phối cảnh, chính sách 5 phương thức, bảng tính
- **Giao diện (Tú yêu cầu):** trang bài và trang riêng hiện ảnh chân dung tác giả (ảnh trang chủ) làm watermark mờ phía sau nội dung — khối CSS cuối `assets/css/main.css`, không đổi template. Ẩn khi in/xuất PDF.
- `norton-park`: ảnh chính (đầu bài, `heroImage`, `thumbnail`, OG) đổi sang phối cảnh tổng thể khu vực `norton-park/27`. Ảnh `01` chuyển xuống lưới "Vì sao tôi chọn" (bỏ lần dùng trùng ảnh `02`).
- Tiện ích nội khu: thêm phối cảnh hồ bơi trung tâm và tòa Work Hub (`29`), thảm cỏ và khán đài ngoài trời (`28`); thêm 2 thẻ Work Hub và "Vận động mỗi ngày" (sân tập golf, công viên trượt ván, Vườn Mưa) theo website dự án.
- Giá & chính sách: thay "36 tháng, 10–15% ký HĐMB" bằng chính sách bán hàng 5 phương thức (chuẩn CK 5%, 10% HĐMB – 10 điểm CK 1%, 10% HĐMB – nửa năm vô ưu CK 2%, nhanh CK 10%, vay HTLS tối đa 10% trong 24 tháng; tổng CK lên đến 14%, đặt chỗ sớm 1%), bảng tóm tắt tỷ lệ từng giai đoạn và ảnh chính sách `30` (đã xóa logo và các hình mờ IQI Vietnam). Dòng thời gian thêm mốc ký HĐMB dự kiến 12/2026; bàn giao dự kiến 09/2029. Cập nhật Hỏi & Đáp và `seoDescription`.
- Bảng tính phương thức thanh toán của Tú đưa lên `/assets/tools/norton-park-bang-tinh/` (`noindex`, canonical về bài; 10 ảnh nhúng base64 tách thành file WebP, trang từ 746 KB còn 66 KB; 9 ảnh mẫu căn thay bằng bản đã cắt sạch nút giao diện và biểu tượng của trang gốc); khung "Giá tham chiếu" chuyển thành panel bấm mở bảng tính tham khảo (bỏ khối CTA bảng tính trùng lặp phía dưới).

## 2026-10-08 — Norton Park: cơ cấu sản phẩm theo website chính thức của dự án
- `norton-park` mục "🏠 Cơ Cấu Sản Phẩm" dựng lại theo phần Căn hộ của nortonpark.com.vn (Gamuda Land): hai bộ sưu tập "Chuẩn sống toàn cầu" (Studio, 1PN+, 2PN, 2PN+, 3PN — 45 mã căn) và "Chuẩn sống đặc tuyển" (căn hộ sân vườn, Duplex, Duplex sân vườn, Podium Shop, Standalone Shop — 18 mã căn); bảng diện tích căn tiêu biểu / diện tích từ / số mã căn; thêm đoạn hai phân khu B (ra mắt trước) và C (sắp ra mắt). Chỉ lấy số liệu và cách phân nhóm, không chép ảnh, hotline hay form của trang dự án.
- Thêm mục "📐 Mẫu Căn Tiêu Biểu" (9 thẻ: Studio ST1.1A, 1PN+ A1.1A, 2PN B1.4A, 2PN+ B2.2A, 3PN C4.1A, căn hộ sân vườn C3.1C.PES, Duplex D2.1C, Duplex sân vườn D1.1C, Podium Shop SH04) với mặt bằng `norton-park/18`–`26` từ ảnh chụp Tú gửi (cắt riêng phần mặt bằng, xóa nút giao diện của trang gốc, tông ấm 70%), kèm phòng, diện tích sàn/sử dụng/sân vườn, từng tầng, cảnh quan; mô tả viết lại ngắn, không chép nguyên văn.
- Dưới thẻ "🧭 Phối Cảnh 3D": thêm một dòng link thường tới tour 360° chính thức https://360.nortonpark.com.vn/ (mở tab mới, `nofollow`). Không nhúng iframe, không dùng `.p-360` → trang không tải gì và không nhận cookie từ tour cho tới khi người đọc tự bấm.
- Bàn giao dự kiến quý IV/2029 → **quý III/2029** theo website chính thức (dòng thời gian, Hỏi & Đáp, `facts`, `seoDescription`). Bãi xe: thêm tỉ lệ chỗ đậu xe 3:1.

## 2026-10-07 — 2.12.0: SEO Phase 3 — tiêu đề không bị cắt, mô tả đủ dài, nối link nội bộ
- **Thẻ `<title>` (build.mjs):** hậu tố thương hiệu " | Nguyễn Anh Tú" chỉ thêm khi tổng độ dài ≤ 60 ký tự, ngược lại bỏ hậu tố. Trước đó 32/78 bài published có title 63–68 ký tự nên Google cắt chữ ở kết quả tìm kiếm; nay không còn bài nào quá 60 ký tự (36 bài vẫn giữ hậu tố). Chỉ đổi thẻ `<title>`; `og:title`, JSON-LD và tiêu đề trong bài không đổi. Không đổi URL nào.
- **Mô tả meta:** viết lại 5 mô tả quá ngắn (88–99 ký tự) thành 140–155 ký tự, chỉ dùng số liệu đã có trong bài: `truc-metro-so-1-hcm`, `vung-khcn-hcm-ii-hub-icd`, `one-central-saigon`, `vinhome-green-paradise`, `capitaland`. Không đổi `updatedDate`.
- **Liên kết nội bộ:** số bài published chỉ có link từ menu trang chủ giảm 16 → 7. Gắn 8 link trong thân bài tới trang Nhà phát triển chưa có link ngữ cảnh: Sun Group (từ `sun-thu-thiem-2c`, `tu-giac-kinh-te-bien-1-650km`), Vinhomes (từ `vung-tri-thuc-khcn-tay-bac`, `chuc-nang-vung-giao-duc`), Masterise Homes (từ `global-city`, `grand-marina-saigon`, `one-central-saigon`), An Gia Group (từ `son-kim-land`). Link ở lần nhắc đầu tiên trong văn xuôi, màu vàng thương hiệu có gạch chân để người đọc nhận ra.
- Thêm dòng "📚 Đọc thêm" cuối 8 bài chủ đề nối vòng cho nhau: nhóm TOD (`mo-hinh-tod-hanh-lang-metro`, `tod-5-0-mat-do-hoat-dong`, `do-nen-do-thi-compact-city`), nhóm tư duy đầu tư (`22-nguyen-tac-tu-duy-dau-tu-bds`, `thi-truong-dan-trai-nhung-rat-tap-trung`), nhóm pháp luật (`luat-dat-dai-2024-to-chuc-kinh-te`, `phap-luat-bds`, `nha-o-xa-hoi-toan-canh-phap-ly-2024-2026`).
- Kiểm thử: build 0 lỗi, `check-dist` ĐẠT (82 URL khóa, 0 link hỏng, 0 trang mồ côi published).

## 2026-10-07 — Nội dung: gắn video YouTube lên đầu 2 bài Thành phố mới Bình Dương
- `thanh-pho-moi-binh-duong` và `tpm-binh-duong`: thêm thẻ liên kết "Video phân tích" (https://youtu.be/t62og8f0iTk) ở đầu bài, cùng kiểu thẻ video của Artisan Park, tông xanh chương Chiến lược. Mở YouTube ở tab mới, không nhúng iframe. Không đổi URL, không tăng version.

## 2026-10-06 — 2.11.1: Giao diện riêng cho Norton Park (đã chỉnh dễ đọc hơn)
- Tú gửi bảng màu "Hướng dẫn gửi xe" của dự án: nền xanh rêu `#545748`, chữ kem `#ead6c5`, họa tiết lá. Bài `norton-park` đổi sang tông này: nền và chữ, thẻ, bảng, SWOT, Hỏi & Đáp, thanh gọi/Zalo, chân trang tác giả; màu nhấn chuyển từ đỏ gạch sang vàng cát `#e6c58f` (đủ tương phản ≥ 4,5:1 trên nền rêu). Dải họa tiết lá (tách từ ảnh của Tú, `assets/images/site/norton-pattern.webp`) thay vạch màu 3px ở đầu trang.
- Cơ chế: thêm trường tùy chọn `theme` trong `data/articles.json` (xem PROJECT_RULES §3.1). Build thêm class `theme-<tên>` vào `<html>`/`<body>`; CSS ở cuối `main.css`. Chỉ Norton Park có `theme`; các bài khác, trang chủ và menu NAT không đổi. Giữ `accent` `#b05040` trong dữ liệu (màu chấm của menu/tìm kiếm).
- Nội dung `norton-park.html`: các màu chữ gắn cứng (đỏ gạch, vàng, xanh lá) đổi sang biến màu để theo giao diện. Tú nhận xét bản đầu khó đọc hơn nền cũ (nền rêu giữa `#545748` chỉ đạt ~5:1) nên nền đọc được làm đậm hơn (`#383b2f`, ngoài lề `#2b2d24`), chữ sáng hơn (`#f4e8da`): tương phản ~9,5:1, ngang nền đen cũ. `#545748` chỉ còn ở dải họa tiết đầu trang. Tăng `version` 2.11.1.

## 2026-10-06 — Nội dung: Norton Park — bổ sung đội ngũ dự án
- Mục "Nhà Phát Triển" của `norton-park`: thay "Đơn vị thiết kế" bằng các đơn vị theo slide giới thiệu dự án: tư vấn kiến trúc DP Architects (DPA), tư vấn nội thất dwp, tư vấn cảnh quan Belt Collins, thi công phần ngầm CBM. Tư vấn kết cấu (slide chỉ có logo, chưa rõ tên) và Tổng thầu vẫn "Đang cập nhật". Thêm poster đội ngũ dự án (ảnh `norton-park/17`, từ ảnh chụp slide: nắn thẳng, cắt nền, chỉnh tông ấm) ngay dưới khối này. Cập nhật `updatedDate` 2026-10-06.

## 2026-10-05 — 2.10.1: Ảnh chia sẻ link cho Atlas / Chỉ số đô thị
- Tú yêu cầu World Atlas, Atlas VietNam, Chỉ số đô thị đều lấy **ảnh trang chủ Cẩm nang** làm ảnh khi dán link (tạm thời). Thêm `bia.jpg` (bản sao `trang-chu.jpg`) cho kỳ Chỉ số đô thị; hai kỳ Atlas đã có từ trước.
- `scripts/build.mjs`: trang bản đọc `/<mục>/<kỳ>/doc/` nào thiếu thẻ `og:image` thì build tự thêm `og:image` (= `bia.jpg` của kỳ), `og:title`, `og:description`, `og:url`, `twitter:card` và canonical. Trước đó link `/doc/` dán lên Facebook/Zalo không có ảnh. Bản đọc đã có thẻ riêng (Nhật san) giữ nguyên. Khi có ảnh riêng, chỉ cần thay `bia.jpg` của kỳ (đặt tên file mới nếu muốn né cache của Facebook, rồi Scrape Again).

## 2026-10-05 — Nội dung: VietNam Atlas bản Backfill 2022 Q1 → 2026 Q3
- `publications/atlas-viet-nam/chi-so-kinh-te-viet-nam/` thay tại chỗ bằng bản **Historical Backfill Q1/2022 → Q3/2026** (final). Không đổi URL, không thêm bài; tiêu đề trang giữ "VietNam Atlas: chỉ số kinh tế Việt Nam".
- File gốc vẫn có lỗi cũ (khối ngăn chi tiết nằm sau script khiến nút Chi tiết/In/Phương pháp không chạy) nên đã dời lên trước script, và thêm 1 dòng CSS ≤600px chống tràn ngang trên điện thoại. Không đổi số liệu hay thiết kế. Chân trang file vẫn ghi "Release v1.2.1" — giữ nguyên.

## 2026-10-05 — Nội dung: cập nhật World Atlas (v1.5.20) và VietNam Atlas (Q3/2026 final)
- Cập nhật **tại chỗ**, không thêm kỳ/bài mới, không đổi URL: `publications/atlas/2026-q3/` thay bằng World Economic Atlas **v1.5.20** (bản No-JS Q3/2026, thêm mục tín dụng – nợ – tỷ trọng); `publications/atlas-viet-nam/chi-so-kinh-te-viet-nam/` thay bằng bản **Q3/2026 final** (v1.3.0). Tiêu đề trang giữ "World Atlas quý III/2026" và "VietNam Atlas: chỉ số kinh tế Việt Nam".
- Bản final của VietNam Atlas vẫn có lỗi cũ: khối "ngăn chi tiết" nằm sau script nên các nút Chi tiết/In/Phương pháp không chạy. Đã dời lên trước script. Thêm 1 dòng CSS cho màn hình ≤600px (thanh trên cùng và ô lọc không còn tràn ngang trên điện thoại). Không đổi số liệu hay thiết kế.
- Chân trang file vẫn ghi "Release v1.2.1" trong khi tiêu đề là v1.3.0 — giữ nguyên, chờ Tú xác nhận.

## 2026-10-05 — 2.10.0: Menu mới "Atlas VietNam", đăng World Atlas v1.5.19, rút gọn đường nhấp
- Thêm mục **Atlas VietNam** (`/atlas-viet-nam/`) vào thanh menu NAT, nằm sau "World Atlas". Cùng cơ chế ấn phẩm theo kỳ: khai báo trong `site.config.json` → `publications` (`navKey: nav_atlasvn`), mỗi kỳ là một thư mục trong `publications/atlas-viet-nam/<kỳ>/`. Bài duy nhất, cập nhật tại chỗ: **VietNam Atlas: chỉ số kinh tế Việt Nam** (`chi-so-kinh-te-viet-nam`), đã **công bố** theo yêu cầu của Tú.
- **World Atlas:** đăng **World Atlas quý III/2026** (`2026-q3`, bản No-JS cho điện thoại; mỗi quý một kỳ), đã **công bố**. Bản nháp cũ v1.5.16 (`trang-thai: nhap`) giữ nguyên, không hiện ra ngoài.
- **Rút gọn đường nhấp (Tú báo phải nhấp tới lần thứ 3 mới vào nội dung):** trước đây menu → thư viện → trang giới thiệu kỳ → "Đọc trực tuyến". Nay kỳ chỉ có bản đọc HTML (không PDF, không ảnh trang) thì thẻ trong thư viện mở **thẳng** bản đọc `/doc/`: menu → thẻ = **2 lần nhấp** (Nhật san, World Atlas, Atlas VietNam, Chỉ số đô thị). Trang giới thiệu kỳ `/<mục>/<kỳ>/` vẫn còn, giữ nguyên URL, dùng để chia sẻ Facebook/Zalo. Kỳ có PDF hoặc ảnh trang vẫn mở trang giới thiệu như cũ.
- Atlas VietNam v1.2.2: file gốc đặt khối "ngăn chi tiết" (drawer) **sau** đoạn script nên trình duyệt báo lỗi và các nút **Chi tiết**, **In**, **Phương pháp** không chạy. Đã chuyển khối đó lên trước script, không đổi giao diện hay số liệu. Chân trang trong file vẫn ghi "Release v1.2.1" (tiêu đề là v1.2.2) — giữ nguyên, chờ Tú xác nhận.
- CSS: hiệu ứng hover của thẻ ấn phẩm và của menu chỉ áp dụng cho thiết bị có chuột (`@media (hover:hover)`), để cảm ứng không tốn một lần chạm chỉ để "hover".
- Báo cáo HTML của cả hai kỳ không tải thư viện/CDN ngoài (§12.9); các link trong file là link nguồn dẫn chứng, giữ nguyên. Ảnh bìa `bia.jpg` của hai kỳ tạm dùng ảnh trang chủ Cẩm nang, sẽ thay khi có ảnh riêng.

## 2026-10-05 — 2.9.0: Menu mới "Chỉ số đô thị"
- Thêm mục **Chỉ số đô thị** (`/chi-so-do-thi/`) vào thanh menu NAT, nằm sau "Nhật san". Dùng đúng cơ chế ấn phẩm theo kỳ của World Atlas / Nhật san: khai báo trong `site.config.json` → `publications`, mỗi báo cáo là một thư mục trong `publications/chi-so-do-thi/<kỳ>/`. Không đổi giao diện menu (các mục còn lại giữ nguyên).
- Kỳ đầu tiên: "Báo cáo Mật độ Đô thị Nén 2026" (`2026-10-05-mat-do-do-thi-nen`), đã **công bố** (`cong-bo`) theo yêu cầu của Tú: hiện trong thư viện `/chi-so-do-thi/`, có trong sitemap.
- Báo cáo gốc dùng thư viện Chart.js tải từ CDN; theo §12.9 đã thay bằng 2 biểu đồ SVG tự vẽ (radar 11 chỉ số, cột Gap Analysis), giữ nguyên số liệu, màu và có tự co theo màn hình điện thoại. Phần còn lại của báo cáo giữ nguyên thiết kế.

## 2026-10-04 — Vùng 08: gắn sao và đổi tên "Đại lộ Bình Dương (QL13)"
- `data/categories.json`: vùng 08 `truc-quoc-lo-13` thêm `star` + `highlight` như các vùng gắn sao khác.
- Đổi tên hiển thị "Trục Quốc Lộ 13" → "Đại lộ Bình Dương (QL13)": `title`/`seoTitle` bài vùng, `subtitle`/`seoTitle` các bài dự án trong vùng, tiêu đề H1 bài vùng và các bài khung (Habitat, Hồ Gươm Xanh, The Solis, Setia Edenia, One Era), link "Bối cảnh trục" trong SkySOLIS và Norton Park. `searchKeywords` giữ thêm tên cũ "Trục Quốc Lộ 13 QL13" để tìm kiếm vẫn ra. **Giữ nguyên URL** `/cam-nang/truc-quoc-lo-13/` (địa chỉ vĩnh viễn, không cần redirect).

## 2026-10-04 — Dự Án Chọn Lọc: Norton Park (bài đầy đủ, công bố)
- `norton-park` (trước là bài khung `stub`): viết đầy đủ theo khung dự án 01–04 của SkySOLIS/Nam Mekong từ phiếu nhập liệu Tú gửi (Norton_Park_COMPACT.docx): clip giới thiệu (mở trên Facebook) + Prologue; 01 Tổng quan (vị trí cạnh AEON Mall Bình Dương Canary, quy mô 7,9 ha · 2 phân khu · 6 tháp 19 tầng · 1.286 sản phẩm, nhà phát triển, pháp lý & giai đoạn: kick-off 10/10/2026, bàn giao ~quý IV/2029, ảnh hiện trạng công trường); 02 Chi tiết (khối giá "Chờ công bố" + nút Zalo đăng ký nhận bảng giá, `.p-offers` 36 tháng · 10–15% ký HĐMB · 6 tháng/đợt; cơ cấu sản phẩm theo mặt bằng tầng 4–9; phối cảnh Forestscape; tiện ích nội khu; ngoại khu); 03 Vì sao tôi chọn; 04 SWOT (theo bản Tú gửi) + thang điểm 19 chỉ số, TB 4,18 + Hỏi & Đáp 6 câu. Dải `facts`, `seoTitle`/`seoDescription` theo khuôn "Giá, Pháp Lý, Tiến Độ 2026". Chuyển `published`.
- 15 ảnh (tông ấm §8.4): xóa logo và hình mờ CBC trên ảnh vùng, chữ mờ "PHÚ LÊ" trên ảnh sân golf, địa chỉ web đại lý trên ảnh mặt bằng. Ảnh OG cắt từ ảnh hero.
- Mật độ xây dựng ghi theo tài liệu chủ đầu tư (20% toàn khu, 27% khu B & C) thay cho ~36% trong phiếu; chờ Tú xác nhận. Không đưa khối 360° vì link trong phiếu (`360.skysolis.my`) là của SkySOLIS. Clip giới thiệu dùng link chia sẻ Facebook Tú gửi (facebook.com/share/v/1Dp8H8EVrr). Thêm mục "🧭 Phối Cảnh 3D" cuối mục 02: thẻ ảnh (norton-park/16) dẫn tới trang công cụ `/assets/tools/norton-park-3d/` — mô hình 3D xoay/phóng to bằng Model Viewer 4.2.0 (Google, Apache-2.0) tự lưu trữ cùng bộ giải nén meshoptimizer (MIT), không tải gì từ máy chủ ngoài; file .glb gốc 65 MB của Tú (dựng bằng Hi3D) được rút gọn còn ~4,4 MB (giảm lưới, nén meshopt, texture WebP 2048). Trang công cụ `noindex`, canonical về bài; chỉ trang này tải thư viện 3D.
- `truc-quoc-lo-13`: sửa nhãn Norton Park "SkyWorld · Lái Thiêu" → "Gamuda Land · Cạnh AEON Mall". `gamuda-land`: thêm Norton Park vào mục Các Dự Án (`proj-row`) và gắn link trong bảng pipeline 2026.

## 2026-10-04 — Dự Án Chọn Lọc: thêm trang Celesta Gold (bản thông tin cơ bản)
- Thêm bài `celesta-gold` (status **stub**, noindex, chờ Tú duyệt/bổ sung) thành chip dưới vùng Trục Nguyễn Hữu Thọ – Hiệp Phước; badge chương 4 tăng 79 → 80 dự án. Nội dung từ 5 ảnh Tú gửi (tài liệu giới thiệu, hai ảnh công trường, cầu cảnh quan Hoàng Kim đã cắt bỏ chữ quảng cáo, sơ đồ metro số 4) cộng thông tin đã đối chiếu báo chí (khởi công 07/05/2026, Keppel – Phú Long – Nomura, hơn 1,28 ha, Coteccons). Gồm mục 01 Tổng quan (vị trí, bảng thông tin cơ bản) và 02 Chi tiết (tiện ích, hiện trạng công trường), khối "Cần kiểm chứng" và dải số liệu 420 căn · 25 tầng · 12.815 m². Chưa có giá, pháp lý, SWOT. Không nêu giá vì các nguồn tham khảo mâu thuẫn. Ảnh phối cảnh hero lấy từ ảnh Keppel đã dùng trong Nhật san Số 01. Muốn công bố: bổ sung mục 03–04 rồi đổi `status` thành `published`.

## 2026-10-04 — Nhật san: thêm kỳ Số 01
- Thêm và **công bố** kỳ `2026-09-28-so-01` (Nhật san đầu tuần 28/09/2026, Số 01) theo bản Tú gửi ngày 04/10 (mục dự án Nam Mekong Grand Plaza và Celesta Gold, có phối cảnh); file gốc ghi nhầm "Số 02" nên đã sửa thành Số 01 ở đầu và chân trang. SEO: title/description, canonical về trang đọc `/doc/`, Open Graph + ảnh chia sẻ `bia.jpg` đặt trên site (thay ảnh ngoài), JSON-LD (Article + BreadcrumbList nối WebSite/Person; `datePublished` = ngày đăng thực 2026-10-04), breadcrumb hiển thị, từ khóa trong H1 (ẩn thị giác), sửa nhảy cấp tiêu đề, liên kết hồ sơ tác giả. Gỡ khối ghi chú tích hợp nội bộ (`web-editorial-manifest`) và thẻ noindex khỏi bản công khai. Liên kết sang Dự Án Chọn Lọc: Nam Mekong Grand Plaza (`nam-mekong-grand-plaza`, ở tên dự án và nút cuối thẻ); Celesta Gold (`celesta-gold`, tên dự án và nút cuối thẻ) kèm nút phụ tới trục Nguyễn Hữu Thọ – Hiệp Phước (`truc-nguyen-huu-tho-thuong-cang-hiep-phuoc`). Thêm "Đọc thêm" cuối mục tin tức: Mô hình TOD & hành lang metro, TOD 5.0. Đối chiếu báo chí các số liệu chính: TOD (1.000 m, tối đa 1,5 lần, HĐND 22/9), DKRA tháng 8 (hấp thụ căn hộ ~11%, 1.055/~10.000 căn, nhà liền thổ 609/>7.700 căn), Celesta Gold (khởi công 7/5/2026, 420 căn, hơn 1,28 ha); các nguồn còn lại giữ nguyên từ bản gốc.

## [2.8.0] — 2026-10-03 — Nhật san: thẻ chữ thay ảnh bìa
- **Nhật san không hiện ảnh bìa trên web (Tú yêu cầu):** ảnh bìa bị cắt khung trên thư viện (máy tính) và tràn trên điện thoại. Thư viện giờ là thẻ chữ: số kỳ · ngày, tiêu đề, đoạn trích hấp dẫn và nút "Đọc nhật san →"; đầu trang kỳ hiện đoạn trích thay ảnh. Bật/tắt bằng `cover` của từng mục trong `site.config.json` (Nhật san `false`; World Atlas giữ ảnh bìa). Thêm dòng `trich-doan:` (không bắt buộc) trong `info.txt`, bỏ trống thì dùng `mo-ta`; ghi trong `publications/README.md`. `bia.jpg` vẫn giữ làm ảnh chia sẻ Facebook/Zalo (og:image). Tăng `version` lên 2.8.0.
- Sửa ảnh chia sẻ `bia.jpg` kỳ 05/10: ghi đúng "SỐ 02" (trước đó còn "SỐ 03").

## [2.7.1] — 2026-10-03 — Sơ đồ trang (sitemap) có trang đọc của ấn phẩm
- Kỳ ấn phẩm công bố có file HTML: `sitemap.xml` nay liệt kê cả trang đọc `/<mục>/<kỳ>/doc/` (trước chỉ có trang giới thiệu kỳ), để Google thấy nội dung bài. Tăng `version` lên 2.7.1.

## [2.7.0] — 2026-10-02 — Chữ lớn hơn, khối giá/ưu đãi, hiệu ứng hiện dần khi lướt
- **Chữ trang bài lớn hơn (Tú duyệt):** đoạn văn 14→16px, nội dung thẻ 12,5→15px, hỏi đáp 12,5→15px, nhãn nhỏ nhất 9–10→12px (bỏ in hoa ở tiêu đề thẻ), tiêu đề mục `p-h2` 19→22px, `p-h1` tới 28px trên điện thoại. Chữ viết inline trong bài cũ được nâng theo thang mới bằng bộ chọn thuộc tính, không phải sửa 180 file nội dung. Chỉ áp dụng trong `#pBody`; trang chủ, menu, thanh bên không đổi. Đo trên Nam Mekong (điện thoại): chữ dưới 12px từ 20% xuống 1%; chữ từ 14px trở lên từ 26% lên 77%.
- **Khối giá và ưu đãi (mới, CSS):** `.p-price` (giá tham chiếu cỡ lớn) và `.p-offers` (3 ưu đãi một hàng). Dùng cho mục Giá Bán & Chính Sách của các dự án; có định dạng riêng khi xuất PDF.
- **Hiệu ứng hiện dần khi lướt tới (mới, JS trong `article.js`, tắt bằng `REVEAL=false`):** khối nằm dưới màn hình lúc mở trang mới được ẩn rồi hiện dần (mờ → rõ, trượt lên 16px, 0,55 giây; các thẻ cùng hàng so le tối đa 280 ms). Chỉ dùng opacity và transform nên không gây xô lệch bố cục (CLS đo được 0). Không JS, chọn "giảm chuyển động" hoặc in/xuất PDF thì nội dung hiện đủ ngay. Khối 360° và nội dung hỏi đáp không bị ảnh hưởng.
- **Sửa hiệu năng hiệu ứng hiện dần:** bản đầu đọc vị trí từng khối xen kẽ với ghi class nên buộc trình duyệt tính bố cục lại hàng chục lần trên trang dài. Đã đổi thành đọc một lượt rồi mới ghi. Đo Lighthouse mobile (giả lập mạng chậm) trên Nam Mekong, 3 lần: điểm hiệu năng 88–94 (trước khi sửa 64–88), thời gian chặn 20–270 ms (trước 300–1.360 ms), CLS 0, SEO 100, truy cập 97.
- **Tương phản chữ nhỏ màu đỏ đất:** nhãn tiêu đề thẻ, năm mốc thời gian, nhãn đầu trang, phụ đề H1 và số điện thoại cuối bài dùng tông sáng hơn để đạt 4,5:1 (trước đó 3,4–3,7:1). Chữ lớn và các số thứ tự 01–04 trang trí giữ nguyên.
- Tăng `version` lên 2.7.0.

### Nội dung
- 2026-10-03 — Nhật san: thêm và **công bố** kỳ `2026-10-05-so-02` (Nhật san đầu tuần 05/10/2026, Số 02; Số 01 ngày 27/9 Tú sẽ gửi sau). Tối ưu SEO trong file kỳ: title/description, canonical, Open Graph + ảnh bìa `bia.jpg` 1200×630, JSON-LD (Article + BreadcrumbList nối với WebSite/Person), breadcrumb hiển thị, alt ảnh mô tả đúng nội dung, ảnh đầu trang có kích thước + ưu tiên tải. Gắn liên kết nội bộ sang Dự Án Chọn Lọc: Setia Edenia (`setia-edenia`), Beachtro Tower (`blanca-beachtro-tower`), Norton Park (`norton-park`) và Blanca City (`blanca-city`) ở phần mở đầu, thẻ dự án, bảng tra cứu nhanh; thêm liên kết tới hồ sơ tác giả và thư viện Nhật san. Giữ nguyên toàn bộ nội dung và thiết kế. Lưu ý: 3 trang dự án trên hiện là bài khung `stub` (đang cập nhật, noindex). Bản nháp trước đặt tên thư mục `2026-10-05-so-03` đã đổi thành `so-02` (chưa từng công bố).
- 2026-10-03 — `sun-group`, `capitaland`, `masterise-homes`, `vinhomes` biên tập cấu trúc theo bản mẫu `gamuda-land` (Tú duyệt mẫu): dải 4 số liệu đầu trang (`facts`), lead gọn lại, khối "khác biệt ở đâu" tóm tắt trước phần chi tiết, bảng thay các khối thẻ dài (đối tác, dự án Nam tiến, hồ sơ dự án CapitaLand), mục "Các Dự Án" dạng `proj-row` đưa lên trước "Nhận Định Đầu Tư", khối nguồn xuống cuối bài. `vinhomes` thêm sơ đồ tổng thể Vinhome Green Paradise (ảnh có sẵn trong kho). Sửa class `p-body` dùng nhầm sang `p-p` ở `sun-group`, `masterise-homes`. Giữ nguyên toàn bộ ý và số liệu (đã đối chiếu tự động với bản cũ, không thêm số mới). Sun Group, CapitaLand, Masterise chưa có ảnh vì các dự án liên quan trong kho chưa có ảnh. 10 trang chủ đầu tư ngắn còn lại chưa đổi.
- 2026-10-03 — `gamuda-land` (BẢN MẪU chờ Tú duyệt cho trang chủ đầu tư, chương Giá Trị Cốt Lõi Nhà Phát Triển): biên tập lại cấu trúc cho bớt chữ, dễ quét: dải 4 số liệu đầu trang (dùng trường `facts`, 2×2 trên điện thoại), lead rút còn 2 câu, ảnh Artisan Park đầu bài, khối "5 trụ cột" tóm tắt trước khi đi vào từng trụ cột, ảnh công viên Artisan Park ở Trụ cột 3, số liệu tài chính FY2024 và pipeline 2026 chuyển sang bảng, mục "Các Dự Án" đưa lên trước "Nhận Định Đầu Tư" và đổi sang dạng `proj-row`, khối nguồn chuyển xuống cuối bài. Sửa lỗi định dạng: 7 đoạn văn dùng nhầm class `p-body` (là class khung trang) đổi thành `p-p`. Giữ nguyên toàn bộ ý và số liệu (đã đối chiếu tự động với bản cũ, không thêm số mới). Tú duyệt mẫu: giữ ảnh Artisan Park; thêm thẻ liên kết video YouTube (youtu.be/qnpdHZFw29c, mở tab mới, không nhúng iframe theo §4.7) trước khối 5 trụ cột và ghi vào dòng nguồn cuối bài. Lưu ý: `facts` ở §3.1 ghi "chỉ cho bài dự án" — dùng thử cho trang chủ đầu tư, chờ Tú duyệt. Các trang chủ đầu tư khác chưa đổi; `masterise-homes`, `sun-group`, `sun-thu-thiem-2c` cũng còn dùng nhầm `p-body`.
- 2026-10-03 — `tod-5-0-mat-do-hoat-dong` đưa ra khỏi cụm bài vùng "Chiến Lược Quy Hoạch Vùng Đông Nam Bộ" (Tú yêu cầu), làm bài độc lập ở cấp chương Chiến Lược & Quy Hoạch như `do-nen-do-thi-compact-city` (URL không đổi, `parent` bỏ, breadcrumb về chương). Trong `chien-luoc-quy-hoach`: bỏ thẻ liên kết, bỏ nhắc tên ở đoạn mở đầu và "Cách đọc tối ưu", bỏ khỏi `relatedArticles`, "13 → 12 phân tích" (tiêu đề mục, lead, subtitle, description); `badge` chương CH.02 thành "4 chủ đề · 20 bài phân tích".
- 2026-10-03 — `bds-viet-nam-dang-o-giai-doan-nao` viết lại theo hướng **diễn giải thay đổi trong định hướng quy hoạch của Nhà nước, không định hướng đầu tư** (Tú yêu cầu): tiêu đề mới "Định Hướng Quy Hoạch Đang Thay Đổi Thế Nào?" (slug giữ nguyên theo §6); bố cục mới: 5 chuyển dịch (đơn tâm → đa cực · địa giới → vùng chức năng · đồ án tĩnh → hiến chương dài hạn · quy hoạch treo → hạ tầng dẫn dắt · thu hút ngành → điều phối chức năng), dòng thời gian thể chế hóa 1993 → 2075, ghi chú phân tầng nguồn (văn kiện chính thức vs đề xuất BCG), 4 cách đọc quy hoạch, liên kết sang các bài chi tiết. Giữ nguyên ảnh minh họa và ý "hạ tầng dẫn dắt", "vùng đô thị" (Greater Tokyo, Châu thổ Châu Giang). Bỏ phần chu kỳ thị trường 6 giai đoạn, dòng thời gian bong bóng/thanh lọc 2010–2024, tư duy tiềm năng, rủi ro "đúng nhưng đúng quá sớm", tài chính chịu đựng và khung "đúc kết cho nhà tư vấn" (phần định hướng đầu tư, thuộc chương Tư duy đầu tư). Cập nhật `title`, `subtitle`, `description`, `seoTitle`, `seoDescription`, `searchKeywords`; sửa tên và mô tả bài trong thẻ liên kết và đoạn mở đầu của `chien-luoc-quy-hoach`. `thi-truong-dan-trai-nhung-rat-tap-trung` giữ nguyên.
- 2026-10-03 — **Gọn chương Tư duy đầu tư & Chiến lược quy hoạch (Tú yêu cầu):** (1) gỡ bài `dong-tien-la-vua-nguyen-tac-so-2-trong-12-nguyen-tac-tu-duy-dau-tu` vì trùng nguyên tắc Dòng tiền trong `22-nguyen-tac-tu-duy-dau-tu-bds`; URL cũ chuyển 301 sang bài 22 nguyên tắc (`data/redirects.json`), xóa file nội dung và ảnh OG, chương Tư duy đầu tư còn 2 bài. (2) `do-nen-do-thi-compact-city` giữ là bài độc lập ở cấp chương Chiến Lược & Quy Hoạch (URL không đổi); gỡ khỏi cụm bài vùng: bỏ thẻ liên kết và 2 câu nhắc trong `chien-luoc-quy-hoach`, bỏ khỏi `relatedArticles` của bài vùng, cập nhật "14 → 13 phân tích" (tiêu đề mục, lead, subtitle, description) và `badge` hai chương.
- 2026-10-02 — `skysolis`, `artisan-park` (SEO, theo khuôn Nam Mekong): H1 bỏ emoji; mục 02 đưa "Giá Bán & Chính Sách" lên đầu, rồi Cơ cấu/Loại hình sản phẩm, Phối cảnh, Tiện ích (SkySOLIS: Ngoại khu, 360° ở cuối); ưu đãi chuyển sang khối `.p-offers`, SkySOLIS thêm khối giá `.p-price` (55 triệu/m²); thêm mục "❓ Hỏi & Đáp" 6 câu, mọi câu trả lời lấy từ chính dữ liệu trong bài; `seoTitle` "Tên dự án: Giá, Pháp Lý, Tiến Độ 2026" và `seoDescription` mới. Không bớt ý, không mất link nào (đã đối chiếu tự động với bản cũ).
- 2026-10-02 — **Tiêu đề SEO:** rút gọn `seoTitle` của 52 bài đã xuất bản (60/78 bài trước đó dài hơn 62 ký tự gồm hậu tố nên bị Google cắt): luật đất đai, chiến lược quy hoạch, các vùng, chủ đầu tư, các tác giả quy hoạch, bài dự án. Giữ nguyên `title` (menu, tìm kiếm), `description` và URL. Sửa luôn tiêu đề "Dòng Tiền Là Vua" bị thừa dấu ngoặc kép.
- 2026-10-03 — `artisan-park`: thêm thẻ "Bảng tính chiết khấu & thanh toán" trong mục 🎁 Giá Bán & Chính Sách, dẫn tới trang công cụ `assets/tools/artisan-park-bang-tinh/` (HTML tĩnh do Tú cung cấp: 108 căn, 5 phương thức thanh toán, vị trí căn trên mặt bằng, xuất PDF; ảnh mặt bằng 1,1 MB Base64 tách thành WebP 350 KB; gắn `noindex, nofollow`). Đã chạy thử: không lỗi JS, ảnh tải đủ, chọn căn thì tính giá và đánh dấu vị trí trên mặt bằng.
- Bài khung `stub` (89 bài dự án) giữ nguyên: đang `noindex`, chưa có nội dung nên chưa áp dụng Hỏi & Đáp.
- 2026-10-02 — `nam-mekong-grand-plaza`: mục "Giá Bán & Chính Sách" làm lại bằng khối `.p-price` + `.p-offers`, giữ nguyên số liệu (55 triệu/m², 1,5%, 9,5%, 24 tháng, phí quản lý đang cập nhật) và nút bảng tính.

## [2.6.0] — 2026-10-02 — Phóng to ảnh, nút mở công cụ nổi bật, bảng tính rộng hơn trên máy tính
- **Phóng to ảnh (mới):** file `assets/js/zoom.js` (tự chứa CSS, chỉ tải ở trang bài). Mọi ảnh nội dung trong bài có nút "🔍 Phóng to"; bấm ảnh hoặc nút để mở ảnh lớn bản chất lượng cao nhất, bấm lần nữa để phóng hết cỡ và kéo xem chi tiết, ← → hoặc vuốt để đổi ảnh, Esc/✕ để đóng. Không áp dụng cho ảnh nằm trong liên kết hoặc khối 360°. Ẩn khi in.
- **Khối nút kêu gọi `.p-cta-box` / `.p-cta` (mới, CSS):** nút vàng lớn "Mở bảng tính ngay →" (cao 58px, toàn chiều rộng trên điện thoại). Thay thẻ nhỏ cũ trong SkySOLIS và Nam Mekong.
- **Trang bảng tính SkySOLIS và Nam Mekong:** khung rộng 1440–1500px (trước 1060/960), Nam Mekong chia 2 cột trên máy tính (nhập liệu + mặt bằng bên trái, số liệu + lịch thanh toán bên phải), chữ và ô nhập lớn hơn. Ảnh mặt bằng có nút phóng to kèm chấm đánh dấu vị trí căn đang chọn.
- Template `article.html` nạp thêm `zoom.js`. Tăng `version` lên 2.6.0.

### Nội dung
- 2026-10-02 — `nam-mekong-grand-plaza` (SEO, Tú duyệt bản mẫu): `seoTitle` rút gọn còn "Nam Mekong Grand Plaza: Giá, Pháp Lý, Tiến Độ 2026" (trước đó dài ~90 ký tự, bị Google cắt), `seoDescription` viết lại có giá/pháp lý/bàn giao; H1 bỏ emoji; trong mục 02 đưa "Giá Bán & Chính Sách Nổi Bật" (kèm bảng tính) lên đầu rồi đến Loại Hình, Phối Cảnh, Tiện Ích, Ngoại khu, Tham quan 360°; thêm mục "❓ Hỏi & Đáp" 5 câu cuối mục 04 (khối FAQ có sẵn, dữ liệu lấy từ chính bài, có link nội bộ về bài vùng). Không bớt ý nào, giữ nguyên clip giới thiệu, 360°, bảng tính, link chủ đầu tư, 4 vạch 01–04 và URL.
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

### Sửa lỗi cache ảnh (Nhật san kỳ 4)
- `scripts/build.mjs`: ảnh tách từ base64 được đặt tên kèm mã băm nội dung (hinh-NN-xxxxxxxx.jpg) để trình duyệt/CDN không giữ ảnh cũ khi đổi thứ tự.
