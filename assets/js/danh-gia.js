/* Tự đánh giá dự án — khung 2.0: hồ sơ nhu cầu + 27 thẻ · 6 chủ đề · 5 cấu phần (PROJECT_RULES §18).
   Khách chỉ tự chấm; trang không kết luận. Ý nghĩa ba màu chỉ giải thích ở màn tổng kết.
   Không thư viện ngoài, không theo dõi. Lưu tạm bằng localStorage trên máy người dùng.
   Công thức tính phải khớp functions/api/danh-gia.js. */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('dgData').textContent);
  var K = D.khung, DA = D.duAn || {}, BAN = D.duAnBan || {}, CONGBO = !!D.congBo;
  var THE = K.the, N = THE.length, TANG = ['logic', 'niem-tin', 'phu-hop'];
  var MAU = { 'phu-hop': '#10B981', 'niem-tin': '#F59E0B', logic: '#3B82F6' };
  var CD = {}; K.chuDe.forEach(function (c) { CD[c.id] = c.ten; });
  var app = document.getElementById('dgApp');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (x, d) { return x == null || isNaN(x) ? '–' : (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('vi-VN'); };
  var goalOf = function (id) { return K.mucTieu.filter(function (g) { return g.id === id; })[0] || null; };

  var DS = {};
  Object.keys(DA).forEach(function (k) { DS[k] = { ten: DA[k].ten, khuVuc: DA[k].khuVuc || (BAN[k] || {}).khuVuc || '', url: (BAN[k] || {}).url || '/cam-nang/' + k + '/', coDuKien: true }; });
  Object.keys(BAN).forEach(function (k) { if (!DS[k]) DS[k] = { ten: BAN[k].ten, khuVuc: BAN[k].khuVuc || '', url: BAN[k].url, coDuKien: false }; });
  var tenOf = function (k) { return DS[k] ? DS[k].ten : ''; };

  // ---------- trạng thái ----------
  function blank() {
    return { v: K.phienBan, duAn: '', ten: '', khac: false, hs: K.hoSo.map(function (q) { return q.kieu === 'nhieu' ? [] : null; }), muc: '',
      w: THE.map(function () { return 2; }), s: THE.map(function () { return null; }), bq: THE.map(function () { return false; }),
      tk: THE.map(function () { return { c: [], l: {}, v: '' }; }), mode: 'wiz', i: 0, view: 'chon', xemTu: false, sent: '', anDk: false, moDk: THE.map(function () { return false; }), tuChuyen: true };
  }
  var st = blank();
  var LS = 'dg-danh-gia-v2';
  function save() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) {} }
  function load() {
    try { var o = JSON.parse(localStorage.getItem(LS) || 'null'); if (o && o.v === K.phienBan && o.w && o.w.length === N) st = Object.assign(blank(), o); } catch (e) {}
    var p = new URLSearchParams(location.search).get('du-an');
    if (p && DS[p] && st.duAn !== p) { var hs = st.hs, muc = st.muc; st = blank(); st.duAn = p; st.ten = tenOf(p); st.hs = hs; st.muc = muc; if (muc) applyGoal(); }
    var h = location.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
    if (h) { try { var o2 = decodeState(h[1]); if (o2) { st = Object.assign(blank(), o2); st.view = 'kq'; } } catch (e) {} }
    if (st.view !== 'chon' && !ready()) st.view = 'chon';
    if (st.view === 'kq' && !hsReady()) st.view = 'hs';
  }
  function ready() { return !!st.muc && (!!st.duAn || !!String(st.ten).trim()); }
  // Hồ sơ cá nhân ở cuối: câu nào hỏi tùy nhu cầu đã chọn ở bước đầu (apDung)
  function apDung(q) { return !!q.dau || (q.apDung || []).indexOf(st.muc) !== -1; }
  function hsReady() { return K.hoSo.every(function (q, i) { return q.dau || !apDung(q) || q.batBuoc === false || st.hs[i] != null; }); }
  function applyGoal() { st.w = THE.map(function (c) { return c.w[st.muc] || 2; }); }
  function encodeState() {
    var o = { v: K.phienBan, d: st.duAn, t: st.duAn ? '' : st.ten, h: st.hs, w: st.w.join(''),
      s: THE.map(function (c, i) { return st.bq[i] ? 'x' : st.s[i] || 0; }).join('') };
    return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeState(t) {
    var o = JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))));
    if (!o || o.v !== K.phienBan || String(o.w).length !== N) return null;
    var r = blank();
    r.duAn = DS[o.d] ? o.d : ''; r.ten = r.duAn ? tenOf(r.duAn) : String(o.t || '').slice(0, 80); r.khac = !r.duAn;
    var hin = Array.isArray(o.h) ? o.h : [];
    r.hs = K.hoSo.map(function (q, i) {
      var x = hin[i], ok = function (n) { return Number.isInteger(n) && n >= 0 && n < q.luaChon.length; };
      return q.kieu === 'nhieu' ? (Array.isArray(x) ? x.filter(ok).slice(0, q.toiDa || q.luaChon.length) : []) : (ok(x) ? x : null);
    });
    if (r.hs[0] != null) r.muc = K.hoSo[0].nhuCau[r.hs[0]];
    r.w = String(o.w).split('').map(function (x) { return Math.max(1, Math.min(3, +x || 2)); });
    var s = String(o.s).split('');
    r.s = s.map(function (x) { x = +x; return x >= 1 && x <= 5 ? x : null; }); r.bq = s.map(function (x) { return x === 'x'; });
    return r;
  }

  // ---------- tính điểm (khớp phía máy chủ) ----------
  function chuyenGia(k) {
    var p = DA[k == null ? st.duAn : k]; if (!p || !p.chuyenGia) return null;
    if (!p.chuyenGia.duyet && CONGBO) return null;
    if (!p.chuyenGia.the || !Object.keys(p.chuyenGia.the).length) return null;
    return p.chuyenGia;
  }
  // Điểm trên một tập thẻ: s là mảng điểm (null = không tính)
  function tinh(w, s, loc) {
    var a = 0, b = 0, done = 0;
    THE.forEach(function (c, i) { if (s[i] == null || (loc && !loc(c, i))) return; done++; a += w[i] * s[i]; b += w[i] * 5; });
    return { done: done, pct: b ? a / b * 100 : null };
  }
  function tongHop(w, s) {
    var r = { tong: tinh(w, s), o: tinh(w, s, function (c) { return c.role !== 'invest'; }), dt: tinh(w, s, function (c) { return c.role !== 'live'; }), tang: {} };
    TANG.forEach(function (t) {
      var ws = 0, n = 0; THE.forEach(function (c, i) { if (c.tang === t) { ws += w[i]; n++; } });
      r.tang[t] = { pct: tinh(w, s, function (c) { return c.tang === t; }).pct, wtb: n ? ws / n : 0 };
    });
    return r;
  }
  function diemTu(cg) { return THE.map(function (c) { var e = cg && cg.the[c.id]; return e ? e.s : null; }); }

  // ---------- giao diện ----------
  function seg(cls, items, cur, attr) {
    return '<div class="dg-seg ' + (cls || '') + '" role="group">' + items.map(function (it) {
      return '<button type="button" ' + attr + '="' + esc(it.v) + '" aria-pressed="' + (String(it.v) === String(cur)) + '">' + it.h + '</button>';
    }).join('') + '</div>';
  }
  function trongSoTom() {
    var g = goalOf(st.muc); if (!g) return '';
    var up = THE.filter(function (c) { return c.w[g.id] > 2; }), dn = THE.filter(function (c) { return c.w[g.id] < 2; });
    var li = function (arr) { return arr.map(function (c) { return '<li><i class="dg-sw" style="--m:' + MAU[c.tang] + '"></i><b>' + c.id + '</b> ' + esc(c.ten) + ' — <span class="dg-hint">' + esc(c.lyDo[g.id]) + '</span></li>'; }).join(''); };
    return '<details class="dg-wt"><summary>Nhu cầu “' + esc(g.nhan) + '”: ' + up.length + ' câu nâng lên x3, ' + dn.length + ' câu hạ xuống x1, còn lại giữ x2 — xem lý do</summary>' +
      '<p class="dg-hint">' + esc(K.ghiChuTrongSo) + '</p><p style="margin:8px 0 4px"><span class="dg-up">▲ Nâng lên x3</span></p><ul class="dg-ul">' + li(up) + '</ul>' +
      (dn.length ? '<p style="margin:8px 0 4px"><span class="dg-down">▼ Hạ xuống x1</span></p><ul class="dg-ul">' + li(dn) + '</ul>' : '') + '</details>';
  }
  function chonHtml() {
    var list = Object.keys(DS);
    if (st.view !== 'chon') return '<section class="dg-box dg-setup" style="padding:14px 20px"><p style="margin:0">Đang đánh giá <b>' + esc(st.ten) + '</b> · nhu cầu <b>' + esc(goalOf(st.muc).nhan) + '</b> <button type="button" class="dg-btn ghost" data-view="chon" style="padding:5px 12px;font-size:13px;margin-left:8px">Đổi</button> <button type="button" class="dg-btn ghost" data-lamlai style="padding:5px 12px;font-size:13px">Làm lại từ đầu</button></p></section>';
    var opts = '<option value="">— Chọn dự án —</option>' + list.map(function (k) { return '<option value="' + esc(k) + '"' + (st.duAn === k ? ' selected' : '') + '>' + esc(DS[k].ten) + (DS[k].khuVuc ? ' · ' + esc(DS[k].khuVuc) : '') + '</option>'; }).join('') +
      '<option value="_khac"' + (!st.duAn && (st.khac || st.ten) ? ' selected' : '') + '>Dự án khác (tự nhập tên)</option>';
    var p = DS[st.duAn];
    return '<section class="dg-box dg-setup"><p class="dg-kick" style="margin:0">Bước đầu</p><h2>Chọn dự án và nhu cầu</h2>' +
      '<label class="dg-l" for="dgDuAn">Dự án bạn muốn đánh giá</label><select id="dgDuAn">' + opts + '</select>' +
      '<input type="text" id="dgTen" maxlength="80" placeholder="Tên dự án" value="' + esc(st.duAn ? '' : st.ten) + '"' + (st.duAn || !(st.khac || st.ten) ? ' hidden' : '') + ' style="margin-top:8px">' +
      (p ? '<p class="dg-hint" style="margin:6px 0 0">' + (p.coDuKien ? 'Dự án này có sẵn dữ kiện tham khảo cho nhiều câu hỏi.' : 'Dữ kiện riêng cho dự án này đang được chuẩn bị; mỗi thẻ gợi ý những dữ kiện bạn nên tự tìm.') + '</p>' : '') +
      '<label class="dg-l">' + esc(K.hoSo[0].hoi) + ' — quyết định trọng số gợi ý cho từng thẻ và các câu hỏi cá nhân ở cuối</label>' + hsBtns(0) + trongSoTom() +
      '<label class="dg-l">Dữ kiện tham khảo</label><div class="dg-seg dg-hs" role="group"><button type="button" data-andk-set="0" aria-pressed="' + !st.anDk + '">Hiện dữ kiện ở mỗi thẻ</button><button type="button" data-andk-set="1" aria-pressed="' + st.anDk + '">Ẩn — tôi tự đánh giá trước</button></div>' +
      '<p class="dg-hint" style="margin:6px 0 0">' + esc(K.ghiChuDuKien || '') + ' Bạn đổi lại được bất cứ lúc nào.</p>' +
      '<p style="margin:18px 0 0"><button type="button" class="dg-btn" data-start' + (ready() ? '' : ' disabled') + '>Bắt đầu chấm ' + N + ' thẻ ›</button> <span class="dg-hint">' + (ready() ? 'Khoảng 20 phút. Thẻ nào chưa đủ dữ kiện, bạn bỏ qua được.' : 'Chọn dự án và nhu cầu để bắt đầu.') + '</span></p></section>';
  }
  // Lựa chọn thiên kiến: thẻ theoDuAn lấy lựa chọn từ dữ kiện của dự án (vd. chính sách bán hàng thực tế)
  function luaChonCua(c) { var pc = DA[st.duAn] && DA[st.duAn].the && DA[st.duAn].the[c.id]; return c.thienKien.theoDuAn && pc && pc.luaChon && pc.luaChon.length ? pc.luaChon : c.thienKien.luaChon; }
  function hsBtns(qi) {
    var q = K.hoSo[qi], multi = q.kieu === 'nhieu', cur = st.hs[qi];
    return '<div class="dg-seg dg-hs" role="group">' + q.luaChon.map(function (l, li) {
      var on = multi ? cur.indexOf(li) !== -1 : cur === li;
      return '<button type="button" data-hs="' + qi + '" data-v="' + li + '" aria-pressed="' + on + '">' + (multi ? (on ? '☑ ' : '☐ ') : '') + esc(l) + '</button>';
    }).join('') + '</div>';
  }
  function hsHtml() {
    var g = goalOf(st.muc);
    return '<section class="dg-box" id="dgHs"><p class="dg-kick" style="margin:0">Bước cuối · hồ sơ cá nhân</p><h2>Điều kiện riêng của bạn</h2>' +
      '<p style="margin:0;color:var(--text-2)">Vài câu về hoàn cảnh của bạn với nhu cầu “' + esc(g ? g.nhan : '') + '”. Phần này không chấm điểm và không có trong bản đánh giá của Tú.</p>' +
      K.nhomHoSo.map(function (nh) {
        var qs = K.hoSo.map(function (q, qi) { return q.nhom === nh.id && apDung(q) ? qi : -1; }).filter(function (x) { return x >= 0; });
        if (!qs.length) return '';
        return '<h3 class="dg-hsn">' + esc(nh.ten) + '</h3>' + qs.map(function (qi) {
          var q = K.hoSo[qi];
          return '<label class="dg-l">' + esc(q.hoi) + (q.batBuoc === false ? ' <span class="dg-hint">(không bắt buộc' + (q.kieu === 'nhieu' ? ', chọn nhiều' : '') + ')</span>' : '') + '</label>' + hsBtns(qi);
        }).join('');
      }).join('') +
      '<p style="margin:18px 0 0" class="dg-noprint"><button type="button" class="dg-btn ghost" data-go="' + (N - 1) + '">‹ Quay lại thẻ</button> <button type="button" class="dg-btn" data-view="kq"' + (hsReady() ? '' : ' disabled') + '>Xem tổng kết ›</button> <span class="dg-hint">' + (hsReady() ? '' : 'Trả lời các câu bắt buộc để xem tổng kết.') + '</span></p></section>';
  }
  function thienKienHtml(c, i) {
    var tk = st.tk[i], k = { kieu: c.thienKien.kieu, luaChon: luaChonCua(c) };
    if (k.kieu === 'viet' || !k.luaChon.length) return '<textarea data-tv="' + i + '" maxlength="800" placeholder="Nhận định của bạn, hoặc dữ kiện bạn tự tìm thêm.">' + esc(tk.v) + '</textarea><div class="dg-print-note">' + esc(tk.v) + '</div>';
    return '<p class="dg-hint" style="margin:0 0 6px">' + (k.kieu === 'nhieu' ? 'Chọn một hoặc nhiều' : 'Chọn một') + ', rồi ghi ngắn vì sao.</p><div class="dg-opts">' + k.luaChon.map(function (l, li) {
      var on = tk.c.indexOf(li) !== -1;
      return '<div class="dg-opt' + (on ? ' on' : '') + '"><button type="button" data-tk="' + i + '" data-v="' + li + '" aria-pressed="' + on + '"><span class="bx">' + (k.kieu === 'nhieu' ? (on ? '☑' : '☐') : (on ? '◉' : '○')) + '</span>' + esc(l) + '</button>' +
        (on ? '<input type="text" data-tl="' + i + '" data-v="' + li + '" maxlength="300" placeholder="Vì sao bạn chọn?" value="' + esc(tk.l[li] || '') + '"><div class="dg-print-note">' + esc(tk.l[li] || '') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function cardHtml(c, i) {
    var p = DA[st.duAn], pc = p && p.the && p.the[c.id];
    var facts = pc && pc.duKien ? pc.duKien : c.duKien, links = pc && pc.lienKet ? pc.lienKet : [];
    var g = goalOf(st.muc), gw = g ? c.w[g.id] : 2;
    var note = g ? '<p class="dg-hint" style="margin:8px 0 0">Theo nhu cầu “' + esc(g.nhan) + '”: gợi ý <b>x' + gw + '</b>' + (gw > 2 ? ' (nâng)' : gw < 2 ? ' (hạ)' : '') + ' — ' + esc(c.lyDo[g.id]) + (st.w[i] !== gw ? ' <b>Bạn đã chỉnh thành x' + st.w[i] + '.</b>' : '') + '</p>' : '';
    var first = i === 0 || THE[i - 1].chuDe !== c.chuDe;
    return (st.mode === 'list' && first ? '<h2 class="dg-cd">' + c.chuDe + ' · ' + esc(CD[c.chuDe]) + '</h2>' : '') +
      '<article class="dg-card' + (st.mode === 'wiz' && st.i === i ? ' on' : '') + '" id="the-' + c.id + '" data-i="' + i + '" data-tang="' + c.tang + '">' +
      '<div class="dg-strip"></div><header><span>THẺ ' + c.id + ' · ' + esc(CD[c.chuDe]).toUpperCase() + ' · ' + (i + 1) + '/' + N + '</span><h2>' + esc(c.ten) + '</h2></header>' +
      '<section class="dg-step q"><b>1 · Vấn đề đặt ra</b><p>' + esc(c.vanDe) + '</p></section>' +
      '<section class="dg-step"><b>2 · Dữ kiện tham khảo</b>' + (st.anDk && !st.moDk[i] ?
        '<div class="dg-facts dg-off"><p style="margin:0">Dữ kiện đang ẩn để bạn tự đánh giá theo hiểu biết của mình.</p><p style="margin:6px 0 0"><button type="button" class="dg-skip" data-modk="' + i + '">Xem dữ kiện cho thẻ này</button></p></div>' :
        '<div class="dg-facts"><ul>' + facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
        (links.length ? '<p class="dg-src">' + links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.nhan) + ' ↗</a>'; }).join(' · ') + '</p>' : '') +
        '<p class="dg-src">' + (pc ? 'Nguồn: ' + esc(p.capNhat) + '. ' : 'Danh mục dữ kiện liên quan — chưa có số liệu riêng cho dự án này. ') + esc(K.ghiChuDuKien || '') + '</p></div>') + '</section>' +
      '<section class="dg-step"><b>3 · Mức độ quan trọng với tôi</b>' + seg('', K.trongSo.map(function (t) { return { v: t.w, h: '<b>x' + t.w + '</b>' + esc(t.nhan) }; }), st.w[i], 'data-w="' + i + '" data-v') + note + '</section>' +
      '<section class="dg-step"><b>4 · Nhận định của tôi</b>' + thienKienHtml(c, i) + '</section>' +
      '<section class="dg-step"><b>5 · Mức độ hài lòng với dự án</b>' + seg('', K.diem.map(function (t) { return { v: t.s, h: '<b>' + t.s + '</b>' + esc(t.nhan) }; }), st.s[i], 'data-s="' + i + '" data-v') +
        '<p style="margin:8px 0 0"><button type="button" class="dg-skip" data-bq="' + i + '" aria-pressed="' + st.bq[i] + '">' + (st.bq[i] ? '✓ Đã bỏ qua — chưa đủ dữ kiện' : 'Chưa đủ dữ kiện — bỏ qua thẻ này') + '</button></p></section>' +
      '<div class="dg-nav">' + (i > 0 ? '<button type="button" class="dg-btn ghost" data-go="' + (i - 1) + '">‹ Thẻ trước</button>' : '<span></span>') +
        (i < N - 1 ? '<button type="button" class="dg-btn" data-go="' + (i + 1) + '">Thẻ tiếp ›</button>' : '<button type="button" class="dg-btn" data-view="hs">Tiếp: hồ sơ cá nhân ›</button>') + '</div></article>';
  }
  function soDaCham() { return st.s.filter(function (x) { return x != null; }).length; }
  function barHtml() {
    if (st.view === 'chon') return '';
    var cur = THE[st.i] ? THE[st.i].chuDe : '';
    return '<div class="dg-bar dg-noprint"><div class="dg-cds">' + K.chuDe.map(function (cd) {
      var idx = THE.map(function (c, i) { return c.chuDe === cd.id ? i : -1; }).filter(function (i) { return i >= 0; });
      var ok = idx.filter(function (i) { return st.s[i] != null || st.bq[i]; }).length;
      return '<button type="button" data-go="' + idx[0] + '" title="' + esc(cd.ten) + '"' + (st.view === 'the' && cur === cd.id ? ' aria-current="true"' : '') + '><b>' + cd.id + '</b> ' + ok + '/' + idx.length + '</button>';
    }).join('') + '</div><div class="dg-mode">' +
      '<button type="button" data-mode="wiz" aria-pressed="' + (st.view === 'the' && st.mode === 'wiz') + '">Từng thẻ</button>' +
      '<button type="button" data-mode="list" aria-pressed="' + (st.view === 'the' && st.mode === 'list') + '">Toàn bộ</button>' +
      '<button type="button" data-view="hs" aria-pressed="' + (st.view === 'hs') + '">Hồ sơ</button>' +
      '<button type="button" data-view="kq" aria-pressed="' + (st.view === 'kq') + '">Tổng kết</button></div>' +
      '<div class="dg-opts2"><button type="button" class="dg-sw2" data-andk aria-pressed="' + !st.anDk + '"><i></i>Dữ kiện tham khảo</button>' +
      (st.mode === 'wiz' ? '<button type="button" class="dg-sw2" data-tuchuyen aria-pressed="' + st.tuChuyen + '"><i></i>Tự sang thẻ sau khi chấm</button>' : '') +
      '<span class="dg-hint">' + conLai() + '</span>' + (st.mode === 'wiz' ? '<span class="dg-hint dg-kb">Phím 1–5 để chấm · ← → chuyển thẻ</span>' : '') + '</div>' +
      '<div class="dg-prog"><i style="width:' + (soDaCham() / N * 100) + '%"></i></div></div>';
  }
  function confirmLamLai() { return soDaCham() === 0 || window.confirm('Xóa điểm đã chấm và làm lại từ đầu?'); }
  function conLai() {
    var left = THE.filter(function (c, i) { return st.s[i] == null && !st.bq[i]; }).length;
    return left ? 'Còn ' + left + ' thẻ · khoảng ' + Math.max(1, Math.round(left * 0.6)) + ' phút' : 'Đã chấm xong ' + N + ' thẻ';
  }
  function toast(msg) {
    var el = document.getElementById('dgToast');
    if (!el) { el = document.createElement('div'); el.id = 'dgToast'; el.className = 'dg-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }
  function xongChuDe(i) {
    var cd = THE[i].chuDe, idx = THE.map(function (c, j) { return c.chuDe === cd ? j : -1; }).filter(function (j) { return j >= 0; });
    return idx.every(function (j) { return st.s[j] != null || st.bq[j]; });
  }
  function sauKhiCham(i, cdTruoc) {
    if (!cdTruoc && xongChuDe(i)) toast('Xong chủ đề ' + THE[i].chuDe + ' · ' + CD[THE[i].chuDe] + '. ' + conLai() + '.');
    if (st.mode === 'wiz' && st.tuChuyen && st.view === 'the' && st.i === i) setTimeout(function () { if (st.i !== i || st.view !== 'the') return; if (i < N - 1) go(i + 1); else { st.view = 'hs'; save(); render(); scrollTo('dgHs'); } }, 450);
  }
  function meter(lbl, v, sub) { return '<div class="dg-meter"><div><span>' + lbl + '</span><b>' + fmt(v) + '%</b></div><i><em style="width:' + (v || 0) + '%"></em></i>' + (sub ? '<span class="dg-hint">' + sub + '</span>' : '') + '</div>'; }
  // Một biểu đồ cho mỗi màu: thanh điểm hài lòng từng thẻ; thanh mảnh màu kem là điểm của Tú khi đã mở
  function tangChart(t, r, ts, rt) {
    var tg = K.tang[t];
    var rows = THE.map(function (c, i) {
      if (c.tang !== t) return '';
      var s = st.s[i], e = ts ? ts[i] : null;
      return '<div class="dg-row"><span class="lb"><b>' + c.id + '</b> ' + esc(c.ten) + ' <em>x' + st.w[i] + '</em></span><span class="tr">' +
        '<i class="me" style="--m:' + MAU[t] + ';width:' + (s ? s / 5 * 100 : 0) + '%"></i>' + (e != null ? '<i class="tu" style="width:' + (e / 5 * 100) + '%"></i>' : '') +
        '</span><span class="vl">' + (s || (st.bq[i] ? '<small>bỏ qua</small>' : '–')) + (e != null ? '<small> · Tú ' + fmt(e, 1) + '</small>' : '') + '</span></div>';
    }).join('');
    return '<div class="dg-tchart" data-tang="' + t + '"><div class="dg-th"><span class="dg-sw" style="--m:' + MAU[t] + ';width:14px;height:14px"></span><div><h3>' + esc(tg.ten) + '</h3><p>' + esc(tg.yNghia) + '</p></div>' +
      '<div class="dg-tk"><b>' + fmt(r.tang[t].pct) + '%</b><span>mức hài lòng</span>' + (rt ? '<b class="tu">' + fmt(rt.tang[t].pct) + '%</b><span>của Tú</span>' : '') + '<b>x' + fmt(r.tang[t].wtb, 1) + '</b><span>quan trọng TB</span></div></div>' +
      rows + '<div class="dg-row dg-axis"><span class="lb"></span><span class="tr"><b style="left:0">0</b><b style="left:20%">1</b><b style="left:40%">2</b><b style="left:60%">3</b><b style="left:80%">4</b><b style="left:100%">5</b></span><span class="vl"></span></div></div>';
  }
  function tuongTuHtml() {
    var cur = st.duAn, mine = DS[cur] || {};
    var ks = Object.keys(DS).filter(function (k) { return k !== cur; });
    var sc = function (k) { return (DS[k].khuVuc && DS[k].khuVuc === mine.khuVuc ? 2 : 0) + (chuyenGia(k) ? 1 : 0); };
    ks.sort(function (a, b) { return sc(b) - sc(a); }); ks = ks.slice(0, 4);
    if (!ks.length) return '';
    return '<h3 class="dg-h3">Dự án tương tự để tự đánh giá thêm</h3><div class="dg-sim">' + ks.map(function (k) {
      var d = DS[k];
      return '<div class="dg-simc"><b>' + esc(d.ten) + '</b><span class="dg-hint">' + esc(d.khuVuc || '') + '</span><span class="dg-hint">' + (chuyenGia(k) ? 'Có bản đánh giá của Tú' : 'Bản đánh giá của Tú đang chuẩn bị') + '</span>' +
        '<span><a href="?du-an=' + esc(k) + '" data-sim="' + esc(k) + '">Tự đánh giá ›</a>' + (d.url ? ' · <a href="' + esc(d.url) + '" target="_blank" rel="noopener">Hồ sơ dự án ↗</a>' : '') + '</span></div>';
    }).join('') + '</div><p class="dg-hint">Hồ sơ nhu cầu của bạn được giữ lại khi chuyển sang dự án khác.</p>';
  }
  function resultHtml() {
    var r = tongHop(st.w, st.s), cg = chuyenGia(), done = r.tong.done, nbq = st.bq.filter(Boolean).length;
    var mo = done >= K.nguong.moTu, showTu = mo && st.xemTu && cg;
    var ts = showTu ? diemTu(cg) : null;
    // So cùng tập thẻ: chỉ các thẻ cả bạn và Tú đều chấm; Tú dùng trọng số của bạn (đặt Tú vào trường hợp của bạn)
    var both = ts ? THE.map(function (c, i) { return st.s[i] != null && ts[i] != null; }) : null;
    var rt = ts ? tongHop(st.w, ts.map(function (x, i) { return both[i] ? x : null; })) : null;
    var rb = ts ? tongHop(st.w, st.s.map(function (x, i) { return both[i] ? x : null; })) : null;
    var h = '<section class="dg-box dg-res" id="ketQua"><p class="dg-kick">Tổng kết</p><h2>' + esc(st.ten || 'Dự án') + '</h2>';
    if (done + nbq < N) h += '<p class="dg-nhap">Còn ' + (N - done - nbq) + ' thẻ chưa chấm. <a href="#" data-go="' + firstOpen() + '" style="color:var(--brand)">Chấm tiếp ›</a></p>';
    h += '<div class="dg-hero"><div class="dg-big">' + fmt(r.tong.pct) + '<small>%</small></div><div><p style="margin:0">Mức dự án đáp ứng những điều bạn coi trọng, theo chính điểm bạn chấm.</p><p class="dg-hint" style="margin:4px 0 0">' + done + ' thẻ đã chấm' + (nbq ? ' · ' + nbq + ' thẻ bỏ qua' : '') + ' · = Σ(trọng số × hài lòng) ÷ Σ(trọng số × 5)</p></div></div>' +
      meter('Giá trị sử dụng · ở thực', r.o.pct) + meter('Giá trị tăng trưởng · đầu tư', r.dt.pct);
    h += '<h3 class="dg-h3">Ba màu trong bộ thẻ</h3><p style="margin:0 0 6px;color:var(--text-2)">' + esc(K.yNghiaMau) + ' Mỗi màu có biểu đồ riêng, tính trên các thẻ cùng màu.</p>' +
      TANG.map(function (t) { return tangChart(t, r, ts, rt); }).join('') + (ts ? '<p class="dg-hint"><i class="dg-sw" style="--m:#e9e4da"></i>Thanh mảnh màu kem: điểm của Tú.</p>' : '');
    h += '<div class="dg-tu">';
    if (!cg) h += '<p class="dg-hint" style="margin:18px 0 0">Bản đánh giá chi tiết của Tú cho dự án này đang được hoàn thiện. Bạn vẫn nhận được bản của mình, và sẽ so được khi bản của Tú có.</p>';
    else if (!mo) h += '<p style="margin:18px 0 0"><button type="button" class="dg-btn" disabled>Xem đánh giá của Tú</button> <span class="dg-hint">Chấm ít nhất ' + K.nguong.moTu + ' thẻ để mở (bạn đã chấm ' + done + ').</span></p>';
    else if (!st.xemTu) h += '<p style="margin:18px 0 0"><button type="button" class="dg-btn" data-xemtu>Xem đánh giá của Tú để so sánh ›</button></p>';
    else {
      h += '<h3 class="dg-h3">Đánh giá của Tú, đặt vào trường hợp của bạn</h3>' + (!cg.duyet ? '<p class="dg-nhap">Bản nháp — chờ Tú duyệt. ' + esc(cg.nguon) + '</p>' : '') +
        '<p style="margin:0 0 8px;color:var(--text-2)">Điểm hài lòng là của Tú; trọng số là của bạn, nên điểm của Tú đã tính theo hồ sơ nhu cầu của bạn. Hai bên so trên ' + rb.tong.done + ' thẻ cả hai cùng chấm.</p>' +
        '<div class="dg-kpi"><div><b>' + fmt(rb.tong.pct) + '%</b><span>của bạn</span></div><div><b>' + fmt(rt.tong.pct) + '%</b><span>của Tú</span></div></div>' +
        '<table class="dg-tbl"><thead><tr><th>Thẻ</th><th>Bạn</th><th>Tú</th><th>Nhận xét của Tú</th></tr></thead><tbody>' + THE.map(function (c, i) {
          var e = cg.the[c.id]; if (!e) return '';
          return '<tr><td><i class="dg-sw" style="--m:' + MAU[c.tang] + '"></i><b>' + c.id + '</b> ' + esc(c.ten) + '</td><td class="n">' + (st.s[i] || (st.bq[i] ? 'bỏ qua' : '–')) + '</td><td class="n">' + fmt(e.s, 1) + '</td><td class="note">' + esc(e.nx) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    h += '</div>' + tuongTuHtml();
    h += '<div class="dg-noprint" style="margin-top:14px"><button type="button" class="dg-btn ghost" data-view="the">‹ Quay lại sửa thẻ</button></div></section>';
    return h + formHtml(done >= K.nguong.moTu) + '<p class="dg-hint">' + esc(K.tuChoi) + '</p>';
  }
  function firstOpen() { for (var i = 0; i < N; i++) if (st.s[i] == null && !st.bq[i]) return i; return 0; }
  function formHtml(ok) {
    return '<section class="dg-box dg-form' + (st.sent ? ' dg-unlocked' : '') + '" id="dgForm"><h2>Nhận bản đánh giá của bạn</h2>' +
      '<p style="margin:0;color:var(--text-2)">Gồm điểm và nhận định từng thẻ, ba biểu đồ' + (chuyenGia() ? ' và bản đánh giá của Tú' : '') + '. Nhận qua email ngay, hoặc Tú gửi qua Zalo. Sau khi gửi, bạn tải được bản PDF.</p>' +
      (ok ? '' : '<p class="dg-msg err">Hãy chấm ít nhất ' + K.nguong.moTu + ' thẻ trước khi nhận bản đánh giá.</p>') +
      '<form novalidate' + (st.sent ? ' hidden' : '') + '><div class="row"><div><label class="dg-l" for="fName">Họ tên</label><input type="text" id="fName" name="name" maxlength="80" autocomplete="name" required></div>' +
      '<div><label class="dg-l" for="fPhone">Số điện thoại / Zalo</label><input type="tel" id="fPhone" name="phone" maxlength="20" autocomplete="tel" required></div></div>' +
      '<label class="dg-l">Nhận qua</label>' + seg('', [{ v: 'email', h: '<b>Email</b>gửi tự động ngay' }, { v: 'zalo', h: '<b>Zalo</b>Tú gửi trực tiếp' }], 'email', 'data-ch') +
      '<label class="dg-l" for="fEmail">Email</label><input type="email" id="fEmail" name="email" maxlength="120" autocomplete="email">' +
      '<input class="dg-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="ck"><input type="checkbox" name="consent"> <span>Tôi đồng ý để Nguyễn Anh Tú lưu và dùng thông tin này để gửi bản đánh giá, tư vấn và giới thiệu dự án phù hợp, theo <a href="/chinh-sach-bao-mat/" target="_blank" style="color:var(--brand)">chính sách bảo mật</a>.</span></label>' +
      '<button class="dg-btn" type="submit"' + (ok ? '' : ' disabled') + '>Gửi cho tôi bản đánh giá</button><p class="dg-msg" role="status"></p></form>' +
      '<div class="dg-done"><p class="dg-msg ok">Đã nhận. ' + (st.sent === 'zalo' ? 'Tú sẽ gửi bản đánh giá cho bạn qua Zalo sớm nhất.' : 'Bản đánh giá đang trên đường tới hộp thư của bạn.') + '</p>' +
      '<button type="button" class="dg-btn" id="dgPdf">Tải bản PDF</button> <button type="button" class="dg-btn ghost" id="dgCopy">Sao chép liên kết kết quả</button></div></section>';
  }
  function render() {
    var cards = st.view === 'chon' ? '' : '<div class="' + (st.mode === 'wiz' ? 'dg-wiz' : 'dg-list') + '" id="dgCards"' + (st.view !== 'the' ? ' hidden' : '') + '>' + THE.map(cardHtml).join('') + '</div>';
    var hs = st.view === 'chon' ? '' : '<div id="dgHsW"' + (st.view === 'hs' ? '' : ' hidden') + '>' + hsHtml() + '</div>';
    var res = st.view === 'chon' || !hsReady() ? '' : '<div id="dgRes"' + (st.view === 'kq' ? '' : ' hidden') + '>' + resultHtml() + '</div>';
    app.innerHTML = chonHtml() + barHtml() + cards + hs + res;
  }
  function softUpdate() {
    var bar = app.querySelector('.dg-bar'); if (bar) bar.outerHTML = barHtml();
    var res = document.getElementById('dgRes'); if (res) res.innerHTML = resultHtml();
  }
  function redrawCard(i) { var el = document.getElementById('the-' + THE[i].id); if (el) el.outerHTML = cardHtml(THE[i], i); }

  // ---------- sự kiện ----------
  function scrollTo(id) { var el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function go(i) { st.view = 'the'; st.i = Math.max(0, Math.min(N - 1, i)); save(); render(); scrollTo('the-' + THE[st.i].id); }
  app.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    var d = t.dataset;
    if (d.sim) { e.preventDefault(); var hs = st.hs, muc = st.muc; st = blank(); st.duAn = d.sim; st.ten = tenOf(d.sim); st.hs = hs; st.muc = muc; if (muc) applyGoal(); save(); history.replaceState(null, '', '?du-an=' + d.sim); render(); scrollTo('dg'); return; }
    if (d.go != null) { e.preventDefault(); go(+d.go); return; }
    if (d.start != null) { if (ready()) { st.view = 'the'; st.i = 0; save(); render(); scrollTo('the-' + THE[0].id); } return; }
    if (d.mode) { st.mode = d.mode; st.view = 'the'; save(); render(); return; }
    if (d.view) { if (d.view !== 'chon' && !ready()) return; st.view = d.view === 'kq' && !hsReady() ? 'hs' : d.view; save(); render(); scrollTo(st.view === 'kq' ? 'ketQua' : st.view === 'hs' ? 'dgHs' : st.view === 'chon' ? 'dg' : 'dgCards'); return; }
    if (d.hs != null) {
      var qi = +d.hs, q = K.hoSo[qi], v = +d.v;
      if (q.kieu === 'nhieu') { var arr = st.hs[qi], at = arr.indexOf(v); if (at !== -1) arr.splice(at, 1); else if (arr.length < (q.toiDa || q.luaChon.length)) arr.push(v); }
      else { st.hs[qi] = v; if (qi === 0) { st.muc = q.nhuCau[v]; applyGoal(); } }
      var y = window.scrollY; save(); render(); window.scrollTo(0, y); return;
    }
    if (d.xemtu != null) { st.xemTu = true; save(); softUpdate(); var tu = app.querySelector('.dg-tu'); if (tu) tu.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (d.w != null && t.closest('.dg-seg')) { st.w[+d.w] = +d.v; save(); redrawCard(+d.w); softUpdate(); return; }
    if (d.s != null && t.closest('.dg-seg')) { var si = +d.s, xt = xongChuDe(si), moi = st.s[si] == null; st.s[si] = +d.v; st.bq[si] = false; save(); redrawCard(si); softUpdate(); if (moi) sauKhiCham(si, xt); return; }
    if (d.bq != null) { var bi = +d.bq, xb = xongChuDe(bi); st.bq[bi] = !st.bq[bi]; if (st.bq[bi]) st.s[bi] = null; save(); redrawCard(bi); softUpdate(); if (st.bq[bi]) sauKhiCham(bi, xb); return; }
    if (d.andkSet != null) { st.anDk = d.andkSet === '1'; save(); var yy = window.scrollY; render(); window.scrollTo(0, yy); return; }
    if (d.lamlai != null) { if (confirmLamLai()) { var du = st.duAn, te = st.ten; st = blank(); st.duAn = du; st.ten = te; save(); render(); scrollTo('dg'); } return; }
    if (d.andk != null) { st.anDk = !st.anDk; save(); var y = window.scrollY; render(); window.scrollTo(0, y); toast(st.anDk ? 'Đã ẩn dữ kiện tham khảo — bạn tự đánh giá.' : 'Đã hiện dữ kiện tham khảo.'); return; }
    if (d.tuchuyen != null) { st.tuChuyen = !st.tuChuyen; save(); softUpdate(); return; }
    if (d.modk != null) { st.moDk[+d.modk] = true; save(); redrawCard(+d.modk); return; }
    if (d.tk != null) {
      var ti = +d.tk, li = +d.v, tk = st.tk[ti], multi = THE[ti].thienKien.kieu === 'nhieu', at = tk.c.indexOf(li);
      if (at !== -1) tk.c.splice(at, 1); else if (multi) tk.c.push(li); else tk.c = [li];
      save(); redrawCard(ti);
      var inp = document.querySelector('[data-tl="' + ti + '"][data-v="' + li + '"]'); if (inp) inp.focus();
      return;
    }
    if (d.ch) { t.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); return; }
    if (t.id === 'dgPdf') { window.print(); return; }
    if (t.id === 'dgCopy') { var u = location.origin + location.pathname + (st.duAn ? '?du-an=' + st.duAn : '') + '#s=' + encodeState(); var fb = function () { prompt('Sao chép liên kết:', u); }; try { navigator.clipboard.writeText(u).then(function () { t.textContent = 'Đã sao chép ✓'; }, fb); } catch (err) { fb(); } return; }
  });
  app.addEventListener('input', function (e) {
    var t = e.target, pn = t.nextElementSibling;
    if (t.dataset.tv != null) { st.tk[+t.dataset.tv].v = t.value; if (pn) pn.textContent = t.value; save(); return; }
    if (t.dataset.tl != null) { st.tk[+t.dataset.tl].l[t.dataset.v] = t.value; if (pn) pn.textContent = t.value; save(); return; }
    if (t.id === 'dgTen') { st.ten = t.value.slice(0, 80); save(); var b = app.querySelector('[data-start]'); if (b) b.disabled = !ready(); return; }
  });
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'dgDuAn') {
      var hs = st.hs, muc = st.muc;
      st = blank(); st.hs = hs; st.muc = muc; if (muc) applyGoal();
      if (t.value === '_khac') { st.khac = true; render(); document.getElementById('dgTen').focus(); }
      else { st.duAn = t.value; st.ten = tenOf(t.value); render(); }
      save();
    }
  });
  var shownAt = Date.now();
  app.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = f.querySelector('.dg-msg'), btn = f.querySelector('button[type=submit]');
    var chb = f.querySelector('[data-ch][aria-pressed=true]'), ch = chb ? chb.dataset.ch : 'email';
    var name = f.name.value.trim(), phone = f.phone.value.trim(), email = f.email.value.trim();
    var bad = name.length < 2 ? 'Vui lòng nhập họ tên.' : !/^(\+?84|0)\d{9}$/.test(phone.replace(/[\s.-]/g, '')) ? 'Số điện thoại chưa đúng.' : (ch === 'email' || email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Email chưa đúng.' : !f.consent.checked ? 'Vui lòng tích đồng ý để mình gửi bản đánh giá.' : soDaCham() < K.nguong.moTu ? 'Hãy chấm ít nhất ' + K.nguong.moTu + ' thẻ.' : '';
    if (bad) { msg.className = 'dg-msg err'; msg.textContent = bad; return; }
    var q = new URLSearchParams(location.search), utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    btn.disabled = true; msg.className = 'dg-msg'; msg.textContent = 'Đang gửi…';
    fetch('/api/danh-gia', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      name: name, phone: phone, email: email, channel: ch, consent: true, website: f.website.value, t: Date.now() - shownAt,
      duAn: st.duAn, tenDuAn: st.ten, hoSo: st.hs, w: st.w, s: st.s, boQua: st.bq, thienKien: st.tk, xemTu: !!st.xemTu, anDk: !!st.anDk, moDk: st.moDk, phienBan: K.phienBan, ma: encodeState(), page: location.pathname + location.search, utm: utm
    }) }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); }).then(function (j) {
      if (!j.ok) throw new Error(j.error || 'loi');
      st.sent = ch; save(); var fm = document.getElementById('dgForm'); fm.classList.add('dg-unlocked');
      fm.querySelector('.dg-done .dg-msg').textContent = 'Đã nhận. ' + (ch === 'email' ? (j.emailed ? 'Bản đánh giá đang trên đường tới hộp thư của bạn.' : 'Email tự động đang trục trặc, Tú sẽ gửi lại cho bạn qua Zalo.') : 'Tú sẽ gửi bản đánh giá cho bạn qua Zalo sớm nhất.');
      f.hidden = true;
    }).catch(function () { btn.disabled = false; msg.className = 'dg-msg err'; msg.textContent = 'Chưa gửi được. Bạn thử lại, hoặc nhắn Zalo 0978 618 149.'; });
  });
  window.addEventListener('beforeprint', function () { ['dgCards', 'dgHsW', 'dgRes'].forEach(function (id) { var el = document.getElementById(id); if (el) { el.dataset.h = el.hidden ? '1' : ''; el.hidden = false; } }); });
  window.addEventListener('afterprint', function () { ['dgCards', 'dgHsW', 'dgRes'].forEach(function (id) { var el = document.getElementById(id); if (el && el.dataset.h === '1') el.hidden = true; }); });

  // Phím tắt khi chấm từng thẻ: 1–5 chấm điểm, ←/→ chuyển thẻ
  document.addEventListener('keydown', function (e) {
    if (st.view !== 'the' || st.mode !== 'wiz' || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if (e.key >= '1' && e.key <= '5') { var b = document.querySelector('.dg-card.on [data-s="' + st.i + '"][data-v="' + e.key + '"]'); if (b) { e.preventDefault(); b.click(); } }
    else if (e.key === 'ArrowRight' && st.i < N - 1) { e.preventDefault(); go(st.i + 1); }
    else if (e.key === 'ArrowLeft' && st.i > 0) { e.preventDefault(); go(st.i - 1); }
  });
  load(); render();
  // Quay lại khi đang đánh giá dở: báo tiến độ
  (function () { var dc = soDaCham(); if (st.view === 'the' && dc > 0 && dc < N) toast('Tiếp tục bản đánh giá ' + st.ten + ': đã chấm ' + dc + '/' + N + ' thẻ.'); })();
  if (st.view === 'kq') { var k = document.getElementById('ketQua'); if (k) k.scrollIntoView(); }
})();
