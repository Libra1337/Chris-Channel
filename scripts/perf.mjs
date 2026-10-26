// Scroll performance probe. Scrolls the whole page and records frame times and long tasks.
// Usage: node scripts/perf.mjs [url] [label]   (runs 1440 desktop and 390 mobile with 4x CPU throttle)
import { chromium } from 'playwright';
const URL_ = process.argv[2] || 'http://127.0.0.1:4322/';
const label = process.argv[3] || '';
const CPU = +(process.env.CPU || 4);
const b = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal', '--enable-gpu', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const out = {};
for (const [name, vp, mobile, cpu] of [['1440', { width: 1440, height: 900 }, false, CPU], ['390', { width: 390, height: 844 }, true, CPU]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 2 });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await p.addInitScript(() => {
    window.__lt = []; window.__ft = []; window.__rec = false;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__rec && window.__lt.push(e.duration))).observe({ type: 'longtask', buffered: false });
    let last = 0;
    const tick = (t) => { if (window.__rec && last) window.__ft.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await p.goto(URL_, { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.evaluate(() => (window.__rec = true));
  const t0 = Date.now();
  if (!mobile) {
    await p.mouse.move(700, 450);
    for (let y = 0; y < total; y += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); }
  } else {
    // Touch-like native scrolling in small steps.
    for (let y = 0; y < total; y += 60) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(16); }
  }
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({ ft: window.__ft, lt: window.__lt }));
  const ft = r.ft.filter((x) => x < 1000);
  const avg = ft.reduce((a, x) => a + x, 0) / ft.length;
  const slow = ft.filter((x) => x > 20).length / ft.length;
  out[name] = { fps: +(1000 / avg).toFixed(1), slowFramesPct: +(slow * 100).toFixed(1), p95ms: +ft.sort((a, b) => a - b)[Math.floor(ft.length * 0.95)].toFixed(1),
    longTasks: r.lt.length, longTaskTotalMs: Math.round(r.lt.reduce((a, x) => a + x, 0)), longTaskMaxMs: Math.round(Math.max(0, ...r.lt)), secs: (Date.now() - t0) / 1000 };
  await ctx.close();
}
await b.close();
console.log(label, JSON.stringify(out));
