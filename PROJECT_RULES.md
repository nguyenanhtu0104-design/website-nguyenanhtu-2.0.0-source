# PROJECT_RULES.md — Hiến pháp dự án Cẩm Nang BĐS 2.0

> **Mọi AI (Claude, ChatGPT, hay bất kỳ ai) PHẢI đọc hết file này trước khi sửa bất cứ thứ gì.**
> File này thay thế toàn bộ lịch sử chat. Nếu lịch sử chat mâu thuẫn với file này, file này thắng.
> Chỉ Nguyễn Anh Tú (chủ dự án) được quyết định thay đổi các nguyên tắc ở đây. Khi Tú duyệt thay đổi, ghi lại vào mục 14.

- Website: **https://nguyenanhtu.vn**
- Nguồn chân lý duy nhất: **repo GitHub, nhánh `main`**. Không làm việc trên bản sao cũ, file HTML cũ hay file zip cũ.
- Phiên bản hiện tại: xem `site.config.json` → `version` và `CHANGELOG.md`.

---

## 1. Kiến trúc — nguyên tắc cốt lõi

**CODE ≠ DATA ≠ CONTENT ≠ MEDIA.** Bốn lớp nằm ở bốn nơi riêng, không bao giờ trộn lẫn.

| Lớp | Vị trí | Ghi chú |
|---|---|---|
| Giao diện (UI) | `templates/`, `assets/css/`, `assets/js/` | Giao diện đã được Tú duyệt, chỉ sửa khi được yêu cầu |
| Dữ liệu (Data) | `data/*.json`, `site.config.json` | Metadata, menu, ảnh, chuyển hướng |
| Nội dung (Content) | `content/articles/<slug>.html` | Mỗi bài một file, chỉ chứa HTML thân bài |
| Ảnh (Media) | `assets/images/` | WebP, tách file, không Base64 |
| Ấn phẩm theo kỳ | `publications/<mục>/<kỳ>/` | World Atlas, Nhật san, Chỉ số đô thị — mỗi kỳ một thư mục, Tú tự đăng (§6A) |

**Mô hình hoạt động:** đây là website tĩnh sinh sẵn (static site generator), chạy bằng Node ≥ 18 và **không dùng thư viện ngoài nào**. Lệnh `node scripts/build.mjs` đọc dữ liệu, nội dung và template rồi sinh ra thư mục `dist/`. Hosting (Cloudflare Pages) tự chạy lệnh build mỗi khi có commit mới lên `main`.

- **Trang chủ** gồm menu 5 chương render sẵn thành HTML tĩnh. Trang chủ không tải nội dung bài, không tải ảnh bài, không tải search index.
- **Thanh menu NAT** (`templates/partials/global-nav.html`) nằm trên mọi trang: Cẩm nang · World Atlas · Nhật san · Chỉ số đô thị · YouTube · Liên hệ ▾. Giữ đúng bản đang chạy trước 2.0.
- **Trang bài** là một trang thật tại `/cam-nang/<slug>/` (giữ nguyên địa chỉ bản trước đã công khai), có sẵn toàn bộ nội dung và thẻ SEO/OG. Trang dùng lại khung "panel" của v57 (dải màu, thanh tiêu đề, nút PDF, footer tác giả) nhưng ở dạng trang, không phải modal.
- **World Atlas** `/atlas/` và **Nhật san** `/nhat-san/`: trang thư viện và trang từng kỳ, sinh tự động từ `publications/`.
- **Search** dùng `dist/data/search-index.json` (chỉ chứa metadata). File này chỉ được tải khi người dùng bấm vào ô tìm kiếm.

## 2. Cấu trúc thư mục

```
PROJECT_RULES.md          ← file này
README.md  CHANGELOG.md  package.json  site.config.json  .nvmrc  .gitignore
data/
  articles.json           ← metadata mọi bài (nguồn duy nhất)
  categories.json         ← 5 chương + cấu trúc menu trang chủ
  images.json             ← manifest ảnh (kích thước, các biến thể) — do scripts/images.py quản lý
  redirects.json          ← chuyển hướng slug cũ → slug mới
content/articles/<slug>.html   ← thân bài (HTML fragment)
publications/atlas/<kỳ>/  publications/nhat-san/<kỳ>/   ← ấn phẩm theo kỳ (xem publications/README.md)
templates/
  home.html  article.html  404.html  publication-index.html  publication-issue.html
  partials/global-nav.html  partials/home-header.html  partials/search.html  partials/article-footer.html
assets/
  css/main.css            ← CSS duy nhất (v57 giữ nguyên + mục "2.0" ở cuối)
  js/home.js  js/article.js
  images/site/            ← chân dung, avatar
  images/articles/<slug>/NN-<rộng>.webp
  images/og/<slug>.jpg    ← ảnh chia sẻ 1200×630 (trang-chu.jpg cho trang chủ)
scripts/
  build.mjs               ← kiểm tra + build (bắt buộc chạy trước khi giao)
  new-article.mjs         ← tạo bài mới
  images.py               ← xử lý ảnh, tạo ảnh OG (Python + Pillow)
  make-update.sh          ← đóng gói các file đã đổi thành update-*.zip
  check-dist.mjs          ← kiểm thử hồi quy SEO sau build (khóa URL, canonical, noindex, JSON-LD, link hỏng)
  audit-links.mjs         ← kiểm kê liên kết nội bộ (inbound/outbound, trang mồ côi), xuất CSV
  migration/              ← lưu trữ script chuyển đổi v57 → 2.0 (không dùng nữa)
tests/smoke.py            ← kiểm thử trình duyệt (Playwright)
tests/published-urls.json ← KHÓA URL đã xuất bản (chỉ cập nhật khi Tú duyệt đổi URL, kèm redirect)
docs/                     ← DEPLOY.md, CONTENT_GUIDE.md, MIGRATION_REPORT.md
dist/                     ← SINH TỰ ĐỘNG, không commit, không sửa tay
```

