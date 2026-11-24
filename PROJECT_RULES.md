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
| Ấn phẩm theo kỳ | `publications/<mục>/<kỳ>/` | World Atlas, Atlas VietNam, Atlas Banking, Nhật san, Chỉ số đô thị — mỗi kỳ một thư mục, Tú tự đăng (§6A) |

**Mô hình hoạt động:** đây là website tĩnh sinh sẵn (static site generator), chạy bằng Node ≥ 18 và **không dùng thư viện ngoài nào**. Lệnh `node scripts/build.mjs` đọc dữ liệu, nội dung và template rồi sinh ra thư mục `dist/`. Hosting (Cloudflare Pages) tự chạy lệnh build mỗi khi có commit mới lên `main`.

- **Trang chủ** gồm menu 5 chương render sẵn thành HTML tĩnh. Trang chủ không tải nội dung bài, không tải ảnh bài, không tải search index.
- **Thanh menu NAT** (`templates/partials/global-nav.html`) nằm trên mọi trang: Cẩm nang · World Atlas · Atlas VietNam · Atlas Banking · Nhật san · Chỉ số đô thị · YouTube · Liên hệ ▾. Giữ đúng bản đang chạy trước 2.0.
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
| `theme` | | Tùy chọn (từ 2.11.0). Tên giao diện riêng của bài, chỉ gồm `a-z0-9-`; build thêm class `theme-<tên>` vào `<html>` và `<body>`. CSS của giao diện nằm ở cuối `assets/css/main.css`. Hiện có: `norton-park`. |
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
- 2026-11-21 — **2.55.0** (Tú giao: quét mọi vùng trên web và dựng sa bàn tiếp nối, cần gì hỏi): **mỗi nhóm vùng một sa bàn**, dùng chung `assets/tools/nam-mekong/showroom.js` qua `window.SB_VUNG` (xem §19). Thứ tự: 1 Trung tâm TP.HCM · 2 Thủ Đức · 3 Bình Dương (QL13, Mỹ Phước – Tân Vạn) · 4 Phía Nam · 5 Long Thành – Đại Phước · 6 Tây Bắc, Miền Tây · 7 Kinh tế biển. Toạ độ dự án: dùng toạ độ có nguồn đã có trong bản đồ dự án của website, còn lại xin Tú (Google Maps); không đặt theo ước lượng.
- 2026-11-21 — **2.54.0** (Tú duyệt: nền tảng có nút hiện tất cả dự án, chạm khối mở hồ sơ, giỏ hàng; sau này Tìm nhà đi theo vùng): **dự án chưa có giỏ hàng vào sa bàn bằng toạ độ Tú gửi** (Google Maps), không tự đoán vị trí khi ảnh vệ tinh cũ hơn công trình. Khối minh hoạ phải nhẹ, ưu tiên thao tác mượt; thẻ dự án ghi rõ "khối minh hoạ, chưa theo mặt bằng". Khi có bảng hàng mới bật chọn căn.
- 2026-11-21 — **2.53.0** (Tú gửi mặt bằng tầng 1, 2 và phối cảnh 360° vòng xoay A1): mặt bằng khối đế của chủ đầu tư được **khớp vào đường bao khối đế bằng phép đồng dạng tối ưu theo cạnh ảnh**, cắt theo đường bao, ngoài khối trong suốt, giữ nhãn diện tích. **Công trình mốc ngoài dự án** (ga, WTC, Trung tâm Hành chính) để trong `cong-trinh.json`: vị trí số hoá trên ảnh vệ tinh (ghi rõ gần đúng), số tầng theo nguồn công bố, chỉ ghi điều nguồn nói. Phối cảnh chủ đầu tư ghi rõ "phối cảnh chủ đầu tư"; khối dựng theo phối cảnh mà không có số đo ghi "minh hoạ".
- 2026-11-21 — **2.52.0** (Tú chốt: "chung một sa bàn", giỏ Artisan theo bảng tính 108 căn): **dự án cùng nền tảng dựng chung một sa bàn** trên cùng nền ảnh vệ tinh. Sa bàn Thành phố mới Bình Dương nằm ở `assets/tools/nam-mekong/` (Nam Mekong + Artisan Park, `artisan.json`). Dự án nhà phố đã xây xong: số hoá ranh từng dãy trên ảnh vệ tinh, chia đều theo số lô của mặt bằng phân lô, đối chiếu mã căn của quỹ đại lý với số lô (phải khớp 100%). Dự án dùng chung sa bàn khai báo `saBanTrang` kèm `#<khu>` và `anhSaBan` (thư mục ảnh đại diện riêng) trong `data/project-inventory.json`; ở Tìm nhà các dự án cùng nền tảng có sa bàn luôn hiện cạnh nhau.
- 2026-11-21 — **2.51.0** (Tú yêu cầu): nhóm dự án theo nền tảng trong Tìm nhà. Mở một dự án thuộc nền tảng thì chỉ hiện dự án đó, có nút bật các dự án khác cùng nền tảng.

