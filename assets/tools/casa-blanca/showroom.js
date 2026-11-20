/* Blanca City · sa bàn 3D + giỏ hàng. WebGL2 thuần, không thư viện ngoài. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const PROJECT = 'Blanca City', ZALO = '0978618149', ZALO_TXT = '0978 618 149';
const PLAN_W = 960, PLAN_H = 540, FLOOR_H = 1.45, UNIT = .44;
const TYPES = [
  { k: 'TH', name: 'Casa Townhouse', short: 'Townhouse', floors: 4, size: '7,5 × (17,5 / 18 / 20) m', pages: [12, 13], col: [.9, .52, .22], roof: .5 },
  { k: 'SL', name: 'Casa Villa song lập', short: 'Song lập', floors: 3, size: '10 × (16 – 20) m', pages: [19, 20], col: [.9, .8, .26], roof: 1.7 },
  { k: 'DL', name: 'Casa Villa đơn lập', short: 'Đơn lập', floors: 3, size: '14 × (19 / 20) m', pages: [26, 27], col: [.56, .76, .3], roof: 1.8 },
  { k: 'GV', name: 'Casa Grand Villa', short: 'Grand Villa', floors: 4, size: '16 × 22 m', pages: [29], col: [.22, .7, .72], roof: 1.4 },
];
const ZCOUNT = { casa: 939, beacon: 2211, beachtro: 1785, b123: 2224 };
const ZONES = [
  { key: 'all', name: 'Toàn dự án', sub: 'Tổng thể Blanca City', col: '#e9c683' },
  { key: 'casa', name: 'Casa Villa', sub: '939 căn thấp tầng · 4 loại hình', col: '#d9b24a' },
  { key: 'beacon', name: 'Beacon Tower', sub: 'Khối E2 · toà con E1 E2 E3 E5 · 2.211 căn', col: '#4bb07a' },
  { key: 'beachtro', name: 'Beachtro Tower', sub: 'Khối E1 · toà con E6 E7 E8 E9 · 1.785 căn', col: '#6c8fa8', profile: 'beachtro-tower' },
  { key: 'b123', name: 'Cụm B1 · B2 · B3', sub: 'B1 40T · B2 B3 34T · 2.224 căn', col: '#8d62c0', profile: 'cum-b1-b2-b3' },
  { key: 'b567', name: 'Cụm B5 · B6 · B7', sub: 'B5 40T · B6 B7 34T', col: '#c04fa6', profile: 'cum-b5-b6-b7' },
];
// Khối tháp dựng theo hồ sơ tư vấn Blanca City 7/8/2026.
// Tú đính chính 19/11/2026: khối ghi E1 trên tổng mặt bằng là Beachtro, khối ghi E2 là Beacon.
// Chiều cao quy đổi: 2 tầng khối đế cao 5 m, các tầng căn hộ cao 3,6 m (trần 3,6 m theo mặt đứng E2).
const CAO_TANG = 3.6, CAO_DE = 5.0, SO_TANG_DE = 2;
const caoM = (tang) => SO_TANG_DE * CAO_DE + Math.max(0, tang - SO_TANG_DE) * CAO_TANG;
const donVi = (met) => met / (GEO && GEO.tyLe ? GEO.tyLe.metTrenDonVi : 2.1958);
// Mỗi khối: hình bao khối đế, rồi các toà con mọc lên từ đó.
// Chân tháp Beacon và Beachtro cắt từ đường bao công trình trên tổng mặt bằng
// (chan-thap.json), chia lát dọc nên giữ đúng hình chữ U và nét gấp khúc của
// mặt bằng tầng điển hình (hồ sơ tư vấn 7/8/2026, trang 67 và 99).
// Thứ tự toà con từ trái sang phải trên tổng mặt bằng, khớp mã căn trong layout tầng.
let CHAN = null;
let CAN = null;   // quỹ căn hộ chủ đầu tư chia cho đại lý, nạp từ can-ho.json
let MB = null;    // mặt bằng tầng đã số hoá (mat-bang.json, scripts/so-hoa-mat-bang.py)
const KHOI = [
  { zone: 'beachtro', col: [.42, .56, .66], ten: 'Beachtro',
    thap: [['E9', 36], ['E8', 40], ['E7', 38], ['E6', 34]] },
  { zone: 'beacon', col: [.3, .72, .45], ten: 'Beacon',
    // Tú cho số tầng 19/11/2026: E1 và E3 39 tầng, E2 40 tầng, E5 36 tầng
    thap: [['E5', 36], ['E3', 39], ['E2', 40], ['E1', 39]] },
];
const THAP_B = [
  { zone: 'b123', x: 666, y: 237, w: 13, h: 30, tang: 40, ten: 'B1', col: [.56, .38, .78] },
  { zone: 'b123', x: 666, y: 275, w: 13, h: 30, tang: 34, ten: 'B2', col: [.56, .38, .78] },
  { zone: 'b123', x: 666, y: 309, w: 13, h: 30, tang: 34, ten: 'B3', col: [.56, .38, .78] },
  // Tú xác nhận 19/11/2026: cụm B5 B6 B7 cao giống cụm B1 B2 B3
  { zone: 'b567', x: 321, y: 235, w: 13, h: 30, tang: 40, ten: 'B5', col: [.76, .3, .66] },
  { zone: 'b567', x: 321, y: 276, w: 13, h: 30, tang: 34, ten: 'B6', col: [.76, .3, .66] },
  { zone: 'b567', x: 321, y: 310, w: 13, h: 30, tang: 34, ten: 'B7', col: [.76, .3, .66] },
];
const NHOM = { beachtro: 1, beacon: 2, B1: 3, B2: 3, B3: 3, B5: 4, B6: 4, B7: 4 };   // nhóm cắt tầng (iZ.z)
const MAU_MAI = [.96, .95, .92];
// Ô đèn: mỗi căn còn trống trong quỹ đại lý là một ô sáng trên mặt đứng, đúng tầng và đúng vị trí căn trên mặt bằng.
// Chạm vào ô đèn: bóc tầng đó, mở mặt bằng và thẻ căn (PROJECT_RULES §16.2).
function oDenCan(k, bx0, by0, sx, sy) {
  const mbk = MB && MB[k.zone], out = [];
  if (!mbk || !CAN) return out;
  for (const c of CAN.can) {
    if (c.phanKhu !== k.zone || c.tinhTrang !== 'trong') continue;
    const m = mbk.can.find(x => x.toa === c.toa && x.so === c.can); if (!m) continue;
    const xs = m.poly.map(p => p[0] / mbk.rong), ys = m.poly.map(p => p[1] / mbk.cao);
    const x0 = bx0 + Math.min(...xs) * sx, x1 = bx0 + Math.max(...xs) * sx, y0 = by0 + Math.min(...ys) * sy, y1 = by0 + Math.max(...ys) * sy;
    const tg = tangSo(c.tang);
    out.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + .35, h: y1 - y0 + .35, z0: donVi(caoM(tg - 1)) + .05, z: donVi(caoM(tg)) - .05,
               khoi: k.zone, zone: k.zone, col: [1, .78, .3], can: c.ma, name: `${c.ma} · ${tenLoai(c.loai)} · còn trống · ${tien(c.gia)}` });
  }
  return out;
}
function dungThap() {
  const t = [], zDe = donVi(SO_TANG_DE * CAO_DE);
  for (const k of KHOI) {
    const d = CHAN && CHAN.khoi && CHAN.khoi[k.zone];
    if (!d) continue;
    const [bx0, by0, bx1, by1] = d.bao;
    t.push({ x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, w: bx1 - bx0, h: by1 - by0, z0: 0, z: zDe, khoi: k.zone,
             zone: k.zone, col: k.col, name: `Khối đế ${k.ten} · ${SO_TANG_DE} tầng` });
    const n = k.thap.length, b = (bx1 - bx0) / n;
    // Có mặt bằng tầng đã số hoá: chân tháp lấy đúng thân toà trên mặt bằng (cùng khung với khối đế),
    // nên mặt cắt tầng được ảnh mặt bằng phủ kín. Chưa có thì dùng lát cắt từ tổng mặt bằng.
    const mbk = MB && MB[k.zone];
    if (mbk && mbk.lat && mbk.toa) {
      // Toà con đúng theo mặt bằng: mỗi lát mang chỉ số toà; cao đến tầng cuối của toà, trên cùng là mái khung trắng
      const sx = bx1 - bx0, sy = by1 - by0;
      for (const [u0, v0, u1, v1, ti] of mbk.lat) {
        const o = mbk.toa[ti], tang = o.tangCuoi, hien = o.mai || tang, zt = donVi(caoM(tang));
        const lx = bx0 + u0 * sx, ly = by0 + v0 * sy, lw = (u1 - u0) * sx + .04, lh = (v1 - v0) * sy;
        t.push({ x: lx + lw / 2, y: ly + lh / 2, w: lw, h: lh, z0: zDe, z: zt, khoi: k.zone, toa: o.ten,
                 zone: k.zone, col: k.col, name: `${k.ten} · ${o.ten} · ${hien} tầng${o.duplex ? ' · duplex ' + o.duplex : ''}` });
        t.push({ x: lx + lw / 2, y: ly + lh / 2, w: lw, h: lh, z0: zt, z: zt + donVi(CAO_TANG * (o.mai ? 1 : 1.5)), khoi: k.zone, toa: o.ten,
                 zone: k.zone, col: MAU_MAI, name: `${k.ten} · ${o.ten} · mái` });
      }
      t.push(...oDenCan(k, bx0, by0, sx, sy));
    } else for (const [lx, ly, lw, lh] of d.lat) {
      const i = Math.max(0, Math.min(n - 1, Math.floor((lx + lw / 2 - bx0) / b)));
      const [ten, tang] = k.thap[i];
      t.push({ x: lx + lw / 2, y: ly + lh / 2, w: lw + .04, h: lh, z0: zDe, z: donVi(caoM(tang)), khoi: k.zone,
               zone: k.zone, col: k.col, name: `${k.ten} · ${ten} · ${tang} tầng` });
    }
  }
  for (const b of THAP_B) {
    t.push({ x: b.x, y: b.y, w: b.w + 6, h: b.h * .5, z0: 0, z: zDe, khoi: b.ten, zone: b.zone, col: b.col, name: 'Khối đế ' + b.ten });
    t.push({ x: b.x, y: b.y, w: b.w, h: b.h, z0: zDe, z: donVi(caoM(b.tang)), khoi: b.ten,
             zone: b.zone, col: b.col, name: `${b.ten} · ${b.tang} tầng` });
  }
  return t;
}
let TOWERS = [];
// Vị trí thực địa (PROJECT_RULES §17, tầng 4). Tổng mặt bằng là bản vẽ tiếp thị: nén theo chiều dọc và lệch
// từng cụm, nên không dán cả tấm lên bản đồ. Mỗi khối nhà (song lập, đơn lập, Grand Villa, nhà phố, tháp căn hộ)
// tách riêng và có một ghim thật trong georef.json > khoi: vĩ độ, kinh độ tâm khối và hệ số giãn so với bản vẽ.
// Nền "Tổng mặt bằng": khối nằm theo bản vẽ. Nền bản đồ và "Chồng lớp": khối nằm theo ghim.
const VT = { t: 1, dich: 1, co: false };          // 0 = theo bản vẽ, 1 = theo ghim thực địa
function datThucDia() {
  const kh = GEO && GEO.khoi;
  for (const u of U) { u.px = u.x; u.py = u.y; u.rx = u.x; u.ry = u.y; }
  for (const o of TOWERS) { o.px = o.x; o.py = o.y; o.pw = o.w; o.ph = o.h; o.rx = o.x; o.ry = o.y; o.rw = o.w; o.rh = o.h; }
  if (!kh || !geo.ok) return;
  const thuc = d => { const [wx, wy] = geo.world(d.ghim[0], d.ghim[1]); return [wx, PLAN_H - wy]; };
  const ds = (kh.ds || []).filter(d => d.ghim && d.khung).map(d => ({ ...d, R: thuc(d) }));
  let n = 0;
  for (const u of U) {
    const d = ds.find(d => d.loai === TYPES[u.t].k && u.px >= d.khung[0] && u.px <= d.khung[2] && u.py >= d.khung[1] && u.py <= d.khung[3]);
    if (!d) continue;
    const [sx, sy] = d.tyLe || [1, 1];
    u.rx = d.R[0] + (u.px - d.tamBanVe[0]) * sx; u.ry = d.R[1] + (u.py - d.tamBanVe[1]) * sy; u.khoi = d.ma; n++;
  }
  const th = new Map((kh.thap || []).filter(d => d.ghim).map(d => [d.ma, { ...d, R: thuc(d) }]));
  for (const o of TOWERS) {
    const d = th.get(o.khoi); if (!d) continue;
    const [sx, sy] = d.tyLe || [1, 1], [cx, cy] = d.tamBanVe;
    o.rx = d.R[0] + (o.px - cx) * sx; o.ry = d.R[1] + (o.py - cy) * sy; o.rw = o.pw * sx; o.rh = o.ph * sy;
  }
  VT.co = n > 0 || th.size > 0;
}
function datViTri(t) {
  VT.t = t;
  for (const u of U) { u.x = u.px + (u.rx - u.px) * t; u.y = u.py + (u.ry - u.py) * t; }
  for (const o of TOWERS) { o.x = o.px + (o.rx - o.px) * t; o.y = o.py + (o.ry - o.py) * t; o.w = o.pw + (o.rw - o.pw) * t; o.h = o.ph + (o.rh - o.ph) * t; }
  capNhatNhanViTri();
}
const viTriDich = () => (state.base === 'plan' || !VT.co ? 0 : 1);
const BEACON_MIX = [['Garden house', 'Chưa ghi', 47], ['Studio', '30,8–38,8', 477], ['1PN+', '50,1–59,4', 782], ['2PN', '65,7–79,9', 721], ['3PN', '94,3–109,7', 172], ['Duplex', '104,8–286,5', 12]];
const BEACON_SHEETS = ['Tầng 4–19, 21–35', 'Tầng 20', 'Tầng 36', 'Tầng 37', 'Tầng 38', 'Tầng 39', 'Studio', '1PN+', '2PN', '2PN+', '3PN', '3PN view kép'];
const STATUS = { available: ['Còn hàng', [.3, .78, .5], 'ok'], reserved: ['Giữ chỗ', [.95, .72, .25], 'warn'], sold: ['Đã bán', [.55, .56, .58], ''] };
const nf = new Intl.NumberFormat('vi-VN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = t => new Date(t).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const rgb = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

/* ---------- dữ liệu ---------- */
const U = [];            // căn Casa Villa mô phỏng
let inv = { updatedAt: null, source: null, units: {} };
const state = { zone: 'all', type: -1, sel: -1, hover: -1, tab: 'explore', mode: 'type', cart: [], q: '', sheet: 0, base: 'osm', sunT: null, osm: 'chua', night: false, hideLabels: false, blocks: true, cut: 0, market: 'all', rail: null, ranh: true, canToa: '', canTT: '', canLoai: '', qcan: '' };
let GEO = null, SUN = null;
try { state.cart = JSON.parse(localStorage.getItem('blanca.cart.v1') || '[]').filter(x => x && x.k && x.label).slice(0, 20); } catch {}
const saveCart = () => { try { localStorage.setItem('blanca.cart.v1', JSON.stringify(state.cart)); } catch {} };

function buildUnits(geo) {
  const perType = [0, 0, 0, 0];
  geo.forEach((r, i) => {
    const t = r.t, vertical = !!r.vertical;
    const fw = (vertical ? r.displayDepth : r.front) * UNIT, fh = (vertical ? r.front : r.displayDepth) * UNIT;
    const bwRaw = vertical ? r.bodyDepth : r.bodyWidth, bhRaw = vertical ? r.bodyWidth : r.bodyDepth;
    perType[t]++;
    U.push({
      id: i, t, x: r.x, y: r.y, vertical, fw, fh,
      bw: bwRaw ? bwRaw * UNIT : fw * .7, bh: bhRaw ? bhRaw * UNIT : fh * .62,
      front: r.front, depth: r.depth ?? r.displayDepth, exact: r.depth != null,
      code: TYPES[t].k + '-' + String(perType[t]).padStart(3, '0'),
    });
  });
  // gom dãy: cùng loại, cùng hướng, cùng hàng, liền kề
  const groups = new Map();
  for (const u of U) {
    const key = u.t + '|' + (u.vertical ? 'v' + Math.round(u.x) : 'h' + Math.round(u.y));
    (groups.get(key) || groups.set(key, []).get(key)).push(u);
  }
  const rows = [];
  for (const g of groups.values()) {
    g.sort((a, b) => u2(a, g[0]) - u2(b, g[0]));
    let cur = [g[0]];
    for (let i = 1; i < g.length; i++) {
      const gap = Math.abs(u2(g[i], g[0]) - u2(g[i - 1], g[0]));
      if (gap > Math.max(g[i].fw, g[i].fh) * 1.1) { rows.push(cur); cur = []; }
      cur.push(g[i]);
    }
    rows.push(cur);
  }
  function u2(u, ref) { return ref.vertical ? u.y : u.x; }
  rows.sort((a, b) => a[0].t - b[0].t || a[0].y - b[0].y || a[0].x - b[0].x);
  const rowNo = [0, 0, 0, 0];
  for (const r of rows) {
    const no = ++rowNo[r[0].t];
    r.forEach((u, i) => { u.row = no; u.n = i + 1; u.rowN = r.length; });
  }
}
const lab = u => TYPES[u.t].name + ' · Dãy ' + u.row + ' · Căn ' + u.n;
const land = u => Math.round(u.front * u.depth);
const unitInv = u => inv.units && inv.units[u.code];
const hasInv = () => inv.units && Object.keys(inv.units).length > 0;

/* ---------- toán ---------- */
const M = {
  persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), q = 1 / (n - fa); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) * q, -1, 0, 0, 2 * fa * n * q, 0]; },
  look(e, c, up) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; const zl = Math.hypot(...z); z = z.map(v => v / zl);
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(v => v / xl);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  },
  mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return o; },
};

