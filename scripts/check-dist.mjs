#!/usr/bin/env node
/* Kiểm thử hồi quy SEO sau build (Node >= 18, không cần thư viện ngoài). Chạy SAU `node scripts/build.mjs`.
   node scripts/check-dist.mjs                          → kiểm tra dist/ so với tests/published-urls.json
   node scripts/check-dist.mjs --baseline /tmp/dist-cu  → so thêm với một bản build cũ (canonical, robots, dung lượng JS/CSS)
   node scripts/check-dist.mjs --write-lock [dist]      → ghi lại tests/published-urls.json từ một dist (chỉ làm khi Tú duyệt đổi URL)

   Bảo vệ "ZERO BROKEN LINKS + ZERO UNNECESSARY SEO LOSS":
   1. Mọi URL trong tests/published-urls.json vẫn tồn tại, còn canonical cũ, không noindex, có trong sitemap — hoặc đã có redirect 301 trong data/redirects.json.
   2. Trang stub/archived vẫn noindex và không có trong sitemap.
   3. Mỗi trang có đúng 1 <h1>, không nhảy cấp tiêu đề, đúng 1 canonical.
   4. JSON-LD hợp lệ (parse được, @id tham chiếu tồn tại, BreadcrumbList chỉ trỏ tới URL canonical có thật).
   5. Không có liên kết/ảnh/asset nội bộ bị hỏng (kể cả #neo trong cùng trang).
   Thoát mã 1 nếu có lỗi. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const has = (k) => process.argv.includes(k);
const rd = (p) => fs.readFileSync(p, 'utf8');
const DIST = path.resolve((has('--write-lock') && arg('--write-lock') && !arg('--write-lock').startsWith('--')) ? arg('--write-lock') : path.join(ROOT, 'dist'));
const LOCK = path.join(ROOT, 'tests/published-urls.json');
const BASELINE = arg('--baseline') ? path.resolve(arg('--baseline')) : null;
const cfg = JSON.parse(rd(path.join(ROOT, 'site.config.json')));
const SITE = cfg.siteUrl.replace(/\/$/, '');
const articles = JSON.parse(rd(path.join(ROOT, 'data/articles.json')));
const pageDefs = fs.existsSync(path.join(ROOT, 'data/pages.json')) ? JSON.parse(rd(path.join(ROOT, 'data/pages.json'))) : [];
const pageRels = new Set(pageDefs.map((x) => `/${x.path}/index.html`));
const redirects = fs.existsSync(path.join(ROOT, 'data/redirects.json')) ? JSON.parse(rd(path.join(ROOT, 'data/redirects.json'))) : [];

const pageFile = (urlPath) => path.join(DIST, urlPath.replace(/^\//, ''), urlPath.endsWith('/') || urlPath === '' ? 'index.html' : '');
const canonicalOf = (h) => (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
const noindex = (h) => /<meta name="robots" content="[^"]*noindex/i.test(h);
const sitemapUrls = () => [...rd(path.join(DIST, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

/* ── Chế độ ghi lock ── */
if (has('--write-lock')) {
  const sm = sitemapUrls(); const urls = {};
  for (const u of sm) {
    const p = u.replace(SITE, ''); const f = pageFile(p);
    if (!fs.existsSync(f)) throw new Error(`sitemap có URL không tồn tại: ${u}`);
    urls[p] = canonicalOf(rd(f));
  }
  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify({ note: 'URL đã xuất bản (có trong sitemap) — không được mất hoặc đổi canonical nếu không có redirect 301 trong data/redirects.json. Chỉ cập nhật bằng: node scripts/check-dist.mjs --write-lock', count: sm.length, urls }, null, 1) + '\n');
  console.log(`✓ Đã ghi ${LOCK} (${sm.length} URL)`); process.exit(0);
}

const errors = [], infos = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); return cond; };

