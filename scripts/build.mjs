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

for (const r of redirects) {
  if (!r.from || !r.to) errors.push(`redirects.json: mỗi mục cần from + to`);
  else if (!bySlug.has(r.to)) errors.push(`redirects.json: đích không tồn tại: ${r.to}`);
  else if (bySlug.has(r.from)) errors.push(`redirects.json: slug cũ "${r.from}" vẫn đang được dùng`);
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
    sec.issues.push({ slug, dir: d, title: info['tieu-de'] || slug, date: info['ngay'] || '', desc: info['mo-ta'] || '', number: info['so'] || '',
      published: status === 'cong-bo', cover, pdfs, pages, html: htmls[0], files });
  }
  sec.issues.sort((a, b) => b.date.localeCompare(a.date));
}

if (warns.length) console.warn(`⚠️  ${warns.length} cảnh báo:\n  ` + warns.join('\n  '));
if (errors.length) { console.error(`❌ ${errors.length} lỗi:\n  ` + errors.join('\n  ')); process.exit(1); }
console.log(`✓ Kiểm tra OK — ${articles.length} bài, ${Object.keys(images).length} ảnh, ${categories.length} chương, ${pubSections.map((p) => `${p.title}: ${p.issues.filter((i) => i.published).length} kỳ công bố/${p.issues.length}`).join(', ')}`);
if (CHECK_ONLY) process.exit(0);

/* ───────────────────────── RENDER ───────────────────────── */
const common = { authorRole: esc(cfg.author.role), base: BASE, version: cfg.version, themeColor: cfg.themeColor, siteName: esc(cfg.siteName), locale: cfg.locale, fonts: esc(cfg.fonts) };
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
function decorate(a, h) {
  const secs = [];
  h = h.replace(SEC_RE, (m, style, num, label) => {
    secs.push({ id: `sec-${num}`, label: SEC_SHORT[num] || label.replace(/&amp;/g, '&').trim() });
    return `<div class="p-sec" id="sec-${num}" style="${style}">${m.slice(m.indexOf('><span') + 1, -6)}</div>`;
  });
  SEC_RE.lastIndex = 0;
  let secNav = '';
  if (secs.length >= 3) secNav = `  <nav id="secNav" aria-label="Các phần của bài">${secs.map((x) => `<a href="#${x.id}">${esc(x.label)}</a>`).join('')}</nav>\n`;
  if (a.facts && a.facts.length) {
    const strip = `\n<div class="knums p-facts" role="list" aria-label="Số liệu chính">${a.facts.map((f) => `<div class="knum" role="listitem"><div class="knum-n">${esc(f.n)}</div><div class="knum-l">${esc(f.l)}</div></div>`).join('')}</div>\n`;
    h = /<\/h1>/.test(h) ? h.replace(/<\/h1>/, `</h1>${strip}`) : strip + h;
  }
  return { html: h, secNav };
}
const ctaTpl = rd('templates/partials/cta-bar.html');
const ctaCats = new Set(cfg.ctaCategories || []);
const ctaHtml = fill(ctaTpl, { phone: au.phone.replace('+84', '0'), phoneDisplay: esc(au.phoneDisplay), zalo: esc(au.zalo) });
const ogUrl = (a) => abs(fs.existsSync(path.join(ROOT, a.ogImage || '_')) ? a.ogImage : 'assets/images/og/trang-chu.jpg');
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

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
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: title.slice(0, 110), description: desc,
    image: [ogUrl(a)], datePublished: a.publishedDate, dateModified: a.updatedDate, inLanguage: 'vi',
    author: { '@type': 'Person', name: au.name, url: abs('') }, publisher: { '@type': 'Person', name: au.name },
    mainEntityOfPage: canonical, articleSection: catById[a.category].title,
  };
  const dec = decorate(a, contents.get(a.slug));
  const withCta = ctaCats.has(a.category);
  write(`${SECTION}/${a.slug}/index.html`, fill(tplArticle, {
    ...common, slug: a.slug, secNav: dec.secNav, ctaBar: withCta ? ctaHtml : '', bodyClass: withCta ? ' has-cta' : '', pageTitle: esc(`${title} | ${cfg.titleSuffix}`), nav: navHtml('nav_camnang'), ogTitle: esc(title), titleAttr: esc(a.title),
    description: esc(desc), canonical, ogImage: ogUrl(a), publishedDate: a.publishedDate, updatedDate: a.updatedDate,
    robots: a.status === 'published' ? '' : '<meta name="robots" content="noindex, follow">\n',
    accent: esc(a.accent), section: esc(a.section), content: renderContent(dec.html), footer,
    jsonld: JSON.stringify(ld).replace(/</g, '\\u003c'),
  }));
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
const homeLd = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebSite', name: cfg.siteName, url: abs(''), inLanguage: 'vi' },
  { '@type': 'Person', name: au.name, jobTitle: 'Tư vấn bất động sản', telephone: au.phone, url: abs(''), sameAs: [au.facebook, au.youtube, au.fanpage].filter(Boolean) },
] };
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
      desc: esc(is.desc), cover: is.cover ? `<img class="pub-cover" src="${url}${encodeURI(is.cover)}" alt="Bìa ${esc(is.title)}" decoding="async">` : '',
      draft: is.published ? '' : '<div class="pub-draft">BẢN NHÁP — chỉ bạn có đường dẫn này mới xem được. Đổi <b>trang-thai: cong-bo</b> trong info.txt để công bố.</div>',
      actions, pages: pagesHtml, footer: pubFooter }));
    if (is.published) pubUrls.push({ loc: SITE + url, lastmod: is.date });
  }
  const cards = listed.map((is) => `<a class="pub-card" href="${BASE}${sec.path}/${is.slug}/">${is.cover ? `<img src="${BASE}${sec.path}/${is.slug}/${encodeURI(is.cover)}" alt="" loading="lazy" decoding="async">` : '<div class="pub-card-nocover">' + esc(sec.title) + '</div>'}<div class="pub-card-body"><div class="pub-card-meta">${esc([is.number ? 'Số ' + is.number : '', fmtDate(is.date)].filter(Boolean).join(' · '))}</div><div class="pub-card-title">${esc(is.title)}</div></div></a>`).join('\n');
  const library = listed.length
    ? `<section class="edition-list"><div class="pub-label">THƯ VIỆN ẤN PHẨM</div><div class="pub-grid">${cards}</div></section>`
    : `<section class="edition-empty"><div class="pub-label">THƯ VIỆN ẤN PHẨM</div><h2>Chưa có ấn phẩm được công bố</h2><p>Các kỳ phát hành sẽ xuất hiện tại đây cùng ảnh bìa, ngày phát hành và đường dẫn đọc hoặc tải về.</p></section>`;
  write(`${sec.path}/index.html`, fill(tplPubIndex, { ...common, nav: navHtml(sec.navKey), pageTitle: esc(sec.pageTitle), description: esc(sec.description),
    canonical: SITE + secUrl, ogImage: abs('assets/images/og/trang-chu.jpg'), label: esc(sec.label), title: esc(sec.title), intro: esc(sec.description), library, footer: pubFooter }));
  pubUrls.push({ loc: SITE + secUrl });
}