/* ---------- mặt trời (thuật toán NOAA) và phép chiếu địa lý ---------- */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const wrap = (a, b) => ((a % b) + b) % b;
function sunPosition(ms, lat, lon) {
  const t = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  const L0 = wrap(280.46646 + t * (36000.76983 + t * 0.0003032), 360);
  const Md = 357.52911 + t * (35999.05029 - 0.0001537 * t), M = rad(Md);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = Math.sin(M) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M) * (0.019993 - 0.000101 * t) + Math.sin(3 * M) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const appLong = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = e0 + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(appLong))));
  const y = Math.pow(Math.tan(rad(eps / 2)), 2);
  const eqTime = 4 * deg(y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * rad(L0)) - 0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * M));
  const ha = wrap((ms / 60000) % 1440 + eqTime + 4 * lon, 1440) / 4 - 180;
  const latR = rad(lat), dR = rad(decl), haR = rad(ha);
  const cosZ = Math.min(1, Math.max(-1, Math.sin(latR) * Math.sin(dR) + Math.cos(latR) * Math.cos(dR) * Math.cos(haR)));
  const zen = deg(Math.acos(cosZ));
  let az, den = Math.cos(latR) * Math.sin(rad(zen));
  if (Math.abs(den) > 1e-9) {
    const c = Math.min(1, Math.max(-1, (Math.sin(latR) * cosZ - Math.sin(dR)) / den));
    az = ha > 0 ? wrap(deg(Math.acos(c)) + 180, 360) : wrap(540 - deg(Math.acos(c)), 360);
  } else az = ha > 0 ? 180 : 0;
  let el = 90 - zen, ref = 0;
  if (el <= 85) {
    const te = Math.tan(rad(el));
    ref = (el > 5 ? 58.1 / te - 0.07 / Math.pow(te, 3) + 0.000086 / Math.pow(te, 5)
        : el > -0.575 ? 1735 + el * (-518.2 + el * (103.4 + el * (-12.79 + el * 0.711))) : -20.772 / te) / 3600;
  }
  return { az, el: el + ref, decl, eqTime };
}
function sunTimes(ms, lat, lon) {
  const d0 = Math.floor(ms / 86400000) * 86400000;
  const { decl, eqTime } = sunPosition(d0 + 43200000, lat, lon);
  const noon = 720 - 4 * lon - eqTime;
  const latR = rad(lat), dR = rad(decl);
  const cosHA = (Math.cos(rad(90.833)) - Math.sin(latR) * Math.sin(dR)) / (Math.cos(latR) * Math.cos(dR));
  if (cosHA > 1 || cosHA < -1) return { rise: null, noon: d0 + noon * 60000, set: null };
  const h = deg(Math.acos(cosHA)) * 4;
  return { rise: d0 + (noon - h) * 60000, noon: d0 + noon * 60000, set: d0 + (noon + h) * 60000 };
}
// Phép chiếu: hệ tọa độ thế giới của sa bàn (X = plan x, Y = PLAN_H - plan y) <-> WGS84
const geo = {
  ok: false, mpu: 1.911, north: 44, lat0: 10.3801303, lon0: 107.1345989, wx0: 488, wy0: PLAN_H - 268,
  init(g) {
    try {
      this.mpu = g.tyLe.metTrenDonVi; this.north = g.huong.bacSoVoiTrucDocAnh;
      this.lat0 = g.neo.lat; this.lon0 = g.neo.lon; this.wx0 = g.neo.planX; this.wy0 = PLAN_H - g.neo.planY;
      this.n = [Math.sin(rad(this.north)), Math.cos(rad(this.north))];   // vector Bắc trong hệ thế giới
      this.e = [Math.cos(rad(this.north)), -Math.sin(rad(this.north))];  // vector Đông
      // mét trên một độ, cùng công thức với scripts/khop-sa-ban.py để ảnh nghiệm thu khớp đúng trang
      const f = rad(this.lat0);
      this.mLat = 111132.92 - 559.82 * Math.cos(2 * f) + 1.175 * Math.cos(4 * f);
      this.mLon = 111412.84 * Math.cos(f) - 93.5 * Math.cos(3 * f);
      this.ok = true;
    } catch { this.ok = false; }
    return this.ok;
  },
  dir(bearing) { const b = rad(bearing); return [this.n[0] * Math.cos(b) + this.e[0] * Math.sin(b), this.n[1] * Math.cos(b) + this.e[1] * Math.sin(b)]; },
  latLon(wx, wy) {
    const dx = wx - this.wx0, dy = wy - this.wy0;
    const nm = (dx * this.n[0] + dy * this.n[1]) * this.mpu, em = (dx * this.e[0] + dy * this.e[1]) * this.mpu;
    return [this.lat0 + nm / this.mLat, this.lon0 + em / this.mLon];
  },
  world(lat, lon) {
    const nm = (lat - this.lat0) * this.mLat / this.mpu, em = (lon - this.lon0) * this.mLon / this.mpu;
    return [this.wx0 + this.n[0] * nm + this.e[0] * em, this.wy0 + this.n[1] * nm + this.e[1] * em];
  },
};
function sunNow() {
  const ms = state.sunT ?? Date.now();
  const p = sunPosition(ms, geo.lat0, geo.lon0), t = sunTimes(ms, geo.lat0, geo.lon0);
  return { ms, ...p, ...t, ngay: !!(p.el > -0.833) };
}

/* ---------- camera ---------- */
// Kéo xa nhất: đủ thấy hết Bãi Sau, Núi Nhỏ và phố Vũng Tàu quanh dự án.
// Kéo xa nhất khoảng 15 km để thấy cả Bãi Sau, Núi Nhỏ, Núi Lớn và trung tâm Vũng Tàu khi tư vấn.
const XA_NHAT = 7000;
const HOME = { tx: 476, ty: PLAN_H - 232, tz: 0, dist: 940, yaw: .3, pitch: .92 };
// Góc nhìn tư vấn view: đứng trên dự án nhìn ra biển, ở độ cao camera cho trước (mét so với mặt đất).
// Hướng ra biển: bờ Bãi Sau đoạn này chạy theo phương vị khoảng 60° (đo trên ảnh vệ tinh), nên pháp tuyến
// ra biển là 150°. Quy về toạ độ sa bàn: Bắc nằm ở góc `bac` thuận kim đồng hồ so với trục dọc ảnh,
// nên phương vị β ứng với góc ảnh (bac + β).
const PHUONG_BIEN = 150;
function gocDoCao(met) {
  const mpu = (GEO && GEO.tyLe && GEO.tyLe.metTrenDonVi) || 2.1536;
  const bac = (GEO && GEO.huong && GEO.huong.bacSoVoiTrucDocAnh) || geo.north || 35.5;
  const a = rad(bac + PHUONG_BIEN);                 // góc so với trục dọc ảnh, thuận kim đồng hồ
  const nhin = [Math.sin(a), Math.cos(a)];          // hướng nhìn trong toạ độ thế giới (y lên)
  const pitch = met >= 900 ? .62 : .5;
  const dist = met / mpu / Math.sin(pitch);
  const tam = [476 + nhin[0] * 90, (PLAN_H - 230) + nhin[1] * 90];  // đặt dự án ở nửa dưới khung, biển ở nửa trên
  return { tx: tam[0], ty: tam[1], tz: 0, dist, pitch, yaw: Math.atan2(-nhin[0], nhin[1]) };
}
function doCaoMet() {
  const mpu = (GEO && GEO.tyLe && GEO.tyLe.metTrenDonVi) || 2.1536;
  return Math.max(0, (C.tz + C.dist * Math.sin(C.pitch)) * mpu);
}
function homeView() { return { ...HOME, dist: HOME.dist * (innerWidth < 860 ? 1.1 : Math.min(1.3, Math.max(.9, 950 / Math.max(620, canvas.clientWidth)))) }; }
const C = { ...HOME }, T = { ...HOME };
const W = y => PLAN_H - y; // y ảnh → Y thế giới
function fly(o, instant) {
  Object.assign(T, o);
  T.pitch = Math.max(.2, Math.min(1.5, T.pitch)); T.dist = Math.max(28, Math.min(XA_NHAT, T.dist)); if (T.tz == null) T.tz = 0;
  if (instant || reduce) Object.assign(C, T);
  dirty = true;
}
function zoneView(key, type = -1) {
  if (key === 'casa' || key === 'all') {
    let list = U; if (type >= 0) list = U.filter(u => u.t === type);
    if (key === 'all') return homeView();
    const xs = list.map(u => u.x), ys = list.map(u => u.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const span = Math.max(x1 - x0, (y1 - y0) * 1.8) + 60;
    return { tx: (x0 + x1) / 2, ty: W((y0 + y1) / 2), tz: 6, dist: Math.min(900, span * .95), pitch: .85, yaw: T.yaw };
  }
  const t = TOWERS.filter(o => o.zone === key);
  if (!t.length) return homeView();
  const x = t.reduce((s, o) => s + o.x, 0) / t.length, y = t.reduce((s, o) => s + o.y, 0) / t.length;
  const tall = key === 'beacon';
  return { tx: x, ty: W(y), tz: tall ? 34 : 17, dist: tall ? 400 : 235, pitch: tall ? .62 : .66, yaw: T.yaw };
}

/* ---------- WebGL ---------- */
const canvas = $('#gl');
// ?chup=1: chế độ chụp ảnh đại diện giỏ hàng từ khối 3D (scripts/chup-anh-sa-ban.py). Ẩn toàn bộ giao diện.
const CHUP = new URLSearchParams(location.search).get('chup') === '1';
if (CHUP) document.documentElement.classList.add('chup');
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: CHUP });
let dirty = true, pickDirty = true, nInst = 0, prog, gprog, lprog, ranhVAO = null, ranhN = 0, RANH = null, boxVAO, roofVAO, gVAO, stat, dyn, planTex, fbo, fboTex, fboDepth, fboW = 0, fboH = 0;
const dynArr = [];
const U_ = {};

const VS = `#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm;
layout(location=2) in vec4 iBox; layout(location=3) in vec4 iZ; layout(location=4) in vec4 iCol; layout(location=5) in vec2 iSt;
uniform mat4 uVP; uniform int uPass; uniform vec2 uShadow; uniform float uUnits; uniform float uCut; uniform float uCutNhom;
out vec3 vN; out vec3 vCol; out float vH; out float vSt; out float vId; out vec3 vW;
void main(){
  vec3 p; vec3 n=aNrm; vH=aPos.z;
  if(uPass==0){
    float top=iZ.y;
    // mặt cắt: uCutNhom = 0 cắt mọi tháp, > 0 chỉ cắt khối cùng nhóm (iZ.z); khối nằm trọn trên mặt cắt thì ẩn
    if(uCut>0.&&iSt.y>uUnits&&(uCutNhom<.5||abs(iZ.z-uCutNhom)<.5)){ top=min(top,uCut); if(top<=iZ.x+.001){ gl_Position=vec4(2.,2.,2.,1.); return; } }
    p=vec3(iBox.xy+aPos.xy*iBox.zw, iZ.x+aPos.z*(top-iZ.x));
  }
  else if(uPass==1){
    bool ax=iZ.z>.5; vec2 q=ax?vec2(aPos.y,aPos.x):aPos.xy; n.xy=ax?aNrm.yx:aNrm.xy;
    p=vec3(iBox.xy+q*iBox.zw*1.07, iZ.y+aPos.z*iZ.w);
  } else { vec2 off=uShadow*iZ.y; vec2 sz=iBox.zw+abs(off); p=vec3(iBox.xy+off*.5+aPos.xy*sz,.1); }
  vN=n; vCol=iCol.rgb; vSt=iSt.x; vId=iSt.y; vW=p;
  gl_Position=uVP*vec4(p,1.);
}`;
const FS = `#version 300 es
precision highp float; precision highp int;
in vec3 vN; in vec3 vCol; in float vH; in float vSt; in float vId; in vec3 vW;
uniform int uPass; uniform int uPick; uniform vec3 uEye; uniform vec3 uFog; uniform float uUnits;
uniform vec3 uSun; uniform float uNight; uniform vec2 uTang;
out vec4 o;
void main(){
  if(uPick==1){ int id=int(vId+.5); o=vec4(float(id&255)/255.,float((id>>8)&255)/255.,float((id>>16)&255)/255.,1.); return; }
  if(uPass==2){ o=vec4(0.,0.,0.,.3); return; }
  vec3 n=normalize(vN); vec3 L=uSun;
  int s0=int(vSt+.5);
  if(s0>=5){
    // căn còn trống trong quỹ: ô đèn ấm trên mặt đứng tháp, đúng tầng và vị trí căn
    vec3 d=s0==6?vec3(1.,.55,.18):s0==7?vec3(1.,.93,.6):vec3(1.,.76,.28);
    float g=.86+.14*max(dot(n,L),0.)+.25*uNight;
    float fg=smoothstep(900.,2600.,length(uEye-vW)); o=vec4(mix(d*g,uFog,fg),1.); return;
  }
  vec3 base=uPass==1?vCol*.92:mix(vCol,vec3(.93,.90,.84),.76);
  int s=int(vSt+.5);
  if(s==4) base=mix(base,vec3(.5,.52,.5),.74);
  if(s==2) base=mix(base,vec3(.98,.74,.22),.62);
  if(s==1) base=mix(base,vec3(1.,.9,.55),.55);
  if(s==3) base=mix(base,vec3(1.,.97,.85),.78);
  float d=max(dot(n,L),0.);
  float hemi=.5+.5*n.z;
  // ban đêm: chỉ còn ánh sáng trời khuếch tán, không có nắng trực tiếp
  vec3 c=base*mix(.34+.38*hemi+.6*d, .20+.16*hemi, uNight);
  c=mix(c, c*vec3(.72,.80,1.05), uNight);
  if(uPass==0){ c*=.82+.18*vH; if(vId>uUnits&&n.z<.5){ float f=fract(max(vW.z-uTang.y,0.)/uTang.x); c*=.86+.14*step(.3,f); } }
  if(s==1||s==3) c+=vec3(.12,.1,.04);
  float fog=smoothstep(900.,2600.,length(uEye-vW)); c=mix(c,uFog,fog);
  o=vec4(c,1.);
}`;
const GVS = `#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec2 a;
uniform mat4 uVP; uniform vec2 uOrigin; uniform vec2 uSize; uniform vec2 uPad; uniform float uRot; uniform float uZ;
out vec2 vUV;
void main(){
  vec2 q=a*uPad*uSize*.5;
  float c=cos(uRot), si=sin(uRot);
  vec2 w=uOrigin+vec2(c*q.x-si*q.y, si*q.x+c*q.y);
  vUV=vec2(a.x*uPad.x*.5+.5, .5-a.y*uPad.y*.5);
  gl_Position=uVP*vec4(w,uZ,1.);
}`;
const GFS = `#version 300 es
precision highp float; precision highp int;
in vec2 vUV; uniform sampler2D uTex; uniform vec3 uFog; uniform int uMask; uniform float uDim; uniform float uAlpha; uniform float uNight; uniform float uFeather;
uniform sampler2D uId; uniform sampler2D uSt;
out vec4 o;
void main(){
  vec2 uv=clamp(vUV,0.,1.);
  if(uMask==5){
    // Mặt bằng tầng dán trên mặt cắt: ảnh thật của chủ đầu tư, tô trạng thái từng căn theo bản đồ mã căn.
    vec4 t=texture(uTex,uv); if(t.a<.5) discard;
    vec3 c=t.rgb;
    float id=floor(texture(uId,uv).r*255.+.5);
    if(id>.5){
      vec4 s=texelFetch(uSt,ivec2(int(id)-1,0),0);
      // tô nhẹ để vẫn đọc được layout phòng bên trong căn
      if(s.r>.75) c=mix(c,vec3(.2,.78,.42),.28);          // còn trống trong quỹ
      else if(s.r>.25) c=mix(c,vec3(.42,.42,.42),.45);     // đã cọc
      if(s.b>.5) c=mix(c,vec3(1.,.92,.6),.3);              // đang rê chuột
      if(s.g>.5) c=mix(c,vec3(1.,.5,.18),.42);             // đang chọn
    }
    o=vec4(mix(c,c*vec3(.55,.62,.86),uNight*.5),1.); return;
  }
  vec3 c=texture(uTex,uv).rgb;
  if(uMask==2){
    // Tô lại ô bản đồ OpenStreetMap theo tông của thương hiệu:
    // nền nâu ấm, đường kem, cây xanh ô liu, nước xanh lam sẫm.
    float g=dot(c,vec3(.3,.59,.11));
    float sat=max(max(c.r,c.g),c.b)-min(min(c.r,c.g),c.b);
    float nuoc=smoothstep(.05,.18, c.b-c.r);
    float cay=smoothstep(.02,.10, c.g-max(c.r,c.b));
    float duongNho=smoothstep(.950,.995,g);                       // đường nhỏ, màu trắng
    float duongLon=smoothstep(.10,.22,c.r-c.b)*smoothstep(.45,.70,g); // đường lớn, màu ấm
    float khoiNha=(1.-duongNho)*smoothstep(.92,.86,g)*(1.-step(.09,sat));
    vec3 col=vec3(.141,.122,.098);
    col=mix(col,vec3(.208,.184,.149),khoiNha);
    col=mix(col,vec3(.153,.196,.122),cay*.9);
    col=mix(col,vec3(.086,.204,.227),nuoc*.95);
    col=mix(col,vec3(.776,.725,.639),duongNho);
    col=mix(col,vec3(.659,.537,.337),duongLon*.9);
    c=col;
  } else if(uMask==4){
    // Ảnh vệ tinh: giữ nguyên màu thật, chỉ hạ sáng và tăng tương phản nhẹ cho hợp nền tối.
    // Mặt biển: Esri ghép ảnh nhiều ngày nên nước có từng mảng tông khác nhau. Lấy tông vùng rộng
    // qua mipmap mức cao, nhận ra nước, thay tông nền bằng một màu biển chung nhưng giữ chi tiết sóng.
    vec3 lo=textureLod(uTex,uv,5.5).rgb;
    float nuoc=smoothstep(.015,.06,lo.g-lo.r)*smoothstep(.015,.05,lo.b-lo.r)
              *(1.-smoothstep(.30,.42,dot(lo,vec3(.3,.59,.11))));
    c=mix(c,vec3(.075,.215,.205)+(c-lo)*.35,nuoc);
    c=clamp((c-.5)*1.12+.5,0.,1.)*.82;
    c=mix(c,c*vec3(1.02,1.0,.95),.5);
  } else {
    float g=dot(c,vec3(.3,.59,.11)); c=mix(vec3(g),c,.8)*.86;
  }
  if(uMask==1){
    // che hai khối chú thích in sẵn trên ảnh tổng mặt bằng (dải chữ dưới, bảng màu bên phải)
    c=mix(c,uFog,smoothstep(.745,.80,uv.y));
    float bx=max(max(.793-uv.x,uv.x-.963),max(.405-uv.y,uv.y-.655));
    c=mix(c,uFog,1.-smoothstep(0.,.016,bx));
  }
  float dx=max(max(-vUV.x,vUV.x-1.),max(-vUV.y,vUV.y-1.));
  float edge=smoothstep(0.,.055,dx);
  c=mix(c,uFog,max(edge,uDim));
  c=mix(c,c*vec3(.55,.62,.86),uNight*.75);
  // uFeather > 0: mờ dần alpha trong dải sát mép (tính theo phần của cạnh) để khảm gần hoà vào khảm xa
  float trong=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));
  float a=uFeather>0. ? smoothstep(0.,uFeather,trong) : 1.;
  o=vec4(c,uAlpha*a);
}`;
const LVS = `#version 300 es
precision highp float;
layout(location=0) in vec3 a; uniform mat4 uVP;
void main(){ gl_Position=uVP*vec4(a,1.); }`;
const LFS = `#version 300 es
precision highp float; uniform vec4 uCol; out vec4 o;
void main(){ o=uCol; }`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s)); return s; }
function mk(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p)); return p; }

// lưới hộp (z 0..1) và mái (lăng trụ, đỉnh dọc trục x)
function boxMesh() {
  const v = []; const q = (n, pts) => { for (const i of [0, 1, 2, 0, 2, 3]) v.push(...pts[i], ...n); };
  q([0, 0, 1], [[-.5, -.5, 1], [.5, -.5, 1], [.5, .5, 1], [-.5, .5, 1]]);
  q([0, -1, 0], [[-.5, -.5, 0], [.5, -.5, 0], [.5, -.5, 1], [-.5, -.5, 1]]);
  q([0, 1, 0], [[.5, .5, 0], [-.5, .5, 0], [-.5, .5, 1], [.5, .5, 1]]);
  q([1, 0, 0], [[.5, -.5, 0], [.5, .5, 0], [.5, .5, 1], [.5, -.5, 1]]);
  q([-1, 0, 0], [[-.5, .5, 0], [-.5, -.5, 0], [-.5, -.5, 1], [-.5, .5, 1]]);
  return new Float32Array(v);
}
function roofMesh() {
  const v = []; const q = (n, pts) => { for (const i of [0, 1, 2, 0, 2, 3]) v.push(...pts[i], ...n); };
  q([0, -.8, .6], [[-.5, -.5, 0], [.5, -.5, 0], [.5, 0, 1], [-.5, 0, 1]]);
  q([0, .8, .6], [[.5, .5, 0], [-.5, .5, 0], [-.5, 0, 1], [.5, 0, 1]]);
  v.push(.5, -.5, 0, 1, 0, 0, .5, .5, 0, 1, 0, 0, .5, 0, 1, 1, 0, 0);
  v.push(-.5, .5, 0, -1, 0, 0, -.5, -.5, 0, -1, 0, 0, -.5, 0, 1, -1, 0, 0);
  return new Float32Array(v);
}

