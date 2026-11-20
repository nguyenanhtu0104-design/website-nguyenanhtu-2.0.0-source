// Kiểm thử /api/danh-gia không cần mạng: giả lập ASSETS, Resend, Google Sheet, WhatsApp.
// Chạy: node scripts/build.mjs && node tests/danh-gia-api.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { onRequestPost } = await import(path.join(ROOT, 'functions/api/danh-gia.js'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/danh-gia-du-an/khung.json'), 'utf8'));
// Bản chi tiết của Tú giả lập (dữ liệu thật do Tú chấm sau) để kiểm phần so sánh
D.duAn['nam-mekong-grand-plaza'].chuyenGia = { duyet: false, the: { A1: { s: 4, nx: 'a' }, A2: { s: 4, nx: 'b' }, B5: { s: 5, nx: 'c' }, D3: { s: 3, nx: 'd' }, E4: { s: 4.5, nx: 'e' } } };
const K = D.khung, ids = K.the.map((c) => c.id);
const sent = [];
globalThis.fetch = async (u, o = {}) => {
  u = String(u);
  sent.push({ u, body: o.body && o.body.startsWith('{') ? JSON.parse(o.body) : null });
  if (u.includes('callmebot')) return new Response('ok');
  return new Response(JSON.stringify({ ok: true, id: 'x' }), { headers: { 'content-type': 'application/json' } });
};
const ASSETS = { fetch: async (req) => { const p = new URL(req.url).pathname; if (p === '/danh-gia-du-an/khung.json') return new Response(JSON.stringify(D)); const f = path.join(ROOT, p.startsWith('/assets/') ? '' : 'dist', p); return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('', { status: 404 }); } };
const env = { ASSETS, RESEND_API_KEY: 'k', MAIL_FROM: 'Tú <a@b.vn>', NOTIFY_TO: 'tu@b.vn', SHEET_WEBHOOK_URL: 'https://sheet/exec', SHEET_SECRET: 's', WHATSAPP_PHONE: '+84', WHATSAPP_APIKEY: 'k' };
// Khách "Đầu tư": trọng số gợi ý; chấm 4 mọi thẻ, riêng A2 = 2 (điểm chặn), bỏ qua C1 và F6
const w = K.the.map((c) => c.w['dau-tu']);
const s = K.the.map((c) => (c.id === 'A2' ? 2 : c.id === 'C1' || c.id === 'F6' ? null : 4));
const boQua = K.the.map((c) => c.id === 'C1' || c.id === 'F6');
const tk = K.the.map((c) => (c.id === 'C4' ? { c: [1], l: { 1: 'Metro chưa khởi công' }, v: '' } : c.id === 'D6' ? { c: [], l: {}, v: 'Mật độ cao' } : c.id === 'F2' ? { c: [3], l: {}, v: '' } : { c: [], l: {}, v: '' }));
const body = { name: 'Nguyễn Văn A', phone: '0901234567', email: 'a@x.vn', channel: 'email', consent: true, t: 9000, duAn: 'nam-mekong-grand-plaza', hoSo: K.hoSo.map((q) => (q.id === 'muc-dich' ? 1 : q.id === 'ngan-sach' ? 2 : q.kieu === 'nhieu' ? [0, 1] : 0)),
  w, s, boQua, thienKien: tk, xemTu: true, phienBan: K.phienBan, ma: 'eyJkIjoibmFtLW1la29uZyJ9', page: '/danh-gia-du-an/' };
