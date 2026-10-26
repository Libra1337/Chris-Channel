// Screenshots of Zaji (the Mac reader) for the Zaji case study: the reading page and engine shipped inside the installed
// Zaji.app (1.3.0), opened on a scratch copy of the project's samples/ folder, so no personal files appear. The app shows
// its own name now, so the sample keeps a neutral title (「阅读体验示例」; old names taken out). Output: .cache/zaji/*.png (2x).
// 1. Copy the project's samples/ folder to a scratch dir (sample.md, sub/, assets/; add 阅读示例.pdf printed from the
//    light reading page), then
//    HOME=<scratch>/home ~/Applications/Zaji.app/Contents/MacOS/mdread-engine <scratch>/samples -p 8760 --no-browser
// 2. node scripts/zaji-shots.mjs [http://127.0.0.1:8760] [outdir]
// The page clock is fixed at 13:10 (greeting 「中午好」, files 「今天 13:05」) so re-shoots match.
// The iOS shots come from the 1.3.0 Debug simulator build (xcodebuild -derivedDataPath ios/build/dd, no signing), installed on
// the existing iPhone 18 Pro simulator and launched with -PaneReset -PaneSeed (timeline) and -PaneCompose (style page),
// captured with `xcrun simctl io <device> screenshot`, under the heavy-job mutex; the simulator is shut down afterwards.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = (process.argv[2] || 'http://127.0.0.1:8760').replace(/\/$/, '') + '/?app=1';
const OUT = process.argv[3] || '.cache/zaji';
mkdirSync(OUT, { recursive: true });
const DOC = '#/p/sample.md', PDF = '#/p/' + encodeURIComponent('阅读示例.pdf');
const shots = [
  ['home-dark', 'dark', '#/'], ['home-light', 'light', '#/'],
  ['md-dark', 'dark', DOC], ['md-light', 'light', DOC],
  ['md-dark-code', 'dark', DOC, async (p) => p.evaluate(() => { const h = [...document.querySelectorAll('#article h2')].find((x) => /代码/.test(x.textContent)); document.querySelector('#scroller').scrollTop = h.offsetTop - 90; })],
  ['pdf-dark', 'dark', PDF, async (p) => p.waitForTimeout(2500)],
  ['search-dark', 'dark', DOC, async (p) => { await p.keyboard.press('Meta+k'); await p.waitForTimeout(300); await p.keyboard.type('代码', { delay: 40 }); await p.waitForTimeout(1500); }],
  ['aa-dark', 'dark', DOC, async (p) => p.click('#btn-font')],
  ['edit-dark', 'dark', DOC, async (p) => { await p.click('#btn-edit'); await p.waitForTimeout(1500); }],
];
const CLOCK = new Date('2026-10-25T13:10:00+08:00');
const b = await chromium.launch();
for (const [name, theme, hash, act] of shots) {
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, colorScheme: theme });
  const p = await ctx.newPage();
  await p.clock.install({ time: CLOCK });
  await p.addInitScript((t) => localStorage.setItem('mdread-theme', t), theme);
  await p.goto(BASE + hash, { waitUntil: 'load' }); // the reading page keeps a change-watch request open
  await p.waitForTimeout(3500);
  if (act) await act(p);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log(name);
}
await b.close();