function initGL(plan) {
  prog = mk(VS, FS); gprog = mk(GVS, GFS);
  for (const k of ['uVP', 'uPass', 'uShadow', 'uPick', 'uEye', 'uFog', 'uUnits', 'uSun', 'uNight', 'uCut', 'uCutNhom', 'uTang']) U_[k] = gl.getUniformLocation(prog, k);
  for (const k of ['uVP', 'uFog', 'uTex', 'uOrigin', 'uSize', 'uPad', 'uRot', 'uMask', 'uDim', 'uAlpha', 'uNight', 'uFeather', 'uZ', 'uId', 'uSt']) U_['g_' + k] = gl.getUniformLocation(gprog, k);
  nInst = U.length + TOWERS.length;
  stat = gl.createBuffer(); dyn = gl.createBuffer();
  const mkVAO = mesh => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindBuffer(gl.ARRAY_BUFFER, stat);
    [[2, 4, 0], [3, 4, 16], [4, 4, 32]].forEach(([loc, n, off]) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 48, off); gl.vertexAttribDivisor(loc, 1); });
    gl.bindBuffer(gl.ARRAY_BUFFER, dyn);
    gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 2, gl.FLOAT, false, 8, 0); gl.vertexAttribDivisor(5, 1);
    return vao;
  };
  lprog = mk(LVS, LFS); U_.l_uVP = gl.getUniformLocation(lprog, 'uVP'); U_.l_uCol = gl.getUniformLocation(lprog, 'uCol');
  const bm = boxMesh(), rm = roofMesh();
  boxVAO = mkVAO(bm); roofVAO = mkVAO(rm); boxVAO.n = bm.length / 6; roofVAO.n = rm.length / 6;
  gVAO = gl.createVertexArray(); gl.bindVertexArray(gVAO);
  const gb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, gb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  planTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, planTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plan);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  uploadStatic(); refreshStates();
}

