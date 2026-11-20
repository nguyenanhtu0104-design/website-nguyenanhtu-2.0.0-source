#!/usr/bin/env python3
"""Khớp sa bàn dự án lên ảnh vệ tinh — công cụ chuẩn cho mọi dự án (PROJECT_RULES §17).

Tổng mặt bằng là ảnh, không mang toạ độ. Định vị nó lên bản đồ thật qua bốn tầng,
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
  4. TỪNG KHỐI  không dán cả tổng mặt bằng: tách lô thành từng khối nhà (song lập, đơn
            lập, Grand Villa, nhà phố; tháp căn hộ riêng), đo vị trí thật của từng khối
            trên ảnh đã đưa về khung bản vẽ, rồi ghi cho mỗi khối một ghim (vĩ độ, kinh độ
            của tâm khối) và hệ số giãn. Trang sa bàn đặt khối theo ghim khi xem trên nền
            bản đồ; ở nền tổng mặt bằng khối vẫn nằm theo bản vẽ.
              tach  -> tách khối, ghi khung chọn lô vào georef.json > khoi
              do    -> gợi ý tinh chỉnh từng khối (dò trong ±5 đơn vị quanh số đọc tay);
                       CHỈ là gợi ý: phải soát bằng mắt, dãy nhà đều nhau dễ bắt nhầm
              dat   -> đọc bảng số đo (JSON) và ghi ghim, hệ số giãn của từng khối
              nghiemthu -> ảnh chồng toàn khu, độ phủ trước/sau, khoảng cách tới ghim căn

Đã thử và loại (đừng làm lại): đọc hướng Bắc từ hoa gió in trên bản vẽ; ghim đặt
trên công trình chưa xây; dò khớp tự động toàn ảnh, theo vùng, theo từng khối — ảnh
công trường xây dở và lưới lô lặp đều làm tương quan có nhiều đỉnh ngang nhau.

Dùng (thư mục công cụ chứa plan.webp, geometry.json, georef.json, ranh-du-an.json):
  python3 scripts/khop-sa-ban.py anh   assets/tools/casa-blanca            # tải ảnh vệ tinh z18
  python3 scripts/khop-sa-ban.py dich  assets/tools/casa-blanca [--ghi]    # tinh chỉnh tịnh tiến
  python3 scripts/khop-sa-ban.py khung assets/tools/casa-blanca            # ảnh nghiệm thu toàn khu
  python3 scripts/khop-sa-ban.py soi   assets/tools/casa-blanca [x,y ...]  # soi từng khối, có lưới
  python3 scripts/khop-sa-ban.py vn2000 diem.csv --ktt 107-45 > moc.kml    # toạ độ VN-2000 -> KML
  python3 scripts/khop-sa-ban.py tach  assets/tools/casa-blanca [--ghi]    # tách lô thành khối
  python3 scripts/khop-sa-ban.py do    assets/tools/casa-blanca bang.json  # gợi ý tinh chỉnh từng khối
  python3 scripts/khop-sa-ban.py dat   assets/tools/casa-blanca bang.json [--ghi]   # ghi ghim từng khối
  python3 scripts/khop-sa-ban.py nghiemthu assets/tools/casa-blanca [ghim-can.kml]  # nghiệm thu từng khối

Bảng số đo (bang.json) cho lệnh do/dat, toạ độ theo đơn vị bản vẽ trong khung ảnh vệ tinh
đã đưa về bản vẽ (ảnh của lệnh khung/soi):
  {"khoi": {"K08": {"hang": [171.75, 182.75], "dx": -1.0, "tt": "xay", "ghi": "..."},
            "K32": {"cy": 343.0, "sy": 1.2, "dx": -5.5, "tt": "chua", "ghi": "suy theo bước"},
            "K00": {"tt": "giu"}},
   "thap": {"beacon": {"that": [493, 81, 592, 110], "tt": "xay"},
            "B1": {"tam": [653, 281.5], "sy": 1.2, "tt": "xay"}}}
  hang = tâm hai dãy nhà thật (khối hai dãy quay lưng); cy, sy = tâm và hệ số giãn dọc (khối dải);
  dx, sx = dời và giãn ngang; tt: xay (đo trên ảnh) / chua (chưa xây, suy theo khối bên) /
  giu (không có dấu vết, giữ theo phép chiếu chung).

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

    def xy(self, lat, lon):
        """Ngược của ll: vĩ độ, kinh độ -> toạ độ khung bản vẽ."""
        dN = (lat - self.lat0) * self.mLat; dE = (lon - self.lon0) * self.mLon
        c, s = math.cos(self.bac), math.sin(self.bac)
        dx = dE * c + dN * s; dy = dN * c - dE * s
        return self.px0 + dx / self.mpu, self.py0 - dy / self.mpu


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


# ---------------------------------------------------------------- tầng 4: từng khối
LOAI = ['TH', 'SL', 'DL', 'GV']          # trường t trong geometry.json, cùng thứ tự TYPES trong showroom.js
UNIT = .44                               # đơn vị bản vẽ trên mét khi vẽ thân nhà, khớp showroom.js


def than_nha(q):
    """Kích thước hộp thân nhà (rộng, sâu) đúng như showroom.js vẽ."""
    v = bool(q.get('vertical'))
    fw = (q.get('displayDepth') if v else q.get('front')) * UNIT
    fh = (q.get('front') if v else q.get('displayDepth')) * UNIT
    bwr = q.get('bodyDepth') if v else q.get('bodyWidth'); bhr = q.get('bodyWidth') if v else q.get('bodyDepth')
    return (bwr * UNIT if bwr else fw * .7), (bhr * UNIT if bhr else fh * .62)


def tach_khoi(geo, hs_khe=1.5, hs_lung=1.45):
    """Tách lô thành khối: cùng loại, cùng hướng; dãy theo trục chính, cắt ở khe lớn hơn
    hs_khe lần bước lô; hai đoạn dãy quay lưng nhau (cách nhau không quá hs_lung lần chiều
    sâu lô, phủ nhau ít nhất nửa chiều dài) gộp thành một khối."""
    import statistics as st
    out, nhom = [], {}
    for i, q in enumerate(geo): nhom.setdefault((q['t'], bool(q.get('vertical'))), []).append(i)
    for (t, doc), ids in sorted(nhom.items()):
        a = (lambda q: q['y']) if doc else (lambda q: q['x'])
        b = (lambda q: q['x']) if doc else (lambda q: q['y'])
        ids = sorted(ids, key=lambda i: b(geo[i])); day, cur = [], [ids[0]]
        for i in ids[1:]:
            if abs(b(geo[i]) - st.mean(b(geo[j]) for j in cur)) <= 1.0: cur.append(i)
            else: day.append(cur); cur = [i]
        day.append(cur)
        doan = []
        for d in day:
            d = sorted(d, key=lambda i: a(geo[i])); xs = [a(geo[i]) for i in d]
            if len(d) == 1: doan.append(d); continue
            buoc = st.median([xs[k + 1] - xs[k] for k in range(len(xs) - 1)]); s_ = [d[0]]
            for k in range(1, len(d)):
                if xs[k] - xs[k - 1] > hs_khe * buoc: doan.append(s_); s_ = []
                s_.append(d[k])
            doan.append(s_)
        def kh(s_): xs = [a(geo[i]) for i in s_]; return min(xs), max(xs), st.mean(b(geo[i]) for i in s_)
        doan.sort(key=lambda s_: (kh(s_)[2], kh(s_)[0])); dung = [False] * len(doan)
        sau = st.median([geo[i].get('displayDepth') or 18 for i in ids]) * UNIT
        for p in range(len(doan)):
            if dung[p]: continue
            a0, a1, bp = kh(doan[p]); cap = None
            for q in range(p + 1, len(doan)):
                if dung[q]: continue
                c0, c1, bq = kh(doan[q])
                if bq - bp > hs_lung * sau + .5: break
                if bq > bp and min(a1, c1) - max(a0, c0) >= .5 * min(a1 - a0, c1 - c0) - 1e-6: cap = q; break
            dung[p] = True
            if cap is not None: dung[cap] = True; out.append({'loai': LOAI[t], 'doc': doc, 'ids': doan[p] + doan[cap]})
            else: out.append({'loai': LOAI[t], 'doc': doc, 'ids': doan[p]})
    for k in out:
        xs = [geo[i]['x'] for i in k['ids']]; ys = [geo[i]['y'] for i in k['ids']]
        k['tam'] = [(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2]
        k['khung'] = [round(min(xs) - .6, 2), round(min(ys) - .6, 2), round(max(xs) + .6, 2), round(max(ys) + .6, 2)]
        k['rows'] = sorted(set(round(geo[i]['x' if k['doc'] else 'y'], 2) for i in k['ids']))
    # tên theo cột (tâm x chia ô 40 đơn vị) rồi theo y
    out.sort(key=lambda k: (int(k['tam'][0] // 40), k['tam'][1]))
    for n, k in enumerate(out): k['ma'] = f'K{n + 1:02d}'
    return out


def lo_trong_khung(geo, d):
    """Chọn lô theo khung và loại — đúng cách showroom.js chọn."""
    x0, y0, x1, y1 = d['khung']
    return [i for i, q in enumerate(geo) if LOAI[q['t']] == d['loai'] and x0 <= q['x'] <= x1 and y0 <= q['y'] <= y1]


def kiem_khoi(geo, ds):
    """Mỗi lô thuộc đúng một khối. Trả về (thiếu, trùng)."""
    dem = [0] * len(geo)
    for d in ds:
        for i in lo_trong_khung(geo, d): dem[i] += 1
    return [i for i, c in enumerate(dem) if c == 0], [i for i, c in enumerate(dem) if c > 1]


def vi_tri_khoi(g, geo, ch):
    """Toạ độ khung bản vẽ của từng lô sau khi đặt theo ghim khối (lô không thuộc khối có ghim giữ nguyên)."""
    pos = {i: (q['x'], q['y']) for i, q in enumerate(geo)}
    for d in (g.get('khoi') or {}).get('ds', []):
        if not d.get('ghim'): continue
        X, Y = ch.xy(*d['ghim']); cx, cy = d['tamBanVe']; sx, sy = d.get('tyLe', [1, 1])
        for i in lo_trong_khung(geo, d):
            q = geo[i]; pos[i] = (X + (q['x'] - cx) * sx, Y + (q['y'] - cy) * sy)
    return pos


def lenh_tach(d, ghi):
    g, geo, _ = doc_thu_muc(d)
    ds = tach_khoi(geo)
    for k in ds:
        print(f"{k['ma']}  {k['loai']} {'dọc ' if k['doc'] else 'ngang'} {len(k['ids']):3d} lô  "
              f"khung {k['khung']}  {len(k['rows'])} dãy")
    print(f'{len(ds)} khối, {sum(len(k["ids"]) for k in ds)}/{len(geo)} lô')
    if not ghi: print('(Thêm --ghi để ghi khung khối vào georef.json > khoi; ghim để trống, đo xong dùng lệnh dat)'); return
    cu = {tuple(x['khung']): x for x in (g.get('khoi') or {}).get('ds', [])}
    g.setdefault('khoi', {})['ds'] = [{**{'ma': k['ma'], 'loai': k['loai'], 'doc': k['doc'], 'soCan': len(k['ids']), 'khung': k['khung'],
                                          'tamBanVe': [round(v, 3) for v in k['tam']], 'ghim': None, 'tyLe': [1, 1], 'trangThai': 'giu'},
                                       **{kk: vv for kk, vv in cu.get(tuple(k['khung']), {}).items() if kk in ('ma', 'ghim', 'tyLe', 'trangThai', 'ghiChu')}}
                                      for k in ds]
    (pathlib.Path(d) / 'georef.json').write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
    print('Đã ghi khung khối vào georef.json')


def _bang(bang):
    b = json.loads(pathlib.Path(bang).read_text(encoding='utf-8'))
    return b.get('khoi', {}), b.get('thap', {})


def _tham_so(geo, d, m):
    """Từ số đo một khối -> (tâm thật x, y, sx, sy) trong khung bản vẽ."""
    cx, cy = d['tamBanVe']
    if not m or m.get('tt', 'giu') == 'giu': return None
    sx, dx = m.get('sx', 1.0), m.get('dx', 0.0)
    if 'hang' in m:                      # khối hai dãy ngang quay lưng: tâm hai dãy thật
        if d.get('doc'): sys.exit(f"{d['ma']}: khối dọc dùng cy/sy, không dùng hang")
        ra, rb = m['hang']; ys = [geo[i]['y'] for i in lo_trong_khung(geo, d)]
        pa, pb = min(ys), max(ys)
        if pb - pa < 1e-6: sys.exit(f"{d['ma']}: khối một dãy dùng cy, không dùng hang")
        return cx + dx, (ra + rb) / 2, sx, (rb - ra) / (pb - pa)
    return cx + dx, m['cy'], sx, m.get('sy', 1.0)


def _phu_anh(S, meta, ch, K=4.0):
    """Mặt nạ 'có công trình' trên ảnh vệ tinh đã đưa về khung bản vẽ (sàn bê tông, mái tối, mái ngói, nhiều chi tiết),
    đã loại đường nhựa dài. Trả về (mặt nạ, XA, YA, K)."""
    import numpy as np, cv2
    XA, XB, YA, YB = 0, 960, 0, 540
    w = ve_tinh_ve_khung(S, meta, ch, XA, XB, YA, YB, K)
    hsv = cv2.cvtColor(w, cv2.COLOR_RGB2HSV).astype(np.float32); H, Sa, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    G = cv2.cvtColor(w, cv2.COLOR_RGB2GRAY).astype(np.float32)
    mu = cv2.blur(G, (7, 7)); tex = np.sqrt(np.maximum(cv2.blur(G * G, (7, 7)) - mu * mu, 0))
    xay = ((Sa < 45) & (V > 165)) | ((V < 95) & (Sa < 80) & (V > 8)) | (((H < 10) | (H > 170)) & (Sa > 80) & (V > 90)) | (tex > 24)
    duong = ((V < 110) & (Sa < 60) & (V > 8)).astype(np.uint8); L = int(40 * K)
    dn = cv2.morphologyEx(duong, cv2.MORPH_OPEN, np.ones((1, L), np.uint8)) | cv2.morphologyEx(duong, cv2.MORPH_OPEN, np.ones((L, 1), np.uint8))
    xay = xay.astype(np.float32); xay[dn > 0] = 0
    return xay, XA, YA, K


def _do_phu(II, XA, YA, K, hop):
    import numpy as np
    b = np.asarray(hop, float); Hh, Ww = II.shape[0] - 1, II.shape[1] - 1
    x0 = np.clip(np.round((b[:, 0] - b[:, 2] / 2 - XA) * K).astype(int), 0, Ww); x1 = np.clip(np.round((b[:, 0] + b[:, 2] / 2 - XA) * K).astype(int), 0, Ww)
    y0 = np.clip(np.round((b[:, 1] - b[:, 3] / 2 - YA) * K).astype(int), 0, Hh); y1 = np.clip(np.round((b[:, 1] + b[:, 3] / 2 - YA) * K).astype(int), 0, Hh)
    on = II[y1, x1] - II[y0, x1] - II[y1, x0] + II[y0, x0]
    return float(on.sum() / max(1, ((x1 - x0) * (y1 - y0)).sum()))


def lenh_do(d, ra, z, bang):
    """Gợi ý tinh chỉnh: dời từng khối trong ±3,5 đơn vị ngang và ±5 đơn vị dọc quanh số đo hiện có,
    tìm chỗ thân nhà mô hình phủ nhiều công trình thật nhất. Không tự ghi."""
    import numpy as np, cv2
    g, geo, _ = doc_thu_muc(d); ch = Chieu(g); S, meta = nap_anh(ra, z)
    ds = (g.get('khoi') or {}).get('ds') or tach_khoi(geo)
    bk, _ = _bang(bang)
    xay, XA, YA, K = _phu_anh(S, meta, ch); II = cv2.integral(xay).astype(np.float64)
    print('khối  loại  phủ hiện tại -> tốt nhất | gợi ý dời thêm | độ chắc')
    for k in ds:
        m = bk.get(k['ma']); p = _tham_so(geo, k, m)
        if not p or m.get('tt') != 'xay': continue
        X, Y, sx, sy = p; cx, cy = k['tamBanVe']; ids = lo_trong_khung(geo, k)
        rel = np.array([((geo[i]['x'] - cx) * sx, (geo[i]['y'] - cy) * sy) + than_nha(geo[i]) for i in ids])
        best, luoi = (-1, 0, 0), []
        for ddx in np.arange(-3.5, 3.51, .25):
            for ddy in np.arange(-5, 5.01, .25):
                hop = np.column_stack([X + ddx + rel[:, 0], Y + ddy + rel[:, 1], rel[:, 2], rel[:, 3]])
                c = _do_phu(II, XA, YA, K, hop); luoi.append((c, ddx, ddy))
                if c > best[0]: best = (c, ddx, ddy)
        c0 = [c for c, a, b in luoi if a == 0 and b == 0][0]
        trai = max(math.hypot(a - best[1], b - best[2]) for c, a, b in luoi if c >= best[0] - .02)
        bien = abs(best[1]) >= 3.5 or abs(best[2]) >= 5
        chac = 'CHẠM BIÊN — bỏ' if bien else ('chắc' if trai <= 1.5 else 'mơ hồ — soát kỹ')
        print(f"{k['ma']:5s} {k['loai']}   {c0:.2f} -> {best[0]:.2f} | dx {best[1]:+5.2f} dy {best[2]:+5.2f} | đỉnh trải {trai:.1f} đv, {chac}")
    print('Đây chỉ là gợi ý. Áp thử vào bảng số đo, chạy lệnh nghiemthu, nhìn ảnh từng khối rồi mới nhận.')


def lenh_dat(d, bang, ghi):
    g, geo, _ = doc_thu_muc(d); ch = Chieu(g)
    kh = g.setdefault('khoi', {}); ds = kh.get('ds') or []
    if not ds: sys.exit('georef.json chưa có khoi.ds — chạy lệnh tach --ghi trước')
    thieu, trung = kiem_khoi(geo, ds)
    if thieu or trung: sys.exit(f'Khung khối chưa phủ đúng: {len(thieu)} lô không thuộc khối nào, {len(trung)} lô thuộc hai khối')
    bk, bt = _bang(bang)
    for k in ds:
        m = bk.get(k['ma']); p = _tham_so(geo, k, m)
        if not p:
            k.update(ghim=None, tyLe=[1, 1], trangThai='giu')
        else:
            X, Y, sx, sy = p; la, lo = ch.ll(X, Y)
            k.update(ghim=[round(float(la), 7), round(float(lo), 7)], tyLe=[round(sx, 4), round(sy, 4)], trangThai=m.get('tt', 'xay'))
        if m and m.get('ghi'): k['ghiChu'] = m['ghi']
        print(f"{k['ma']:5s} {k['loai']} {k['trangThai']:4s} ghim {k['ghim']} giãn {k['tyLe']}")
    thap = []
    for ma, m in bt.items():
        o = {'ma': ma, 'trangThai': m.get('tt', 'xay')}
        if 'that' in m:
            ban = m.get('banVe'); 
            if not ban: sys.exit(f'Tháp {ma}: cần "banVe" [x0,y0,x1,y1] là hộp bao trên bản vẽ (chan-thap.json > bao)')
            t = m['that']; sx = (t[2] - t[0]) / (ban[2] - ban[0]); sy = (t[3] - t[1]) / (ban[3] - ban[1])
            la, lo = ch.ll((t[0] + t[2]) / 2, (t[1] + t[3]) / 2)
            o.update(khungBanVe=ban, tamBanVe=[(ban[0] + ban[2]) / 2, (ban[1] + ban[3]) / 2], tyLe=[round(sx, 4), round(sy, 4)])
        else:
            la, lo = ch.ll(*m['tam']); o.update(tamBanVe=m['banVe'], tyLe=[m.get('sx', 1.0), m.get('sy', 1.0)])
        o['ghim'] = [round(float(la), 7), round(float(lo), 7)]
        if m.get('ghi'): o['ghiChu'] = m['ghi']
        thap.append(o); print(f"tháp {ma:9s} {o['trangThai']:4s} ghim {o['ghim']} giãn {o['tyLe']}")
    if thap: kh['thap'] = thap
    if ghi:
        (pathlib.Path(d) / 'georef.json').write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
        print('Đã ghi ghim từng khối vào georef.json')
    else: print('(Thêm --ghi để ghi vào georef.json)')


def _doc_ghim_can(kml):
    import re
    s = pathlib.Path(kml).read_text(encoding='utf-8'); out = {}
    for m in re.finditer(r'<Placemark>(.*?)</Placemark>', s, re.S):
        b = m.group(1); n = re.search(r'<name>(.*?)</name>', b, re.S); c = re.search(r'<coordinates>(.*?)</coordinates>', b, re.S)
        if not n or not c: continue
        p = c.group(1).strip().split()
        if len(p) != 1: continue
        lo, la = map(float, p[0].split(',')[:2])
        ma = re.sub(r'\s+', '', n.group(1)).upper().replace('Đ', 'D').replace('CĂN', '').replace('CAN', '')
        mm = re.search(r'(TH|NP|SL|DL|GV)-?(\d+)', ma)
        if mm: out[f'{mm.group(1)}-{int(mm.group(2)):03d}'] = (la, lo, n.group(1).strip())
    return out


def lenh_nghiemthu(d, ra, z, kml=None):
    import numpy as np, cv2
    from PIL import Image, ImageDraw, ImageFont
    g, geo, _ = doc_thu_muc(d); ch = Chieu(g); S, meta = nap_anh(ra, z)
    pos = vi_tri_khoi(g, geo, ch); ds = (g.get('khoi') or {}).get('ds', [])
    xay, XA, YA, K = _phu_anh(S, meta, ch); II = cv2.integral(xay).astype(np.float64)
    tong = {'truoc': [], 'sau': []}
    print('khối  loại trạng thái  phủ trước -> sau')
    for k in ds:
        ids = lo_trong_khung(geo, k)
        h0 = [(geo[i]['x'], geo[i]['y']) + than_nha(geo[i]) for i in ids]; h1 = [pos[i] + than_nha(geo[i]) for i in ids]
        a, b = _do_phu(II, XA, YA, K, h0), _do_phu(II, XA, YA, K, h1)
        if k.get('trangThai') == 'xay': tong['truoc'].append(a); tong['sau'].append(b)
        print(f"{k['ma']:5s} {k['loai']}   {k.get('trangThai', 'giu'):4s}       {a:.2f} -> {b:.2f}")
    if tong['sau']:
        print(f"Khối đã xây: {len(tong['sau'])} | độ phủ trung bình {np.mean(tong['truoc']):.2f} -> {np.mean(tong['sau']):.2f}")
    # khoảng cách tới ghim căn (mã tạm theo thứ tự file, như showroom.js)
    if kml:
        ghim = _doc_ghim_can(kml); dem = {}; ma = {}
        for i, q in enumerate(geo):
            t = LOAI[q['t']]; dem[t] = dem.get(t, 0) + 1; ma[f'{t}-{dem[t]:03d}'] = i
        for m, (la, lo, ten) in ghim.items():
            if m not in ma: print(f'{ten}: không có mã {m} trong geometry.json'); continue
            i = ma[m]; X, Y = ch.xy(la, lo)
            gan = min(pos, key=lambda j: (pos[j][0] - X) ** 2 + (pos[j][1] - Y) ** 2)
            print(f"{ten}: trước {math.hypot(geo[i]['x'] - X, geo[i]['y'] - Y) * ch.mpu:.0f} m -> sau "
                  f"{math.hypot(pos[i][0] - X, pos[i][1] - Y) * ch.mpu:.1f} m | lô gần ghim nhất {'ĐÚNG mã' if gan == i else 'KHÁC mã'}")
    # ảnh chồng toàn khu
    xs = [p[0] for p in pos.values()]; ys = [p[1] for p in pos.values()]
    X0, X1, Y0, Y1 = min(xs) - 12, max(xs) + 12, min(ys) - 12, max(ys) + 12; KK = 3.0
    w = ve_tinh_ve_khung(S, meta, ch, X0, X1, Y0, Y1, KK)
    im = Image.fromarray(w); dr = ImageDraw.Draw(im)
    mau = {'TH': (255, 150, 60), 'SL': (255, 230, 60), 'DL': (150, 255, 80), 'GV': (60, 230, 255)}
    for i, q in enumerate(geo):
        x, y = pos[i]; bw, bh = than_nha(q)
        dr.rectangle([(x - bw / 2 - X0) * KK, (y - bh / 2 - Y0) * KK, (x + bw / 2 - X0) * KK, (y + bh / 2 - Y0) * KK], outline=mau[LOAI[q['t']]])
    try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
    except Exception: F = None
    for k in ds:
        if k.get('ghim'): X, Y = ch.xy(*k['ghim'])
        else: X, Y = k['tamBanVe']
        dr.text(((X - X0) * KK - 10, (Y - Y0) * KK - 6), k['ma'], fill=(255, 255, 255), font=F)
    out = ra / 'nghiem-thu-tung-khoi.png'; im.save(out)
    print(f'Ảnh chồng toàn khu (thân nhà mô hình sau khi đặt theo ghim) -> {out}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lenh', choices=['anh', 'dich', 'khung', 'soi', 'vn2000', 'tach', 'do', 'dat', 'nghiemthu'])
    ap.add_argument('dich_den', help='thư mục công cụ dự án, hoặc file CSV với lệnh vn2000')
    ap.add_argument('diem', nargs='*', help='lệnh soi: tâm khối x,y; lệnh do/dat: bảng số đo .json; lệnh nghiemthu: KML ghim căn')
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
    elif a.lenh == 'tach': lenh_tach(a.dich_den, a.ghi)
    elif a.lenh == 'do': lenh_do(a.dich_den, ra, a.z, a.diem[0])
    elif a.lenh == 'dat': lenh_dat(a.dich_den, a.diem[0], a.ghi)
    elif a.lenh == 'nghiemthu': lenh_nghiemthu(a.dich_den, ra, a.z, a.diem[0] if a.diem else None)


if __name__ == '__main__':
    main()
