/* Mã QR Zalo cho số điện thoại tư vấn — tự viết, không thư viện ngoài, chạy hoàn toàn trên trình duyệt.
   Chỉ hỗ trợ chế độ byte, mức sửa lỗi M, phiên bản 1–6 (tối đa 106 byte) — đủ cho liên kết https://zalo.me/<số>. */
(function (w) {
  'use strict';
  var DATA = [16, 28, 44, 64, 86, 108], ECC = [10, 16, 26, 18, 24, 16], BLK = [1, 1, 1, 2, 2, 4];
  var ALIGN = [null, 18, 22, 26, 30, 34];

  var EXP = [], LOG = [], x = 1, i;
  for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  function mul(a, b) { return a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0; }
  function rsGen(n) { var g = [1], j, k; for (j = 0; j < n; j++) { var ng = new Array(g.length + 1).fill(0); for (k = 0; k < g.length; k++) { ng[k] ^= g[k]; ng[k + 1] ^= mul(g[k], EXP[j]); } g = ng; } return g; }
  function rsRem(data, n) { var g = rsGen(n), r = new Array(n).fill(0); data.forEach(function (d) { var f = d ^ r.shift(); r.push(0); for (var k = 0; k < n; k++) r[k] ^= mul(g[k + 1], f); }); return r; }

  function encode(text) {
    var bytes = unescape(encodeURIComponent(text)).split('').map(function (c) { return c.charCodeAt(0); });
    var v = -1, v0; for (v0 = 0; v0 < 6; v0++) { if (bytes.length <= DATA[v0] - 2) { v = v0; break; } }
    if (v < 0) return null;
    var bits = []; function put(val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >> k) & 1); }
    put(4, 4); put(bytes.length, 8); bytes.forEach(function (b) { put(b, 8); });
    var cap = DATA[v] * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    var cw = []; for (i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    var nb = BLK[v], per = DATA[v] / nb, blocks = [], ecs = [];
    for (i = 0; i < nb; i++) { var b = cw.slice(i * per, (i + 1) * per); blocks.push(b); ecs.push(rsRem(b, ECC[v])); }
    var out = [], k2; for (k2 = 0; k2 < per; k2++) blocks.forEach(function (b) { out.push(b[k2]); });
    for (k2 = 0; k2 < ECC[v]; k2++) ecs.forEach(function (e) { out.push(e[k2]); });
    return { v: v + 1, cw: out };
  }

  function matrix(text) {
    var e = encode(text); if (!e) return null;
    var n = 17 + 4 * e.v, M = [], F = [], r, c;
    for (r = 0; r < n; r++) { M.push(new Array(n).fill(0)); F.push(new Array(n).fill(false)); }
    function set(r_, c_, val) { if (r_ < 0 || c_ < 0 || r_ >= n || c_ >= n) return; M[r_][c_] = val ? 1 : 0; F[r_][c_] = true; }
    function finder(r0, c0) { for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) { var in_ = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6; set(r0 + dr, c0 + dc, in_ && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4))); } }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    for (i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    if (e.v > 1) { var a = ALIGN[e.v - 1]; for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) set(a + dr, a + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }
    set(n - 8, 8, 1);
    for (i = 0; i < 9; i++) { if (!F[8][i]) set(8, i, 0); if (!F[i][8]) set(i, 8, 0); }
    for (i = 0; i < 8; i++) { if (!F[8][n - 1 - i]) set(8, n - 1 - i, 0); if (!F[n - 1 - i][8]) set(n - 1 - i, 8, 0); }
    set(n - 8, 8, 1);
    // dữ liệu (zigzag), mặt nạ 0: (r + c) % 2 === 0
    var bi = 0, up = true, col;
    for (col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (var t = 0; t < n; t++) {
        r = up ? n - 1 - t : t;
        for (var d = 0; d < 2; d++) {
          c = col - d; if (F[r][c]) continue;
          var bit = bi < e.cw.length * 8 ? (e.cw[bi >> 3] >> (7 - (bi & 7))) & 1 : 0; bi++;
          M[r][c] = bit ^ ((r + c) % 2 === 0 ? 1 : 0);
        }
      }
      up = !up;
    }
    // thông tin định dạng: mức M (00) + mặt nạ 0 (000)
    var data = 0, rem = data << 10, g = 0x537, k;
    for (k = 14; k >= 10; k--) if ((rem >> k) & 1) rem ^= g << (k - 10);
    var fmtBits = ((data << 10) | rem) ^ 0x5412;
    function fb(k_) { return (fmtBits >> k_) & 1; }
    for (k = 0; k <= 5; k++) M[k][8] = fb(k);
    M[7][8] = fb(6); M[8][8] = fb(7); M[8][7] = fb(8);
    for (k = 9; k < 15; k++) M[8][14 - k] = fb(k);
    for (k = 0; k < 8; k++) M[8][n - 1 - k] = fb(k);
    for (k = 8; k < 15; k++) M[n - 15 + k][8] = fb(k);
    M[n - 8][8] = 1;
    return M;
  }

  function svg(text, px) {
    var M = matrix(text); if (!M) return '';
    var n = M.length, q = 4, s = n + q * 2, d = '', r, c;
    for (r = 0; r < n; r++) { var run = 0; for (c = 0; c <= n; c++) { if (c < n && M[r][c]) run++; else { if (run) d += 'M' + (c - run + q) + ' ' + (r + q) + 'h' + run + 'v1h-' + run + 'z'; run = 0; } } }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 120) + '" height="' + (px || 120) + '" shape-rendering="crispEdges" role="img" aria-label="Mã QR Zalo"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  function normPhone(p) {
    var d = String(p || '').replace(/[^\d+]/g, '');
    if (d.indexOf('+84') === 0) d = '0' + d.slice(3); else if (d.indexOf('84') === 0 && d.length >= 11) d = '0' + d.slice(2);
    d = d.replace(/\D/g, '');
    return /^0\d{9}$/.test(d) ? d : '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Khối liên hệ cho bản PDF: tên khách, tên tư vấn, số điện thoại và mã QR Zalo (nếu số hợp lệ). */
  function contact(o) {
    o = o || {}; var ph = normPhone(o.phone), parts = '';
    if (o.client) parts += 'Khách hàng: <b>' + esc(o.client) + '</b><br>';
    if (o.agent) parts += 'Chuyên viên tư vấn: <b>' + esc(o.agent) + '</b><br>';
    if (o.phone) parts += 'Số điện thoại: <b>' + esc(o.phone) + '</b><br>';
    if (!parts && !ph) return '';
    var qr = ph ? '<div style="text-align:center;flex:none"><div style="line-height:0;border:1px solid #dee2e6;padding:2px;background:#fff">' + svg('https://zalo.me/' + ph, 112) + '</div><div style="font-size:10px;color:#6c757d;margin-top:3px">Quét mã để nhắn Zalo</div></div>' : '';
    return '<div style="display:flex;gap:16px;align-items:center;justify-content:space-between;border-top:1px solid #dee2e6;margin-top:14px;padding-top:10px;font-size:12px;line-height:1.7"><div>' + parts + '</div>' + qr + '</div>';
  }

  w.NATQR = { svg: svg, matrix: matrix, normPhone: normPhone, contact: contact };
})(window);
