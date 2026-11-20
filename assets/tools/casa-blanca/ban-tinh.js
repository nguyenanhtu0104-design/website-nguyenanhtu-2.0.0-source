/* Bộ tính phiếu tính giá và cân đối tài chính cho sa bàn (PROJECT_RULES §16.4).
   Đọc chính sách từ chinh-sach.json, không gắn với giao diện: chạy được cả trên trình duyệt (window.BanTinh) lẫn Node (kiểm thử).
   Công thức theo phiếu tính giá tạm tính của chủ đầu tư:
   - giá chưa VAT & KPBT = giá niêm yết / 1,12; chiết khấu trừ lần lượt trên phần còn lại;
   - VAT = 10% giá sau chiết khấu, KPBT = 2%; tổng phải thanh toán = giá sau CK + VAT + KPBT;
   - mỗi đợt = % × (giá sau CK + VAT); lần 2 trừ tiền cọc; đợt bàn giao = 100% KPBT + VAT của 5% cuối;
     5% cuối chưa VAT vào tài khoản ký quỹ cấp sổ;
   - "ngày thứ n kể từ ngày ký" = ngày ký + n − 1; đợt có hạn sau ngày bàn giao thì gộp vào ngày bàn giao. */
(function (root) {
  'use strict';
  var DAY = 864e5, R = Math.round;
  function s2t(s) { return Date.parse(s + 'T00:00:00Z'); }
  function t2s(t) { return new Date(t).toISOString().slice(0, 10); }
  function ngayThu(s, n) { return t2s(s2t(s) + (n - 1) * DAY); }
  function congThang(s, k) {
    var d = new Date(s2t(s)), y = d.getUTCFullYear(), m = d.getUTCMonth() + k, dd = d.getUTCDate();
    var cuoi = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return t2s(Date.UTC(y, m, Math.min(dd, cuoi)));
  }
  function thangGiua(a, b) {            // số tháng tròn từ a đến b
    var x = new Date(s2t(a)), y = new Date(s2t(b));
    var n = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + (y.getUTCMonth() - x.getUTCMonth());
    if (y.getUTCDate() < x.getUTCDate()) n--;
    return n;
  }
  function homNay() { return new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); }   // giờ Việt Nam
  function nhomLoai(l) {
    var s = String(l || '').toUpperCase().replace(/\s+/g, '');
    return s === 'STUDIO' || s === 'STU' ? 'STU' : s;
  }
  function tienCoc(pol, loai) { var k = nhomLoai(loai); return pol.coc[k] != null ? pol.coc[k] : pol.coc['*']; }

  /* Phương thức thanh toán còn hiệu lực ở ngày ký (phương thức có hạn tự ẩn khi qua hạn). */
  function ptttHieuLuc(pol, ngayKy) { ngayKy = ngayKy || homNay(); return pol.pttt.filter(function (p) { return !p.han || ngayKy <= p.han; }); }
  function ptttHetHan(pol, ngayKy) { ngayKy = ngayKy || homNay(); return pol.pttt.filter(function (p) { return p.han && ngayKy > p.han; }); }
  function timPttt(pol, id) { return pol.pttt.filter(function (p) { return p.id === id; })[0] || null; }

  /* Phần THÔNG TIN GIÁ & CHÍNH SÁCH */
  function tinhGia(niemYet, pol, p) {
    var P0 = niemYet / pol.vatKpbt, con = P0, ck = [];
    (p.ck || []).forEach(function (c) { var so = R(c.tyLe * con); ck.push({ ten: c.ten, tyLe: c.tyLe, luc: c.luc || 'HĐTHNV', so: so }); con -= so; });
    var P = R(con), V = R(P * pol.vat), K = R(P * pol.kpbt);
    return { niemYet: niemYet, P0: R(P0), ck: ck, tongCk: ck.reduce(function (s, c) { return s + c.so; }, 0), P: P, V: V, K: K, T: P + V + K };
  }

  /* Phần TIẾN ĐỘ THANH TOÁN. opt: { ngayKy, tyLeVay } */
  function tienDo(g, loai, pol, p, opt) {
    opt = opt || {};
    var ky = opt.ngayKy || homNay(), PV = g.P + g.V, coc = tienCoc(pol, loai);
    var bg = pol.banGiao, nn = pol.nhanNha, cap = function (d) { return d > bg ? bg : d; };
    var mau = p.tienDo === 'vay' ? pol.tienDo.vay : pol.tienDo.chuan;
    var rows = [], lan = 0, lan2 = ky, hdmb = null, buSau = 0, ngayBanGiao = bg;
    mau.forEach(function (b) {
      if (b.loai === 'coc') { lan++; rows.push({ lan: lan, ten: 'Ký HĐTHNV · thanh toán lần 1', pt: null, phan: 'Đặt cọc', ngay: ky, so: coc, nguon: 'kh', ptGoc: coc / PV }); }
      else if (b.loai === 'dot') {
        lan++;
        var ngay = cap(ngayThu(ky, b.ngay)), so = R(b.pt * PV - (b.truCoc ? coc : 0));
        var r = { lan: lan, ten: 'Thanh toán lần ' + lan, pt: b.pt, ngay: ngay, so: so, nguon: 'kh', ngayThu: b.ngay, ptGoc: b.pt - (b.truCoc ? coc / PV : 0) };
        if (b.truCoc) { r.ghi = 'đủ ' + Math.round(b.pt * 100) + '% (đã gồm tiền cọc)'; lan2 = ngay; }
        if (buSau) { r.so += buSau; r.bu = buSau; r.ptGoc += buSau / PV; r.ghi = 'gồm ' + buSau.toLocaleString('vi-VN') + ' đ vốn tự có bù phần vay dưới 70%'; buSau = 0; }
        rows.push(r);
      }
      else if (b.loai === 'hdmb') { hdmb = ngayThu(lan2, pol.hdmbSau); rows.push({ moc: 'hdmb', ten: 'Ký hợp đồng mua bán (HĐMB)', ghi: 'dự kiến ngày thứ ' + pol.hdmbSau + ' kể từ hạn lần 2', ngay: hdmb }); }
      else if (b.loai === 'nganHang') {
        lan++;
        var ng = ngayThu(hdmb || lan2, b.sauHdmb);
        var tl = opt.tyLeVay == null ? b.pt : Math.max(0, Math.min(b.pt, opt.tyLeVay));
        var vay = R(tl * PV), du = R(b.pt * PV) - vay;
        rows.push({ lan: lan, ten: 'Thanh toán lần ' + lan + ' · ngân hàng giải ngân', pt: tl, ngay: ng, so: vay, nguon: 'nh', ghi: 'trong 15 ngày kể từ ký HĐMB' });
        if (du > 0) {
          if (b.buVaoDotSau) buSau = du;
          else rows.push({ lan: lan, ten: 'Lần ' + lan + ' · vốn tự có bù phần vay dưới 70%', pt: b.pt - tl, ngay: ng, so: du, nguon: 'kh', ptGoc: du / PV });
        }
      }
      else if (b.loai === 'nhanNha') rows.push({ moc: 'nhanNha', ten: 'Nhận nhà sử dụng (Sun Early Key)', ghi: 'cần đã đóng đủ 70% giá trị gồm VAT', ngay: nn });
      else if (b.loai === 'banGiao') {
        lan++; ngayBanGiao = b.theo === 'nhanNha' ? nn : bg;
        rows.push({ lan: lan, ten: 'Thanh toán lần ' + lan + ' · theo thông báo bàn giao', pt: null, phan: '100% KPBT + VAT của 5% cuối', ngay: ngayBanGiao, so: R(g.K + 0.05 * g.V), nguon: 'kh', banGiao: true });
      }
      else if (b.loai === 'kyQuy') rows.push({ lan: null, ten: 'Ký quỹ đảm bảo cấp sổ', pt: null, phan: '5% giá chưa VAT', ghi: 'chủ đầu tư trả lãi 8%/năm, khấu trừ khi nhận sổ', ngay: ngayBanGiao, so: R(0.05 * g.P), nguon: 'kh', kyQuy: true });
    });
    if (buSau) { var last = rows.filter(function (r) { return r.so && r.nguon === 'kh' && !r.banGiao && !r.kyQuy; }).pop(); if (last) { last.so += buSau; last.bu = buSau; } }

    if (p.mucSom && p.han) gopThanhToanSom(rows, p, PV, coc);

    // chênh lệch do làm tròn (vài đồng) dồn vào đợt bàn giao để tổng khớp đúng giá trị phải thanh toán
    var tong = rows.reduce(function (s, r) { return s + (r.so || 0); }, 0), lech = g.T - tong;
    if (lech) { var bgr = rows.filter(function (r) { return r.banGiao; })[0]; if (bgr) bgr.so += lech; }
    rows.forEach(function (r, i) { r._i = i; });
    rows.sort(function (a, b) { return a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : (a.moc && !b.moc ? -1 : !a.moc && b.moc ? 1 : a._i - b._i); });
    var luy = 0;
    rows.forEach(function (r) { luy += r.so || 0; r.luyKe = luy; r.luyKePt = luy / PV; delete r._i; });
    return { rows: rows, ngayKy: ky, hdmb: hdmb, nhanNha: nn, banGiao: ngayBanGiao, coc: coc, tong: rows.reduce(function (s, r) { return s + (r.so || 0); }, 0) };
  }

  /* Thanh toán sớm X%: phần tiến độ chuẩn đến mức X% dồn về hạn thanh toán sớm (đợt nào đến hạn trước vẫn giữ ngày). */
  function gopThanhToanSom(rows, p, PV, coc) {
    var cum = 0, gop = 0, han = p.han;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; if (!r.so || r.nguon !== 'kh' || r.banGiao || r.kyQuy) continue;
      var pt = r.ptGoc != null ? r.ptGoc : r.so / PV;
      if (cum >= p.mucSom - 1e-9) break;
      var phan = Math.min(pt, p.mucSom - cum);
      if (r.ngay > han) {
        var so = phan >= pt - 1e-9 ? r.so : R(phan * PV);
        gop += so; r.so -= so;
      }
      cum += pt;
    }
    for (var j = rows.length - 1; j >= 0; j--) if (rows[j].so === 0 && !rows[j].moc) rows.splice(j, 1);
    if (gop > 0) rows.push({ lan: null, ten: 'Thanh toán sớm cho đủ ' + Math.round(p.mucSom * 100) + '%', pt: null, phan: 'phần tiến độ còn lại đến ' + Math.round(p.mucSom * 100) + '%', ngay: han, so: gop, nguon: 'kh', som: true });
  }

  /* CÂN ĐỐI TÀI CHÍNH. opt: { laiSau (%/năm), namVay } */
  function canDoi(td, pol, opt) {
    opt = opt || {};
    var kh = td.rows.filter(function (r) { return r.so && r.nguon === 'kh'; });
    var nh = td.rows.filter(function (r) { return r.nguon === 'nh' && r.so > 0; })[0] || null;
    var tuCo = kh.reduce(function (s, r) { return s + r.so; }, 0);
    var tuCoNhanNha = kh.filter(function (r) { return r.ngay <= td.nhanNha; }).reduce(function (s, r) { return s + r.so; }, 0);
    var nam12 = t2s(s2t(td.ngayKy) + 364 * DAY);
    var trong12 = kh.filter(function (r) { return r.ngay <= nam12; }).reduce(function (s, r) { return s + r.so; }, 0);
    var nam = {};
    function cong(y, k, v) { if (!nam[y]) nam[y] = { nam: +y, kh: 0, nh: 0, tra: 0 }; nam[y][k] += v; }
    kh.forEach(function (r) { cong(r.ngay.slice(0, 4), 'kh', r.so); });
    var vay = null;
    if (nh) {
      var L = nh.so, n = Math.max(0, Math.min(pol.htls.thang, thangGiua(nh.ngay, pol.htls.den)));
      var laiNam = opt.laiSau == null ? 10.5 : +opt.laiSau, r = laiNam / 100 / 12;
      var N = R((opt.namVay == null ? 25 : +opt.namVay) * 12), m = Math.max(1, N - n);
      var A = r ? L * r / (1 - Math.pow(1 + r, -m)) : L / m;
      cong(nh.ngay.slice(0, 4), 'nh', L);
      for (var k = n + 1; k <= N; k++) cong(congThang(nh.ngay, k).slice(0, 4), 'tra', A);
      vay = { L: L, ngayGiaiNgan: nh.ngay, htlsThang: n, htlsDen: congThang(nh.ngay, n), traTu: congThang(nh.ngay, n + 1), laiNam: laiNam, namVay: N / 12, soKy: m, traThang: R(A), tongLai: R(A * m - L), thuNhapGoiY: R(A / 0.5), ketThuc: congThang(nh.ngay, N) };
    }
    var dsNam = Object.keys(nam).sort().map(function (y) { var o = nam[y]; o.kh = R(o.kh); o.nh = R(o.nh); o.tra = R(o.tra); o.chi = o.kh + o.tra; return o; });
    return { tuCo: tuCo, tuCoNhanNha: tuCoNhanNha, trong12Thang: trong12, vay: vay, theoNam: dsNam };
  }

  /* Gói gọn cả phiếu cho một căn theo một phương thức */
  function phieu(niemYet, loai, pol, p, opt) {
    var g = tinhGia(niemYet, pol, p), td = tienDo(g, loai, pol, p, opt), cd = canDoi(td, pol, opt);
    return { pttt: p, gia: g, tienDo: td, canDoi: cd };
  }

  var api = { tinhGia: tinhGia, tienDo: tienDo, canDoi: canDoi, phieu: phieu, ptttHieuLuc: ptttHieuLuc, ptttHetHan: ptttHetHan, timPttt: timPttt, nhomLoai: nhomLoai, tienCoc: tienCoc, homNay: homNay, congThang: congThang, thangGiua: thangGiua };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BanTinh = api;
})(typeof window !== 'undefined' ? window : this);