- 2026-11-21 — **2.50.0** (Tú: minh hoạ khối đế và nhà ga, tuyến metro): hạ tầng quy hoạch trên sa bàn (metro, nhà ga) là **phương án theo tài liệu nguồn**, dựng trong `metro.json` có ghi nguồn; trên giao diện chỉ một dòng "phương án đang tham vấn" (§8.1), khối minh hoạ (đoàn tàu, mái ga) ghi rõ là minh hoạ. Khối dùng màu thật đặt `mau: 1` (alpha màu < 1 trong shader).
- 2026-11-21 — **2.49.0** (Tú: "Dựng nội dung tìm nhà cho Nam Mekong… giao diện sạch hơn"): sa bàn Nam Mekong `assets/tools/nam-mekong/` theo §17. **Có GCN thì ranh dựng từ sơ đồ thửa (độ dài cạnh, diện tích) rồi chỉ tịnh tiến lên ảnh vệ tinh**, giữ hướng Bắc của GCN. Toà cao tầng nằm xiên so với hướng Bắc thì đặt góc `xoay` trong `chan-thap.json`, không dựng bậc thang. Dự án chỉ có bảng giá theo trục: giá ghi "giá từ", căn ngoài bảng ghi "Liên hệ", **không thắp ô đèn khi chưa có tình trạng căn**. **Giao diện sa bàn không hiện ghi chú kỹ thuật** (phép chiếu, số ô ảnh, nguồn dựng khối); những thông tin đó nằm trong `georef.json` và CHANGELOG. Chỉ giữ dòng ghi nguồn ảnh nền mà nhà cung cấp bắt buộc.
- 2026-11-20 — **2.48.0**: Tú công bố trang Tự đánh giá dự án (`danhGia.congBo: true`).
- 2026-11-20 — **2.47.0** (Tú yêu cầu): dữ kiện tham khảo bật/tắt được; dữ kiện chỉ là thông tin, không điều hướng (build kiểm từ ngữ).
- 2026-11-20 — **2.46.0** (Tú chốt): bước đầu chỉ chọn dự án + nhu cầu; hồ sơ cá nhân ở cuối, câu hỏi theo nhu cầu (`apDung`).
- 2026-11-20 — **2.45.0**: bộ 29 thẻ theo tài liệu duyệt Tú đã sửa; lựa chọn thiên kiến có thể lấy theo dữ kiện từng dự án (`theoDuAn`).
- 2026-11-20 — **2.44.0** (Tú chốt): thang điểm tổng quan trong bài giữ nguyên, tách khỏi bộ chi tiết; nút sang bộ chi tiết đặt sau thang điểm; hồ sơ nhu cầu 11 câu (§18).
- 2026-11-20 — **2.43.0** (Tú chốt): khung 2.0 — 27 thẻ theo 6 chủ đề, hồ sơ nhu cầu tách riêng, 3 biểu đồ theo màu, giải nghĩa màu ở tổng kết, Tú chấm theo trọng số của khách (§18 viết lại).
- 2026-11-20 — **2.42.0** (Tú chốt): khách chỉ tự chấm, không nhận định tự động, không ghi tên tầng; thêm bước chọn dự án + nhu cầu có ghi chú trọng số, nút "Xem đánh giá của Tú", dự án tương tự (§18).
- 2026-11-20 — **2.41.0** (Tú yêu cầu "phát triển bộ tiêu chí đánh giá và tích hợp vào web"): thêm trang Tự đánh giá dự án `/danh-gia-du-an/` theo §18 (ngoại lệ có chủ đích của §9: `danh-gia.css` và `danh-gia.js` chỉ nạp ở trang này, không thư viện ngoài, không tăng trang chủ). Cờ `danhGia.congBo` mặc định `false` (bản xem thử, noindex, không có trong menu).

- **19/11/2026 — Chuẩn hoá quy trình dựng sa bàn dự án mới (§17).** Mọi dự án sau làm theo đúng §17: đầu vào xin trước, ba tầng định vị, tiêu chí nghiệm thu, ảnh đại diện chụp từ khối 3D, tự động hoá ký gửi bằng email.

- **19/11/2026 — Mốc định vị chỉ lấy trên công trình đã thi công.** Ghim đặt ở vị trí công trình chưa xây là ước lượng từ chính tổng mặt bằng, đưa vào phép giải sẽ tự khẳng định cái sai của mình. Chỉ dùng nút giao, vòng xoay, công trình đã có trên ảnh vệ tinh. Mốc càng xa nhau càng chắc.
- **19/11/2026 — Tương quan ảnh chỉ dùng để tinh chỉnh tịnh tiến, trong cửa sổ hẹp.** Dò tự động toàn ảnh, theo vùng hay theo từng khối đều hỏng: lưới lô lặp đều nên tương quan có nhiều đỉnh ngang nhau, lệch nhau đúng một dãy. Chỉ dùng sau khi điểm mốc đã cho hướng Bắc và tỷ lệ, tìm trong bán kính nhỏ hơn bước dãy, và chỉ nhận khi mười đỉnh cao nhất tụ trong 3 m, không chạm biên, tương quan tăng ít nhất 1,5 lần (`scripts/khop-sa-ban.py dich` tự kiểm ba điều kiện này).

- **19/11/2026 — Hình khối lấy từ bản vẽ trực giao, không lấy từ ảnh phối cảnh.** (Thay cho dòng cũ cùng ngày cho rằng mảng màu trên tổng mặt bằng là cảnh quan — sai, đã kiểm lại.) Phối cảnh là ảnh vẽ xiên nên không đo được. Tổng mặt bằng thì đo được: mảng tô công trình trên đó chính là đường bao chân công trình, dùng được. Mặt bằng tầng điển hình trong hồ sơ dùng để đối chiếu thứ tự toà con và hình dáng. Thiếu dữ liệu thì ghi rõ "chưa công bố", không đoán.
- **19/11/2026 — Ảnh nền bản đồ phải đi qua `/api/nen`.** Không nhúng thẳng đường dẫn ô ảnh của nhà cung cấp vào mã chạy ở trình duyệt: khoá sẽ lộ và không đổi được nhà cung cấp. Đặt mẫu đường dẫn ở biến môi trường `NEN_TILE_URL`, dòng ghi nguồn ở `NEN_GHI_NHAN`, loại ảnh ở `NEN_KIEU`. Không đặt gì thì chạy OpenStreetMap.
- **19/11/2026 — Không dùng ô ảnh vệ tinh Google.** Đường dẫn ô ảnh Google lưu truyền trên mạng không có giấy phép cho trang thương mại; muốn dùng Google phải qua Map Tiles API có tính tiền. Trang này đi đường khác (xem §15).

