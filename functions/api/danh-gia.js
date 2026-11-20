// Cloudflare Pages Function: POST /api/danh-gia
// Nhận bản tự đánh giá dự án (9 thẻ), tính lại điểm phía máy chủ, gửi báo cáo cho khách,
// báo Tú kèm insight và kế hoạch chăm sóc, ghi CRM (Google Sheet). PROJECT_RULES §18.
// Dùng lại biến môi trường của /api/lead: RESEND_API_KEY, MAIL_FROM, NOTIFY_TO, SHEET_WEBHOOK_URL,
// SHEET_SECRET, WHATSAPP_PHONE, WHATSAPP_APIKEY, SITE_URL. Không cần biến mới.
// Công thức tính phải khớp assets/js/danh-gia.js (tests/danh-gia-api.mjs kiểm).

const TANG = ['logic', 'niem-tin', 'phu-hop'];
const MAU = { 'phu-hop': '#10B981', 'niem-tin': '#F59E0B', logic: '#1E40AF' };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const r0 = (x) => (x == null || isNaN(x) ? null : Math.round(x));
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function normPhone(v) {
  let d = String(v || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+84')) d = '0' + d.slice(3);
  else if (d.startsWith('84') && d.length === 11) d = '0' + d.slice(2);
  return d;
}
function allowedOrigin(origin, siteUrl, requestUrl) {
  try {
    const site = new URL(siteUrl);
    return new Set([site.origin, `${site.protocol}//www.${site.host.replace(/^www\./, '')}`, new URL(requestUrl).origin]).has(origin);
  } catch { return false; }
}
async function loadJson(env, request, p) {
  const url = new URL(p, request.url);
  const res = env.ASSETS ? await env.ASSETS.fetch(new Request(url)) : await fetch(url);
  if (!res.ok) throw new Error(p + ' not found');
  return res.json();
}

// ---------- tính điểm: cùng công thức với trang ----------
// ---------- tính điểm: cùng công thức với trang ----------
// s: mảng điểm (null = chưa chấm hoặc bỏ qua); loc: lọc thẻ
function tinhTap(K, w, s, loc) {
  let a = 0, b = 0, done = 0;
  K.the.forEach((c, i) => { if (s[i] == null || (loc && !loc(c, i))) return; done++; a += w[i] * s[i]; b += w[i] * 5; });
  return { done, pct: b ? (a / b) * 100 : null };
}
function tongHop(K, w, s) {
  const r = { tong: tinhTap(K, w, s), o: tinhTap(K, w, s, (c) => c.role !== 'invest'), dt: tinhTap(K, w, s, (c) => c.role !== 'live'), tang: {} };
  for (const t of TANG) {
    let ws = 0, n = 0; K.the.forEach((c, i) => { if (c.tang === t) { ws += w[i]; n++; } });
    r.tang[t] = { pct: tinhTap(K, w, s, (c) => c.tang === t).pct, wtb: n ? ws / n : 0 };
  }
  return r;
}
function tinh(K, input, cg) {
  const r = tongHop(K, input.w, input.s);
  // Insight nội bộ cho Tú: tầng trội / điểm mù theo mức quan trọng TRUNG BÌNH mỗi thẻ (không cộng dồn)
  const vals = TANG.map((t) => r.tang[t].wtb), mx = Math.max(...vals), mn = Math.min(...vals), cb = mx - mn < 0.001;
  r.troi = cb ? [] : TANG.filter((t) => r.tang[t].wtb === mx);
  r.mu = cb ? [] : TANG.filter((t) => r.tang[t].wtb === mn);
  r.chan = []; K.the.forEach((c, i) => { const s = input.s[i]; if (s != null && s <= 2 && (input.w[i] === 3 || c.chanCung)) r.chan.push(i); });
  r.boQua = K.the.map((c, i) => (input.bq[i] ? i : -1)).filter((i) => i >= 0);
  if (cg) {
    const ts = K.the.map((c) => (cg.the[c.id] ? cg.the[c.id].s : null));
    const both = ts.map((x, i) => x != null && input.s[i] != null);
    r.ts = ts;
    r.cg = K.the.map((c, i) => (ts[i] != null ? { e: ts[i], d: input.s[i] != null ? input.s[i] - ts[i] : null, nx: cg.the[c.id].nx } : null));
    // Đặt Tú vào trường hợp của khách: điểm của Tú × trọng số của khách, trên các thẻ cả hai cùng chấm
    r.tu = tongHop(K, input.w, ts.map((x, i) => (both[i] ? x : null)));
    r.ban = tongHop(K, input.w, input.s.map((x, i) => (both[i] ? x : null)));
  }
  const t = r.tong.pct;
  r.muc = r.chan.length ? 'Có điểm chặn' : t >= 75 ? 'Đáp ứng tốt' : t >= 60 ? 'Đáp ứng khá' : 'Đáp ứng thấp';
  return r;
}

function luaChonCua(c, pd) { const pc = pd && pd.the && pd.the[c.id]; return c.thienKien.theoDuAn && pc && Array.isArray(pc.luaChon) && pc.luaChon.length ? pc.luaChon : c.thienKien.luaChon || []; }
function cleanInput(b, K, pd) {
  const N = K.the.length;
  if (!Array.isArray(b.w) || !Array.isArray(b.s) || b.w.length !== N || b.s.length !== N) return null;
  const w = b.w.map((x) => Math.max(1, Math.min(3, Math.round(Number(x)) || 2)));
  const s = b.s.map((x) => { x = Math.round(Number(x)); return x >= 1 && x <= 5 ? x : null; });
  const bq = K.the.map((c, i) => s[i] == null && Array.isArray(b.boQua) && b.boQua[i] === true);
  const tkIn = Array.isArray(b.thienKien) ? b.thienKien : [];
  const tk = K.the.map((c, i) => {
    const x = tkIn[i] || {}, opts = luaChonCua(c, pd);
    let ch = (Array.isArray(x.c) ? x.c : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < opts.length);
    ch = [...new Set(ch)]; if (c.thienKien.kieu === 'mot') ch = ch.slice(0, 1);
    const l = {}; for (const n of ch) { const v = clip(x.l && x.l[n], 300); if (v) l[n] = v; }
    return { c: ch, l, v: clip(x.v, 800) };
  });
  const hin = Array.isArray(b.hoSo) ? b.hoSo : [];
  const hs = K.hoSo.map((q, i) => {
    const ok = (n) => Number.isInteger(n) && n >= 0 && n < q.luaChon.length;
    if (q.kieu === 'nhieu') return [...new Set((Array.isArray(hin[i]) ? hin[i] : []).map(Number).filter(ok))].slice(0, q.toiDa || q.luaChon.length);
    const v = Number(hin[i]); return ok(v) ? v : null;
  });
  return { w, s, bq, tk, hs };
}
// Nhận định của khách ở một thẻ, dạng chữ
function tkText(c, tk, pd) {
  if (!tk) return '';
  const opts = luaChonCua(c, pd);
  if (c.thienKien.kieu === 'viet' || !opts.length) return tk.v;
  return tk.c.map((n) => opts[n] + (tk.l[n] ? ` — ${tk.l[n]}` : '')).join('; ');
}

// ---------- insight & kế hoạch chăm sóc (chỉ cho Tú) ----------
function insight(K, input, r, ctx) {
  const ten = (t) => K.tang[t].ten;
  const the = (i) => `${K.the[i].id} · ${K.the[i].ten}`;
  const uuTien = K.the.map((c, i) => (input.w[i] === 3 ? c.id : '')).filter(Boolean);
  const lac = [], than = [];
  if (r.cg) r.cg.forEach((x, i) => { if (x && x.d != null && Math.abs(x.d) >= K.nguong.lechChuyenGia) (x.d > 0 ? lac : than).push(`${K.the[i].id} (${input.s[i]} so với ${x.e})`); });
  const nhuCau = r.o.pct != null && r.dt.pct != null ? (Math.abs(r.o.pct - r.dt.pct) < 8 ? 'Cân bằng ở – đầu tư' : r.o.pct > r.dt.pct ? 'Thiên về ở thực' : 'Thiên về đầu tư') : '';
  const plan = [];
  plan.push(ctx.temp === 'Nóng' || r.chan.length ? 'Liên hệ trong 24 giờ.' : 'Liên hệ trong 48 giờ.');
  if (r.troi.length) plan.push(`Cách trao đổi (khách coi trọng nhất tầng ${r.troi.map(ten).join(', ')}): ${r.troi.map((t) => K.tang[t].giaoTiep).join(' ')}`);
  if (r.chan.length) plan.push(`Giải đáp trước tiên điểm chặn: ${r.chan.map(the).join('; ')}.`);
  if (r.mu.length) plan.push(`Bổ trợ tầng khách coi nhẹ nhất (${r.mu.map(ten).join(', ')}): ${r.mu.map((t) => K.tang[t].boTro).join(' ')}`);
  if (r.boQua.length) plan.push(`Khách bỏ qua vì chưa đủ dữ kiện: ${r.boQua.map((i) => K.the[i].id).join(', ')} — gửi dữ kiện cho các thẻ này.`);
  if (lac.length) plan.push(`Khách lạc quan hơn Tú ở ${lac.join('; ')}: đưa dữ kiện cân bằng.`);
  if (than.length) plan.push(`Khách thận trọng hơn Tú ở ${than.join('; ')}: đưa bằng chứng cụ thể.`);
  if (ctx.cheDoDk && ctx.cheDoDk !== 'Hiện dữ kiện') plan.push(`Khách chấm khi ${ctx.cheDoDk.toLowerCase()}: điểm phản ánh hiểu biết sẵn có của khách — gửi bộ dữ kiện dự án để khách đối chiếu.`);
  if (ctx.channel === 'email') plan.push('Ngày 3: hệ thống tự gửi email tài liệu kiểm chứng thêm.');
  plan.push('Ngày 7: hệ thống nhắc Tú gọi lại.');
  if (ctx.related.length) plan.push(`Ngày 14: giới thiệu dự án tương tự: ${ctx.related.map((x) => x.p.name).join(', ')}.`);
  return { uuTien, lac, than, nhuCau, plan };
}
function tuongTu(D, slug) {
  const ds = {};
  for (const [k, p] of Object.entries(D.duAn || {})) ds[k] = { ten: p.ten, khuVuc: p.khuVuc || (D.duAnBan && D.duAnBan[k] && D.duAnBan[k].khuVuc) || '', cg: !!(p.chuyenGia && (p.chuyenGia.duyet || !D.congBo) && p.chuyenGia.the && Object.keys(p.chuyenGia.the).length) };
  for (const [k, p] of Object.entries(D.duAnBan || {})) if (!ds[k]) ds[k] = { ten: p.ten, khuVuc: p.khuVuc || '', cg: false };
  const mine = ds[slug] || {};
  const sc = (k) => (ds[k].khuVuc && ds[k].khuVuc === mine.khuVuc ? 2 : 0) + (ds[k].cg ? 1 : 0);
  return Object.keys(ds).filter((k) => k !== slug).sort((a, b) => sc(b) - sc(a)).slice(0, 3).map((k) => ({ slug: k, p: { name: ds[k].ten, khuVuc: ds[k].khuVuc, cg: ds[k].cg } }));
}

function withUtm(u, siteUrl, params) {
  try {
    const url = new URL(u, siteUrl);
    const own = url.host.replace(/^www\./, '') === new URL(siteUrl).host.replace(/^www\./, '');
    for (const [k, v] of Object.entries(params)) { if (v && (k !== 'lid' || own)) url.searchParams.set(k, v); }
    return url.toString();
  } catch { return u; }
}

// Bài đọc bổ trợ theo điểm mù (link chỉ lấy trong site)
function boTroLinks(mu, ctx) {
  const L = [];
  const lp = ctx.leadProject || {};
  const add = (title, url) => { if (url && !L.some((x) => x.url === url)) L.push({ title, url }); };
  for (const t of mu) {
    if (t === 'logic') { if (lp.docs && lp.docs['bang-tinh']) add('Bảng tính thanh toán ' + ctx.ten, lp.docs['bang-tinh'].url); add('Bản tính tài chính · vay ngân hàng, dòng tiền', '/ban-tinh-tai-chinh/'); }
    if (t === 'niem-tin') { if (lp.areaArticle && lp.areaArticle.url) add(lp.areaArticle.title || 'Bài phân tích khu vực', lp.areaArticle.url); add('Bản đồ dự án và metro TP.HCM', '/assets/tools/ban-do-du-an-hcm/'); }
    if (t === 'phu-hop') { if (lp.url) add('Hồ sơ dự án ' + ctx.ten, lp.url); }
  }
  add('22 nguyên tắc tư duy đầu tư bất động sản', '/cam-nang/22-nguyen-tac-tu-duy-dau-tu-bds/');
  return L.slice(0, 4);
}

// ---------- email ----------
const pct = (x) => (x == null ? '–' : r0(x) + '%');
const vn = (x) => String(x).replace('.', ',');
const hsOne = (q, v) => (Array.isArray(v) ? v.map((n) => q.luaChon[n]).join(', ') : v != null ? q.luaChon[v] : '');
// Bản đánh giá: phần khách thấy (điểm, ba biểu đồ màu có giải nghĩa, bảng từng thẻ, bản của Tú). noiBo = thêm insight cho Tú.
function reportHtml(K, input, r, ctx, noiBo) {
  const bar = (v, color) => `<div style="background:#eef1f3;border-radius:3px;height:10px"><div style="background:${color};height:10px;border-radius:3px;width:${Math.max(0, v || 0)}%"></div></div>`;
  const block = (t) => {
    const rows = K.the.map((c, i) => {
      if (c.tang !== t) return '';
      const x = r.cg && r.cg[i], note = tkText(c, input.tk[i], ctx.pd);
      return `<tr style="border-bottom:1px solid #e3e7ea"><td style="padding:6px 4px;vertical-align:top"><b>${c.id}</b> ${esc(c.ten)}${note ? `<div style="color:#5b6770;font-size:13px">${esc(note)}</div>` : ''}</td><td style="text-align:center;vertical-align:top">x${input.w[i]}</td><td style="text-align:center;vertical-align:top;font-weight:700">${input.s[i] ?? (input.bq[i] ? '<span style="font-weight:400;color:#5b6770">bỏ qua</span>' : '–')}</td>${r.cg ? `<td style="text-align:center;vertical-align:top;color:#5b6770">${x ? vn(x.e) : '–'}</td>` : ''}</tr>`;
    }).join('');
    return `<div style="border-left:4px solid ${MAU[t]};padding:4px 0 4px 12px;margin:16px 0">
<p style="margin:0"><b>${esc(K.tang[t].ten)}</b> — <span style="color:#5b6770">${esc(K.tang[t].yNghia)}</span></p>
<table cellpadding="0" style="width:100%;margin:6px 0"><tr><td style="width:120px;font-size:13px">Mức hài lòng</td><td>${bar(r.tang[t].pct, MAU[t])}</td><td style="width:56px;text-align:right;font-weight:700">${pct(r.tang[t].pct)}</td></tr>${r.tu ? `<tr><td style="font-size:13px">Của Tú</td><td>${bar(r.tu.tang[t].pct, '#9aa5ad')}</td><td style="text-align:right">${pct(r.tu.tang[t].pct)}</td></tr>` : ''}</table>
<p style="margin:0 0 6px;font-size:13px;color:#5b6770">Mức quan trọng trung bình x${vn(Math.round(r.tang[t].wtb * 10) / 10)}</p>
<table cellpadding="0" style="border-collapse:collapse;width:100%;font-size:14px"><tr style="color:#5b6770;font-size:12px"><td style="padding:4px">Thẻ · nhận định của bạn</td><td style="text-align:center">Trọng số</td><td style="text-align:center">Bạn</td>${r.cg ? '<td style="text-align:center">Tú</td>' : ''}</tr>${rows}</table></div>`;
  };
  return `<p style="margin:16px 0 4px;font-size:13px;color:#5b6770;letter-spacing:.06em">MỨC DỰ ÁN ĐÁP ỨNG NHỮNG ĐIỀU BẠN COI TRỌNG</p>
<p style="margin:0;font-size:40px;font-weight:700;color:#1f2933">${pct(r.tong.pct)}</p>
<p style="margin:2px 0 4px">Ở thực ${pct(r.o.pct)} · Đầu tư ${pct(r.dt.pct)} · ${r.tong.done} thẻ đã chấm${r.boQua.length ? ` · ${r.boQua.length} thẻ bỏ qua` : ''}</p>
${r.tu ? `<p style="margin:0 0 4px">Trên ${r.ban.tong.done} thẻ cả hai cùng chấm: bạn <b>${pct(r.ban.tong.pct)}</b> · Tú (đặt vào trường hợp của bạn) <b>${pct(r.tu.tong.pct)}</b></p>` : ''}
${noiBo ? `<div style="background:#f4f6f7;padding:8px 12px;margin:10px 0;font-size:14px"><b>Nội bộ:</b> ${esc(r.muc)} · coi trọng nhất: ${esc(r.troi.map((t) => K.tang[t].ten).join(', ') || 'cân bằng')} · coi nhẹ nhất: ${esc(r.mu.map((t) => K.tang[t].ten).join(', ') || '–')}${r.chan.length ? ` · <b style="color:#b0382a">điểm chặn: ${esc(r.chan.map((i) => K.the[i].id).join(', '))}</b>` : ''}</div>` : ''}
<p style="margin:14px 0 0;color:#5b6770;font-size:14px">${esc(K.yNghiaMau)}</p>
${TANG.map(block).join('')}`;
}
const sign = (siteUrl) => `<p style="margin:18px 0 0">Trân trọng,<br><b>Nguyễn Anh Tú</b><br>Project Director | ERA Vietnam<br><a href="${esc(siteUrl)}" style="color:#0b5d56">nguyenanhtu.vn</a> · YouTube @nguyenanhtu.kienphat</p>`;
const wrap = (inner) => `<!doctype html><html lang="vi"><body style="margin:0;background:#f4f6f7"><div style="max-width:620px;margin:0 auto;background:#fff;padding:28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2933">${inner}</div></body></html>`;

function customerEmail(K, input, r, ctx) {
  const subject = `[${ctx.ten}] Bản tự đánh giá dự án của bạn – Nguyễn Anh Tú`;
  const html = wrap(`<p style="margin:0 0 14px"><b>Kính chào ${esc(ctx.name)},</b></p>
<p>Mình là <b>Nguyễn Anh Tú</b>, Project Director tại ERA Vietnam, hơn 10 năm làm việc và phân tích thị trường bất động sản Đông Nam Bộ.</p>
<p>Cảm ơn bạn đã dành thời gian tự đánh giá <b>${esc(ctx.ten)}</b>. Đây là bản đánh giá của bạn${r.cg ? ', kèm bản đánh giá của mình đặt vào đúng hoàn cảnh của bạn để bạn so sánh' : ''}:</p>
${reportHtml(K, input, r, ctx, false)}
${ctx.related.length ? `<p style="margin:18px 0 6px;font-weight:700">Dự án tương tự để bạn tự đánh giá thêm</p><ul style="margin:0;padding-left:18px">${ctx.related.map((x) => `<li style="margin:0 0 6px"><a href="${esc(withUtm('/danh-gia-du-an/?du-an=' + x.slug, ctx.siteUrl, { utm_source: 'email', utm_medium: 'danh-gia', utm_content: 'tuong-tu' }))}" style="color:#0b5d56">${esc(x.p.name)}</a>${x.p.khuVuc ? ` <span style="color:#5b6770;font-size:13px">· ${esc(x.p.khuVuc)}</span>` : ''}${x.p.cg ? ' <span style="color:#5b6770;font-size:13px">· có bản đánh giá của Tú</span>' : ''}</li>`).join('')}</ul>` : ''}
<p style="margin:20px 0"><a href="${esc(ctx.reopen)}" style="display:inline-block;background:#0b5d56;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:4px">Mở lại bản đánh giá của bạn</a></p>
<p>Nếu bạn muốn trao đổi về những thẻ hai chúng ta chấm khác nhau, hoặc cần dữ kiện cho các thẻ bạn còn bỏ qua, cứ nhắn Zalo <b>${esc(ctx.zalo)}</b> nhé.</p>
${sign(ctx.siteUrl)}
<p style="margin:22px 0 0;font-size:12px;color:#6b7680">${esc(K.tuChoi)}<br>Không muốn nhận thêm thông tin? Bạn chỉ cần trả lời email này.</p>`);
  const text = [`Kính chào ${ctx.name},`, '', `Bản tự đánh giá ${ctx.ten}: ${pct(r.tong.pct)}. Ở thực ${pct(r.o.pct)}, đầu tư ${pct(r.dt.pct)}.${r.tu ? ` Trên các thẻ cùng chấm: bạn ${pct(r.ban.tong.pct)}, Tú ${pct(r.tu.tong.pct)}.` : ''}`,
    ...TANG.map((t) => `${K.tang[t].ten}: ${pct(r.tang[t].pct)} — ${K.tang[t].yNghia}`),
    '', ...K.the.map((c, i) => `${c.id} ${c.ten}: x${input.w[i]} · ${input.s[i] ?? (input.bq[i] ? 'bỏ qua' : '–')}${r.cg && r.cg[i] ? ` (Tú ${r.cg[i].e})` : ''}`),
    '', `Mở lại bản đánh giá: ${ctx.reopen}`, '', 'Nguyễn Anh Tú | Project Director | ERA Vietnam', K.tuChoi].join('\n');
  return { subject, html, text };
}

function followupEmail(K, r, ctx, links) {
  const subject = `${ctx.name}, vài tài liệu để kiểm chứng thêm ${ctx.ten}`;
  const html = wrap(`<p style="margin:0 0 14px"><b>Chào ${esc(ctx.name)},</b></p>
<p>Ba hôm trước bạn tự đánh giá ${esc(ctx.ten)}. Mình gửi thêm vài tài liệu để bạn kiểm chứng tiếp những câu hỏi còn để ngỏ:</p>
<ul style="padding-left:18px">${links.map((l) => `<li style="margin:0 0 8px"><a href="${esc(l.url)}" style="color:#0b5d56">${esc(l.title)}</a></li>`).join('')}</ul>
<p><a href="${esc(ctx.reopen)}" style="color:#0b5d56">Mở lại bản đánh giá của bạn</a> để chấm lại sau khi đọc.</p>
${sign(ctx.siteUrl)}<p style="margin:22px 0 0;font-size:12px;color:#6b7680">Không muốn nhận thêm thông tin? Bạn chỉ cần trả lời email này.</p>`);
  const text = [`Chào ${ctx.name},`, '', ...links.map((l) => `- ${l.title}: ${l.url}`), '', `Mở lại bản đánh giá: ${ctx.reopen}`, '', 'Nguyễn Anh Tú'].join('\n');
  return { subject, html, text };
}

function notifyEmail(K, input, r, ctx, ins, custOk) {
  const rows = [
    ['Mã', ctx.id], ['Tên', ctx.name], ['Zalo/SĐT', ctx.phone], ['Email', ctx.email || '(không có)'], ['Kênh nhận', ctx.channel === 'email' ? 'Email' : 'Zalo'],
    ['Dự án', ctx.ten + (ctx.duAn ? '' : ' (tự nhập)')],
    ...K.hoSo.map((q, i) => [q, i]).filter(([q]) => q.dau || (q.apDung || []).includes(ctx.gid)).map(([q, i]) => [q.nhan || q.hoi, hsOne(q, input.hs[i]) || '–']),
    ['Điểm quan tâm', `${ctx.score} (${ctx.temp})`],
    ['Tổng điểm', `${pct(r.tong.pct)} · Ở ${pct(r.o.pct)} · Đầu tư ${pct(r.dt.pct)} · ${r.tong.done} thẻ chấm, ${r.boQua.length} bỏ qua`],
    ['Ba tầng (hài lòng · quan trọng TB)', TANG.map((t) => `${K.tang[t].ten} ${pct(r.tang[t].pct)} · x${vn(Math.round(r.tang[t].wtb * 10) / 10)}`).join(' | ')],
    ['Coi trọng nhất', r.troi.map((t) => K.tang[t].ten).join(', ') || 'Cân bằng'],
    ['Coi nhẹ nhất', r.mu.map((t) => K.tang[t].ten).join(', ') || '–'],
    ['Điểm chặn', r.chan.map((i) => `${K.the[i].id} · ${K.the[i].ten}`).join('; ') || 'không'],
    ['Thẻ x3', ins.uuTien.join(', ') || '–'],
    ['Nhu cầu theo điểm', ins.nhuCau || '–'],
    ...(r.tu ? [['So với Tú (cùng thẻ)', `Khách ${pct(r.ban.tong.pct)} · Tú ${pct(r.tu.tong.pct)}`], ['Lệch Tú', [ins.lac.length ? 'Lạc quan hơn: ' + ins.lac.join('; ') : '', ins.than.length ? 'Thận trọng hơn: ' + ins.than.join('; ') : ''].filter(Boolean).join(' | ') || 'khớp']] : []),
    ['Đã mở bản của Tú', ctx.xemTu ? 'Có' : 'Chưa'],
    ['Dữ kiện tham khảo', ctx.cheDoDk],
  ];
  const zaloMsg = `Chào ${ctx.name}, mình là Tú (ERA Vietnam). Mình gửi bạn bản tự đánh giá ${ctx.ten}: ${ctx.reopen}`;
  const action = ctx.channel === 'email' ? (custOk ? 'Bản đánh giá đã tự gửi email cho khách.' : 'EMAIL TỰ ĐỘNG LỖI — gửi qua Zalo.') : 'Khách chọn Zalo — gửi link qua Zalo.';
  const subject = `🧭 Đánh giá dự án: ${ctx.name} – ${ctx.ten} – ${pct(r.tong.pct)} (${ctx.temp})`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1f2933;max-width:640px">
<table cellpadding="6" style="border-collapse:collapse;width:100%">${rows.map(([k, v]) => `<tr><td style="color:#5b6770;vertical-align:top">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>
<p style="margin:14px 0 4px"><b>Kế hoạch chăm sóc</b></p><ol style="margin:0;padding-left:20px">${ins.plan.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
<p style="margin:14px 0"><a href="https://zalo.me/${esc(ctx.phone)}" style="background:#0b5d56;color:#fff;text-decoration:none;padding:10px 14px;border-radius:4px;font-weight:700">Mở Zalo của khách</a> <a href="${esc(ctx.reopenOwner)}" style="background:#b8894a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:4px;font-weight:700">Xem bản đánh giá</a></p>
<p><b>Việc cần làm:</b> ${esc(action)}</p>
<p style="margin:14px 0 4px;color:#5b6770">Tin nhắn Zalo gợi ý:</p><div style="background:#f4f6f7;padding:10px 12px;border-radius:4px">${esc(zaloMsg)}</div>
<hr style="border:0;border-top:1px solid #e3e7ea;margin:20px 0">${reportHtml(K, input, r, ctx, true)}</div>`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', 'Kế hoạch chăm sóc:', ...ins.plan.map((p, i) => `${i + 1}. ${p}`), '', `Việc cần làm: ${action}`, `Zalo gợi ý: ${zaloMsg}`].join('\n');
  return { subject, html, text };
}

async function sendMail(env, { to, subject, html, text, replyTo, scheduledAt }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return { ok: false };
  const body = { from: env.MAIL_FROM, to: [to], subject, html, text };
  if (replyTo) body.reply_to = replyTo;
  if (scheduledAt) body.scheduled_at = scheduledAt;
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok };
}
async function sendWhatsApp(env, text) {
  if (!env.WHATSAPP_PHONE || !env.WHATSAPP_APIKEY) return { ok: false };
  const res = await fetch('https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(env.WHATSAPP_PHONE) + '&text=' + encodeURIComponent(text.slice(0, 1500)) + '&apikey=' + encodeURIComponent(env.WHATSAPP_APIKEY));
  return { ok: res.ok };
}
async function appendSheet(env, row) {
  if (!env.SHEET_WEBHOOK_URL) return { ok: false, error: 'sheet_not_configured' };
  const res = await fetch(env.SHEET_WEBHOOK_URL, { method: 'POST', redirect: 'follow', headers: { 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ secret: env.SHEET_SECRET, ...row }) });
  if (!res.ok) return { ok: false };
  try { const j = await res.json(); return { ok: !!j.ok }; } catch { return { ok: false }; }
}
// 9:00 giờ Việt Nam (02:00 UTC) sau n ngày
function at9(n) { const d = new Date(Date.now() + n * 864e5); d.setUTCHours(2, 0, 0, 0); return d.toISOString(); }


export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const siteUrl = env.SITE_URL || 'https://nguyenanhtu.vn';
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigin(origin, siteUrl, request.url)) return json({ ok: false, error: 'origin' }, 403);
  if (b.website || Number(b.t) < 3000) return json({ ok: true, emailed: false }); // chống bot

  const name = clip(b.name, 80), phone = normPhone(b.phone), email = clip(b.email, 120);
  const channel = b.channel === 'zalo' ? 'zalo' : 'email';
  if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
  if (!/^0\d{9}$/.test(phone)) return json({ ok: false, error: 'phone' }, 400);
  if (b.consent !== true) return json({ ok: false, error: 'consent' }, 400);
  if ((channel === 'email' || email) && !validEmail(email)) return json({ ok: false, error: 'email' }, 400);

  let D, lead = {};
  try { D = await loadJson(env, request, '/danh-gia-du-an/khung.json'); } catch { return json({ ok: false, error: 'config' }, 500); }
  try { lead = await loadJson(env, request, '/assets/lead/lead-data.json'); } catch { lead = {}; }
  const K = D.khung;
  if (b.phienBan && b.phienBan !== K.phienBan) return json({ ok: false, error: 'phien_ban' }, 409);
  const pd0 = D.duAn && D.duAn[b.duAn];
  const input = cleanInput(b, K, pd0);
  if (!input) return json({ ok: false, error: 'the' }, 400);
  if (input.s.filter((x) => x != null).length < K.nguong.moTu) return json({ ok: false, error: 'chua_du' }, 400);

  const duAn = D.duAn && D.duAn[b.duAn] ? b.duAn : (D.duAnBan && D.duAnBan[b.duAn] ? b.duAn : '');
  const ten = duAn ? (D.duAn[duAn] || D.duAnBan[duAn]).ten : clip(b.tenDuAn, 80) || 'Dự án chưa nêu tên';
  const cgRaw = duAn && D.duAn[duAn] && D.duAn[duAn].chuyenGia;
  const cg = cgRaw && (cgRaw.duyet || !D.congBo) && cgRaw.the && Object.keys(cgRaw.the).length ? cgRaw : null;
  const r = tinh(K, input, cg);
  const h1 = K.hoSo[0], goal = input.hs[0] != null ? (K.mucTieu || []).find((g) => g.id === h1.nhuCau[input.hs[0]]) : null;

  const notes = input.tk.filter((x) => x.v || x.c.length).length;
  const score = Math.min(100, 30 + Math.round((r.tong.done / K.the.length) * 15) + Math.min(15, Math.round(notes / 2)) + (duAn ? 5 : 0) + (r.tong.pct >= 70 && !r.chan.length ? 10 : 0) + (b.xemTu === true ? 10 : 0));
  const temp = score >= 60 ? 'Nóng' : score >= 30 ? 'Ấm' : 'Mới';
  const id = 'D' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const ma = /^[A-Za-z0-9_-]{10,1200}$/.test(String(b.ma || '')) ? b.ma : '';
  const base = new URL('/danh-gia-du-an/', siteUrl); if (duAn) base.searchParams.set('du-an', duAn);
  const reopen = withUtm(base.toString(), siteUrl, { utm_source: 'email', utm_medium: 'danh-gia', utm_campaign: duAn || 'khac', lid: id }) + (ma ? '#s=' + ma : '');
  const reopenOwner = base.toString() + (ma ? '#s=' + ma : '');
  const leadProject = duAn && lead.projects ? lead.projects[duAn] : null;
  const related = tuongTu(D, duAn);
  const gid = goal ? goal.id : '';
  const apQ = (q) => q.dau || (q.apDung || []).includes(gid);
  const hsTxt = K.hoSo.map((q, i) => (apQ(q) ? hsOne(q, input.hs[i]) : ''));
  const hsBy = (id) => hsTxt[K.hoSo.findIndex((q) => q.id === id)] || '';
  const ctx = { id, name, phone, email, channel, ten, duAn, mucTieu: goal ? goal.nhan : '', budget: hsBy('ngan-sach'), score, temp, reopen, reopenOwner, siteUrl, zalo: (lead.settings && lead.settings.zaloPhone) || '0978618149', leadProject, related, xemTu: b.xemTu === true, pd: pd0, gid };
  const moDk = Array.isArray(b.moDk) ? K.the.map((c, i) => (b.moDk[i] === true ? c.id : '')).filter(Boolean) : [];
  ctx.cheDoDk = b.anDk === true ? `Ẩn dữ kiện${moDk.length ? ` (mở lại ${moDk.length} thẻ: ${moDk.join(', ')})` : ' (không mở thẻ nào)'}` : 'Hiện dữ kiện';
  const ins = insight(K, input, r, ctx);
  const utm = b.utm && typeof b.utm === 'object' ? b.utm : {};

  const tomTat = `${pct(r.tong.pct)} · Ở ${pct(r.o.pct)} / ĐT ${pct(r.dt.pct)} · ${TANG.map((t) => `${K.tang[t].ten} ${pct(r.tang[t].pct)}`).join(' · ')}${r.chan.length ? ' · Chặn: ' + r.chan.map((i) => K.the[i].id).join(', ') : ''}`;
  // Hàng ghi Sheet: các cột cũ của "Tất cả lead" + các trường riêng cho tab "Đánh giá dự án"
  const row = {
    loai: 'danh-gia', time: new Date().toISOString(), id, name, phone, email, channel,
    project: ten, area: (leadProject && leadProject.areaArticle && leadProject.areaArticle.title) || (duAn && D.duAn[duAn] ? D.duAn[duAn].khuVuc || '' : ''),
    doc: 'Đánh giá dự án', purpose: ctx.mucTieu, budget: ctx.budget, calc: tomTat,
    score, temp, visits: 0, interactions: r.tong.done + notes, projectsViewed: 0,
    source: clip(utm.utm_source, 80), medium: clip(utm.utm_medium, 80), campaign: clip(utm.utm_campaign, 80), page: clip(b.page, 200),
    consent: 'Đã đồng ý (' + new Date().toISOString() + ')',
    phienBan: K.phienBan, hs: hsTxt, hsNhan: K.hoSo.map((q) => q.nhan || q.id),
    hsMucDich: hsBy('muc-dich'), hsNganSach: hsBy('ngan-sach'), hsTuChiTra: hsBy('tu-chi-tra'),
    hsChiTiet: K.hoSo.map((q, i) => (hsTxt[i] && !['muc-dich', 'ngan-sach', 'tu-chi-tra'].includes(q.id) ? `${q.nhan}: ${hsTxt[i]}` : '')).filter(Boolean).join('\n'), tong: r0(r.tong.pct), o: r0(r.o.pct), dt: r0(r.dt.pct), muc: r.muc, daCham: r.tong.done, boQua: r.boQua.map((i) => K.the[i].id).join(', '),
    tang: TANG.map((t) => r0(r.tang[t].pct)), wtb: TANG.map((t) => Math.round(r.tang[t].wtb * 10) / 10),
    troi: r.troi.map((t) => K.tang[t].ten).join(', ') || 'Cân bằng', mu: r.mu.map((t) => K.tang[t].ten).join(', '),
    chan: r.chan.map((i) => K.the[i].id).join(', '), cheDoDk: ctx.cheDoDk, xemTu: b.xemTu === true ? 'Có' : 'Chưa',
    tuTong: r.tu ? r0(r.tu.tong.pct) : '', banTong: r.ban ? r0(r.ban.tong.pct) : '',
    lechCG: [ins.lac.length ? '▲ ' + ins.lac.join('; ') : '', ins.than.length ? '▼ ' + ins.than.join('; ') : ''].filter(Boolean).join(' | '),
    nhuCau: ins.nhuCau, uuTien: ins.uuTien.join(', '),
    ghiChu: K.the.map((c, i) => { const t = tkText(c, input.tk[i], pd0); return t ? `${c.id}. ${t}` : ''; }).filter(Boolean).join('\n'),
    w: K.the.map((c, i) => c.id + ':' + input.w[i]).join(' '), s: K.the.map((c, i) => c.id + ':' + (input.s[i] ?? (input.bq[i] ? 'x' : '-'))).join(' '),
    keHoach: ins.plan.map((p, i) => `${i + 1}. ${p}`).join('\n'), goiY: related.map((x) => x.p.name).join(', '), link: reopenOwner,
  };

  const tasks = [appendSheet(env, row)];
  if (channel === 'email') tasks.push(sendMail(env, { to: email, replyTo: env.NOTIFY_TO, ...customerEmail(K, input, r, ctx) }));
  const settled = await Promise.allSettled(tasks);
  const sheetRes = settled[0].status === 'fulfilled' ? settled[0].value : { ok: false };
  const custOk = channel === 'email' && settled[1].status === 'fulfilled' && settled[1].value.ok;

  const later = [];
  if (custOk) later.push(sendMail(env, { to: email, replyTo: env.NOTIFY_TO, scheduledAt: at9(3), ...followupEmail(K, r, ctx, boTroLinks(r.mu, ctx)) }));
  if (env.NOTIFY_TO) {
    later.push(sendMail(env, { to: env.NOTIFY_TO, ...notifyEmail(K, input, r, ctx, ins, custOk) }));
    later.push(sendMail(env, { to: env.NOTIFY_TO, scheduledAt: at9(7), subject: `⏰ Ngày 7 · gọi lại ${name} (${ten})`,
      text: [`Khách ${name} – ${phone} tự đánh giá ${ten} 7 ngày trước: ${tomTat}.`, '', 'Kế hoạch chăm sóc:', ...ins.plan.map((p, i) => `${i + 1}. ${p}`), '', `Bản đánh giá: ${reopenOwner}`, `Zalo: https://zalo.me/${phone}`].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55"><p>Khách <b>${esc(name)}</b> – ${esc(phone)} tự đánh giá <b>${esc(ten)}</b> 7 ngày trước: ${esc(tomTat)}.</p><ol>${ins.plan.map((p) => `<li>${esc(p)}</li>`).join('')}</ol><p><a href="${esc(reopenOwner)}">Xem bản đánh giá</a> · <a href="https://zalo.me/${esc(phone)}">Mở Zalo khách</a></p></div>` }));
  }
  const wa = sendWhatsApp(env, [`🧭 Đánh giá ${temp}: ${name} – ${ten}`, `SĐT: ${phone}${email ? ' | ' + email : ''}`, tomTat, `Hồ sơ: ${hsTxt.filter(Boolean).join(' · ')}`, `Việc đầu tiên: ${ins.plan[1] || ins.plan[0]}`, `Zalo: https://zalo.me/${phone}`].join('\n')).catch(() => ({ ok: false }));
  const out = await Promise.allSettled([...later, wa]);
  const notifyOk = env.NOTIFY_TO ? out.some((x, i) => i === (custOk ? 1 : 0) && x.status === 'fulfilled' && x.value.ok) : false;
  const waOk = out[out.length - 1].status === 'fulfilled' && out[out.length - 1].value.ok;

  if (!sheetRes.ok && !notifyOk && !waOk) return json({ ok: false, error: 'storage' }, 502);
  return json({ ok: true, id, emailed: custOk });
}

export async function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