## 3. Data schema

### 3.1 `data/articles.json` — mảng, mỗi phần tử là một bài

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `id` | ✔ | ID ổn định, không đổi. Bài từ v57 giữ ID panel cũ (vd `marq`). Bài mới dùng slug đổi `-` thành `_`. |
| `slug` | ✔ | URL `/cam-nang/<slug>/`. Chỉ gồm `a-z0-9-`, không dấu. **Đã xuất bản thì không đổi** (xem §6). |
| `status` | ✔ | `published`: hiển thị, được index. `stub`: "đang cập nhật", hiển thị nhưng gắn `noindex`. `archived`: bản cũ lưu trữ, không có trong menu và search, gắn `noindex`, vẫn có URL để không mất dữ liệu. |
| `title` | ✔ | Tiêu đề dùng trong menu và search (không kèm emoji). |
| `subtitle` | | Dòng phụ trong menu và search. |
| `icon` | | Emoji đứng trước tiêu đề trong menu. |
| `category` | ✔ | Một trong: `phap-luat`, `chien-luoc-quy-hoach`, `tu-duy-dau-tu`, `du-an-chon-loc`, `nha-phat-trien`. |
| `parent` | | Slug bài cha (vd dự án thuộc vùng, bài con thuộc hub). |
| `tags` | | Mảng chuỗi không dấu. |
| `description` | ✔ | 1–2 câu **hoàn chỉnh**, ≤ 160 ký tự, không cắt giữa câu, không kết thúc bằng "…" (build cảnh báo). |
| `seoTitle` / `seoDescription` | | Dùng cho `<title>`, `og:title`, `og:description`. Nếu trống thì lấy `title` / `description`. |
| `thumbnail` / `heroImage` | | Khóa ảnh trong `images.json`, vd `the-marq/01`. |
| `ogImage` | ✔ | `assets/images/og/<slug>.jpg`. Nếu thiếu file, build cảnh báo và dùng ảnh trang chủ. |
| `publishedDate` / `updatedDate` | ✔ | `YYYY-MM-DD`. Bài chuyển từ v57 mang ngày migration 2026-09-28 (ngày gốc không được lưu trong v57). |
| `author` | ✔ | `nguyen-anh-tu`. |
| `content` | ✔ | `content/articles/<slug>.html`. |
| `relatedArticles` | | Mảng slug các bài được liên kết tới. |
| `section` | ✔ | Nhãn ở đầu trang bài (vd `🏛️ Dự Án Chọn Lọc`). |
| `accent` | ✔ | Màu nhấn hex của bài (xem §8.3). |
| `searchKeywords` | | Từ khóa tìm kiếm, tối đa khoảng 700 ký tự, chỉ văn bản thuần. |
| `facts` | | Chỉ cho bài dự án: mảng **2–4** phần tử `{"n":"1.622","l":"căn hộ · 2 block"}` (`n` = số lớn, ngắn, ≤ 8 ký tự; `l` = nhãn). Hiện thành dải số liệu ngay dưới tiêu đề. **Chỉ lấy số đã có trong bài**, không thêm số mới (§8.1). Bài có đủ mục 01–04 mà thiếu `facts` thì build cảnh báo. |
| `legacy` | | `{source:"v57", panelId}` cho bài cũ; link `/#panelId` tự chuyển về URL mới. Bài mới để `null`. |

### 3.2 `data/categories.json`
Mảng 5 chương theo thứ tự hiển thị. Mỗi chương gồm `id, ch, num, icon, title, tagline, badge, layout, items`. Hai kiểu `layout`:
- `list` (chương 1, 2, 3, 5): `items: [{article}]`
- `zones` (chương 4): `items: [{article, num, star?, highlight?, projects:[{article, star?, label?}]}]`

Tiêu đề và dòng phụ trong menu lấy từ `articles.json`, không nhập trùng ở đây. `badge` là văn bản tự do và phải cập nhật tay khi số bài thay đổi.

