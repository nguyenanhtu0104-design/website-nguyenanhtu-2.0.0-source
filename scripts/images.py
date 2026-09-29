#!/usr/bin/env python3
"""Cẩm Nang BĐS 2.0 — công cụ xử lý ảnh (cần Pillow: pip install Pillow).

  python3 scripts/images.py add <slug> <file1> [file2 ...]
      Chuyển ảnh sang WebP (640/1280/2048 + cỡ gốc nếu nhỏ hơn), lưu vào
      assets/images/articles/<slug>/NN-<w>.webp, cập nhật data/images.json,
      in ra thẻ <img data-img="<slug>/NN"> để dán vào content/articles/<slug>.html.

  python3 scripts/images.py og <slug> [<slug> ...] | --all | --missing
      Tạo ảnh chia sẻ 1200x630 JPEG tại assets/images/og/<slug>.jpg.
      Bài có heroImage -> cắt từ ảnh hero; bài không ảnh -> thẻ thương hiệu.

  python3 scripts/images.py og-home
      Tạo assets/images/og/trang-chu.jpg cho trang chủ.
"""
import sys, os, json, re, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'images')
MANIFEST = os.path.join(ROOT, 'data', 'images.json')
WIDTHS = [640, 1280, 2048]
FONT_DIRS = ['/usr/share/fonts/truetype/dejavu', '/Library/Fonts', 'C:/Windows/Fonts']

def font(name, size):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def load_manifest():
    return json.load(open(MANIFEST, encoding='utf-8')) if os.path.exists(MANIFEST) else {}

def save_manifest(m):
    json.dump(dict(sorted(m.items())), open(MANIFEST, 'w', encoding='utf-8'), indent=0)

def variants(img, folder, name):
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA' if 'A' in img.getbands() or img.mode == 'P' else 'RGB')
    W, H = img.size
    if W > 2048: vs = WIDTHS[:]
    else: vs = sorted(set([w for w in WIDTHS if w < W] + [W]))
    for w in vs:
        im = img if w == W else img.resize((w, round(H * w / W)), Image.LANCZOS)
        im.save(os.path.join(folder, f'{name}-{w}.webp'), 'WEBP', quality=80, method=6)
    fw = min(W, 2048)
    return {'w': fw, 'h': round(H * fw / W), 'v': vs}

