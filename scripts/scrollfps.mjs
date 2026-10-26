// Headed Chrome (real GPU) scroll test: wheel-scroll the whole page and count rendered frames
// with requestAnimationFrame plus long animation frames. Usage: node scripts/scrollfps.mjs url label [width]
import { chromium } from 'playwright';
const [url, label = '', w = '1440'] = process.argv.slice(2);
const W = +w, mobile = W < 800;
const b = await chromium.launch({ headless: false, args: ['--window-position=40,40', `--window-size=${W},${mobile ? 900 : 960}`] });
const ctx = await b.newContext({ viewport: { width: W, height: mobile ? 844 : 900 }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__f = []; window.__loaf = []; window.__on = false;
  let l = 0; const t = (x) => { if (window.__on && l) window.__f.push(x - l); l = x; requestAnimationFrame(t); }; requestAnimationFrame(t);
  try { new PerformanceObserver((o) => o.getEntries().forEach((e) => window.__on && window.__loaf.push(e.duration))).observe({ type: 'long-animation-frame' }); } catch {}
});
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await p.evaluate(() => (window.__on = true));
await p.mouse.move(W / 2, 400);
if (!mobile) for (let y = 0; y < total; y += 80) { await p.mouse.wheel(0, 80); await p.waitForTimeout(16); }
else for (let y = 0; y < total; y += 50) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(16); }
await p.waitForTimeout(500);
const r = await p.evaluate(() => ({ f: window.__f.filter((x) => x < 500), loaf: window.__loaf }));
await b.close();
const f = r.f.sort((a, c) => a - c);
const avg = f.reduce((a, x) => a + x, 0) / f.length;
const jank = f.filter((x) => x > 25).length;
console.log(label, W, `avg ${(1000 / avg).toFixed(1)} fps`, `p95 ${f[Math.floor(f.length * 0.95)].toFixed(1)} ms`, `p99 ${f[Math.floor(f.length * 0.99)].toFixed(1)} ms`,
  `frames>25ms ${jank}/${f.length}`, `LoAF>50ms ${r.loaf.filter((x) => x > 50).length} (max ${Math.round(Math.max(0, ...r.loaf))} ms)`);
