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
function dungThap() {
  const t = [], zDe = donVi(SO_TANG_DE * CAO_DE);
  for (const k of KHOI) {
    const d = CHAN && CHAN.khoi && CHAN.khoi[k.zone];
    if (!d) continue;
    const [bx0, by0, bx1, by1] = d.bao;
    t.push({ x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, w: bx1 - bx0, h: by1 - by0, z0: 0, z: zDe,
             zone: k.zone, col: k.col, name: `Khối đế ${k.ten} · ${SO_TANG_DE} tầng` });
    const n = k.thap.length, b = (bx1 - bx0) / n;
    for (const [lx, ly, lw, lh] of d.lat) {
      const i = Math.max(0, Math.min(n - 1, Math.floor((lx + lw / 2 - bx0) / b)));
      const [ten, tang] = k.thap[i];
      t.push({ x: lx + lw / 2, y: ly + lh / 2, w: lw + .04, h: lh, z0: zDe, z: donVi(caoM(tang)),
               zone: k.zone, col: k.col, name: `${k.ten} · ${ten} · ${tang} tầng` });
    }
  }
  for (const b of THAP_B) {
    t.push({ x: b.x, y: b.y, w: b.w + 6, h: b.h * .5, z0: 0, z: zDe, zone: b.zone, col: b.col, name: 'Khối đế ' + b.ten });
    t.push({ x: b.x, y: b.y, w: b.w, h: b.h, z0: zDe, z: donVi(caoM(b.tang)),
             zone: b.zone, col: b.col, name: `${b.ten} · ${b.tang} tầng` });
  }
  return t;
}
let TOWERS = [];
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
const state = { zone: 'all', type: -1, sel: -1, hover: -1, tab: 'explore', mode: 'type', cart: [], q: '', sheet: 0, base: 'osm', sunT: null, osm: 'chua', night: false, hideLabels: false, blocks: true, cut: 0, market: 'all', rail: null, ranh: true };
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
      this.mLat = 111320; this.mLon = 111320 * Math.cos(rad(this.lat0));
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
const HOME = { tx: 476, ty: PLAN_H - 232, tz: 0, dist: 940, yaw: .3, pitch: .92 };
function homeView() { return { ...HOME, dist: HOME.dist * (innerWidth < 860 ? 1.1 : Math.min(1.3, Math.max(.9, 950 / Math.max(620, canvas.clientWidth)))) }; }
const C = { ...HOME }, T = { ...HOME };
const W = y => PLAN_H - y; // y ảnh → Y thế giới
function fly(o, instant) {
  Object.assign(T, o);
  T.pitch = Math.max(.2, Math.min(1.5, T.pitch)); T.dist = Math.max(28, Math.min(1500, T.dist)); if (T.tz == null) T.tz = 0;
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
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false });
let dirty = true, pickDirty = true, nInst = 0, prog, gprog, lprog, ranhVAO = null, ranhN = 0, RANH = null, boxVAO, roofVAO, gVAO, stat, dyn, planTex, fbo, fboTex, fboDepth, fboW = 0, fboH = 0;
const dynArr = [];
const U_ = {};