/* ── 1. Khóa URL đã xuất bản ── */
const redirected = new Set(redirects.map((r) => (String(r.from).startsWith('/') ? r.from : `/cam-nang/${r.from}/`)));
const sm = new Set(sitemapUrls());
ok(sm.size === sitemapUrls().length, 'sitemap.xml có URL trùng');
let lockCount = 0;
if (fs.existsSync(LOCK)) {
  const lock = JSON.parse(rd(LOCK));
  for (const [p, canon] of Object.entries(lock.urls)) {
    lockCount++;
    if (redirected.has(p)) continue; // đã có redirect: được phép biến mất khỏi sitemap
    const f = pageFile(p);
    if (!ok(fs.existsSync(f), `URL đã xuất bản bị mất: ${p} (nếu cố ý đổi: thêm vào data/redirects.json)`)) continue;
    const h = rd(f);
    ok(canonicalOf(h) === canon, `canonical đổi: ${p} → ${canonicalOf(h)} (cũ: ${canon})`);
    ok(!noindex(h), `URL đã xuất bản bị noindex: ${p}`);
    ok(sm.has(SITE + p), `URL đã xuất bản mất khỏi sitemap: ${p}`);
  }
} else infos.push('Chưa có tests/published-urls.json — bỏ qua bước khóa URL (tạo bằng --write-lock).');

/* ── 2. Trạng thái index ── */
for (const a of articles) {
  const f = pageFile(`/cam-nang/${a.slug}/`);
  if (!ok(fs.existsSync(f), `thiếu trang ${a.slug}`)) continue;
  const h = rd(f); const url = `${SITE}/cam-nang/${a.slug}/`;
  if (a.status === 'published') { ok(!noindex(h), `[${a.slug}] published nhưng noindex`); ok(sm.has(url), `[${a.slug}] published nhưng không có trong sitemap`); }
  else { ok(noindex(h), `[${a.slug}] ${a.status} nhưng KHÔNG noindex`); ok(!sm.has(url), `[${a.slug}] ${a.status} nhưng có trong sitemap`); }
}

