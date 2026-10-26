#!/bin/bash
# Copy (never move) the source files that scripts/images.mjs and scripts/media.sh read from my iCloud Desktop
# into sources/ (gitignored, outside iCloud), so an evicted or moved iCloud file can't break a rebuild.
# Re-run only to refresh a source I changed. Fails loudly if a file can't be read; never deletes anything.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${PORTFOLIO_ICLOUD_DESKTOP:-$HOME/Desktop/桌面 - Chad的MacBook Air}"
FILES=(
  手机端方案/通透改版/after-dark-today.png 手机端方案/通透改版/before-dark-today.png
  手机端方案/通透改版/after-dark-chat.png 手机端方案/通透改版/before-dark-chat.png
  手机端方案/通透改版/after-dark-computer.png 手机端方案/通透改版/before-dark-computer.png
  手机端方案/通透改版/after-dark-profile.png 手机端方案/通透改版/after-dark-ledger.png 手机端方案/通透改版/after-dark-session.png
  手机端方案/通透改版/录屏-滚动与头像放大-深色.mp4 手机端方案/通透改版/录屏-改版前.mp4
  宣传片分镜/预览-A-1080p.mp4 "宣传片分镜/01 品牌开场.png" "宣传片分镜/04 交给手机.png" "宣传片分镜/08 收尾.png"
  Logo方案/定稿/品牌规范.png
)
fail=0
for f in "${FILES[@]}"; do
  mkdir -p "$ROOT/sources/$(dirname "$f")"
  # reading the file makes iCloud download it if it was evicted; time-capped so a stuck download can't hang
  if perl -e 'alarm 300; exec @ARGV' cp -p "$SRC/$f" "$ROOT/sources/$f.part" && [ -s "$ROOT/sources/$f.part" ]; then
    mv "$ROOT/sources/$f.part" "$ROOT/sources/$f"; echo "ok   $f"
  else
    rm -f "$ROOT/sources/$f.part"; echo "FAIL $f" >&2; fail=1
  fi
done
[ $fail = 0 ] || { echo "sources.sh: some files could not be copied (see FAIL lines)" >&2; exit 1; }
du -sh "$ROOT/sources"