const VS = `#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm;
layout(location=2) in vec4 iBox; layout(location=3) in vec4 iZ; layout(location=4) in vec4 iCol; layout(location=5) in vec2 iSt;
uniform mat4 uVP; uniform int uPass; uniform vec2 uShadow; uniform float uUnits; uniform float uCut;
out vec3 vN; out vec3 vCol; out float vH; out float vSt; out float vId; out vec3 vW;
void main(){
  vec3 p; vec3 n=aNrm; vH=aPos.z;
  if(uPass==0){
    float top=iZ.y;
    if(uCut>0.&&iSt.y>uUnits) top=min(top,uCut);
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
uniform vec3 uSun; uniform float uNight;
out vec4 o;
void main(){
  if(uPick==1){ int id=int(vId+.5); o=vec4(float(id&255)/255.,float((id>>8)&255)/255.,float((id>>16)&255)/255.,1.); return; }
  if(uPass==2){ o=vec4(0.,0.,0.,.3); return; }
  vec3 n=normalize(vN); vec3 L=uSun;
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
  if(uPass==0){ c*=.82+.18*vH; if(vId>uUnits&&n.z<.5){ float f=fract(vW.z/1.45); c*=.88+.12*step(.38,f); } }
  if(s==1||s==3) c+=vec3(.12,.1,.04);
  float fog=smoothstep(900.,2600.,length(uEye-vW)); c=mix(c,uFog,fog);
  o=vec4(c,1.);
}`;
const GVS = `#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec2 a;
uniform mat4 uVP; uniform vec2 uOrigin; uniform vec2 uSize; uniform vec2 uPad; uniform float uRot;
out vec2 vUV;
void main(){
  vec2 q=a*uPad*uSize*.5;
  float c=cos(uRot), si=sin(uRot);
  vec2 w=uOrigin+vec2(c*q.x-si*q.y, si*q.x+c*q.y);
  vUV=vec2(a.x*uPad.x*.5+.5, .5-a.y*uPad.y*.5);
  gl_Position=uVP*vec4(w,0.,1.);
}`;
const GFS = `#version 300 es
precision highp float; precision highp int;
in vec2 vUV; uniform sampler2D uTex; uniform vec3 uFog; uniform int uMask; uniform float uDim; uniform float uAlpha; uniform float uNight;
out vec4 o;
void main(){
  vec2 uv=clamp(vUV,0.,1.);
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
  o=vec4(c,uAlpha);
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
  for (const k of ['uVP', 'uPass', 'uShadow', 'uPick', 'uEye', 'uFog', 'uUnits', 'uSun', 'uNight', 'uCut']) U_[k] = gl.getUniformLocation(prog, k);
  for (const k of ['uVP', 'uFog', 'uTex', 'uOrigin', 'uSize', 'uPad', 'uRot', 'uMask', 'uDim', 'uAlpha', 'uNight']) U_['g_' + k] = gl.getUniformLocation(gprog, k);
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
  TOWERS.forEach((t, j) => { const o = (U.length + j) * 12; a.set([t.x, W(t.y), t.w, t.h, t.z0 || 0, t.z, 0, 0, ...t.col, 1], o); });
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
  return { vp: M.mul(M.persp(.66, canvas.width / canvas.height, near, 6000), M.look(e, [C.tx, C.ty, C.tz], [0, 0, 1])), eye: e };
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
  gl.uniform1f(U_.uUnits, U.length + .5); gl.uniform1f(U_.uCut, state.cut || -1); gl.uniform1i(U_.uPick, pick ? 1 : 0);
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
  if (!pick) drawRanh(vp);
}
function nightLevel() { if (state.night) return 1; const e = (SUN || { el: 45 }).el; return e > 2 ? 0 : e < -6 ? 1 : (2 - e) / 8; }
function drawGround(vp) {
  const night = nightLevel();
  const osmOn = osm.tex && (state.base === 'osm' || state.base === 'blend');
  gl.useProgram(gprog); gl.uniformMatrix4fv(U_.g_uVP, false, vp); gl.uniform3fv(U_.g_uFog, FOG);
  gl.uniform1i(U_.g_uTex, 0); gl.uniform1f(U_.g_uNight, night);
  gl.activeTexture(gl.TEXTURE0); gl.bindVertexArray(gVAO); gl.depthMask(false);
  // lớp 1: ảnh tổng mặt bằng (ở chế độ "bản đồ thật" chỉ còn là nền mờ bao quanh)
  gl.bindTexture(gl.TEXTURE_2D, planTex);
  gl.uniform2f(U_.g_uOrigin, PLAN_W / 2, PLAN_H / 2); gl.uniform2f(U_.g_uSize, PLAN_W, PLAN_H);
  gl.uniform2f(U_.g_uPad, 2.708, 3.148); gl.uniform1f(U_.g_uRot, 0);
  gl.uniform1i(U_.g_uMask, 1); gl.uniform1f(U_.g_uDim, state.base === 'osm' ? (osm.tex ? 1 : .4) : 0); gl.uniform1f(U_.g_uAlpha, 1);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  // lớp 2: khảm OpenStreetMap, xoay về đúng hướng Bắc thật
  if (osmOn) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindTexture(gl.TEXTURE_2D, osm.tex);
    gl.uniform2f(U_.g_uOrigin, osm.cx, osm.cy); gl.uniform2f(U_.g_uSize, osm.w, osm.h);
    gl.uniform2f(U_.g_uPad, 1, 1); gl.uniform1f(U_.g_uRot, -rad(geo.north));
    gl.uniform1i(U_.g_uMask, NEN.kieu === 've-tinh' ? 4 : 2); gl.uniform1f(U_.g_uDim, 0); gl.uniform1f(U_.g_uAlpha, state.base === 'blend' ? .55 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
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
async function loadOsm() {
  if (state.osm === 'dang' || state.osm === 'xong') return;
  if (!geo.ok) { state.osm = 'loi'; render(); return; }
  state.osm = 'dang'; render();
  try {
    const goc = [[0, 0], [PLAN_W, 0], [PLAN_W, PLAN_H], [0, PLAN_H]].map(([px, py]) => geo.latLon(px, PLAN_H - py));
    const lats = goc.map(g => g[0]), lons = goc.map(g => g[1]);
    let z = 17, tx0, tx1, ty0, ty1, n;
    for (; z >= 13; z--) {
      n = Math.pow(2, z);
      tx0 = Math.floor(tileX(Math.min(...lons), n)); tx1 = Math.floor(tileX(Math.max(...lons), n));
      ty0 = Math.floor(tileY(Math.max(...lats), n)); ty1 = Math.floor(tileY(Math.min(...lats), n));
      if ((tx1 - tx0 + 1) * (ty1 - ty0 + 1) <= 40) break;
    }
    const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1;
    const cv = document.createElement('canvas'); cv.width = cols * 256; cv.height = rows * 256;
    const cx2 = cv.getContext('2d');
    const jobs = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++)
      jobs.push(tai1Tile(urlTile(z, tx, ty)).then(im => { if (im) cx2.drawImage(im, (tx - tx0) * 256, (ty - ty0) * 256); return !!im; }));
    let kq = await Promise.all(jobs);
    let duoc = kq.filter(Boolean).length;
    if (!duoc && NEN.qua === 'api') {
      NEN.qua = 'osm'; NEN.kieu = 'duong-pho'; NEN.ghiNhan = '© những người đóng góp OpenStreetMap';
      const lai = [];
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++)
        lai.push(tai1Tile(urlTile(z, tx, ty)).then(im => { if (im) cx2.drawImage(im, (tx - tx0) * 256, (ty - ty0) * 256); return !!im; }));
      kq = await Promise.all(lai); duoc = kq.filter(Boolean).length;
    }
    if (!duoc) throw Error('khong tai duoc tile');
    const lonW = lonOf(tx0, n), lonE = lonOf(tx1 + 1, n), latN = latOf(ty0, n), latS = latOf(ty1 + 1, n);
    const [wx, wy] = geo.world((latN + latS) / 2, (lonW + lonE) / 2);
    osm.cx = wx; osm.cy = wy;
    osm.w = (lonE - lonW) * geo.mLon / geo.mpu;
    osm.h = (latN - latS) * geo.mLat / geo.mpu;
    osm.zoom = z; osm.soTile = duoc;
    if (!osm.tex) osm.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, osm.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    state.osm = 'xong'; dirty = true;
  } catch (e) { console.warn('Không tải được ô bản đồ:', e.message || e); state.osm = 'loi'; if (state.base !== 'plan') state.base = 'plan'; }
  render();
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
  capNhatGiaNhan();
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
    const show = !!p && !state.hideLabels && (state.zone === 'all' || state.zone === key) && !(key === 'casa' && C.dist < 170);
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

/* ---------- vòng lặp ---------- */
let last = 0, hoverReq = null;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
  const k = 1 - Math.exp(-dt * 7);
  let moving = false;
  for (const key of ['tx', 'ty', 'tz', 'dist', 'yaw', 'pitch']) {
    const d = T[key] - C[key];
    if (Math.abs(d) > (key === 'dist' ? C.dist * 5e-4 : 5e-4)) { C[key] += d * k; moving = true; } else C[key] = T[key];
  }
  if (hoverReq) { const r = hoverReq; hoverReq = null; doHover(r.x, r.y); }
  if (moving || dirty) { resize(); gl.bindFramebuffer(gl.FRAMEBUFFER, null); drawScene(false); placeLabels(); veLaBan(); dirty = false; }
}
function doHover(x, y) {
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
const ptrs = new Map(); let down = null, pinch0 = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, pan: e.button === 2 || e.shiftKey };
  else { down && (down.moved = true); const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: T.dist, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (e.pointerType === 'mouse') hoverReq = { x: e.clientX, y: e.clientY }; return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size >= 2 && pinch0) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    T.dist = Math.max(28, Math.min(1500, pinch0.dist * pinch0.d / Math.max(10, d))); C.dist = T.dist;
    pan((cx - pinch0.cx), (cy - pinch0.cy)); pinch0.cx = cx; pinch0.cy = cy; dirty = true; return;
  }
  if (!down) return;
  if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down.moved = true; canvas.classList.add('drag'); $('#tip').hidden = true; }
  if (!down.moved) return;
  if (down.pan) pan(dx, dy);
  else { T.yaw += dx * .006; T.pitch = Math.max(.2, Math.min(1.5, T.pitch + dy * .005)); C.yaw = T.yaw; C.pitch = T.pitch; }
  dirty = true;
});
function pan(dx, dy) {
  const s = C.dist * .0011, c = Math.cos(C.yaw), sn = Math.sin(C.yaw);
  T.tx = C.tx = Math.max(-100, Math.min(1060, C.tx - (dx * c + dy * sn * 1.2) * s)); T.ty = C.ty = Math.max(-100, Math.min(640, C.ty + (dx * sn - dy * c * 1.2) * s));
}
const endPtr = e => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; canvas.classList.remove('drag');
  if (down && e.type === 'pointerup' && !down.moved && performance.now() - down.t < 600 && ptrs.size === 0) clickAt(e.clientX, e.clientY);
  if (ptrs.size === 0) down = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerleave', () => { if (state.hover >= 0 && !ptrs.size) { state.hover = -1; refreshStates(); $('#tip').hidden = true; } });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { e.preventDefault(); T.dist = Math.max(28, Math.min(1500, T.dist * Math.exp(e.deltaY * .0012))); dirty = true; }, { passive: false });
let lastTap = 0;
function clickAt(x, y) {
  const id = pickAt(x, y);
  const now = performance.now(), dbl = now - lastTap < 350; lastTap = now;
  if (id < 0) return;
  if (id < U.length) { selectUnit(id, { fly: true }); if (dbl) fly({ ...T, dist: 55, pitch: 1.05 }); }
  else selectZone(TOWERS[id - U.length].zone);
}
canvas.addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'ArrowLeft') T.yaw -= .12; else if (k === 'ArrowRight') T.yaw += .12; else if (k === 'ArrowUp') T.pitch = Math.min(1.5, T.pitch + .08); else if (k === 'ArrowDown') T.pitch = Math.max(.2, T.pitch - .08);
  else if (k === '+' || k === '=') T.dist = Math.max(28, T.dist * .85); else if (k === '-') T.dist = Math.min(1500, T.dist / .85); else if (k === 'Escape') { selectUnit(-1); return; } else return;
  e.preventDefault(); dirty = true;
});

/* ---------- chọn / lọc ---------- */
function selectZone(key, o = {}) {
  if (!ZONES.some(z => z.key === key)) key = 'all';
  state.zone = key; state.type = o.type ?? -1; state.sel = -1; state.sheet = state.sheet || 0;
  if (!(key === 'casa')) state.q = '';
  fly(zoneView(key, state.type));
  state.tab = key === 'all' ? 'explore' : 'unit';
  syncHash(); refreshStates(); render();
}
function selectType(t) { state.type = t; fly(zoneView('casa', t)); refreshStates(); render(); }
function selectUnit(i, o = {}) {
  if (i < 0) { state.sel = -1; refreshStates(); if (state.tab === 'unit') render(); return; }
  const u = U[i]; state.zone = 'casa'; state.sel = i; state.tab = 'unit';
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
  <p class="small mute">${state.osm === 'xong' ? `Đã ghép ${osm.soTile} ô ${NEN.kieu === 've-tinh' ? 'ảnh vệ tinh' : 'bản đồ'} ở mức thu phóng ${osm.zoom}, xoay về đúng hướng Bắc thật.` : state.osm === 'loi' ? 'Chưa tải được ô bản đồ.' : 'Đang tải nền bản đồ…'}</p>
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
    const hien = state.rail === 'floors';
    fr.hidden = !hien;
    if (hien) fr.innerHTML = '<b>CAO ĐỘ</b>' + FLOORS.map(([t, z]) => `<button class="fb" data-cut="${z}" aria-pressed="${state.cut === z}">${t}</button>`).join('');
  }
  const cap = $('#caption');
  if (cap) cap.textContent = `Blanca City · 96,6 ha · Sun Group — sa bàn mô phỏng theo tổng mặt bằng, ${hasInv() ? 'bảng hàng ' + (inv.updatedAt ? fmtTime(inv.updatedAt) : 'đã nạp') : 'chưa có bảng hàng chính thức'}${state.base !== 'plan' && state.osm === 'xong' ? ' · nền bản đồ ' + NEN.ghiNhan : ''} · Kéo xoay · Lăn chuột thu phóng · Giữ Shift để trượt`;
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
  <div class="note"><b>Về dữ liệu:</b> vị trí và hình khối từng căn Casa Villa là <b>mô phỏng</b> theo tổng mặt bằng, chia đều theo chiều dài dãy; ranh lô, khoảng lùi, mái và chiều cao là ước tính. Khối tháp dựng theo số tầng công bố trong hồ sơ tư vấn 7/8/2026 (2 tầng khối đế cao 5 m, tầng căn hộ cao 3,6 m); chân tháp Beacon và Beachtro cắt theo đường bao công trình trên tổng mặt bằng, đối chiếu layout tầng điển hình; cụm B dựng khối hộp theo đúng hình trên tổng mặt bằng. Số căn đang bán chỉ hiện khi có bảng hàng chính thức.</div>
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
  <p class="mute small">Trên tổng mặt bằng đây là khối ghi <b>E2</b>; bên trong gồm bốn toà con E1, E2, E3 và E5. Sơ đồ đứng ghi 2 tầng khối đế, tầng 3–38 căn hộ, tầng 39–40 duplex. Khối 3D cắt theo đường bao công trình trên tổng mặt bằng, đúng hình chữ U với hai cánh hai đầu; đối chiếu mặt bằng tầng điển hình. Nguồn: Beacon.pdf trang 6–7; hồ sơ tư vấn 7/8/2026 trang 80.</p>
  <table><caption class="small mute" style="text-align:left;margin-bottom:4px">Cơ cấu căn hộ Beacon</caption><thead><tr><th>Loại</th><th>Thông thủy (m²)</th><th class="r">Số căn</th><th></th></tr></thead><tbody>${BEACON_MIX.map(r => { const k = 'b:' + r[0]; return `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r">${nf.format(r[2])}</td><td class="r"><button class="chip" style="padding:2px 9px" data-cart="${k}" data-label="Beacon · ${esc(r[0])}" data-sub="${esc(r[1])} m²" aria-pressed="${inCart(k)}">${inCart(k) ? '✓' : '＋'}</button></td></tr>`; }).join('')}</tbody></table>
  <h3>Mặt bằng Beacon 1 và căn mẫu</h3>
  <label>Chọn bản vẽ<select id="sheet">${BEACON_SHEETS.map((n, i) => `<option value="${i}" ${i === state.sheet ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <p><img src="beacon-${sheet}.webp" alt="Mặt bằng Beacon: ${esc(BEACON_SHEETS[state.sheet])}" style="width:100%;border-radius:8px;border:1px solid var(--line);cursor:zoom-in" data-zoom="beacon-${sheet}.webp"></p>
  <p class="mute small">Mặt đứng ghi E2, mặt bằng ghi Beacon 1: giữ đúng phạm vi từng bản vẽ.</p>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="z:beacon" data-label="Beacon Tower (chung)" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Quan tâm Beacon'}</button><a class="btn" href="/cam-nang/blanca-beacon-tower/" target="_top">Hồ sơ phân khu →</a></div>`;
}
const BEACHTRO_MIX = [['Studio', 24], ['1PN+', 28], ['2PN', 4], ['2PN+', 34], ['3PN', 4], ['3PN view kép', 4], ['3PN+', 2]];
function beachtroHtml() {
  const on = inCart('z:beachtro');
  return `<h2>Beachtro Tower</h2>
  <p><span class="badge">1.785 căn hộ</span> <span class="badge">E6 · E7 · E8 · E9</span></p>
  <p class="mute small">Trên tổng mặt bằng đây là khối ghi <b>E1</b>, nằm sát đường 3/2 cạnh Beacon; bên trong gồm bốn toà con E6, E7, E8 và E9. Khối 3D cắt theo đường bao công trình trên tổng mặt bằng, đúng hình chữ U với hai cánh hai đầu; đối chiếu mặt bằng tầng điển hình. Nguồn: hồ sơ tư vấn Blanca City 7/8/2026, trang 14 và 98.</p>
  <table><caption class="small mute" style="text-align:left;margin-bottom:4px">Tỷ trọng loại căn</caption><thead><tr><th>Loại</th><th class="r">Tỷ trọng</th><th></th></tr></thead><tbody>${BEACHTRO_MIX.map(([t, p]) => { const k = 'bt:' + t; return `<tr><td>${t}</td><td class="r">${p}%</td><td class="r"><button class="chip" style="padding:2px 9px" data-cart="${k}" data-label="Beachtro · ${esc(t)}" data-sub="${p}% rổ hàng" aria-pressed="${inCart(k)}">${inCart(k) ? '✓' : '＋'}</button></td></tr>`; }).join('')}</tbody></table>
  <div class="note">Chưa có bảng hàng chính thức nên chưa hiện diện tích và giá từng căn.</div>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="z:beachtro" data-label="Beachtro Tower (chung)" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Quan tâm Beachtro'}</button><a class="btn" href="/cam-nang/blanca-beachtro-tower/" target="_top">Hồ sơ phân khu →</a></div>`;
}
function clusterHtml() {
  const z = ZONES.find(o => o.key === state.zone), k = 'z:' + z.key, on = inCart(k);
  return `<h2>${esc(z.name)}</h2><p class="mute">${z.noGeo ? 'Chưa xác định vị trí trên tổng mặt bằng nên chưa có khối nhấp trên sa bàn. Hồ sơ phân khu vẫn đọc được bên dưới.' : `Khối đế 2 tầng dựng dạng hộp, ba toà căn hộ theo số tầng: ${esc(z.sub.split(' · ')[0])} · ${esc(z.sub.split(' · ')[1])}. Hình gấp khúc của mặt bằng tầng điển hình sẽ bổ sung khi có bản vẽ.`}</p>
  <div class="note">Số căn, diện tích và giá của phân khu này chưa có bảng hàng chính thức. Anh/chị gửi yêu cầu để được báo thông tin mới nhất.</div>
  <div class="row"><button class="btn ${on ? '' : 'primary'}" data-cart="${k}" data-label="${esc(z.name)}" data-sub="Quan tâm phân khu">${on ? '✓ Đã trong giỏ · bỏ' : '＋ Thêm vào giỏ quan tâm'}</button><a class="btn" href="/cam-nang/blanca-${z.profile}/" target="_top">Hồ sơ phân khu →</a></div>`;
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
function consultHtml() {
  const u = state.sel >= 0 ? U[state.sel] : null;
  return `<h2>Tư vấn trực tiếp</h2>${consultMini()}
  <p class="mute small">Tư vấn viên giải đáp về pháp lý, tiến độ, so sánh phân khu và cách tính dòng tiền. Thông tin mang tính tham khảo, không phải cam kết về giá hay chính sách bán hàng.</p>
  <h3>Đặt lịch gọi lại</h3>${formHtml('callback')}
  <details id="consignBox"${state.openConsign ? ' open' : ''}><summary>Ký gửi căn (bán hoặc cho thuê)</summary>${formHtml('consign', u)}</details>`;
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
  if (kind === 'consign' && !get('unit')) { status.textContent = 'Vui lòng ghi mã căn hoặc vị trí.'; status.classList.add('err'); form.unit.focus(); return; }
  const body = {
    kind, project: PROJECT, zone: ZONES.find(z => z.key === state.zone)?.name || '', name: get('name'), phone, consent: true,
    units: kind === 'request' ? state.cart.map(c => c.label + (c.sub ? ' (' + c.sub + ')' : '')) : [],
    intent: get('intent'), budget: get('budget'), note: get('note'), when: get('when'), purpose: get('purpose'), unit: get('unit'), price: get('price'),
    website: get('website'), t: Math.round(performance.now() - formOpened), page: location.pathname + location.hash,
  };
  btn.disabled = true; const old = btn.textContent; btn.textContent = 'Đang gửi…'; status.textContent = '';
  try {
    const r = await fetch('/api/tim-nha', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok || !j.stored) throw Error(j.error || r.status);
    form.outerHTML = `<div class="done" role="status"><b>Đã nhận phiếu ${esc(j.id)}</b><p>${kind === 'consign' ? 'Phiếu ký gửi' : kind === 'callback' ? 'Lịch gọi lại' : 'Yêu cầu của anh/chị'} đã được lưu. Tư vấn viên sẽ liên hệ qua số ${esc(phone)} sớm nhất. Cần gấp, nhắn Zalo ${ZALO_TXT}.</p></div>`;
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
$('#bOut').onclick = () => { T.dist = Math.min(1500, T.dist / .72); dirty = true; };
$('#bNorth').onclick = () => { fly({ ...T, yaw: -rad(geo.north) }); };
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
  const m = e.target.closest('[data-market]'); if (!m || m.disabled) return;
  state.market = m.dataset.market; uploadStatic(); render();
});
addEventListener('hashchange', openHash);
new ResizeObserver(() => { dirty = pickDirty = true; }).observe(canvas);

function capNhatNang() { SUN = sunNow(); dirty = true; }

/* ---------- khởi động ---------- */
(async () => {
  render(); buildLabels();
  const [geoRaw, invData, plan, gref, chan, ranh] = await Promise.all([
    fetch('geometry.json').then(r => r.json()),
    fetch('inventory.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null),
    new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'plan.webp'; }),
    fetch('georef.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('chan-thap.json').then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('ranh-du-an.json').then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  if (invData && invData.units) inv = invData;
  if (gref) { GEO = gref; geo.init(gref); }
  else geo.init({ tyLe: { metTrenDonVi: geo.mpu }, huong: { bacSoVoiTrucDocAnh: geo.north }, neo: { lat: geo.lat0, lon: geo.lon0, planX: 488, planY: 268 } });
  RANH = ranh; CHAN = chan;
  await hoiNen();
  TOWERS = dungThap();
  capNhatNang();
  setInterval(() => { if (state.sunT == null) { capNhatNang(); if (state.tab === 'env') render(); } }, 60000);
  buildUnits(geoRaw);
  if (gl) {
    try { initGL(plan); resize(); buildRanh(); const h = homeView(); Object.assign(C, { ...h, dist: h.dist * 1.6, pitch: 1.3 }); fly(h); requestAnimationFrame(frame); if (state.base !== 'plan') loadOsm(); }
    catch (err) { console.error(err); $('#nogl').hidden = false; }
  } else $('#nogl').hidden = false;
  render(); openHash();
  window.__blanca = { state, U, C, T, selectUnit, selectZone, geo, osm, sunNow, SUN: () => SUN, capNhatNang, RANH: () => RANH, NEN, TOWERS: () => TOWERS };
})().catch(err => { console.error(err); $('#pane').innerHTML = '<h2>Chưa tải được dữ liệu sa bàn</h2><p class="mute">Vui lòng tải lại trang hoặc nhắn Zalo ' + ZALO_TXT + '.</p>'; });
})();