function colorOf(u) {
  if (state.mode === 'status' && hasInv()) { const i = unitInv(u); return i && STATUS[i.status] ? STATUS[i.status][1] : [.45, .46, .46]; }
  return TYPES[u.t].col;
}
function uploadStatic() {
  const a = new Float32Array(nInst * 12);
  U.forEach((u, i) => {
    const ty = TYPES[u.t], c = colorOf(u), o = i * 12;
    a.set([u.x, W(u.y), u.bw, u.bh, 0, ty.floors * FLOOR_H, u.bw < u.bh ? 1 : 0, ty.roof, c[0], c[1], c[2], 1], o);
  });
  TOWERS.forEach((t, j) => { const o = (U.length + j) * 12; a.set([t.x, W(t.y), t.w, t.h, t.z0 || 0, t.z, NHOM[t.khoi] || 0, 0, ...t.col, 1], o); });
  gl.bindBuffer(gl.ARRAY_BUFFER, stat); gl.bufferData(gl.ARRAY_BUFFER, a, gl.DYNAMIC_DRAW);
  pickDirty = true; dirty = true;
}
function inCart(k) { return state.cart.some(c => c.k === k); }
function refreshStates() {
  const a = new Float32Array(nInst * 2);
  const zoneOf = i => i < U.length ? 'casa' : TOWERS[i - U.length].zone;
  for (let i = 0; i < nInst; i++) {
    let s = 0; const z = zoneOf(i);
    const out = state.zone !== 'all' && z !== state.zone || (z === 'casa' && state.type >= 0 && U[i].t !== state.type);
    let lech = false;
    if (state.market !== 'all' && i < U.length && hasInv()) {
      const it = unitInv(U[i]);
      const sc = it && it.status !== 'sold';
      lech = state.market === 'primary' ? !sc : !(it && it.status === 'sold');
    }
    if (out || lech) s = 4;
    const den = i >= U.length && TOWERS[i - U.length].can;
    if (den) { s = out ? 4 : inCart('can:' + den) ? 6 : i === state.hover ? 7 : 5; a[i * 2] = s; a[i * 2 + 1] = i + 1; continue; }
    if (i < U.length ? inCart('u:' + i) : inCart('z:' + z)) s = 2;
    if (i === state.hover) s = 1;
    if (i === state.sel) s = 3;
    a[i * 2] = s; a[i * 2 + 1] = i + 1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, dyn); gl.bufferData(gl.ARRAY_BUFFER, a, gl.DYNAMIC_DRAW);
  dirty = true;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = pickDirty = true; }
}
function viewProj() {
  const cp = Math.cos(C.pitch), e = [C.tx + C.dist * Math.sin(C.yaw) * cp, C.ty - C.dist * Math.cos(C.yaw) * cp, C.tz + C.dist * Math.sin(C.pitch)];
  const near = Math.max(2, C.dist * .04);
  return { vp: M.mul(M.persp(.66, canvas.width / canvas.height, near, 60000), M.look(e, [C.tx, C.ty, C.tz], [0, 0, 1])), eye: e };
}
let lastVP = null;
const FOG = [.086, .106, .094];
function drawScene(pick) {
  const { vp, eye } = viewProj(); lastVP = vp;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  if (pick) { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.BLEND); }
  else {
    gl.clearColor(...FOG, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawGround(vp);
  }
  gl.useProgram(prog);
  gl.uniformMatrix4fv(U_.uVP, false, vp); gl.uniform3fv(U_.uEye, eye); gl.uniform3fv(U_.uFog, FOG);
  gl.uniform1f(U_.uUnits, U.length + .5); gl.uniform1f(U_.uCut, catHienTai()); gl.uniform1f(U_.uCutNhom, state.mb ? NHOM[state.mb.khu] : 0);
  gl.uniform2f(U_.uTang, donVi(CAO_TANG), donVi(SO_TANG_DE * CAO_DE)); gl.uniform1i(U_.uPick, pick ? 1 : 0);
  const sun = SUN || { az: 135, el: 50 };
  const hz = geo.dir(sun.az), el = Math.max(sun.el, 4), tan = Math.tan(rad(el));
  const len = Math.min(2.6, 1 / tan);
  gl.uniform3f(U_.uSun, hz[0] * Math.cos(rad(el)), hz[1] * Math.cos(rad(el)), Math.sin(rad(el)));
  gl.uniform1f(U_.uNight, nightLevel());
  gl.uniform2f(U_.uShadow, -hz[0] * len, -hz[1] * len);
  if (!pick) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (state.blocks) { gl.uniform1i(U_.uPass, 2); gl.bindVertexArray(boxVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nInst); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  if (state.blocks || pick) {
    gl.uniform1i(U_.uPass, 0); gl.bindVertexArray(boxVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, boxVAO.n, nInst);
    gl.uniform1i(U_.uPass, 1); gl.bindVertexArray(roofVAO); gl.drawArraysInstanced(gl.TRIANGLES, 0, roofVAO.n, U.length);
  }
  if (!pick) { veMatBang(vp); drawRanh(vp); }
}
function nightLevel() { if (state.night) return 1; const e = (SUN || { el: 45 }).el; return e > 2 ? 0 : e < -6 ? 1 : (2 - e) / 8; }
function drawGround(vp) {
  const night = nightLevel();
  const osmOn = osm.tex && (state.base === 'osm' || state.base === 'blend');
  gl.useProgram(gprog); gl.uniformMatrix4fv(U_.g_uVP, false, vp); gl.uniform3fv(U_.g_uFog, FOG);
  gl.uniform1i(U_.g_uTex, 0); gl.uniform1f(U_.g_uNight, night); gl.uniform1f(U_.g_uFeather, 0); gl.uniform1f(U_.g_uZ, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindVertexArray(gVAO); gl.depthMask(false);
  // lớp 1: ảnh tổng mặt bằng (ở chế độ "bản đồ thật" chỉ còn là nền mờ bao quanh)
  gl.bindTexture(gl.TEXTURE_2D, planTex);
  gl.uniform2f(U_.g_uOrigin, PLAN_W / 2, PLAN_H / 2); gl.uniform2f(U_.g_uSize, PLAN_W, PLAN_H);
  gl.uniform2f(U_.g_uPad, 2.708, 3.148); gl.uniform1f(U_.g_uRot, 0);
  gl.uniform1i(U_.g_uMask, 1); gl.uniform1f(U_.g_uDim, state.base === 'osm' ? (osm.tex ? 1 : .4) : 0); gl.uniform1f(U_.g_uAlpha, 1);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  // lớp 2: khảm xa, rộng gấp bốn khu đất, cho thấy biển và phố xung quanh
  if (osmOn && osmXa.tex) {
    gl.bindTexture(gl.TEXTURE_2D, osmXa.tex);
    gl.uniform2f(U_.g_uOrigin, osmXa.cx, osmXa.cy); gl.uniform2f(U_.g_uSize, osmXa.w, osmXa.h);
    gl.uniform2f(U_.g_uPad, 1, 1); gl.uniform1f(U_.g_uRot, -rad(geo.north));
    gl.uniform1i(U_.g_uMask, NEN.kieu === 've-tinh' ? 4 : 2); gl.uniform1f(U_.g_uDim, 0); gl.uniform1f(U_.g_uAlpha, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  if (osmOn && osmGiua.tex) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, osmGiua.tex);
    gl.uniform2f(U_.g_uOrigin, osmGiua.cx, osmGiua.cy); gl.uniform2f(U_.g_uSize, osmGiua.w, osmGiua.h);
    gl.uniform2f(U_.g_uPad, 1, 1); gl.uniform1f(U_.g_uRot, -rad(geo.north)); gl.uniform1f(U_.g_uFeather, osmXa.tex ? .06 : 0);
    gl.uniform1i(U_.g_uMask, NEN.kieu === 've-tinh' ? 4 : 2); gl.uniform1f(U_.g_uDim, 0); gl.uniform1f(U_.g_uAlpha, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.uniform1f(U_.g_uFeather, 0); gl.disable(gl.BLEND);
  }
  // lớp 3: khảm gần, đúng khu đất, phân giải cao
  if (osmOn) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, osm.tex);
    gl.uniform2f(U_.g_uOrigin, osm.cx, osm.cy); gl.uniform2f(U_.g_uSize, osm.w, osm.h);
    gl.uniform2f(U_.g_uPad, 1, 1); gl.uniform1f(U_.g_uRot, -rad(geo.north));
    gl.uniform1f(U_.g_uFeather, osmGiua.tex || osmXa.tex ? .07 : 0);
    gl.uniform1i(U_.g_uMask, NEN.kieu === 've-tinh' ? 4 : 2); gl.uniform1f(U_.g_uDim, 0); gl.uniform1f(U_.g_uAlpha, state.base === 'blend' ? .55 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.uniform1f(U_.g_uFeather, 0); gl.disable(gl.BLEND);
  }
  gl.depthMask(true);
}
function ensureFbo() {
  if (fbo && fboW === canvas.width && fboH === canvas.height) return;
  fboW = canvas.width; fboH = canvas.height;
  if (!fbo) { fbo = gl.createFramebuffer(); fboTex = gl.createTexture(); fboDepth = gl.createRenderbuffer(); }
  gl.bindTexture(gl.TEXTURE_2D, fboTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fboW, fboH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindRenderbuffer(gl.RENDERBUFFER, fboDepth); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fboW, fboH);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fboDepth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
const px = new Uint8Array(4);
function pickAt(cx, cy) {
  ensureFbo();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); drawScene(true);
  const r = canvas.getBoundingClientRect(), x = Math.floor((cx - r.left) * canvas.width / r.width), y = Math.floor(canvas.height - (cy - r.top) * canvas.height / r.height - 1);
  gl.readPixels(Math.max(0, Math.min(canvas.width - 1, x)), Math.max(0, Math.min(canvas.height - 1, y)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const id = px[0] | px[1] << 8 | px[2] << 16;
  return id > 0 && id <= nInst ? id - 1 : -1;
}

/* ---------- ranh khu đất thật ---------- */
function buildRanh() {
  if (!RANH || !geo.ok || !gl || !lprog) return;
  const v = [];
  for (const [la, lo] of RANH.diem) { const [x, y] = geo.world(la, lo); v.push(x, y, 1.2); }
  ranhN = RANH.diem.length;
  ranhVAO = gl.createVertexArray(); gl.bindVertexArray(ranhVAO);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null); dirty = true;
}
function drawRanh(vp) {
  if (!ranhVAO || !state.ranh) return;
  gl.useProgram(lprog); gl.uniformMatrix4fv(U_.l_uVP, false, vp);
  gl.uniform4f(U_.l_uCol, .93, .78, .36, .95);
  gl.bindVertexArray(ranhVAO); gl.disable(gl.DEPTH_TEST);
  gl.drawArrays(gl.LINE_LOOP, 0, ranhN); gl.enable(gl.DEPTH_TEST);
}

/* ---------- ảnh nền bản đồ thật ---------- */
// Ô ảnh đi qua /api/nen để khoá của nhà cung cấp không lộ ra trình duyệt.
// Mở trang bằng file:// thì không có API, tự quay về OpenStreetMap trực tiếp.
const NEN = { kieu: 'duong-pho', ghiNhan: '© những người đóng góp OpenStreetMap', qua: 'api' };
async function hoiNen() {
  try {
    const r = await fetch('/api/nen-ban-do', { cache: 'no-cache' });
    if (!r.ok) throw 0;
    const d = await r.json();
    if (d && d.ghiNhan) { NEN.kieu = d.kieu || NEN.kieu; NEN.ghiNhan = d.ghiNhan; }
    // Chưa cấu hình nhà cung cấp riêng thì lấy thẳng OpenStreetMap, khỏi gọi vòng qua API.
    if (!d || !d.rieng) NEN.qua = 'osm';
  } catch { NEN.qua = 'osm'; }
}
const urlTile = (z, x, y) => NEN.qua === 'api'
  ? `/api/nen/${z}/${x}/${y}`
  : `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
const osm = { tex: null, cx: 0, cy: 0, w: 0, h: 0, zoom: 0, soTile: 0 };
const osmXa = { tex: null, cx: 0, cy: 0, w: 0, h: 0, zoom: 0, soTile: 0 };
const osmGiua = { tex: null, cx: 0, cy: 0, w: 0, h: 0, zoom: 0, soTile: 0 };   // vành giữa: phố, biển quanh dự án
const tileX = (lon, n) => (lon + 180) / 360 * n;
const tileY = (lat, n) => { const r = rad(lat); return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; };
const lonOf = (x, n) => x / n * 360 - 180;
const latOf = (y, n) => deg(Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))));
function tai1Tile(url) {
  return new Promise(res => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = url;
  });
}
// Ghép một khảm ảnh nền. "ra" là hệ số nới rộng quanh tâm mặt bằng:
// 1 là vừa khít khu đất, lớn hơn thì thấy thêm biển, núi và phố xung quanh.
async function ghepKham(dich, ra, toiDa, zCao, zThap, choPhepLui, theoRanh) {
  // theoRanh: lấy khung theo ranh dự án (KML) thay vì cả tấm ảnh tổng mặt bằng — ảnh nét chỉ cần ở chỗ có căn.
  const dinh = theoRanh && RANH && (RANH.dinh || RANH.diem || RANH.toaDo);
  const goc = dinh && dinh.length > 2 ? dinh.map(p => [p[0], p[1]])
    : [[0, 0], [PLAN_W, 0], [PLAN_W, PLAN_H], [0, PLAN_H]].map(([px, py]) => geo.latLon(px, PLAN_H - py));
  const la = goc.map(g => g[0]), lo = goc.map(g => g[1]);
  const cLat = (Math.min(...la) + Math.max(...la)) / 2, cLon = (Math.min(...lo) + Math.max(...lo)) / 2;
  const nLat = (Math.max(...la) - Math.min(...la)) / 2 * ra, nLon = (Math.max(...lo) - Math.min(...lo)) / 2 * ra;
  const lats = [cLat - nLat, cLat + nLat], lons = [cLon - nLon, cLon + nLon];
  let z = zCao, tx0, tx1, ty0, ty1, n;
  for (; z >= zThap; z--) {
    n = Math.pow(2, z);
    tx0 = Math.floor(tileX(Math.min(...lons), n)); tx1 = Math.floor(tileX(Math.max(...lons), n));
    ty0 = Math.floor(tileY(Math.max(...lats), n)); ty1 = Math.floor(tileY(Math.min(...lats), n));
    if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) <= toiDa) break;
  }
  const cv = document.createElement('canvas');
  cv.width = (tx1 - tx0 + 1) * 256; cv.height = (ty1 - ty0 + 1) * 256;
  const cx2 = cv.getContext('2d');
  const keo = () => {
    const js = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++)
      js.push(tai1Tile(urlTile(z, tx, ty)).then(im => { if (im) cx2.drawImage(im, (tx - tx0) * 256, (ty - ty0) * 256); return !!im; }));
    return Promise.all(js);
  };
  let duoc = (await keo()).filter(Boolean).length;
  if (!duoc && choPhepLui && NEN.qua === 'api') {
    // Nhà cung cấp riêng hỏng: quay về OpenStreetMap và sửa lại dòng ghi nguồn cho đúng.
    NEN.qua = 'osm'; NEN.kieu = 'duong-pho'; NEN.ghiNhan = '© những người đóng góp OpenStreetMap';
    duoc = (await keo()).filter(Boolean).length;
  }
  if (!duoc) throw Error('khong tai duoc tile');
  const lonW = lonOf(tx0, n), lonE = lonOf(tx1 + 1, n), latN = latOf(ty0, n), latS = latOf(ty1 + 1, n);
  const [wx, wy] = geo.world((latN + latS) / 2, (lonW + lonE) / 2);
  dich.cx = wx; dich.cy = wy;
  dich.w = (lonE - lonW) * geo.mLon / geo.mpu;
  dich.h = (latN - latS) * geo.mLat / geo.mpu;
  dich.zoom = z; dich.soTile = duoc;
  if (!dich.tex) dich.tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, dich.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
async function loadOsm() {
  if (state.osm === 'dang' || state.osm === 'xong') return;
  if (!geo.ok) { state.osm = 'loi'; render(); return; }
  state.osm = 'dang'; render();
  try {
    // Lớp gần: trong ranh dự án, nạp z17 trước cho nhanh.
    await ghepKham(osm, 1.15, 48, 17, 13, true, true);
    state.osm = 'xong'; dirty = true; render();
    // Lớp xa: rộng gấp bốn, để thấy biển, Bãi Sau và phố xung quanh. Hỏng cũng không sao.
    // Hai vành ngoài: vành giữa rộng gấp 4,5 khu đất ở z15, vành xa rộng khoảng 28 km ở z13. Hỏng cũng không sao.
    try { await ghepKham(osmGiua, 4.5, 48, 15, 12, false); dirty = true; } catch (e) { /* bỏ qua */ }
    try { await ghepKham(osmXa, 14, 42, 13, 10, false); dirty = true; } catch (e) { /* bỏ qua */ }
    // Nâng lớp gần lên z18 (0,6 m mỗi điểm ảnh) để nhìn rõ từng căn ở độ cao 500–1000 m.
    // Chỉ làm trên máy có texture đủ lớn; điện thoại yếu giữ z17. Hỏng thì giữ bản z17.
    if (CHUP || (gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096 && !(navigator.connection && navigator.connection.saveData))) {
      const tam = { tex: null };
      try { await ghepKham(tam, 1.15, 196, 18, 18, false, true);
        if (tam.soTile) { if (osm.tex) gl.deleteTexture(osm.tex); Object.assign(osm, tam); dirty = true; render(); } }
      catch (e) { if (tam.tex) gl.deleteTexture(tam.tex); }
    }
    if (CHUP) {
      state.hideLabels = true; fly(gocDoCao(+(new URLSearchParams(location.search).get('docao') || 1000)), true);
      dirty = true; requestAnimationFrame(() => requestAnimationFrame(() => { window.__sanSangChup = true; }));
    }
  } catch (e) {
    console.warn('Không tải được ô bản đồ:', e.message || e);
    state.osm = 'loi'; if (state.base !== 'plan') state.base = 'plan';
  }
  render();
}


/* ---------- mặt bằng tầng trên mặt cắt (PROJECT_RULES §16.3) ---------- */
// Nhãn tầng Beacon: bỏ số 13 và 14, thay bằng 12A, 12B như trong bảng hàng chủ đầu tư.
const TANG_BEACON = (() => { const t = []; for (let i = 1; i <= 40; i++) t.push(i === 13 ? '12A' : i === 14 ? '12B' : String(i)); return t; })();
const tangNhan = (t) => String(t).replace(/^0+(?=\d)/, '');                 // '07' -> '7'
const tangSo = (t) => TANG_BEACON.indexOf(tangNhan(t)) + 1;                   // tầng vật lý
const tangMa = (t) => /^\d$/.test(t) ? '0' + t : t;                           // nhãn tầng trong mã căn: '7' -> '07'
const LOAI_TEN = { 'STU': 'Studio', '1BR+': '1PN+', '2BR': '2PN', '2BR+': '2PN+', '3BR': '3PN', '3BR+': '3PN+' };
const tenLoai = (l) => LOAI_TEN[l] || l;
const mbDung = () => (state.mb && MB && MB[state.mb.khu] && MB[state.mb.khu].tangDung.includes(state.mb.tang)) ? MB[state.mb.khu] : null;
const maDayDu = (c, tang) => c.toa + tangMa(tang) + c.so;
const mbCoTang = (c) => MB && MB[c.phanKhu] && MB[c.phanKhu].tangDung.includes(tangNhan(c.tang));
const TEN_KHU = { beacon: 'Beacon', beachtro: 'Beachtro' };
const khuMB = () => (state.mb && state.mb.khu) || 'beacon';
const mbTex = { anh: null, id: null, st: null, khu: null };
function tangMacDinh(khu = 'beacon') {
  const d = MB && MB[khu]; if (!d) return '15';
  const c = CAN && CAN.can.filter(x => x.phanKhu === khu && x.tinhTrang === 'trong' && d.tangDung.includes(tangNhan(x.tang)))
    .sort((a, b) => tangSo(b.tang) - tangSo(a.tang))[0];
  return c ? tangNhan(c.tang) : d.tangDung[Math.floor(d.tangDung.length / 2)];
}
function dsTang() {
  const d = MB && MB[khuMB()], max = d && d.toa ? Math.max(...d.toa.map(o => o.tangCuoi)) : 38;
  return TANG_BEACON.slice(2, max);
}
function hopDeBeacon() { return TOWERS.find(o => o.khoi === khuMB() && o.name.startsWith('Khối đế')); }
function caoTang(tang) { return donVi(caoM(tangSo(tang))); }
function catHienTai() { return state.mb ? caoTang(state.mb.tang) + .02 : (state.cut || -1); }
function napAnhMB(d) {
  if (mbTex.khu === d.anh || !gl) return;
  mbTex.khu = d.anh;
  const im = new Image();
  im.onload = () => {
    const tex = (src, nearest) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      if (nearest) { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); }
      else { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    mbTex.img = im; mbTex.anh = gl.createTexture(); veNhanMB();
    // bản đồ mã căn: mỗi căn tô một màu đỏ = thứ tự căn + 1; bỏ điểm viền mờ để không lẫn sang căn bên cạnh
    const cv = document.createElement('canvas'); cv.width = d.rong; cv.height = d.cao;
    const cx = cv.getContext('2d');
    d.can.forEach((c, i) => { cx.fillStyle = `rgb(${i + 1},0,0)`; cx.beginPath(); c.poly.forEach(([x, y], j) => j ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.closePath(); cx.fill(); });
    const px2 = cx.getImageData(0, 0, d.rong, d.cao);
    for (let i = 0; i < px2.data.length; i += 4) if (px2.data[i + 3] < 200) { px2.data[i] = 0; px2.data[i + 3] = 0; }
    mbTex.id = tex(px2, true);
    mbTex.st = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, mbTex.st); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(256));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    capNhatTrangThaiMB(); dirty = true;
  };
  im.src = d.anh;
}
// Ảnh dán lên mặt cắt: mặt bằng thật của chủ đầu tư + viền và mã từng căn theo tầng đang xem.
function veNhanMB() {
  const d = mbDung(); if (!d || !mbTex.img || !mbTex.anh) return;
  const k = 2, cv = document.createElement('canvas'); cv.width = d.rong * k; cv.height = d.cao * k;
  const x = cv.getContext('2d'); x.drawImage(mbTex.img, 0, 0, cv.width, cv.height);
  x.lineJoin = 'round';
  for (const c of d.can) {
    x.beginPath(); c.poly.forEach(([px, py], j) => j ? x.lineTo(px * k, py * k) : x.moveTo(px * k, py * k)); x.closePath();
    x.strokeStyle = 'rgba(30,30,30,.75)'; x.lineWidth = 2.2; x.stroke();
    const xs = c.poly.map(p => p[0]), ys = c.poly.map(p => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 * k, cy = (Math.min(...ys) + Math.max(...ys)) / 2 * k, rw = (Math.max(...xs) - Math.min(...xs)) * k;
    const ma = maDayDu(c, state.mb.tang);
    let fs = 22; x.font = `700 ${fs}px system-ui, sans-serif`;
    while (fs > 11 && x.measureText(ma).width > rw * .92) { fs -= 1; x.font = `700 ${fs}px system-ui, sans-serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = x.measureText(ma).width + 10;
    x.fillStyle = 'rgba(255,255,255,.88)'; x.fillRect(cx - w / 2, cy - fs * .7, w, fs * 1.4);
    x.fillStyle = '#1d1a14'; x.fillText(ma, cx, cy + 1);
  }
  gl.bindTexture(gl.TEXTURE_2D, mbTex.anh);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);       // hàng trên ảnh = phía Bắc, khớp mbHit
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  dirty = true;
}
function canQuy(ma) { return CAN && CAN.can.find(x => x.ma === ma); }
function capNhatTrangThaiMB() {
  const d = mbDung(); if (!d || !mbTex.st) { dirty = true; return; }
  const a = new Uint8Array(256);
  d.can.forEach((c, i) => {
    const q = canQuy(maDayDu(c, state.mb.tang));
    a[i * 4] = q ? (q.tinhTrang === 'trong' ? 255 : 128) : 0;
    a[i * 4 + 1] = state.mb.sel === i ? 255 : 0;
    a[i * 4 + 2] = state.mb.hover === i ? 255 : 0;
    a[i * 4 + 3] = 255;
  });
  gl.bindTexture(gl.TEXTURE_2D, mbTex.st); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 1, gl.RGBA, gl.UNSIGNED_BYTE, a);
  dirty = true;
}
function veMatBang(vp) {
  const d = mbDung(), b = hopDeBeacon();
  if (!d || !b || !mbTex.anh || !state.blocks) return;
  gl.useProgram(gprog); gl.uniformMatrix4fv(U_.g_uVP, false, vp);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mbTex.anh);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mbTex.id);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, mbTex.st);
  gl.uniform1i(U_.g_uTex, 0); gl.uniform1i(U_.g_uId, 1); gl.uniform1i(U_.g_uSt, 2);
  gl.uniform2f(U_.g_uOrigin, b.x, W(b.y)); gl.uniform2f(U_.g_uSize, b.w, b.h); gl.uniform2f(U_.g_uPad, 1, 1); gl.uniform1f(U_.g_uRot, 0);
  gl.uniform1i(U_.g_uMask, 5); gl.uniform1f(U_.g_uNight, nightLevel()); gl.uniform1f(U_.g_uZ, caoTang(state.mb.tang) + .08);
  gl.bindVertexArray(gVAO); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.uniform1f(U_.g_uZ, 0); gl.activeTexture(gl.TEXTURE0);
}
function trongDaGiac(x, y, poly) {
  let o = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) o = !o;
  }
  return o;
}
function mbHit(cx, cy) {
  const d = mbDung(), b = hopDeBeacon(); if (!d || !b) return -1;
  const g = tiaMatDat(cx, cy, caoTang(state.mb.tang) + .08); if (!g) return -1;
  const u = (g[0] - (b.x - b.w / 2)) / b.w, v = ((PLAN_H - g[1]) - (b.y - b.h / 2)) / b.h;
  if (u < 0 || u > 1 || v < 0 || v > 1) return -1;
  return d.can.findIndex(c => trongDaGiac(u * d.rong, v * d.cao, c.poly));
}
function moMatBang(tang, maMB, khu) {
  khu = khu || (state.mb && state.mb.khu) || (MB && MB[state.zone] ? state.zone : 'beacon');
  if (!MB || !MB[khu]) return;
  tang = tangNhan(tang);
  const moi = !state.mb || state.mb.khu !== khu;
  state.mb = { khu, tang, sel: -1, hover: -1 };
  state.zone = khu; state.sel = -1; state.tab = 'unit'; state.consignMa = null;
  const d = mbDung();
  if (d) { if (mbTex.khu !== d.anh) { mbTex.anh = mbTex.img = null; } napAnhMB(d); veNhanMB(); if (maMB) state.mb.sel = d.can.findIndex(c => c.toa + c.so === maMB); }
  const b = hopDeBeacon(), h = caoTang(tang);
  if (b && (moi || maMB)) fly({ tx: b.x, ty: W(b.y) - 18, tz: h, dist: innerWidth < 860 ? 270 : 175, pitch: 1.12, yaw: T.yaw });
  else if (b) fly({ ...T, tz: h });
  refreshStates(); capNhatTrangThaiMB(); render();
}
function dongMatBang() { state.mb = null; state.consignMa = null; $('#tip').hidden = true; const b = hopDeBeacon(); fly({ ...T, tz: 0 }); dirty = true; render(); }
function buocTang(d) {
  if (!state.mb) return;
  const i = TANG_BEACON.indexOf(state.mb.tang), j = Math.max(2, Math.min(dsTang().length + 1, i + d));
  if (j !== i) moMatBang(TANG_BEACON[j]);
}
function chonCanMB(k) {
  if (!state.mb) return;
  state.mb.sel = k; state.tab = 'unit'; state.keepScroll = false; capNhatTrangThaiMB(); render();
  if (innerWidth < 860) { const p = $('#panel'); if (p) p.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
}
function veThanhMB() {
  let el = $('#mbBar');
  if (!state.mb) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'mbBar'; el.className = 'mbbar'; $('#stage').append(el); }
  const d = mbDung();
  el.hidden = false;
  el.innerHTML = `<span class="dot"></span><span><span class="pre">Mặt cắt 3D · ${TEN_KHU[state.mb.khu]} · </span><b>Tầng ${esc(state.mb.tang)}</b>${d ? ` <span class="mute">(mặt bằng điển hình ${esc(d.tenTang)})</span>` : ' <span class="mute">· mặt bằng tầng này chưa số hoá</span>'}</span>
    <button type="button" data-mbbuoc="-1" aria-label="Xuống một tầng">−</button><button type="button" data-mbbuoc="1" aria-label="Lên một tầng">+</button>
    <button type="button" class="dong" data-mbdong="1">Hiện đủ ✕</button>`;
}
// Tiến độ thanh toán Beacon theo CSBH02/B-BC/SPG/07-2026 (áp dụng từ 10/07/2026), Tú gửi trong thư mục CSBH 19/11/2026.
// Giá trong quỹ đã gồm VAT 10% và KPBT 2% tính trên giá chưa VAT, nên giá chưa VAT = giá quỹ / 1,12.
const CSBH_BEACON = { ma: 'CSBH02/B-BC/SPG/07-2026', tu: '10/07/2026', ckKhongVay: .05, htlsThang: 30, htlsDen: '2029-01-31', nhanNha: '31/05/2028', banGiao: '31/05/2030' };
function tienDoBeacon(c, cach) {
  const gia = c.gia, P0 = gia / 1.12, G = P0 * 1.1, KPBT = gia - G, coc = /^3BR/.test(c.loai) ? 150e6 : 100e6;
  const r = [['Ký HĐTHNV (đặt cọc)', coc, 'Khi ký'], ['Thanh toán lần 2, đủ 15% giá trị căn hộ', .15 * G - coc, 'Ngày thứ 10']];
  if (cach === 'vay') {
    r.push(['Ký HĐMB · ngân hàng giải ngân tối đa 70%', .7 * G, 'Trong 15 ngày sau ký HĐMB (khoảng ngày 55)', 1]);
    r.push(['Thanh toán lần 4', .1 * G, 'Ngày thứ 100']);
    r.push(['Bàn giao: 100% KPBT và VAT của 5% cuối', KPBT + .005 * P0, `Dự kiến ${CSBH_BEACON.nhanNha}`]);
  } else {
    [100, 220, 340, 460, 580].forEach((n, i) => r.push([`Thanh toán lần ${i + 3}`, .1 * G, `Ngày thứ ${n}`]));
    r.push(['Thanh toán lần 8 · đủ 70%, được nhận nhà để ở', .05 * G, 'Ngày thứ 670']);
    [820, 970, 1120, 1270, 1420].forEach((n, i) => r.push([`Thanh toán lần ${i + 9}`, .05 * G, `Ngày thứ ${n}`]));
    r.push(['Bàn giao chính thức: 100% KPBT và VAT của 5% cuối', KPBT + .005 * P0, `Dự kiến ${CSBH_BEACON.banGiao}`]);
  }
  r.push(['Ký quỹ cấp sổ 5% (chưa VAT), chủ đầu tư trả lãi 8%/năm', .05 * P0, 'Cùng đợt bàn giao, khấu trừ khi nhận sổ']);
  return { r, gia, P0, G, KPBT, vay: cach === 'vay' ? .7 * G : 0, ck: cach === 'vay' ? 0 : CSBH_BEACON.ckKhongVay * P0 };
}
function goiBanTinh(c, t) {
  const hom = new Date(), ngay = (n) => { const x = new Date(hom.getTime() + n * 864e5); return x.toISOString().slice(0, 10); };
  const bd = ngay(55), den = new Date(CSBH_BEACON.htlsDen + 'T00:00:00');
  const thang = Math.max(0, Math.min(CSBH_BEACON.htlsThang, Math.floor((den - new Date(bd + 'T00:00:00')) / (30.44 * 864e5))));
  const p = { v: 1, src: { project: 'Blanca City · Beacon Tower', unit: c.ma, method: 'Vay hỗ trợ lãi suất · ' + CSBH_BEACON.ma },
    f: { limit: Math.round(t.vay), start: bd, months: 300, method: 'emi', promo: 7, promoMonths: 12, floating: 10.5, grace: thang, basis: 'monthly', due: 'anniv', repay: 'recast', rateMode: 'period', price: Math.round(t.gia), htls: thang, htlsPct: 100 },
    tranches: [{ date: bd, amount: Math.round(t.vay) }] };
  return '/ban-tinh-tai-chinh/#nhan=' + btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function layoutSvg(d, c) {
  const [x0, y0] = d.khung, xs = c.poly.map(p => p[0] + x0), ys = c.poly.map(p => p[1] + y0), pad = 46;
  const bx = Math.min(...xs) - pad, by = Math.min(...ys) - pad, bw = Math.max(...xs) - Math.min(...xs) + pad * 2, bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
  return `<svg class="mblayout" viewBox="${bx} ${by} ${bw} ${bh}" role="img" aria-label="Layout căn ${esc(c.ma)} trên mặt bằng tầng"><image href="${esc(d.nguon)}" width="1728" height="972"/><polygon points="${c.poly.map(p => (p[0] + x0) + ',' + (p[1] + y0)).join(' ')}" fill="#e8743b22" stroke="#e8743b" stroke-width="3"/></svg>`;
}
function mbHtml() {
  const m = state.mb, d = mbDung();
  const ds = dsTang(), dung = new Set(MB[m.khu].tangDung), ten = TEN_KHU[m.khu];
  const chon = `<label class="small">Tầng <select id="mbTangSel">${ds.map(t => `<option value="${t}"${t === m.tang ? ' selected' : ''}>Tầng ${t}${dung.has(t) ? '' : ' (chưa số hoá)'}</option>`).join('')}</select></label>`;
  let h = `<p><button class="chip" data-mbdong="1">← Hiện đủ khối</button></p><h2>Mặt bằng ${ten} · Tầng ${esc(m.tang)}</h2>${chon}`;
  if (!d) return h + `<div class="note">Tầng ${esc(m.tang)} có mặt bằng riêng trong hồ sơ, chưa số hoá để chọn căn trên khối 3D. Xem bản vẽ ở hồ sơ ${ten} hoặc chọn tầng ${esc(MB[m.khu].tenTang)}.</div>`;
  const q = d.can.map((c, i) => ({ c, i, k: canQuy(maDayDu(c, m.tang)) }));
  const coQuy = CAN && CAN.can.some(x => x.phanKhu === m.khu);
  const trong = q.filter(x => x.k && x.k.tinhTrang === 'trong'), coc = q.filter(x => x.k && x.k.tinhTrang === 'coc');
  h += `<p class="mbchu small"><span class="o trong"></span>Còn trống trong quỹ đại lý <span class="o coc"></span>Đã cọc <span class="o"></span>Chưa có trong quỹ đại lý</p>`;
  if (m.sel >= 0 && d.can[m.sel]) h += mbCard(d, d.can[m.sel], m.tang);
  else h += `<div class="note">Chạm vào một căn trên mặt bằng tầng ${esc(m.tang)} để xem ${coQuy ? 'giá, layout và tiến độ thanh toán' : 'loại căn, diện tích và layout'}. Dùng − + ở thanh trên hoặc dải tầng bên phải để đổi tầng.</div>`;
  h += `<h3>Căn trong quỹ đại lý ở tầng ${esc(m.tang)}</h3>` + (trong.length + coc.length
    ? `<div class="mbds">${[...trong, ...coc].map(x => `<button class="chip" data-mbcan="${x.i}" aria-pressed="${m.sel === x.i}">${esc(x.k.ma)} · ${esc(tenLoai(x.c.loai))} · ${x.k.tinhTrang === 'trong' ? tien(x.k.gia) : 'đã cọc'}</button>`).join('')}</div>`
    : !coQuy ? `<p class="mute small">Quỹ đại lý chưa có căn ${ten}. Mã, loại và diện tích lấy từ mặt bằng của chủ đầu tư; giá cập nhật khi có bảng hàng.</p>`
    : `<p class="mute small">Quỹ đại lý chưa có căn nào ở tầng này. Các tầng có căn: ${[...new Set(CAN.can.filter(x => x.phanKhu === m.khu).map(x => tangNhan(x.tang)))].sort((a, b) => tangSo(a) - tangSo(b)).map(t => `<button class="chip" style="padding:1px 8px" data-mbtang="${t}">${t}</button>`).join(' ')}</p>`);
  h += `<p class="mute small">Mặt bằng: ${esc(d.ghiChu)} Mã căn, loại và diện tích trên mặt bằng đọc từ ô nhãn của bản vẽ; giá và tình trạng chỉ có ở căn nằm trong quỹ đại lý (${esc(CAN.capNhat)}).</p>`;
  return h;
}
function mbCard(d, c, tang) {
  const ma = maDayDu(c, tang), k = canQuy(ma), cach = state.pttt || 'khong-vay';
  const tt = k ? (k.tinhTrang === 'trong' ? '<span class="tt trong">Còn trống</span>' : '<span class="tt coc">Đã cọc</span>') : '<span class="badge">Chưa có trong quỹ đại lý</span>';
  const kk = 'can:' + ma;
  let h = `<div class="card mbcard"><p class="mute small">${TEN_KHU[khuMB()]} · toà ${esc(c.toa)} · tầng ${esc(tang)} · căn ${esc(c.so)}</p>
    <h3>${esc(ma)} · ${esc(tenLoai(k ? k.loai : c.loai))}</h3><p>${tt}</p>
    <table class="kv"><tbody>
      <tr><td>Thông thủy</td><td class="r">${k && k.thongThuy ? k.thongThuy : c.thongThuy} m²${k ? '' : ' <span class="mute small">(theo mặt bằng)</span>'}</td></tr>
      <tr><td>Tim tường</td><td class="r">${k && k.timTuong ? k.timTuong : c.timTuong} m²${k ? '' : ' <span class="mute small">(theo mặt bằng)</span>'}</td></tr>
      <tr><td>Giá đã gồm VAT và KPBT</td><td class="r"><b>${k && k.gia ? tien(k.gia) : 'Liên hệ'}</b></td></tr>
    </tbody></table>
    ${layoutSvg(d, c)}
    <p class="mute small">Layout tách từ mặt bằng tầng điển hình của chủ đầu tư. <button class="chip" style="padding:1px 8px" data-zoom="${esc(d.nguon)}">Phóng to mặt bằng tầng</button></p>
    <div class="row"><button class="btn primary" data-mbhoi="${esc(ma)}">${inCart(kk) ? '✓ Đã thêm, xem giỏ' : 'Thêm vào giỏ · hỏi căn này'}</button><button class="btn" data-mbky="${esc(ma)}">Ký gửi căn này</button></div></div>`;
  if (k && k.gia) {
    const t = tienDoBeacon(k, cach), tong = t.r.reduce((s, x) => s + x[1], 0);
    h += `<h3>Tiến độ thanh toán</h3>
    <p class="seg" role="group" aria-label="Phương thức"><button type="button" data-pttt="khong-vay" aria-pressed="${cach !== 'vay'}">Không vay · giãn 48 tháng</button><button type="button" data-pttt="vay" aria-pressed="${cach === 'vay'}">Vay hỗ trợ lãi suất</button></p>
    <table class="tdo"><thead><tr><th>Đợt</th><th class="r">Số tiền</th></tr></thead><tbody>
    ${t.r.map(([ten, so, han, nh]) => `<tr${nh ? ' class="nh"' : ''}><td>${esc(ten)}<br><span class="mute small">${esc(han)}</span></td><td class="r">${soVN(Math.round(so))}</td></tr>`).join('')}
    <tr class="tong"><td>Tổng</td><td class="r">${soVN(Math.round(tong))}</td></tr></tbody></table>
    ${cach === 'vay'
      ? `<p class="small">Vốn tự có <b>${soVN(Math.round(t.gia - t.vay))}</b> · ngân hàng cho vay tối đa <b>${soVN(Math.round(t.vay))}</b> (70% giá trị căn hộ gồm VAT). Chủ đầu tư hỗ trợ lãi suất tối đa ${CSBH_BEACON.htlsThang} tháng từ lần giải ngân đầu, không quá 31/01/2029; sau đó lãi suất theo ngân hàng.</p>
         <p><a class="btn block" href="${goiBanTinh(k, t)}" target="_top">Tính khoản vay chi tiết ở Bản tính tài chính →</a></p>`
      : `<p class="small">Khách không vay được chiết khấu ${CSBH_BEACON.ckKhongVay * 100}% trên giá chưa VAT và KPBT, khoảng <b>${soVN(Math.round(t.ck))}</b>, trừ thẳng vào giá trị căn hộ. Bảng trên tính trên giá trong quỹ, <b>chưa trừ</b> chiết khấu này.</p>`}
    <p class="mute small">Theo chính sách bán hàng ${esc(CSBH_BEACON.ma)}, áp dụng từ ${esc(CSBH_BEACON.tu)}. Chủ đầu tư có thể đổi chính sách mà không báo trước; số chính xác theo phiếu tính giá chính thức. Đây là minh hoạ dòng tiền, không phải báo giá.</p>`;
  }
  return h;
}

/* ---------- la bàn và kim chỉ hướng trên sa bàn ---------- */
function gocManHinh(dx, dy) {           // hướng thế giới -> góc trên màn hình (độ, 0 = lên, thuận kim đồng hồ)
  if (!lastVP) return 0;
  const m = lastVP, P = (x, y) => {
    const w = m[3] * x + m[7] * y + m[15];
    return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
  };
  const a = P(C.tx, C.ty), b = P(C.tx + dx * C.dist * .12, C.ty + dy * C.dist * .12);
  return deg(Math.atan2(b[0] - a[0], b[1] - a[1]));
}
function veLaBan() {
  const el = $('#compass'); if (!el || !geo.ok) return;
  const gN = gocManHinh(geo.n[0], geo.n[1]);
  $('#cRose', el).style.transform = `rotate(${gN}deg)`;
  const s = SUN, kimNang = $('#cSun', el);
  if (s && s.el > -0.833) { kimNang.style.display = ''; kimNang.style.transform = `rotate(${gocManHinh(...geo.dir(s.az))}deg)`; }
  else kimNang.style.display = 'none';
}

/* ---------- nhãn nổi trên khối ---------- */
// Nhãn phân khu: Casa Villa neo ở (470, 200) trên bản vẽ rồi dời theo độ dời trung bình của các căn;
// nhãn tháp đặt ở trọng tâm các khối tháp cùng phân khu, nên luôn đi theo khối khi đổi nền.
const NHAN_GOC = { casa: [470, 200], beachtro: [441.5, 85.5], beacon: [543.5, 84.5], b123: [666, 273], b567: [321, 273] };
function capNhatNhanViTri() {
  const box = $('#labels'); if (!box) return;
  let dx = 0, dy = 0; for (const u of U) { dx += u.x - u.px; dy += u.y - u.py; }
  const n = U.length || 1;
  for (const b of box.children) {
    const key = b.dataset.zone; if (!key || !NHAN_GOC[key]) continue;
    let [x, y] = NHAN_GOC[key];
    if (key === 'casa') { x += dx / n; y += dy / n; }
    else { const t = TOWERS.filter(o => o.zone === key); if (t.length) { x = t.reduce((s, o) => s + o.x, 0) / t.length; y = t.reduce((s, o) => s + o.y, 0) / t.length; } }
    const z = b.dataset.p ? b.dataset.p.split(',')[2] : 14;
    b.dataset.p = [x, W(y), z].join(',');
  }
}
function buildLabels() {
  const box = $('#labels'); box.innerHTML = '<span class="lbl pin" id="pin" hidden></span>';
  const defs = [['casa', 'Casa Villa', 470, 200, 14], ['beachtro', 'Beachtro', 441.5, 85.5, 62], ['beacon', 'Beacon', 543.5, 84.5, 62], ['b123', 'Cụm B1–B3', 666, 273, 34], ['b567', 'Cụm B5–B7', 321, 273, 34]];
  const lead = $('#leaders'); if (lead) lead.innerHTML = '';
  defs.forEach(([key, text, x, y, z]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lbl'; b.dataset.zone = key; b.dataset.p = [x, W(y), z].join(',');
    b.innerHTML = `<span>${esc(text)}</span><span class="pr"></span>`;
    b.onclick = () => selectZone(key); box.append(b);
    if (lead) { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.dataset.zone = key; lead.append(l); }
  });
  capNhatGiaNhan(); if (U.length && U[0].px != null) capNhatNhanViTri();
}
function giaPhanKhu(key) {
  const g = inv.giaPhanKhu && inv.giaPhanKhu[key];
  if (!g || g.min == null || g.max == null) return null;
  const t = v => (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return `${t(g.min)} – ${t(g.max)} tỷ`;
}
function capNhatGiaNhan() {
  for (const b of $('#labels').children) {
    if (b.id === 'pin') continue;
    const pr = $('.pr', b); if (!pr) continue;
    const g = giaPhanKhu(b.dataset.zone);
    pr.textContent = g || 'Chưa có bảng giá';
    pr.className = 'pr' + (g ? '' : ' none');
  }
}
function placeLabels() {
  if (!lastVP) return;
  const w = canvas.clientWidth, h = canvas.clientHeight, m = lastVP;
  const proj = (x, y, z) => { const cw = m[3] * x + m[7] * y + m[11] * z + m[15]; return cw <= 0 ? null : [((m[0] * x + m[4] * y + m[8] * z + m[12]) / cw * .5 + .5) * w, (1 - ((m[1] * x + m[5] * y + m[9] * z + m[13]) / cw * .5 + .5)) * h]; };
  const pin = $('#pin');
  if (state.sel >= 0 && !state.hideLabels) {
    const u = U[state.sel], p = proj(u.x, W(u.y), TYPES[u.t].floors * FLOOR_H + TYPES[u.t].roof + 4);
    pin.hidden = !p;
    if (p) { pin.textContent = u.code; pin.style.left = p[0] + 'px'; pin.style.top = p[1] + 'px'; }
  } else pin.hidden = true;
  const lead = $('#leaders');
  for (const b of $('#labels').children) {
    if (b.id === 'pin') continue;
    const key = b.dataset.zone, [x, y, z] = b.dataset.p.split(',').map(Number);
    const p = proj(x, y, z);
    // nhìn xa trên 4–5 km thì nhãn phân khu chồng lên nhau: ẩn đi, chỉ còn ranh dự án
    const show = !!p && !state.hideLabels && C.dist < 2200 && (state.zone === 'all' || state.zone === key) && !(key === 'casa' && C.dist < 170);
    b.style.opacity = show ? 1 : 0; b.style.pointerEvents = show ? 'auto' : 'none';
    b.setAttribute('aria-pressed', String(state.zone === key));
    const l = lead && $(`line[data-zone="${key}"]`, lead);
    if (p) { b.style.left = p[0] + 'px'; b.style.top = (p[1] - 26) + 'px'; }
    if (l) {
      const g = p ? proj(x, y, 0) : null;
      if (show && g) { l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1] - 24); l.setAttribute('x2', g[0]); l.setAttribute('y2', g[1]); l.style.display = ''; }
      else l.style.display = 'none';
    }
  }
}

