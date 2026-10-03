#!/usr/bin/env node
/* Cẩm Nang BĐS 2.0 — build tĩnh, không cần thư viện ngoài (Node >= 18).
   node scripts/build.mjs            → kiểm tra + build ra dist/
   node scripts/build.mjs --check    → chỉ kiểm tra dữ liệu, không ghi file */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const CHECK_ONLY = process.argv.includes('--check');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(rd(p));

const cfg = json('site.config.json');
const articles = json('data/articles.json');
const categories = json('data/categories.json');
const images = json('data/images.json');
const redirects = fs.existsSync(path.join(ROOT, 'data/redirects.json')) ? json('data/redirects.json') : [];
const sitePages = fs.existsSync(path.join(ROOT, 'data/pages.json')) ? json('data/pages.json') : [];
const BASE = cfg.basePath.endsWith('/') ? cfg.basePath : cfg.basePath + '/';
const SITE = cfg.siteUrl.replace(/\/$/, '');
const abs = (p) => SITE + BASE + p.replace(/^\//, '');
const SECTION = 'cam-nang';   // URL bài: /cam-nang/<slug>/ (giữ nguyên địa chỉ đã công khai)
const artUrl = (slug) => `${BASE}${SECTION}/${slug}/`;
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, v) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in v ? v[k] : m));