// ── SEO: sitemap, robots; hosting: _headers (Cloudflare Pages / Netlify)
const pub = articles.filter((a) => a.status === 'published');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [`  <url><loc>${abs('')}</loc></url>`, ...pubUrls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`), ...pub.map((a) => `  <url><loc>${abs(`${SECTION}/${a.slug}/`)}</loc><lastmod>${a.updatedDate}</lastmod></url>`)].join('\n') + '\n</urlset>\n');
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
write('_headers', `/assets/css/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/js/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/images/*\n  Cache-Control: public, max-age=2592000\n/data/*\n  Cache-Control: public, max-age=300\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n/cam-nang/*\n  Cache-Control: public, max-age=0, must-revalidate\n`);

// Chuyển hướng slug cũ: GitHub Pages không hỗ trợ _redirects → sinh trang chuyển hướng tĩnh
for (const r of redirects) {
  const to = abs(`${SECTION}/${r.to}/`);
  write(`${SECTION}/${r.from}/index.html`, `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Đang chuyển…</title><link rel="canonical" href="${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"></head><body><a href="${to}">${to}</a></body></html>`);
}
const sizeOf = (p) => (fs.statSync(path.join(DIST, p)).size / 1024).toFixed(1) + ' KB';
console.log(`✓ Build xong → dist/  (trang chủ ${sizeOf('index.html')}, search index ${sizeOf('data/search-index.json')}, ${articles.length} trang bài)`);
