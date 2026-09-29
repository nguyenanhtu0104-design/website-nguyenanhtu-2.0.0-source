#!/usr/bin/env python3
"""Kiểm thử tự động Cẩm Nang BĐS 2.0 (Playwright + Chromium).
   Chạy:  node scripts/build.mjs && (cd dist && python3 -m http.server 8080 &) && python3 tests/smoke.py [http://localhost:8080]
"""
import sys, json, re, os
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080').rstrip('/')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
arts = json.load(open(os.path.join(ROOT, 'data/articles.json'), encoding='utf-8'))
IGNORE = ('fonts.googleapis.com', 'fonts.gstatic.com')
fails = []
def check(cond, msg):
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: fails.append(msg)

with sync_playwright() as p:
    br = p.chromium.launch()
    for label, vp in [('desktop', {'width': 1280, 'height': 900}), ('mobile', {'width': 390, 'height': 844})]:
        print(f'\n== {label} ==')
        ctx = br.new_context(viewport=vp, is_mobile=(label == 'mobile'), has_touch=(label == 'mobile'))
        ctx.route(re.compile(r'fonts\.(googleapis|gstatic)\.com'), lambda r: r.abort())
        pg = ctx.new_page(); errs = []; reqs = []
        pg.on('console', lambda m: m.type == 'error' and not any(i in (m.text + str(m.location.get('url',''))) for i in IGNORE) and 'ERR_FAILED' not in m.text and errs.append(m.text))
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('request', lambda r: reqs.append(r.url))
        pg.on('requestfailed', lambda r: not any(i in r.url for i in IGNORE) and 'ERR_ABORTED' not in (r.failure or '') and errs.append('FAILED ' + r.url + ' ' + str(r.failure)))
        pg.goto(BASE + '/'); pg.wait_for_load_state('networkidle')
        check(pg.locator('.chapter').count() == 5, 'trang chủ có 5 chương')
        check(pg.locator('.rei-global-nav__link.is-active', has_text='Cẩm nang').count() == 1, 'thanh menu NAT: mục Cẩm nang đang chọn')
        pg.locator('summary', has_text='Liên hệ').click()
        check(pg.locator('.rei-contact__panel a[href^="tel:"]').is_visible(), 'nút Liên hệ mở ra Gọi ngay / Zalo')
        check(not any('search-index' in u for u in reqs), 'search index KHÔNG tải khi vào trang chủ')
        check(not any('/assets/images/articles/' in u for u in reqs), 'ảnh bài KHÔNG tải khi vào trang chủ')
        home_bytes = sum(1 for u in reqs if BASE in u)
        check(home_bytes <= 6, f'trang chủ chỉ {home_bytes} request nội bộ')
        pg.locator('.chapter[data-ch="4"] .ch-header').click()
        check(pg.locator('.chapter[data-ch="4"]').evaluate('e=>e.classList.contains("open")'), 'mở chương 4 (accordion)')
        check(pg.locator('.chapter[data-ch="4"] a.art-row').count() == 19 and pg.locator('.chapter[data-ch="4"] a.xl-i').count() == 79, 'chương 4: 19 vùng · 79 dự án')
        pg.locator('.chapter[data-ch="4"] a.xl-i', has_text='The MarQ').first.click(); pg.wait_for_load_state()
        check(pg.url.endswith('/cam-nang/the-marq/'), 'bấm chip dự án → /cam-nang/the-marq/')
        pg.go_back(); pg.wait_for_load_state()
        check(pg.locator('.chapter[data-ch="4"]').evaluate('e=>e.classList.contains("open")'), 'Back → trang chủ, chương 4 vẫn mở')
        pg.go_forward(); pg.wait_for_load_state()
        check(pg.url.endswith('/cam-nang/the-marq/'), 'Forward → lại bài The MarQ')
        pg.reload(); check(pg.locator('#pBody h1').count() == 1, 'refresh bài vẫn đúng nội dung')
        pg.goto(BASE + '/'); pg.fill('#searchInput', 'metro'); pg.wait_for_timeout(700)
        n = pg.locator('#searchResults a.s-item').count(); check(n > 0, f'tìm "metro" → {n} kết quả')
        pg.fill('#searchInput', 'thu thiem'); pg.wait_for_timeout(500)
        check(pg.locator('#searchResults a.s-item').count() > 0, 'tìm không dấu "thu thiem" có kết quả')
        pg.locator('#searchResults a.s-item').first.click(); pg.wait_for_load_state()
        check('/cam-nang/' in pg.url, 'bấm kết quả tìm kiếm → mở trang bài')
        pg.locator('#pClose').click(); pg.wait_for_load_state()
        check(pg.url.rstrip('/') == BASE, 'nút ✕ quay lại trang chủ')
        pg.goto(BASE + '/#marq'); pg.wait_for_url('**/cam-nang/the-marq/'); check(True, 'link cũ /#marq → /cam-nang/the-marq/')
        pg.goto(BASE + '/?bai=faq'); pg.wait_for_url('**/cam-nang/phap-luat-bds/'); check(True, 'link cũ ?bai=faq (bản GPT) → /cam-nang/phap-luat-bds/')
        pg.goto(BASE + '/cam-nang/phap-luat-bds/')
        item = pg.locator('.faq-item').first; item.click()
        check(item.evaluate('e=>e.classList.contains("open")'), 'FAQ mở/đóng hoạt động')
        pg.goto(BASE + '/cam-nang/22-nguyen-tac-tu-duy-dau-tu-bds/')
        btn = pg.locator('.tag-btn').nth(1); btn.click()
        check('Hiển thị' in (pg.locator('#tag-count').text_content() or ''), 'bộ lọc 22 nguyên tắc hoạt động')
        pg.goto(BASE + '/cam-nang/vung-loi-thu-thiem/')
        pg.locator('#pBody a.xl-b[href*="/cam-nang/"]').first.click(); pg.wait_for_load_state()
        check('/cam-nang/' in pg.url and not pg.url.endswith('/vung-loi-thu-thiem/'), 'link trong bài (vùng → dự án) hoạt động')
        pg.go_back(); pg.wait_for_load_state(); check(pg.url.endswith('/vung-loi-thu-thiem/'), 'Back giữa các bài')
        sw = pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
        check(sw, 'không tràn ngang')
        pg.goto(BASE + '/atlas/'); check(pg.locator('h1', has_text='World Atlas').count() == 1 and pg.locator('.rei-global-nav__link.is-active', has_text='World Atlas').count() == 1, '/atlas/ hoạt động, menu đúng mục')
        check(pg.locator('.edition-empty').count() == 1, 'Atlas: bản nháp không hiện trong thư viện')
        pg.goto(BASE + '/nhat-san/so-00-demo/'); check('noindex' in (pg.locator('meta[name=robots]').get_attribute('content') or '') and pg.locator('.pub-draft').count() == 1, 'kỳ nháp Nhật san: xem được qua link, gắn noindex')
        pg.locator('a.pub-btn', has_text='Đọc trực tuyến').click(); pg.wait_for_load_state()
        check('/nhat-san/so-00-demo/doc/' in pg.url and pg.evaluate("Promise.all([...document.images].map(i=>{i.loading='eager';return i.complete?0:new Promise(r=>{i.onload=i.onerror=r})})).then(()=>[...document.images].every(i=>i.naturalWidth>0))"), 'Đọc trực tuyến: mở bản HTML, ảnh đã tách khỏi Base64 hiển thị đủ')
        pg.goto(BASE + '/cam-nang/the-marq/'); pg.locator('#copyArticleLink').click(); pg.wait_for_timeout(300)
        check((pg.locator('#articleLinkStatus').text_content() or '') != '', 'nút "Sao chép liên kết" phản hồi')
        os.makedirs('/tmp/shots', exist_ok=True)
        pg.goto(BASE + '/'); pg.screenshot(path=f'/tmp/shots/home-{label}.png')
        pg.goto(BASE + '/cam-nang/the-marq/'); pg.wait_for_load_state('networkidle'); pg.screenshot(path=f'/tmp/shots/marq-{label}.png')
        check(not errs, 'không lỗi console / request' + ('' if not errs else ': ' + '; '.join(errs[:5])))
        ctx.close()

    print('\n== Toàn bộ trang bài ==')
    ctx = br.new_context(viewport={'width': 390, 'height': 844}); ctx.route(re.compile(r'fonts\.(googleapis|gstatic)\.com'), lambda r: r.abort()); pg = ctx.new_page()
    bad = []; errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('requestfailed', lambda r: not any(i in r.url for i in IGNORE) and 'ERR_ABORTED' not in (r.failure or '') and errs.append('FAILED ' + r.url + ' ' + str(r.failure)))
    for a in arts:
        r = pg.goto(f"{BASE}/cam-nang/{a['slug']}/")
        if r.status != 200: bad.append(f"{a['slug']} HTTP {r.status}"); continue
        og = pg.locator('meta[property="og:image"]').get_attribute('content')
        if not og or not pg.locator('meta[property="og:title"]').count(): bad.append(a['slug'] + ' thiếu OG')
        pg.evaluate("Promise.all([...document.images].map(i=>{i.loading='eager';return i.complete?0:new Promise(r=>{i.onload=i.onerror=r})}))")
        broken = pg.evaluate("[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)")
        if broken: bad.append(f"{a['slug']} ảnh lỗi {broken[:2]}")
    check(not bad, f'{len(arts)} trang bài: HTTP 200, có OG, không ảnh lỗi' + ('' if not bad else ': ' + '; '.join(bad[:8])))
    check(not errs, 'không lỗi JS/request trên toàn bộ trang bài' + ('' if not errs else ': ' + '; '.join(errs[:5])))
    # link nội bộ & og image tồn tại
    import urllib.request
    links = set()
    for a in arts:
        h = open(os.path.join(ROOT, 'dist/cam-nang', a['slug'], 'index.html'), encoding='utf-8').read()
        links |= set(re.findall(r'href="(/[^"#?]*)"', h))
        links |= {u.replace('https://nguyenanhtu.vn', '') for u in re.findall(r'content="(https://nguyenanhtu\.vn/assets/[^"]+)"', h)}
    dead = []
    for l in sorted(links):
        try: urllib.request.urlopen(BASE + l).read(1)
        except Exception as e: dead.append(l)
    check(not dead, f'{len(links)} link nội bộ + ảnh OG đều tồn tại' + ('' if not dead else ': ' + ', '.join(dead[:8])))
    print('\n== Xuất PDF ==')
    ctx = br.new_context(); pg = ctx.new_page()   # không chặn font: route() của Playwright làm hỏng ảnh trong cửa sổ popup
    pg.goto(BASE + '/cam-nang/nam-mekong-grand-plaza/')
    pg.evaluate("window.open=(function(o){return function(){const w=o.apply(window,arguments);w.print=()=>{window.__st=[w.document.title,[...w.document.images].every(i=>i.complete&&i.naturalWidth>0),w.document.images.length]};w.close=()=>{};return w}})(window.open)")
    pg.click('#exportPdfBtn'); pg.wait_for_function('window.__st', timeout=20000)
    st = pg.evaluate('window.__st')
    check(st[0] == 'Nam Mekong Grand Plaza' and st[1] and st[2] > 0, f'PDF: đúng tiêu đề, đủ {st[2]} ảnh khi in')
    br.close()
print('\nKẾT QUẢ:', 'ĐẠT' if not fails else f'{len(fails)} lỗi')
sys.exit(1 if fails else 0)
