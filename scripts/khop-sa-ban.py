#!/usr/bin/env python3
"""Khớp sa bàn dự án lên ảnh vệ tinh — công cụ chuẩn cho mọi dự án (PROJECT_RULES §17).

Tổng mặt bằng là ảnh, không mang toạ độ. Định vị nó lên bản đồ thật qua ba tầng,
tầng sau chỉ làm khi tầng trước đã xong:

  1. KHUNG  hai mốc trên công trình ĐÃ THI CÔNG, cách xa nhau, giải ra hướng Bắc,
            tỷ lệ, vị trí (scripts/dinh-vi-sa-ban.mjs). Nếu có bảng toạ độ VN-2000
            trong quy hoạch 1/500 thì dùng lệnh `vn2000` đổi ra KML rồi giải từ đó —
            đây là nguồn chính xác nhất, nên xin chủ đầu tư trước tiên.
  2. DỊCH   tinh chỉnh tịnh tiến bằng tương quan lưới lô với nền móng trên ảnh vệ tinh,
            CHỈ trong cửa sổ hẹp quanh kết quả tầng 1. Chỉ nhận khi các đỉnh tương quan
            cao nhất tụ chặt; lưới lô lặp đều nên cửa sổ rộng sẽ bắt nhầm sang dãy bên cạnh.
  3. NGHIỆM THU  soi từng khối trên ảnh vệ tinh đã đưa về khung bản vẽ, có lưới đo.
            Bắt buộc, vì tổng mặt bằng tiếp thị không vẽ đúng tỷ lệ bên trong: khớp
            được góc này vẫn có thể lệch góc kia. Ghi rõ khối nào khớp, khối nào không
            kiểm được.

Đã thử và loại (đừng làm lại): đọc hướng Bắc từ hoa gió in trên bản vẽ; ghim đặt
trên công trình chưa xây; dò khớp tự động toàn ảnh, theo vùng, theo từng khối — ảnh
công trường xây dở và lưới lô lặp đều làm tương quan có nhiều đỉnh ngang nhau.

Dùng (thư mục công cụ chứa plan.webp, geometry.json, georef.json, ranh-du-an.json):
  python3 scripts/khop-sa-ban.py anh   assets/tools/casa-blanca            # tải ảnh vệ tinh z18
  python3 scripts/khop-sa-ban.py dich  assets/tools/casa-blanca [--ghi]    # tinh chỉnh tịnh tiến
  python3 scripts/khop-sa-ban.py khung assets/tools/casa-blanca            # ảnh nghiệm thu toàn khu
  python3 scripts/khop-sa-ban.py soi   assets/tools/casa-blanca [x,y ...]  # soi từng khối, có lưới
  python3 scripts/khop-sa-ban.py vn2000 diem.csv --ktt 107-45 > moc.kml    # toạ độ VN-2000 -> KML

Ảnh vệ tinh lấy theo mẫu đường dẫn ở biến NEN_TILE_URL ({z} {x} {y}), mặc định Esri
World Imagery. Kết quả trung gian để ở thư mục --ra (mặc định ./.sa-ban), không đưa vào kho.

Cần: python3, numpy, opencv-python, pillow; lệnh vn2000 cần thêm pyproj.
"""
import argparse, hashlib, json, math, os, pathlib, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

R = math.pi / 180
ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
# Kinh tuyến trục VN-2000 múi 3° -> mã EPSG. Bản vẽ quy hoạch luôn ghi KTT ở khung tên; đối chiếu trước khi dùng.
KTT_EPSG = {'103-00': 9205, '104-00': 9206, '104-30': 9207, '104-45': 9208, '105-30': 9209, '105-45': 9210,
            '106-00': 9211, '106-15': 9212, '106-30': 9213, '107-00': 9214, '107-15': 9215, '107-30': 9216,
            '107-45': 5899, '108-15': 9217, '108-30': 9218}