- 2026-11-19 — **2.33.0** (Tú: "dựng đi rồi up lên web luôn để test hoàn thiện"): khối tháp trong sa bàn dựng từ **số tầng công bố trong hồ sơ chủ đầu tư**, quy đổi bằng công thức cố định (2 tầng khối đế 5 m, tầng căn hộ 3,6 m) chia cho tỷ lệ trong `georef.json`. **Không đoán số tầng**: toà nào hồ sơ chưa công bố thì ghi "chưa có số tầng công bố", như cụm B5 · B6 · B7. Mặt bằng chân tháp còn là khối hộp; khi dựng theo hình gấp khúc thật phải ghi nguồn trang bản vẽ.
- 2026-11-19 — **2.31.0** (Tú hỏi: định vị khu đất sao phức tạp vậy, dự án sau có phải làm tay không): từ nay **định vị sa bàn phải giải bằng `scripts/dinh-vi-sa-ban.mjs` từ ít nhất 2 điểm mốc**, không đọc hoa gió trên bản vẽ, không ước lượng tỷ lệ từ bước lặp lô. Mỗi dự án có `diem-moc.json` trong thư mục công cụ. **Phải có mốc thứ ba để đo sai số**; chưa đo được sai số thì `georef.json` ghi `trangThai: giai-tu-2-moc-chua-do-sai-so` và không được công bố số đo khoảng cách hay diện tích suy từ phép chiếu.
- 2026-11-19 — **2.30.0**: thêm `assets/tools/casa-blanca/ranh-du-an.json` (ranh Blanca City từ KML Tú vẽ trong My Maps) và vẽ lên sa bàn. **Ranh vẽ tay là tham chiếu, không phải ranh pháp lý — mọi nơi hiển thị phải nói rõ.** Phép chiếu sa bàn ↔ WGS84 hiện **có mâu thuẫn chưa giải**: hoa gió trên bản vẽ cho hướng Bắc 44°, còn khớp vào ranh thật cho khoảng 34°. Giữ 44° và ghi mâu thuẫn trong `georef.json` (`mauThuanCanGiaiQuyet`). **Cấm công bố số đo khoảng cách hay diện tích tính từ phép chiếu này cho tới khi chốt được hướng bằng 2–3 điểm mốc đối chiếu được.**
- 2026-11-19 — **2.29.0** (Tú quyết: "Bỏ gió, up công khai"): **gỡ bỏ hoàn toàn tính năng gió** khỏi sa bàn và xoá `functions/api/thoi-tiet.js`, vì giấy phép Open-Meteo miễn phí chỉ cho phi thương mại mà website này là thương mại. Hệ quả: **sa bàn không gọi dịch vụ bên thứ ba nào ngoài ô bản đồ OpenStreetMap**. Nắng giữ lại vì tính bằng thuật toán NOAA ngay trong trang, không phụ thuộc nguồn ngoài. Muốn làm lại phần gió thì phải mua gói Open-Meteo trả phí hoặc nguồn khác có giấy phép thương mại rồi ghi lại vào đây. `timNha.congBo` đặt `true` — Tìm nhà đã công bố.
- 2026-11-19 — **2.28.0** (Tú yêu cầu: "Tìm nhà vẫn đang phát triển nên tạm chưa công bố"): thêm cờ `timNha.congBo` trong `site.config.json`. Đặt `false` thì build **gỡ Tìm nhà khỏi menu**, **gỡ nút "Xem giỏ hàng · Ký gửi căn"** khỏi mọi trang bài, **gỡ mọi liên kết tới sa bàn `/assets/tools/casa-blanca/` nằm trong nội dung bài** (bỏ cả đoạn nếu đoạn chỉ có nút đó; bỏ thẻ `<a>` nhưng giữ nguyên chữ nếu liên kết nằm giữa câu) và gắn `noindex, nofollow` cho `/tim-nha/` kèm dải báo "đang hoàn thiện". **Trang vẫn được tạo** để xem thử qua link trực tiếp — cùng cách làm với kỳ ấn phẩm `trang-thai: nhap` ở §6C. Đổi cờ thành `true` là công bố lại, mọi liên kết tự trở lại, không phải sửa nội dung bài. URL `/tim-nha/` chưa nằm trong `tests/published-urls.json` nên không cần redirect.
- 2026-11-19 — **2.27.0** (Tú yêu cầu giao diện và tính năng theo mẫu sa bàn trên nền bản đồ thật, phần trình bày giữ concept riêng): sa bàn Blanca đổi sang bố cục thanh trên / dải phân khu / dải công cụ trái / thanh cao độ phải / thanh dưới. **Nền bản đồ thật là mặc định**, ô OpenStreetMap được tô lại theo tông thương hiệu trong shader (không thư viện ngoài, không CDN, chỉ ở trang công cụ `noindex`). Khoảng giá trên nhãn phân khu chỉ lấy từ `inventory.json` → `giaPhanKhu`; **không có số thì phải ghi "Chưa có bảng giá"**, cấm điền giá ước lượng. Khói gió chỉ chạy khi có dữ liệu gió thật. Ghi nguồn OpenStreetMap ở dòng chú thích đáy trang.
- 2026-11-19 — **2.26.0** (Tú yêu cầu: nắng và gió phải mô phỏng theo điều kiện thời tiết thật của địa phương, la bàn theo bản đồ thật, dùng nền OpenStreetMap): sa bàn Blanca tính vị trí mặt trời bằng thuật toán NOAA ngay trong trang (không dữ liệu ngoài); lấy gió hiện thời và hoa gió nhiều năm từ Open-Meteo **qua `functions/api/thoi-tiet.js` của chính website**, máy khách không gọi thẳng bên thứ ba; nền bản đồ dùng ô OpenStreetMap tải trực tiếp, **chỉ khi người xem bật lớp đó**, kèm ghi nguồn (ngoại lệ có chủ đích của §12.9, cùng tinh thần mục 2026-10-15 cho công cụ bản đồ; vẫn không thư viện ngoài, không theo dõi). Phép chiếu sa bàn ↔ WGS84 nằm trong `assets/tools/casa-blanca/georef.json` kèm cách đo và mức tin cậy; **mọi nơi hiển thị phải ghi rõ đây là đối chiếu sơ bộ, chưa đo sai số bằng điểm khống chế độc lập**. Không hiển thị số gió khi chưa lấy được nguồn. **Giấy phép Open-Meteo miễn phí chỉ cho phi thương mại**; dùng cho website thương mại phải điền `OPEN_METEO_KEY` của gói trả phí.
- 2026-11-18 — **2.25.0** (Tú yêu cầu "giỏ hàng cập nhật hiện đại, trực quan bằng 3D, tư vấn trực tiếp, nhận yêu cầu căn và ký gửi"): sa bàn Blanca City dựng lại bằng **WebGL2 thuần** trong `assets/tools/casa-blanca/` (ngoại lệ có chủ đích của §9 và §12.9, cùng tinh thần `zoom.js` và công cụ bản đồ: **không thư viện ngoài, không CDN, không theo dõi**, chỉ nạp ở trang công cụ `noindex`, không tăng trang chủ). Thêm `functions/api/tim-nha.js` nhận yêu cầu căn / đặt lịch / ký gửi, dùng lại Google Sheet và Resend của hệ thống lead — **chỉ báo "đã nhận" khi Sheet xác nhận đã ghi**. Mã căn trên sa bàn là mã mô phỏng, phải ghi rõ chưa phải mã căn chính thức. Tình trạng còn/đã bán chỉ hiện khi `inventory.json` có dữ liệu nguồn. Sửa `showroom.js`/`showroom.css` thì tăng `?v=` trong `blanca.html`.
- 2026-11-02 — Không đổi nguyên tắc nào (Tú yêu cầu): công cụ bản đồ `ban-do-du-an-hcm` cập nhật Tuyến 4 / 4B và đồng bộ cách trình bày tuyến, ga, vành đai (ngoại lệ có chủ đích của §12.5, chỉ trong trang công cụ, không thư viện mới). Hướng tuyến Tuyến 4 dò từ ảnh bản đồ tổng thể và chỉ là vị trí tham chiếu; 4B chưa có nguồn chính thức.
- 2026-10-20 — **2.20.0** (Tú yêu cầu): mục 03 trang Bản tính tài chính có khối tổng kết kỳ chốt bán và so sánh với gửi ngân hàng cùng dòng tiền. Lãi gửi chỉ là giả định của người dùng hoặc số niêm yết mục 01; không trình bày như cam kết của ngân hàng.
- 2026-10-20 — **2.19.0** (Tú yêu cầu): mục 01 trang Bản tính tài chính có ngày cập nhật tự động (`__BUILD_DATE__` thay lúc build ở mục `direct`; ngày rà soát/độ mới tính từ dữ liệu). Không đổi số lãi suất; vẫn cấm đưa số nguồn thứ cấp vào cột chính thức.
- 2026-10-25 — **2.22.0** (Tú yêu cầu): màn mở đầu bằng clip cho bài dự án qua trường `introClip` trong `articles.json` (ngoại lệ có chủ đích của §12.5; `intro.css`/`intro.js` chỉ nạp ở bài có trường này, không tăng trang chủ, không thư viện ngoài). Hiện dùng cho Nam Mekong Grand Plaza.
- 2026-10-17 — Không đổi nguyên tắc nào (Tú yêu cầu): thêm khối "Vay ngân hàng" cho bảng tính dự án bằng một file JS dùng chung `assets/tools/shared/vay-ngan-hang.js` (ngoại lệ có chủ đích của §9 "không nhân bản JS", cùng tinh thần `zoom.js`: chỉ nạp ở trang công cụ `noindex`, không tăng trang chủ, không thư viện ngoài). Lãi suất trong khối này là giả định người dùng nhập, không được ghi như báo giá ngân hàng. Sửa file này thì tăng `?v=` trong các bảng tính gọi nó.
- 2026-10-17 — **2.15.0** (Tú yêu cầu): thêm menu "Atlas Banking" `/atlas-banking/` (mục ấn phẩm thứ năm, cùng cơ chế §6A, nằm sau Atlas VietNam trên thanh NAT; địa chỉ mới là vĩnh viễn, §6B nếu đổi). Kỳ đầu để `nhap`. Không đổi nguyên tắc nào khác.
- 2026-10-18 — **2.17.0** (Tú yêu cầu): menu "Atlas ▾" gộp World Atlas + Atlas VietNam; "Atlas Banking" đổi thành "Bản tính tài chính" `/ban-tinh-tai-chinh/` (mục `direct:true`, không kỳ, nguồn `src: atlas-banking`; địa chỉ cũ chuyển hướng 301 theo §6B). Đầu trang luôn giữ khung miễn trừ "bản mô phỏng tham khảo, không phải báo giá ngân hàng" — không được gỡ.
- 2026-10-20 — **2.18.0** (Tú yêu cầu): mọi bảng tính dự án có phần "Chuyển sang Bản tính tài chính" (module `vay-ngan-hang.js`, gói dữ liệu v1 qua `#nhan=`); bản tính tài chính nhận và kiểm tra gói đó. Khi đổi cấu trúc gói phải sửa cả hai phía và tăng `v`; tool mới có khối vay tự có phần này.
- 2026-10-17 — **2.16.0** (Tú yêu cầu): chuẩn hoá bảng tính các dự án theo Norton Park; thêm khối vay ngân hàng + PDF trình bày cho Nam Mekong, Norton Park, Palm River, SkySOLIS, Artisan Park. Ngoại lệ §9 (đã ghi ở mục trước) mở rộng thêm tệp dùng chung `assets/tools/shared/bang-tinh.css` (bản sao CSS Norton Park) và `assets/tools/shared/zalo-qr.js` (mã QR Zalo tự viết cho PDF) — vẫn không thư viện ngoài, không theo dõi. Khi đổi JS/CSS dùng chung phải tăng `?v=` ở các trang bảng tính.
- 2026-10-08 — **2.13.0** (Tú yêu cầu): mọi trang bài và trang riêng hiện **watermark chân dung tác giả** (ảnh `assets/images/site/tac-gia-nguyen-anh-tu.webp` của trang chủ) mờ phía sau nội dung, góc dưới bên phải khung bài. Làm bằng một khối CSS cuối `main.css` (`#panel.page::after`, `z-index:-1`, độ mờ .07, ẩn khi in/xuất PDF); không sửa template hay nội dung bài. Đổi ảnh chân dung ở trang chủ thì watermark đổi theo.
- 2026-10-07 — **2.12.0** (Tú ủy quyền SEO "tự làm"): thẻ `<title>` chỉ gắn hậu tố "| Nguyễn Anh Tú" khi tổng ≤ 60 ký tự (hàm `withSuffix` trong `build.mjs`); khi viết `seoTitle` nên giữ ≤ 52 ký tự để còn chỗ cho hậu tố. Không đổi URL, giao diện hay nguyên tắc nào khác.
- 2026-10-06 — **2.11.1** (Tú yêu cầu): bài Norton Park dùng giao diện riêng theo nhận diện dự án (nền xanh rêu đậm, chữ kem, dải họa tiết lá #545748 ở đầu trang). Thêm trường `theme` trong `articles.json` + class `theme-<tên>` ở build; chỉ bài có `theme` mới đổi, các bài khác và trang chủ giữ nguyên giao diện đã duyệt (§12.5). Menu NAT giữ nguyên.
- 2026-10-05 — **2.10.0** (Tú yêu cầu): (1) thêm menu "Atlas VietNam" `/atlas-viet-nam/` (mục ấn phẩm thứ tư, cùng cơ chế §6A, nằm sau World Atlas trên thanh NAT; địa chỉ mới là vĩnh viễn, §6B nếu đổi); (2) thư viện ấn phẩm: kỳ chỉ có bản đọc HTML thì thẻ mở thẳng `/<mục>/<kỳ>/doc/` (2 lần nhấp thay vì 3), trang `/<mục>/<kỳ>/` vẫn giữ để chia sẻ; (3) hover chỉ áp dụng cho thiết bị có chuột. Không đổi nguyên tắc nào khác.
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
- 2026-10-12 — **2.14.0**: thêm lớp `.p-hscroll` (dải cuộn ngang) cho thẻ/ảnh trong bài; chỉ dùng cho nhóm ≥ 5 mục cùng loại.
- 2026-10-15 — Không đổi nguyên tắc nào (Tú duyệt): được dùng **Leaflet 1.9.4 + nền OpenStreetMap** cho công cụ bản đồ `assets/tools/ban-do-du-an-hcm/` (ngoại lệ có chủ đích của §9 và §12.9: thư viện lưu sẵn trong thư mục công cụ, không dùng CDN, chỉ nạp ở trang công cụ, không tăng trang chủ). Google Maps chưa dùng vì cần API key và thẻ thanh toán.

## 15. Ảnh nền bản đồ cho sa bàn

Sa bàn 3D cần ảnh nền thực địa. Ô ảnh luôn đi qua `/api/nen/{z}/{x}/{y}` (Cloudflare Pages Function), không gọi thẳng từ trình duyệt.

| Biến môi trường | Ý nghĩa |
| --- | --- |
| `ARCGIS_API_KEY` | Khoá ArcGIS Location Platform. Đặt riêng biến này là đủ để có ảnh vệ tinh. |
| `NEN_TILE_URL` | (tuỳ chọn) Mẫu đường dẫn ô ảnh của nhà cung cấp khác, dùng `{z}` `{x}` `{y}`, kèm khoá. Bỏ trống cả hai → OpenStreetMap. |
| `NEN_GHI_NHAN` | Dòng ghi nguồn hiện dưới sa bàn. Bắt buộc đúng theo yêu cầu của nhà cung cấp. |
| `NEN_KIEU` | `ve-tinh` hoặc `duong-pho`. Ảnh vệ tinh không bị tô lại màu. |

Nhà cung cấp đã khảo sát:

- **OpenStreetMap** (mặc định hiện nay) — miễn phí, nhưng chính sách dùng ô ảnh của họ chỉ dành cho lưu lượng nhỏ, không phù hợp lâu dài cho trang thương mại. Chỉ là bản chạy tạm.
- **Esri ArcGIS Location Platform** — ảnh vệ tinh World Imagery, độ phân giải đủ thấy từng lô nền ở Blanca City. Tài khoản miễn phí, không cần thẻ, 2 triệu ô ảnh mỗi tháng, cho phép dùng thương mại ở mức miễn phí; vượt thì 0,15 USD cho 1.000 ô. Bắt buộc ghi nguồn "Esri, Vantor, Earthstar Geographics và cộng đồng GIS". **Đây là hướng nên chọn.**
- **Google** — chỉ hợp lệ qua Map Tiles API có tính tiền. Đường dẫn ô ảnh lưu truyền trên mạng không có giấy phép, không dùng.
- **Mapbox Satellite** — 50.000 lượt tải bản đồ mỗi tháng miễn phí, điều khoản rõ ràng. Phương án dự phòng.

Lớp gần lấy z18 trong ranh dự án (§17.4). Có khoá rồi thì vào Cloudflare Pages → Settings → Environment variables, thêm `ARCGIS_API_KEY`, deploy lại. Không phải sửa mã, không phải đụng gói cập nhật.

**Tuyệt đối không đặt khoá vào gói cập nhật hay bất kỳ file nào trong kho nguồn.** Kho `website-nguyenanhtu-2.0.0-source` là kho công khai: khoá đẩy lên đó coi như đã lộ và phải thu hồi ngay.

## 16. Nguyên tắc mục "Tìm nhà" (Tú giao 19/11/2026)

**Mục tiêu:** nền tảng kiểm tra tình trạng giỏ hàng sơ cấp và thứ cấp của một dự án; nhận ký gửi sản phẩm thứ cấp; lấy insight khách quan tâm. Làm chuẩn trên Blanca City rồi nhân ra các dự án khác.

### 16.1 Công khai và không công khai
- **Công khai:** xem giỏ hàng; check căn; làm bản tính; bản cân đối tài chính. Hai lối vào: khách tự thao tác hết rồi yêu cầu xuất tài liệu, hoặc chọn căn qua thanh lọc/tìm căn trống rồi yêu cầu gửi tài liệu.
- **Không công khai:** dữ liệu người ký gửi thứ cấp. Không bao giờ đưa ra trang công khai, không đưa vào kho nguồn.

### 16.2 Giỏ hàng trên khối 3D
- Phân biệt sơ cấp và thứ cấp; thứ cấp tách tiếp bán và cho thuê. Loại căn phải đánh dấu nhận biết được ngay trên khối 3D.
- Căn đã bán hoặc chưa mở bán: **để trống** trên khối 3D.
- Cập nhật giỏ hàng định kỳ **thứ Sáu hàng tuần**, kèm nút cập nhật ngay.
- Xem được layout từng tầng trên khối 3D.
- Nhấp vào căn đang sáng đèn "mở": có hiệu ứng mở tầng trên khối 3D và hiện chi tiết kỹ thuật loại căn đó.

### 16.3 Mặt bằng tầng
- Mặt cắt tầng phải dán layout thật vào, chọn được căn ngay trên mặt bằng đó.
- Nhập mã căn cũng ra đúng căn đó.

### 16.4 Bản tính
- Chọn hoặc nhập căn thì chạy ra bản tính cụ thể của căn, dùng lại bản tính đã có trên web (`assets/tools/shared/` và các `*-bang-tinh`).
- Mở rộng tiếp sang phần vay và phương án tài chính.

### 16.5 Form ký gửi
Ưu tiên xác minh người gửi. Trường bắt buộc:
- Tên người ký gửi, số điện thoại, email
- Thông tin căn: mã căn; giá mua gồm VAT và phí bảo trì (giá trên hợp đồng); giá bán (giá mua + chênh lệch); **giá chênh do hệ thống tự tính**; ô tích thương lượng / giá net
- Hình ảnh thực tế căn nếu có — **không nhận ảnh phối cảnh**
- Tài liệu xác minh căn (công khai được): ảnh trên hợp đồng, tiêu đề hợp đồng, bảng tính căn, ngày ký hợp đồng
- Tài liệu xác minh chính chủ (**bảo mật**): CCCD hoặc VNeID, phần thông tin cá nhân trên hợp đồng
- Mọi mục chụp ảnh đều phải có mẫu hướng dẫn vị trí chụp

### 16.6 Hoa hồng môi giới
Tính trên tỷ lệ % của giá bán cuối cùng = giá mua + chênh lệch (giá mua **chưa** gồm VAT và phí bảo trì). Bảng tích chọn:
- Giao dịch trong 30 ngày: 3% · 2% · 1%
- Giao dịch sau 30 ngày: 3% · 2% · 1%

Hệ thống lấy giá cuối trên hợp đồng cộng mức chênh mong muốn đã nhập để tính ra số tiền hoa hồng cho mỗi mức tỷ lệ — gọi là **mức hoa hồng dự tính**.

### 16.7 Tự động
- Gửi email và Zalo xác nhận đã đăng ký ký gửi, cảm ơn, kèm lời chúc sớm thanh khoản.
- Sau ngày đăng ký 15 ngày: tự nhắc chăm sóc, hỏi lại căn đã bán chưa để cập nhật hệ thống.

- **Sa bàn chung theo nền tảng (từ 2.52.0):** dự án mới thuộc nền tảng đã có sa bàn thì thêm vào sa bàn đó (khối, nhãn, phân khu, rổ giá riêng), không dựng sa bàn mới. Thành phố mới Bình Dương: `assets/tools/nam-mekong/nam-mekong.html` (`#artisan` mở Artisan Park). Căn còn trong quỹ tô màu loại căn, căn đã bán, đang khoá và lô ngoài quỹ để trống.
- **Nền tảng dự án (từ 2.51.0):** mỗi dự án thuộc một nền tảng khai báo bằng `"nenTang": "<id>"` trong `data/project-inventory.json`; tên nền tảng và bài đầu vào định nghĩa trong `data/nen-tang.json`. Khi Tú nói dự án thuộc nền tảng nào, chỉ thêm `nenTang` cho dự án đó, không tạo nền tảng mới trừ khi Tú yêu cầu. Dự án chưa có trong CH04 vẫn vào Tìm nhà nhờ `nenTang`. Đã gắn: Thành Phố Mới Bình Dương (`tp-moi-binh-duong`).

## 17. Quy trình dựng sa bàn cho dự án mới (chuẩn từ Blanca City, 19/11/2026)

Blanca City là bản mẫu. Dự án sau sao chép khung `assets/tools/casa-blanca/` rồi thay dữ liệu, không viết lại mã.

### 17.1 Đầu vào Tú gửi — xin theo thứ tự này
1. **Bản đồ quy hoạch tổng mặt bằng 1/500 có bảng toạ độ VN-2000**, ghi rõ kinh tuyến trục (Bà Rịa – Vũng Tàu: 107°45′, EPSG:5899). Có bản này là định vị chính xác đến mét, bỏ qua bước ghim. Xin chủ đầu tư hoặc ban quản lý dự án.
2. **Ranh dự án** vẽ trên Google My Maps theo bản đồ thật, tải KMZ về đính kèm.
3. **Tổng mặt bằng** (ảnh) và **hồ sơ tư vấn PDF** có mặt bằng tầng điển hình, số tầng, số căn từng toà.
4. **Ít nhất hai ghim** trên My Maps đặt tại công trình **đã thi công**, nhìn rõ trên ảnh vệ tinh: nút giao, vòng xoay, góc toà nhà đã xây. Cách nhau càng xa càng tốt. Ghim thứ ba trở đi dùng để đo sai số. Không ghim vào công trình chưa xây. Không ghim theo mã căn khi chưa có bảng hàng.
5. **Bảng hàng .xlsx** (Mã căn, Toà, Tầng, Căn, Loại căn, diện tích thông thuỷ và tim tường, giá đã gồm VAT và KPBT, tình trạng). Tải về rồi đính kèm — môi trường làm việc của Claude không mở được link Google.
6. **Chính sách bán hàng** và nói rõ **đợt nào đang áp dụng** cho quỹ đó.

### 17.2 Các bước Claude làm
1. **Khung thư mục** `assets/tools/<du-an>/`: `plan.webp`, `geometry.json`, `georef.json`, `ranh-du-an.json`, `diem-moc.json`, `chan-thap.json`, `can-ho.json`, `inventory.json`.
2. **Định vị — ba tầng, tầng sau chỉ làm khi tầng trước xong:**
   - Tầng 1, khung. Có toạ độ VN-2000: `python3 scripts/khop-sa-ban.py vn2000 moc.csv --ktt 107-45 > moc.kml`, rồi `node scripts/dinh-vi-sa-ban.mjs <thu-muc> moc.kml --ghi`. Không có: giải từ các ghim đã thi công.
   - Tầng 2, tịnh tiến. `khop-sa-ban.py anh <thu-muc>` rồi `khop-sa-ban.py dich <thu-muc>`. Công cụ tự từ chối khi kết quả không tin được. Nhận thì thêm `--ghi`.
   - Tầng 3, nghiệm thu. `khop-sa-ban.py soi <thu-muc>` ra bảng ảnh từng khối có lưới đo. Ghi kết quả vào `georef.json` mục `nghiemThu`: khối khớp, khối lệch bao nhiêu, khối chưa kiểm được.
3. **Khối 3D.** Căn thấp tầng theo tổng mặt bằng. Tháp: chân tháp cắt từ đường bao công trình trên tổng mặt bằng, số tầng theo hồ sơ, đối chiếu thứ tự toà con với mã căn trên mặt bằng tầng điển hình.
4. **Giỏ hàng.** Chuyển xlsx sang `can-ho.json`, ghi rõ `phamVi` (quỹ đại lý hay toàn bộ giỏ hàng). Thẻ dự án ở Tìm nhà dùng nhãn "Quỹ đại lý" khi không phải toàn bộ.
5. **Góc nhìn.** Đặt `PHUONG_BIEN` = phương vị hướng view chính (pháp tuyến bờ biển, sông, công viên) đo trên ảnh vệ tinh. Kiểm hai nút 500 m và 1 km nhìn đúng hướng đó.
6. **Ảnh đại diện.** Sau khi deploy: `python3 scripts/chup-anh-sa-ban.py https://nguyenanhtu.vn/assets/tools/<du-an>/<trang>.html assets/tools/<du-an>`, rồi thêm `"saBan": "<du-an>"` cho dự án trong `data/project-inventory.json`. Thẻ dự án và ảnh chia sẻ tự lấy ảnh này.
7. Kiểm thử, đóng gói như §13.

### 17.3 Tiêu chí nghiệm thu
- Tầng 2 hội tụ: lệch tịnh tiến còn dưới 1,5 m. Bảng soi từng khối đã xem và ghi kết quả. Khu nào lệch thì ghi rõ trong `georef.json`, không giấu.
- Không công bố số đo khoảng cách, diện tích lấy từ phép chiếu (§14).
- Ảnh nền lớp gần đạt z18 trong ranh dự án trên máy tính; điện thoại yếu được phép giữ z17.
- Giỏ hàng ghi rõ phạm vi. Căn đã bán hoặc chưa mở bán để trống trên khối 3D (§16.2).
- Ảnh đại diện chụp ở z18, không lộ nút hay chữ của giao diện.

### 17.4 Ảnh nền và độ cao
- Lớp gần: z18 (0,6 m mỗi điểm ảnh) trong ranh dự án nới 15%, nạp z17 trước cho nhanh rồi thay bằng z18. Lớp xa: z14, rộng gấp bốn khu đất.
- Độ cao camera hiện bằng mét ở thanh dưới. Kéo xa nhất 7,9 km.
- Tông nước biển chuẩn hoá trong shader (lấy tông vùng rộng qua mipmap) để giấu các mảng ghép ảnh nhiều ngày của Esri. Mép lớp gần mờ dần vào lớp xa.

### 17.5 Tự động hoá ký gửi không cần Zalo OA
- Zalo cá nhân không có API. Nhắn Zalo tự động phải có Zalo OA và ZNS (trả phí theo tin, mẫu tin phải được duyệt). Không dùng.
- Thay bằng email qua Resend, dùng biến đã có (`RESEND_API_KEY`, `MAIL_FROM`, `NOTIFY_TO`), thêm `ZALO_TU` nếu đổi số:
  - Ngay khi nhận phiếu: thư cảm ơn và xác nhận cho chủ nhà (trả lời thư là về Tú); thư báo Tú kèm tệp lịch `.ics` nhắc chăm sóc 9:00 ngày thứ 15.
  - Ngày thứ 15, 9:00: Resend tự gửi thư nhắc Tú, và thư hỏi chủ nhà căn đã giao dịch chưa. Hẹn giờ bằng `scheduled_at` của Resend, tối đa 30 ngày, không cần máy chủ hẹn giờ.
- Ảnh giấy tờ: chủ nhà gửi qua Zalo của Tú kèm mã phiếu, nút mở Zalo có sẵn sau khi gửi.
- Lỗi gửi thư không làm mất phiếu đã lưu; API trả về cờ `auto` cho biết thư nào đã đi.

## 18. Tự đánh giá dự án (Tú giao 20/11/2026, khung 2.0)

**Mục tiêu:** bộ tiêu chí chuẩn giúp người mua tự thẩm định dự án theo hoàn cảnh của chính họ, rồi so với bản đánh giá của Tú; tăng tương tác; mọi lần xuất bản đánh giá đi qua form và vào CRM. Tài liệu duyệt bộ thẻ: "Bộ vấn đề đặt ra — phản biện và bản đề xuất". Phương pháp: `docs/DANH_GIA_DU_AN.md`.

- **Nội dung tách khỏi mã:** `data/danh-gia/khung.json` chứa hồ sơ nhu cầu (`hoSo`), 6 chủ đề (`chuDe`), các thẻ (`the`: mã A1…F6, chủ đề, tầng, câu hỏi, dữ kiện gợi ý, kiểu thiên kiến `mot`/`nhieu`/`viet` + lựa chọn, trọng số gợi ý `w` và lý do `lyDo` theo từng nhu cầu). `data/danh-gia/du-an.json` chứa dữ kiện và điểm của Tú theo mã thẻ. Đổi bộ thẻ thì tăng `phienBan` (link mở lại của phiên bản cũ sẽ không mở nữa).
- **Bước đầu chỉ gồm chọn dự án và nhu cầu mua** (Mua ở · Đầu tư · Tích sản; dự án: dự án đang bán trong `assets/lead/lead-data.json` + mọi bài dự án có "Thang Điểm Đánh Giá 1–5"). Nhu cầu đặt trọng số gợi ý và quyết định bộ câu **hồ sơ cá nhân ở cuối** (sau các thẻ, trước tổng kết): mỗi câu có `apDung` theo nhu cầu — Mua ở hỏi hoàn cảnh sống, mong muốn; Đầu tư hỏi cách khai thác; Tích sản hỏi mục tiêu dài hạn. Hồ sơ không chấm điểm, không có trong bản của Tú, vào CRM.
- **Thang Điểm Đánh Giá 1–5 trong bài dự án là nhận định tổng quan của Tú, giữ nguyên, không liên quan và không được dùng làm điểm cho bộ chi tiết.** Khi công bố, build tự chèn nút "Tự đánh giá chi tiết dự án này" ngay sau thang điểm đó.
- **Mỗi thẻ đủ 5 phần theo thứ tự:** vấn đề · dữ kiện · mức quan trọng (x1–x3, có ghi chú nâng/hạ theo nhu cầu) · nhận định (ô chọn sẵn, mỗi ô mở dòng "vì sao", hoặc viết tự do) · mức hài lòng 1–5, kèm nút "Chưa đủ dữ kiện — bỏ qua" (không tính điểm).
- **Màu:** mỗi thẻ tô theo câu hỏi "khách dựa vào đâu để trả lời" — xanh dương Logic (kiểm chứng được hôm nay), vàng Niềm tin (lời hứa, tương lai), xanh lá Phù hợp (cuộc sống của chính khách). Khi chấm chỉ hiện màu; **ý nghĩa ba màu chỉ giải thích ở màn tổng kết**.
- **Tổng kết không kết luận:** điểm tổng + Ở thực / Đầu tư + 3 biểu đồ riêng cho 3 màu (mỗi biểu đồ: mức hài lòng có trọng số và mức quan trọng **trung bình mỗi thẻ**, không cộng dồn). Không "điểm mù", không "phong cách", không "nên/không nên mua" ở bất kỳ chỗ nào khách thấy; các insight đó chỉ trong email báo Tú và CRM.
- **Bản của Tú:** mở khi khách chấm ≥ `nguong.moTu` thẻ. Điểm hài lòng của Tú × trọng số của khách (đặt Tú vào trường hợp của khách), so trên các thẻ cả hai cùng chấm. `chuyenGia.duyet: false` là bản nháp, chỉ hiện khi trang chưa công bố; không AI nào tự đặt `duyet: true`.
- **Dữ kiện theo §8.1, chỉ ở mức thông tin:** chỉ ghi dữ liệu, số liệu, tài liệu đã có trong bài dự án hoặc hồ sơ chủ đầu tư; chưa có thì ghi "chưa có số liệu"; không lời khuyên, không đánh giá, không diễn giải (build chặn từ điều hướng như "nên", "tốt", "tiềm năng", "chỉ có"…). Khách luôn có thể ẩn dữ kiện để tự đánh giá. Liên kết chỉ trỏ trong site (build kiểm).
- **Công thức chung cho trang và máy chủ:** `assets/js/danh-gia.js` và `functions/api/danh-gia.js`; sửa một bên thì sửa bên kia và chạy `node tests/danh-gia-api.mjs`.
- **Xuất bản đánh giá phải qua form** `/api/danh-gia`; máy chủ tính lại điểm. Email khách tự động; Zalo do Tú gửi tay (§17.5); nhắc ngày 3 (khách) và ngày 7 (Tú). Nhận định viết tay của khách không đi vào link mở lại.
- **Công bố:** `danhGia.congBo: true` → hiện mục "Đánh giá" trên menu, nút ở bài dự án đang bán, vào sitemap, bỏ noindex.

### 18.x Mẫu nhập đánh giá (Tú gửi kèm khi hoàn thiện dự án)
- Mẫu trắng: `docs/mau-nhap-lieu/Mau-nhap-danh-gia-du-an.docx` (tạo lại bằng `node docs/mau-nhap-lieu/gen.js` từ `data.json`).
- Phần 1 (SWOT + Thang điểm 1–5, 19 chỉ số) → đưa vào bài dự án trong `content/articles/<slug>.html` (khối `swot-grid` và danh sách thang điểm; tự tính TB nhóm và tổng = TB 6 tiêu chí).
- Phần 2 (29 thẻ) → `data/danh-gia/du-an.json`: cột Dữ kiện → `the.<id>.duKien` (qua lint trung lập); Điểm/Nhận xét → `chuyenGia.the.<id>.{s,nx}`; ô "Có, công bố" → `duyet:true`, ngược lại `duyet:false`.
- Ô trống: Claude bổ sung từ hồ sơ/bài web, liệt kê để Tú duyệt; không tự chấm điểm thay Tú.

## 19. Sa bàn vùng (từ 2.55.0)

- Mỗi vùng một thư mục `assets/tools/vung-<ten>/` gồm `index.html` (sao từ `vung-trung-tam/index.html`, sửa `SB_VUNG` và tiêu đề) và `du-an.json`.
- `SB_VUNG = { ten, phu, bai, neo: [lat, lon], duAn: 'du-an.json?v=…' }`; `neo` là tâm vùng, ảnh vệ tinh nạp quanh mốc này.
- `du-an.json` → `duAn[]`: `id` (trùng slug bài nếu có), `ten`, `bai` (slug hồ sơ), `cdt`, `ll` [lat, lon], `loai` (`thap` | `thap-tang`), `thap` (số tháp), `tang` [số tầng từng tháp], `caoMet` (tuỳ chọn, chiều cao công bố), `dienTich` (ha, cho thấp tầng), `tt` (tình trạng), `quyMo` (một câu, chỉ số liệu có nguồn), `xoay` (độ, theo lưới đường), `saBan` (tuỳ chọn: link sa bàn riêng có giỏ hàng).
- Dự án trong vùng: thêm `saBan: 'vung-<ten>'`, `saBanTrang: 'index.html#da=<id>'` vào `data/project-inventory.json` để Tìm nhà mở đúng chỗ.
- Khối minh hoạ phải nhẹ (tháp + khối đế; thấp tầng là dãy nhà). Ưu tiên thao tác mượt hơn chi tiết.
- **Dựng theo mặt bằng tổng thể (từ 2.58.0):** có sơ đồ tổng thể của chủ đầu tư (ảnh, SVG trong trang 3D…) thì khớp sơ đồ lên ảnh vệ tinh theo đường, ranh đã thi công quanh khu đất, rồi khai `toa[]` trong `du-an.json` (`hop` = các hộp ghép theo đường bao, toạ độ mét Đông/Bắc so với `ll`, góc tính từ hướng Đông). Kiểm tỷ lệ bằng số liệu công bố (số căn/tầng, mật độ xây dựng) trước khi giao. Tên toà theo mặt bằng tầng; chưa có tên công bố thì giữ số trên sơ đồ.
- **Bóc tầng trên sa bàn vùng (từ 2.59.0):** dự án có bản tính kèm mặt bằng tầng thì sinh `<vùng>/<dự án>-can.json` (nhóm tầng, ảnh, `khung` = [Đông, Bắc, rộng, cao m, góc] so với `ll`, `vien` = đường bao toà trên ảnh, `can` theo định dạng PU của bản tính, `mau`, `gia`) và khai `canBoc` trong `du-an.json`. Mỗi ảnh mặt bằng khớp riêng vào đường bao toà (ảnh của chủ đầu tư thường lệch khung giữa các tầng). Mã căn giữ đúng định dạng bản tính; nút bản tính mở `?can=<mã>`.
- **Giỏ hàng định kỳ (từ 2.60.0):** dự án có giỏ hàng của đại lý (Google Sheets) thì link lưu ở tài liệu Project `nguon-gio-hang.md` (không ghi vào kho mã vì kho công khai). Mỗi kỳ: lấy rổ căn mới (bản xuất hoặc đọc trực tiếp khi sheet đã chia sẻ cho tài khoản Google đang kết nối), cập nhật `gioHang` + `gioNgay` trong `<vùng>/<dự án>-can.json` và bảng giá `LISTED` + `LIST_DATE` trong bản tính; khi có CSBH mới thì đối chiếu chiết khấu và tiến độ với sheet PTTT bằng một căn mẫu (khớp tới đồng) trước khi giao.
- **Công trình mốc trên sa bàn vùng:** `SB_VUNG.congTrinh` trỏ tới `cong-trinh.json`; mỗi công trình khai `ll` và `khoiM` ([Đông, Bắc, dài, rộng, góc, z0, z, màu, 1] mét). Công trình quy hoạch chưa có kích thước (ga metro…) ghi rõ là khối minh hoạ, kèm nguồn và ngày báo cáo.