### 3.3 `data/images.json`
`{"<slug>/NN": {"w": rộng, "h": cao, "v": [640, 1280, ...]}}`. **Chỉ `scripts/images.py` được sửa file này.**

### 3.4 `site.config.json`
Gồm version, tên miền (`siteUrl`), `basePath`, thông tin tác giả (điện thoại, Zalo, Facebook, **fanpage**, YouTube) và link font. Điền `author.fanpage` thì nút Fanpage tự hiện ở trang chủ và footer bài.

## 4. Quy tắc nội dung bài (`content/articles/*.html`)

1. Chỉ chứa **thân bài**: không có `<html>`, `<head>`, `<body>`, `<script>`, `<style>`.
2. Bắt đầu bằng đúng **một** `<h1 class="p-h1">Tiêu đề<br><em ...>— phụ đề</em></h1>`. Bài vùng/dự án có thể đặt ảnh hoặc badge phía trước h1.
3. **Ảnh:** `<img data-img="<slug>/NN" alt="mô tả" style="width:100%;display:block;border-radius:6px">`. Build tự sinh `src/srcset/sizes/width/height/lazy`. Ảnh đầu tiên được tải ưu tiên. Chú thích ảnh viết bằng thẻ in nghiêng tiếng Việt ngay bên dưới. **Mọi `<img>` phải có thuộc tính `alt`**: ảnh mang thông tin (bản đồ, sơ đồ, phối cảnh, biểu đồ) → alt mô tả ngắn nội dung ảnh, không nhồi từ khóa; ảnh thuần trang trí → `alt=""` ghi tường minh (build cảnh báo khi thiếu hẳn thuộc tính). Alt mô tả **đúng điều ảnh đang hiển thị**.
4. **Liên kết tới bài khác:** `<a href="/cam-nang/<slug>/" class="xl-b proj-row">…</a>` cho khối, `<a href="/cam-nang/<slug>/" class="xl-i">…</a>` cho chữ. Không dùng `onclick="openPanel()"` (đã bỏ từ 2.0). Build báo lỗi nếu link trỏ tới slug không tồn tại.
5. Tương tác được phép gọi trực tiếp trong nội dung (định nghĩa trong `article.js`): `toggleFaq(this)`, `showCluster('id', this)`, `filterPrinciple('tag', this)`. Muốn thêm tương tác mới thì đó là việc kỹ thuật, xem §11.
6. Chỉ dùng các class CSS đã có: `p-h1 p-lead p-h2 p-p p-card p-grid p-call p-call-lbl knums knum knum-n knum-l p-tl proj-row project-hub zone-badge p-warn p-travel p-360 p-360-tabs p-360-tab p-360-stage p-360-play p-360-bar p-360-full`… (`p-facts`, `p-sec`, `mix-row`, `mix-bar` do build/JS tự sinh, không viết tay). Không tạo CSS mới trong nội dung. Inline style chỉ dùng cho màu hoặc khoảng cách nhỏ, giống cách v57 đang làm.
7. Tuyệt đối không Base64, không nhúng file, không iframe khi Tú chưa duyệt. **Ngoại lệ đã duyệt (2026-10-01):** khối `.p-360` (iframe do JS tạo khi người đọc bấm) và chỉ với host trong `embedHosts` của `site.config.json`. Không viết `<iframe>` trong nội dung; thêm host mới phải được Tú duyệt (build báo lỗi nếu sai).
8. **Trang dự án (cấu trúc 01–04):** bài dự án chuẩn có 4 vạch chia mục đúng mẫu `<div style="display:flex;align-items:center;gap:10px;margin:NNpx 0 6px"><span …>0N</span><span …>Nhãn</span></div>` với N = 01 Tổng quan dự án · 02 Chi tiết dự án · 03 Góc nhìn nhà tư vấn · 04 Phân tích & đánh giá. Build nhận diện đúng mẫu này để dựng thanh điều hướng nổi (Tổng quan · Chi tiết · Góc nhìn · SWOT; hiện khi có ≥ 3 vạch). **Sao chép nguyên vạch từ bài mẫu `nam-mekong-grand-plaza`, không tự chế lại.** Chi tiết và mẫu HTML: `docs/CONTENT_GUIDE.md` §3A.

## 5. Quy tắc ảnh

- Đầu vào JPG/PNG. Luôn xử lý qua `python3 scripts/images.py add <slug> file…`, công cụ sẽ sinh WebP 640/1280/2048 (không phóng to ảnh nhỏ).
- Tên file do công cụ đặt (`NN-<rộng>.webp`). **Không ghi đè file ảnh đã xuất bản.** Muốn thay ảnh thì thêm ảnh mới (số NN mới) rồi đổi `data-img`, vì ảnh được cache 30 ngày.
- Ảnh OG: `python3 scripts/images.py og <slug>`. Nếu bài có `heroImage`, ảnh OG được cắt từ ảnh đó; nếu không, công cụ tạo thẻ thương hiệu tối màu có tiêu đề.
- Xử lý màu ấm và xóa logo (xem §8.4) làm **trước** khi `add`.
- Trang chủ không bao giờ được tải ảnh bài.

