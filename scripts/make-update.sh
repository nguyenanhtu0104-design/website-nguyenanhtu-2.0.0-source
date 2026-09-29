#!/usr/bin/env bash
# Đóng gói các file đã thêm/sửa (so với commit mới nhất) thành update-<ngày>.zip
# để tải lên GitHub. Không gồm dist/. Dùng trong repo git.
set -e
cd "$(dirname "$0")/.."
OUT="update-$(date +%Y%m%d-%H%M).zip"
FILES=$( (git diff --name-only HEAD; git ls-files --others --exclude-standard) | sort -u | grep -v '^dist/' | while read f; do [ -f "$f" ] && echo "$f"; done)
DELETED=$(git diff --name-only --diff-filter=D HEAD || true)
[ -z "$FILES" ] && [ -z "$DELETED" ] && { echo "Không có thay đổi."; exit 0; }
[ -n "$FILES" ] && echo "$FILES" | zip -q "$OUT" -@
[ -n "$DELETED" ] && { echo "$DELETED" > DELETED_FILES.txt; zip -q "$OUT" DELETED_FILES.txt; rm DELETED_FILES.txt; }
echo "✓ $OUT"; echo "$FILES" | sed 's/^/  + /'; [ -n "$DELETED" ] && echo "$DELETED" | sed 's/^/  - (xoá) /'