# ---------------------------------------------------------------- phép chiếu
class Chieu:
    """Khớp với geo.init trong showroom.js: Bắc lệch `bac` độ thuận kim đồng hồ so với trục dọc ảnh."""
    def __init__(self, g):
        self.bac = g['huong']['bacSoVoiTrucDocAnh'] * R
        self.mpu = g['tyLe']['metTrenDonVi']
        self.lat0, self.lon0 = g['neo']['lat'], g['neo']['lon']
        self.px0, self.py0 = g['neo']['planX'], g['neo']['planY']
        self.mLat = 111132.92 - 559.82 * math.cos(2 * self.lat0 * R) + 1.175 * math.cos(4 * self.lat0 * R)
        self.mLon = 111412.84 * math.cos(self.lat0 * R) - 93.5 * math.cos(3 * self.lat0 * R)

    def ll(self, x, y):
        import numpy as np
        dx = (np.asarray(x) - self.px0) * self.mpu
        dy = -(np.asarray(y) - self.py0) * self.mpu
        c, s = math.cos(self.bac), math.sin(self.bac)
        return self.lat0 + (dy * c + dx * s) / self.mLat, self.lon0 + (dx * c - dy * s) / self.mLon


def doc_thu_muc(d):
    d = pathlib.Path(d)
    g = json.loads((d / 'georef.json').read_text(encoding='utf-8'))
    geo = json.loads((d / 'geometry.json').read_text(encoding='utf-8'))
    ranh = json.loads((d / 'ranh-du-an.json').read_text(encoding='utf-8'))
    pts = ranh.get('dinh') or ranh.get('diem') or ranh.get('toaDo')
    return g, geo, pts


# ---------------------------------------------------------------- ảnh vệ tinh
def tile_xy(lat, lon, n):
    import numpy as np
    lat = np.asarray(lat); lon = np.asarray(lon)
    return (lon + 180) / 360 * n, (1 - np.log(np.tan(lat * R) + 1 / np.cos(lat * R)) / math.pi) / 2 * n


