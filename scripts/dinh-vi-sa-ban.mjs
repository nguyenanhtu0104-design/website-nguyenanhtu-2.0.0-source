#!/usr/bin/env node
// Định vị sa bàn: giải phép chiếu từ ảnh tổng mặt bằng sang WGS84 bằng các điểm mốc.
//
// Vì sao cần: ảnh tổng mặt bằng là một tấm hình, không mang tọa độ. Muốn đặt nó đúng chỗ
// trên bản đồ thật thì phải biết hướng xoay, tỷ lệ mét trên mỗi điểm ảnh, và vị trí.
// Đoán ba số đó từ hoa gió in trên bản vẽ là không đáng tin. Nhưng chỉ cần HAI điểm mốc
// nhận ra được trên cả ảnh lẫn bản đồ là giải ra chính xác cả ba, không còn chỗ để đoán.
//
// Dùng:
//   node scripts/dinh-vi-sa-ban.mjs <thu-muc-cong-cu> <file.kml|file.kmz đã giải nén>
//
// Thư mục công cụ cần có:
//   diem-moc.json  — nối tên ghim trong KML với tọa độ trên ảnh tổng mặt bằng:
//     {
//       "anh": { "file": "plan.webp", "rongDonVi": 960, "caoDonVi": 540 },
//       "moc": [
//         { "ten": "tâm công viên nước", "planX": 494, "planY": 258 },
//         { "ten": "chân tháp B2",       "planX": 666, "planY": 275 }
//       ],
//       "ranh": "blanca city"
//     }
//   Hai mốc đầu dùng để giải. Mốc thứ ba trở đi dùng để ĐO SAI SỐ, không tham gia giải.
//
// Kết quả: in ra hướng Bắc, tỷ lệ, điểm neo và sai số; ghi georef.json nếu thêm --ghi.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const R_LAT = 111320;                       // mét trên 1 độ vĩ
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

function docKml(duongDan) {
  const s = readFileSync(duongDan, 'utf8');
  const ra = [];
  for (const m of s.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g)) {
    const b = m[1];
    const ten = (b.match(/<name>([\s\S]*?)<\/name>/) || [, ''])[1].trim();
    const toa = b.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (!toa) continue;
    const diem = toa[1].trim().split(/\s+/).map((p) => {
      const [lo, la] = p.split(',').map(Number);
      return { lat: la, lon: lo };
    });
    ra.push({ ten, diem, loai: /<Point>/.test(b) ? 'diem' : /<Polygon>/.test(b) ? 'vung' : 'tuyen' });
  }
  return ra;
}

// Hệ mét địa phương quanh một gốc: x về đông, y về bắc
const heMet = (lat0, lon0) => ({
  lat0, lon0, mLat: R_LAT, mLon: R_LAT * Math.cos(rad(lat0)),
  ra: (lat, lon) => [(lon - lon0) * R_LAT * Math.cos(rad(lat0)), (lat - lat0) * R_LAT],
  ve: (x, y) => [lat0 + y / R_LAT, lon0 + x / (R_LAT * Math.cos(rad(lat0)))],
});

// Giải phép biến đổi đồng dạng từ HAI cặp điểm. Không có bậc tự do thừa nên không cần tối ưu.
// Hệ ảnh: X = planX, Y = caoDonVi - planY (trục Y hướng lên).
function giai(m1, m2, he, cao) {
  const p1 = [m1.planX, cao - m1.planY], p2 = [m2.planX, cao - m2.planY];
  const q1 = he.ra(m1.lat, m1.lon), q2 = he.ra(m2.lat, m2.lon);
  const dp = [p2[0] - p1[0], p2[1] - p1[1]], dq = [q2[0] - q1[0], q2[1] - q1[1]];
  const lp = Math.hypot(...dp), lq = Math.hypot(...dq);
  if (lp < 1e-9) throw new Error('Hai mốc trùng nhau trên ảnh.');
  const tyLe = lq / lp;                                            // mét trên mỗi đơn vị ảnh
  // góc quay đưa trục ảnh về hệ mét
  const goc = Math.atan2(dq[1], dq[0]) - Math.atan2(dp[1], dp[0]);
  // Bắc lệch bao nhiêu độ so với trục dọc ảnh, thuận chiều kim đồng hồ.
  // Quy ước phải trùng với geo.init trong showroom.js: vector Bắc trong hệ thế giới
  // là (sin(bac), cos(bac)) với trục x là chiều ngang ảnh và trục y là chiều dọc ảnh hướng lên.
  // Ảnh -> mét là quay một góc `goc`, nên Bắc trong hệ ảnh là (sin(goc), cos(goc)), tức bac = goc.
  const bac = ((deg(goc)) % 360 + 360) % 360;
  return { tyLe, goc, bac: bac > 180 ? bac - 360 : bac, p1, q1 };
}

