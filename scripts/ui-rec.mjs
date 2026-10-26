// Record a real UI as a short loop: Chromium screencast frames (with their timestamps) → a near-lossless MP4 in
// .cache/rec/, which scripts/media.sh then encodes for the web. Two scripted takes:
//   zaji     Zaji's reading page (the engine and page inside Zaji.app 1.3.0 on a scratch copy of samples/, :8760; clock 13:10): home → document → scroll →
//            Aa panel → write-left/read-right.  1180×820 @2x.
//   armil    牵星 (Armil) on a phone (the app's own build, :8790, fictional 示例 profile): tarot shuffle → pick
//            three → reveal → reading. 390×844 @3x. Brand text in the app is swapped for the site's name.
// Usage: node scripts/ui-rec.mjs zaji|armil   (servers must already run; heavy job: run inside the mutex)
import { chromium } from 'playwright';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
const take = process.argv[2];
const OUT = fileURLToPath(new URL('../.cache/rec/', import.meta.url));
const FR = `${OUT}${take}-frames/`; rmSync(FR, { recursive: true, force: true }); mkdirSync(FR, { recursive: true });
const cfg = take === 'zaji'
  ? { url: 'http://127.0.0.1:8760/?app=1#/', w: 1180, h: 820, dsf: 2, mobile: false }
  : { url: 'http://127.0.0.1:8790/#/tarot', w: 390, h: 844, dsf: 3, mobile: true };
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dsf, colorScheme: 'dark', ...(cfg.mobile ? { isMobile: true, hasTouch: true } : {}) });
if (take === 'zaji') await ctx.addInitScript(() => localStorage.setItem('mdread-theme', 'dark'));
else {
  const prof = [{ id: 'demo', name: '示例', relation: '自己', updatedAt: Date.now(), birth: { calendar: 'solar', year: 2000, month: 3, day: 21, hour: 9, minute: 30, gender: '女', longitude: 116.4, latitude: 39.9, place: '北京', auto_dst: true, zi_sect: 2, yun_sect: 1 } }];
  await ctx.addInitScript((p) => { localStorage.setItem('xingshu.profiles.v1', JSON.stringify(p)); localStorage.setItem('xingshu.activeProfile.v1', 'demo'); }, prof);
  await ctx.addInitScript(() => {
    const fix = (n) => { if (n.nodeType === 3) { const t = n.nodeValue.replace(/LODESTAR|XINGSHU/g, 'ARMIL').replace(/Lodestar|Xingshu/g, 'Armil').replace(/星枢/g, '牵星'); if (t !== n.nodeValue) n.nodeValue = t; } else n.childNodes?.forEach(fix); };
    new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); })).observe(document, { subtree: true, childList: true, characterData: true });
  });
}
const p = await ctx.newPage();
if (take === 'zaji') await p.clock.install({ time: new Date('2026-10-25T13:10:00+08:00') });
await p.goto(cfg.url, { waitUntil: 'load' }); await p.waitForTimeout(3500);
if (take === 'armil') { await p.fill('textarea', '这学期该先把哪件事做完？'); await p.waitForTimeout(400); }
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  const i = frames.length; frames.push(f.metadata.timestamp);
  writeFileSync(`${FR}${String(i).padStart(5, '0')}.png`, Buffer.from(f.data, 'base64'));
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'png', maxWidth: cfg.w * cfg.dsf, maxHeight: cfg.h * cfg.dsf, everyNthFrame: 1 });
const wait = (ms) => p.waitForTimeout(ms);
const glide = async (sel, to, ms) => p.evaluate(async ([sel, to, ms]) => { const s = document.querySelector(sel); const a = s.scrollTop, t0 = performance.now();
  await new Promise((r) => { const f = (t) => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; s.scrollTop = a + (to - a) * e; k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); }); }, [sel, to, ms]);
if (take === 'zaji') {
  await wait(1200);
  await p.mouse.move(700, 300, { steps: 12 }); await p.locator('.hf', { hasText: '阅读体验示例' }).first().click(); await wait(1600);
  await glide('#scroller', 900, 2600); await wait(600);
  await p.mouse.move(1134 + 17, 31, { steps: 12 }); await p.click('#btn-font'); await wait(900);
  const fonts = p.locator('#fontpanel [data-font]');
  if (await fonts.count() > 1) { await fonts.nth(1).hover(); await wait(300); await fonts.nth(1).click(); await wait(1300); await fonts.nth(0).click(); await wait(900); }
  await p.locator('#fontpanel [data-lh="1.95"]').click().catch(() => {}); await wait(1100);
  await p.locator('#fontpanel [data-lh="1.75"]').click().catch(() => {}); await wait(700);
  await p.keyboard.press('Escape'); await wait(500);
  await p.click('#btn-edit'); await wait(2200);
  await p.keyboard.press('Escape'); await wait(600);
  await glide('#scroller', 0, 1400); await wait(800);
} else {
  await wait(800);
  await p.getByRole('button', { name: '洗牌' }).tap(); await wait(3200);
  for (const n of [9, 13, 17]) { await p.locator(`button[aria-label^="第 ${n} 张牌"]`).tap({ force: true }); await wait(1100); }
  await wait(1200);
  for (let k = 0; k < 3; k++) { const f = p.getByRole('button', { name: /翻开第/ }); if (await f.count()) { await f.first().tap(); await wait(1300); } }
  await wait(1200);
  await p.evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' })); await wait(2200);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await wait(1600);
}
await cdp.send('Page.stopScreencast'); await wait(300);
await b.close();
// ffconcat with each frame held until the next one arrived (real time), then a constant 30 fps encode.
let list = 'ffconcat version 1.0\n';
frames.forEach((t, i) => { const d = (frames[i + 1] ?? t + 1 / 30) - t; list += `file ${String(i).padStart(5, '0')}.png\nduration ${Math.max(0.001, d).toFixed(4)}\n`; });
writeFileSync(`${FR}list.txt`, list);
const FF = `${homedir()}/.local/bin/ffmpeg`;
execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${FR}list.txt`, '-vf', 'fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', '-pix_fmt', 'yuv420p', `${OUT}${take}.mp4`]);
rmSync(FR, { recursive: true, force: true });
console.log(take, frames.length, 'frames,', (frames.at(-1) - frames[0]).toFixed(1), 's →', `${OUT}${take}.mp4`);