/* ---------- độ cao camera ---------- */
let doCaoCu = -1;
function hienDoCao() {
  const el = document.getElementById('doCao'); if (!el) return;
  const m = doCaoMet(), r = m >= 1000 ? Math.round(m / 50) * 50 : Math.round(m / 10) * 10;
  if (r === doCaoCu) return; doCaoCu = r;
  el.textContent = r >= 1000 ? (r / 1000).toFixed(r % 1000 ? 2 : 0).replace('.', ',') + ' km' : r + ' m';
}

/* ---------- vòng lặp ---------- */
let last = 0, hoverReq = null;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
  const k = 1 - Math.exp(-dt * 7);
  let moving = false;
  const dich = viTriDich();
  if (VT.dich !== dich) { VT.dich = dich; VT.tu = VT.t; VT.batDau = t; }
  if (VT.t !== dich) {
    const k2 = reduce ? 1 : Math.min(1, (t - VT.batDau) / 700), e = k2 * k2 * (3 - 2 * k2);
    datViTri(k2 >= 1 ? dich : VT.tu + (dich - VT.tu) * e); uploadStatic(); moving = true;
  }
  for (const key of ['tx', 'ty', 'tz', 'dist', 'yaw', 'pitch']) {
    const d = T[key] - C[key];
    if (Math.abs(d) > (key === 'dist' ? C.dist * 5e-4 : 5e-4)) { C[key] += d * k; moving = true; } else C[key] = T[key];
  }
  if (hoverReq) { const r = hoverReq; hoverReq = null; doHover(r.x, r.y); }
  if (moving || dirty) { resize(); gl.bindFramebuffer(gl.FRAMEBUFFER, null); drawScene(false); placeLabels(); veLaBan(); hienDoCao(); dirty = false; }
}
function doHover(x, y) {
  if (state.mb && mbDung()) {
    const k = mbHit(x, y);
    if (k !== state.mb.hover) { state.mb.hover = k; capNhatTrangThaiMB(); }
    if (k >= 0) {
      const c = mbDung().can[k], tip = $('#tip'), r = $('#stage').getBoundingClientRect();
      if (!matchMedia('(hover:none)').matches) { tip.hidden = false; tip.textContent = maDayDu(c, state.mb.tang) + ' · ' + tenLoai(c.loai); tip.style.left = (x - r.left) + 'px'; tip.style.top = (y - r.top) + 'px'; }
      canvas.classList.add('hit'); return;
    }
  }
  const id = pickAt(x, y);
  if (id !== state.hover) { state.hover = id; refreshStates(); showTip(id, x, y); canvas.classList.toggle('hit', id >= 0); } else if (id >= 0) showTip(id, x, y);
}
function nameOf(i) {
  if (i < U.length) return lab(U[i]);
  const t = TOWERS[i - U.length], z = ZONES.find((o) => o.key === t.zone);
  return (z ? z.name + ' · ' : '') + t.name;
}
function showTip(id, x, y) {
  const tip = $('#tip');
  if (id < 0 || matchMedia('(hover:none)').matches) { tip.hidden = true; return; }
  const r = $('#stage').getBoundingClientRect(); tip.hidden = false; tip.textContent = nameOf(id); tip.style.left = (x - r.left) + 'px'; tip.style.top = (y - r.top) + 'px';
}

/* ---------- thao tác chuột / cảm ứng ---------- */
// Điều khiển kiểu Google Maps:
//   chuột: kéo trái = trượt bản đồ (điểm dưới con trỏ bám theo tay); kéo phải, kéo giữa hoặc Ctrl/Shift + kéo = xoay và nghiêng;
//          lăn chuột = thu phóng về phía con trỏ; nhấp đúp vào nền = phóng to tại chỗ.
//   cảm ứng: một ngón = trượt; hai ngón chụm/mở = thu phóng, xoay hai ngón = xoay, hai ngón cùng vuốt dọc = nghiêng.
const ptrs = new Map(); let down = null, hai = null;
const GIOI_HAN = { x0: -2600, x1: 3600, y0: -2600, y1: 3200 };
function tiaMatDat(cx, cy, h = 0) {
  // Tia từ camera hiện tại qua điểm màn hình (cx, cy) cắt mặt đất z = 0. Trả về null nếu tia hướng lên trời.
  const r = canvas.getBoundingClientRect(), nx = ((cx - r.left) / r.width) * 2 - 1, ny = 1 - ((cy - r.top) / r.height) * 2;
  const cp = Math.cos(C.pitch), e = [C.tx + C.dist * Math.sin(C.yaw) * cp, C.ty - C.dist * Math.cos(C.yaw) * cp, C.tz + C.dist * Math.sin(C.pitch)];
  let f = [C.tx - e[0], C.ty - e[1], C.tz - e[2]]; const fl = Math.hypot(...f); f = f.map(v => v / fl);
  let rr = [f[1], -f[0], 0]; const rl = Math.hypot(...rr) || 1; rr = rr.map(v => v / rl);
  const u = [rr[1] * f[2] - rr[2] * f[1], rr[2] * f[0] - rr[0] * f[2], rr[0] * f[1] - rr[1] * f[0]];
  const th = Math.tan(.33), a = r.width / r.height;
  const d = [0, 1, 2].map(i => f[i] + nx * th * a * rr[i] + ny * th * u[i]);
  if (d[2] > -1e-4 || e[2] <= h) return null;
  const t = (h - e[2]) / d[2];
  if (t > XA_NHAT * 6) return null;
  return [e[0] + d[0] * t, e[1] + d[1] * t];
}
function datTam(tx, ty) {
  T.tx = C.tx = Math.max(GIOI_HAN.x0, Math.min(GIOI_HAN.x1, tx)); T.ty = C.ty = Math.max(GIOI_HAN.y0, Math.min(GIOI_HAN.y1, ty));
}
function keoTheoDiem(g0, cx, cy) {   // dời tâm sao cho điểm mặt đất g0 nằm dưới (cx, cy)
  const g = tiaMatDat(cx, cy); if (!g0 || !g) return;
  datTam(C.tx + g0[0] - g[0], C.ty + g0[1] - g[1]);
}
function phongTai(cx, cy, he) {      // thu phóng giữ nguyên điểm dưới con trỏ
  const g0 = tiaMatDat(cx, cy);
  T.dist = C.dist = Math.max(28, Math.min(XA_NHAT, C.dist * he));
  if (g0) keoTheoDiem(g0, cx, cy);
  dirty = true;
}
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  Object.assign(T, { tx: C.tx, ty: C.ty, dist: C.dist, yaw: C.yaw, pitch: C.pitch });   // dừng mọi chuyển động bay
  if (ptrs.size === 1) {
    const xoay = e.button === 2 || e.button === 1 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, xoay, g0: xoay ? null : tiaMatDat(e.clientX, e.clientY) };
  } else if (ptrs.size === 2) {
    down && (down.moved = true);
    const [a, b] = [...ptrs.values()];
    hai = { d: Math.hypot(a.x - b.x, a.y - b.y), goc: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ya: a.y, yb: b.y };
    hai.g0 = tiaMatDat(hai.cx, hai.cy);
  }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (e.pointerType === 'mouse') hoverReq = { x: e.clientX, y: e.clientY }; return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size >= 2 && hai) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), goc = Math.atan2(b.y - a.y, b.x - a.x), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    const dya = a.y - hai.ya, dyb = b.y - hai.yb;
    // hai ngón cùng vuốt dọc, khoảng cách và góc gần như không đổi: nghiêng
    if (Math.sign(dya) === Math.sign(dyb) && Math.abs(dya - dyb) < 6 && Math.abs(d - hai.d) < 8 && Math.abs(cy - hai.cy) > Math.abs(cx - hai.cx)) {
      T.pitch = C.pitch = Math.max(.2, Math.min(1.5, C.pitch + (cy - hai.cy) * .006));
    } else {
      T.dist = C.dist = Math.max(28, Math.min(XA_NHAT, C.dist * hai.d / Math.max(10, d)));
      let dg = goc - hai.goc; if (dg > Math.PI) dg -= 2 * Math.PI; if (dg < -Math.PI) dg += 2 * Math.PI;
      T.yaw = C.yaw = C.yaw - dg;
      keoTheoDiem(hai.g0, cx, cy);
    }
    Object.assign(hai, { d, goc, cx, cy, ya: a.y, yb: b.y }); hai.g0 = tiaMatDat(cx, cy);
    dirty = true; return;
  }
  if (!down) return;
  if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down.moved = true; canvas.classList.add('drag'); $('#tip').hidden = true; }
  if (!down.moved) return;
  if (down.xoay) { T.yaw = C.yaw = C.yaw + dx * .006; T.pitch = C.pitch = Math.max(.2, Math.min(1.5, C.pitch + dy * .005)); }
  else if (down.g0) keoTheoDiem(down.g0, e.clientX, e.clientY);
  else pan(dx, dy);
  dirty = true;
});
function pan(dx, dy) {
  const s = C.dist * .0011, c = Math.cos(C.yaw), sn = Math.sin(C.yaw);
  datTam(C.tx - (dx * c + dy * sn * 1.2) * s, C.ty + (dx * sn - dy * c * 1.2) * s);
}
const endPtr = e => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) hai = null; canvas.classList.remove('drag');
  if (down && e.type === 'pointerup' && !down.moved && performance.now() - down.t < 600 && ptrs.size === 0) clickAt(e.clientX, e.clientY);
  if (ptrs.size === 0) down = null;
  else if (ptrs.size === 1 && down) { const [q] = [...ptrs.values()]; down.g0 = tiaMatDat(q.x, q.y); down.xoay = false; }
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerleave', () => { if (state.hover >= 0 && !ptrs.size) { state.hover = -1; refreshStates(); $('#tip').hidden = true; } });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
  phongTai(e.clientX, e.clientY, Math.exp(Math.max(-300, Math.min(300, dy)) * .0016));
}, { passive: false });
let lastTap = 0;
function clickAt(x, y) {
  const id = pickAt(x, y);
  const now = performance.now(), dbl = now - lastTap < 350; lastTap = now;
  if (state.mb && mbDung()) { const k = mbHit(x, y); if (k >= 0) { chonCanMB(k); return; } }
  if (id < 0) { if (dbl) phongTai(x, y, .5); return; }
  if (id < U.length) { selectUnit(id, { fly: true }); if (dbl) fly({ ...T, dist: 55, pitch: 1.05 }); }
  else if (TOWERS[id - U.length].can) {
    const c = CAN.can.find(x => x.ma === TOWERS[id - U.length].can); if (c) moMatBang(tangNhan(c.tang), c.toa + c.can, c.phanKhu);
  } else {
    const z = TOWERS[id - U.length].zone;
    // chạm lần hai vào Beacon: bóc tầng, mở mặt bằng để chọn căn
    if (MB && MB[z] && state.zone === z && !state.mb) moMatBang(tangMacDinh(z), null, z);
    else if (!state.mb || z !== state.mb.khu) selectZone(z);
  }
}
canvas.addEventListener('keydown', e => {
  const k = e.key;
  const buoc = 60;
  if (k.startsWith('Arrow') && !e.shiftKey) { pan(k === 'ArrowLeft' ? buoc : k === 'ArrowRight' ? -buoc : 0, k === 'ArrowUp' ? buoc : k === 'ArrowDown' ? -buoc : 0); e.preventDefault(); dirty = true; return; }
  if (k === 'ArrowLeft') T.yaw -= .12; else if (k === 'ArrowRight') T.yaw += .12; else if (k === 'ArrowUp') T.pitch = Math.min(1.5, T.pitch + .08); else if (k === 'ArrowDown') T.pitch = Math.max(.2, T.pitch - .08);
  else if (k === '+' || k === '=') T.dist = Math.max(28, T.dist * .85); else if (k === '-') T.dist = Math.min(XA_NHAT, T.dist / .85); else if (k === 'Escape') { selectUnit(-1); return; } else return;
  e.preventDefault(); dirty = true;
});