def tai_anh(d, ra, z, url):
    from PIL import Image
    _, _, pts = doc_thu_muc(d)
    las = [p[0] for p in pts]; los = [p[1] for p in pts]; n = 2 ** z
    x0, _ = tile_xy(max(las), min(los), n); x1, _ = tile_xy(min(las), max(los), n)
    _, y0 = tile_xy(max(las), min(los), n); _, y1 = tile_xy(min(las), max(los), n)
    x0, x1, y0, y1 = int(x0) - 1, int(x1) + 1, int(y0) - 1, int(y1) + 1
    cache = pathlib.Path(os.path.expanduser('~/.cache/sa-ban/tiles')); cache.mkdir(parents=True, exist_ok=True)
    def lay(xy):
        x, y = xy; f = cache / f'{hashlib.md5(url.encode()).hexdigest()[:8]}_{z}_{x}_{y}.jpg'
        if not f.exists():
            try:
                req = urllib.request.Request(url.format(z=z, x=x, y=y), headers={'user-agent': 'nguyenanhtu.vn sa-ban'})
                f.write_bytes(urllib.request.urlopen(req, timeout=40).read())
            except Exception:
                return None
        return x, y, f
    jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    with ThreadPoolExecutor(8) as ex:
        kq = list(ex.map(lay, jobs))
    im = Image.new('RGB', ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    ok = 0
    for r in kq:
        if r:
            x, y, f = r
            try: im.paste(Image.open(f), ((x - x0) * 256, (y - y0) * 256)); ok += 1
            except Exception: pass
    ra.mkdir(parents=True, exist_ok=True)
    im.save(ra / f'vetinh-z{z}.png')
    m_px = 40075016.686 * math.cos(sum(las) / len(las) * R) / n / 256
    (ra / f'vetinh-z{z}.json').write_text(json.dumps({'z': z, 'x0': x0, 'y0': y0, 'mpx': m_px}))
    print(f'Ghép {ok}/{len(jobs)} ô z{z} ({m_px:.2f} m/điểm ảnh) -> {ra / f"vetinh-z{z}.png"}')
    if ok < len(jobs) * 0.9:
        print('CẢNH BÁO: thiếu hơn 10% số ô, kết quả khớp sẽ kém tin cậy.', file=sys.stderr)


def nap_anh(ra, z):
    import numpy as np
    from PIL import Image
    meta = json.loads((ra / f'vetinh-z{z}.json').read_text())
    S = np.asarray(Image.open(ra / f'vetinh-z{z}.png').convert('RGB'))
    return S, meta


def ve_khung_lo(geo, ch, K, XA, YA, W, H):
    """Thân nhà từng căn raster trong khung bản vẽ, K điểm ảnh mỗi đơn vị."""
    import numpy as np
    M = np.zeros((H, W), np.uint8)
    for q in geo:
        bw = (q.get('bodyWidth') or q.get('front') or 7) / ch.mpu / 2
        bd = (q.get('bodyDepth') or q.get('depth') or 14) / ch.mpu / 2
        if q.get('vertical'): bw, bd = bd, bw
        x0 = int((q['x'] - bw - XA) * K); x1 = int((q['x'] + bw - XA) * K)
        y0 = int((q['y'] - bd - YA) * K); y1 = int((q['y'] + bd - YA) * K)
        M[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = 1
    return M


def ve_tinh_ve_khung(S, meta, ch, XA, XB, YA, YB, K):
    """Đưa ảnh vệ tinh về khung toạ độ bản vẽ: dãy nhà nằm ngang như trên tổng mặt bằng."""
    import numpy as np, cv2
    W = int((XB - XA) * K); H = int((YB - YA) * K)
    u, v = np.meshgrid(np.arange(W), np.arange(H))
    lat, lon = ch.ll(XA + u / K, YA + v / K)
    tx, ty = tile_xy(lat, lon, 2 ** meta['z'])
    mx = ((tx - meta['x0']) * 256).astype(np.float32); my = ((ty - meta['y0']) * 256).astype(np.float32)
    return cv2.remap(S, mx, my, cv2.INTER_LINEAR, borderValue=(0, 0, 0))


def khung_lo(geo, pad=8):
    xs = [q['x'] for q in geo]; ys = [q['y'] for q in geo]
    return min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad


# ---------------------------------------------------------------- lệnh dich
def dich(d, ra, z, ban_kinh, ghi):
    import numpy as np, cv2
    from PIL import Image, ImageDraw
    g, geo, pts = doc_thu_muc(d); ch = Chieu(g)
    S, meta = nap_anh(ra, z); n = 2 ** z; mpx = meta['mpx']
    L = S.mean(2); sat = S.max(2).astype(int) - S.min(2)
    nen = ((L > 125) & (sat < 45)).astype(np.float32)           # sàn bê tông, mái sáng
    nen = cv2.morphologyEx(nen, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    H, W = nen.shape
    mo = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(mo)
    for q in geo:
        bw = (q.get('bodyWidth') or 7) / ch.mpu / 2; bd = (q.get('bodyDepth') or 14) / ch.mpu / 2
        if q.get('vertical'): bw, bd = bd, bw
        quad = []
        for sx, sy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            la, lo = ch.ll(q['x'] + sx * bw, q['y'] + sy * bd); X, Y = tile_xy(la, lo, n)
            quad.append(((float(X) - meta['x0']) * 256, (float(Y) - meta['y0']) * 256))
        dr.polygon(quad, fill=255)
    Mo = np.asarray(mo).astype(np.float32) / 255
    ys, xs = np.nonzero(Mo); pad = int(60 / mpx)
    y1, y2 = max(0, ys.min() - pad), min(H, ys.max() + pad); x1, x2 = max(0, xs.min() - pad), min(W, xs.max() + pad)
    A = nen[y1:y2, x1:x2]; Bm = Mo[y1:y2, x1:x2]
    An = (A - A.mean()) / (A.std() + 1e-9); Bn = (Bm - Bm.mean()) / (Bm.std() + 1e-9)
    cc = np.fft.irfft2(np.fft.rfft2(An) * np.conj(np.fft.rfft2(Bn)), An.shape) / An.size
    K = int(ban_kinh / mpx)
    cand = sorted(((float(cc[dy % cc.shape[0], dx % cc.shape[1]]), dx, dy)
                   for dy in range(-K, K + 1) for dx in range(-K, K + 1)), reverse=True)
    v0 = float(cc[0, 0]); best = cand[0]
    top = cand[:10]
    spread = max(math.hypot((a[1] - best[1]) * mpx, (a[2] - best[2]) * mpx) for a in top)
    dE, dS = best[1] * mpx, best[2] * mpx
    tai_bien = abs(best[1]) >= K - 1 or abs(best[2]) >= K - 1
    print(f'Tương quan tại chỗ: {v0:.4f} | cao nhất: {best[0]:.4f} (gấp {best[0] / max(v0, 1e-9):.2f} lần)')
    print(f'Đề xuất dời mô hình {dE:+.1f} m Đông, {dS:+.1f} m Nam | 10 đỉnh cao nhất tụ trong {spread:.1f} m'
          + (' | CHẠM BIÊN cửa sổ' if tai_bien else ''))
    tin = spread <= 3.0 and not tai_bien and best[0] >= 1.5 * v0
    if math.hypot(dE, dS) < 1.5:
        print('Đã hội tụ: lệch tịnh tiến dưới 1,5 m. Không cần dời.'); return
    if not tin:
        print('KHÔNG NHẬN: đỉnh không tụ, chạm biên, hoặc tăng chưa đủ 1,5 lần. Giữ nguyên phép chiếu, '
              'chuyển sang nghiệm thu bằng mắt (lệnh soi) hoặc thêm mốc.'); return
    if ghi:
        p = pathlib.Path(d) / 'georef.json'
        g['neo']['lat'] = round(ch.lat0 - dS / ch.mLat, 6); g['neo']['lon'] = round(ch.lon0 + dE / ch.mLon, 6)
        p.write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'Đã ghi điểm neo mới vào {p}: {g["neo"]["lat"]}, {g["neo"]["lon"]}')
    else:
        print('(Thêm --ghi để ghi vào georef.json)')


# ---------------------------------------------------------------- lệnh khung, soi
def khung(d, ra, z, K=4.0):
    import numpy as np, cv2
    from PIL import Image
    g, geo, _ = doc_thu_muc(d); ch = Chieu(g); S, meta = nap_anh(ra, z)
    XA, XB, YA, YB = khung_lo(geo)
    w = ve_tinh_ve_khung(S, meta, ch, XA, XB, YA, YB, K).copy()
    M = ve_khung_lo(geo, ch, K, XA, YA, w.shape[1], w.shape[0])
    cs, _ = cv2.findContours(M, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(w, cs, -1, (255, 0, 255), 1)
    out = ra / 'nghiem-thu-khung.png'; Image.fromarray(w).save(out)
    np.save(ra / 'khung-ve-tinh.npy', w); (ra / 'khung.json').write_text(json.dumps([XA, XB, YA, YB, K]))
    print(f'Ảnh vệ tinh trong khung bản vẽ, có viền thân nhà mô hình -> {out}')


def soi(d, ra, z, diem, so_tu_dong=9, K=4.0):
    import numpy as np, cv2
    from PIL import Image, ImageDraw, ImageFont
    g, geo, _ = doc_thu_muc(d); ch = Chieu(g); S, meta = nap_anh(ra, z)
    XA, XB, YA, YB = khung_lo(geo)
    w = ve_tinh_ve_khung(S, meta, ch, XA, XB, YA, YB, K)
    M = ve_khung_lo(geo, ch, K, XA, YA, w.shape[1], w.shape[0])
    if not diem:                                   # tự rải đều các khối có nhiều căn
        xs = np.array([q['x'] for q in geo]); ys = np.array([q['y'] for q in geo])
        qx = np.quantile(xs, np.linspace(.1, .9, int(round(so_tu_dong ** .5))))
        qy = np.quantile(ys, np.linspace(.1, .9, int(round(so_tu_dong ** .5))))
        for a in qx:
            for b in qy:
                i = int(np.argmin((xs - a) ** 2 + (ys - b) ** 2)); diem.append((xs[i], ys[i]))
    try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    except Exception: F = None
    tiles = []
    for k, (cx, cy) in enumerate(diem):
        ww, hh, sc = 100, 44, 1.6
        x0 = int((cx - ww / 2 - XA) * K); y0 = int((cy - hh / 2 - YA) * K)
        im = w[max(0, y0):y0 + int(hh * K), max(0, x0):x0 + int(ww * K)].copy()
        mm = M[max(0, y0):y0 + int(hh * K), max(0, x0):x0 + int(ww * K)].copy()
        cs, _ = cv2.findContours(mm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(im, cs, -1, (255, 0, 255), 1)
        P = Image.fromarray(im).resize((int(im.shape[1] * sc), int(im.shape[0] * sc)), Image.LANCZOS)
        dr = ImageDraw.Draw(P)
        for gx in range(int(math.ceil(cx - ww / 2)), int(cx + ww / 2) + 1, 1):
            if gx % 2: continue
            X = (gx - (cx - ww / 2)) * K * sc
            dr.line([(X, 0), (X, 16 if gx % 10 == 0 else 7)], fill=(255, 255, 0))
            if gx % 10 == 0: dr.text((X + 2, 16), str(gx), fill=(255, 255, 0), font=F)
        for gy in range(int(math.ceil(cy - hh / 2)), int(cy + hh / 2) + 1, 1):
            if gy % 2: continue
            Y = (gy - (cy - hh / 2)) * K * sc
            dr.line([(0, Y), (16 if gy % 10 == 0 else 7, Y)], fill=(0, 255, 255))
            if gy % 10 == 0: dr.text((18, Y - 7), str(gy), fill=(0, 255, 255), font=F)
        dr.rectangle([0, P.height - 20, P.width, P.height], fill=(0, 0, 0))
        dr.text((6, P.height - 17), f'{k + 1}: khối quanh ({cx:.0f}, {cy:.0f})', fill=(255, 255, 255), font=F)
        tiles.append(P)
    cols = 3; rows = (len(tiles) + cols - 1) // cols
    tw = max(t.width for t in tiles); th = max(t.height for t in tiles)
    sheet = Image.new('RGB', (cols * tw + (cols - 1) * 6, rows * th + (rows - 1) * 6), (30, 30, 30))
    for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * (tw + 6), (i // cols) * (th + 6)))
    out = ra / 'nghiem-thu-khoi.png'; sheet.save(out)
    print(f'{len(tiles)} khối, lưới 2 đơn vị bản vẽ (≈ {2 * ch.mpu:.1f} m) -> {out}')
    print('Ghi vào biên bản nghiệm thu: khối khớp (lệch ≤ 1 ô), khối lệch (ghi số ô), khối không kiểm được (chưa xây rõ).')


# ---------------------------------------------------------------- lệnh vn2000
def vn2000(csv_path, ktt):
    import csv, pyproj, warnings
    warnings.filterwarnings('ignore')
    if ktt not in KTT_EPSG: sys.exit(f'Không biết kinh tuyến trục {ktt}. Có: {", ".join(KTT_EPSG)}')
    tf = pyproj.Transformer.from_crs(f'EPSG:{KTT_EPSG[ktt]}', 'EPSG:4326', always_xy=True)
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>',
           f'<name>Mốc VN-2000 KTT {ktt} (EPSG:{KTT_EPSG[ktt]})</name>']
    with open(csv_path, encoding='utf-8-sig') as f:
        for row in csv.reader(f):
            if len(row) < 3: continue
            ten, x, y = row[0].strip(), row[1], row[2]
            try: X = float(str(x).replace(',', '.')); Y = float(str(y).replace(',', '.'))
            except ValueError: continue                       # dòng tiêu đề
            lon, lat = tf.transform(Y, X)                      # VN-2000: X là Bắc, Y là Đông
            out.append(f'<Placemark><name>{ten}</name><Point><coordinates>{lon:.8f},{lat:.8f},0</coordinates></Point></Placemark>')
            print(f'{ten}: X={X:.3f} Y={Y:.3f} -> {lat:.8f}, {lon:.8f}', file=sys.stderr)
    out.append('</Document></kml>')
    print('\n'.join(out))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lenh', choices=['anh', 'dich', 'khung', 'soi', 'vn2000'])
    ap.add_argument('dich_den', help='thư mục công cụ dự án, hoặc file CSV với lệnh vn2000')
    ap.add_argument('diem', nargs='*', help='lệnh soi: tâm khối dạng x,y theo đơn vị bản vẽ')
    ap.add_argument('--z', type=int, default=18)
    ap.add_argument('--ra', default='.sa-ban')
    ap.add_argument('--ban-kinh', type=float, default=25.0, help='lệnh dich: bán kính tìm, mét')
    ap.add_argument('--ghi', action='store_true')
    ap.add_argument('--ktt', default='107-45')
    a = ap.parse_args()
    ra = pathlib.Path(a.ra)
    if a.lenh == 'anh': tai_anh(a.dich_den, ra, a.z, os.environ.get('NEN_TILE_URL') or ESRI)
    elif a.lenh == 'dich': dich(a.dich_den, ra, a.z, a.ban_kinh, a.ghi)
    elif a.lenh == 'khung': khung(a.dich_den, ra, a.z)
    elif a.lenh == 'soi': soi(a.dich_den, ra, a.z, [tuple(map(float, s.split(','))) for s in a.diem])
    elif a.lenh == 'vn2000': vn2000(a.dich_den, a.ktt)


if __name__ == '__main__':
    main()
