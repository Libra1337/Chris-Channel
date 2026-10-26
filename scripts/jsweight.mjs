// JS weight per page: loads each page in Chromium, scrolls to the end, lists every JS file fetched,
// and sums the gzip size of those files from dist/. Usage: node scripts/jsweight.mjs [baseUrl] [paths...]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const BASE = (process.argv[2] || 'http://127.0.0.1:4322').replace(/\/$/, '');
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/projects/aogiri-phone/'];
const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const b = await chromium.launch();
const out = {};
for (const path of paths) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const js = new Set();
  p.on('response', (r) => { const u = new URL(r.url()); if (u.origin === new URL(BASE).origin && /\.m?js$/.test(u.pathname)) js.add(u.pathname); });
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.waitForTimeout(1500);
  // Inline module scripts count too.
  const inline = await p.evaluate(() => [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent || '').join('\n'));
  let gz = gzipSync(inline).length, raw = inline.length;
  for (const f of js) { const buf = readFileSync(DIST + f); raw += buf.length; gz += gzipSync(buf, { level: 9 }).length; }
  out[path] = { files: js.size, rawKB: +(raw / 1024).toFixed(1), gzipKB: +(gz / 1024).toFixed(1) };
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out));
