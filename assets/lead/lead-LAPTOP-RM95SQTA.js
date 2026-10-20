/*! Lead system v1 – nguyenanhtu.vn
 * Banner cookie + form nhận tài liệu + tracking mức độ quan tâm.
 * Không phụ thuộc thư viện. Chỉ nạp GA4 / Clarity / Pixel sau khi khách đồng ý.
 */
(function () {
  'use strict';

  var DATA_URL = '/assets/lead/lead-data.json';
  var API_URL = '/api/lead';
  var K_CONSENT = 'lead_consent_v1';
  var K_SCORE = 'lead_score_v1';
  var K_UTM = 'lead_utm_v1';
  var K_SESSION = 'lead_session_v1';

  // Điểm quan tâm (mỗi hành động chỉ tính một lần cho mỗi dự án)
  var POINTS = {
    form_submit: 30,
    link_open: 20,
    return_visit: 20,
    multi_project: 15,
    click_contact: 15,
    scroll_90: 10
  };

  function makeStore(area) {
    return {
      get: function (k) { try { return JSON.parse(area.getItem(k)); } catch (e) { return null; } },
      set: function (k, v) { try { area.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
    };
  }
  var local, session;
  try { local = makeStore(window.localStorage); } catch (e) { local = makeStore({ getItem: function () { return null; }, setItem: function () {} }); }
  try { session = makeStore(window.sessionStorage); } catch (e) { session = makeStore({ getItem: function () { return null; }, setItem: function () {} }); }

  var data = { settings: {}, projects: {} };
  var consent = local.get(K_CONSENT);
  var loaded = {};
  var pageInited = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(name) {
    try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; }
  }
  function pageProject() {
    var m = document.querySelector('meta[name="lead-project"]');
    return m ? m.getAttribute('content') : '';
  }
  function analyticsOn() { return !!(consent && consent.analytics); }

  /* ---------- Nguồn truy cập (UTM) ---------- */
  function captureUtm() {
    var cur = session.get(K_UTM) || {};
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    var found = false;
    keys.forEach(function (k) { var v = qs(k); if (v) { cur[k] = v.slice(0, 80); found = true; } });
    if (!found && !cur.utm_source && document.referrer) {
      try {
        var h = new URL(document.referrer).hostname;
        if (h && h !== location.hostname) { cur.utm_source = h; cur.utm_medium = 'referral'; }
      } catch (e) { /* bỏ qua */ }
    }
    session.set(K_UTM, cur);
  }

  /* ---------- Điểm quan tâm ---------- */
  function scoreState() {
    var s = local.get(K_SCORE) || {};
    s.pts = s.pts || 0; s.seen = s.seen || {}; s.projects = s.projects || []; s.visits = s.visits || 0;
    return s;
  }
  function award(key, project) {
    if (!analyticsOn()) return;
    var s = scoreState();
    var id = key + (project ? ':' + project : '');
    if (s.seen[id]) return;
    s.seen[id] = 1;
    s.pts += POINTS[key] || 0;
    local.set(K_SCORE, s);
  }
  function currentScore() { return analyticsOn() ? scoreState().pts : 0; }

  /* ---------- GA4 / Clarity / Pixel ---------- */
  function gaEvent(name, params) {
    if (analyticsOn() && window.gtag) window.gtag('event', name, params || {});
  }
  function loadScript(src) {
    var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s);
  }
  function loadAnalytics() {
    var st = data.settings || {};
    if (st.ga4 && !loaded.ga4) {
      loaded.ga4 = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', st.ga4);
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(st.ga4));
    }
    if (st.clarity && !loaded.clarity) {
      loaded.clarity = true;
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script', st.clarity);
    }
  }
  function loadMarketing() {
    var id = (data.settings || {}).metaPixel;
    if (!id || loaded.meta) return;
    loaded.meta = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function pageInit() {
    if (pageInited || !analyticsOn()) return;
    pageInited = true;
    var s = scoreState();
    if (!session.get(K_SESSION)) {
      session.set(K_SESSION, 1);
      s.visits += 1;
      local.set(K_SCORE, s);
    }
    if (s.visits >= 2) award('return_visit');
    var p = pageProject();
    if (p) {
      s = scoreState();
      if (s.projects.indexOf(p) < 0) { s.projects.push(p); local.set(K_SCORE, s); }
      if (s.projects.length >= 2) award('multi_project');
      gaEvent('view_project', { project: p });
    }
    var lid = qs('lid');
    if (lid) {
      award('link_open');
      gaEvent('lead_link_open', { lid: lid, project: p || '' });
    }
  }

  function applyConsent() {
    if (analyticsOn()) { loadAnalytics(); pageInit(); }
    if (consent && consent.marketing) loadMarketing();
  }

  /* ---------- Banner cookie ---------- */
  function showBanner(openCustom) {
    var old = document.getElementById('ld-banner');
    if (old) old.remove();
    var c = consent || { analytics: false, marketing: false };
    var privacy = (data.settings && data.settings.privacyUrl) || '/chinh-sach-bao-mat/';
    var el = document.createElement('div');
    el.id = 'ld-banner';
    el.className = 'ld-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cài đặt cookie');
    el.innerHTML =
      '<p class="ld-banner__text">Trang này luôn dùng cookie cần thiết để hoạt động. Nếu bạn đồng ý, mình dùng thêm cookie phân tích để biết nội dung nào hữu ích và cookie quảng cáo. Xem <a href="' + esc(privacy) + '">Chính sách bảo mật</a>.</p>' +
      '<div class="ld-banner__custom" hidden>' +
      '<label><input type="checkbox" checked disabled> <span>Cần thiết (luôn bật)</span></label>' +
      '<label><input type="checkbox" id="ld-c-an"' + (c.analytics ? ' checked' : '') + '> <span>Phân tích: số lượt xem, trang được đọc nhiều</span></label>' +
      '<label><input type="checkbox" id="ld-c-mk"' + (c.marketing ? ' checked' : '') + '> <span>Quảng cáo: đo hiệu quả quảng cáo</span></label>' +
      '</div>' +
      '<div class="ld-banner__actions">' +
      '<button type="button" class="ld-btn ld-btn--primary" data-act="all">Chấp nhận tất cả</button>' +
      '<button type="button" class="ld-btn ld-btn--primary" data-act="essential">Chỉ cần thiết</button>' +
      '<button type="button" class="ld-btn" data-act="custom">Tuỳ chọn</button>' +
      '<button type="button" class="ld-btn" data-act="save" hidden>Lưu lựa chọn</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;
      if (act === 'all') saveConsent(true, true);
      else if (act === 'essential') saveConsent(false, false);
      else if (act === 'custom') {
        el.querySelector('.ld-banner__custom').hidden = false;
        el.querySelector('[data-act="custom"]').hidden = true;
        el.querySelector('[data-act="save"]').hidden = false;
      } else if (act === 'save') {
        saveConsent(el.querySelector('#ld-c-an').checked, el.querySelector('#ld-c-mk').checked);
      }
    });
    document.body.appendChild(el);
    if (openCustom) {
      el.querySelector('[data-act="custom"]').click();
    }
  }
  function saveConsent(analytics, marketing) {
    var prev = consent;
    consent = { analytics: !!analytics, marketing: !!marketing, ts: Date.now() };
    local.set(K_CONSENT, consent);
    var el = document.getElementById('ld-banner');
    if (el) el.remove();
    var revoked = prev && ((prev.analytics && !analytics) || (prev.marketing && !marketing));
    if (revoked) { location.reload(); return; }
    applyConsent();
  }

  /* ---------- Phương án khách tính trên bảng tính ---------- */
  // Trang bảng tính đánh dấu ô nhập: data-lead-input="khoa" data-lead-label="Nhãn"
  // và ô kết quả: data-lead-result data-lead-label="Nhãn"
  function collectCalc() {
    var inputs = [], results = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-lead-input]'), function (el) {
      var v = String(el.value == null ? '' : el.value).trim();
      var k = el.getAttribute('data-lead-input');
      if (v) inputs.push({ k: k, l: el.getAttribute('data-lead-label') || k, v: v });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lead-result]'), function (el) {
      var v = (el.textContent || '').trim();
      if (v) results.push({ l: el.getAttribute('data-lead-label') || '', v: v });
    });
    var real = inputs.filter(function (i) { return i.k !== 'pt' && i.k !== 'cust'; });
    return real.length ? { inputs: inputs, results: results } : null;
  }
  // Link "Mở lại bảng tính": điền lại các ô từ ?calc={...}
  function restoreCalc() {
    var raw = qs('calc');
    if (!raw) return;
    var m;
    try { m = JSON.parse(raw); } catch (e) { return; }
    Object.keys(m).forEach(function (k) {
      var el = document.querySelector('[data-lead-input="' + k.replace(/"/g, '') + '"]');
      if (!el) return;
      el.value = m[k];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }


  /* ---------- Xuất PDF phương án của khách (chạy trên máy khách, khi khách tick đồng ý chia sẻ phương án) ---------- */
  function loadLib(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el);
    });
  }
  function setPrintMedia(on, doc) {
    // Đổi @media print thành "all" để dựng đúng bản in trên màn hình, rồi trả lại
    var changed = [];
    Array.prototype.forEach.call((doc || document).styleSheets, function (sh) {
      var rules; try { rules = sh.cssRules; } catch (e) { return; }
      Array.prototype.forEach.call(rules || [], function (r) {
        if (r.type === 4 && r.media && /print/i.test(r.media.mediaText)) { changed.push(r); }
      });
    });
    changed.forEach(function (r) { r.media.mediaText = on ? 'all' : 'print'; });
    return changed.length;
  }
  var pdfWhy = '';
  function buildPdf() {
    pdfWhy = '';
    var fn = (typeof window.pdfDeck === 'function') ? window.pdfDeck : (typeof window.exportPDF === 'function' ? window.exportPDF : null);
    if (!fn) { pdfWhy = 'khong-co-ham-xuat-pdf'; return Promise.resolve(null); }
    return Promise.all([loadLib('/assets/vendor/html2canvas.min.js'), loadLib('/assets/vendor/jspdf.umd.min.js')]).then(function () {
      var origPrint = window.print, printed = false;
      window.print = function () { printed = true; };
      try { fn(); } catch (e) { /* bỏ qua */ }
      var waited = 0;
      return new Promise(function (res) {
        (function poll() { if (printed || waited >= 1500) return res(); waited += 50; setTimeout(poll, 50); })();
      }).then(function () {
      window.print = origPrint;
      if (!printed) { pdfWhy = 'bang-tinh-chua-san-sang'; return null; }
      var box = document.getElementById('nlPdf') && document.body.classList.contains('nl-pdfmode') ? document.getElementById('nlPdf') : document.getElementById('print-sheet');
      if (!box) { pdfWhy = 'khong-thay-ban-in'; return null; }
      var isDeck = box.id === 'nlPdf', cap = null;
      if (isDeck) {
        // Bảng tính có bản in riêng (@media print): dựng bản sao ngoài màn hình với đúng các quy tắc đó
        var css = '';
        var add = function (r) {
          if (r.type === 1 && r.selectorText && r.selectorText.indexOf('#nlPdf') >= 0 && r.selectorText.indexOf('body') < 0) css += r.cssText.replace(/#nlPdf/g, '#leadCap') + '\n';
        };
        Array.prototype.forEach.call(document.styleSheets, function (sh) {
          var rules; try { rules = sh.cssRules; } catch (e) { return; }
          Array.prototype.forEach.call(rules || [], function (r) {
            if (r.type === 4 && r.media && /print/i.test(r.media.mediaText)) Array.prototype.forEach.call(r.cssRules, add); else add(r);
          });
        });
        cap = document.createElement('div'); cap.id = 'leadCap';
        cap.setAttribute('style', 'display:block;position:absolute;left:-10000px;top:0;width:186mm;background:#fff;color:#1b2430;font-family:"Segoe UI",system-ui,sans-serif');
        var st = document.createElement('style'); st.textContent = css;
        cap.appendChild(st); var inner = document.createElement('div'); inner.innerHTML = box.innerHTML; cap.appendChild(inner);
        document.body.appendChild(cap);
        try { window.dispatchEvent(new Event('afterprint')); } catch (e) { /* bỏ qua */ }
      } else { setPrintMedia(true); }
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
      var opts = { scale: 1.6, useCORS: true, backgroundColor: '#ffffff', logging: false, onclone: function (d) { if (!isDeck) setPrintMedia(true, d); } };
      var chain = Promise.resolve();
      var targets = isDeck ? Array.prototype.slice.call(cap.querySelectorAll('.pg')) : [box];
      var first = true;
      targets.forEach(function (el) {
        chain = chain.then(function () {
          var saveW = el.style.width; el.style.width = '186mm';
          Array.prototype.forEach.call(el.querySelectorAll('*'), function (n) { var bi = window.getComputedStyle(n).backgroundImage; if (bi && bi.indexOf('gradient') >= 0) { n.style.backgroundImage = 'none'; if (n.classList.contains('cov')) n.style.backgroundColor = '#0c2340'; } });
          return window.html2canvas(el, opts).then(function (cv) {
            el.style.width = saveW;
            var W = cv.width, H = cv.height;
            if (!W || !H) { try { console.warn('lead pdf: trang rỗng', window.getComputedStyle(box).display, JSON.stringify(el.getBoundingClientRect()), el.style.width); } catch (x) { /* bỏ qua */ } return; }
            var pageH = Math.floor(W * 273 / 186); // phần nội dung cao 273mm khi rộng 186mm
            if (isDeck) {
              if (!first) doc.addPage(); first = false;
              var hmm = H * 186 / W, k = hmm > 273 ? 273 / hmm : 1;
              doc.addImage(cv.toDataURL('image/jpeg', 0.82), 'JPEG', 12 + (186 - 186 * k) / 2, 12, 186 * k, hmm * k);
              return;
            }
            for (var y = 0; y < H; y += pageH) {
              var h = Math.min(pageH, H - y);
              var part = document.createElement('canvas'); part.width = W; part.height = h;
              part.getContext('2d').drawImage(cv, 0, y, W, h, 0, 0, W, h);
              if (!first) doc.addPage(); first = false;
              doc.addImage(part.toDataURL('image/jpeg', 0.8), 'JPEG', 12, 12, 186, h * 186 / W);
            }
          });
        });
      });
      return chain.then(function () {
        var uri = doc.output('datauristring');
        return uri.slice(uri.indexOf(',') + 1);
      }).catch(function (e) { pdfWhy = 'loi-tao-pdf: ' + String(e && e.message || e).slice(0, 60); try { console.warn('lead pdf:', e); } catch (x) { /* bỏ qua */ } return null; })
        .then(function (b64) {
          if (isDeck) { if (cap && cap.parentNode) cap.parentNode.removeChild(cap); }
          else { setPrintMedia(false); box.innerHTML = ''; }
          return b64;
        });
      });
    }).catch(function (e) { pdfWhy = 'khong-tai-duoc-thu-vien'; return null; });
  }

  /* ---------- Form nhận tài liệu ---------- */
  function normPhone(v) {
    var d = String(v || '').replace(/[^\d+]/g, '');
    if (d.indexOf('+84') === 0) d = '0' + d.slice(3);
    else if (d.indexOf('84') === 0 && d.length === 11) d = '0' + d.slice(2);
    return d;
  }
  function validPhone(v) { return /^0\d{9}$/.test(normPhone(v)); }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function closeModal() {
    var m = document.getElementById('ld-modal');
    if (m) { if (m.close) m.close(); m.remove(); }
  }

  function openForm(slug) {
    closeModal();
    var p = (data.projects || {})[slug];
    var st = data.settings || {};
    var dlg = document.createElement('dialog');
    dlg.id = 'ld-modal';
    dlg.className = 'ld-modal';
    dlg.setAttribute('aria-labelledby', 'ld-title');

    if (!p) {
      dlg.innerHTML = '<div class="ld-modal__body"><button type="button" class="ld-close" aria-label="Đóng">×</button>' +
        '<h2 id="ld-title">Tài liệu đang được cập nhật</h2>' +
        '<p class="ld-sub">Bạn nhắn Zalo ' + esc(st.zaloPhone || '') + ' để nhận tài liệu của dự án này.</p></div>';
      document.body.appendChild(dlg);
      dlg.querySelector('.ld-close').onclick = closeModal;
      if (dlg.showModal) dlg.showModal();
      return;
    }

    var calc = collectCalc();
    var docKeys = Object.keys(p.docs || {}).filter(function (k) { return p.docs[k] && p.docs[k].url; });
    var hasDocs = docKeys.length > 0;
    var docsHtml = '';
    if (hasDocs) {
      docsHtml = '<fieldset class="ld-field"><legend>Tài liệu bạn cần</legend>' +
        docKeys.map(function (k, i) {
          return '<label class="ld-choice"><input type="radio" name="doc" value="' + esc(k) + '"' + (i === 0 ? ' checked' : '') + '> <span>' + esc(p.docs[k].label) + '</span></label>';
        }).join('') + '</fieldset>';
    }
    var emailRadio = hasDocs
      ? '<label class="ld-choice"><input type="radio" name="channel" value="email"> <span>Email (gửi tự động ngay)</span></label>'
      : '';

    dlg.innerHTML =
      '<form class="ld-modal__body" novalidate>' +
      '<button type="button" class="ld-close" aria-label="Đóng">×</button>' +
      '<h2 id="ld-title">Nhận tài liệu ' + esc(p.name) + '</h2>' +
      '<p class="ld-sub">Thông tin chỉ dùng để gửi tài liệu và trao đổi về dự án này.</p>' +
      '<div class="ld-field"><label for="ld-name">Họ và tên</label><input type="text" id="ld-name" name="name" autocomplete="name" required></div>' +
      '<div class="ld-field"><label for="ld-phone">Số điện thoại (Zalo)</label><input type="tel" id="ld-phone" name="phone" autocomplete="tel" inputmode="tel" required></div>' +
      '<fieldset class="ld-field"><legend>Bạn muốn nhận tài liệu qua</legend>' +
      '<label class="ld-choice"><input type="radio" name="channel" value="zalo" checked> <span>Zalo</span></label>' + emailRadio +
      '</fieldset>' +
      '<div class="ld-field" id="ld-email-wrap"><label for="ld-email">Email <span class="ld-hint" id="ld-email-hint">(không bắt buộc)</span></label><input type="email" id="ld-email" name="email" autocomplete="email"></div>' +
      docsHtml +
      '<div class="ld-row">' +
      '<div class="ld-field"><label for="ld-purpose">Mục đích <span class="ld-hint">(không bắt buộc)</span></label><select id="ld-purpose" name="purpose"><option value="">Chưa xác định</option><option>Để ở</option><option>Đầu tư</option></select></div>' +
      '<div class="ld-field"><label for="ld-budget">Ngân sách <span class="ld-hint">(không bắt buộc)</span></label><select id="ld-budget" name="budget"><option value="">Chưa xác định</option><option>Dưới 2 tỷ</option><option>2 – 5 tỷ</option><option>5 – 10 tỷ</option><option>Trên 10 tỷ</option></select></div>' +
      '</div>' +
      (calc ? '<div class="ld-field"><label class="ld-choice"><input type="checkbox" name="calcConsent"> <span>Gửi kèm phương án tôi vừa tính trên bảng tính</span></label></div>' : '') +
      '<div class="ld-hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<div class="ld-field"><label class="ld-choice ld-consent"><input type="checkbox" name="consent" id="ld-consent"> <span>Mình đồng ý để Nguyễn Anh Tú thu thập và xử lý họ tên, số điện thoại, email nêu trên nhằm gửi tài liệu và liên hệ trao đổi về dự án này, theo <a href="' + esc(st.privacyUrl || '/chinh-sach-bao-mat/') + '" target="_blank" rel="noopener">Chính sách bảo mật</a>. Mình có thể rút lại đồng ý bất cứ lúc nào.</span></label></div>' +
      '<button type="submit" class="ld-btn ld-btn--primary" id="ld-submit">Gửi cho tôi tài liệu</button>' +
      '<p class="ld-status" id="ld-status" role="status" aria-live="polite"></p>' +
      '</form>';

    document.body.appendChild(dlg);
    var form = dlg.querySelector('form');
    var openedAt = Date.now();
    var started = false;

    dlg.querySelector('.ld-close').onclick = closeModal;
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeModal(); });
    dlg.addEventListener('close', function () { dlg.remove(); });

    function channel() { return form.elements.channel.value || 'zalo'; }
    function syncChannel() {
      var isEmail = channel() === 'email';
      dlg.querySelector('#ld-email-hint').textContent = isEmail ? '(bắt buộc để nhận qua email)' : '(không bắt buộc)';
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'channel') syncChannel(); });
    form.addEventListener('focusin', function () {
      if (!started) { started = true; gaEvent('form_start', { project: slug }); }
    });

    function clearErrors() {
      Array.prototype.forEach.call(form.querySelectorAll('.ld-error'), function (n) { n.remove(); });
    }
    function fieldError(input, msg) {
      var p2 = document.createElement('p');
      p2.className = 'ld-error';
      p2.textContent = msg;
      var host = input.closest('.ld-field') || input.parentNode;
      host.appendChild(p2);
      input.setAttribute('aria-invalid', 'true');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var f = form.elements;
      var name = f.name.value.trim();
      var phone = f.phone.value.trim();
      var email = f.email.value.trim();
      var ch = channel();
      var firstBad = null;
      function bad(input, msg) { fieldError(input, msg); if (!firstBad) firstBad = input; }

      if (name.length < 2) bad(f.name, 'Nhập họ và tên của bạn.');
      if (!validPhone(phone)) bad(f.phone, 'Nhập số điện thoại 10 số, ví dụ 0912345678.');
      if (ch === 'email' && !validEmail(email)) bad(f.email, 'Nhập email hợp lệ để nhận tài liệu qua email.');
      else if (email && !validEmail(email)) bad(f.email, 'Email chưa đúng định dạng.');
      if (!f.consent.checked) bad(f.consent, 'Bạn cần đồng ý để mình gửi tài liệu.');
      if (firstBad) { firstBad.focus(); return; }

      var btn = dlg.querySelector('#ld-submit');
      var status = dlg.querySelector('#ld-status');
      btn.disabled = true; btn.textContent = 'Đang gửi…';
      status.textContent = ''; status.className = 'ld-status';

      award('form_submit', slug);
      var payload = {
        project: slug,
        name: name,
        phone: normPhone(phone),
        email: email,
        channel: ch,
        doc: hasDocs ? (f.doc.value || docKeys[0]) : 'general',
        purpose: f.purpose.value,
        budget: f.budget.value,
        consent: true,
        website: f.website.value,
        t: Date.now() - openedAt,
        score: currentScore(),
        visits: analyticsOn() ? scoreState().visits : 0,
        interactions: analyticsOn() ? Object.keys(scoreState().seen).filter(function (k) { return k.indexOf('form_submit') !== 0; }).length : 0,
        projectsViewed: analyticsOn() ? scoreState().projects.length : 0,
        utm: session.get(K_UTM) || {},
        page: location.pathname
      };

      if (calc && f.calcConsent && f.calcConsent.checked) { payload.calc = calc; payload.calcConsent = true; }

      var pdfStep = (payload.calcConsent ? Promise.race([buildPdf(), new Promise(function (r) { setTimeout(function () { pdfWhy = pdfWhy || 'qua-25-giay'; r(null); }, 25000); })]) : Promise.resolve(null))
        .then(function (b64) { if (b64 && b64.length < 12000000) payload.pdf = b64; else if (payload.calcConsent && !pdfWhy) pdfWhy = 'file-qua-lon'; if (payload.calcConsent) payload.pdfWhy = pdfWhy; });
      if (payload.calcConsent) btn.textContent = 'Đang tạo file PDF…';
      pdfStep.then(function () {
        btn.textContent = 'Đang gửi…';
        return fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }); }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error((res.j && res.j.error) || 'fail');
          gaEvent('generate_lead', { project: slug, channel: ch });
          if (window.fbq && consent && consent.marketing) window.fbq('track', 'Lead');
          showDone(dlg, ch, res.j.emailed, payload.phone, payload.email, st);
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = 'Gửi cho tôi tài liệu';
          status.className = 'ld-status ld-status--err';
          status.textContent = 'Chưa gửi được. Kiểm tra kết nối rồi bấm gửi lại.' +
            (st.zaloPhone ? ' Nếu vẫn lỗi, nhắn Zalo ' + st.zaloPhone + '.' : '');
        });
    });

    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    gaEvent('form_open', { project: slug });
    form.elements.name.focus();
  }

  function showDone(dlg, ch, emailed, phone, email, st) {
    var msg;
    if (ch === 'email' && emailed) {
      msg = 'Mình đã gửi tài liệu tới ' + esc(email) + '. Nếu chưa thấy, bạn kiểm tra thêm mục thư rác.';
    } else if (ch === 'email') {
      msg = 'Mình đã nhận yêu cầu của bạn nhưng email tự động chưa gửi được. Mình sẽ gửi tài liệu cho bạn qua Zalo ' + esc(phone) + ' trong thời gian sớm nhất.';
    } else {
      msg = 'Mình sẽ gửi tài liệu qua Zalo ' + esc(phone) + ' trong thời gian sớm nhất. Bạn nhớ mở tin nhắn từ Zalo của mình nhé.';
    }
    dlg.innerHTML = '<div class="ld-modal__body"><button type="button" class="ld-close" aria-label="Đóng">×</button>' +
      '<h2 id="ld-title">Đã nhận yêu cầu</h2><p class="ld-sub">' + msg + '</p>' +
      '<button type="button" class="ld-btn ld-btn--primary" id="ld-done">Đóng</button></div>';
    dlg.querySelector('.ld-close').onclick = closeModal;
    dlg.querySelector('#ld-done').onclick = closeModal;
    dlg.querySelector('#ld-done').focus();
  }

  /* ---------- Theo dõi hành vi ---------- */
  function bindTracking() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-lead-open],[data-cookie-settings],a') : null;
      if (!t) return;
      if (t.hasAttribute('data-lead-open')) {
        e.preventDefault();
        openForm(t.getAttribute('data-project') || pageProject());
        return;
      }
      if (t.hasAttribute('data-cookie-settings')) {
        e.preventDefault();
        showBanner(true);
        return;
      }
      var href = t.getAttribute('href') || '';
      if (/zalo\.me|^tel:/i.test(href)) {
        var p = pageProject();
        award('click_contact', p);
        gaEvent('click_contact', { project: p, target: /^tel:/i.test(href) ? 'phone' : 'zalo' });
      }
    });

    var fired = {};
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        var pct = (window.scrollY || doc.scrollTop) / max * 100;
        var p = pageProject();
        if (pct >= 50 && !fired[50]) { fired[50] = 1; gaEvent('scroll_50', { project: p }); }
        if (pct >= 90 && !fired[90]) { fired[90] = 1; gaEvent('scroll_90', { project: p }); award('scroll_90', p); }
      });
    }, { passive: true });
  }

  /* ---------- Khởi động ---------- */
  function init() {
    captureUtm();
    if (qs('calc') || qs('pdf') === '1') window.addEventListener('load', function () { setTimeout(restoreCalc, 300); });
    if (qs('pdf') === '1') window.addEventListener('load', function () { setTimeout(function () { try { (typeof window.exportPDF === 'function') ? window.exportPDF() : (typeof window.pdfDeck === 'function') ? window.pdfDeck() : window.print(); } catch (e) { /* bỏ qua */ } }, 1500); });
    bindTracking();
    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .catch(function () { return { settings: {}, projects: {} }; })
      .then(function (d) {
        data = d || data;
        if (!consent) showBanner(false); else applyConsent();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.LeadSystem = { open: openForm, cookieSettings: function () { showBanner(true); } };
})();