const ap = (t, px, py, cao) => {
  const dx = px - t.p1[0], dy = (cao - py) - t.p1[1];
  const c = Math.cos(t.goc), s = Math.sin(t.goc);
  return [t.q1[0] + (dx * c - dy * s) * t.tyLe, t.q1[1] + (dx * s + dy * c) * t.tyLe];
};

const thuMuc = process.argv[2], kml = process.argv[3], ghi = process.argv.includes('--ghi');
if (!thuMuc || !kml) {
  console.error('Dùng: node scripts/dinh-vi-sa-ban.mjs <thư-mục-công-cụ> <doc.kml> [--ghi]');
  process.exit(1);
}
const cauHinh = JSON.parse(readFileSync(join(thuMuc, 'diem-moc.json'), 'utf8'));
const dat = docKml(kml);
const timGhim = (ten) => {
  const p = dat.find((d) => d.ten.toLowerCase() === String(ten).toLowerCase() && d.loai === 'diem');
  if (!p) throw new Error(`Không thấy ghim tên "${ten}" trong KML. Có: ${dat.map((d) => d.ten).join(', ')}`);
  return p.diem[0];
};
const moc = cauHinh.moc.map((m) => ({ ...m, ...timGhim(m.ten) }));
if (moc.length < 2) throw new Error('Cần ít nhất 2 mốc trong diem-moc.json.');
const cao = cauHinh.anh.caoDonVi;
const he = heMet(moc[0].lat, moc[0].lon);
// Từ 3 mốc trở lên: khớp bình phương tối thiểu (Umeyama) để rải đều sai số thay vì dồn vào mốc thứ ba.
function giaiLSQ(ms, he, cao) {
  const Pm = ms.map((m) => [m.planX, cao - m.planY]);
  const Qm = ms.map((m) => he.ra(m.lat, m.lon));
  const n = ms.length;
  const mp = [Pm.reduce((s, p) => s + p[0], 0) / n, Pm.reduce((s, p) => s + p[1], 0) / n];
  const mq = [Qm.reduce((s, p) => s + p[0], 0) / n, Qm.reduce((s, p) => s + p[1], 0) / n];
  let sxx = 0, sxy = 0, varp = 0;
  for (let i = 0; i < n; i++) {
    const x = Pm[i][0] - mp[0], y = Pm[i][1] - mp[1];
    const u = Qm[i][0] - mq[0], v = Qm[i][1] - mq[1];
    sxx += x * u + y * v; sxy += x * v - y * u; varp += x * x + y * y;
  }
  const goc = Math.atan2(sxy, sxx);
  const tyLe = Math.hypot(sxx, sxy) / varp;
  const c = Math.cos(goc), si = Math.sin(goc);
  const q1 = [mq[0] - tyLe * (mp[0] * c - mp[1] * si), mq[1] - tyLe * (mp[0] * si + mp[1] * c)];
  let bac = ((deg(goc)) % 360 + 360) % 360; if (bac > 180) bac -= 360;
  return { tyLe, goc, bac, p1: [0, 0], q1 };
}
const t = moc.length >= 3 ? giaiLSQ(moc, he, cao) : giai(moc[0], moc[1], he, cao);
const kieu = moc.length >= 3 ? `khớp bình phương tối thiểu trên ${moc.length} mốc` : '2 mốc, giải thẳng';

