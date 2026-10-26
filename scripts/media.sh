#!/bin/bash
# Transcode source recordings into web video (H.264 + VP9 WebM) with WebP posters.
# Reads originals from my folders (iCloud Desktop files via the vendored copies in sources/, see scripts/sources.sh);
# writes only to public/media/video. Every source is checked before anything is encoded: a missing one stops the script.
# Heavy job: runs inside the shared mutex (see ~/CLAUDE.md).
set -euo pipefail
FF=~/.local/bin/ffmpeg
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/media/video"
mkdir -p "$OUT"
N=~/lynshen-wt/aogiri-native-shots
S="$ROOT/sources"
T="$S/手机端方案/通透改版"
P=~/lynshen-wt/promo-video/public/footage
X264=(-c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -profile:v high -movflags +faststart
      -colorspace bt709 -color_primaries bt709 -color_trc bt709)
VP9=(-c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -cpu-used 3 -deadline good -pix_fmt yuv420p)
REC="$ROOT/.cache/rec"

# Guard: every source must exist before the lock is taken or anything is encoded.
SOURCES=(
  "$S/宣传片分镜/预览-A-1080p.mp4" "$N/welcome/ios-first-run-dark.mp4" "$N/tabs/tabs.mp4"
  "$T/录屏-滚动与头像放大-深色.mp4" "$T/录屏-改版前.mp4" "$N/welcome/android-first-run-dark.mp4" "$P/phone-remote.mp4"
  "$P/desk-eco.mp4" "$P/desk-modes.mp4" "$P/gw-eco-logs.mp4" ~/lynshen-wt/launch-slow-scripts/out/0.10.1-冷启动-深色.mp4
  ~/lynshen-wt/desk-ux-assets/subagents/after-dark.gif ~/lynshen-wt/desk-ux-assets/recap/after-dark.gif
  "$REC/zaji.mp4" "$REC/armil.mp4" "$REC/desk-eco-dark.mp4" ~/lynshen-wt/desk-plan-shots/plan-complete-dark.mp4
)
miss=0; for f in "${SOURCES[@]}"; do [ -s "$f" ] || { echo "media.sh: missing source $f" >&2; miss=1; }; done
[ $miss = 0 ] || { echo "media.sh: nothing encoded. Run scripts/sources.sh for sources/ files." >&2; exit 1; }

until mkdir ~/lynshen-wt/heavy.lock 2>/dev/null; do sleep 60; done
echo portfolio-media > ~/lynshen-wt/heavy.lock/owner
trap 'rm -rf ~/lynshen-wt/heavy.lock' EXIT


# name | source | filter | poster time (s) | audio(yes/no) | extra input args
enc() {
  local name=$1 src=$2 vf=$3 pt=$4 audio=$5; shift 5
  [ -f "$OUT/$name.mp4" ] && [ -f "$OUT/$name.webm" ] && return 0
  local a264=(-an) avp9=(-an)
  if [ "$audio" = yes ]; then a264=(-c:a aac -b:a 128k); avp9=(-c:a libopus -b:a 96k); fi
  $FF -v error -y "$@" -i "$src" -vf "$vf" "${X264[@]}" "${a264[@]}" "$OUT/$name.mp4"
  $FF -v error -y "$@" -i "$src" -vf "$vf" "${VP9[@]}" "${avp9[@]}" "$OUT/$name.webm"
  $FF -v error -y -ss "$pt" -i "$OUT/$name.mp4" -frames:v 1 -c:v libwebp -quality 78 "$OUT/$name.webp"
  echo "$name $(du -h "$OUT/$name.mp4" | cut -f1) $(du -h "$OUT/$name.webm" | cut -f1)"
}

