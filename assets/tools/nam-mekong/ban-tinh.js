/* Bộ tính phiếu tính giá và cân đối tài chính cho sa bàn (PROJECT_RULES §16.4) — bản Nam Mekong Grand Plaza.
   Khác bản Blanca: mỗi phương thức có mẫu tiến độ riêng (pol.tienDo[p.tienDo]); đợt bàn giao = pt × (giá sau CK + VAT) + 100% KPBT;
   đợt cấp sổ (gcn) = pt × (giá sau CK + VAT), hạn theo thông báo cấp sổ sau bàn giao; không có ký quỹ.
   Đọc chính sách từ chinh-sach.json, không gắn với giao diện: chạy được cả trên trình duyệt (window.BanTinh) lẫn Node (kiểm thử).
   Công thức theo phiếu tính giá tạm tính của chủ đầu tư:
   - giá chưa VAT & KPBT = giá niêm yết / 1,12; chiết khấu trừ lần lượt trên phần còn lại;
   - VAT = 10% giá sau chiết khấu, KPBT = 2%; tổng phải thanh toán = giá sau CK + VAT + KPBT;
   - mỗi đợt = % × (giá sau CK + VAT); lần 2 trừ tiền cọc; đợt bàn giao = 100% KPBT + VAT của 5% cuối;
     5% cuối chưa VAT vào tài khoản ký quỹ cấp sổ;
   - "ngày thứ n kể từ ngày ký" = ngày ký + n − 1; đợt có hạn sau ngày bàn giao thì gộp vào ngày bàn giao.
   Mở rộng cho dự án khác dựng theo khung (không đổi kết quả Nam Mekong):
   - đợt có ngayCo (YYYY-MM-DD) theo lịch cố định của chủ đầu tư; ngày đã qua so với ngày ký thì đóng ngay ngày ký;
   - chuaVat: đợt tính trên giá chưa VAT; vatThem: cộng thêm tỷ lệ × VAT (VAT của phần chưa VAT đóng ở đợt sau);
   - ngân hàng giải ngân nhiều lần (ngayCo hoặc theo: 'banGiao'); cân đối gộp các lần giải ngân, lãi trong thời gian
     giải ngân tính trên dư nợ đã giải ngân khi không có hỗ trợ lãi suất. */
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
  function tienCoc(pol, loai) { var k = nhomLoai(loai); return !pol.coc ? 0 : pol.coc[k] != null ? pol.coc[k] : pol.coc['*'] || 0; }

  /* Phương thức thanh toán còn hiệu lực ở ngày ký (phương thức có hạn tự ẩn khi qua hạn). */
  function ptttHieuLuc(pol, ngayKy) { ngayKy = ngayKy || homNay(); return pol.pttt.filter(function (p) { return !p.han || ngayKy <= p.han; }); }
  function ptttHetHan(pol, ngayKy) { ngayKy = ngayKy || homNay(); return pol.pttt.filter(function (p) { return p.han && ngayKy > p.han; }); }
  function timPttt(pol, id) { return pol.pttt.filter(function (p) { return p.id === id; })[0] || null; }

  /* Phần THÔNG TIN GIÁ & CHÍNH SÁCH */
  function tinhGia(niemYet, pol, p, khongVat) {
    var P0 = niemYet / pol.vatKpbt, con = P0, ck = [];
    (p.ck || []).forEach(function (c) { var so = R(c.tyLe * con); ck.push({ ten: c.ten, tyLe: c.tyLe, luc: c.luc || 'HĐTHNV', so: so }); con -= so; });
    var P = R(con), V = R(Math.max(0, P - (khongVat || 0)) * pol.vat), K = R(P * pol.kpbt);   // khongVat: phần không chịu VAT (tiền sử dụng đất)
    return { niemYet: niemYet, P0: R(P0), ck: ck, tongCk: ck.reduce(function (s, c) { return s + c.so; }, 0), P: P, V: V, K: K, T: P + V + K };
  }

  /* Phần TIẾN ĐỘ THANH TOÁN. opt: { ngayKy, tyLeVay } */
  function tienDo(g, loai, pol, p, opt) {
    opt = opt || {};
    var ky = opt.ngayKy || homNay(), PV = g.P + g.V, coc = tienCoc(pol, loai);
    var mau = pol.tienDo[p.tienDo] || pol.tienDo.chuan;
    var co = function (d) { return d < ky ? ky : d; };
    // bàn giao riêng theo phương thức: ngày cố định (ngayCo) và/hoặc n ngày từ ngày ký, lấy mốc muộn hơn
    var bgB = mau.filter(function (b) { return b.loai === 'banGiao'; })[0];
    var bg = bgB && (bgB.ngayCo || bgB.ngay) ? [bgB.ngayCo || pol.banGiao, bgB.ngay ? ngayThu(ky, bgB.ngay) : ''].sort().pop() : pol.banGiao;
    var nn = bgB && bgB.ngayCo ? bg : pol.nhanNha, cap = function (d) { return d > bg ? bg : d; };
    var tien = function (b) { return (b.pt || 0) * (b.chuaVat ? g.P : PV) + (b.vatThem || 0) * g.V; };
    var rows = [], lan = 0, lan2 = ky, hdmb = null, buSau = 0, ngayBanGiao = bg;
    mau.forEach(function (b) {
      if (b.loai === 'coc') { lan++; rows.push({ lan: lan, ten: 'Ký TTĐC · đặt cọc', pt: null, phan: 'Đặt cọc', ngay: ky, so: coc, nguon: 'kh', ptGoc: coc / PV }); }
      else if (b.loai === 'dot') {
        lan++;
        var ngay = cap(b.ngayCo ? (b.ngay ? [co(b.ngayCo), ngayThu(ky, b.ngay)].sort().pop() : co(b.ngayCo)) : ngayThu(ky, b.ngay)), so = R(tien(b) - (b.truCoc ? coc : 0));
        var r = { lan: lan, ten: b.tenDot || 'Đợt ' + (lan - 1), pt: b.pt, ngay: ngay, so: so, nguon: 'kh', ngayThu: b.ngay, ptGoc: so / PV };
        if (!b.chuaVat && !b.vatThem) r.ptGoc = b.pt - (b.truCoc ? coc / PV : 0);
        if (b.ghi) r.ghi = b.ghi;
        if (b.ngayTxt && (!b.ngayCo || ngay === b.ngayCo)) r.ngayTxt = b.ngayTxt;
        if (b.truCoc) { r.ghi = 'đủ ' + Math.round(b.pt * 100) + '%, đã gồm tiền cọc'; lan2 = ngay; }
        if (buSau) { r.so += buSau; r.bu = buSau; r.ptGoc += buSau / PV; r.ghi = 'gồm ' + buSau.toLocaleString('vi-VN') + ' đ vốn tự có bù phần vay còn thiếu'; buSau = 0; }
        rows.push(r);
      }
      else if (b.loai === 'hdmb') { hdmb = b.ngayCo ? cap(co(b.ngayCo)) : ngayThu(lan2, pol.hdmbSau); rows.push({ moc: 'hdmb', ten: 'Ký hợp đồng mua bán (HĐMB)', ghi: lan > 1 ? 'cùng đợt ' + (lan - 1) : 'cùng ngày ký', ngay: hdmb }); }
      else if (b.loai === 'nganHang') {
        lan++;
        var ng = b.theo === 'banGiao' ? bg : b.ngayCo ? cap(co(b.ngayCo)) : ngayThu(hdmb || lan2, b.sauHdmb);
        var tl = opt.tyLeVay == null ? b.pt : Math.max(0, Math.min(b.pt, opt.tyLeVay));
        var goc = b.chuaVat ? g.P : PV, vay = R(tl * goc), du = R(b.pt * goc) - vay;
        rows.push({ lan: lan, ten: 'Đợt ' + (lan - 1) + ' · ngân hàng giải ngân', pt: tl, ngay: ng, so: vay, nguon: 'nh', ghi: b.ghi || (b.theo === 'banGiao' ? 'khi bàn giao' : b.ngayCo ? 'theo tiến độ xây dựng' : 'trong ' + b.sauHdmb + ' ngày kể từ ký HĐMB') });
        if (du > 0) {
          if (b.buVaoDotSau) buSau = du;
          else rows.push({ lan: lan, ten: 'Đợt ' + (lan - 1) + ' · vốn tự có bù phần vay còn thiếu', pt: b.pt - tl, ngay: ng, so: du, nguon: 'kh', ptGoc: du / PV });
        }
      }
      else if (b.loai === 'nhanNha') rows.push({ moc: 'nhanNha', ten: 'Nhận nhà sử dụng (Sun Early Key)', ghi: 'cần đã đóng đủ 70% giá trị gồm VAT', ngay: nn });
      else if (b.loai === 'banGiao') {
        lan++; ngayBanGiao = b.theo === 'nhanNha' ? nn : bg;
        rows.push({ lan: lan, ten: 'Đợt ' + (lan - 1) + ' · theo thông báo bàn giao', pt: b.pt || null, phan: (b.pt ? '+ ' : '') + (b.vatThem ? 'VAT phần cấp sổ + ' : '') + '100% kinh phí bảo trì', ngay: ngayBanGiao, so: R(tien(b) + g.K), nguon: 'kh', banGiao: true, ptGoc: b.pt || 0 });
      }
      else if (b.loai === 'gcn') {
        lan++;
        rows.push({ lan: lan, ten: 'Đợt ' + (lan - 1) + ' · theo thông báo cấp sổ', pt: b.pt, ngay: bg, ngayTxt: 'sau bàn giao', so: R(tien(b)), nguon: 'kh', gcn: true, ptGoc: b.pt });
        if (b.chuaVat) rows[rows.length - 1].phan = 'chưa VAT';
      }
      else if (b.loai === 'kyQuy' && b.pt) { lan++; rows.push({ lan: lan, ten: b.tenDot || 'Ký quỹ', pt: b.pt, phan: 'giá chưa VAT', ghi: b.ghi || '', ngay: b.ngayCo ? cap(co(b.ngayCo)) : ky, so: R(b.pt * g.P), nguon: 'kh', ptGoc: b.pt * g.P / PV }); }
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
    var nhs = td.rows.filter(function (r) { return r.nguon === 'nh' && r.so > 0; }), nh = nhs[0] || null;
    var tuCo = kh.reduce(function (s, r) { return s + r.so; }, 0);
    var tuCoNhanNha = kh.filter(function (r) { return r.ngay <= td.nhanNha; }).reduce(function (s, r) { return s + r.so; }, 0);
    var nam12 = t2s(s2t(td.ngayKy) + 364 * DAY);
    var trong12 = kh.filter(function (r) { return r.ngay <= nam12; }).reduce(function (s, r) { return s + r.so; }, 0);
    var nam = {};
    function cong(y, k, v) { if (!nam[y]) nam[y] = { nam: +y, kh: 0, nh: 0, tra: 0 }; nam[y][k] += v; }
    kh.forEach(function (r) { cong(r.ngay.slice(0, 4), 'kh', r.so); });
    var vay = null;
    if (nh && nhs.length === 1) {
      var L = nh.so, n = pol.htls ? Math.max(0, Math.min(pol.htls.thang, thangGiua(nh.ngay, pol.htls.den))) : 0;
      var laiNam = opt.laiSau == null ? 10.5 : +opt.laiSau, r = laiNam / 100 / 12;
      var N = R((opt.namVay == null ? 25 : +opt.namVay) * 12), m = Math.max(1, N - n);
      var A = r ? L * r / (1 - Math.pow(1 + r, -m)) : L / m;
      cong(nh.ngay.slice(0, 4), 'nh', L);
      for (var k = n + 1; k <= N; k++) cong(congThang(nh.ngay, k).slice(0, 4), 'tra', A);
      vay = { L: L, ngayGiaiNgan: nh.ngay, htlsThang: n, htlsDen: congThang(nh.ngay, n), traTu: congThang(nh.ngay, n + 1), laiNam: laiNam, namVay: N / 12, soKy: m, traThang: R(A), tongLai: R(A * m - L), thuNhapGoiY: R(A / 0.5), ketThuc: congThang(nh.ngay, N) };
    } else if (nh) {
      // giải ngân nhiều lần: trả lãi trên dư nợ đã giải ngân đến lần cuối, sau đó trả đều gốc lãi
      var L2 = nhs.reduce(function (s, x) { return s + x.so; }, 0), cuoi = nhs[nhs.length - 1].ngay;
      var laiNam2 = opt.laiSau == null ? 10.5 : +opt.laiSau, r2 = laiNam2 / 100 / 12, laiTruoc = 0;
      nhs.forEach(function (x) { cong(x.ngay.slice(0, 4), 'nh', x.so); });
      var tongTh = thangGiua(nh.ngay, cuoi);
      for (var q = 1; q <= tongTh; q++) {
        var ngQ = congThang(nh.ngay, q), du = nhs.filter(function (x) { return x.ngay < ngQ; }).reduce(function (s, x) { return s + x.so; }, 0), li = du * r2;
        laiTruoc += li; cong(ngQ.slice(0, 4), 'tra', li);
      }
      var N2 = R((opt.namVay == null ? 25 : +opt.namVay) * 12), m2 = Math.max(1, N2 - tongTh);
      var A2 = r2 ? L2 * r2 / (1 - Math.pow(1 + r2, -m2)) : L2 / m2;
      for (var k2 = 1; k2 <= m2; k2++) cong(congThang(cuoi, k2).slice(0, 4), 'tra', A2);
      vay = { L: L2, ngayGiaiNgan: nh.ngay, ngayCuoi: cuoi, soLan: nhs.length, htlsThang: 0, laiTruoc: R(laiTruoc), htlsDen: nh.ngay, traTu: congThang(cuoi, 1), laiNam: laiNam2, namVay: N2 / 12, soKy: m2, traThang: R(A2), tongLai: R(A2 * m2 - L2 + laiTruoc), thuNhapGoiY: R(A2 / 0.5), ketThuc: congThang(cuoi, m2) };
    }
    var dsNam = Object.keys(nam).sort().map(function (y) { var o = nam[y]; o.kh = R(o.kh); o.nh = R(o.nh); o.tra = R(o.tra); o.chi = o.kh + o.tra; return o; });
    return { tuCo: tuCo, tuCoNhanNha: tuCoNhanNha, trong12Thang: trong12, vay: vay, theoNam: dsNam };
  }

  /* Gói gọn cả phiếu cho một căn theo một phương thức */
  function phieu(niemYet, loai, pol, p, opt) {
    var g = tinhGia(niemYet, pol, p, opt && opt.khongVat), td = tienDo(g, loai, pol, p, opt), cd = canDoi(td, pol, opt);
    return { pttt: p, gia: g, tienDo: td, canDoi: cd };
  }

  var api = { tinhGia: tinhGia, tienDo: tienDo, canDoi: canDoi, phieu: phieu, ptttHieuLuc: ptttHieuLuc, ptttHetHan: ptttHetHan, timPttt: timPttt, nhomLoai: nhomLoai, tienCoc: tienCoc, homNay: homNay, congThang: congThang, thangGiua: thangGiua };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BanTinh = api;
})(typeof window !== 'undefined' ? window : this);
