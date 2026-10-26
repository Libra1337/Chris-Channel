#!/bin/zsh
# Build, serve dist on :4322, then measure: Lighthouse mobile (home + phone page), scroll fps/long tasks, JS weight.
# Runs inside the heavy-job mutex. Usage: scripts/measure.sh <label>   → writes /tmp/portfolio-measure-<label>/
set -e
LABEL=${1:-run}
cd "$(dirname $0)/.."
OUT=/tmp/portfolio-measure-$LABEL; mkdir -p $OUT
until mkdir ~/lynshen-wt/heavy.lock 2>/dev/null; do sleep 60; done
echo "portfolio-measure-$LABEL" > ~/lynshen-wt/heavy.lock/owner
trap 'rm -rf ~/lynshen-wt/heavy.lock; [ -n "$SRV" ] && kill $SRV 2>/dev/null' EXIT
[ "$NOBUILD" = 1 ] || npx astro build > $OUT/build.log 2>&1
npx astro preview --port 4322 --host 127.0.0.1 > $OUT/serve.log 2>&1 & SRV=$!
sleep 3
LH=~/.npm/_npx/1fc4933a57a44b8f/node_modules/.bin/lighthouse
CHROME=$(ls -d ~/Library/Caches/ms-playwright/chromium-1248/chrome-mac*/*.app/Contents/MacOS/* | head -1)
for pg in "/" "/projects/aogiri-phone/"; do
  n=$(echo $pg | tr '/' '_')
  for i in 1 2; do
    CHROME_PATH="$CHROME" $LH "http://127.0.0.1:4322$pg" --quiet --form-factor=mobile --only-categories=performance,accessibility \
      --chrome-flags="--headless=new" --output=json --output-path=$OUT/lh$n-$i.json || true
  done
done
node scripts/perf.mjs http://127.0.0.1:4322/ home > $OUT/perf-home.txt 2>&1 || true
node scripts/perf.mjs http://127.0.0.1:4322/projects/aogiri-phone/ phone > $OUT/perf-phone.txt 2>&1 || true
node scripts/jsweight.mjs http://127.0.0.1:4322 / /projects/aogiri-phone/ /projects/gateway/ > $OUT/js.txt 2>&1 || true
node -e '
const fs=require("fs");const d=process.argv[1];
for (const f of fs.readdirSync(d).filter(f=>f.startsWith("lh") && f.endsWith(".json"))) { try { const j=JSON.parse(fs.readFileSync(d+"/"+f));
 const a=j.audits; console.log(f, "perf", Math.round(j.categories.performance.score*100), "a11y", Math.round(j.categories.accessibility.score*100),
 "LCP", a["largest-contentful-paint"].displayValue, "TBT", a["total-blocking-time"].displayValue, "CLS", a["cumulative-layout-shift"].displayValue, "FCP", a["first-contentful-paint"].displayValue);} catch(e){console.log(f,"ERR",e.message)} }' $OUT > $OUT/lh-summary.txt
cat $OUT/lh-summary.txt $OUT/perf-home.txt $OUT/perf-phone.txt $OUT/js.txt