/* ── 3–5. Từng trang HTML ── */
const htmlFiles = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets' && e.name !== 'data') walk(p); } else if (e.name.endsWith('.html')) htmlFiles.push(p); } })(DIST);
const existsUrl = (u) => {
  const clean = u.split('#')[0].split('?')[0]; if (!clean) return true;
  const p = path.join(DIST, decodeURIComponent(clean).replace(/^\//, ''));
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
  return fs.existsSync(path.join(p, 'index.html'));
};
let h1Bad = 0, skipBad = 0, ldPages = 0, brokenLinks = 0, imgNoAlt = 0, imgEmptyAlt = 0, imgTotal = 0, h2Pages = 0, crumbPages = 0;
for (const f of htmlFiles) {
  const rel = '/' + path.relative(DIST, f).replace(/\\/g, '/'); const h = rd(f);
  const isPage = pageRels.has(rel);
  const isArticle = (rel.startsWith('/cam-nang/') && !rel.endsWith('404.html')) || isPage;
  const isRedirectStub = /http-equiv="refresh"/.test(h);
  if (isRedirectStub) continue;
  const stripped = h.replace(/<script\b[\s\S]*?<\/script>/g, '');
  if (isArticle) {
    const heads = [...stripped.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
    if (!ok(heads.filter((x) => x === 1).length === 1, `${rel}: phải có đúng 1 <h1> (có ${heads.filter((x) => x === 1).length})`)) h1Bad++;
    let prev = 1, skip = false; for (const x of heads.slice(1)) { if (x > prev + 1) skip = true; prev = x; }
    if (!ok(!skip, `${rel}: nhảy cấp tiêu đề (${heads.join('')})`)) skipBad++;
    if (heads.includes(2)) h2Pages++;
    ok((h.match(/<link rel="canonical"/g) || []).length === 1, `${rel}: cần đúng 1 canonical`);
    ok(/<nav class="p-crumb"/.test(h), `${rel}: thiếu breadcrumb`); if (/<nav class="p-crumb"/.test(h)) crumbPages++;
    /* JSON-LD */
    const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    if (ok(blocks.length === 1, `${rel}: cần đúng 1 khối JSON-LD (có ${blocks.length})`)) {
      let j; try { j = JSON.parse(blocks[0]); } catch (e) { ok(false, `${rel}: JSON-LD không parse được: ${e.message}`); }
      if (j) {
        ldPages++;
        const g = j['@graph'] || [j]; const ids = new Set(g.map((n) => n['@id']).filter(Boolean));
        const types = g.map((n) => n['@type']);
        const flatTypes = types.flat(); for (const t of (isPage ? ['WebSite', 'Person', 'BreadcrumbList', 'WebPage'] : ['WebSite', 'Person', 'Article', 'BreadcrumbList', 'WebPage'])) ok(flatTypes.includes(t), `${rel}: JSON-LD thiếu ${t}`);
        const refs = []; (function scan(o) { if (o && typeof o === 'object') { if (Object.keys(o).length === 1 && o['@id']) refs.push(o['@id']); else Object.values(o).forEach(scan); } })(g);
        for (const r of refs) ok(ids.has(r), `${rel}: JSON-LD @id không tồn tại trong graph: ${r}`);
        const art = g.find((n) => n['@type'] === 'Article'), bc = g.find((n) => n['@type'] === 'BreadcrumbList'), pg = g.find((n) => [].concat(n['@type']).includes('WebPage'));
        const canon = canonicalOf(h);
        ok(pg && pg['@id'] === canon, `${rel}: WebPage @id ≠ canonical`);
        if (!isPage) ok(art && art.author && art.publisher && art.author['@id'] && art.publisher['@id'], `${rel}: Article thiếu author/publisher`);
        const descMeta = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
        const dSrc = isPage ? pg : art;
        ok(dSrc && dSrc.description && descMeta && dSrc.description.replace(/&amp;/g, '&') === descMeta.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), `${rel}: description trong JSON-LD ≠ meta description`);
        if (bc) {
          const items = bc.itemListElement || [];
          ok(items.length >= 2 && items.every((it, i) => it.position === i + 1 && it.name && it.item), `${rel}: BreadcrumbList sai cấu trúc`);
          ok(items.length && items[items.length - 1].item === canon, `${rel}: mục cuối breadcrumb ≠ canonical`);
          for (const it of items) {
            const p = String(it.item).replace(SITE, ''); const ff = pageFile(p);
            if (ok(String(it.item).startsWith(SITE) && fs.existsSync(ff), `${rel}: breadcrumb trỏ tới URL không tồn tại: ${it.item}`)) {
              const th = rd(ff); ok(canonicalOf(th) === it.item, `${rel}: breadcrumb ${it.item} không phải URL canonical`); if (it.item !== canon) ok(!noindex(th), `${rel}: breadcrumb trỏ tới trang noindex: ${it.item}`);
            }
          }
        }
      }
    }
  }
  /* Liên kết / asset nội bộ */
  const ids = new Set([...stripped.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const targets = [...stripped.matchAll(/(?:href|src|data-href)="([^"]+)"/g)].map((m) => m[1]);
  for (const m of stripped.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) targets.push(part.trim().split(/\s+/)[0]);
  for (const t of targets) {
    if (!t || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(t)) continue;
    if (t.startsWith('#')) { if (t.length > 1 && !ok(ids.has(t.slice(1)), `${rel}: neo #${t.slice(1)} không có id tương ứng`)) brokenLinks++; continue; }
    if (t.startsWith('/')) { if (!ok(existsUrl(t), `${rel}: liên kết/asset hỏng → ${t}`)) brokenLinks++; }
  }
  for (const m of stripped.matchAll(/<img\b[^>]*>/g)) { imgTotal++; if (!/\salt=/.test(m[0])) imgNoAlt++; else if (/\salt=""/.test(m[0])) imgEmptyAlt++; }
}
ok(imgNoAlt === 0, `${imgNoAlt} thẻ <img> không có thuộc tính alt`);

/* ── 6. So với bản build cũ ── */
const gz = (p) => zlib.gzipSync(fs.readFileSync(p), { level: 9 }).length;
const sizeRows = [];
if (BASELINE) {
  const before = new Set(); (function walk(d, base) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== 'assets') walk(p, base); } else if (e.name.endsWith('.html')) before.add('/' + path.relative(base, p).replace(/\\/g, '/')); } })(BASELINE, BASELINE);
  const nowSet = new Set(htmlFiles.map((f) => '/' + path.relative(DIST, f).replace(/\\/g, '/')));
  for (const r of before) ok(nowSet.has(r), `trang có ở bản cũ nhưng mất ở bản mới: ${r}`);
  let canonChanged = 0, robotsChanged = 0, titleChanged = 0, descChanged = 0;
  for (const r of before) {
    if (!nowSet.has(r)) continue;
    const a = rd(path.join(BASELINE, r)), b = rd(path.join(DIST, r));
    if (canonicalOf(a) !== canonicalOf(b)) { canonChanged++; errors.push(`canonical đổi: ${r}: ${canonicalOf(a)} → ${canonicalOf(b)}`); }
    if (noindex(a) !== noindex(b)) { robotsChanged++; errors.push(`trạng thái noindex đổi: ${r}`); }
    if ((a.match(/<title>([^<]*)/) || [])[1] !== (b.match(/<title>([^<]*)/) || [])[1]) titleChanged++;
    if ((a.match(/name="description" content="([^"]*)"/) || [])[1] !== (b.match(/name="description" content="([^"]*)"/) || [])[1]) descChanged++;
  }
  const smB = [...rd(path.join(BASELINE, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const u of smB) ok(sm.has(u), `sitemap mất URL so với bản cũ: ${u}`);
  infos.push(`So với bản cũ: ${before.size} trang HTML cũ đều còn | canonical đổi ${canonChanged} | noindex đổi ${robotsChanged} | <title> đổi ${titleChanged} | meta description đổi ${descChanged} | sitemap cũ ${smB.length} URL → mới ${sm.size} URL`);
  for (const f of ['assets/css/main.css', 'assets/js/article.js', 'assets/js/home.js']) {
    const a = path.join(BASELINE, f), b = path.join(DIST, f);
    sizeRows.push({ f, raw0: fs.statSync(a).size, raw1: fs.statSync(b).size, gz0: gz(a), gz1: gz(b) });
  }
  for (const r of sizeRows) { const pct = (r.gz1 - r.gz0) / r.gz0 * 100; if (pct > 5) errors.push(`${r.f} gzip tăng ${pct.toFixed(1)}% (> 5%)`); }
  const avg = (d, files) => files.reduce((t, f) => t + gz(path.join(d, f)), 0) / files.length;
  const arts = articles.filter((a) => a.status === 'published').map((a) => `cam-nang/${a.slug}/index.html`);
  infos.push(`HTML bài published (gzip TB): ${(avg(BASELINE, arts) / 1024).toFixed(2)} KB → ${(avg(DIST, arts) / 1024).toFixed(2)} KB | trang chủ: ${(gz(path.join(BASELINE, 'index.html')) / 1024).toFixed(2)} KB → ${(gz(path.join(DIST, 'index.html')) / 1024).toFixed(2)} KB`);
}

/* ── Báo cáo ── */
console.log(`Thư mục kiểm tra: ${DIST}`);
console.log(`Trang HTML: ${htmlFiles.length} | khóa URL: ${lockCount} | trang bài có breadcrumb: ${crumbPages} | có <h2>: ${h2Pages} | JSON-LD hợp lệ: ${ldPages}`);
console.log(`<h1> sai: ${h1Bad} | nhảy cấp heading: ${skipBad} | link/asset hỏng: ${brokenLinks} | ảnh: ${imgTotal} (alt rỗng chủ ý: ${imgEmptyAlt}, thiếu alt: ${imgNoAlt})`);
for (const r of sizeRows) console.log(`${r.f.padEnd(22)} ${(r.raw0 / 1024).toFixed(1)} → ${(r.raw1 / 1024).toFixed(1)} KB | gzip ${(r.gz0 / 1024).toFixed(2)} → ${(r.gz1 / 1024).toFixed(2)} KB`);
for (const i of infos) console.log(i);
if (errors.length) { console.error(`\n❌ ${errors.length} lỗi:\n  ` + errors.slice(0, 60).join('\n  ') + (errors.length > 60 ? `\n  … và ${errors.length - 60} lỗi nữa` : '')); process.exit(1); }
console.log('\n✓ Kiểm thử hồi quy: ĐẠT');