/* ───────────────────────── KIỂM TRA ───────────────────────── */
const errors = [], warns = [];
const bySlug = new Map(), byId = new Map();
const SLUG_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const STATUSES = ['published', 'stub', 'archived'];
const catIds = new Set(categories.map((c) => c.id));
const REQUIRED = ['id', 'slug', 'status', 'title', 'category', 'description', 'content', 'section', 'accent', 'publishedDate', 'updatedDate', 'author'];
for (const a of articles) {
  for (const f of REQUIRED) if (a[f] === undefined || a[f] === '') errors.push(`[${a.slug || a.id}] thiếu trường "${f}"`);
  if (!SLUG_RE.test(a.slug || '')) errors.push(`[${a.slug}] slug không hợp lệ (chỉ a-z, 0-9, dấu -)`);
  if (bySlug.has(a.slug)) errors.push(`slug trùng: ${a.slug}`);
  if (byId.has(a.id)) errors.push(`id trùng: ${a.id}`);
  bySlug.set(a.slug, a); byId.set(a.id, a);
  if (!STATUSES.includes(a.status)) errors.push(`[${a.slug}] status phải là ${STATUSES.join('/')}`);
  if (!catIds.has(a.category)) errors.push(`[${a.slug}] category không tồn tại: ${a.category}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.publishedDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(a.updatedDate || '')) errors.push(`[${a.slug}] ngày phải dạng YYYY-MM-DD`);
  if (!fs.existsSync(path.join(ROOT, a.content || '_'))) errors.push(`[${a.slug}] không có file nội dung ${a.content}`);
  for (const k of ['thumbnail', 'heroImage']) if (a[k] && !images[a[k]]) errors.push(`[${a.slug}] ${k} "${a[k]}" không có trong data/images.json`);
  if (a.facts !== undefined) {
    if (!Array.isArray(a.facts) || a.facts.length < 2 || a.facts.length > 4) errors.push(`[${a.slug}] "facts" phải là mảng 2–4 phần tử {n, l}`);
    else for (const f of a.facts) if (!f || !String(f.n || '').trim() || !String(f.l || '').trim()) errors.push(`[${a.slug}] mỗi phần tử "facts" cần "n" (số) và "l" (nhãn)`);
  }
}
for (const a of articles) {
  if (a.parent && !bySlug.has(a.parent)) errors.push(`[${a.slug}] parent không tồn tại: ${a.parent}`);
  for (const r of a.relatedArticles || []) if (!bySlug.has(r)) errors.push(`[${a.slug}] relatedArticles không tồn tại: ${r}`);
}
// Metadata: description không bị cắt, ≤ 160 ký tự; <title> không trùng giữa các trang
for (const a of articles) if (a.status === 'published') for (const f of ['description', 'seoDescription']) {
  const v = a[f]; if (!v) continue;
  if (/…$|\.\.\.$/.test(v)) warns.push(`[${a.slug}] ${f} bị cắt bằng "…" — viết câu hoàn chỉnh ≤ 160 ký tự`);
  if (v.length > 160) warns.push(`[${a.slug}] ${f} dài ${v.length} ký tự (> 160)`);
}
{
  const byTitle = new Map();
  for (const a of articles) { const t = `${a.seoTitle || a.title} | ${cfg.titleSuffix}`; byTitle.set(t, [...(byTitle.get(t) || []), a]); }
  for (const [t, list] of byTitle) if (list.length > 1) {
    const msg = `<title> trùng "${t}": ${list.map((x) => `${x.slug} [${x.status}]`).join(', ')}`;
    if (list.filter((x) => x.status === 'published').length > 1) errors.push(msg); else warns.push(msg);
  }
}
const navSlugs = new Set();
for (const c of categories) for (const it of c.items) {
  for (const s of [it.article, ...(it.projects || []).map((p) => p.article)]) {
    if (!bySlug.has(s)) errors.push(`categories.json [${c.id}] trỏ tới bài không tồn tại: ${s}`);
    else if (bySlug.get(s).status === 'archived') errors.push(`categories.json [${c.id}] không được hiển thị bài archived: ${s}`);
    navSlugs.add(s);
  }
}
for (const [k, v] of Object.entries(images)) for (const w of v.v) {
  const [slug, n] = k.split('/');
  if (!fs.existsSync(path.join(ROOT, 'assets/images/articles', slug, `${n}-${w}.webp`))) errors.push(`ảnh thiếu file: ${slug}/${n}-${w}.webp`);
}
// nội dung
// Vạch chia mục 01–04 của bài dự án (xem docs/CONTENT_GUIDE.md): <div style="…margin:NNpx 0 6px"><span …>0N</span><span …>Nhãn</span></div>
const SEC_RE = /<div style="(display:flex;align-items:center;gap:10px;margin:\d+px 0 6px)"><span style="[^"]*">(0\d)<\/span><span style="[^"]*">([^<]*)<\/span><\/div>/g;
const SEC_SHORT = { '01': 'Tổng quan', '02': 'Chi tiết', '03': 'Góc nhìn', '04': 'SWOT' };
const contents = new Map();
for (const a of articles) {
  if (!a.content || !fs.existsSync(path.join(ROOT, a.content))) continue;
  const h = rd(a.content); contents.set(a.slug, h);
  if (/data:image\//.test(h)) errors.push(`[${a.slug}] nội dung chứa ảnh Base64 — bị cấm, dùng scripts/images.py add`);
  if (/openPanel\(/.test(h)) errors.push(`[${a.slug}] còn openPanel() — dùng <a href="/cam-nang/slug/">`);
  if (/<script\b/i.test(h)) errors.push(`[${a.slug}] nội dung không được chứa <script>`);
  { const n = (h.match(/<h1\b/gi) || []).length; if (n !== 1) errors.push(`[${a.slug}] mỗi bài phải có đúng 1 <h1> (hiện có ${n})`); }
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) if (!/\salt=/i.test(m[0])) warns.push(`[${a.slug}] <img> thiếu thuộc tính alt — mô tả ảnh, hoặc ghi alt="" nếu ảnh thuần trang trí (docs/CONTENT_GUIDE.md)`);
  if (/<iframe\b/i.test(h)) errors.push(`[${a.slug}] không viết <iframe> trong nội dung — dùng khối .p-360 (docs/CONTENT_GUIDE.md §3B)`);
  for (const m of h.matchAll(/<a class="p-360-(?:tab|play)[^"]*" href="([^"]*)"/g)) {
    let u = null; try { u = new URL(m[1]); } catch { /* lỗi bên dưới */ }
    if (!u || u.protocol !== 'https:' || !(cfg.embedHosts || []).includes(u.hostname)) errors.push(`[${a.slug}] khối 360: "${m[1]}" không phải https hoặc host chưa có trong embedHosts (site.config.json) — thêm host mới cần Tú duyệt`);
  }
  for (const m of h.matchAll(/data-img="([^"]+)"/g)) if (!images[m[1]]) errors.push(`[${a.slug}] ảnh "${m[1]}" không có trong data/images.json`);
  for (const m of h.matchAll(/<img\b(?![^>]*data-img=)[^>]*src="([^"]+)"/g)) if (!/^https?:/.test(m[1])) warns.push(`[${a.slug}] <img src="${m[1]}"> nên dùng data-img`);
  for (const m of h.matchAll(/(?:href|data-href)="\/cam-nang\/([^"/#]+)\/?(#[^"]*)?"/g)) if (!bySlug.has(m[1])) errors.push(`[${a.slug}] link hỏng tới /cam-nang/${m[1]}/`);
  if (/(?:href|data-href)="\/bai\//.test(h)) errors.push(`[${a.slug}] link kiểu cũ /bai/ — dùng /cam-nang/<slug>/`);
  if (a.status === 'published' && /class="swot-cell swot-w"[^>]*>(?:(?!<\/ul>)[\s\S])*?Chưa ghi nhận/.test(h)) warns.push(`[${a.slug}] SWOT: ô "Điểm yếu" còn ghi "Chưa ghi nhận" — cần nêu điểm yếu thật (PROJECT_RULES §8.2)`);
  if (a.status === 'published' && SEC_RE.test(h) && !a.facts) warns.push(`[${a.slug}] bài dự án có mục 01–04 nhưng chưa có "facts" (số liệu lớn đầu trang)`);
  SEC_RE.lastIndex = 0;
  if (!fs.existsSync(path.join(ROOT, a.ogImage || '_'))) warns.push(`[${a.slug}] thiếu ảnh OG ${a.ogImage} — dùng ảnh mặc định. Chạy: python3 scripts/images.py og ${a.slug}`);
}
for (const a of articles) if (a.status !== 'archived' && !navSlugs.has(a.slug) && !articles.some((b) => (b.relatedArticles || []).includes(a.slug)))
  warns.push(`[${a.slug}] không có đường vào (không nằm trong menu, không bài nào liên kết tới)`);

/* Trang riêng (data/pages.json): hồ sơ tác giả (profile) và trang chủ đề/pillar (hub). Địa chỉ cố định, không trùng /cam-nang/, /atlas/, /nhat-san/. */
const hubOf = new Map();   // slug bài → hub chứa nó (để bài trỏ ngược về pillar)
{
  const seenPath = new Set(), reserved = ['cam-nang', 'atlas', 'nhat-san', 'assets', 'data'];
  for (const pg of sitePages) {
    const w = `data/pages.json [${pg.path}]`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(pg.path || '')) { errors.push(`${w}: path không hợp lệ`); continue; }
    if (seenPath.has(pg.path) || reserved.includes(pg.path.split('/')[0])) errors.push(`${w}: path trùng hoặc thuộc khu vực dành riêng`);
    seenPath.add(pg.path);
    if (!['profile', 'hub'].includes(pg.type)) errors.push(`${w}: type chỉ nhận profile/hub`);
    for (const f of ['h1', 'seoTitle', 'description', 'updatedDate']) if (!pg[f]) errors.push(`${w}: thiếu "${f}"`);
    if (pg.description && (/…$|\.\.\.$/.test(pg.description) || pg.description.length > 160)) warns.push(`${w}: description phải là câu hoàn chỉnh ≤ 160 ký tự (hiện ${pg.description.length})`);
    for (const g of pg.groups || []) for (const sl of g.items) {
      const a = bySlug.get(sl);
      if (!a) errors.push(`${w}: bài không tồn tại: ${sl}`);
      else if (a.status !== 'published') errors.push(`${w}: bài chưa published không được đưa vào trang chủ đề: ${sl}`);
      else if (pg.type === 'hub' && !hubOf.has(sl)) hubOf.set(sl, pg);
    }
  }
}

/* Redirect registry (data/redirects.json): [{"from":"slug-cu","to":"slug-moi"}] cho bài Cẩm nang, hoặc đường dẫn đầy đủ
   {"from":"/cam-nang/slug-cu/","to":"/bat-dong-san/trang-moi/"}. Sinh _redirects (301) + trang chuyển hướng dự phòng. */
const asPath = (v) => (String(v).startsWith('/') ? String(v).replace(/([^/])$/, '$1/') : `${BASE}cam-nang/${v}/`);
const redirectList = [];
for (const r of redirects) {
  if (!r.from || !r.to) { errors.push(`redirects.json: mỗi mục cần from + to`); continue; }
  const slugTo = !String(r.to).startsWith('/'), slugFrom = !String(r.from).startsWith('/');
  if (slugTo && !bySlug.has(r.to)) errors.push(`redirects.json: đích không tồn tại: ${r.to}`);
  if (slugFrom && bySlug.has(r.from)) errors.push(`redirects.json: slug cũ \"${r.from}\" vẫn đang được dùng`);
  redirectList.push({ from: asPath(r.from), to: asPath(r.to), slugTo });
}
for (const r of redirectList) {
  if (r.from === r.to) errors.push(`redirects.json: from trùng to (${r.from})`);
  if (redirectList.filter((x) => x.from === r.from).length > 1) errors.push(`redirects.json: trùng nguồn ${r.from}`);
  if (redirectList.some((x) => x.from === r.to)) errors.push(`redirects.json: chuỗi/vòng chuyển hướng ${r.from} → ${r.to} (chỉ trỏ thẳng tới đích cuối)`);
}

/* ───────── ẤN PHẨM THEO KỲ (World Atlas, Nhật san…) — publications/<mục>/<kỳ>/ ─────────
   Mỗi kỳ là 1 thư mục: info.txt (bắt buộc) + bia.jpg|png|webp + *.pdf + trang-*.jpg|png|webp + *.html */
const PUB_ROOT = path.join(ROOT, 'publications');
const pubSections = (cfg.publications || []).map((sec) => ({ ...sec, issues: [] }));
const IMG_EXT = /\.(jpe?g|png|webp)$/i;
for (const sec of pubSections) {
  const dir = path.join(PUB_ROOT, sec.path);
  if (!fs.existsSync(dir)) continue;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const slug = e.name, where = `publications/${sec.path}/${slug}`, d = path.join(dir, slug);
    if (!SLUG_RE.test(slug)) { errors.push(`${where}: tên thư mục chỉ gồm a-z, 0-9, dấu - (vd 2026-10-ky-01)`); continue; }
    const infoPath = path.join(d, 'info.txt');
    if (!fs.existsSync(infoPath)) { errors.push(`${where}: thiếu info.txt`); continue; }
    const info = {};
    for (const line of fs.readFileSync(infoPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([a-zA-Z-]+)\s*:\s*(.*)$/); if (m) info[m[1].toLowerCase()] = m[2].trim();
    }
    const files = fs.readdirSync(d).filter((f) => !f.startsWith('.'));
    const cover = files.find((f) => /^bia\.(jpe?g|png|webp)$/i.test(f));
    const pdfs = files.filter((f) => /\.pdf$/i.test(f)).sort();
    const pages = files.filter((f) => IMG_EXT.test(f) && f !== cover).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    const htmls = files.filter((f) => /\.html?$/i.test(f)).sort();
    const status = (info['trang-thai'] || 'nhap').toLowerCase();
    if (!info['tieu-de']) errors.push(`${where}/info.txt: thiếu dòng "tieu-de:"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(info['ngay'] || '')) errors.push(`${where}/info.txt: dòng "ngay:" phải dạng YYYY-MM-DD`);
    if (!['cong-bo', 'nhap'].includes(status)) errors.push(`${where}/info.txt: "trang-thai:" chỉ nhận cong-bo hoặc nhap`);
    if (!pdfs.length && !pages.length && !htmls.length) errors.push(`${where}: chưa có nội dung (PDF, ảnh trang-*.jpg hoặc file .html)`);
    if (htmls.length > 1) errors.push(`${where}: chỉ đặt 1 file .html cho mỗi kỳ`);
    for (const f of files) { const sz = fs.statSync(path.join(d, f)).size; if (sz > 24 * 1024 * 1024) errors.push(`${where}/${f}: ${(sz / 1048576).toFixed(1)} MB — vượt giới hạn 25 MB/file của hosting`); }
    if (status === 'cong-bo' && !cover) warns.push(`${where}: nên có ảnh bìa bia.jpg (dùng cho thư viện và khi chia sẻ Facebook/Zalo)`);
    sec.issues.push({ slug, dir: d, title: info['tieu-de'] || slug, date: info['ngay'] || '', desc: info['mo-ta'] || '', teaser: info['trich-doan'] || '', number: info['so'] || '',
      published: status === 'cong-bo', cover, pdfs, pages, html: htmls[0], files });
  }
  sec.issues.sort((a, b) => b.date.localeCompare(a.date));
}

if (warns.length) console.warn(`⚠️  ${warns.length} cảnh báo:\n  ` + warns.join('\n  '));
if (errors.length) { console.error(`❌ ${errors.length} lỗi:\n  ` + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Kiểm tra OK — ${articles.length} bài, ${Object.keys(images).length} ảnh, ${categories.length} chương, ${pubSections.map((p) => `${p.title}: ${p.issues.filter((i) => i.published).length} kỳ công bố/${p.issues.length}`).join(', ')}`);
if (CHECK_ONLY) process.exit(0);

/* ───────────────────────── RENDER ───────────────────────── */
const common = { embedHosts: esc((cfg.embedHosts || []).join(',')), authorRole: esc(cfg.author.role), base: BASE, version: cfg.version, themeColor: cfg.themeColor, siteName: esc(cfg.siteName), locale: cfg.locale, fonts: esc(cfg.fonts),
  /* Google Fonts không chặn hiển thị: tải CSS font ở mức ưu tiên cao nhưng áp dụng sau (display=swap trong URL); noscript giữ nguyên bản cũ */
  fontsLink: `<link rel="preload" as="style" href="${esc(cfg.fonts)}" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="${esc(cfg.fonts)}"></noscript>` };
const au = cfg.author;
const fanHome = au.fanpage ? `\n        <a class="author-cr" href="${esc(au.fanpage)}" target="_blank" rel="noopener">
          <div class="author-cr-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.23 2.69.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg></div>
          <span class="author-cr-val">Fanpage</span><span class="author-cr-label">Facebook Fanpage</span>
        </a>` : '';
const fanFoot = au.fanpage ? `\n      <a class="pf-btn pf-btn-fb" href="${esc(au.fanpage)}" target="_blank" rel="noopener">Fanpage</a>` : '';
const navTpl = rd('templates/partials/global-nav.html');
const NAV_KEYS = ['nav_camnang', ...(cfg.publications || []).map((p) => p.navKey)];
const navHtml = (active) => fill(navTpl, { base: BASE, youtube: esc(au.youtube), phone: au.phone.replace('+84', '0'), phoneDisplay: esc(au.phoneDisplay), zalo: esc(au.zalo),
  ...Object.fromEntries(NAV_KEYS.map((k) => [k, k === active ? ' is-active' : ''])) });
const header = fill(rd('templates/partials/home-header.html'), { ...common, fanpage_home: fanHome });
const footer = fill(rd('templates/partials/article-footer.html'), { ...common, fanpage_footer: fanFoot });
const search = rd('templates/partials/search.html');

function imgTag(attrs, key, eager) {
  const m = images[key]; const [slug, n] = key.split('/');
  const src = (w) => `${BASE}assets/images/articles/${slug}/${n}-${w}.webp`;
  const def = m.v.filter((w) => w <= 1280).pop() || m.v[0];
  const srcset = m.v.map((w) => `${src(w)} ${w}w`).join(', ');
  let a = attrs.replace(/\sdata-img="[^"]*"/, '');
  if (!/\salt=/.test(a)) a += ' alt=""';
  const load = eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"';
  return `<img src="${src(def)}" srcset="${srcset}" sizes="(max-width: 640px) 100vw, 600px" width="${m.w}" height="${m.h}"${a}${load}>`;
}
function renderContent(h) {
  let i = 0;
  h = h.replace(/<img\b([^>]*\sdata-img="([^"]+)"[^>]*?)\s*\/?>/g, (m, attrs, key) => imgTag(attrs, key, i++ === 0));
  if (BASE !== '/') h = h.replace(/(href|data-href)="\/cam-nang\//g, `$1="${BASE}cam-nang/`);
  return h;
}
/* Trang dự án: gắn id cho vạch chia mục, dựng thanh điều hướng nổi, chèn dải số liệu (facts) dưới tiêu đề. */
function decorate(a, h, withCta) {
  const secs = [];
  h = h.replace(SEC_RE, (m, style, num, label) => {
    secs.push({ id: `sec-${num}`, label: SEC_SHORT[num] || label.replace(/&amp;/g, '&').trim() });
    return `<h2 class="p-sec" id="sec-${num}" style="${style}">${m.slice(m.indexOf('><span') + 1, -6)}</h2>`;
  });
  SEC_RE.lastIndex = 0;
  let secNav = '';
  if (secs.length >= 3) secNav = `  <nav id="secNav" aria-label="Các phần của bài">${secs.map((x) => `<a href="#${x.id}">${esc(x.label)}</a>`).join('')}</nav>\n`;
  /* Mục lục cột phải (máy tính): ưu tiên vạch 01–04; bài khác tự lấy từ các tiêu đề .p-h2 (cần ≥ 3). */
  let toc = null, tocCls = '';
  if (secs.length >= 3) toc = secs.map((x) => `<a href="#${x.id}"><span>${x.id.slice(4)}</span>${esc(x.label)}</a>`).join('');
  else {
    const H2_RE = /<p class="p-h2"([^>]*)>([\s\S]*?)<\/p>/g;
    if ([...h.matchAll(H2_RE)].length >= 3) {
      let n = 0; const items = [];
      h = h.replace(H2_RE, (m, attrs, inner) => {
        const id = `h-${++n}`; items.push(`<a href="#${id}">${esc(inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim())}</a>`);
        return `<p class="p-h2" id="${id}"${attrs}>${inner}</p>`;
      });
      toc = items.join(''); tocCls = ' is-heads';
    }
  }
  /* Tiêu đề ngữ nghĩa: <p class="p-h2"> → <h2>. Bài dự án có vạch 01–04 (đã là <h2 class="p-sec">) thì p-h2 là <h3>;
     p-h2 cỡ 13px (tiểu mục) là <h3> khi đã có <h2> phía trước. Giữ nguyên class/style nên hiển thị không đổi. */
  {
    const bars = secs.length >= 3; let seenH2 = bars;
    h = h.replace(/<h2\b[^>]*>|<p class="p-h2"([^>]*)>([\s\S]*?)<\/p>|<div class="p-h2"([^>]*)>([^<]*)<\/div>/g, (m, a1, in1, a2, in2) => {
      if (m.startsWith('<h2')) { seenH2 = true; return m; }
      const attrs = a1 ?? a2, inner = in1 ?? in2;
      const tag = bars || (/font-size:13px/.test(attrs) && seenH2) ? 'h3' : 'h2';
      if (tag === 'h2') seenH2 = true;
      return `<${tag} class="p-h2"${attrs}>${inner}</${tag}>`;
    });
  }
  let aside = '';
  if (toc || withCta) {
    const tocCard = toc ? `\n    <nav id="asideNav" class="aside-card${tocCls}" aria-label="Mục lục"><div class="aside-ttl">Nội dung bài</div>${toc}</nav>` : '';
    const ctaCard = withCta ? `\n    <div class="aside-card aside-cta"><div class="aside-ttl">Tư vấn dự án</div><p>${esc(au.name)} · ERA Vietnam<br>Tư vấn trực tiếp, không áp lực.</p><a class="cta-call" href="tel:${au.phone.replace('+84', '0')}">Gọi ${esc(au.phoneDisplay)}</a><a class="cta-zalo" href="${esc(au.zalo)}" target="_blank" rel="noopener">Nhắn Zalo</a></div>` : '';
    aside = `  <aside id="pAside" aria-label="Mục lục và liên hệ">${tocCard}${ctaCard}\n  </aside>\n`;
  }
  if (a.facts && a.facts.length) {
    const strip = `\n<div class="knums p-facts" role="list" aria-label="Số liệu chính">${a.facts.map((f) => `<div class="knum" role="listitem"><div class="knum-n">${esc(f.n)}</div><div class="knum-l">${esc(f.l)}</div></div>`).join('')}</div>\n`;
    h = /<\/h1>/.test(h) ? h.replace(/<\/h1>/, `</h1>${strip}`) : strip + h;
  }
  return { html: h, secNav, aside };
}
const ctaTpl = rd('templates/partials/cta-bar.html');
const ctaCats = new Set(cfg.ctaCategories || []);
const ctaHtml = fill(ctaTpl, { phone: au.phone.replace('+84', '0'), phoneDisplay: esc(au.phoneDisplay), zalo: esc(au.zalo) });
const ogUrl = (a) => abs(fs.existsSync(path.join(ROOT, a.ogImage || '_')) ? a.ogImage : 'assets/images/og/trang-chu.jpg');
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

/* ── Schema nền (JSON-LD): thực thể dùng chung, tham chiếu bằng @id. Chỉ khai báo thực thể có thật:
   WebSite + Person (Nguyễn Anh Tú). KHÔNG tạo Organization khi chưa có tổ chức xuất bản nào được Tú xác nhận. ── */
const ENT = { website: abs('') + '#website', person: abs('') + '#person' };
const SAME_AS = [...new Set([au.facebook, au.youtube, au.fanpage, ...(au.sameAs || [])].filter((u) => /^https:\/\//.test(u || '')))];
const websiteNode = () => ({ '@type': 'WebSite', '@id': ENT.website, name: cfg.siteName, alternateName: SITE.replace(/^https?:\/\//, ''), url: abs(''), inLanguage: 'vi', publisher: { '@id': ENT.person } });
const personNode = () => ({ '@type': 'Person', '@id': ENT.person, name: au.name, jobTitle: 'Tư vấn bất động sản', telephone: au.phone, url: sitePages.some((x) => x.type === 'profile') ? abs(sitePages.find((x) => x.type === 'profile').path + '/') : abs(''),
  image: abs('assets/images/site/tac-gia-nguyen-anh-tu.webp'), ...(SAME_AS.length ? { sameAs: SAME_AS } : {}) });

/* ── Breadcrumb: Trang chủ › (chương) › các bài cha đã published › bài hiện tại.
   JSON-LD chỉ gồm mục có URL canonical thật (chương trên trang chủ chưa có URL riêng → chỉ hiện chữ, không đưa vào schema). ── */
function crumbs(a) {
  const anc = []; let p = a.parent, guard = 0;
  while (p && guard++ < 8) { const pa = bySlug.get(p); if (!pa) break; if (pa.status === 'published') anc.unshift(pa); p = pa.parent; }
  return { anc, cat: catById[a.category] };
}
function crumbHtml(a) {
  const { anc, cat } = crumbs(a);
  const li = (x) => `<li>${x}</li>`;
  return `<nav class="p-crumb" aria-label="Breadcrumb"><ol>${[
    li(`<a href="${BASE}">Trang chủ</a>`), li(`<span>${esc(cat.title)}</span>`),
    ...anc.map((x) => li(`<a href="${artUrl(x.slug)}">${esc(x.title)}</a>`)),
    li(`<span aria-current="page">${esc(a.title)}</span>`),
  ].join('')}</ol></nav>\n`;
}
function crumbLd(a, canonical) {
  const { anc } = crumbs(a);
  const list = [{ name: 'Trang chủ', url: abs('') }, ...anc.map((x) => ({ name: x.title, url: abs(`${SECTION}/${x.slug}/`) })), { name: a.title, url: canonical }];
  return { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })) };
}

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function write(rel, data) { const p = path.join(DIST, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); }
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
rmrf(DIST); fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));

// ── Trang bài
const tplArticle = rd('templates/article.html');
for (const a of articles) {
  const canonical = abs(`${SECTION}/${a.slug}/`);
  const title = a.seoTitle || a.title;
  const desc = a.seoDescription || a.description;
  const ld = { '@context': 'https://schema.org', '@graph': [
    websiteNode(), personNode(),
    { '@type': 'WebPage', '@id': canonical, url: canonical, name: title, inLanguage: 'vi', isPartOf: { '@id': ENT.website }, breadcrumb: { '@id': canonical + '#breadcrumb' } },
    { '@type': 'Article', '@id': canonical + '#article', headline: title.slice(0, 110), description: desc, image: [ogUrl(a)], datePublished: a.publishedDate, dateModified: a.updatedDate, inLanguage: 'vi',
      author: { '@id': ENT.person }, publisher: { '@id': ENT.person }, isPartOf: { '@id': ENT.website }, mainEntityOfPage: { '@id': canonical }, articleSection: catById[a.category].title },
    crumbLd(a, canonical),
  ] };
  const withCta = ctaCats.has(a.category);
  const dec = decorate(a, contents.get(a.slug), withCta);
  write(`${SECTION}/${a.slug}/index.html`, fill(tplArticle, {
    ...common, slug: a.slug, secNav: dec.secNav, aside: dec.aside, htmlClass: dec.aside ? ' has-aside' : '', ctaBar: withCta ? ctaHtml : '', bodyClass: withCta ? ' has-cta' : '', pageTitle: esc(`${title} | ${cfg.titleSuffix}`), nav: navHtml('nav_camnang'), ogTitle: esc(title), titleAttr: esc(a.title),
    description: esc(desc), canonical, ogImage: ogUrl(a), publishedDate: a.publishedDate, updatedDate: a.updatedDate,
    robots: a.status === 'published' ? '' : '<meta name="robots" content="noindex, follow">\n',
    accent: esc(a.accent), section: esc(a.section), breadcrumb: crumbHtml(a), content: renderContent(dec.html), hubline: hubOf.has(a.slug) ? `\n<p class="p-hubline">Thuộc chủ đề: <a href="${BASE}${hubOf.get(a.slug).path}/">${esc(hubOf.get(a.slug).h1)}</a> — xem tất cả phân tích liên quan.</p>\n` : '', footer,
    jsonld: JSON.stringify(ld).replace(/</g, '\\u003c'),
  }));
}

// ── Trang riêng: hồ sơ tác giả + trang chủ đề (pillar)
const tplPage = rd('templates/page.html');
const pageUrls = [];
for (const pg of sitePages) {
  const url = `${BASE}${pg.path}/`, canonical = abs(`${pg.path}/`), title = pg.seoTitle;
  let body = '', typeLd, extra = {};
  if (pg.type === 'profile') {
    const links = [[au.youtube, 'Kênh YouTube @nguyenanhtu.kienphat'], [au.facebook, 'Trang Facebook cá nhân'], [au.fanpage, 'Facebook Fanpage'], ...(au.sameAs || []).map((u) => [u, u])].filter((x) => /^https:\/\//.test(x[0] || ''));
    body = `<h1 class="p-h1">${esc(pg.h1)}</h1>
<div class="p-who"><img src="${BASE}assets/images/site/avatar-96.webp" width="96" height="96" alt="Nguyễn Anh Tú" decoding="async"><p class="p-lead" style="margin:0">Tư vấn bất động sản · ${esc(au.role)}</p></div>
<p class="p-p">Tôi làm trong lĩnh vực bất động sản hơn 10 năm, tập trung vào thị trường Đông Nam Bộ: Bình Dương, Đồng Nai, Long An và Bà Rịa – Vũng Tàu. Tôi phân tích quy hoạch và phát triển đô thị để người đọc hiểu đúng thị trường và nhìn rõ giá trị thật của từng khu vực, từng dự án.</p>
<h2 class="p-h2">Đọc gì ở đây</h2>
<ul class="p-linklist">
${(sitePages.filter((x) => x.type === 'hub').map((h) => `<li><a href="${BASE}${h.path}/">${esc(h.h1)}</a> — tổng hợp phân tích quy hoạch, metro, pháp lý và các vùng phát triển.</li>`)).join('\n')}
<li><a href="${BASE}">Cẩm Nang Bất Động Sản Đông Nam Bộ</a> — toàn bộ chương và dự án chọn lọc.</li>
</ul>
<h2 class="p-h2">Kênh chính thức</h2>
<ul class="p-linklist">
${links.map((x) => `<li><a href="${esc(x[0])}" target="_blank" rel="me noopener">${esc(x[1])}</a></li>`).join('\n')}
</ul>
<h2 class="p-h2">Liên hệ</h2>
<p class="p-p">Hotline và Zalo: <a href="tel:${au.phone.replace('+84', '0')}" style="color:var(--pc)">${esc(au.phoneDisplay)}</a> · <a href="${esc(au.zalo)}" target="_blank" rel="noopener" style="color:var(--pc)">Nhắn Zalo</a></p>`;
    typeLd = { '@type': ['WebPage', 'ProfilePage'], mainEntity: { '@id': ENT.person } };
  } else {
    const flat = []; 
    const groupsHtml = pg.groups.map((g) => `<h2 class="p-h2">${esc(g.title)}</h2>\n${g.items.map((sl) => { const a = bySlug.get(sl); flat.push(a); return `<div class="p-card"><p><a href="${artUrl(sl)}">${esc(a.title)}</a><br>${esc(a.description)}</p></div>`; }).join('\n')}`).join('\n');
    body = `<h1 class="p-h1">${esc(pg.h1)}</h1>
<p class="p-lead">${esc(pg.lead)}</p>
${pg.context ? `<p class="p-p">${esc(pg.context)}</p>` : ''}
${groupsHtml}`;
    typeLd = { '@type': ['WebPage', 'CollectionPage'] };
    extra = { mainEntity: { '@type': 'ItemList', itemListElement: flat.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`${SECTION}/${a.slug}/`), name: a.title })) } };
  }
  const ld = { '@context': 'https://schema.org', '@graph': [websiteNode(), personNode(),
    { ...typeLd, '@id': canonical, url: canonical, name: title, description: pg.description, inLanguage: 'vi', isPartOf: { '@id': ENT.website }, breadcrumb: { '@id': canonical + '#breadcrumb' }, dateModified: pg.updatedDate, ...extra },
    { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Trang chủ', item: abs('') }, { '@type': 'ListItem', position: 2, name: pg.h1, item: canonical }] }] };
  const crumb = `<nav class="p-crumb" aria-label="Breadcrumb"><ol><li><a href="${BASE}">Trang chủ</a></li><li><span aria-current="page">${esc(pg.h1)}</span></li></ol></nav>\n`;
  write(`${pg.path}/index.html`, fill(tplPage, { ...common, slug: pg.path, secNav: '', aside: '', htmlClass: '', ctaBar: '', bodyClass: '', pageTitle: esc(`${title} | ${cfg.titleSuffix}`), nav: navHtml('nav_camnang'), ogTitle: esc(title), titleAttr: esc(pg.h1),
    description: esc(pg.description), canonical, ogImage: abs('assets/images/og/trang-chu.jpg'), ogType: pg.type === 'profile' ? 'profile' : 'website', robots: '', accent: '#c8993a', section: esc(pg.type === 'profile' ? 'Tác giả' : 'Chủ đề'),
    breadcrumb: crumb, content: body, footer, jsonld: JSON.stringify(ld).replace(/</g, '\\u003c') }));
  pageUrls.push({ loc: canonical, lastmod: pg.updatedDate });
}

// ── Trang chủ: menu render sẵn (HTML tĩnh, không cần JS để hiển thị)
const S = { star: 'border:1px solid rgba(200,153,58,.55);color:#e6c47a;background:rgba(200,153,58,.08)', norm: 'border:1px solid var(--border-2);color:var(--text-2);background:rgba(255,255,255,.02)' };
function chapterHtml(c) {
  const rows = c.items.map((it) => {
    const a = bySlug.get(it.article); const t = `${a.icon ? a.icon + ' ' : ''}${esc(a.title)}`;
    if (c.layout !== 'zones') return `<a class="art-row xl-b" href="${artUrl(a.slug)}"><div class="art-title">${t}</div><div class="art-sub">${esc(a.subtitle)}</div><div class="art-arrow">›</div></a>`;
    const hl = it.highlight ? ' style="border-color:rgba(200,153,58,.25);background:rgba(200,153,58,.04)"' : '';
    const star = it.star ? ' <span style="color:#c8993a;font-size:13px">⭐</span>' : '';
    let row = `<a class="art-row xl-b" href="${artUrl(a.slug)}"${hl}><div style="font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--muted);width:22px;flex-shrink:0">${esc(it.num || '')}</div><div style="flex:1;min-width:0"><div class="art-title">${t}${star}</div><div class="art-sub">${esc(a.subtitle)}</div></div><div class="art-arrow">›</div></a>`;
    if (it.projects && it.projects.length) {
      row += '\n<div style="padding:0 16px 10px 54px;margin-top:-2px">' + it.projects.map((p) => {
        const pa = bySlug.get(p.article);
        return `<a class="xl-i" href="${artUrl(pa.slug)}" style="cursor:pointer;display:inline-block;font-size:11px;padding:3px 9px;border-radius:12px;margin:0 5px 6px 0;${p.star ? S.star : S.norm}">${p.star ? '⭐ ' : ''}${esc(p.label || pa.title)}</a>`;
      }).join('') + '</div>';
    }
    return row;
  }).join('\n');
  return `  <!-- CH ${String(c.ch).padStart(2, '0')} — ${esc(c.title)} -->
  <div class="chapter" data-ch="${c.ch}" id="${c.id}">
    <div class="ch-header" onclick="toggleCh(${c.ch})" ontouchstart="">
      <div class="ch-num">${esc(c.num)}</div><div class="ch-icon">${c.icon}</div>
      <div class="ch-info">
        <div class="ch-title">${esc(c.title)}</div>
        <div class="ch-tagline">${esc(c.tagline)}</div>
      </div>
      <div class="ch-meta">
        <div class="ch-badge">${esc(c.badge)}</div>
        <div class="ch-btn">+</div>
      </div>
    </div>
    <div class="ch-body">
${rows}
    </div>
  </div>
`;
}
const homeLd = { '@context': 'https://schema.org', '@graph': [websiteNode(), personNode()] };
write('index.html', fill(rd('templates/home.html'), {
  ...common, nav: navHtml('nav_camnang'), title: esc(cfg.siteTitle), description: esc(cfg.siteDescription), canonical: abs(''),
  ogImage: abs('assets/images/og/trang-chu.jpg'), header, search, chapters: categories.map(chapterHtml).join('\n'),
  jsonld: JSON.stringify(homeLd).replace(/</g, '\\u003c'),
}));
write('404.html', fill(rd('templates/404.html'), { ...common, nav: navHtml('') }));

// ── Search index nhẹ (chỉ metadata) + bảng chuyển ID v57 → slug
const idx = { v: cfg.version, items: [], legacy: {} };
for (const a of articles) {
  if (a.legacy && a.legacy.panelId) idx.legacy[a.legacy.panelId] = a.slug;
  if (a.status === 'archived') continue;
  const c = catById[a.category];
  idx.items.push({ s: a.slug, t: a.title, i: a.icon || '', u: a.subtitle || '', k: (a.searchKeywords || '').slice(0, 700), c: c.title, n: c.ch, x: a.accent });
}
write('data/search-index.json', JSON.stringify(idx));


// ── Ấn phẩm theo kỳ
const pubUrls = [];
const tplPubIndex = rd('templates/publication-index.html'), tplPubIssue = rd('templates/publication-issue.html');
const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '';
const pubFooter = `<footer class="publication-footer">${esc(au.role)} &nbsp; / &nbsp; <a href="tel:${au.phone.replace('+84', '0')}">${esc(au.phoneDisplay)}</a> &nbsp; / &nbsp; <a href="${esc(au.zalo)}">Liên hệ Zalo</a></footer>`;
function externalizeBase64(html, outDir, urlBase) {
  let n = 0;
  return html.replace(/data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=\s]+)/g, (m, type, b64) => {
    const ext = type.startsWith('svg') ? 'svg' : type.replace('jpeg', 'jpg');
    const name = `hinh-${String(++n).padStart(2, '0')}.${ext}`;
    fs.writeFileSync(path.join(outDir, name), Buffer.from(b64.replace(/\s/g, ''), 'base64'));
    return urlBase + name;
  });
}
for (const sec of pubSections) {
  const secUrl = `${BASE}${sec.path}/`;
  const showCover = sec.cover !== false; // site.config.json → publications[].cover=false: không hiện ảnh bìa trên web (ảnh vẫn dùng làm ảnh chia sẻ Facebook/Zalo)
  const listed = sec.issues.filter((i) => i.published);
  for (const is of sec.issues) {
    const rel = `${sec.path}/${is.slug}/`, url = BASE + rel, out = path.join(DIST, rel);
    fs.mkdirSync(out, { recursive: true });
    for (const f of [is.cover, ...is.pdfs, ...is.pages].filter(Boolean)) fs.copyFileSync(path.join(is.dir, f), path.join(out, f));
    let actions = '';
    if (is.html) {
      fs.mkdirSync(path.join(out, 'doc'), { recursive: true });
      const raw = fs.readFileSync(path.join(is.dir, is.html), 'utf8');
      fs.writeFileSync(path.join(out, 'doc', 'index.html'), externalizeBase64(raw, path.join(out, 'doc'), `${url}doc/`));
      actions += `<a class="pub-btn" href="${url}doc/">Đọc trực tuyến →</a>`;
    }
    for (const f of is.pdfs) actions += `<a class="pub-btn pub-btn-ghost" href="${url}${encodeURI(f)}" target="_blank" rel="noopener">Tải PDF${is.pdfs.length > 1 ? ' · ' + esc(f) : ''} ↓</a>`;
    const pagesHtml = is.pages.map((f, i) => `<img class="pub-page" src="${url}${encodeURI(f)}" alt="${esc(is.title)} — trang ${i + 1}" loading="${i ? 'lazy' : 'eager'}" decoding="async">`).join('\n');
    const og = is.cover ? SITE + url + encodeURI(is.cover) : abs('assets/images/og/trang-chu.jpg');
    const desc = is.desc || sec.description;
    write(`${rel}index.html`, fill(tplPubIssue, { ...common, nav: navHtml(sec.navKey), pageTitle: esc(`${is.title} — ${sec.title} | ${cfg.titleSuffix}`),
      description: esc(desc), canonical: SITE + url, ogImage: og, robots: is.published ? '' : '<meta name="robots" content="noindex, nofollow">\n',
      label: esc(sec.label), secTitle: esc(sec.title), secUrl, title: esc(is.title), meta: esc([is.number ? 'Số ' + is.number : '', fmtDate(is.date)].filter(Boolean).join(' · ')),
      desc: esc(is.teaser || is.desc), cover: is.cover && showCover ? `<img class="pub-cover" src="${url}${encodeURI(is.cover)}" alt="Bìa ${esc(is.title)}" decoding="async">` : '',
      draft: is.published ? '' : '<div class="pub-draft">BẢN NHÁP — chỉ bạn có đường dẫn này mới xem được. Đổi <b>trang-thai: cong-bo</b> trong info.txt để công bố.</div>',
      actions, pages: pagesHtml, footer: pubFooter }));
    if (is.published) { pubUrls.push({ loc: SITE + url, lastmod: is.date }); if (is.html) pubUrls.push({ loc: SITE + url + 'doc/', lastmod: is.date }); }
  }
  const metaOf = (is) => esc([is.number ? 'Số ' + is.number : '', fmtDate(is.date)].filter(Boolean).join(' · '));
  const cards = listed.map((is) => showCover
    ? `<a class="pub-card" href="${BASE}${sec.path}/${is.slug}/">${is.cover ? `<img src="${BASE}${sec.path}/${is.slug}/${encodeURI(is.cover)}" alt="" loading="lazy" decoding="async">` : '<div class="pub-card-nocover">' + esc(sec.title) + '</div>'}<div class="pub-card-body"><div class="pub-card-meta">${metaOf(is)}</div><div class="pub-card-title">${esc(is.title)}</div></div></a>`
    : `<a class="pub-card pub-card-text" href="${BASE}${sec.path}/${is.slug}/"><div class="pub-card-body"><div class="pub-card-meta">${metaOf(is)}</div><h2 class="pub-card-title">${esc(is.title)}</h2>${(is.teaser || is.desc) ? `<p class="pub-card-excerpt">${esc(is.teaser || is.desc)}</p>` : ''}<span class="pub-card-more">Đọc ${esc(sec.title.toLowerCase())} →</span></div></a>`).join('\n');
  const library = listed.length
    ? `<section class="edition-list"><div class="pub-label">THƯ VIỆN ẤN PHẨM</div><div class="pub-grid${showCover ? '' : ' pub-list'}">${cards}</div></section>`
    : `<section class="edition-empty"><div class="pub-label">THƯ VIỆN ẤN PHẨM</div><h2>Chưa có ấn phẩm được công bố</h2><p>Các kỳ phát hành sẽ xuất hiện tại đây cùng ảnh bìa, ngày phát hành và đường dẫn đọc hoặc tải về.</p></section>`;
  write(`${sec.path}/index.html`, fill(tplPubIndex, { ...common, nav: navHtml(sec.navKey), pageTitle: esc(sec.pageTitle), description: esc(sec.description),
    canonical: SITE + secUrl, ogImage: abs('assets/images/og/trang-chu.jpg'), label: esc(sec.label), title: esc(sec.title), intro: esc(sec.description), library, footer: pubFooter }));
  pubUrls.push({ loc: SITE + secUrl });
}

// ── SEO: sitemap, robots; hosting: _headers (Cloudflare Pages / Netlify)
const pub = articles.filter((a) => a.status === 'published');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [`  <url><loc>${abs('')}</loc></url>`, ...pageUrls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`), ...pubUrls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`), ...pub.map((a) => `  <url><loc>${abs(`${SECTION}/${a.slug}/`)}</loc><lastmod>${a.updatedDate}</lastmod></url>`)].join('\n') + '\n</urlset>\n');
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
write('_headers', `/assets/css/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/js/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/images/*\n  Cache-Control: public, max-age=2592000\n/data/*\n  Cache-Control: public, max-age=300\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n/cam-nang/*\n  Cache-Control: public, max-age=0, must-revalidate\n`);

// Chuyển hướng: _redirects (301, Cloudflare Pages/Netlify) + trang chuyển hướng tĩnh dự phòng cho host không đọc _redirects.
// Không có mục nào trong data/redirects.json thì KHÔNG sinh _redirects (không tạo redirect giả).
for (const r of redirectList) {
  if (!r.slugTo && !fs.existsSync(path.join(DIST, r.to.replace(/\/$/, ''), 'index.html')) && !fs.existsSync(path.join(DIST, r.to))) throw new Error(`redirects.json: đích ${r.to} không tồn tại trong bản build`);
  if (fs.existsSync(path.join(DIST, r.from, 'index.html'))) throw new Error(`redirects.json: nguồn ${r.from} đang là trang thật — không thể chuyển hướng`);
  const to = SITE + r.to;
  write(`${r.from.replace(/^\//, '')}index.html`, `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Đang chuyển…</title><link rel="canonical" href="${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"></head><body><a href="${to}">${to}</a></body></html>`);
}
if (redirectList.length) write('_redirects', redirectList.flatMap((r) => [`${r.from.replace(/\/$/, '')} ${r.to} 301`, `${r.from} ${r.to} 301`]).join('\n') + '\n');
const sizeOf = (p) => (fs.statSync(path.join(DIST, p)).size / 1024).toFixed(1) + ' KB';
console.log(`✓ Build xong → dist/  (trang chủ ${sizeOf('index.html')}, search index ${sizeOf('data/search-index.json')}, ${articles.length} trang bài)`);