## 6. Routing & URL

- Bài: `/cam-nang/<slug>/` (có dấu `/` cuối). Mở trực tiếp, refresh, Back/Forward và chia sẻ đều hoạt động vì mỗi bài là một file thật.
- **Slug đã xuất bản là vĩnh viễn.** Nếu bắt buộc phải đổi: đổi slug trong `articles.json`, đổi tên file nội dung, đổi thư mục ảnh, cập nhật mọi link, **thêm** `{"from":"slug-cu","to":"slug-moi"}` vào `data/redirects.json` (build sinh `_redirects` 301 + trang chuyển hướng dự phòng).
### 6B. Redirect registry (`data/redirects.json`)
- **Mọi thay đổi URL phải được ghi vào đây**; build sinh `_redirects` (301). Danh sách rỗng `[]` là bình thường — khi chưa có URL nào đổi thì **không sinh redirect** (không tạo redirect giả).
- Hai dạng mục: bài Cẩm nang theo slug `{"from":"slug-cu","to":"slug-moi"}`; hoặc đường dẫn đầy đủ `{"from":"/cam-nang/slug-cu/","to":"/bat-dong-san/trang-moi/"}` (dùng khi chuyển bài sang kiến trúc URL mới, Phase 2+).
- Build báo lỗi nếu: đích không tồn tại, nguồn vẫn là trang thật, trùng nguồn, chuỗi/vòng chuyển hướng (luôn trỏ thẳng tới đích cuối).
- Trước khi giao: `node scripts/check-dist.mjs` — URL trong `tests/published-urls.json` không được biến mất hay đổi canonical, trừ khi đã có redirect.

- Link cũ (`/#marq`, `/?p=marq` từ v57, `/?bai=marq` từ bản trước) tự chuyển sang URL mới qua bảng `legacy` trong search index.
- Ấn phẩm: `/atlas/`, `/atlas/<kỳ>/`, `/atlas/<kỳ>/doc/` (bản đọc HTML) — tương tự với `/nhat-san/` và `/chi-so-do-thi/`.
- Nút ✕ trên trang bài: quay lại trang trước nếu người đọc đến từ Cẩm nang, ngược lại về trang chủ.

## 6A. Ấn phẩm theo kỳ (World Atlas, Nhật san, Chỉ số đô thị)

- Mỗi kỳ là một thư mục `publications/<atlas|nhat-san>/<kỳ>/`, gồm `info.txt` (tieu-de, so, ngay, mo-ta, trang-thai), `bia.jpg`, và nội dung: PDF, ảnh `trang-NN.jpg`, hoặc một file `.html` tự chứa. Chi tiết trong `publications/README.md`.
- `trang-thai: nhap`: trang vẫn được tạo để xem thử qua link, nhưng gắn `noindex`, không hiện trong thư viện, không có trong sitemap. `trang-thai: cong-bo`: công bố.
- File `.html` của kỳ được giữ nguyên thiết kế. Khi build, ảnh Base64 bên trong được tự tách ra file.
- Khi thư viện trống, trang hiện đúng nội dung "Chưa có ấn phẩm được công bố" như bản trước.
- Tên mục, nhãn và mô tả của World Atlas / Nhật san nằm trong `site.config.json` → `publications`.

## 7. SEO & chia sẻ mạng xã hội

Mỗi trang bài được build với: `<title>`, `description`, `canonical`, `og:title`, `og:description`, `og:image` (1200×630, URL tuyệt đối), `og:url`, `og:type=article`, `twitter:card` và JSON-LD. Tất cả nằm sẵn trong HTML, **không phụ thuộc JavaScript**. Bài có status `stub` hoặc `archived` được gắn `noindex, follow` và không có trong `sitemap.xml`. Build cũng sinh `robots.txt` và `sitemap.xml`.

**Trang riêng (từ 2.5.0)** — khai báo trong `data/pages.json` (lane Nội dung): `profile` = hồ sơ tác giả `/nguyen-anh-tu/` (`ProfilePage`, trỏ tới `Person` bằng `@id`; mọi bài và trang chủ đều link tới đây qua tên tác giả); `hub` = trang chủ đề/pillar, hiện `/bat-dong-san/tphcm/` (`CollectionPage` + `ItemList`). Mô tả từng bài trong hub lấy tự động từ `description` của bài, chỉ bài `published` được đưa vào; bài nằm trong hub tự có dòng "Thuộc chủ đề: …" cuối bài để trỏ ngược về pillar. Thêm hub mới = thêm một mục vào `pages.json`, không sửa code. Địa chỉ trang riêng là vĩnh viễn (§6B nếu đổi).