/* ---------- chọn / lọc ---------- */
function selectZone(key, o = {}) {
  if (!ZONES.some(z => z.key === key)) key = 'all';
  if (state.mb && key !== state.mb.khu) { state.mb = null; state.consignMa = null; }
  state.zone = key; state.type = o.type ?? -1; state.sel = -1; state.sheet = state.sheet || 0;
  if (!(key === 'casa')) state.q = '';
  fly(zoneView(key, state.type));
  state.tab = key === 'all' ? 'explore' : 'unit';
  syncHash(); refreshStates(); render();
}
function selectType(t) { state.type = t; fly(zoneView('casa', t)); refreshStates(); render(); }
function selectUnit(i, o = {}) {
  if (i < 0) { state.sel = -1; refreshStates(); if (state.tab === 'unit') render(); return; }
  const u = U[i]; state.mb = null; state.consignMa = null; state.zone = 'casa'; state.sel = i; state.tab = 'unit';
  if (o.fly !== false) fly({ tx: u.x, ty: W(u.y), tz: 7, dist: 118, pitch: .88, yaw: T.yaw });
  syncHash(); refreshStates(); render();
}
function syncHash() { try { history.replaceState(null, '', state.sel >= 0 ? '#unit=' + U[state.sel].code : '#' + state.zone); } catch {} }
function openHash() {
  const h = location.hash.slice(1);
  if (h.startsWith('unit=')) { const i = U.findIndex(u => u.code === h.slice(5)); if (i >= 0) { selectUnit(i); return; } }
  if (ZONES.some(z => z.key === h)) selectZone(h);
}

/* ---------- giỏ ---------- */
function toggleCart(k, label, sub) {
  const i = state.cart.findIndex(c => c.k === k);
  if (i >= 0) state.cart.splice(i, 1); else { if (state.cart.length >= 20) { alert('Giỏ tối đa 20 mục.'); return; } state.cart.push({ k, label, sub }); }
  saveCart(); refreshStates(); render();
  const n = $('#tabs .n'); if (n) { n.classList.add('pop'); setTimeout(() => n.classList.remove('pop'), 250); }
}

function baseSeg() {
  const nhan = { chua: 'Bản đồ thật', dang: 'Đang tải…', xong: 'Bản đồ thật', loi: 'Bản đồ lỗi' }[state.osm];
  const tat = state.osm === 'dang' || state.osm === 'loi';
  return `<span class="seg" role="group" aria-label="Nền sa bàn"><button type="button" data-base="plan" aria-pressed="${state.base === 'plan'}">Tổng mặt bằng</button><button type="button" data-base="osm" aria-pressed="${state.base === 'osm'}" ${tat ? 'disabled' : ''}>${nhan}</button><button type="button" data-base="blend" aria-pressed="${state.base === 'blend'}" ${tat ? 'disabled' : ''}>Chồng lớp</button></span>`;
}
const HUONG16 = ['Bắc', 'Bắc đông bắc', 'Đông bắc', 'Đông đông bắc', 'Đông', 'Đông đông nam', 'Đông nam', 'Nam đông nam', 'Nam', 'Nam tây nam', 'Tây nam', 'Tây tây nam', 'Tây', 'Tây tây bắc', 'Tây bắc', 'Bắc tây bắc'];
const tenHuong = d => HUONG16[Math.round(wrap(d, 360) / 22.5) % 16];
const gioPhut = ms => ms == null ? '—' : new Date(ms).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
function envHtml() {
  const s = SUN || sunNow();
  const dangXem = state.sunT == null;
  const ngay = new Date(s.ms).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
  return `<h2>Nắng tại dự án</h2>
  <p class="mute small">Tính theo tọa độ thật của khu đất: ${geo.lat0.toFixed(5)}° Bắc, ${geo.lon0.toFixed(5)}° Đông. Giờ Việt Nam (UTC+7).</p>
  <h3>Mặt trời ngày ${ngay}</h3>
  <dl class="dial"><dt>Lúc</dt><dd>${gioPhut(s.ms)}${dangXem ? ' (bây giờ)' : ''}</dd><dt>Phương vị</dt><dd>${s.el > -0.833 ? Math.round(s.az) + '° · ' + esc(tenHuong(s.az)) : 'dưới chân trời'}</dd><dt>Cao độ</dt><dd>${s.el.toFixed(1)}°</dd><dt>Mọc · đứng bóng · lặn</dt><dd>${gioPhut(s.rise)} · ${gioPhut(s.noon)} · ${gioPhut(s.set)}</dd></dl>
  ${dangXem ? '<p class="small mute">Đang theo giờ thực. Kéo thanh giờ ở đáy sa bàn để xem nắng đổ hướng nào vào giờ khác trong ngày hôm nay.</p>' : '<p class="small"><button class="btn" data-sun="now">↺ Về giờ thực</button></p>'}
  <div class="note">Hướng nắng và bóng đổ trên sa bàn đổi theo mùa và theo giờ thật của Vũng Tàu, không phải hiệu ứng cố định.</div>
  <h3>Nền bản đồ</h3>
  <p class="small mute">${state.osm === 'xong' ? `Đã ghép ${osm.soTile} ô ${NEN.kieu === 've-tinh' ? 'ảnh vệ tinh' : 'bản đồ'} ở mức thu phóng ${osm.zoom} cho khu đất${osmGiua.soTile ? `, ${osmGiua.soTile} ô mức ${osmGiua.zoom} cho phố và biển quanh dự án` : ''}${osmXa.soTile ? `, ${osmXa.soTile} ô mức ${osmXa.zoom} cho vùng rộng khoảng 28 km` : ''}, xoay về đúng hướng Bắc thật.` : state.osm === 'loi' ? 'Chưa tải được ô bản đồ.' : 'Đang tải nền bản đồ…'}</p>
  <p>${baseSeg()}</p>
  <h3>Màu khối</h3>
  <p>${legendHtml()}</p>
  <div class="src"><b>Nguồn và giới hạn.</b> Vị trí mặt trời tính bằng thuật toán NOAA từ tọa độ, ngày và giờ địa phương — không dùng dữ liệu ngoài, không gọi dịch vụ nào.
  Nền bản đồ ${esc(NEN.ghiNhan)}.
  <b>Phép chiếu sa bàn lên bản đồ là đối chiếu sơ bộ</b>: hướng Bắc đo từ hoa gió in trên tổng mặt bằng (${geo.north}°, hai phép đo độc lập khớp nhau) và tỷ lệ ${geo.mpu} m/đơn vị suy từ bước lặp lô; điểm neo chưa kiểm tra thực địa nên vị trí tuyệt đối có thể lệch. Dùng để xem hướng, không dùng để xác định ranh lô.</div>`;
}

