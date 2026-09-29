# Cẩm Nang Bất Động Sản Vùng Đông Nam Bộ — v2

Website: **https://nguyenanhtu.vn** — Cẩm nang `/cam-nang/…` · World Atlas `/atlas/` · Nhật san `/nhat-san/` · Tác giả: **Nguyễn Anh Tú** (ERA Vietnam) · Hotline/Zalo 0978 618 149

Repo GitHub: `https://github.com/<username>/camnang-bds` ← *cập nhật sau khi tạo kho*

## Bắt đầu
1. **Đọc `PROJECT_RULES.md` trước khi sửa bất cứ thứ gì.**
2. Thêm/sửa bài → `docs/CONTENT_GUIDE.md`.
3. Đưa lên web, cập nhật hằng ngày → `docs/DEPLOY.md`.
4. Đăng kỳ World Atlas / Nhật san → `publications/README.md`.
5. Lịch sử chuyển đổi từ v57 → `docs/MIGRATION_REPORT.md`.

## Lệnh
```bash
node scripts/build.mjs          # kiểm tra + build → dist/   (Node ≥ 18, không cần npm install)
node scripts/build.mjs --check  # chỉ kiểm tra dữ liệu
node scripts/new-article.mjs --title "…" --category du-an-chon-loc --parent <slug-vùng> --nav
python3 scripts/images.py add <slug> anh.jpg   # ảnh → WebP (cần Pillow)
python3 scripts/images.py og <slug>            # ảnh chia sẻ 1200×630
bash scripts/make-update.sh                    # đóng gói file đã đổi → update-*.zip
python3 tests/smoke.py                         # kiểm thử trình duyệt (cần Playwright)
```

Cloudflare Pages: Build command `node scripts/build.mjs` · Output `dist` · `NODE_VERSION=20`.