**JSON-LD (từ 2.4.0)** — một `@graph` mỗi trang bài: `WebSite` + `Person` (Nguyễn Anh Tú, có `sameAs`) + `WebPage` + `Article` + `BreadcrumbList`, nối với nhau bằng `@id` (`https://nguyenanhtu.vn/#website`, `…/#person`). Trang chủ: `WebSite` + `Person`. **Không tạo `Organization`** cho tới khi có tổ chức xuất bản thật được Tú xác nhận. Muốn thêm hồ sơ chính thức (TikTok, LinkedIn, Zalo OA…): thêm URL https vào `author.sameAs` trong `site.config.json` — mọi trang tự cập nhật.

**Tiêu đề ngữ nghĩa (từ 2.4.0)** — mỗi trang chỉ có 1 `<h1>`. Build tự đổi `<p class="p-h2">` thành `<h2 class="p-h2">` (không sửa file nội dung, hiển thị không đổi); bài dự án có vạch 01–04 thì vạch là `<h2 class="p-sec">` còn `p-h2` là `<h3>`; `p-h2` cỡ 13px (tiểu mục) là `<h3>`. Build báo lỗi nếu bài không có đúng 1 `<h1>`.

**Breadcrumb (từ 2.4.0)** — đầu mỗi trang bài: Trang chủ › chương › các bài cha đã `published` (theo `parent`) › bài hiện tại, kèm `BreadcrumbList`. Chương chỉ hiện chữ vì chưa có URL riêng; JSON-LD chỉ gồm URL canonical thật.

Sau khi đăng bài quan trọng: dán URL vào Facebook Sharing Debugger rồi bấm "Scrape Again" để Facebook lấy ảnh và tiêu đề mới.

## 8. Chuẩn biên tập (bất biến)

### 8.1 Phân tầng nguồn — bắt buộc
Văn bản pháp lý chính thức (Nghị quyết, Quyết định, Nghị định, Luật) mang giá trị pháp lý. Tài liệu tư vấn (BCG, Roland Berger, Knight Frank, CBRE) phải ghi rõ là **đề xuất/dự báo**. Báo chí thứ cấp có thể sai và phải đối chiếu lại. Không trộn lẫn các tầng nguồn.

### 8.2 Kiến trúc nội dung
Chương Chiến Lược & Quy Hoạch giải thích logic quy hoạch và **chức năng** của vùng: vùng *làm gì* cho đô thị đứng trước, hạ tầng đứng sau. Khuyến nghị dự án nằm riêng ở Dự Án Chọn Lọc, hai phần nối với nhau bằng link. Mỗi phân tích xoay quanh một khung phân tích có tên. Góc nhìn chủ đạo: "nhà phát triển nền tảng đô thị".

**Khung chuẩn bài dự án (5 phần):**
1. Lời giới thiệu (ảnh/clip + Prologue).
2. Tổng quan: vị trí, quy mô (diện tích, loại hình, hệ số sử dụng đất, số sản phẩm theo loại), nhà phát triển (CĐT, phát triển, thiết kế, tổng thầu), giai đoạn.
3. Chi tiết: phối cảnh, tiện ích, loại hình sản phẩm, chính sách.
4. "Vì sao tôi chọn [dự án]", chia cho cư dân và cho nhà đầu tư.
5. SWOT + thang điểm 1–5, gồm: CĐT uy tín; pháp lý; chính sách; vị trí (5 chỉ số con); lợi ích cư dân (7 chỉ số con); lợi ích nhà đầu tư (4 chỉ số con); điểm trung bình.

### 8.3 Màu
Dự án `#b05040` · Nhà phát triển `#9b72cf` · Chiến lược `#4aaa7f` · Pháp luật `#5280c8` · Vàng thương hiệu `#c8993a`.

### 8.4 Xử lý ảnh (trước khi `add`)
Tông ấm: multiply, điểm trắng kem RGB 245,238,226, tương phản ×1.18+0.02, đỏ ×1.03, xanh dương ×0.94. Với bản đồ, áp ở cường độ 70%. Xóa logo bằng OpenCV `INPAINT_TELEA` bán kính 7.

## 9. Hiệu năng (ưu tiên mobile)

- Trang chủ hiện tải khoảng **62 KB gzip** (HTML + CSS + JS + chân dung, chưa tính font). Con số này **không được tăng theo số bài**, trừ phần menu (khoảng 0,3 KB mỗi bài).
- Không thêm thư viện JS/CSS nếu Tú chưa duyệt. Không nhân bản CSS/JS: chỉ có 1 file CSS và 2 file JS.
- Google Fonts tải không chặn hiển thị (`rel=preload as=style` + `onload`, có `<noscript>`); tạo ở `fontsLink` trong `build.mjs`. Ảnh LCP của bài đã được phát hiện sớm nhờ `fetchpriority="high"` ở ảnh đầu tiên — **không preload hàng loạt ảnh**.
- JS luôn dùng `defer`. Search index tải lười. Ảnh luôn `lazy` (trừ ảnh đầu bài).
- Cache: `/assets/css|js/*` 1 năm (cache-bust bằng `?v=<version>`), ảnh 30 ngày, HTML không cache (`dist/_headers`).
- **Tăng `version` trong `site.config.json` mỗi khi sửa CSS/JS**, nếu không người đọc sẽ thấy CSS/JS cũ trong cache.

