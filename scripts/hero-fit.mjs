// Hero fit check: the name must never be clipped or run under the devices. Measures the name's
// glyph box against its column and the phone and laptop frames at each width, EN and ZH (Chromium; WebKit if installed).
// usage: node hero-measure.mjs <base> [shotDir] [label]
import { chromium, webkit } from 'playwright';
const [base, shotDir, label = 'm'] = process.argv.slice(2);
const widths = [1280, 1440, 1680, 1920, 390, 900, 1024];
const out = [];
for (const [ename, eng] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await eng.launch().catch(() => null);
  if (!b) { console.log(`${ename}: not installed, skipped`); continue; }
  for (const w of widths) for (const lang of ['en', 'zh']) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(`${base}/?lang=${lang}`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
    const m = await p.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) }; };
      const row = document.querySelector('.hn-row'), hn = document.querySelector('.hn');
      const range = document.createRange(); range.selectNodeContents(hn); const tb = range.getBoundingClientRect();
      const ph = r('.hs-phone .dev'), lap = r('.hs-lap .dev');
      const name = { l: Math.round(tb.left), r: Math.round(tb.right), t: Math.round(tb.top), b: Math.round(tb.bottom) };
      const vOver = (a, c) => a && c && a.t < c.b && c.t < a.b;
      const clipped = hn.scrollWidth > row.clientWidth + 1 || tb.right > row.getBoundingClientRect().right + 1;
      const underPhone = vOver(name, ph) && name.r > ph.l;
      const underLap = vOver(name, lap) && name.r > lap.l;
      const line = document.querySelector('.hero-line'); const lr = line.getBoundingClientRect();
      const font = getComputedStyle(document.querySelector('.hero-name')).fontSize;
      return { name, phone: ph, lap, clipped, underPhone, underLap, font, lineH: Math.round(lr.height), fontOk: document.fonts.check('400 20px "Instrument Serif"') };
    });
    out.push({ eng: ename, w, lang, ...m });
    if (shotDir && w === 1440 && lang === 'zh') await p.screenshot({ path: `${shotDir}/${label}-${ename}-1440-zh.png` });
    await ctx.close();
  }
  await b.close();
}
for (const o of out) console.log(`${o.eng.padEnd(8)} ${String(o.w).padStart(4)} ${o.lang} font ${o.font} name ${o.name.l}-${o.name.r} phone ${o.phone?.l} lap ${o.lap?.l} clipped=${o.clipped} underPhone=${o.underPhone} underLap=${o.underLap} lineH=${o.lineH} serif=${o.fontOk}`);
const bad = out.filter((o) => o.clipped || o.underPhone || o.underLap);
console.log(bad.length ? `${bad.length} BAD` : 'ALL CLEAR');