const req = new Request('https://nguyenanhtu.vn/api/danh-gia', { method: 'POST', headers: { origin: 'https://nguyenanhtu.vn', 'content-type': 'application/json' }, body: JSON.stringify(body) });
const j = await (await onRequestPost({ request: req, env })).json();
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
// Tính tay
const idx = (f) => K.the.map((c, i) => (f(c) && s[i] != null ? i : -1)).filter((i) => i >= 0);
const p = (I) => Math.round((I.reduce((a, i) => a + w[i] * s[i], 0) / I.reduce((a, i) => a + w[i] * 5, 0)) * 100);
ok(j.ok && j.emailed, 'phản hồi ok, đã gửi email khách');
const sheet = sent.find((x) => x.u.includes('sheet')).body;
ok(sheet.tong === p(idx(() => true)), `tổng điểm ${p(idx(() => true))}% (máy chủ ${sheet.tong})`);
ok(sheet.o === p(idx((c) => c.role !== 'invest')) && sheet.dt === p(idx((c) => c.role !== 'live')), `ở thực ${sheet.o}%, đầu tư ${sheet.dt}% khớp tính tay`);
ok(sheet.tang[0] === p(idx((c) => c.tang === 'logic')) && sheet.tang[1] === p(idx((c) => c.tang === 'niem-tin')) && sheet.tang[2] === p(idx((c) => c.tang === 'phu-hop')), `ba tầng ${sheet.tang.join(' / ')} khớp tính tay`);
const avg = (t) => Math.round((K.the.filter((c) => c.tang === t).reduce((a, c) => a + c.w['dau-tu'], 0) / K.the.filter((c) => c.tang === t).length) * 10) / 10;
ok(sheet.wtb[0] === avg('logic') && sheet.wtb[1] === avg('niem-tin') && sheet.wtb[2] === avg('phu-hop'), `quan trọng trung bình mỗi thẻ ${sheet.wtb.join(' / ')} (không cộng dồn)`);
ok(sheet.daCham === K.the.length - 2 && sheet.boQua === 'C1, F6', `đếm ${K.the.length - 2} thẻ chấm, bỏ qua C1, F6`);
ok(sheet.chan === 'A2', 'A2 pháp lý 2 điểm → điểm chặn (chỉ nội bộ)');
ok(sheet.hsMucDich === 'Đầu tư' && sheet.hsNganSach === '5–10 tỷ' && /Cách khai thác: Cho thuê dài hạn/.test(sheet.hsChiTiet) && !/Số người ở|Mức sống/.test(sheet.hsChiTiet), 'hồ sơ theo nhu cầu Đầu tư: có câu khai thác, không có câu về nhân khẩu');
ok(sheet.ghiChu.includes('C4. Còn nghi ngờ — Metro chưa khởi công') && sheet.ghiChu.includes('D6. Mật độ cao') && sheet.ghiChu.includes('F2. Thanh toán sớm 70%'), 'nhận định của khách (ô chọn + lý do, viết tự do, lựa chọn theo dự án) vào CRM');
ok(sheet.tuTong !== '' && sheet.banTong !== '', `so với Tú trên cùng thẻ: khách ${sheet.banTong}% · Tú ${sheet.tuTong}%`);
const mails = sent.filter((x) => x.u.includes('resend'));
ok(mails.length === 4 && mails.filter((m) => m.body.scheduled_at).length === 2, '4 email, 2 hẹn giờ (ngày 3 khách, ngày 7 Tú)');
const kh = mails.find((m) => m.body.to[0] === 'a@x.vn' && !m.body.scheduled_at).body.html;
ok(kh.includes('Mở lại bản đánh giá') && /Logic/.test(kh) && kh.includes(K.tang.logic.yNghia), 'email khách có ba màu kèm giải nghĩa (như màn tổng kết)');
ok(!/Điểm chặn|điểm chặn|Coi trọng nhất|Nội bộ|Có điểm chặn/.test(kh), 'email khách KHÔNG có kết luận hay insight nội bộ');
const tu = mails.find((m) => m.body.to[0] === 'tu@b.vn' && !m.body.scheduled_at).body.html;
ok(/Kế hoạch chăm sóc/.test(tu) && /điểm chặn/.test(tu) && /Cách khai thác/.test(tu) && !/Số người ở/.test(tu), 'email báo Tú có hồ sơ, insight, kế hoạch chăm sóc');
ok(sent.some((x) => x.u.includes('callmebot')), 'báo WhatsApp');
const few = await onRequestPost({ request: new Request(req.url, { method: 'POST', headers: { origin: 'https://nguyenanhtu.vn' }, body: JSON.stringify({ ...body, s: s.map((x, i) => (i < 10 ? x : null)) }) }), env });
ok(few.status === 400, `chấm dưới ${K.nguong.moTu} thẻ → 400`);
fs.writeFileSync('/tmp/dg-mail-khach.html', kh); fs.writeFileSync('/tmp/dg-mail-tu.html', tu);
console.log(fail ? `\n✗ ${fail} lỗi` : '\n✓ API đánh giá: ĐẠT'); process.exit(fail ? 1 : 0);
