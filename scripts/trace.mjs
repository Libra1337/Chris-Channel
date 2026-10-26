// Chrome trace of a full scroll; prints main-thread and raster time by category, plus long animation frames.
// Usage: node scripts/trace.mjs [url] [label] [width]
import { chromium } from 'playwright';
const URL_ = process.argv[2] || 'http://127.0.0.1:4322/';
const label = process.argv[3] || '';
const W = +(process.argv[4] || 1440);
const mobile = W < 800;
const b = await chromium.launch({ channel: 'chromium' });
const ctx = await b.newContext({ viewport: { width: W, height: mobile ? 844 : 900 }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__loaf = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__rec && window.__loaf.push({ d: e.duration, block: e.blockingDuration, s: (e.scripts || []).map((s) => s.sourceFunctionName || s.invoker).slice(0, 2) }))).observe({ type: 'long-animation-frame' }); } catch {}
});
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.CPU || 4) });
await p.goto(URL_, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const events = [];
cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,blink,cc,gpu,viz,benchmark,disabled-by-default-devtools.timeline.frame', transferMode: 'ReportEvents' });
await p.evaluate(() => (window.__rec = true));
const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const t0 = Date.now();
if (!mobile) { await p.mouse.move(W / 2, 400); for (let y = 0; y < total; y += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); } }
else { for (let y = 0; y < total; y += 60) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(16); } }
await p.waitForTimeout(600);
const secs = (Date.now() - t0) / 1000;
await cdp.send('Tracing.end');
await done;
const loaf = await p.evaluate(() => window.__loaf);
await b.close();
const pick = ['FunctionCall', 'EvaluateScript', 'TimerFire', 'FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'RasterTask', 'ImageDecodeTask', 'Decode Image', 'Commit', 'GPUTask', 'DrawFrame', 'ScrollUpdate', 'MediaPlayer', 'HitTest'];
const sum = {};
for (const e of events) if (e.ph === 'X' && pick.includes(e.name)) sum[e.name] = (sum[e.name] || 0) + (e.dur || 0) / 1000;
const r = Object.fromEntries(Object.entries(sum).filter(([, v]) => v > 5).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v)]));
const big = loaf.filter((l) => l.d > 50);
// Compositor frames: PipelineReporter slices carry the frame state (presented / dropped).
const states = {};
for (const e of events) if (e.name === 'PipelineReporter' && e.ph === 'b') { const st = e.args?.chrome_frame_reporter?.state || 'x'; states[st] = (states[st] || 0) + 1; }
const pres = states.STATE_PRESENTED_ALL || 0, drop = (states.STATE_DROPPED || 0) + (states.STATE_PRESENTED_PARTIAL || 0);
const frames = `frames presented ${pres}, dropped/partial ${drop} (${pres + drop ? Math.round(100 * drop / (pres + drop)) : 0}%)`;
console.log(label, W, frames, `scroll ${secs}s`, JSON.stringify(r), `LoAF>50ms: ${big.length} max ${Math.round(Math.max(0, ...loaf.map((l) => l.d)))}ms`, JSON.stringify(big.slice(0, 4)));