## 10. Versioning

- `2.0.0` là kiến trúc nền. Tăng số giữa (`2.1.0`) khi thêm chức năng mới, tăng số cuối (`2.1.1`) khi sửa lỗi.
- **Thêm hoặc sửa bài thì KHÔNG tăng version**, chỉ ghi vào `CHANGELOG.md` mục "Nội dung".
- Duy trì **một** project source duy nhất. Không bao giờ tạo lại một file HTML khổng lồ.

## 11. Phân làn công việc (Claude ⇄ ChatGPT)

| Làn | Phạm vi được sửa | Không được sửa |
|---|---|---|
| **Nội dung** (mặc định: Claude) | `content/articles/`, `data/articles.json`, `data/categories.json`, `data/redirects.json`, ảnh qua `scripts/images.py`, `CHANGELOG.md` | CSS, JS, templates, scripts |
| **Ấn phẩm theo kỳ** (Tú đăng; GPT/Claude có thể giúp biên soạn nội dung kỳ) | `publications/<mục>/<kỳ>/` | Mọi thứ khác |
| **Kỹ thuật** (Claude hoặc ChatGPT, khi Tú yêu cầu) | `assets/css`, `assets/js`, `templates/`, `scripts/`, `tests/`, cấu hình deploy, `site.config.json` | Nội dung bài (trừ khi đổi schema; khi đó phải cập nhật §3 và chuyển đổi toàn bộ dữ liệu) |

**Không AI nào tự deploy lên hosting.** Website chỉ được cập nhật bằng cách đẩy lên GitHub `main`; Cloudflare Pages tự build. Trước 2.0, bản GPT được host trên nền tảng của OpenAI (bản ghi `_openai-site-verification` và `_cf-custom-hostname`). Bản đó ngừng dùng sau khi chuyển tên miền.

Các làn **không bao giờ làm song song trên hai bản khác nhau**. Mỗi phiên luôn bắt đầu từ `main` mới nhất. Nếu hết hạn mức, AI kia có thể làm thay bất kỳ làn nào, miễn tuân thủ file này.

### 11.0 Vai trò của Tú — giữ đơn giản nhất

Tú chỉ làm 2 việc: **(1) gửi nội dung, (2) thả gói cập nhật lên GitHub.** Mọi việc kỹ thuật còn lại là của AI.

| Tú nói | AI làm | Tú nhận |
|---|---|---|
| "Thêm bài này vào Cẩm nang" + nội dung/ảnh/tài liệu | Viết bài theo §8, tích hợp theo §11.1, build 0 lỗi, chạy kiểm thử | `update-….zip` + 1–2 câu tóm tắt đã thay đổi gì |
| "Sửa bài [tên bài]: …" | Sửa nội dung, cập nhật `updatedDate` | `update-….zip` |
| "Đăng kỳ Atlas/Nhật san" + file bìa/PDF/HTML | Tạo thư mục kỳ trong `publications/`, viết `info.txt` (mặc định `nhap`) | `update-….zip` + link xem thử bản nháp |
| "Công bố kỳ [tên kỳ]" | Đổi `trang-thai: cong-bo` | `update-….zip` |

Sau khi nhận gói, Tú: giải nén **đè** vào thư mục kho trên máy → GitHub Desktop → Summary → **Commit to main** → **Push origin**. Khoảng 1–2 phút sau website cập nhật.

AI luôn phải: lấy bản mới nhất từ GitHub trước khi làm; chỉ đưa vào gói các file đã đổi; nói rõ nếu có file cần **xóa** (kèm `DELETED_FILES.txt`); không bắt Tú chạy lệnh hay sửa file.

### 11.1 Quy trình "Thêm bài này vào Cẩm nang"
1. Lấy source mới nhất: `git clone --depth 1 https://github.com/nguyenanhtu0104-design/website-nguyenanhtu-2.0.0-source.git`. Kho công khai, không cần mật khẩu.
2. `node scripts/new-article.mjs --title … --category … [--parent …] [--nav] [--star]` để tạo slug, metadata và file khung.
3. Viết nội dung vào `content/articles/<slug>.html` theo §4 và §8. Điền `description`, `seoDescription`, `searchKeywords`.
4. Ảnh: xử lý tông màu, rồi `python3 scripts/images.py add <slug> …`, rồi dán các thẻ `data-img`.
5. `python3 scripts/images.py og <slug>`.
6. Nếu cần: cập nhật link từ bài vùng/hub cha và `badge` chương trong `categories.json`.
7. `node scripts/build.mjs` phải báo 0 lỗi. Nên chạy thêm `python3 tests/smoke.py`.
8. Ghi `CHANGELOG.md`. Chạy `bash scripts/make-update.sh` để có `update-*.zip`, rồi giao cho Tú kèm danh sách file.

