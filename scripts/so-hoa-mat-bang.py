#!/usr/bin/env python3
"""Số hoá mặt bằng tầng căn hộ để chọn căn ngay trên mặt cắt 3D (PROJECT_RULES §16.3, §17).

Đầu vào là ảnh mặt bằng tầng của chủ đầu tư (có tô màu theo loại căn và ô nhãn mã căn) và một
file khai báo do người số hoá viết tay sau khi đọc bản vẽ:
  {
    "anh": "beacon-8.webp",                 # ảnh gốc trong thư mục công cụ
    "ra": "beacon-8-mat.webp",               # ảnh xuất ra: chỉ giữ thân toà, nền trong suốt
    "tang": "4–19, 21–35",                   # các tầng dùng mặt bằng này (ghi y như bản vẽ)
    "tangDung": ["4", ..., "35"],            # danh sách nhãn tầng áp dụng
    "toa": {"E5": {"tangCuoi": 35, "mai": 36}, "E3": {"tangCuoi": 39}, ...},   # toà con trái -> phải, tầng cuối
                                             # đọc từ các mặt bằng tầng cao: toà nào hết căn ở tầng nào
    "mau": {"STU": [x, y], "1BR+": [x, y]},  # điểm lấy mẫu màu từng loại căn (ô chú thích)
    "can": [{"ma": "E505", "toa": "E5", "so": "05", "loai": "2BR", "thongThuy": 73.8, "timTuong": 79.8,
             "hat": [287, 446]}, ...]        # hat = một điểm nằm trong căn, đọc trên bản vẽ
  }
Mỗi căn được tách bằng cách loang màu từ điểm hạt (chỉ lấy màu cùng loại), lấy bao lồi làm vùng
chọn. Mã căn, loại, diện tích đọc từ ô nhãn trên bản vẽ — công cụ không đoán.
Kết quả ghi vào mat-bang.json (theo khoá phân khu) để showroom.js dán ảnh lên mặt cắt và cho chọn căn.
Kèm `lat`: các lát chân tháp cắt theo đúng thân toà trên mặt bằng, tách theo toà con (mỗi lát mang chỉ số
toà), để khối 3D mang đúng hình mặt bằng tầng, mỗi toà con đúng chiều cao, và mặt cắt được ảnh mặt bằng phủ kín.

Dùng:
  python3 scripts/so-hoa-mat-bang.py assets/tools/casa-blanca khai-bao.json beacon [--anh-kiem kiem.png]
Cần: numpy, opencv-python, pillow.
"""
import argparse, json, pathlib, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont


def tach_can(im, mau, can, nguong=34):
    H, W, _ = im.shape
    ref = {k: im[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3).mean(0) for k, (x, y) in mau.items()}
    ra = []
    for c in can:
        x, y = c['hat']
        loai = [k for k in ref if k == c['loai'] or k.startswith(c['loai'] + '#')] or [c['loai']]
        if not all(k in ref for k in loai): sys.exit(f"{c['ma']}: thiếu màu mẫu cho loại {c['loai']}")
        d = np.min(np.stack([np.sqrt(((im - ref[k]) ** 2).sum(2)) for k in loai]), axis=0)
        # màu tại hạt có thể là biến thể (căn STU nhạt): nhận thêm màu ngay tại hạt
        tai = im[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3).mean(0)
        d = np.minimum(d, np.sqrt(((im - tai) ** 2).sum(2)))
        m = (d < nguong).astype(np.uint8)
        n, cc = cv2.connectedComponents(m, connectivity=8)
        k = cc[y, x]
        if k == 0:
            vung = cc[y - 6:y + 7, x - 6:x + 7]; vals = vung[vung > 0]
            if not len(vals): sys.exit(f"{c['ma']}: điểm hạt {c['hat']} không nằm trên màu loại {c['loai']}")
            k = np.bincount(vals).argmax()
        pts = np.column_stack(np.nonzero(cc == k))[:, ::-1]
        if len(pts) < 200: sys.exit(f"{c['ma']}: vùng quá nhỏ ({len(pts)} điểm ảnh), kiểm lại điểm hạt")
        hull = cv2.convexHull(pts.astype(np.int32))
        poly = cv2.approxPolyDP(hull, 1.5, True).reshape(-1, 2)
        ra.append({**{k2: v for k2, v in c.items() if k2 != 'hat'}, 'poly': poly.tolist(), 'dienTichAnh': int(cv2.contourArea(hull))})
    return ra


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('thu_muc'); ap.add_argument('khai_bao'); ap.add_argument('khoa')
    ap.add_argument('--anh-kiem')
    a = ap.parse_args()
    d = pathlib.Path(a.thu_muc); kb = json.loads(pathlib.Path(a.khai_bao).read_text(encoding='utf-8'))
    P = Image.open(d / kb['anh']).convert('RGB'); im = np.asarray(P).astype(np.int16)
    can = tach_can(im, kb['mau'], kb['can'])
    ma = [c['ma'] for c in can]
    if len(set(ma)) != len(ma): sys.exit('Trùng mã căn trong khai báo')
    # chồng lấn giữa hai căn = điểm hạt đặt sai
    H, W = im.shape[:2]; dem = np.zeros((H, W), np.uint8)
    for c in can:
        m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(c['poly'], np.int32)], 1); dem += m
    chong = int((dem > 1).sum())
    tong = sum(c['dienTichAnh'] for c in can)
    if chong > .04 * tong: sys.exit(f'Các căn chồng lên nhau {chong} điểm ảnh — có điểm hạt đặt sai')
    # thân toà: hợp các căn, đóng kín hành lang và lõi thang, rồi cắt khung
    than = (dem > 0).astype(np.uint8)
    than = cv2.morphologyEx(than, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
    # lấp lõi thang, sảnh kẹt giữa các căn: vùng trống không thông ra mép ảnh
    nen = np.pad(1 - than, 1, constant_values=1).astype(np.uint8)
    cv2.floodFill(nen, None, (0, 0), 2)
    than = np.where(nen[1:-1, 1:-1] == 2, 0, 1).astype(np.uint8)
    than = cv2.dilate(than, np.ones((5, 5), np.uint8))
    ys, xs = np.nonzero(than); x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    rgba = np.dstack([np.asarray(P), (than * 255).astype(np.uint8)])[y0:y1, x0:x1]
    Image.fromarray(rgba, 'RGBA').save(d / kb['ra'], quality=88, method=6)
    # Toà con: mỗi căn thuộc một toà (trường "toa"); hành lang, lõi thang thuộc toà của căn gần nhất.
    # Khai báo "toa": {"E5": {"tangCuoi": 35}, ...} lấy từ các mặt bằng tầng cao (toà nào hết căn ở tầng nào).
    ds_toa = list(kb.get('toa', {}).keys()) or sorted({c['toa'] for c in can})
    for c in can:
        if c['toa'] not in ds_toa: sys.exit(f"{c['ma']}: toà {c['toa']} không có trong khai báo toa")
    nhan = np.zeros((H, W), np.int32)
    for c in can: cv2.fillPoly(nhan, [np.array(c['poly'], np.int32)], ds_toa.index(c['toa']) + 1)
    _, lab = cv2.distanceTransformWithLabels((nhan == 0).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys0, xs0 = np.nonzero(nhan > 0)                     # nhãn điểm ảnh -> toạ độ điểm căn gần nhất
    bang = np.zeros(lab.max() + 1, np.int32)
    bang[lab[ys0, xs0]] = nhan[ys0, xs0]
    toa_px = np.where(nhan > 0, nhan, bang[lab])
    # chân tháp dựng theo chính mặt bằng: chia cột dọc, mỗi cột lấy các đoạn có thân toà, tách theo toà con
    M = than[y0:y1, x0:x1]; TT = toa_px[y0:y1, x0:x1]; Hm, Wm = M.shape; ncot = int(kb.get('soCot', 120)); lat = []
    for i in range(ncot):
        c0, c1 = round(i * Wm / ncot), round((i + 1) * Wm / ncot)
        hang = M[:, c0:c1].mean(1) > .5
        tcot = [np.bincount(TT[j, c0:c1], minlength=len(ds_toa) + 1)[1:].argmax() if hang[j] else -1 for j in range(Hm)]
        # lấp khe hẹp (dưới 16 điểm ảnh) giữa hai đoạn cùng toà
        doan = []; s0 = None; t0 = None
        for j, t in enumerate(tcot + [-1]):
            if s0 is not None and t != t0:
                doan.append([s0, j, t0]); s0 = None
            if t >= 0 and s0 is None: s0, t0 = j, t
        gop = []
        for d0, d1, t in doan:
            if gop and gop[-1][2] == t and d0 - gop[-1][1] < 16: gop[-1][1] = d1
            else: gop.append([d0, d1, t])
        for d0, d1, t in gop:
            if d1 - d0 >= 4: lat.append([round(c0 / Wm, 4), round(d0 / Hm, 4), round(c1 / Wm, 4), round(d1 / Hm, 4), int(t)])
    toa = [{'ten': t, **kb.get('toa', {}).get(t, {})} for t in ds_toa]
    ra = {'anh': kb['ra'], 'nguon': kb['anh'], 'tenTang': kb['tang'], 'tangDung': kb['tangDung'],
          'khung': [x0, y0, x1, y1], 'rong': x1 - x0, 'cao': y1 - y0, 'ghiChu': kb.get('ghiChu', ''), 'toa': toa, 'lat': lat,
          'can': [{**c, 'poly': [[px - x0, py - y0] for px, py in c['poly']]} for c in can]}
    f = d / 'mat-bang.json'
    tat = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    tat[a.khoa] = ra
    f.write_text(json.dumps(tat, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{len(can)} căn, chồng lấn {chong} điểm ảnh, ảnh {kb["ra"]} {x1 - x0}×{y1 - y0}, ghi {f}')
    if a.anh_kiem:
        Q = P.convert('RGB'); dr = ImageDraw.Draw(Q)
        try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
        except Exception: F = None
        for c in can:
            dr.polygon([tuple(p) for p in c['poly']], outline=(255, 0, 0))
            cx = sum(p[0] for p in c['poly']) / len(c['poly']); cy = sum(p[1] for p in c['poly']) / len(c['poly'])
            dr.rectangle([cx - 18, cy - 7, cx + 18, cy + 7], fill=(0, 0, 0)); dr.text((cx - 16, cy - 7), c['ma'], fill=(255, 255, 0), font=F)
        Q.save(a.anh_kiem)


if __name__ == '__main__':
    main()
