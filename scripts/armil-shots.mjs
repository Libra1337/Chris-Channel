// Phone screenshots of 牵星 (English name Armil) for its case study: the app's own static build (the chart engine runs
// in the page, no server), served locally, with a fictional sample profile (示例, 2000-03-21 09:30 北京) in
// localStorage. 390 × 844 @3x; a 50 pt band on top stands in for the status bar under the frame's island.
// The app's built-in English eyebrow text is swapped for the site's English name.
// Usage: python3 -m http.server 8791 --directory <牵星>/web/dist & node scripts/armil-shots.mjs [base] [outdir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = (process.argv[2] || 'http://127.0.0.1:8791').replace(/\/$/, '');
const OUT = process.argv[3] || '.cache/armil';
mkdirSync(OUT, { recursive: true });
const prof = [{ id: 'demo', name: '示例', relation: '自己', updatedAt: Date.now(), birth: { calendar: 'solar', year: 2000, month: 3, day: 21, hour: 9, minute: 30, gender: '女', longitude: 116.4, latitude: 39.9, place: '北京', auto_dst: true, zi_sect: 2, yun_sect: 1 } }];
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
await ctx.addInitScript((p) => { localStorage.setItem('xingshu.profiles.v1', JSON.stringify(p)); localStorage.setItem('xingshu.activeProfile.v1', 'demo'); }, prof);
await ctx.addInitScript(() => {
  const fix = (n) => { if (n.nodeType === 3) { const t = n.nodeValue.replace(/LODESTAR/g, 'ARMIL').replace(/Lodestar/g, 'Armil').replace(/XINGSHU/g, 'ARMIL').replace(/Xingshu/g, 'Armil').replace(/星枢/g, '牵星'); if (t !== n.nodeValue) n.nodeValue = t; } else n.childNodes?.forEach(fix); };
  new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); })).observe(document, { subtree: true, childList: true, characterData: true });
});
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
const top = () => p.addStyleTag({ content: 'body{padding-top:50px!important}' });
const shots = [
  ['390-today', '/#/', async () => {}],
  ['390-bazi-reading', '/#/bazi', async () => { await p.waitForSelector('text=解读', { timeout: 20000 }); await p.locator('text=解读').first().scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, -70)); }],
];
for (const [name, hash, act] of shots) {
  await p.goto(BASE + hash, { waitUntil: 'load' }); await p.waitForTimeout(3500); await top();
  await act(); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name);
}
console.log('errors', errs.length ? errs : 'none');
await b.close();