## 12. Nguyên tắc tuyệt đối — KHÔNG ĐƯỢC PHÁ VỠ

1. Không quay lại mô hình một file HTML chứa toàn bộ nội dung và dữ liệu.
2. Không Base64 cho ảnh, dù chỉ một ảnh.
3. Không làm mất dữ liệu: không xóa bài, chỉ chuyển sang `archived`.
4. Không đổi slug đã xuất bản nếu không có redirect.
5. Không tự ý đổi giao diện đã duyệt: menu, màu, font, khối tác giả, footer, bố cục trang bài.
6. Giữ nguyên thông tin liên hệ: Hotline/Zalo 0978 618 149, Facebook, Fanpage, YouTube @nguyenanhtu.kienphat, profile Nguyễn Anh Tú.
7. Không sửa `dist/` bằng tay. Không commit `dist/`.
8. Không giao bản nào mà `node scripts/build.mjs` còn báo lỗi.
9. Không thêm thư viện, tracking hay script bên thứ ba khi Tú chưa duyệt.
10. Nội dung pháp lý và quy hoạch phải tuân thủ phân tầng nguồn (§8.1).
11. Không deploy thẳng lên hosting bằng bất kỳ đường nào khác ngoài GitHub `main`.
12. Không xóa hay đổi địa chỉ `/cam-nang/`, `/atlas/`, `/nhat-san/`.
13. Không làm mất URL đã xuất bản hay đổi canonical của chúng mà không có mục trong `data/redirects.json` (§6B) và sự đồng ý của Tú.

## 13. Checklist trước khi giao

- [ ] `node scripts/build.mjs` → 0 lỗi, đã đọc các cảnh báo
- [ ] `node scripts/check-dist.mjs` → ĐẠT (khóa URL, canonical, noindex, JSON-LD, link hỏng)
- [ ] Bài mới có `description`, ảnh OG, link từ menu hoặc từ bài cha
- [ ] Nếu sửa CSS/JS: đã tăng `version`
- [ ] Đã ghi `CHANGELOG.md`
- [ ] `update-*.zip` chỉ chứa file đã đổi, không chứa `dist/`