# Promo film (keeps audio), 1080p and 720p
# The model menu (about 8.5-12.5 s) lists per-model prices; that column is blurred on the site.
HIDE="split[a][b];[b]crop=92:168:1255:380,boxblur=10:2[bl];[a][bl]overlay=1255:380:enable='between(t,8.9,12.4)'"
enc film-1080 "$S/宣传片分镜/预览-A-1080p.mp4" "$HIDE,scale=1920:-2" 53.5 yes
enc film-720  "$S/宣传片分镜/预览-A-1080p.mp4" "$HIDE,scale=1280:-2" 53.5 yes
# Phone recordings (portrait, shown in a phone frame)
enc phone-welcome "$N/welcome/ios-first-run-dark.mp4" "fps=30,scale=588:-2" 26 no
enc phone-tabs    "$N/tabs/tabs.mp4"                  "fps=30,scale=588:-2" 2 no
enc phone-glass   "$T/录屏-滚动与头像放大-深色.mp4"      "fps=30,scale=588:-2" 2 no
enc phone-before  "$T/录屏-改版前.mp4"                  "fps=30,scale=588:-2" 2 no
enc phone-android "$N/welcome/android-first-run-dark.mp4" "fps=30,scale=540:-2" 12 no
enc phone-remote  "$P/phone-remote.mp4"               "fps=30,scale=588:-2" 5 no
# Desktop recordings (demo data). The account chip in the console's bottom-left is cropped off.
enc desk-eco   "$P/desk-eco.mp4"   "fps=30,scale=1440:-2" 6 no -ss 9.7
enc desk-modes "$P/desk-modes.mp4" "fps=30,scale=1440:-2" 4 no
enc gw-logs    "$P/gw-eco-logs.mp4" "crop=1640:1400:480:0,fps=30,scale=1312:-2" 4 no
enc launch     ~/lynshen-wt/launch-slow-scripts/out/0.10.1-冷启动-深色.mp4 "crop=760:500:280:190,fps=30,scale=760:-2" 2.0 no
enc subagents  ~/lynshen-wt/desk-ux-assets/subagents/after-dark.gif "fps=30,scale=544:-2:flags=lanczos" 8 no
enc recap      ~/lynshen-wt/desk-ux-assets/recap/after-dark.gif "fps=30,scale=1008:-2:flags=lanczos" 4.5 no
# UI loops recorded from the real apps by scripts/ui-rec.mjs (Zaji's reading page; Armil's tarot draw on a phone)
enc zaji-ui  "$REC/zaji.mp4"      "fps=30,scale=1440:-2" 3.2 no
enc qx-tarot "$REC/armil.mp4"  "fps=30,scale=588:-2" 7.5 no
# First screen, dark theme: the promo's desktop scene re-recorded
# with theme dark from the desktop repo's browser fixture (promo-video/recording/desk-harness.mjs + desk-eco.mjs with
# theme: 'dark', dpr 2; fixture data only). Starts after the model menu closes, as the light cut does.
enc desk-eco-dark "$REC/desk-eco-dark.mp4" "fps=30,scale=1440:-2" 9 no -ss 8.0

# Scroll-scrubbed clip: every frame a keyframe so seeking is instant
if [ ! -f "$OUT/plan-scrub.mp4" ]; then
  $FF -v error -y -i ~/lynshen-wt/desk-plan-shots/plan-complete-dark.mp4 -vf "fps=30,scale=508:-2" \
    "${X264[@]}" -g 1 -crf 26 -an "$OUT/plan-scrub.mp4"
  $FF -v error -y -ss 6.9 -i "$OUT/plan-scrub.mp4" -frames:v 1 -c:v libwebp -quality 80 "$OUT/plan-scrub.webp"
  echo "plan-scrub $(du -h "$OUT/plan-scrub.mp4" | cut -f1)"
fi


# Stills from the desktop/console recordings (demo data) for scroll showcases -> .cache/frames
FR="$(cd "$(dirname "$0")/.." && pwd)/.cache/frames"; mkdir -p "$FR"
still() { [ -f "$FR/$1.png" ] || $FF -v error -y -ss "$3" -i "$2" -frames:v 1 ${4:+-vf "$4"} "$FR/$1.png"; }
still desk-start    "$P/desk-eco.mp4"   0.5
still desk-plan     "$P/desk-eco.mp4"   19
still desk-approval "$P/desk-eco.mp4"   21
still desk-modes    "$P/desk-modes.mp4" 4
still desk-code     "$P/desk-modes.mp4" 1

# Small renditions for narrow screens (<= 820 px wide): phone clips at 360 px wide, desktop clips at 720p.
small() {
  local name=$1 vf=$2
  [ -f "$OUT/$name-sm.mp4" ] && return 0
  $FF -v error -y -i "$OUT/$name.mp4" -vf "$vf" "${X264[@]}" -crf 26 -an "$OUT/$name-sm.mp4"
  $FF -v error -y -i "$OUT/$name.mp4" -vf "$vf" "${VP9[@]}" -crf 38 -an "$OUT/$name-sm.webm"
  echo "$name-sm $(du -h "$OUT/$name-sm.mp4" | cut -f1)"
}
for n in phone-welcome phone-tabs phone-glass phone-before phone-remote; do small $n "scale=360:-2"; done
small phone-android "scale=360:-2"
for n in desk-eco desk-eco-dark desk-modes gw-logs zaji-ui; do small $n "scale=720:-2"; done
small qx-tarot "scale=360:-2"
small subagents "scale=360:-2"
small recap "scale=640:-2"
small launch "scale=480:-2"
du -sh "$OUT"
