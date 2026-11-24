// Cloudflare Pages Function: GET /api/ro-hang?da=<du-an>
// Rổ hàng sống cho sa bàn dự án: đọc thẳng Google Sheets giỏ hàng chung của đại lý (bảng lưới trục căn × tầng,
// màu ô = đang lock / đã bán), trả về tình trạng và giá từng căn. Sa bàn tự gọi khi mở trang và khi bấm "Cập nhật".
//
// Biến môi trường (Cloudflare Pages → Settings → Environment variables), mỗi dự án một biến:
//   RO_HANG_SKYSOLIS = link Google Sheets giỏ hàng (dán nguyên link, chế độ "ai có link đều xem được").
//   RO_HANG_<DU_AN>_TAB (tuỳ chọn) = tên các tab cần đọc, cách nhau dấu phẩy; mặc định đọc các tab tên có chữ "THÁP".
// Link giỏ hàng là nội bộ của đại lý nên chỉ nằm trong biến môi trường, không ghi vào kho mã công khai.
//
// Tham số: moi=1 bỏ bộ nhớ đệm (nút Cập nhật, tối đa 1 lần mỗi phút); xem=1 kèm thông tin dò lỗi.

const DEM_GIAY = 600;          // giữ kết quả 10 phút
const MOI_TOI_THIEU = 60;      // bấm Cập nhật liên tục: mỗi phút đọc sheet một lần