/* ---------- panel ---------- */
const tabsDef = [['explore', 'Khám phá'], ['unit', 'Hồ sơ'], ['env', 'Nắng'], ['cart', 'Giỏ'], ['consult', 'Tư vấn']];
function renderTabs() {
  $('#tabs').innerHTML = tabsDef.map(([k, n]) => `<button class="tab" role="tab" id="tab-${k}" data-tab="${k}" aria-selected="${state.tab === k}">${n}${k === 'cart' && state.cart.length ? `<span class="n">${state.cart.length}</span>` : ''}</button>`).join('');
}
function chipsHtml() {
  return ZONES.map(z => {
    const n = z.key === 'all' ? U.length + ZCOUNT.beacon : ZCOUNT[z.key];
    return `<button class="chip" type="button" data-zone="${z.key}" aria-pressed="${state.zone === z.key}"><i class="dot" style="background:${z.col}"></i>${esc(z.name)}${n ? `<span class="n">${nf.format(n)}</span>` : '<span class="n">—</span>'}</button>`;
  }).join('');
}
const FLOORS = [['Mái', 0], ['T39', 55.6], ['T36', 51.3], ['T30', 42.8], ['T20', 28.5], ['T10', 14.3], ['T04', 5.7]];
function renderChrome() {
  const on = (id, v) => { const el = $(id); if (el) el.setAttribute('aria-pressed', String(!!v)); };
  const seg = $('#marketSeg');
  if (seg) seg.innerHTML = [['all', 'Tất cả'], ['primary', 'Sơ cấp'], ['secondary', 'Thứ cấp']]
    .map(([k, t]) => `<button type="button" data-market="${k}" aria-pressed="${state.market === k}" ${k !== 'all' && !hasInv() ? 'disabled title="Chưa có bảng hàng chính thức"' : ''}>${t}</button>`).join('');
  on('#bNight', state.night); on('#bLabels', state.hideLabels); on('#bRanh', state.ranh);
  const br = $('#bRanh'); if (br) { br.disabled = !RANH; br.title = RANH ? `Ranh ${RANH.ten} · ${RANH.dienTichHa} ha · ${RANH.nguon}` : 'Chưa có ranh'; }
  const bn = $('#baseName'); if (bn) bn.textContent = { osm: 'Bản đồ', plan: 'Mặt bằng', blend: 'Chồng lớp' }[state.base];
  const bb = $('#bBase'); if (bb) { bb.disabled = state.osm === 'dang'; bb.title = state.osm === 'loi' ? 'Chưa tải được ô bản đồ' : 'Đổi nền: bản đồ thật · tổng mặt bằng · chồng lớp'; }
  const rc = $('#railCart'); if (rc) { rc.textContent = state.cart.length; rc.className = state.cart.length ? 'on' : ''; }
  for (const b of document.querySelectorAll('.rb')) b.setAttribute('aria-pressed', String(b.dataset.rail === 'blocks' ? !state.blocks : state.rail === b.dataset.rail));
  const fr = $('#floorRail');
  if (fr) {
    const hien = state.rail === 'floors' || !!state.mb;
    fr.hidden = !hien;
    if (state.mb) {
      const ds = dsTang().slice().reverse(), dung = new Set((mbDung() || { tangDung: [] }).tangDung);
      fr.innerHTML = '<b>TẦNG</b><button class="fb" data-mbdong="1" title="Hiện đủ khối, thoát bóc tầng">Mái</button>' + ds.map(t => `<button class="fb${dung.has(t) ? '' : ' xam'}" data-mbtang="${t}" aria-pressed="${state.mb.tang === t}" title="${dung.has(t) ? 'Có mặt bằng tầng để chọn căn' : 'Mặt bằng tầng này chưa số hoá'}">T${t}</button>`).join('');
      const on = fr.querySelector('[aria-pressed=true]'); if (on) on.scrollIntoView({ block: 'nearest' });
    } else if (hien) fr.innerHTML = '<b>CAO ĐỘ</b>' + FLOORS.map(([t, z]) => `<button class="fb" data-cut="${z}" aria-pressed="${state.cut === z}">${t}</button>`).join('');
    veThanhMB();
  }
  const cap = $('#caption');
  if (cap) cap.textContent = `Blanca City · 96,6 ha · Sun Group — sa bàn mô phỏng theo tổng mặt bằng, ${hasInv() ? 'bảng hàng ' + (inv.updatedAt ? fmtTime(inv.updatedAt) : 'đã nạp') : 'chưa có bảng hàng chính thức'}${state.base !== 'plan' && state.osm === 'xong' ? ' · nền bản đồ ' + NEN.ghiNhan : ''} · Kéo để di chuyển · Chuột phải hoặc Ctrl + kéo để xoay, nghiêng · Lăn chuột thu phóng · Hai ngón xoay, chụm, vuốt dọc để nghiêng`;
  capNhatDongHo();
}
function capNhatDongHo() {
  const c = $('#clock'), r = $('#sunh');
  const s = SUN || sunNow();
  if (c) c.textContent = gioPhut(s.ms);
  if (r && document.activeElement !== r) {
    const d = new Date(s.ms).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
    const [hh, mm] = d.split(':').map(Number);
    r.value = Math.round((hh * 60 + mm) / 10);
  }
}
function legendHtml() {  // dùng trong tab Khí hậu
  let items;
  if (state.mode === 'status' && hasInv()) items = Object.values(STATUS).map(s => `<span><i style="background:${rgb(s[1])}"></i>${s[0]}</span>`).join('');
  else items = TYPES.map(t => `<span><i style="background:${rgb(t.col)}"></i>${t.short}</span>`).join('') + '<span><i style="background:#4bb07a"></i>Beacon</span><span><i style="background:#8d62c0"></i>B1–B3</span><span><i style="background:#c04fa6"></i>B5–B7</span>';
  const seg = `<span class="seg" role="group" aria-label="Cách tô màu"><button type="button" data-mode="type" aria-pressed="${state.mode === 'type'}">Loại hình</button><button type="button" data-mode="status" aria-pressed="${state.mode === 'status'}" ${hasInv() ? '' : 'disabled title="Chưa có dữ liệu giỏ hàng chính thức"'}>Tình trạng</button></span>`;
  const info = hasInv() ? `<small>Bảng hàng${inv.updatedAt ? ' cập nhật ' + fmtTime(inv.updatedAt) + ' (giờ Việt Nam)' : ''}${inv.source ? ' · nguồn: ' + esc(inv.source) : ''}</small>` : '<small>Chưa có bảng hàng chính thức: màu thể hiện loại hình, chưa thể hiện còn/đã bán.</small>';
  return seg + items + info + (state.base !== 'plan' && state.osm === 'xong' ? `<small>Nền bản đồ ${esc(NEN.ghiNhan)}.</small>` : '');
}
function render() {
  renderTabs(); $('#zoneChips').innerHTML = chipsHtml(); renderChrome();
  const pane = $('#pane'); pane.setAttribute('aria-labelledby', 'tab-' + state.tab);
  const scroll = pane.scrollTop;
  pane.innerHTML = ({ explore: exploreHtml, unit: unitHtml, env: envHtml, cart: cartHtml, consult: consultHtml })[state.tab]();
  pane.scrollTop = state.keepScroll ? scroll : 0; state.keepScroll = false; formOpened = performance.now();
}
function exploreHtml() {
  return `<h2>Chọn phân khu</h2><p class="mute small">Chạm khối trên sa bàn hoặc chọn tại đây, cả hai mở cùng một hồ sơ.</p>
  <div class="zones">${ZONES.map(z => `<button class="zone" type="button" data-zone="${z.key}" aria-pressed="${state.zone === z.key}"><span class="dot" style="background:${z.col}"></span><b>${esc(z.name)}</b><span>${esc(z.sub)}</span><em>›</em></button>`).join('')}</div>
  <div class="note"><b>Về dữ liệu:</b> hình khối từng căn Casa Villa là <b>mô phỏng</b> theo tổng mặt bằng; ranh lô, khoảng lùi, mái và chiều cao là ước tính. Trên nền bản đồ, mỗi khối nhà được tách riêng và đặt theo ghim thực địa đo trên ảnh vệ tinh 19/11/2026 (khối chưa xây đặt theo bước khối bên cạnh); trên nền Tổng mặt bằng, khối nằm đúng theo bản vẽ. Khối tháp dựng theo số tầng công bố trong hồ sơ tư vấn 7/8/2026 (2 tầng khối đế cao 5 m, tầng căn hộ cao 3,6 m); chân tháp Beacon và Beachtro cắt theo đường bao công trình trên tổng mặt bằng, đối chiếu layout tầng điển hình; cụm B dựng khối hộp theo đúng hình trên tổng mặt bằng. Số căn đang bán chỉ hiện khi có bảng hàng chính thức.</div>
  <div class="row"><button class="btn primary" data-go="cart">Giỏ quan tâm${state.cart.length ? ' (' + state.cart.length + ')' : ''}</button><button class="btn" data-go="consult">Nói chuyện với tư vấn</button></div>
  ${state.rail === 'infra' ? infraHtml() : ''}`;
}
function infraHtml() {
  return `<h3 id="infra">Hạ tầng quanh dự án</h3>
  <p class="small mute">Những mốc dưới đây lấy từ hồ sơ dự án trong Cẩm nang. <b>Chưa có tọa độ nên chưa ghim được lên bản đồ</b> — trừ điểm neo Sun World Vũng Tàu đang dùng làm mốc đối chiếu của sa bàn.</p>
  <dl class="kv"><dt>Mặt tiền</dt><dd>Trục đường 3/2, Bãi Sau</dd><dt>Bờ biển</dt><dd>khoảng 1 km</dd><dt>Sân bay Long Thành</dt><dd>khoảng 43 km</dd><dt>Cao tốc Biên Hòa – Vũng Tàu</dt><dd>đã thông xe giai đoạn 1</dd><dt>Sun World Vũng Tàu</dt><dd>trong dự án · đã vận hành</dd></dl>
  <div class="note">Anh/chị gửi tọa độ các mốc muốn ghim (nút giao, trường, bệnh viện, bến xe…) thì sa bàn sẽ hiện đúng vị trí và đo được khoảng cách thật trên bản đồ.</div>
  <p><a class="btn block" href="/cam-nang/blanca-city/" target="_top">Đọc phân tích vị trí →</a></p>`;
}
function unitHtml() {
  if (state.mb) return mbHtml();
  if (state.sel >= 0) return dossierHtml(U[state.sel]);
  if (state.zone === 'beacon') return beaconHtml();
  if (state.zone === 'beachtro') return beachtroHtml();
  if (state.zone === 'b123' || state.zone === 'b567') return clusterHtml();
  return listHtml();
}
function listHtml() {
  const q = state.q.trim().toLowerCase();
  let list = U.filter(u => state.type < 0 || u.t === state.type);
  if (q) list = list.filter(u => (lab(u) + ' ' + u.code).toLowerCase().includes(q));
  const shown = list.slice(0, 60);
  const typeChips = `<div class="chips" style="margin:8px 0;padding:0"><button class="chip" data-type="-1" aria-pressed="${state.type < 0}">Tất cả (${U.length})</button>${TYPES.map((t, i) => `<button class="chip" data-type="${i}" aria-pressed="${state.type === i}">${t.short} (${U.filter(u => u.t === i).length})</button>`).join('')}</div>`;
  return `<h2>Casa Villa · 939 căn</h2><p class="mute small">Chọn loại hình, tìm theo dãy hoặc mã sa bàn (ví dụ TH-012), hoặc chạm trực tiếp lên khối 3D.</p>${typeChips}
  <input class="search" id="q" type="search" placeholder="Tìm: dãy 5, SL-020, đơn lập…" value="${esc(state.q)}" aria-label="Tìm căn">
  <div class="list">${shown.map(u => `<button class="item" data-unit="${u.id}"><i style="background:${rgb(TYPES[u.t].col)}"></i><div><b>${esc(lab(u))}</b><span>${u.code} · lô ≈ ${u.front} × ${u.depth} m</span></div></button>`).join('') || '<p class="mute">Không có căn phù hợp.</p>'}</div>
  ${list.length > shown.length ? `<p class="mute small">Hiện ${shown.length}/${list.length} căn. Gõ thêm vào ô tìm để thu hẹp.</p>` : ''}`;
}
function dossierHtml(u) {
  const ty = TYPES[u.t], i = unitInv(u), st = i && STATUS[i.status];
  const k = 'u:' + u.id, on = inCart(k);
  return `<p class="small"><button class="btn" style="padding:4px 10px" data-unit="-1">← Danh sách</button></p>
  <h2>${esc(lab(u))}</h2><p><span class="badge">${u.code}</span> <span class="badge ${st ? st[2] : ''}">${st ? st[0] : 'Chưa có dữ liệu giỏ hàng'}</span></p>
  <dl class="kv"><dt>Loại hình</dt><dd>${esc(ty.name)}</dd><dt>Lô tham chiếu</dt><dd>${u.front} × ${u.depth} m${u.exact ? '' : ' (điển hình)'}</dd><dt>Diện tích đất ≈</dt><dd>${land(u)} m²</dd><dt>Số tầng</dt><dd>${ty.floors} tầng nổi + 1 hầm</dd><dt>Vị trí trong dãy</dt><dd>căn ${u.n}/${u.rowN}</dd>${i && i.code ? `<dt>Mã căn chính thức</dt><dd>${esc(i.code)}</dd>` : ''}${i && i.priceVnd ? `<dt>Giá chào</dt><dd>${(i.priceVnd / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ</dd>` : '<dt>Giá chào</dt><dd>Liên hệ tư vấn</dd>'}</dl>
  <div class="note">Mã <b>${u.code}</b> là mã sa bàn mô phỏng, chưa phải mã căn chính thức. Vị trí căn trên sa bàn cần đối chiếu với tổng mặt bằng bán hàng trước khi chốt.</div>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="${k}" data-label="${esc(lab(u))}" data-sub="${u.code} · ≈${land(u)} m²">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Thêm vào giỏ quan tâm'}</button><button class="btn" data-ask="${u.id}">Hỏi căn này</button></div>
  <h3>Hồ sơ bản vẽ ${esc(ty.short)}</h3><div class="docs">${ty.pages.map(p => `<img src="p${p}.webp" alt="Hồ sơ Casa Villa, trang ${p}" loading="lazy" data-zoom="p${p}.webp">`).join('')}</div>
  <p class="mute small">Kích thước lô điển hình theo hồ sơ: ${ty.size}. Chạm vào ảnh để xem lớn.</p>
  <p><a class="btn block" href="/cam-nang/blanca-casa-villa/" target="_top">Đọc hồ sơ Casa Villa →</a></p>`;
}
function beaconHtml() {
  const sheet = 8 + state.sheet, on = inCart('z:beacon');
  return `<h2>Beacon Tower</h2><p><span class="badge">2.211 căn hộ</span> <span class="badge">3 tầng hầm</span> <span class="badge">E1 · E2 · E3 · E5</span></p>
  ${MB && MB.beacon ? `<div class="card mbmo"><b>Bóc tầng, chọn căn trên mặt bằng</b><span class="mute small">Mặt bằng tầng ${esc(MB.beacon.tenTang)} dán thẳng lên khối 3D. Chạm vào căn để xem giá, layout và tiến độ thanh toán.</span><button class="btn primary" data-mbtang="${tangMacDinh()}" data-mbkhu="beacon">Mở mặt bằng tầng ${tangMacDinh()} →</button></div>` : ''}
  <p class="mute small">Trên tổng mặt bằng đây là khối ghi <b>E2</b>; bên trong gồm bốn toà con E1, E2, E3 và E5. Sơ đồ đứng ghi 2 tầng khối đế, tầng 3–38 căn hộ, tầng 39–40 duplex. Khối 3D dựng theo đúng thân toà trên mặt bằng tầng điển hình, mỗi toà con đúng số tầng, mái khung trắng như phối cảnh. Nguồn: Beacon.pdf trang 6–7; hồ sơ tư vấn 7/8/2026 trang 80.</p>
  <table><caption class="small mute" style="text-align:left;margin-bottom:4px">Cơ cấu căn hộ Beacon</caption><thead><tr><th>Loại</th><th>Thông thủy (m²)</th><th class="r">Số căn</th><th></th></tr></thead><tbody>${BEACON_MIX.map(r => { const k = 'b:' + r[0]; return `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${nf.format(r[2])}</td><td class="r"><button class="chip" style="padding:2px 9px" data-cart="${k}" data-label="Beacon · ${esc(r[0])}" data-sub="${esc(r[1])} m²" aria-pressed="${inCart(k)}">${inCart(k) ? '✓' : '＋'}</button></td></tr>`; }).join('')}</tbody></table>
  <h3>Mặt bằng Beacon 1 và căn mẫu</h3>
  <label>Chọn bản vẽ<select id="sheet">${BEACON_SHEETS.map((n, i) => `<option value="${i}" ${i === state.sheet ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <p><img src="beacon-${sheet}.webp" alt="Mặt bằng Beacon: ${esc(BEACON_SHEETS[state.sheet])}" style="width:100%;border-radius:8px;border:1px solid var(--line);cursor:zoom-in" data-zoom="beacon-${sheet}.webp"></p>
  <p class="mute small">Mặt đứng ghi E2, mặt bằng ghi Beacon 1: giữ đúng phạm vi từng bản vẽ.</p>
  ${canHoHtml('beacon')}
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="z:beacon" data-label="Beacon Tower (chung)" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Quan tâm Beacon'}</button><a class="btn" href="/cam-nang/blanca-beacon-tower/" target="_top">Hồ sơ phân khu →</a></div>`;
}
const BEACHTRO_MIX = [['Studio', 24], ['1PN+', 28], ['2PN', 4], ['2PN+', 34], ['3PN', 4], ['3PN view kép', 4], ['3PN+', 2]];
function beachtroHtml() {
  const on = inCart('z:beachtro');
  return `<h2>Beachtro Tower</h2>
  <p><span class="badge">1.785 căn hộ</span> <span class="badge">E6 · E7 · E8 · E9</span></p>
  ${MB && MB.beachtro ? `<div class="card mbmo"><b>Bóc tầng, xem layout từng căn trên mặt bằng</b><span class="mute small">Mặt bằng tầng điển hình ${esc(MB.beachtro.tenTang)} dán thẳng lên khối 3D. Chạm vào căn để xem loại căn, diện tích và layout. Chưa có bảng hàng nên chưa có giá.</span><button class="btn primary" data-mbtang="15" data-mbkhu="beachtro">Mở mặt bằng tầng 15 →</button></div>` : ''}
  <p class="mute small">Trên tổng mặt bằng đây là khối ghi <b>E1</b>, nằm sát đường 3/2 cạnh Beacon; bên trong gồm bốn toà con E6, E7, E8 và E9. Khối 3D dựng theo đúng thân toà trên mặt bằng tầng điển hình, mỗi toà con đúng số tầng, mái khung trắng như phối cảnh. Nguồn: hồ sơ tư vấn Blanca City 7/8/2026, trang 14 và 98.</p>
  <table><caption class="small mute" style="text-align:left;margin-bottom:4px">Tỷ trọng loại căn</caption><thead><tr><th>Loại</th><th class="r">Tỷ trọng</th><th></th></tr></thead><tbody>${BEACHTRO_MIX.map(([t, p]) => { const k = 'bt:' + t; return `<tr><td>${t}</td><td class="r">${p}%</td><td class="r"><button class="chip" style="padding:2px 9px" data-cart="${k}" data-label="Beachtro · ${esc(t)}" data-sub="${p}% rổ hàng" aria-pressed="${inCart(k)}">${inCart(k) ? '✓' : '＋'}</button></td></tr>`; }).join('')}</tbody></table>
  <div class="note">Chưa có bảng hàng chính thức nên chưa hiện diện tích và giá từng căn.</div>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="z:beachtro" data-label="Beachtro Tower (chung)" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Quan tâm Beachtro'}</button><a class="btn" href="/cam-nang/blanca-beachtro-tower/" target="_top">Hồ sơ phân khu →</a></div>`;
}

/* ---------- quỹ căn hộ chia cho đại lý ---------- */
const tien = (n) => n == null ? '—' : (n / 1e9).toFixed(2).replace('.', ',') + ' tỷ';
const canPK = (pk) => (CAN && CAN.can ? CAN.can.filter(c => c.phanKhu === pk) : []);
function canLoc(ds) {
  const q = state.qcan.trim().toLowerCase().replace(/\s+/g, '');
  return ds.filter(c =>
    (!state.canToa || c.toa === state.canToa) &&
    (!state.canTT || c.tinhTrang === state.canTT) &&
    (!state.canLoai || c.loai === state.canLoai) &&
    (!q || c.ma.toLowerCase().includes(q)));
}
function canHoHtml(pk) {
  const ds = canPK(pk);
  if (!CAN) return '';
  if (!ds.length) return `<div class="note">Chưa nhận được quỹ căn hộ của phân khu này. Anh/chị gửi yêu cầu để được báo khi có.</div>`;
  const loc = canLoc(ds), trong = ds.filter(c => c.tinhTrang === 'trong').length;
  const uniq = (f) => [...new Set(ds.map(f))].sort();
  const sel = (ten, khoa, gt, nhan) => `<label class="small">${nhan}
    <select data-canloc="${khoa}"><option value="">Tất cả</option>${gt.map(v => `<option value="${esc(v)}"${state[khoa] === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>`;
  return `<h3>Quỹ căn hộ đại lý</h3>
  <p class="mute small">${ds.length} căn trong quỹ chung chủ đầu tư chia cho đại lý, ${trong} căn còn trống. Đây <b>không phải</b> toàn bộ giỏ hàng phân khu. Giá đã gồm VAT và kinh phí bảo trì. Cập nhật ${esc(CAN.capNhat)}.</p>
  <div class="canloc">
    <label class="small">Mã căn <input id="qcan" type="search" inputmode="latin" placeholder="ví dụ ${esc(ds[0].ma)}" value="${esc(state.qcan)}"></label>
    ${sel('toa', 'canToa', uniq(c => c.toa), 'Toà')}
    ${sel('loai', 'canLoai', uniq(c => c.loai), 'Loại căn')}
    <label class="small">Tình trạng <select data-canloc="canTT"><option value="">Tất cả</option><option value="trong"${state.canTT === 'trong' ? ' selected' : ''}>Còn trống</option><option value="coc"${state.canTT === 'coc' ? ' selected' : ''}>Đã cọc</option></select></label>
  </div>
  ${loc.length ? `<table><thead><tr><th>Mã căn</th><th>Loại</th><th class="r">Thông thủy</th><th class="r">Giá</th><th>Tình trạng</th><th></th></tr></thead><tbody>
  ${loc.map(c => { const k = 'can:' + c.ma; return `<tr><td><b>${esc(c.ma)}</b><br><span class="mute small">Toà ${esc(c.toa)} · tầng ${esc(c.tang)}</span></td>
    <td>${esc(c.loai)}</td><td class="r">${c.thongThuy ?? '—'} m²</td><td class="r">${tien(c.gia)}</td>
    <td><span class="tt ${c.tinhTrang}">${c.tinhTrang === 'trong' ? 'Còn trống' : 'Đã cọc'}</span></td>
    <td class="r">${mbCoTang(c) ? `<button class="chip" style="padding:2px 9px" data-mbto="${esc(c.ma)}" title="Xem căn trên mặt bằng tầng">Mặt bằng</button> ` : ''}<button class="chip" style="padding:2px 9px" data-cart="${k}" data-label="${esc(c.ma)} · ${esc(c.loai)}" data-sub="${c.thongThuy ?? '—'} m² · ${tien(c.gia)}" aria-pressed="${inCart(k)}">${inCart(k) ? '✓' : '＋'}</button></td></tr>`; }).join('')}
  </tbody></table>` : '<div class="note">Không có căn nào khớp bộ lọc.</div>'}
  <p class="mute small">Nguồn: ${esc(CAN.nguon)}</p>`;
}
function clusterHtml() {
  const z = ZONES.find(o => o.key === state.zone), k = 'z:' + z.key, on = inCart(k);
  return `<h2>${esc(z.name)}</h2><p class="mute">${z.noGeo ? 'Chưa xác định vị trí trên tổng mặt bằng nên chưa có khối nhấp trên sa bàn. Hồ sơ phân khu vẫn đọc được bên dưới.' : `Khối đế 2 tầng dựng dạng hộp, ba toà căn hộ theo số tầng: ${esc(z.sub.split(' · ')[0])} · ${esc(z.sub.split(' · ')[1])}. Hình gấp khúc của mặt bằng tầng điển hình sẽ bổ sung khi có bản vẽ.`}</p>
  <div class="note">Số căn, diện tích và giá của phân khu này chưa có bảng hàng chính thức. Anh/chị gửi yêu cầu để được báo thông tin mới nhất.</div>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="${k}" data-label="${esc(z.name)}" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Thêm vào giỏ quan tâm'}</button><a class="btn" href="/cam-nang/blanca-${z.profile}/" target="_top">Hồ sơ phân khu →</a></div>
  ${canHoHtml(z.key)}`;
}
function cartHtml() {
  if (!state.cart.length) return `<h2>Giỏ quan tâm</h2><p class="mute">Giỏ đang trống. Chạm vào căn trên sa bàn hoặc chọn trong danh sách, rồi bấm "Thêm vào giỏ quan tâm". Anh/chị có thể gửi cả giỏ để được tư vấn một lần.</p><div class="row"><button class="btn primary" data-go="explore">Khám phá sa bàn</button></div>${consultMini()}`;
  const units = state.cart.filter(c => c.k.startsWith('u:')).map(c => U[+c.k.slice(2)]);
  const cmp = units.length >= 2 ? `<h3>So sánh nhanh</h3><div style="overflow:auto"><table><thead><tr><th>Căn</th><th>Loại</th><th class="r">Đất ≈ m²</th><th class="r">Tầng</th></tr></thead><tbody>${units.map(u => `<tr><td>${u.code}</td><td>${TYPES[u.t].short}</td><td class="r">${land(u)}</td><td class="r">${TYPES[u.t].floors}</td></tr>`).join('')}</tbody></table></div>` : '';
  return `<h2>Giỏ quan tâm <span class="mute" style="font-size:15px">(${state.cart.length})</span></h2>
  <div class="list">${state.cart.map(c => `<div class="item"><i style="background:var(--gold)"></i><div><b>${esc(c.label)}</b><span>${esc(c.sub || '')}</span></div>${c.k.startsWith('u:') ? `<button class="chip" data-unit="${c.k.slice(2)}" style="margin-left:auto">Xem</button>` : ''}<button class="x" data-cart="${esc(c.k)}" aria-label="Bỏ ${esc(c.label)}">×</button></div>`).join('')}</div>${cmp}
  <h3>Gửi yêu cầu tư vấn cho cả giỏ</h3>${formHtml('request')}`;
}
function consultMini() { return `<div class="card contact"><div class="avatar">AT</div><div><b>Nguyễn Anh Tú</b><br><span class="mute small">Project Director · ERA Vietnam</span></div></div><div class="row"><a class="btn primary" href="tel:${ZALO}">Gọi ${ZALO_TXT}</a><a class="btn" href="https://zalo.me/${ZALO}" target="_blank" rel="noopener">Nhắn Zalo</a></div>`; }

/* ---------- phiếu ký gửi thứ cấp (PROJECT_RULES §16.5–16.7) ---------- */
const VAT_KPBT = 1.12;          // VAT 10% + kinh phí bảo trì 2%, chỉ dùng khi chủ nhà không điền giá gốc
const docSo = (v) => { const n = Number(String(v || '').replace(/[^\d]/g, '')); return Number.isFinite(n) && n > 0 ? n : 0; };
const soVN = (n) => n ? n.toLocaleString('vi-VN') + ' đ' : '—';
const MUC_HH = [3, 2, 1];
function mauChup(ten, moTa, svg) {
  return `<details class="mauchup"><summary>${esc(ten)}</summary><div class="mauchup-in">${svg}<p class="mute small">${esc(moTa)}</p></div></details>`;
}
const khungTrang = (hl) => `<svg viewBox="0 0 96 124" width="96" height="124" aria-hidden="true">
  <rect x="3" y="3" width="90" height="118" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>
  ${[...Array(9)].map((_, i) => `<rect x="12" y="${20 + i * 11}" width="${i % 3 === 2 ? 48 : 72}" height="4" rx="2" fill="currentColor" opacity=".22"/>`).join('')}
  <rect x="${hl[0]}" y="${hl[1]}" width="${hl[2]}" height="${hl[3]}" rx="3" fill="none" stroke="#e3b366" stroke-width="2.5"/>
</svg>`;
const khungThe = `<svg viewBox="0 0 124 84" width="124" height="84" aria-hidden="true">
  <rect x="3" y="3" width="118" height="78" rx="7" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>
  <rect x="12" y="20" width="30" height="38" rx="3" fill="currentColor" opacity=".18"/>
  ${[...Array(4)].map((_, i) => `<rect x="50" y="${22 + i * 10}" width="${i === 0 ? 58 : 46}" height="4" rx="2" fill="currentColor" opacity=".22"/>`).join('')}
  <rect x="7" y="7" width="110" height="70" rx="5" fill="none" stroke="#e3b366" stroke-width="2.5"/>
</svg>`;
function consignHtml(u) {
  const consent = `<label class="check"><input type="checkbox" name="consent" required> <span>Tôi xác nhận là chủ sở hữu hoặc được chủ sở hữu uỷ quyền ký gửi căn này, và đồng ý để Nguyễn Anh Tú lưu, dùng thông tin để môi giới. Xem <a href="/chinh-sach-bao-mat/" target="_top">chính sách bảo mật</a>.</span></label>`;
  return `<form data-kind="consign" novalidate>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <h4>Người ký gửi</h4>
  <label>Họ tên<input name="name" required minlength="2" maxlength="80" autocomplete="name"></label>
  <label>Số điện thoại / Zalo<input name="phone" required inputmode="tel" pattern="[0-9+ .\-]{9,16}" autocomplete="tel" placeholder="09xx xxx xxx"></label>
  <label>Email<input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="ten@email.com"></label>

  <h4>Thông tin căn</h4>
  <label>Nhu cầu<select name="purpose"><option>Bán</option><option>Cho thuê</option></select></label>
  <label>Mã căn<input name="unit" required maxlength="80" value="${u ? esc(u.code) : ''}" placeholder="Ví dụ E50715, B20519, DL-012"></label>
  <label>Giá mua trên hợp đồng, đã gồm VAT và kinh phí bảo trì<input name="giaMuaHD" inputmode="numeric" required maxlength="20" placeholder="5500000000"></label>
  <label>Giá bán mong muốn<input name="giaBan" inputmode="numeric" required maxlength="20" placeholder="5900000000"></label>
  <p class="tinh">Giá chênh: <b id="hhChenh">—</b> <span class="mute small">(giá bán trừ giá mua trên hợp đồng, hệ thống tự tính)</span></p>
  <label class="check"><input type="checkbox" name="thuongLuong"> <span>Giá còn thương lượng</span></label>
  <label class="check"><input type="checkbox" name="giaNet"> <span>Giá net (chủ nhà nhận đủ, phí và thuế bên mua chịu)</span></label>
  <label>Giá mua chưa gồm VAT và kinh phí bảo trì <span class="mute small">(không bắt buộc — dùng để tính hoa hồng)</span><input name="giaMuaGoc" inputmode="numeric" maxlength="20" placeholder="Để trống thì hệ thống tạm tính"></label>

  <h4>Hoa hồng môi giới</h4>
  <p class="mute small">Tính trên giá bán cuối cùng = giá mua <b>chưa gồm</b> VAT và kinh phí bảo trì, cộng giá chênh. Chọn một mức:</p>
  <table class="hhtbl"><thead><tr><th>Mức</th><th class="r">Giao dịch trong 30 ngày</th><th class="r">Giao dịch sau 30 ngày</th></tr></thead><tbody>
  ${MUC_HH.map(p => `<tr><th>${p}%</th>
    <td class="r"><label class="hho"><input type="radio" name="hhMuc" value="trong30-${p}"> <span data-hh="trong30-${p}">—</span></label></td>
    <td class="r"><label class="hho"><input type="radio" name="hhMuc" value="sau30-${p}"> <span data-hh="sau30-${p}">—</span></label></td></tr>`).join('')}
  </tbody></table>
  <p class="mute small" id="hhGoc">Chưa đủ số để tính.</p>

  <h4>Tài liệu xác minh căn <span class="mute small">(được công khai thông tin)</span></h4>
  ${mauChup('Ảnh trang có tiêu đề hợp đồng', 'Chụp rõ phần tiêu đề và số hợp đồng ở đầu trang. Không cần che gì.', khungTrang([10, 10, 76, 16]))}
  ${mauChup('Ảnh bảng tính căn trong hợp đồng', 'Chụp trọn bảng diện tích, đơn giá và tổng giá. Giữ bảng nằm ngang, đủ bốn góc.', khungTrang([10, 52, 76, 34]))}
  <label>Ngày ký hợp đồng<input name="ngayHD" type="date" max="2099-12-31"></label>
  <h4>Tài liệu xác minh chính chủ <span class="mute small">(bảo mật, không công khai)</span></h4>
  ${mauChup('Ảnh CCCD hoặc VNeID', 'Chụp mặt có ảnh và số định danh, đủ bốn góc thẻ, không loá. Chỉ dùng để đối chiếu chính chủ.', khungThe)}
  ${mauChup('Ảnh phần thông tin cá nhân trên hợp đồng', 'Chụp đúng khối thông tin bên mua trên hợp đồng.', khungTrang([10, 28, 76, 24]))}
  <h4>Hình ảnh thực tế căn <span class="mute small">(nếu có)</span></h4>
  <p class="mute small">Chỉ nhận ảnh chụp thực tế. <b>Không nhận ảnh phối cảnh</b> của chủ đầu tư.</p>
  <div class="note small">Gửi phiếu xong anh/chị sẽ nhận một <b>mã phiếu</b>. Gửi các ảnh trên qua Zalo ${ZALO_TXT} kèm mã phiếu đó. Trang chưa nhận tải ảnh trực tiếp để tránh giữ giấy tờ tuỳ thân trên máy chủ khi chưa có chỗ lưu riêng.</div>
  <label>Ghi chú thêm<textarea name="note" maxlength="400" placeholder="Hướng, tầng, nội thất, thời điểm bàn giao…"></textarea></label>
  ${consent}
  <button class="btn primary block" type="submit">Gửi phiếu ký gửi</button><div class="status" role="status" aria-live="polite"></div></form>`;
}
function capNhatHoaHong(form) {
  if (!form) return;
  const g = n => docSo(form.elements[n] && form.elements[n].value);
  const hd = g('giaMuaHD'), ban = g('giaBan'), goc0 = g('giaMuaGoc');
  const chenh = hd && ban ? ban - hd : 0;
  const el = $('#hhChenh', form); if (el) el.textContent = chenh ? soVN(chenh) : '—';
  const goc = goc0 || (hd ? Math.round(hd / VAT_KPBT) : 0);
  const nen = goc ? goc + chenh : 0;
  const ghi = $('#hhGoc', form);
  if (ghi) ghi.textContent = nen
    ? `Giá bán cuối dùng để tính hoa hồng: ${soVN(nen)}${goc0 ? '' : ' — giá gốc là tạm tính bằng giá hợp đồng chia 1,12 vì chưa điền'}.`
    : 'Chưa đủ số để tính.';
  for (const sp of form.querySelectorAll('[data-hh]')) {
    const p = Number(sp.dataset.hh.split('-')[1]);
    sp.textContent = nen ? soVN(Math.round(nen * p / 100)) : '—';
  }
}
function consultHtml() {
  const u = state.consignMa ? { code: state.consignMa } : state.sel >= 0 ? U[state.sel] : null;
  return `<h2>Tư vấn trực tiếp</h2>${consultMini()}
  <p class="mute small">Tư vấn viên giải đáp về pháp lý, tiến độ, so sánh phân khu và cách tính dòng tiền. Thông tin mang tính tham khảo, không phải cam kết về giá hay chính sách bán hàng.</p>
  <h3>Đặt lịch gọi lại</h3>${formHtml('callback')}
  <details id="consignBox"${state.openConsign ? ' open' : ''}><summary>Ký gửi căn (bán hoặc cho thuê)</summary>${consignHtml(u)}</details>`;
}
let formOpened = performance.now();
function formHtml(kind, u) {
  const consent = `<label class="check"><input type="checkbox" name="consent" required> <span>Tôi đồng ý để Nguyễn Anh Tú lưu và dùng thông tin này để liên hệ tư vấn. Xem <a href="/chinh-sach-bao-mat/" target="_top">chính sách bảo mật</a>.</span></label>`;
  const base = `<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label>Họ tên<input name="name" required minlength="2" maxlength="80" autocomplete="name"></label><label>Số điện thoại / Zalo<input name="phone" required inputmode="tel" pattern="[0-9+ .\\-]{9,16}" autocomplete="tel" placeholder="09xx xxx xxx"></label>`;
  const send = t => `<button class="btn primary block" type="submit">${t}</button><div class="status" role="status" aria-live="polite"></div>`;
  if (kind === 'request') return `<form data-kind="request" novalidate>${base}<label>Mục đích<select name="intent"><option>Mua để ở</option><option>Đầu tư / cho thuê</option><option>Đang so sánh</option></select></label><label>Ngân sách dự kiến (không bắt buộc)<input name="budget" maxlength="60" placeholder="Ví dụ: 8–10 tỷ"></label><label>Ghi chú<textarea name="note" maxlength="400" placeholder="Hướng, tầng, thời gian xem nhà…"></textarea></label>${consent}${send('Gửi yêu cầu · ' + state.cart.length + ' mục')}</form>`;
  if (kind === 'callback') return `<form data-kind="callback" novalidate>${base}<label>Thời điểm tiện gọi<select name="when"><option>Sớm nhất có thể</option><option>Buổi sáng</option><option>Buổi chiều</option><option>Buổi tối</option></select></label><label>Anh/chị muốn hỏi gì?<textarea name="note" maxlength="400"></textarea></label>${consent}${send('Đặt lịch gọi lại')}</form>`;
  return `<form data-kind="consign" novalidate>${base}<label>Nhu cầu<select name="purpose"><option>Bán</option><option>Cho thuê</option></select></label><label>Mã căn hoặc vị trí<input name="unit" required maxlength="160" value="${u ? esc(PROJECT + ' · ' + lab(u) + ' (' + u.code + ')') : ''}" placeholder="Phân khu, mã căn, dãy…"></label><label>Giá mong muốn<input name="price" maxlength="100" placeholder="Hoặc để trống để trao đổi"></label>${consent}${send('Gửi phiếu ký gửi')}</form>`;
}
async function submitForm(form) {
  const kind = form.dataset.kind, f = new FormData(form), status = $('.status', form), btn = $('button[type=submit]', form);
  const get = n => String(f.get(n) || '').trim();
  const phone = get('phone').replace(/[^\d+]/g, '');
  status.className = 'status';
  if (get('name').length < 2) { status.textContent = 'Vui lòng nhập họ tên.'; status.classList.add('err'); form.name.focus(); return; }
  if (!/^(\+84|84|0)\d{8,9}$/.test(phone)) { status.textContent = 'Số điện thoại chưa đúng. Ví dụ: 0978 618 149.'; status.classList.add('err'); form.phone.focus(); return; }
  if (!f.get('consent')) { status.textContent = 'Cần tick đồng ý để chúng tôi liên hệ.'; status.classList.add('err'); return; }
  if (kind === 'consign') {
    const sai = (msg, tr) => { status.textContent = msg; status.classList.add('err'); if (tr) tr.focus(); };
    if (!get('unit')) { sai('Vui lòng ghi mã căn.', form.unit); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(get('email'))) { sai('Email chưa đúng.', form.email); return; }
    if (!docSo(get('giaMuaHD'))) { sai('Vui lòng ghi giá mua trên hợp đồng.', form.giaMuaHD); return; }
    if (!docSo(get('giaBan'))) { sai('Vui lòng ghi giá bán mong muốn.', form.giaBan); return; }
    if (docSo(get('giaBan')) < docSo(get('giaMuaHD'))) { sai('Giá bán đang thấp hơn giá mua. Kiểm tra lại giúp em.', form.giaBan); return; }
  }
  const body = {
    kind, project: PROJECT, zone: ZONES.find(z => z.key === state.zone)?.name || '', name: get('name'), phone, consent: true,
    units: kind === 'request' ? state.cart.map(c => c.label + (c.sub ? ' (' + c.sub + ')' : '')) : [],
    intent: get('intent'), budget: get('budget'), note: get('note'), when: get('when'), purpose: get('purpose'), unit: get('unit'), price: get('price'),
    website: get('website'), t: Math.round(performance.now() - formOpened), page: location.pathname + location.hash,
  };
  if (kind === 'consign') {
    const hd = docSo(get('giaMuaHD')), ban = docSo(get('giaBan')), goc0 = docSo(get('giaMuaGoc'));
    const goc = goc0 || Math.round(hd / VAT_KPBT), chenh = ban - hd, nen = goc + chenh;
    const muc = get('hhMuc'), p = muc ? Number(muc.split('-')[1]) : 0;
    Object.assign(body, {
      email: get('email'), giaMuaHD: hd, giaBan: ban, giaChenh: chenh,
      giaMuaGoc: goc, giaGocTamTinh: !goc0, giaBanCuoi: nen,
      thuongLuong: !!f.get('thuongLuong'), giaNet: !!f.get('giaNet'),
      ngayHD: get('ngayHD'), hoaHongMuc: muc, hoaHongPhanTram: p,
      hoaHongDuTinh: p ? Math.round(nen * p / 100) : 0,
    });
  }
  btn.disabled = true; const old = btn.textContent; btn.textContent = 'Đang gửi…'; status.textContent = '';
  try {
    const r = await fetch('/api/tim-nha', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok || !j.stored) throw Error(j.error || r.status);
    form.outerHTML = `<div class="done" role="status"><b>Đã nhận phiếu ${esc(j.id)}</b><p>${kind === 'consign' ? 'Phiếu ký gửi' : kind === 'callback' ? 'Lịch gọi lại' : 'Yêu cầu của anh/chị'} đã được lưu. Tư vấn viên sẽ liên hệ qua số ${esc(phone)} sớm nhất. Cần gấp, nhắn Zalo ${ZALO_TXT}.</p>${kind === 'consign' ? `${j.auto && j.auto.camOn ? `<p>Thư xác nhận đã gửi tới <b>${esc(body.email)}</b>. Sau ${15} ngày em sẽ hỏi lại anh/chị tình trạng căn qua email.</p>` : ''}<p><b>Còn một bước:</b> gửi các ảnh hợp đồng và giấy tờ chính chủ qua Zalo ${ZALO_TXT}, nhắn kèm mã phiếu <b>${esc(j.id)}</b>. Chưa có ảnh thì chưa đăng căn lên giỏ hàng được.</p><a class="btn block" href="https://zalo.me/${ZALO}" target="_blank" rel="noopener">Mở Zalo gửi ảnh kèm mã ${esc(j.id)}</a>` : ''}</div>`;
    if (kind === 'request') { state.cart = []; saveCart(); refreshStates(); renderTabs(); }
  } catch (err) {
    btn.disabled = false; btn.textContent = old;
    const msg = ['Yêu cầu', 'Dự án: ' + PROJECT, body.units.length ? 'Căn: ' + body.units.join('; ') : '', kind === 'consign' ? 'Ký gửi: ' + body.unit + ' · ' + body.purpose + (body.price ? ' · giá ' + body.price : '') : '', 'Tên: ' + body.name, 'SĐT: ' + phone, body.note ? 'Ghi chú: ' + body.note : ''].filter(Boolean).join('\n');
    status.className = 'status err';
    status.innerHTML = 'Chưa gửi được, <b>phiếu CHƯA được lưu</b>. Bấm nút dưới để sao chép nội dung rồi gửi qua Zalo.';
    const z = document.createElement('a'); z.className = 'btn block'; z.textContent = 'Sao chép nội dung và mở Zalo';
    z.href = 'https://zalo.me/' + ZALO; z.target = '_blank'; z.rel = 'noopener';
    z.onclick = () => { try { navigator.clipboard.writeText(msg); } catch {} };
    status.after(z);
  }
}

/* ---------- sự kiện giao diện ---------- */
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.canloc;
  if (!k) return;
  state[k] = e.target.value; state.keepScroll = true; render();
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-tab],[data-zone],[data-go],[data-type],[data-unit],[data-cart],[data-ask],[data-mode],[data-zoom],[data-base],[data-sun]'); if (!el) return;
  const d = el.dataset;
  if (d.tab) { state.tab = d.tab; render(); }
  else if (d.go) { state.tab = d.go; render(); }
  else if (d.zone) selectZone(d.zone);
  else if (d.type !== undefined) selectType(+d.type);
  else if (d.unit !== undefined) { const i = +d.unit; if (i < 0) { selectUnit(-1); fly(zoneView('casa', state.type)); } else selectUnit(i); }
  else if (d.cart) { state.keepScroll = true; toggleCart(d.cart, d.label || (state.cart.find(c => c.k === d.cart) || {}).label, d.sub); }
  else if (d.ask) { selectUnit(+d.ask, { fly: false }); if (!inCart('u:' + d.ask)) toggleCart('u:' + d.ask, lab(U[+d.ask]), U[+d.ask].code + ' · ≈' + land(U[+d.ask]) + ' m²'); state.tab = 'cart'; render(); }
  else if (d.mode) { if (d.mode === 'status' && !hasInv()) return; state.mode = d.mode; uploadStatic(); render(); }
  else if (d.zoom) { $('#lbImg').src = d.zoom; $('#lightbox').hidden = false; $('#lbClose').focus(); }
  else if (d.base) { state.base = d.base; state.keepScroll = true; if (d.base !== 'plan' && state.osm === 'chua') loadOsm(); dirty = true; render(); }
  else if (d.sun === 'now') { state.sunT = null; capNhatNang(); state.keepScroll = true; render(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'sunh') {
    const d = new Date(); const g = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const nua = Date.now() - (g.getHours() * 3600 + g.getMinutes() * 60 + g.getSeconds()) * 1000;
    state.sunT = nua + Number(e.target.value) * 600000;
    capNhatNang(); const b = $('.sunbar b'); if (b) b.textContent = gioPhut(state.sunT);
    const c = $('#clock'); if (c) c.textContent = gioPhut(state.sunT);
    return;
  }
  const fc = e.target.closest && e.target.closest('form[data-kind=consign]');
  if (fc) { capNhatHoaHong(fc); return; }
  if (e.target.id === 'qcan') { state.qcan = e.target.value; const pos = e.target.selectionStart; state.keepScroll = true; render(); const q = $('#qcan'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } return; }
  if (e.target.id === 'q') { state.q = e.target.value; const pos = e.target.selectionStart; state.keepScroll = true; render(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); } });
document.addEventListener('change', e => {
  if (e.target.id === 'sunh') { state.keepScroll = true; render(); return; }
  if (e.target.id === 'sheet') { state.sheet = +e.target.value; state.keepScroll = true; render(); } });
document.addEventListener('submit', e => { const f = e.target.closest('form[data-kind]'); if (f) { e.preventDefault(); submitForm(f); } });
document.addEventListener('toggle', e => { if (e.target.id === 'consignBox') state.openConsign = e.target.open; }, true);
$('#lbClose').onclick = () => { $('#lightbox').hidden = true; };
$('#lightbox').onclick = e => { if (e.target.id === 'lightbox') $('#lightbox').hidden = true; };
addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').hidden = true; });
$('#bIn').onclick = () => { T.dist = Math.max(28, T.dist * .72); dirty = true; };
$('#bOut').onclick = () => { T.dist = Math.min(XA_NHAT, T.dist / .72); dirty = true; };
$('#bNorth').onclick = () => { fly({ ...T, yaw: -rad(geo.north) }); };
for (const b of document.querySelectorAll('[data-docao]')) b.onclick = () => { selectUnit(-1); fly(gocDoCao(+b.dataset.docao)); };
$('#bHome').onclick = () => { selectUnit(-1); selectZone('all'); fly({ ...homeView(), yaw: T.yaw }); };
$('#bRanh').onclick = () => { state.ranh = !state.ranh; dirty = true; render(); };
$('#bNight').onclick = () => { state.night = !state.night; dirty = true; render(); };
$('#bLabels').onclick = () => { state.hideLabels = !state.hideLabels; dirty = true; render(); };
$('#bBase').onclick = () => {
  const thu = ['osm', 'plan', 'blend'];
  state.base = thu[(thu.indexOf(state.base) + 1) % 3];
  if (state.base !== 'plan' && state.osm === 'chua') loadOsm();
  dirty = true; render();
};
document.addEventListener('click', e => {
  const r = e.target.closest('.rb'); if (!r) return;
  const k = r.dataset.rail;
  if (k === 'blocks') { state.blocks = !state.blocks; dirty = true; render(); return; }
  state.rail = state.rail === k ? null : k;
  if (state.rail === 'cart') state.tab = 'cart';
  else if (state.rail === 'env') state.tab = 'env';
  else if (state.rail === 'infra') state.tab = 'explore';
  if (state.rail !== 'floors') { state.cut = 0; dirty = true; }
  render();
});
document.addEventListener('click', e => {
  const f = e.target.closest('[data-cut]'); if (!f) return;
  state.cut = Number(f.dataset.cut); dirty = true; render();
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mbtang],[data-mbdong],[data-mbbuoc],[data-mbto],[data-mbcan],[data-pttt],[data-mbky],[data-mbhoi]'); if (!b) return;
  const d = b.dataset; state.keepScroll = true;
  if (d.mbdong) dongMatBang();
  else if (d.mbtang) moMatBang(d.mbtang, null, d.mbkhu);
  else if (d.mbbuoc) buocTang(+d.mbbuoc);
  else if (d.mbto) { const c = CAN && CAN.can.find(x => x.ma === d.mbto); if (c) { const t = tangNhan(c.tang); moMatBang(t, c.toa + c.can, c.phanKhu); } }
  else if (d.mbcan !== undefined) chonCanMB(+d.mbcan);
  else if (d.pttt) { state.pttt = d.pttt; render(); }
  else if (d.mbky) { state.consignMa = d.mbky; state.openConsign = true; state.tab = 'consult'; state.keepScroll = false; render(); }
  else if (d.mbhoi) { const ma = d.mbhoi, c = CAN && CAN.can.find(x => x.ma === ma); const k = 'can:' + ma; if (!inCart(k)) toggleCart(k, ma + ' · ' + TEN_KHU[khuMB()], c ? `${c.thongThuy} m² · ${tien(c.gia)}` : 'Căn trên mặt bằng tầng'); state.tab = 'cart'; state.keepScroll = false; render(); }
});
document.addEventListener('change', e => { if (e.target.id === 'mbTangSel') moMatBang(e.target.value); });
document.addEventListener('click', e => {
  const m = e.target.closest('[data-market]'); if (!m || m.disabled) return;
  state.market = m.dataset.market; uploadStatic(); render();
});
addEventListener('hashchange', openHash);
new ResizeObserver(() => { dirty = pickDirty = true; }).observe(canvas);

function capNhatNang() { SUN = sunNow(); dirty = true; }

/* ---------- khởi động ---------- */
(async () => {
  render(); buildLabels();
  const [geoRaw, invData, plan, gref, chan, canHo, ranh, matBang] = await Promise.all([
    fetch('geometry.json').then(r => r.json()),
    fetch('inventory.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null),
    new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'plan.webp'; }),
    fetch('georef.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('chan-thap.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('can-ho.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('ranh-du-an.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('mat-bang.json').then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  if (invData && invData.units) inv = invData;
  if (gref) { GEO = gref; geo.init(gref); }
  else geo.init({ tyLe: { metTrenDonVi: geo.mpu }, huong: { bacSoVoiTrucDocAnh: geo.north }, neo: { lat: geo.lat0, lon: geo.lon0, planX: 488, planY: 268 } });
  RANH = ranh; CHAN = chan; CAN = canHo; MB = matBang;
  await hoiNen();
  TOWERS = dungThap();
  if (CHUP) {
    // Ảnh đại diện luôn chụp lúc trời sáng, không phụ thuộc giờ chạy script: ?gio=14 (giờ Việt Nam, mặc định 14:00)
    const gio = +(new URLSearchParams(location.search).get('gio') || 14), vn = new Date(Date.now() + 7 * 3600e3);
    state.sunT = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - 7 * 3600e3 + gio * 3600e3;
  }
  capNhatNang();
  setInterval(() => { if (state.sunT == null) { capNhatNang(); if (state.tab === 'env') render(); } }, 60000);
  buildUnits(geoRaw);
  datThucDia(); VT.dich = viTriDich(); datViTri(VT.dich);
  if (gl) {
    try { initGL(plan); resize(); buildRanh(); const h = homeView(); Object.assign(C, { ...h, dist: h.dist * 1.6, pitch: 1.3 }); fly(h); requestAnimationFrame(frame); if (state.base !== 'plan') loadOsm(); }
    catch (err) { console.error(err); $('#nogl').hidden = false; }
  } else $('#nogl').hidden = false;
  render(); openHash();
  window.__blanca = { fly, CAN: () => CAN, MB: () => MB, moMatBang, dongMatBang, mbHit, gocDoCao, doCaoMet, state, U, C, T, osmXa, osmGiua, tiaMatDat, phongTai, selectUnit, selectZone, geo, osm, sunNow, SUN: () => SUN, capNhatNang, RANH: () => RANH, NEN, TOWERS: () => TOWERS, VT };
})().catch(err => { console.error(err); $('#pane').innerHTML = '<h2>Chưa tải được dữ liệu sa bàn</h2><p class="mute">Vui lòng tải lại trang hoặc nhắn Zalo ' + ZALO_TXT + '.</p>'; });
})();
