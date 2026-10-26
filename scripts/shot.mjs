// Quick screenshot helper: node scripts/shot.mjs <url> <out.png> [width] [scrollY...]
import { chromium } from 'playwright';
const [url, out, w = '1440', ...ys] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +w < 800 ? 844 : 900 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
const list = ys.length ? ys : ['0'];
for (const [i, y] of list.entries()) {
  await p.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(+y, { immediate: true }) : scrollTo(0, +y)), y);
  await p.waitForTimeout(900);
  await p.screenshot({ path: list.length > 1 ? out.replace(/\.png$/, `-${i}.png`) : out });
}
console.log('errors:', errs.length ? errs : 'none', 'height:', await p.evaluate(() => document.documentElement.scrollHeight));
await b.close();