def cmd_add(slug, files):
    folder = os.path.join(IMG, 'articles', slug); os.makedirs(folder, exist_ok=True)
    m = load_manifest()
    used = [int(k.split('/')[1]) for k in m if k.startswith(slug + '/')]
    n = max(used, default=0)
    for f in files:
        n += 1; key = f'{slug}/{n:02d}'
        m[key] = variants(Image.open(f), folder, f'{n:02d}')
        print(f'<img data-img="{key}" alt="MÔ TẢ ẢNH" style="width:100%;display:block;border-radius:6px">')
    save_manifest(m)
    ap = os.path.join(ROOT, 'data', 'articles.json'); arts = json.load(open(ap, encoding='utf-8'))
    for a in arts:
        if a['slug'] == slug and not a.get('heroImage'):
            a['heroImage'] = a['thumbnail'] = f'{slug}/01'
            json.dump(arts, open(ap, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print(f'(đã đặt heroImage/thumbnail = {slug}/01 — ảnh OG sẽ cắt từ ảnh này)')

def cover(img, W=1200, H=630):
    img = img.convert('RGB'); w, h = img.size; r = max(W / w, H / h)
    img = img.resize((round(w * r), round(h * r)), Image.LANCZOS); w, h = img.size
    return img.crop(((w - W) // 2, (h - H) // 2, (w - W) // 2 + W, (h - H) // 2 + H))

def wrap(draw, text, f, maxw, maxlines):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=f) <= maxw: cur = t
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    if len(lines) > maxlines:
        lines = lines[:maxlines]; lines[-1] = lines[-1].rstrip(' ,.—-') + '…'
    return lines

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def noemoji(s):
    return re.sub(r'[^\w\s·—–\-&.,:;!?()/%²+’\'"“”]', '', s, flags=re.U).strip()

def brand_card(title, subtitle, section, accent, out, portrait=False):
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), (18, 16, 13)); d = ImageDraw.Draw(img)
    for i in range(H):  # subtle vertical gradient
        c = int(18 + 10 * (1 - i / H)); d.line([(0, i), (W, i)], fill=(c + 4, c + 2, c - 2))
    acc = hexrgb(accent); gold = (200, 153, 58)
    d.rectangle([0, 0, W, 8], fill=acc)
    left, maxw = 72, (640 if portrait else 1056)
    if portrait:
        p = Image.open(os.path.join(IMG, 'site', 'tac-gia-nguyen-anh-tu.jpg')).convert('RGB')
        pw = 440; p = p.resize((pw, round(p.size[1] * pw / p.size[0])), Image.LANCZOS)
        p = p.crop((0, 60, pw, 60 + H - 8)); mask = Image.new('L', p.size, 255); md = ImageDraw.Draw(mask)
        for x in range(160): md.line([(x, 0), (x, p.size[1])], fill=int(255 * x / 160))
        img.paste(p, (W - pw, 8), mask)
    d.text((left, 64), 'CẨM NANG BẤT ĐỘNG SẢN · ĐÔNG NAM BỘ', font=font('DejaVuSans.ttf', 22), fill=gold)
    y = 110
    if section:
        d.text((left, y), noemoji(section).upper(), font=font('DejaVuSans-Bold.ttf', 22), fill=acc); y += 52
    ft = font('DejaVuSerif-Bold.ttf', 58 if len(title) < 60 else 50)
    for line in wrap(d, noemoji(title), ft, maxw, 3):
        d.text((left, y), line, font=ft, fill=(237, 232, 220)); y += ft.size + 16
    if subtitle:
        fs = font('DejaVuSans.ttf', 26)
        for line in wrap(d, noemoji(subtitle), fs, maxw, 2):
            d.text((left, y + 6), line, font=fs, fill=(168, 162, 154)); y += 38
    av = Image.open(os.path.join(IMG, 'site', 'avatar-220.png')).convert('RGBA').resize((72, 72), Image.LANCZOS)
    m = Image.new('L', (72, 72), 0); ImageDraw.Draw(m).ellipse([0, 0, 71, 71], fill=255)
    img.paste(av, (left, H - 120), m)
    d.ellipse([left - 3, H - 123, left + 74, H - 46], outline=gold, width=2)
    d.text((left + 92, H - 116), 'Nguyễn Anh Tú · ERA Vietnam', font=font('DejaVuSans-Bold.ttf', 24), fill=(237, 232, 220))
    d.text((left + 92, H - 80), 'nguyenanhtu.vn · Hotline/Zalo 0978 618 149', font=font('DejaVuSans.ttf', 20), fill=gold)
    img.save(out, 'JPEG', quality=86, optimize=True, progressive=True)

def hero_path(key, m):
    slug, n = key.split('/'); v = max(m[key]['v'])
    return os.path.join(IMG, 'articles', slug, f'{n}-{v}.webp')

def cmd_og(slugs):
    arts = json.load(open(os.path.join(ROOT, 'data', 'articles.json'), encoding='utf-8'))
    m = load_manifest(); os.makedirs(os.path.join(IMG, 'og'), exist_ok=True)
    if slugs == ['--all']: todo = arts
    elif slugs == ['--missing']: todo = [a for a in arts if not os.path.exists(os.path.join(IMG, 'og', a['slug'] + '.jpg'))]
    else: todo = [a for a in arts if a['slug'] in slugs]
    for a in todo:
        out = os.path.join(IMG, 'og', a['slug'] + '.jpg')
        if a.get('heroImage') and a['heroImage'] in m:
            cover(Image.open(hero_path(a['heroImage'], m))).save(out, 'JPEG', quality=84, optimize=True, progressive=True)
        else:
            brand_card(a['title'], a.get('subtitle', ''), a.get('section', ''), a.get('accent', '#c8993a'), out)
        print('og:', out)

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    c = sys.argv[1]
    if c == 'add' and len(sys.argv) >= 4: cmd_add(sys.argv[2], sys.argv[3:])
    elif c == 'og' and len(sys.argv) >= 3: cmd_og(sys.argv[2:])
    elif c == 'og-home':
        brand_card('Cẩm Nang Bất Động Sản Vùng Đông Nam Bộ', 'Pháp lý · Chiến lược quy hoạch · Tư duy đầu tư · Dự án chọn lọc',
                   '', '#c8993a', os.path.join(IMG, 'og', 'trang-chu.jpg'), portrait=True)
    else: print(__doc__); sys.exit(1)
