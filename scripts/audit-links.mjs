#!/usr/bin/env node
/* Kiểm kê liên kết nội bộ của các trang bài (Node >= 18, không cần thư viện ngoài).
   node scripts/audit-links.mjs                      → bảng tóm tắt + danh sách trang mồ côi (dùng dist/)
   node scripts/audit-links.mjs --dist /duong/dan    → đọc một thư mục dist khác (vd bản build cũ để so sánh)
   node scripts/audit-links.mjs --csv bao-cao.csv    → ghi toàn bộ bảng ra CSV (URL, title, trạng thái, inbound, outbound)

   Cách đếm (chỉ liên kết biên tập tới /cam-nang/…, không tính thanh menu NAT/footer):
   - inbound_menu    : link từ menu trang chủ.
   - inbound_bai     : link từ thân các bài khác (không tính tự liên kết).
   - inbound_crumb   : link từ breadcrumb của bài con (có từ 2.4.0).
   - outbound_bai    : số bài khác nhau mà thân bài này liên kết tới.
   Mồ côi (orphan) = không có bất kỳ link nào trỏ vào từ trang khác. Trang `archived` không được liên kết là chủ ý. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const DIST = path.resolve(arg('--dist') || path.join(ROOT, 'dist'));
const CSV = arg('--csv');
const articles = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/articles.json'), 'utf8'));
const read = (p) => fs.readFileSync(p, 'utf8');
const slugsIn = (html) => [...html.matchAll(/href="\/cam-nang\/([^"/#?]+)\/?[^"]*"/g)].map((m) => m[1]);

const rows = new Map(articles.map((a) => [a.slug, { url: `/cam-nang/${a.slug}/`, slug: a.slug, title: a.title, status: a.status, menu: 0, bai: 0, crumb: 0, out: new Set() }]));
const home = read(path.join(DIST, 'index.html'));
for (const s of new Set(slugsIn(home))) if (rows.has(s)) rows.get(s).menu = 1;

for (const a of articles) {
  const f = path.join(DIST, 'cam-nang', a.slug, 'index.html');
  if (!fs.existsSync(f)) continue;
  const html = read(f);
  const body = (html.match(/<article id="pBody">([\s\S]*?)<\/article>/) || [, ''])[1];
  const crumb = (body.match(/<nav class="p-crumb"[\s\S]*?<\/nav>/) || [''])[0];
  const text = body.replace(crumb, '');
  for (const s of new Set(slugsIn(text))) if (s !== a.slug && rows.has(s)) { rows.get(s).bai++; rows.get(a.slug).out.add(s); }
  for (const s of new Set(slugsIn(crumb))) if (s !== a.slug && rows.has(s)) rows.get(s).crumb++;
}

const list = [...rows.values()].map((r) => ({ ...r, inbound: r.menu + r.bai + r.crumb, outbound: r.out.size }));
const orphans = list.filter((r) => r.inbound === 0);
const weak = list.filter((r) => r.inbound > 0 && r.bai + r.crumb === 0 && r.status === 'published');
const by = (st) => list.filter((r) => r.status === st);

console.log(`Thư mục: ${DIST}`);
for (const st of ['published', 'stub', 'archived']) {
  const l = by(st);
  console.log(`${st.padEnd(10)} ${String(l.length).padStart(3)} trang | mồ côi ${l.filter((r) => r.inbound === 0).length} | chỉ có link từ menu trang chủ ${l.filter((r) => r.inbound > 0 && r.bai + r.crumb === 0).length} | inbound từ bài/breadcrumb TB ${(l.reduce((t, r) => t + r.bai + r.crumb, 0) / (l.length || 1)).toFixed(2)}`);
}
console.log(`\nTrang MỒ CÔI (${orphans.length}):`);
for (const r of orphans) console.log(`  [${r.status}] ${r.url}  —  ${r.title}`);
console.log(`\nBài published CHỈ có link từ menu trang chủ (${weak.length}) — không mồ côi nhưng thiếu liên kết ngữ cảnh.`);

if (CSV) {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['url', 'title', 'status', 'inbound_total', 'inbound_menu', 'inbound_bai', 'inbound_breadcrumb', 'outbound_bai', 'orphan'];
  const out = [head.join(',')].concat(list.sort((a, b) => a.status.localeCompare(b.status) || a.url.localeCompare(b.url)).map((r) =>
    [r.url, q(r.title), r.status, r.inbound, r.menu, r.bai, r.crumb, r.outbound, r.inbound === 0 ? 'yes' : 'no'].join(',')));
  fs.writeFileSync(CSV, '\ufeff' + out.join('\n') + '\n');
  console.log(`\nĐã ghi ${CSV}`);
}
