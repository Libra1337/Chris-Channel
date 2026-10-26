// Capture the public docs site (docs.lynshen.org) for the gateway deep dive. Usage: node scripts/docs-shots.mjs <outdir>
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
for (const [n, u] of [['docs-streaming', 'https://docs.lynshen.org/en/docs/guide/streaming']]) {
  await p.goto(u, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${process.argv[2] || '/tmp/pv/docs'}/${n}.png` });
}
await b.close();