## 14. Nhật ký thay đổi nguyên tắc
- 2026-10-05 — **2.9.0** (Tú yêu cầu): thêm menu "Chỉ số đô thị" `/chi-so-do-thi/` (mục ấn phẩm thứ ba, cùng cơ chế §6A, nằm sau Nhật san trên thanh NAT). Địa chỉ mới là vĩnh viễn (§6B nếu đổi). Không đổi nguyên tắc nào khác; báo cáo HTML đưa vào không được tải thư viện/CDN ngoài (§12.9).
- 2026-10-03 — Không đổi nguyên tắc. Tú yêu cầu gỡ bài trùng `dong-tien-la-vua-…` (chương Tư duy đầu tư): áp dụng §6B (301 sang bài giữ lại + xóa file nội dung, theo tiền lệ `the-solis` → `skysolis`) thay vì chuyển `archived`, vì URL đã xuất bản bị khóa trong `tests/published-urls.json` (archived sẽ noindex và rơi khỏi sitemap).
- 2026-10-02 — **2.7.0** (Tú duyệt): (1) thang chữ trang bài lớn hơn (đoạn văn 16px, thẻ/hỏi đáp 15px, nhãn nhỏ nhất 12px, `p-h2` 22px), chỉ trong thân bài; (2) khối `.p-price` / `.p-offers` cho mục giá và ưu đãi; (3) hiệu ứng hiện dần khi lướt trong `article.js`, tôn trọng "giảm chuyển động" và không ẩn nội dung khi tắt JS (ngoại lệ có chủ đích của §12.5); (4) SEO trang dự án: thêm mục "❓ Hỏi & Đáp" cuối mục 04, title dạng "Tên dự án: Giá, Pháp Lý, Tiến Độ 2026", và trong mục 02 đưa "Giá Bán & Chính Sách" lên đầu (thứ tự mới thay cho thứ tự ở §8.2: Giá & Chính sách → Loại hình → Phối cảnh → Tiện ích → Ngoại khu → Tham quan 360°). Clip giới thiệu dự án trên Facebook luôn được giữ ở đầu bài.
- 2026-10-02 — **2.6.0** (Tú yêu cầu): thêm `assets/js/zoom.js` (xem ảnh lớn, tự gắn cho ảnh nội dung trang bài; ngoại lệ có chủ đích của §9 "2 file JS" vì chỉ tải ở trang bài, không tăng trang chủ), khối `.p-cta-box`/`.p-cta` (nút mở công cụ) và nâng khung trang bảng tính trong `assets/tools/`. Ảnh nội dung trang bài nên nạp bản gốc đủ lớn (tới 2048px) để phóng to đọc được.
- 2026-10-02 — Tú duyệt thêm host `360.skysolis.my` vào `embedHosts` (SkySOLIS, chế độ mở tab mới) và cho phép trang công cụ tĩnh `assets/tools/<tên>/` (HTML tự chứa của Tú, `noindex`, ảnh tách file, không Base64). Không đổi nguyên tắc nào khác.
- 2026-10-02 — **2.5.0** (Tú: "tự làm" SEO, ủy quyền Claude): SEO Phase 2 — trang `/nguyen-anh-tu/` (hồ sơ tác giả, `ProfilePage`) và `/bat-dong-san/tphcm/` (pillar, `CollectionPage`, 27 bài chia 6 nhóm), `data/pages.json`, dòng "Thuộc chủ đề" cuối bài trong hub, link tên tác giả ở footer bài và trang chủ, thêm một dòng giới thiệu hai trang mới ở đầu trang chủ (ngoại lệ có chủ đích của §12.5). Không đổi URL nào đã xuất bản.
- 2026-10-01 — **2.4.0** (Tú yêu cầu SEO Phase 1, không đổi URL, không migrate `/cam-nang/`): tiêu đề ngữ nghĩa h2/h3 (ngoại lệ có chủ đích của §12.5: thêm breadcrumb đầu bài), breadcrumb + `BreadcrumbList`, JSON-LD `WebSite`/`Person`/`WebPage`/`Article` nối bằng `@id` + `sameAs`, Google Fonts không chặn hiển thị, `_redirects` 301 thật từ `data/redirects.json` (§6B), `scripts/check-dist.mjs` + `tests/published-urls.json` (khóa 80 URL), `scripts/audit-links.mjs`. Nội dung: viết lại 72 meta description bị cắt "…", thêm `alt` cho 47 ảnh, đổi `<title>` bản lưu trữ bị trùng.
- 2026-09-28 — Ban hành 2.0.0 (migration từ v57). Tên miền nguyenanhtu.vn. Phân làn Claude (nội dung) / ChatGPT (kỹ thuật, tùy chọn).
- 2026-09-29 — Lên GitHub + Cloudflare Pages. Vai trò của Tú rút gọn còn "gửi nội dung → thả gói cập nhật" (§11.0).
- 2026-10-01 — **Ngừng dùng CamNangBDS v64 làm nguồn nội dung.** Đã đồng bộ toàn bộ v64 vào kho (180 bài). Từ nay mọi thêm/sửa bài chỉ thực hiện trên kho GitHub `main` (§1, §11). Đồng bộ nhãn tác giả thành "ERA Vietnam · Project Director" (khối tác giả, theo bản v64 của Tú).
- 2026-10-01 — **2.3.1**: Nam Mekong chuyển khối 360° sang chế độ mở tab mới vì trang Tech3Art lỗi khi nhúng; bỏ `sandbox`.
- 2026-10-01 — **2.3.0** (Tú duyệt nhúng 360°): khối `.p-360` nhúng trang 3D của Tech3Art (360nmkbd.tech3art.com) vào mục 02 của Nam Mekong; ngoại lệ có kiểm soát của §4.7.
- 2026-10-01 — **2.2.0** (Tú yêu cầu "áp dụng cho cả bài thường"): mọi bài rộng 860px trên laptop; bài có ≥ 3 tiêu đề `p-h2` có mục lục cột phải tự sinh (build gắn `id="h-N"`, không viết tay). Trang chủ giữ nguyên.
- 2026-10-01 — **2.1.1** (Tú yêu cầu): bố cục máy tính cho trang dự án (≥ 1100px): khung 1180px, cột phải dính (mục lục + liên hệ). Bài không có đủ mục 01–04 giữ cột 640px như cũ.
- 2026-10-01 — **2.1.0** (Tú duyệt, nâng cấp bố cục trang dự án — ngoại lệ có chủ đích của §12.5): thanh CTA cố định trên điện thoại (nhóm Dự Án Chọn Lọc), thanh điều hướng nổi trong bài, dải số liệu `facts`, thanh tỷ lệ cho bảng có cột "Tỷ lệ", khối `p-travel` (vị trí theo phút), build cảnh báo SWOT "Chưa ghi nhận". Sửa lỗi 2.0.0: hiệu ứng `pageIn` làm trang rộng 418px trên điện thoại. Hoàn thiện mẫu cho Nam Mekong Grand Plaza và Artisan Park; các dự án khác set sau.
- 2026-09-29 — Gộp phần vỏ website đang chạy (bản GPT): thanh menu NAT, nút Liên hệ, World Atlas, Nhật san, nút "Sao chép liên kết", dòng tác giả "Nguyễn Anh Tú · Tư vấn bất động sản". URL bài giữ `/cam-nang/<slug>/` như bản đang chạy. Thêm cơ chế đăng ấn phẩm theo kỳ bằng thư mục.
