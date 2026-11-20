#!/usr/bin/env python3
"""Kiểm thử khung sa bàn đã khoá (PROJECT_RULES §17.6): xem căn → giá cuối theo phương thức → phiếu tính giá
   và cân đối tài chính → chọn căn → chat Zalo có điều kiện → phiếu cho tư vấn.
   Chạy:  node scripts/build.mjs && python3 tests/sa_ban_luong.py [assets/tools/casa-blanca/blanca.html]
   Tự dựng máy chủ thử trên dist/ (giả lập POST /api/tim-nha), không cần mạng. Cần Playwright + Chromium.
   Dữ liệu căn, chính sách, layout lấy từ thư mục của trang, nên dùng được cho mọi dự án dựng theo khung."""
import sys, os, json, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
TRANG = (sys.argv[1] if len(sys.argv) > 1 else 'assets/tools/casa-blanca/blanca.html').lstrip('/')
NHAN = []   # phiếu POST /api/tim-nha nhận được

class May(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('content-length') or 0); raw = self.rfile.read(n)
        if self.path != '/api/tim-nha': self.send_error(404); return
        try: d = json.loads(raw)
        except Exception: d = None
        NHAN.append(d)
        ok = bool(d) and (d.get('kind') != 'thamvan' or bool(d.get('units')))
        b = json.dumps({'ok': ok, 'stored': ok, 'id': (d or {}).get('maPhieu') or 'TTEST'}).encode()
        self.send_response(200 if ok else 400); self.send_header('content-type', 'application/json')
        self.send_header('content-length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def log_message(self, *a): pass

socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(May, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d' % srv.server_address[1]
URL = BASE + '/' + TRANG
DUNG = "(()=>{const b=window.__blanca; Object.assign(b.C,b.T); if(b.VT) b.VT.t=b.VT.dich; })()"   # máy thử chậm: đưa camera tới đích ngay

fails = []
def check(c, m):
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c: fails.append(m)

with sync_playwright() as p:
    br = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'])
    for nhan, vp, mob in [('desktop', {'width': 1366, 'height': 900}, False), ('mobile', {'width': 390, 'height': 844}, True)]:
        print('\n== ' + nhan + ' ==')
        ctx = br.new_context(viewport=vp, is_mobile=mob, has_touch=mob)
        ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=BASE)
        ctx.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())   # không ra mạng ngoài
        ctx.route('https://zalo.me/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Zalo</title>'))   # đăng ký sau nên được ưu tiên
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_function('window.__blanca && window.__blanca.CS && window.__blanca.CS()', timeout=60000)
        pg.wait_for_timeout(1500); pg.evaluate(DUNG)
        J = pg.evaluate
        # 1. bộ tính trên toàn bộ quỹ
        r = J("""(()=>{const b=__blanca, out={n:0,lech:[],khongLayout:[],khongCS:[]}; const hom=BanTinh.homNay();
          for(const k of b.CAN().can){ const o=b.timCan(k.ma); if(!o){out.lech.push(k.ma+' không tìm được'); continue;}
            if(!b.layoutCua(o)) out.khongLayout.push(k.ma);
            const pol=b.CS().khu[o.khu]; if(!pol){out.khongCS.push(k.ma); continue;}
            for(const pt of BanTinh.ptttHieuLuc(pol,hom)) for(const tl of [pol.htls?pol.htls.tyLeVay:.7,.5]){
              const ph=BanTinh.phieu(k.gia,o.loai,pol,pt,{ngayKy:hom,tyLeVay:tl}); out.n++;
              if(ph.tienDo.tong!==ph.gia.T) out.lech.push(k.ma+' '+pt.id+' lệch '+(ph.gia.T-ph.tienDo.tong));
              if(ph.tienDo.rows.some(x=>x.so<0)) out.lech.push(k.ma+' '+pt.id+' có đợt âm'); } }
          return out})()""")
        check(r['n'] > 0 and not r['lech'], f"{r['n']} phiếu (mọi căn trong quỹ × mọi phương thức): tổng tiến độ = tổng giá trị, không đợt âm {r['lech'][:3]}")
        check(not r['khongCS'], f"mọi căn trong quỹ có chính sách bán hàng {r['khongCS'][:3]}")
        check(not r['khongLayout'], f"mọi căn trong quỹ có layout chính thức {r['khongLayout'][:3]}")
        ma = J("(()=>{const b=__blanca; const k=b.CAN().can.find(x=>x.tinhTrang==='trong'&&b.CS().khu[x.phanKhu]); return k&&k.ma})()")
        ma2 = J("(()=>{const b=__blanca; const k=b.CAN().can.filter(x=>x.tinhTrang==='trong'&&b.CS().khu[x.phanKhu]).find(x=>x.ma!==%s); return k&&k.ma})()" % json.dumps(ma))
        check(bool(ma and ma2), f'có ít nhất hai căn còn trống để thử ({ma}, {ma2})')
        # 2. chat bị khoá khi chưa chọn căn
        pops = []; ctx.on('page', lambda np: pops.append(np))
        nut = "(()=>{const r=document.querySelector('#flow [data-chat]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()"
        check(J("document.querySelector('#flow [data-chat]').getAttribute('aria-disabled')") == 'true', 'nút Chat Zalo khoá khi chưa chọn căn')
        pg.mouse.click(*J(nut)); pg.wait_for_timeout(500)
        check(not pops and not NHAN, 'bấm chat khi chưa chọn căn: không mở Zalo, không gửi gì')
        # 3. thẻ căn
        J("__blanca.moCan(%s)" % json.dumps(ma)); pg.evaluate(DUNG); pg.wait_for_timeout(1200)
        check(J("!!document.querySelector('#theCan figure.lay img[src^=\"layout/\"]')"), f'{ma}: thẻ căn có layout chính thức từ hồ sơ')
        n_pt = J("document.querySelectorAll('#theCan button.pt').length")
        check(n_pt >= 1, f'{ma}: có {n_pt} ô giá cuối theo phương thức thanh toán')
        if mob: check(J("(()=>{const p=document.querySelector('#pane').getBoundingClientRect(),c=document.querySelector('#theCan').getBoundingClientRect();return c.top>=p.top-2&&c.top<p.top+60})()"), 'điện thoại: chọn căn xong cuộn tới thẻ căn')
        for i in range(n_pt):
            J("document.querySelectorAll('#theCan button.pt')[%d].click()" % i); pg.wait_for_timeout(500)
            t = pg.locator('#phieu').inner_text()
            ok = all(s in t for s in ['PHIẾU TÍNH GIÁ', 'THÔNG TIN GIÁ & CHÍNH SÁCH', 'TIẾN ĐỘ THANH TOÁN', 'TỔNG GIÁ TRỊ THANH TOÁN', 'CÂN ĐỐI TÀI CHÍNH'])
            pid = J("document.querySelectorAll('#theCan button.pt')[%d].dataset.pttt" % i)
            khop = J("""(()=>{const t=[...document.querySelectorAll('#phieu table.ph-t tr.tong')].map(tr=>tr.lastElementChild.innerText.replace(/\\D/g,'')); return t.length===2 && t[0]!=='' && t[0]===t[1]})()""")
            check(ok and khop, f'phương thức {pid}: phiếu đủ các phần như bản tính dự án, tổng tiến độ = tổng giá trị')
            check(J("document.querySelector('#pane').scrollWidth<=document.querySelector('#pane').clientWidth+1"), f'phương thức {pid}: phiếu vừa khung, không tràn ngang')
            if pid == 'vay': check('0 đ/tháng' in t and 'Dòng tiền theo năm' in t, 'phương án vay có cân đối: tháng hỗ trợ lãi, dòng tiền theo năm')
        J("document.querySelector('#theCan [data-chon]').click()"); pg.wait_for_timeout(300)
        J("__blanca.moCan(%s)" % json.dumps(ma2)); pg.evaluate(DUNG); pg.wait_for_timeout(1000)
        J("document.querySelector('#theCan [data-chon]').click()"); pg.wait_for_timeout(300)
        check(J("document.querySelector('#flow [data-chat]').getAttribute('aria-disabled')") == 'false', 'chọn căn xong nút chat mở khoá')
        # 4. chat
        pg.mouse.click(*J(nut)); pg.wait_for_timeout(1500)
        check(len(pops) == 1 and pops[0].url.startswith('https://zalo.me/'), f'mở Zalo của tư vấn ({[x.url for x in pops]})')
        clip = J("navigator.clipboard.readText()")
        check(ma in clip and ma2 in clip and '#phieu=' in clip, 'đã sao chép bản tóm tắt có đủ căn và link phiếu')
        b = NHAN[-1] if NHAN else {}
        check(b.get('kind') == 'thamvan' and len(b.get('units') or []) == 2 and '#phieu=' in (b.get('link') or ''), 'gửi phiếu thamvan cho tư vấn')
        check(not b.get('phone'), 'chat không gửi số điện thoại')
        # 5. tư vấn mở link phiếu
        pg2 = ctx.new_page(); pg2.on('pageerror', lambda e: errs.append('phiếu: ' + str(e)))
        pg2.goto(b.get('link', URL)); pg2.wait_for_timeout(2500)
        t = pg2.locator('#pane').inner_text()
        check('Phiếu tham vấn' in t and ma in t and ma2 in t, 'link phiếu mở đúng các căn khách chọn')
        pg2.close()
        check(not errs, 'không lỗi JS: ' + '; '.join(errs[:3]))
        ctx.close(); NHAN.clear()
    br.close()
srv.shutdown()
print('\n' + ('TẤT CẢ ĐẠT' if not fails else f'{len(fails)} LỖI: ' + ' | '.join(fails)))
sys.exit(1 if fails else 0)