console.log(`\nCách giải: ${kieu}`);
console.log(`  Hướng Bắc lệch ${t.bac.toFixed(2)}° so với trục dọc ảnh (thuận chiều kim đồng hồ)`);
console.log(`  Tỷ lệ          ${t.tyLe.toFixed(4)} m trên mỗi đơn vị ảnh`);
const khoangCach = Math.hypot(...he.ra(moc[1].lat, moc[1].lon).map((v, i) => v - he.ra(moc[0].lat, moc[0].lon)[i]));
console.log(`  Hai mốc cách nhau ${khoangCach.toFixed(0)} m — càng xa thì kết quả càng chắc`);

let saiSoMax = null;
if (moc.length >= 3) {
  console.log('\nSai số tại từng mốc (khớp bình phương tối thiểu nên mọi mốc đều tham gia):');
  saiSoMax = 0;
  for (const m of moc) {
    const q = ap(t, m.planX, m.planY, cao);
    const th = he.ra(m.lat, m.lon);
    const d = Math.hypot(q[0] - th[0], q[1] - th[1]);
    saiSoMax = Math.max(saiSoMax, d);
    console.log(`  ${m.ten.padEnd(28)} lệch ${d.toFixed(1)} m`);
  }
  console.log(`  → lệch lớn nhất ${saiSoMax.toFixed(1)} m`);
} else {
  console.log('\nChỉ có 2 mốc nên CHƯA ĐO ĐƯỢC SAI SỐ. Thêm mốc thứ ba để biết phép chiếu sai bao nhiêu mét.');
}

if (cauHinh.ranh) {
  const v = dat.find((d) => d.ten.toLowerCase() === cauHinh.ranh.toLowerCase() && d.loai === 'vung');
  if (v) {
    const P = v.diem.map((d) => he.ra(d.lat, d.lon));
    const A = Math.abs(P.reduce((s, p, i) => {
      const q = P[(i + 1) % P.length];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2);
    console.log(`\nRanh "${v.ten}": ${v.diem.length} đỉnh, diện tích ${(A / 10000).toFixed(1)} ha`);
  }
}

const neo = cauHinh.neo || { planX: cauHinh.anh.rongDonVi / 2, planY: cao / 2 };
const [nx, ny] = ap(t, neo.planX, neo.planY, cao);
const [nlat, nlon] = he.ve(nx, ny);
console.log(`\nĐiểm neo tại ảnh (${neo.planX}, ${neo.planY}) → ${nlat.toFixed(6)}, ${nlon.toFixed(6)}`);

if (ghi) {
  const ra = {
    duAn: cauHinh.duAn || null,
    trangThai: saiSoMax == null ? 'giai-tu-2-moc-chua-do-sai-so' : 'khop-nhieu-moc-da-do-sai-so',
    anh: cauHinh.anh,
    neo: { diem: neo.ten || 'điểm neo', planX: neo.planX, planY: neo.planY, lat: +nlat.toFixed(6), lon: +nlon.toFixed(6),
           nguon: `${kieu}, từ ${kml}: ${moc.map((m) => m.ten).join(', ')}` },
    tyLe: { metTrenDonVi: +t.tyLe.toFixed(4), cachDo: `Suy từ ${kieu}, không ước lượng từ bản vẽ.` },
    huong: { bacSoVoiTrucDocAnh: +t.bac.toFixed(2), donVi: 'độ, thuận chiều kim đồng hồ, 0 = hướng lên của ảnh',
             cachDo: `Suy từ ${kieu}, không đọc hoa gió trên bản vẽ.` },
    saiSo: saiSoMax == null
      ? 'Chưa đo. Mới có 2 mốc, vừa đủ để giải nên không còn điểm nào để kiểm.'
      : `Lệch lớn nhất ${saiSoMax.toFixed(1)} m tại các mốc.`,
  };
  writeFileSync(join(thuMuc, 'georef.json'), JSON.stringify(ra, null, 2) + '\n');
  console.log(`\nĐã ghi ${join(thuMuc, 'georef.json')}`);
} else {
  console.log('\n(Thêm --ghi để ghi đè georef.json)');
}
