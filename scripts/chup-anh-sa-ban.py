#!/usr/bin/env python3
"""Chụp ảnh đại diện giỏ hàng từ khối 3D của sa bàn (PROJECT_RULES §17).

Mở sa bàn ở chế độ ?chup=1 (ẩn giao diện, góc nhìn ra biển ở độ cao cho trước), chờ ảnh vệ tinh
z18 nạp xong, rồi ghi:
  anh-dai-dien.webp      1200 x 600 — thẻ dự án ở trang Tìm nhà (khung 2:1)
  anh-dai-dien-640.webp   640 x 320 — bản nhẹ cho điện thoại
  anh-chia-se.jpg        1200 x 630 — ảnh xem trước khi dán link lên Facebook, Zalo

Cần một máy chủ đang phục vụ bản build có /api/nen (wrangler pages dev, hoặc trang thật).
Dùng:
  python3 scripts/chup-anh-sa-ban.py https://nguyenanhtu.vn/assets/tools/casa-blanca/blanca.html assets/tools/casa-blanca
  python3 scripts/chup-anh-sa-ban.py <url> <thu-muc> --docao 500 --gio 9
Cần: playwright (chromium), pillow.
"""
import argparse, io, pathlib, sys, time
from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url'); ap.add_argument('thu_muc')
    ap.add_argument('--docao', type=int, default=1000)
    ap.add_argument('--gio', type=float, default=14, help='giờ Việt Nam đặt nắng khi chụp (mặc định 14:00)')
    ap.add_argument('--cho', type=int, default=120, help='giây tối đa chờ ảnh nền')
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    sep = '&' if '?' in a.url else '?'
    url = f'{a.url}{sep}chup=1&docao={a.docao}&gio={a.gio:g}'
    out = pathlib.Path(a.thu_muc); out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': 1600, 'height': 840}, device_scale_factor=1)
        loi = []; pg.on('pageerror', lambda e: loi.append(str(e)))
        pg.goto(url, timeout=90000)
        t0 = time.time()
        while time.time() - t0 < a.cho:
            if pg.evaluate('() => !!window.__sanSangChup'): break
            pg.wait_for_timeout(1000)
        else:
            sys.exit('Hết giờ chờ ảnh nền. Kiểm tra /api/nen và mạng.')
        z = pg.evaluate('() => window.__blanca && window.__blanca.osm ? window.__blanca.osm.zoom : 0')
        pg.wait_for_timeout(2500)                                   # cho khung hình cuối vẽ xong
        png = pg.locator('#gl').screenshot(type='png')
        b.close()
    if loi: print('Cảnh báo lỗi JS:', loi[:2], file=sys.stderr)
    im = Image.open(io.BytesIO(png)).convert('RGB')
    W, H = im.size

    def cat(r):                                                     # cắt giữa theo tỷ lệ r = rộng/cao
        if W / H > r: w = int(H * r); x = (W - w) // 2; return im.crop((x, 0, x + w, H))
        h = int(W / r); y = max(0, (H - h) // 2 - int(H * .04)); return im.crop((0, y, W, y + h))
    the = cat(2.0)
    the.resize((1200, 600), Image.LANCZOS).save(out / 'anh-dai-dien.webp', quality=82, method=6)
    the.resize((640, 320), Image.LANCZOS).save(out / 'anh-dai-dien-640.webp', quality=78, method=6)
    cat(1200 / 630).resize((1200, 630), Image.LANCZOS).save(out / 'anh-chia-se.jpg', quality=84, optimize=True, progressive=True)
    for f in ('anh-dai-dien.webp', 'anh-dai-dien-640.webp', 'anh-chia-se.jpg'):
        print(f'{out / f}  {(out / f).stat().st_size // 1024} KB')
    print(f'Ảnh nền mức z{z}, góc nhìn {a.docao} m ra biển.')
    if z < 18: print('CẢNH BÁO: ảnh nền chưa lên z18, ảnh đại diện sẽ kém nét.', file=sys.stderr)


if __name__ == '__main__':
    main()
