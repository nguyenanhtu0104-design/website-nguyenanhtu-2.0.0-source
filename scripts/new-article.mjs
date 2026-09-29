#!/usr/bin/env node
/* Tạo bài mới: slug + metadata + file nội dung khung + (tuỳ chọn) gắn vào menu.
   node scripts/new-article.mjs --title "Tên bài" --category du-an-chon-loc [tuỳ chọn]
     --slug ten-bai          (mặc định: tự tạo từ title, không dấu)
     --subtitle "..."        dòng phụ hiển thị trong menu/tìm kiếm
     --icon "🏢"             emoji đứng trước tiêu đề trong menu
     --parent slug-vung      bài cha (vd dự án thuộc vùng)
     --nav                   gắn vào menu trang chủ (chương category; với dự án: thành chip dưới --parent)
     --star                  đánh dấu ⭐ tác giả đề xuất (chip/vùng)
     --status published|stub (mặc định published)
     --section "🏛️ Dự Án Chọn Lọc"  --accent "#b05040"   (mặc định theo chương) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i++) if (av[i].startsWith('--')) { const k = av[i].slice(2); const v = av[i + 1] && !av[i + 1].startsWith('--') ? av[++i] : true; args[k] = v; }
if (!args.title || !args.category) { console.error('Cần --title và --category. Xem đầu file để biết tuỳ chọn.'); process.exit(1); }
const slugify = (s) => s.replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-[^-]*$/, (m) => (m.length < 3 ? '' : m));
const artsPath = path.join(ROOT, 'data/articles.json'), catsPath = path.join(ROOT, 'data/categories.json');
const arts = JSON.parse(fs.readFileSync(artsPath, 'utf8')), cats = JSON.parse(fs.readFileSync(catsPath, 'utf8'));
const cat = cats.find((c) => c.id === args.category);
if (!cat) { console.error('category phải là một trong: ' + cats.map((c) => c.id).join(', ')); process.exit(1); }
const slug = args.slug || slugify(args.title);
if (arts.some((a) => a.slug === slug)) { console.error(`slug "${slug}" đã tồn tại — dùng --slug khác`); process.exit(1); }
if (args.parent && !arts.some((a) => a.slug === args.parent)) { console.error(`parent "${args.parent}" không tồn tại`); process.exit(1); }
const DEF = { 'phap-luat': ['⚖️ Pháp Luật & Quy Định', '#5280c8'], 'chien-luoc-quy-hoach': ['🗺️ Chiến Lược & Quy Hoạch', '#4aaa7f'],
  'tu-duy-dau-tu': ['💡 Tư Duy Chiến Lược', '#c89540'], 'du-an-chon-loc': ['🏛️ Dự Án Chọn Lọc', '#b05040'], 'nha-phat-trien': ['🏗️ Giá Trị Cốt Lõi CĐT', '#9b72cf'] };
const [section, accent] = [args.section || DEF[cat.id][0], args.accent || DEF[cat.id][1]];
const today = new Date().toISOString().slice(0, 10);
const a = {
  id: slug.replace(/-/g, '_'), slug, status: args.status || 'published', title: args.title, subtitle: args.subtitle || '', icon: args.icon || '',
  category: cat.id, parent: args.parent || null, tags: [cat.id, ...(args.parent ? [args.parent] : [])],
  description: 'MÔ TẢ 1–2 CÂU (≤ 160 ký tự) — hiện khi chia sẻ Facebook/Zalo và trên Google.',
  thumbnail: null, heroImage: null, publishedDate: today, updatedDate: today, author: 'nguyen-anh-tu',
  content: `content/articles/${slug}.html`, relatedArticles: args.parent ? [args.parent] : [], seoTitle: args.title,
  seoDescription: 'MÔ TẢ 1–2 CÂU (≤ 160 ký tự) — hiện khi chia sẻ Facebook/Zalo và trên Google.', ogImage: `assets/images/og/${slug}.jpg`,
  section, accent, searchKeywords: '', legacy: null,
};
arts.push(a);
const project = cat.id === 'du-an-chon-loc' && args.parent;
const body = project ? `<h1 class="p-h1">${args.title}<br><em style="font-size:.58em;color:${accent}">— DÒNG PROLOGUE</em></h1>
<!-- KHUNG CHUẨN 5 PHẦN — xem PROJECT_RULES.md §8 -->
<p class="p-lead">1. Lời giới thiệu / Prologue.</p>
<p class="p-h2">📍 Tổng Quan Dự Án</p>
<p class="p-p">2. Vị trí · Quy mô · Nhà phát triển · Giai đoạn triển khai.</p>
<p class="p-h2">🏗️ Chi Tiết Dự Án</p>
<p class="p-p">3. Phối cảnh · Tiện ích · Loại hình sản phẩm · Chính sách nổi bật.</p>
<p class="p-h2">🎯 Vì Sao Tôi Chọn ${args.title}</p>
<p class="p-p">4. Dành cho cư dân · Dành cho nhà đầu tư.</p>
<p class="p-h2">📊 SWOT &amp; Thang Điểm 1–5</p>
<p class="p-p">5. SWOT + chấm điểm.</p>
` : `<h1 class="p-h1">${args.title}<br><em style="font-size:.52em;color:${accent};font-style:italic;font-weight:500">— PHỤ ĐỀ</em></h1>
<p class="p-lead">Đoạn dẫn.</p>
<p class="p-h2">Tiêu đề mục</p>
<p class="p-p">Nội dung.</p>
`;
fs.writeFileSync(path.join(ROOT, a.content), body);
if (args.nav) {
  if (cat.layout === 'zones' && args.parent) {
    const zone = cat.items.find((i) => i.article === args.parent);
    if (!zone) { console.error(`--nav: vùng "${args.parent}" không có trong menu chương ${cat.ch}`); process.exit(1); }
    (zone.projects ||= []).push({ article: slug, ...(args.star ? { star: true } : {}) });
  } else {
    const it = { article: slug }; if (args.star) it.star = true;
    if (cat.layout === 'zones') it.num = String(cat.items.length + 1).padStart(2, '0');
    cat.items.push(it);
  }
  fs.writeFileSync(catsPath, JSON.stringify(cats, null, 1));
}
fs.writeFileSync(artsPath, JSON.stringify(arts, null, 1));
console.log(`✓ Đã tạo bài: /cam-nang/${slug}/
  • Nội dung:  ${a.content}
  • Metadata:  data/articles.json (sửa description, seoDescription, searchKeywords)
  • Ảnh:       python3 scripts/images.py add ${slug} anh1.jpg anh2.jpg
  • Ảnh OG:    python3 scripts/images.py og ${slug}
  • Build:     node scripts/build.mjs`);