const json = (obj, status = 200, maxAge = 60) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}`, 'access-control-allow-origin': '*' },
});

const giaiMa = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();
const boDau = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();

// Mã sheet từ link hoặc mã trần
function maSheet(v) {
  const s = String(v || '').trim(); const m = s.match(/\/d\/([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : /^[A-Za-z0-9_-]{20,}$/.test(s) ? s : null;
}

// Danh sách tab: trang htmlview khai báo từng tab bằng items.push({name: "...", ..., gid: "..."})
function dsTab(html) {
  const ds = [], re = /name:\s*"((?:[^"\\]|\\.)*)"[\s\S]{0,600}?gid:\s*"(\d+)"/g; let m;
  while ((m = re.exec(html))) {
    const ten = JSON.parse('"' + m[1] + '"');
    if (!ds.some((t) => t.gid === m[2])) ds.push({ ten, gid: m[2] });
  }
  return ds;
}

// Màu nền từng lớp CSS của bảng (.s12{...background-color:#ff9900;...})
function mauLop(html) {
  const map = {}, re = /\.s(\d+)\s*\{([^}]*)\}/g; let m;
  while ((m = re.exec(html))) { const b = m[2].match(/background-color:\s*(#[0-9a-fA-F]{3,6}|rgb[^;]+)/); if (b) map['s' + m[1]] = b[1].toLowerCase(); }
  return map;
}
const nen = (c) => !c || c === '#ffffff' || c === '#fff' || c === 'rgb(255,255,255)' ? null : c;

// Bảng HTML → lưới ô { t: chữ, c: màu nền } theo đúng cột (tính colspan, rowspan)
function luoi(html, mau) {
  const than = (html.match(/<tbody>([\s\S]*?)<\/tbody>/) || [, html])[1];
  const hang = [], chiem = [];
  const reTr = /<tr[^>]*>([\s\S]*?)<\/tr>/g; let tr, r = 0;
  while ((tr = reTr.exec(than))) {
    const dong = hang[r] = hang[r] || [];
    const reTd = /<td([^>]*)>([\s\S]*?)<\/td>/g; let td, c = 0;
    while ((td = reTd.exec(tr[1]))) {
      while (chiem[r] && chiem[r][c]) c++;
      const at = td[1], lop = (at.match(/class="([^"]*)"/) || [, ''])[1].split(/\s+/).find((x) => mau[x]) || '';
      const cs = +(at.match(/colspan="(\d+)"/) || [, 1])[1], rs = +(at.match(/rowspan="(\d+)"/) || [, 1])[1];
      const o = { t: giaiMa(td[2]), c: nen(mau[lop]) };
      for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) {
        (chiem[r + i] = chiem[r + i] || [])[c + j] = true;
        (hang[r + i] = hang[r + i] || [])[c + j] = i || j ? { t: '', c: o.c } : o;
      }
      c += cs;
    }
    r++;
  }
  return hang;
}

const soVN = (s) => { const x = String(s).replace(/[^\d.,]/g, ''); if (!x) return null; const v = parseFloat(x.replace(/,/g, '')); return isFinite(v) ? v : null; };
const RE_MA = /^([A-Z])\s*(\d{1,2})\s*[-.]\s*(\d{1,2}[A-Z]?)$/;

// Đọc một tab lưới: khối 3 dòng "Mã căn" / "NFA" / "Giá bán (chưa vat và PBT)"; màu ô theo chú thích "Đang lock", "Đã bán"
function docTab(g, kq, dl) {
  const chuThich = {};
  g.forEach((dong) => dong && dong.forEach((o, j) => {
    if (!o || !o.t) return;
    const t = boDau(o.t), c = o.c || (dong[j - 1] && dong[j - 1].c) || (dong[j + 1] && !dong[j + 1].t && dong[j + 1].c) || null;
    if (/DANG\s*LOCK|DANG\s*KHOA|GIU\s*CHO/.test(t) && c) chuThich.lock = c;
    if (/DA\s*BAN/.test(t) && c) chuThich.daban = c;
  }));
  dl.chuThich = dl.chuThich || chuThich;
  let n = 0;
  g.forEach((dong, i) => {
    if (!dong || !dong.some((o) => o && /^MA CAN/.test(boDau(o.t)))) return;
    const dt = g[i + 1] || [], gia = g[i + 2] || [];
    dong.forEach((o, j) => {
      const m = o && o.t && o.t.toUpperCase().replace(/\s+/g, '').match(RE_MA); if (!m) return;
      const ma = `${m[1]}.${m[2].padStart(2, '0')}.${m[3].replace(/^\d+/, (d) => d.padStart(2, '0'))}`;   // C22-3A → C.22.03A
      const mau = o.c || (gia[j] && gia[j].c) || (dt[j] && dt[j].c) || null;
      const tt = mau && mau === chuThich.daban ? 'daban' : mau && mau === chuThich.lock ? 'lock' : 'trong';
      const p = gia[j] ? soVN(gia[j].t) : null, a = dt[j] ? soVN(dt[j].t) : null;
      // giá ghi theo triệu đồng (2,004.05 = 2.004.050.000 đ), chưa VAT và phí bảo trì
      kq[ma] = { tt, gia: p && p > 100 && p < 100000 ? Math.round(p * 1e6) : null, nfa: a && a > 10 && a < 1000 ? a : null };
      if (mau && tt === 'trong') (dl.mauKhac = dl.mauKhac || {})[mau] = ((dl.mauKhac || {})[mau] || 0) + 1;
      n++;
    });
  });
  return n;
}

export async function onRequestGet({ request, env, waitUntil }) {
  const u = new URL(request.url), da = (u.searchParams.get('da') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const bien = 'RO_HANG_' + da.toUpperCase().replace(/-/g, '_');
  const id = maSheet(env[bien]);
  if (!da || !id) return json({ ok: false, loi: `Chưa đặt biến môi trường ${bien} (link Google Sheets giỏ hàng).` }, 200, 60);

  const cache = caches.default, khoa = new Request(new URL(`/api/ro-hang?da=${da}`, u).toString());
  const moi = u.searchParams.get('moi') === '1', xem = u.searchParams.get('xem') === '1';
  const cu = await cache.match(khoa);
  if (cu && !xem) {
    const tuoi = (Date.now() - Date.parse(cu.headers.get('x-luc') || 0)) / 1000;
    if (!moi || tuoi < MOI_TOI_THIEU) return cu;
  }

  const dl = { bien }, kq = {};
  try {
    const goc = `https://docs.google.com/spreadsheets/d/${id}`;
    const tr = await fetch(`${goc}/htmlview`, { headers: { 'user-agent': 'Mozilla/5.0 (nguyenanhtu.vn so ban)' } });
    if (!tr.ok) throw Error(`Không mở được sheet (HTTP ${tr.status}). Cần chia sẻ "Bất kỳ ai có đường liên kết đều xem được".`);
    const html = await tr.text();
    const tieuDe = giaiMa((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]).replace(/\s*-\s*Google (Sheets|Trang tính).*$/i, '');
    let tabs = dsTab(html);
    const chon = String(env[bien + '_TAB'] || '').split(',').map((s) => boDau(s.trim())).filter(Boolean);
    dl.tab = tabs.map((t) => t.ten);
    tabs = chon.length ? tabs.filter((t) => chon.includes(boDau(t.ten))) : tabs.filter((t) => /THAP|TOA/.test(boDau(t.ten)));
    if (!tabs.length) tabs = [{ ten: '(tab đầu)', gid: '0' }];
    dl.doc = [];
    for (const t of tabs) {
      const r = await fetch(`${goc}/htmlview/sheet?headers=false&gid=${t.gid}`, { headers: { 'user-agent': 'Mozilla/5.0 (nguyenanhtu.vn so ban)' } });
      if (!r.ok) { dl.doc.push({ tab: t.ten, loi: r.status }); continue; }
      const h = await r.text(), g = luoi(h, mauLop(h));
      dl.doc.push({ tab: t.ten, dong: g.length, can: docTab(g, kq, dl) });
      if (xem) (dl.mau = dl.mau || []).push({ tab: t.ten, dau: g.slice(0, 4).map((d) => (d || []).slice(0, 8).map((o) => o && (o.t || o.c) ? `${o.t}${o.c ? ' [' + o.c + ']' : ''}` : '')) });
    }
    const dem = { trong: 0, lock: 0, daban: 0 }; for (const k in kq) dem[kq[k].tt]++;
    const out = { ok: Object.keys(kq).length > 0, da, tieuDe, nguon: 'Giỏ hàng chung', luc: new Date().toISOString(), dem, can: kq, ...(xem ? { doLoi: dl } : {}) };
    if (!out.ok) out.loi = 'Đọc được sheet nhưng không thấy dòng "Mã căn" nào.';
    const res = json(out, 200, 60); res.headers.set('x-luc', out.luc);
    if (out.ok && !xem) waitUntil(cache.put(khoa, new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${DEM_GIAY}`, 'x-luc': out.luc, 'access-control-allow-origin': '*' } })));
    return res;
  } catch (e) {
    if (cu) return cu;   // sheet tạm lỗi: dùng bản gần nhất
    return json({ ok: false, loi: String(e.message || e), ...(xem ? { doLoi: dl } : {}) }, 200, 30);
  }
}
