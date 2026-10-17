/* Khối "Vay ngân hàng" dùng chung cho các bảng tính dự án (assets/tools/*-bang-tinh).
   Không thư viện ngoài. Lãi suất là GIẢ ĐỊNH do người dùng nhập, không phải báo giá của ngân hàng nào.
   Mỗi bảng tính cung cấp "ngữ cảnh" (ctx) gồm các phương thức thanh toán, khoản ngân hàng giải ngân và chính sách hỗ trợ lãi suất;
   module này tính lịch trả nợ, vẽ biểu đồ SVG và dựng trang A4 để lưu PDF. */
(function (w) {
  'use strict';

  var DEF = { r1: 7, m1: 12, r2: 10.5, term: 25, method: 'annuity', grace: '', hpct: '', hm: '', ho: 0 };
  var C = { blue: '#2563eb', gold: '#d4a843', green: '#16a34a', navy: '#0c2340', grey: '#94a3b8' };
  var state = { opts: null, mountEl: null };

  /* ---------- định dạng ---------- */
  function fm(n) { return n == null || isNaN(n) ? '–' : Math.round(n).toLocaleString('vi-VN'); }
  function fb(n) {
    if (n == null || isNaN(n)) return '–';
    var a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
    if (a >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
    return fm(n);
  }
  function pc(x, d) { return (x * 100).toLocaleString('vi-VN', { maximumFractionDigits: d == null ? 1 : d }) + '%'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(id, d) {
    var el = document.getElementById(id);
    if (!el) return d;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isNaN(v) ? d : v;
  }

  /* ---------- tham số vay do người dùng nhập ---------- */
  function readP() {
    var el = document.getElementById('nl-method');
    var gr = document.getElementById('nl-grace'), hp = document.getElementById('nl-hpct'), hm = document.getElementById('nl-hm');
    var P = {
      r1: Math.max(0, num('nl-r1', DEF.r1)) / 100,
      m1: Math.max(0, Math.round(num('nl-m1', DEF.m1))),
      r2: Math.max(0, num('nl-r2', DEF.r2)) / 100,
      termY: Math.min(35, Math.max(1, num('nl-term', DEF.term))),
      method: el ? el.value : DEF.method,
      grace: gr && gr.value !== '' ? Math.max(0, Math.round(num('nl-grace', 0))) : null,
      hpct: hp && hp.value !== '' ? Math.min(100, Math.max(0, num('nl-hpct', 100))) / 100 : null,
      hm: hm && hm.value !== '' ? Math.max(0, Math.round(num('nl-hm', 0))) : null,
      ho: Math.min(100, Math.max(0, num('nl-ho', 0))) / 100
    };
    P.termM = Math.round(P.termY * 12);
    return P;
  }

  /* ---------- lõi tính toán ----------
     Tháng 0 = ký thỏa thuận đặt cọc. Khoản vay giải ngân ở tháng m; lãi bắt đầu tính từ tháng m+1. */
  function tranchesOf(m, P) {
    var t = (m.tr || []).map(function (x) { return { m: x.m, amt: x.amt }; });
    if (!t.length && m.ho && P.ho > 0) t.push({ m: m.ho.m, amt: m.ho.amt * P.ho, own: true });
    return t.filter(function (x) { return x.amt > 0; });
  }

  function sim(m, P) {
    var tr = tranchesOf(m, P);
    if (!tr.length) return null;
    tr.sort(function (a, b) { return a.m - b.m; });
    var m0 = tr[0].m, L = tr.reduce(function (a, x) { return a + x.amt; }, 0);
    var pol = !!(m.htls && !tr[0].own);
    var H = pol ? (P.hm != null ? P.hm : m.htls.m) : 0;
    var hp = pol ? (P.hpct != null ? P.hpct : m.htls.pct / 100) : 0;
    var G = P.grace != null ? P.grace : (pol ? H : 0);
    G = Math.min(G, P.termM - 1);
    var bal = 0, rows = [], k;
    for (k = 0; k < tr.length && tr[k].m === m0; k++) bal += tr[k].amt;
    var next = k, totI = 0, hI = 0, khI = 0, khP = 0, peak = bal;
    for (var t = 1; t <= P.termM; t++) {
      var M = m0 + t, r = (t <= P.m1 ? P.r1 : P.r2) / 12, i = bal * r, pr = 0;
      if (t > G) {
        var n = P.termM - t + 1;
        if (P.method === 'equal') pr = bal / n;
        else pr = (r === 0 ? bal / n : bal * r / (1 - Math.pow(1 + r, -n)) - i);
        pr = Math.min(Math.max(pr, 0), bal);
      }
      var sup = t <= H ? i * hp : 0, kh = i - sup;
      rows.push({ t: t, M: M, i: i, pr: pr, sup: sup, kh: kh, pay: kh + pr, rate: r * 12, bal0: bal });
      bal -= pr;
      totI += i; hI += sup; khI += kh; khP += pr;
      while (next < tr.length && tr[next].m === M) { bal += tr[next].amt; next++; }
      if (bal > peak) peak = bal;
      rows[rows.length - 1].bal = bal;
    }
    var yearly = [], y;
    for (y = 0; y * 12 < rows.length; y++) {
      var seg = rows.slice(y * 12, y * 12 + 12);
      yearly.push({
        y: y + 1,
        pr: seg.reduce(function (a, x) { return a + x.pr; }, 0),
        kh: seg.reduce(function (a, x) { return a + x.kh; }, 0),
        sup: seg.reduce(function (a, x) { return a + x.sup; }, 0),
        bal: seg[seg.length - 1].bal
      });
    }
    var at = function (t) { return rows[Math.min(Math.max(t, 1), rows.length) - 1]; };
    var cap = m.maxPct ? m.maxPct * m.h : null;
    return {
      L: L, m0: m0, H: H, hp: hp, G: G, pol: pol, rows: rows, yearly: yearly, peak: peak,
      totI: totI, hI: hI, khI: khI, khP: khP,
      p1: at(1).pay, pH: H > 0 && H < rows.length ? at(H + 1).pay : null, pPromo: P.m1 > 0 && P.m1 < rows.length ? at(P.m1 + 1).pay : null,
      pMax: rows.reduce(function (a, x) { return Math.max(a, x.pay); }, 0),
      over: cap != null && L > cap + 1000, cap: cap,
      cost: m.f + khI
    };
  }

  /* ---------- SVG ---------- */
  function axisTicks(max, n) {
    var step = max / n, out = [];
    for (var i = 0; i <= n; i++) out.push(step * i);
    return out;
  }

  function chartYears(s, hgt) {
    var W = 640, H = hgt || 230, l = 70, r = 8, t = 12, b = 26, ys = s.yearly, n = ys.length;
    var max = Math.max.apply(null, ys.map(function (v) { return v.pr + v.kh + v.sup; })) || 1;
    max = max * 1.08;
    var bw = (W - l - r) / n, g = '';
    axisTicks(max, 4).forEach(function (v) {
      var y = t + (H - t - b) * (1 - v / max);
      g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (l - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".7">' + fb(v) + '</text>';
    });
    ys.forEach(function (v, i) {
      var x = l + bw * i + bw * .15, w1 = bw * .7, y0 = H - b, hh;
      [[v.pr, C.blue], [v.kh, C.gold], [v.sup, C.green]].forEach(function (seg) {
        if (seg[0] <= 0) return;
        hh = (H - t - b) * seg[0] / max;
        y0 -= hh;
        g += '<rect x="' + x.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + w1.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + seg[1] + '"/>';
      });
      var lab = n > 14 ? (v.y % 5 === 0 || v.y === 1) : true;
      if (lab) g += '<text x="' + (x + w1 / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".75">' + v.y + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Tiền khách hàng trả mỗi năm: gốc, lãi, lãi do chủ đầu tư hỗ trợ" style="display:block">' + g + '</svg>';
  }

  function chartBalance(s, hgt) {
    var W = 640, H = hgt || 170, l = 70, r = 8, t = 12, b = 26, ys = s.yearly, max = (s.peak || 1) * 1.08;
    var pts = [[0, s.L]].concat(ys.map(function (v) { return [v.y, v.bal]; })), n = ys.length || 1;
    var X = function (y) { return l + (W - l - r) * y / n; }, Y = function (v) { return t + (H - t - b) * (1 - v / max); };
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var g = '';
    axisTicks(max, 3).forEach(function (v) {
      var y = Y(v);
      g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (l - 6) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".7">' + fb(v) + '</text>';
    });
    g += '<path d="' + d + ' L' + X(n).toFixed(1) + ' ' + Y(0).toFixed(1) + ' L' + X(0).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z" fill="' + C.blue + '" fill-opacity=".14"/><path d="' + d + '" fill="none" stroke="' + C.blue + '" stroke-width="2"/>';
    for (var y2 = 0; y2 <= n; y2 += (n > 14 ? 5 : 1)) g += '<text x="' + X(y2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".75">' + y2 + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Dư nợ gốc theo năm" style="display:block">' + g + '</svg>';
  }

  /* Dòng thời gian: tháng 0 → hết kỳ vay. Đoạn đầu (nơi có các mốc) phóng to, phần còn lại của kỳ vay nén lại để nhãn không chồng nhau. */
  function timeline(s, P, m) {
    var W = 640, H = 118, l = 10, r = 10, end = s.m0 + P.termM;
    var marks = [[0, 'Ký TTĐC'], [s.m0, 'Giải ngân']];
    if (m.hand) marks.push([m.hand, 'Bàn giao']);
    if (s.H > 0) marks.push([s.m0 + s.H, 'Hết HTLS']);
    if (P.m1 > 0 && P.m1 < P.termM) marks.push([s.m0 + P.m1, 'Hết ưu đãi']);
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var inner = marks.map(function (k) { return k[0]; }).filter(function (v) { return v < end; });
    var zoom = Math.min(end, Math.max.apply(null, inner) + 6), tail = end > zoom;
    var wz = tail ? (W - l - r) * .8 : (W - l - r), X = function (mo) {
      return mo <= zoom ? l + wz * mo / zoom : l + wz + (W - l - r - wz) * (mo - zoom) / (end - zoom);
    };
    var g = '', y1 = 58, hh = 16;
    var seg = function (a, b, col, y, h, op) {
      if (b > a) g += '<rect x="' + X(a).toFixed(1) + '" y="' + y + '" width="' + Math.max(1, X(b) - X(a)).toFixed(1) + '" height="' + h + '" fill="' + col + '"' + (op ? ' fill-opacity="' + op + '"' : '') + '/>';
    };
    seg(0, s.m0, C.grey, y1, hh, .45);
    var pEnd = Math.min(end, s.m0 + P.m1);
    seg(s.m0, pEnd, C.gold, y1, hh);
    seg(pEnd, end, C.blue, y1, hh, .85);
    if (s.H > 0) seg(s.m0, Math.min(end, s.m0 + s.H), C.green, y1 + hh + 5, 8);
    marks.forEach(function (k, i) {
      var x = X(k[0]), ty = 12 + (i % 3) * 13, anchor = i === 0 ? 'start' : 'middle';
      g += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (ty + 3) + '" y2="' + (y1 + hh + 2) + '" stroke="currentColor" stroke-opacity=".4"/><text x="' + x.toFixed(1) + '" y="' + ty + '" text-anchor="' + anchor + '" font-size="9.5" font-weight="600" fill="currentColor">T' + k[0] + ' ' + esc(k[1]) + '</text>';
    });
    if (tail) g += '<path d="M' + (X(zoom) - 3).toFixed(1) + ' ' + (y1 - 4) + 'l6 ' + (hh + 8) + '" stroke="#fff" stroke-width="3"/><text x="' + (W - r) + '" y="' + (y1 - 8) + '" text-anchor="end" font-size="9.5" font-weight="600" fill="currentColor">T' + end + ' Hết kỳ vay</text>';
    g += '<text x="' + l + '" y="' + (H - 6) + '" font-size="9.5" fill="currentColor" fill-opacity=".7">Trục: tháng kể từ ký TTĐC (T0)' + (tail ? ', đoạn sau dấu // nén lại' : '') + '. Xám: chưa vay · Vàng: lãi ưu đãi · Xanh dương: lãi thả nổi · Xanh lá: CĐT hỗ trợ lãi</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Dòng thời gian khoản vay" style="display:block">' + g + '</svg>';
  }

  function chartCompare(list) {
    var W = 640, rowH = 38, l = 150, r = 70, t = 6, H = t + rowH * list.length + 22;
    var max = Math.max.apply(null, list.map(function (x) { return x.own + x.L + x.khI; })) || 1;
    var g = '';
    list.forEach(function (x, i) {
      var y = t + i * rowH, sc = (W - l - r) / max, x0 = l;
      g += '<text x="' + (l - 8) + '" y="' + (y + 20) + '" text-anchor="end" font-size="11" font-weight="' + (x.sel ? 700 : 500) + '" fill="currentColor">' + esc(x.name) + '</text>';
      [[x.own, C.navy], [x.L, C.blue], [x.khI, C.gold]].forEach(function (s) {
        if (s[0] <= 0) return;
        var w1 = s[0] * sc;
        g += '<rect x="' + x0.toFixed(1) + '" y="' + (y + 8) + '" width="' + w1.toFixed(1) + '" height="20" fill="' + s[1] + '"/>';
        x0 += w1;
      });
      g += '<text x="' + (x0 + 6).toFixed(1) + '" y="' + (y + 22) + '" font-size="11" font-weight="700" fill="currentColor">' + fb(x.own + x.L + x.khI) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Tổng chi phí sở hữu theo từng phương thức" style="display:block">' + g + '</svg>';
  }

  var LEG = '<div class="nl-leg"><span><i style="background:' + C.navy + '"></i>Vốn tự có</span><span><i style="background:' + C.blue + '"></i>Gốc vay</span><span><i style="background:' + C.gold + '"></i>Lãi khách trả</span></div>';
  var LEG_Y = '<div class="nl-leg"><span><i style="background:' + C.blue + '"></i>Gốc</span><span><i style="background:' + C.gold + '"></i>Lãi khách trả</span><span><i style="background:' + C.green + '"></i>Lãi chủ đầu tư hỗ trợ</span></div>';

  /* ---------- dựng nội dung ---------- */
  function methodById(ctx, id) { for (var i = 0; i < ctx.methods.length; i++) if (ctx.methods[i].id === id) return ctx.methods[i]; return null; }

  function kpis(s, m, P) {
    var k = [['Khoản vay', fb(s.L), pc(s.L / m.h, 0) + ' giá trị căn']];
    k.push(['Khách trả tháng đầu', fb(s.p1) + ' đ', s.H > 0 ? 'đang được CĐT hỗ trợ lãi' : 'tháng đầu sau giải ngân']);
    if (s.pH != null) k.push(['Khách trả hàng tháng sau khi hết hỗ trợ', fb(s.pH) + ' đ', 'từ T' + (s.m0 + s.H + 1) + (P.method === 'equal' ? ', giảm dần theo thời gian' : '')]);
    else if (s.pPromo != null) k.push(['Trả sau ưu đãi', fb(s.pPromo) + ' đ', 'tháng T' + (s.m0 + P.m1 + 1)]);
    k.push(['Tổng lãi khách tự trả', fb(s.khI) + ' đ', 'trong ' + P.termY.toLocaleString('vi-VN') + ' năm']);
    if (s.hI > 0) k.push(['Chủ đầu tư hỗ trợ lãi', fb(s.hI) + ' đ', 'trong ' + s.H + ' tháng']);
    return '<div class="nl-kpis">' + k.map(function (x) { return '<div class="nl-k"><span>' + x[0] + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>'; }).join('') + '</div>';
  }


  /* Khoản khách trả hàng tháng, gom theo giai đoạn (được hỗ trợ lãi / ưu đãi / thả nổi) */
  function phases(s) {
    var out = [], cur = null;
    s.rows.forEach(function (x) {
      var sup = x.sup > 0 ? 1 : 0, key = sup + '|' + x.rate;
      if (!cur || cur.key !== key) { cur = { key: key, sup: sup, rate: x.rate, a: x.t, b: x.t, p0: x.pay, p1: x.pay, i0: x.i, g: x.pr > 0 }; out.push(cur); }
      cur.b = x.t; cur.p1 = x.pay; cur.hasP = cur.hasP || x.pr > 0;
    });
    return out;
  }
  function phaseTable(s) {
    var h = '<table class="nl-t"><thead><tr><th>Giai đoạn</th><th>Từ tháng vay</th><th>Đến tháng vay</th><th>Lãi suất</th><th>Khách trả mỗi tháng (đ)</th></tr></thead><tbody>';
    phases(s).forEach(function (f) {
      var name = (f.sup ? 'CĐT hỗ trợ lãi' : (f.rate <= (readP().r1 + 1e-9) && readP().m1 > 0 && f.a <= readP().m1 ? 'Lãi ưu đãi' : 'Lãi thả nổi')) + (f.hasP ? '' : ' · chưa trả gốc');
      var pay = Math.abs(f.p0 - f.p1) < 1 ? fm(f.p0) : fm(f.p0) + ' → ' + fm(f.p1);
      h += '<tr><td>' + name + '</td><td>' + f.a + '</td><td>' + f.b + '</td><td>' + (f.rate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%</td><td><b>' + pay + '</b></td></tr>';
    });
    return h + '</tbody></table><div class="nl-as">Tháng vay 1 là tháng ngay sau giải ngân (T' + (s.m0 + 1) + '). Gốc đều: tiền trả giảm dần nên hiện từ mức đầu → mức cuối của giai đoạn. Gốc + lãi chia đều: giữ nguyên trong cùng mức lãi.</div>';
  }
  function monthTable(s, n) {
    var h = '<table class="nl-t"><thead><tr><th>Tháng vay</th><th>Tháng (T)</th><th>Lãi suất</th><th>Dư nợ đầu kỳ (đ)</th><th>Gốc (đ)</th><th>Lãi (đ)</th><th>CĐT hỗ trợ (đ)</th><th>Khách trả (đ)</th></tr></thead><tbody>';
    s.rows.slice(0, n || s.rows.length).forEach(function (x) {
      h += '<tr><td>' + x.t + '</td><td>T' + x.M + '</td><td>' + (x.rate * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%</td><td>' + fm(x.bal0) + '</td><td>' + fm(x.pr) + '</td><td>' + fm(x.i) + '</td><td>' + (x.sup > 0 ? fm(x.sup) : '–') + '</td><td><b>' + fm(x.pay) + '</b></td></tr>';
    });
    return h + '</tbody></table>';
  }

  function yearlyTable(s) {
    var h = '<table class="nl-t"><thead><tr><th>Năm vay</th><th>Gốc trả (đ)</th><th>Lãi khách trả (đ)</th><th>Lãi CĐT hỗ trợ (đ)</th><th>Dư nợ cuối năm (đ)</th></tr></thead><tbody>';
    var a = [0, 0, 0];
    s.yearly.forEach(function (v) {
      a[0] += v.pr; a[1] += v.kh; a[2] += v.sup;
      h += '<tr><td>' + v.y + '</td><td>' + fm(v.pr) + '</td><td>' + fm(v.kh) + '</td><td>' + (v.sup > 0 ? fm(v.sup) : '–') + '</td><td>' + fm(v.bal) + '</td></tr>';
    });
    return h + '<tr class="nl-tot"><td>Tổng</td><td>' + fm(a[0]) + '</td><td>' + fm(a[1]) + '</td><td>' + (a[2] > 0 ? fm(a[2]) : '–') + '</td><td></td></tr></tbody></table>';
  }

  function compareRows(ctx, P) {
    return ctx.methods.map(function (m) {
      var s = sim(m, P), L = s ? s.L : 0;
      return { id: m.id, name: m.name, sel: m.id === ctx.sel, m: m, s: s, L: L, own: m.f - L, khI: s ? s.khI : 0, f: m.f };
    });
  }

  function compareTable(list) {
    var h = '<table class="nl-t"><thead><tr><th>Phương thức</th><th>Giá cuối (đ)</th><th>Khoản vay (đ)</th><th>Trả tháng đầu (đ)</th><th>Trả cao nhất (đ)</th><th>Lãi khách trả (đ)</th><th>CĐT hỗ trợ lãi (đ)</th><th>Tổng chi phí (đ)</th></tr></thead><tbody>';
    list.forEach(function (x) {
      var s = x.s;
      h += '<tr class="' + (x.sel ? 'nl-sel' : '') + '"><td>' + esc(x.name) + (x.sel ? ' ✓' : '') + '</td><td>' + fm(x.f) + '</td>' +
        (s ? '<td>' + fm(s.L) + '</td><td>' + fm(s.p1) + '</td><td>' + fm(s.pMax) + '</td><td>' + fm(s.khI) + '</td><td>' + (s.hI > 0 ? fm(s.hI) : '–') + '</td><td><b>' + fm(s.cost) + '</b></td>'
          : '<td colspan="5" class="nl-na">Không vay theo chính sách phương thức này</td><td><b>' + fm(x.f) + '</b></td>') + '</tr>';
    });
    return h + '</tbody></table>';
  }

  function warnings(s, m, P) {
    var w = [];
    if (s.over) w.push('Khoản vay ' + fb(s.L) + ' vượt mức tối đa ' + pc(m.maxPct, 0) + ' giá trị căn theo chính sách (' + fb(s.cap) + ').');
    if (P.termY > 35) w.push('Thời hạn vay tối đa 35 năm.');
    return w.length ? '<div class="nl-warn">' + w.join(' ') + '</div>' : '';
  }

  function assumptions(P, s, m) {
    var h = 'Giả định: lãi suất ưu đãi <b>' + (P.r1 * 100).toLocaleString('vi-VN') + '%/năm</b> trong ' + P.m1 + ' tháng đầu, sau đó thả nổi <b>' + (P.r2 * 100).toLocaleString('vi-VN') + '%/năm</b>; vay <b>' + P.termY.toLocaleString('vi-VN') + ' năm</b>; trả <b>' + (P.method === 'equal' ? 'gốc đều, lãi giảm dần' : 'gốc + lãi chia đều (niên kim)') + '</b>';
    if (s.G > 0) h += '; ân hạn gốc <b>' + s.G + ' tháng</b>';
    if (s.pol) h += '; chủ đầu tư hỗ trợ <b>' + pc(s.hp, 0) + '</b> lãi trong <b>' + s.H + ' tháng</b> đầu';
    return h + '.';
  }

  var DISC = 'Lãi suất, thời gian ưu đãi và điều kiện cho vay trong bảng này là <b>giả định minh họa do người dùng nhập</b>, không phải báo giá của ngân hàng nào. Mức lãi thực tế, hạn mức, ân hạn và phí do ngân hàng quyết định tại thời điểm thẩm định. Phạm vi hỗ trợ lãi suất của chủ đầu tư cần đối chiếu văn bản chính sách chính thức.';

  function body(ctx, P, forPdf) {
    var m = methodById(ctx, ctx.sel), list = compareRows(ctx, P), s = m ? sim(m, P) : null, h = '';
    if (!s) {
      h += '<div class="nl-na2">Phương thức <b>' + esc(m ? m.name : '') + '</b> không có khoản vay ngân hàng theo chính sách.' + (m && m.ho ? ' Có thể nhập tỷ lệ “vay thêm tại đợt bàn giao” ở trên để xem phương án tự vay.' : '') + '</div>';
    } else {
      h += '<div class="nl-pol"><b>' + esc(m.name) + '</b>' + (m.note ? ' · ' + esc(m.note) : '') + '</div>';
      h += kpis(s, m, P) + warnings(s, m, P);
      h += '<div class="nl-h">Khoản trả hàng tháng theo giai đoạn</div><div class="tw">' + phaseTable(s) + '</div>';
      if (forPdf) h += '<div class="nl-as" style="margin-top:4px">' + assumptions(P, s, m) + '</div>';
      h += '<div class="nl-h">Dòng thời gian khoản vay</div>' + timeline(s, P, m);
      h += '<div class="nl-h">Tiền khách hàng trả mỗi năm (trục ngang: năm vay)</div>' + chartYears(s, forPdf ? 190 : 0) + LEG_Y;
      if (!forPdf) h += '<div class="nl-h">Dư nợ gốc theo năm (đ)</div>' + chartBalance(s, 0);
      if (!forPdf) h += '<details class="nl-d"><summary>Bảng trả nợ từng tháng (' + s.rows.length + ' tháng)</summary><div class="tw">' + monthTable(s) + '</div></details><details class="nl-d"><summary>Bảng trả nợ theo năm</summary><div class="tw">' + yearlyTable(s) + '</div></details>';
      if (!forPdf) h += '<div class="nl-as">' + assumptions(P, s, m) + '</div>';
    }
    if (!forPdf) {
      h += '<div class="nl-h">So sánh tổng chi phí giữa các phương thức (cùng giả định vay)</div>' + chartCompare(list) + LEG + '<div class="tw">' + compareTable(list) + '</div>';
      h += '<div class="nl-disc">' + DISC + '</div>';
    }
    return h;
  }

  /* ---------- giao diện trong trang ---------- */
  var CSS = '.nl,#nlPdf{--nl-bg:#fff;--nl-fg:#212529;--nl-mu:#6c757d;--nl-line:#dee2e6;--nl-ac:#0c2340;--nl-ac2:#d4a843;--nl-thbg:#0c2340;--nl-thfg:#fff;--nl-inbg:#fff;color:var(--nl-fg)}' +
    '.nl h3{font-size:15px;margin:0 0 4px;color:var(--nl-ac)}.nl .card-title{margin-bottom:6px}.nl .nl-sub{font-size:12px;color:var(--nl-mu);margin-bottom:10px}' +
    '.nl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 12px;margin:10px 0}.nl-grid label{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:600;color:var(--nl-mu)}' +
    '.nl-grid input,.nl-grid select{padding:7px 9px;border:1px solid var(--nl-line);border-radius:6px;font-size:13px;font-family:inherit;background:var(--nl-inbg);color:var(--nl-fg);width:100%;min-width:0}' +
    '.nl-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:10px 0}.nl-k{border:1px solid var(--nl-line);border-left:3px solid var(--nl-ac2);border-radius:6px;padding:8px 10px}.nl-k span{display:block;font-size:10px;text-transform:uppercase;color:var(--nl-mu)}.nl-k b{display:block;font-size:16px;color:var(--nl-ac);margin-top:2px}.nl-k small{font-size:10.5px;color:var(--nl-mu)}' +
    '.nl-h{font-size:12px;font-weight:700;margin:16px 0 6px;color:var(--nl-ac)}.nl-pol{font-size:12px;margin:10px 0 0}.nl-as{font-size:11.5px;color:var(--nl-mu);margin-top:10px;line-height:1.55}.nl-as b{color:var(--nl-fg)}' +
    '.nl-leg{display:flex;flex-wrap:wrap;gap:12px;font-size:11px;margin:4px 0 8px}.nl-leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}' +
    '.nl-t{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px}.nl-t th{background:var(--nl-thbg);color:var(--nl-thfg);padding:6px;font-size:10.5px;text-align:right}.nl-t th:first-child,.nl-t td:first-child{text-align:left}.nl-t td{padding:5px 6px;border-bottom:1px solid var(--nl-line);text-align:right;font-variant-numeric:tabular-nums}.nl-t .nl-sel td{background:rgba(212,168,67,.16)}.nl-t .nl-tot td{font-weight:700;border-top:2px solid var(--nl-ac)}.nl-t .nl-na{text-align:center;color:var(--nl-mu);font-style:italic}' +
    '.nl-warn{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:6px;padding:7px 10px;font-size:12px;margin:8px 0}.nl-na2{border:1px dashed var(--nl-line);border-radius:6px;padding:12px;font-size:12.5px;color:var(--nl-mu);margin:10px 0}' +
    '.nl-disc{font-size:11px;color:var(--nl-mu);border-top:1px solid var(--nl-line);margin-top:14px;padding-top:8px;line-height:1.55}.nl-d summary{cursor:pointer;font-size:12px;font-weight:600;margin:10px 0 4px}.nl .tw{overflow-x:auto}' +
    /* trang A4 */
    '#nlPdf{display:none}@media print{body.nl-pdfmode>*:not(#nlPdf){display:none!important}body.nl-pdfmode{background:#fff!important}body.nl-pdfmode #nlPdf{display:block!important;color:#1b2430;font-family:"Segoe UI",system-ui,-apple-system,sans-serif}@page{size:A4 portrait;margin:11mm}' +
    '#nlPdf .pg{break-after:page;page-break-after:always;font-size:11px;line-height:1.5;position:relative;min-height:268mm}#nlPdf .pg:last-child{break-after:auto;page-break-after:auto}' +
    '#nlPdf .pgh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #d4a843;padding-bottom:5px;margin-bottom:10px}#nlPdf .pgh b{font-size:14px;color:#0c2340;letter-spacing:.02em}#nlPdf .pgh span{font-size:10px;color:#6c757d}' +
    '#nlPdf .pgf{position:absolute;bottom:0;left:0;right:0;font-size:9.5px;color:#6c757d;border-top:1px solid #dee2e6;padding-top:4px;display:flex;justify-content:space-between}' +
    '#nlPdf .pgt{font-size:19px;font-weight:700;color:#0c2340;margin:2px 0 8px}#nlPdf table{width:100%;border-collapse:collapse;font-size:10px}#nlPdf img{max-width:100%}#nlPdf .nl-t{font-size:9.5px}#nlPdf .nl-t td{padding:3px 5px}#nlPdf .cmp .cw{overflow:visible}#nlPdf .cmp th,#nlPdf .cmp td{white-space:normal;padding:4px 3px;font-size:9px}' +
    '#nlPdf .cov{background:linear-gradient(135deg,#0c2340,#1a3a5c);color:#fff;padding:18px 20px;border-radius:8px;margin-bottom:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}#nlPdf .cov b{display:block;font-size:22px}#nlPdf .cov span{font-size:12px;color:#e8cc7a}' +
    '#nlPdf *{-webkit-print-color-adjust:exact;print-color-adjust:exact}#nlPdf .nl-k{break-inside:avoid}#nlPdf svg{break-inside:avoid}}';

  function ensureCss() {
    if (document.getElementById('nl-css')) return;
    var st = document.createElement('style'); st.id = 'nl-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function shell(opts) {
    var d = opts.defaults || {};
    var v = function (k) { return d[k] != null ? d[k] : DEF[k]; };
    return (opts.titleClass ? '<div class="' + opts.titleClass + '">🏦 Phương án vay ngân hàng theo từng phương thức</div>' : '<h3>🏦 Phương án vay ngân hàng theo từng phương thức</h3>') +
      '<div class="nl-sub">Khoản vay lấy theo chính sách của phương thức đang chọn. Lãi suất bên dưới là <b>giả định</b>, anh/chị sửa theo mức ngân hàng báo.</div>' +
      '<div class="nl-grid">' +
      '<label>Lãi suất ưu đãi (%/năm)<input id="nl-r1" type="text" inputmode="decimal" value="' + v('r1') + '"></label>' +
      '<label>Thời gian ưu đãi (tháng)<input id="nl-m1" type="text" inputmode="numeric" value="' + v('m1') + '"></label>' +
      '<label>Lãi suất thả nổi (%/năm)<input id="nl-r2" type="text" inputmode="decimal" value="' + v('r2') + '"></label>' +
      '<label>Thời hạn vay (năm, tối đa 35)<input id="nl-term" type="text" inputmode="numeric" value="' + v('term') + '"></label>' +
      '<label>Cách trả nợ<select id="nl-method"><option value="annuity">Gốc + lãi chia đều</option><option value="equal">Gốc đều, lãi giảm dần</option></select></label>' +
      '<label>Ân hạn gốc (tháng)<input id="nl-grace" type="text" inputmode="numeric" placeholder="theo chính sách"></label>' +
      '<label>CĐT hỗ trợ lãi (%)<input id="nl-hpct" type="text" inputmode="decimal" placeholder="theo chính sách"></label>' +
      '<label>Số tháng được hỗ trợ lãi<input id="nl-hm" type="text" inputmode="numeric" placeholder="theo chính sách"></label>' +
      '<label>Vay thêm tại đợt bàn giao (% đợt, chỉ PT không có vay)<input id="nl-ho" type="text" inputmode="decimal" value="0"></label>' +
      '</div><div id="nl-out"></div>';
  }

  function mount(id, opts) {
    ensureCss();
    var el = document.getElementById(id);
    if (!el) return;
    state.opts = opts; state.mountEl = el;
    el.classList.add('nl');
    if (opts.theme) Object.keys(opts.theme).forEach(function (k) { el.style.setProperty('--nl-' + k, opts.theme[k]); });
    el.innerHTML = shell(opts);
    el.addEventListener('input', refresh);
    el.addEventListener('change', refresh);
  }

  function refresh() {
    if (!state.opts || !state.mountEl) return;
    var out = document.getElementById('nl-out');
    var ctx = state.opts.getCtx();
    if (!ctx) { state.mountEl.style.display = 'none'; return; }
    state.mountEl.style.display = 'block';
    out.innerHTML = body(ctx, readP(), false);
  }

  /* ---------- trang A4 trình bày ---------- */
  function printPdf(ctx, parts) {
    ensureCss();
    var P = readP(), m = methodById(ctx, ctx.sel), s = m ? sim(m, P) : null, br = ctx.brand || {};
    var pages = [];
    (parts.pages || []).forEach(function (p) { pages.push(p); });
    var cmpL = compareRows(ctx, P), cmpHtml = '<div class="nl-h">Tổng chi phí sở hữu = giá cuối + lãi khách tự trả (cùng giả định vay)</div>' + chartCompare(cmpL) + LEG + compareTable(cmpL);
    if (s) {
      pages.push(['Phương án vay ngân hàng: ' + m.name, body(ctx, P, true)]);
      pages.push(['Bảng trả nợ từng tháng · ' + m.name, '<div class="nl-h">Dư nợ gốc theo năm (đ)</div>' + chartBalance(s, 130) + '<div class="nl-h">30 tháng đầu của kỳ vay</div>' + monthTable(s, 30)]);
      pages.push(['Bảng trả nợ theo năm · ' + m.name, yearlyTable(s)]);
    } else {
      pages.push(['Phương án vay ngân hàng', body(ctx, P, true)]);
    }
    pages.push(['So sánh tổng chi phí giữa các phương thức', cmpHtml]);
    pages.push(['Lưu ý quan trọng', '<div class="nl-disc" style="border:0;font-size:12px">' + DISC + '</div><div class="nl-disc" style="border:0;font-size:12px">' + (parts.notes || 'Bảng tính chỉ mang tính tham khảo; giá và chính sách chính thức theo công bố của chủ đầu tư.') + '</div>' + (parts.contact || '')]);
    var total = pages.length, d = new Date(), ds = d.toLocaleDateString('vi-VN');
    var html = pages.map(function (p, i) {
      return '<section class="pg"><div class="pgh"><b>' + esc(br.project || '') + '</b><span>' + esc(br.unit || '') + ' · ' + ds + '</span></div><div class="pgt">' + esc(p[0]) + '</div>' + p[1] +
        '<div class="pgf"><span>' + esc(br.footer || '') + '</span><span>Trang ' + (i + 1) + '/' + total + '</span></div></section>';
    }).join('');
    var box = document.getElementById('nlPdf');
    if (!box) { box = document.createElement('div'); box.id = 'nlPdf'; document.body.appendChild(box); }
    box.innerHTML = html;
    document.body.classList.add('nl-pdfmode');
    var done = function () { document.body.classList.remove('nl-pdfmode'); box.innerHTML = ''; w.removeEventListener('afterprint', done); };
    w.addEventListener('afterprint', done);
    setTimeout(function () { w.print(); }, 60);
  }


  /* Trang PDF dùng chung cho các bảng tính cùng cấu trúc dòng (n,w,g,d,pct,pre,vat,tot,bank,own,tag).
     d = {kv:[[nhãn,giá trị]], extra:html, sel:index, title, methods:[{no,name,full,ck,D,S:{rows,total,ownTotal,bankTotal,ownPre,ownHand,ownPink}, cf}]} */
  function pc2(x) { return String(+(x * 100).toFixed(2)).replace('.', ',') + '%'; }
  function deckPages(d) {
    var M = d.methods, cur = M[d.sel], bank = cur.S.bankTotal > 0, cum = 0;
    var cover = '<div class="cov"><b>' + esc(d.heading) + '</b><span>' + esc(cur.full) + (d.client ? ' · Khách hàng: ' + esc(d.client) : '') + '</span></div>' +
      '<table style="margin-bottom:12px">' + d.kv.map(function (r) { return '<tr><td style="padding:6px 8px;border-bottom:1px solid #dee2e6;color:#6c757d;width:42%">' + esc(r[0]) + '</td><td style="padding:6px 8px;border-bottom:1px solid #dee2e6;font-weight:700;color:#0c2340">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' + (d.extra || '');
    var dash = function (v) { return v == null ? '–' : fm(v); };
    var sc = '<table class="nl-t"><thead><tr><th>Đợt</th><th>Mốc</th><th>Nội dung</th><th>%</th>' + (bank ? '<th>Vốn tự có (đ)</th><th>NH giải ngân (đ)</th>' : '<th>Trước VAT (đ)</th><th>VAT (đ)</th>') + '<th>Tổng đợt (đ)</th><th>Cộng dồn tự có (đ)</th></tr></thead><tbody>';
    cur.S.rows.forEach(function (x) {
      cum += x.own;
      sc += '<tr><td>' + esc(x.n) + '</td><td>' + esc(x.w) + (x.g ? ' <small>(' + esc(x.g) + ')</small>' : '') + '</td><td style="text-align:left">' + esc(x.d) + (x.tag ? ' <b>· ' + esc(x.tag) + '</b>' : '') + '</td><td>' + (x.pct == null ? '–' : pc2(x.pct)) + '</td>' +
        (bank ? '<td>' + (x.own ? fm(x.own) : '–') + '</td><td>' + (x.bank ? fm(x.bank) : '–') + '</td>' : '<td>' + dash(x.pre) + '</td><td>' + (x.vat ? fm(x.vat) : '–') + '</td>') + '<td>' + fm(x.tot) + '</td><td>' + fm(cum) + '</td></tr>';
    });
    sc += '<tr class="nl-tot"><td colspan="6">Tổng</td><td>' + fm(cur.S.total) + '</td><td>' + fm(cur.S.ownTotal) + '</td></tr></tbody></table>';
    var cmp = '<table class="nl-t"><thead><tr><th>Phương thức</th><th>Chiết khấu</th><th>Tổng giá bán (đ)</th><th>Tự có trước bàn giao (đ)</th><th>Đợt bàn giao (đ)</th><th>Sổ hồng / GCN (đ)</th><th>NH giải ngân (đ)</th></tr></thead><tbody>';
    M.forEach(function (m, i) {
      cmp += '<tr class="' + (i === d.sel ? 'nl-sel' : '') + '"><td>' + esc(m.no + ' · ' + m.name) + (i === d.sel ? ' ✓' : '') + '</td><td>' + esc(m.ck) + '</td><td><b>' + fm(m.D) + '</b></td><td>' + fm(m.S.ownPre) + '</td><td>' + fm(m.S.ownHand) + '</td><td>' + fm(m.S.ownPink) + '</td><td>' + (m.S.bankTotal ? fm(m.S.bankTotal) : '–') + '</td></tr>';
    });
    cmp += '</tbody></table>';
    return [['Báo giá căn hộ', cover], ['Lịch thanh toán · ' + cur.name, sc], ['So sánh các phương thức thanh toán', cmp]];
  }

  w.NATLoan = { deckPages: deckPages, mount: mount, refresh: refresh, printPdf: printPdf, sim: sim, readP: readP, _fm: fm, _fb: fb };
})(window);
