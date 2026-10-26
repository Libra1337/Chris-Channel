// Record the two demo films at 1440×900 with real pointer movement, wheel scrolling and interactions.
//   预览/演示-首页.mp4      home: hero light field + mark, index hover + filter, lab demos, glass slider, notes, about
//   预览/演示-手机项目.mp4  index → phone page (title morph), rotate-in scroll story, glass before/after, Lumen
// Headless video does not draw the system cursor, so an arrow overlay is injected for the recording only.
// Heavy: run inside the heavy-job mutex. Usage: node scripts/record.mjs [baseUrl] [home|phone|both]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
const BASE = (process.argv[2] || 'http://127.0.0.1:4322').replace(/\/$/, '');
const WHICH = process.argv[3] || 'both';
const OUT = fileURLToPath(new URL('../预览/', import.meta.url));
const FF = join(homedir(), '.local/bin/ffmpeg');
const W = 1440, H = 900;

const ARROW = `(() => { const add = () => { if (document.getElementById('__rec-cur')) return;
  const c = document.createElement('div'); c.id = '__rec-cur';
  c.innerHTML = '<svg width="22" height="28" viewBox="0 0 22 28"><path d="M2 2v20.5l5.2-4.6 3.4 7.6 3.6-1.6-3.4-7.4H18z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;translate:-2px -2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));transition:scale .12s';
  document.documentElement.appendChild(c);
  addEventListener('pointermove', (e) => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, { passive: true, capture: true });
  addEventListener('pointerdown', () => c.style.scale = '.85', true); addEventListener('pointerup', () => c.style.scale = '1', true); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add(); })();`;

async function session(name, fn) {
  const TMP = join(tmpdir(), 'portfolio-rec-' + name);
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true }); mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });   // real GPU: the light field refuses software GL
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: TMP, size: { width: W, height: H } } });
  await ctx.addInitScript(ARROW);
  const p = await ctx.newPage();
  const t0 = Date.now();
  await fn(p);
  const secs = (Date.now() - t0) / 1000;
  const vid = p.video(); await ctx.close(); const src = await vid.path(); await b.close();
  const out = join(OUT, `演示-${name}.mp4`);
  // Trim the blank first frames (~0.6 s); speed up gently (≤ 1.35×) so the film lands near 56 s.
  const k = Math.min(1.35, Math.max(1, (secs - 0.6) / 56));
  execFileSync(FF, ['-v', 'error', '-y', '-ss', '0.6', '-i', src, '-vf', `setpts=PTS/${k.toFixed(3)},fps=30`, '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('saved', out, `${secs.toFixed(1)} s`, readdirSync(TMP).length);
}

// Helpers: eased pointer paths, wheel scrolling through Lenis, waiting.
const wait = (p, ms) => p.waitForTimeout(ms);
let px = W / 2, py = H / 2;
async function glide(p, x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16));
  const x0 = px, y0 = py;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await p.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e);
    await wait(p, ms / steps);
  }
  px = x; py = y;
}
async function glideTo(p, sel, dx = 0.5, dy = 0.5, ms = 700) {
  const h = await p.waitForSelector(sel, { state: 'visible', timeout: 5000 });
  await h.evaluate((e) => { const r = e.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 20) { const y = r.top + scrollY - innerHeight / 2; window.__lenis ? window.__lenis.scrollTo(y, { duration: 0.8 }) : scrollTo({ top: y, behavior: 'smooth' }); } });
  await wait(p, 120);
  const r = await h.boundingBox();
  await glide(p, r.x + r.width * dx, r.y + r.height * dy, ms);
  return r;
}
async function wheelTo(p, target, ms = 1600, off = -80) {
  const yT = await p.evaluate(([s, off]) => typeof s === 'number' ? s : document.querySelector(s).getBoundingClientRect().top + scrollY + off, [target, off]);
  const steps = Math.round(ms / 50);
  for (let i = 0; i < steps; i++) {
    const cur = await p.evaluate(() => scrollY);
    const left = yT - cur; if (Math.abs(left) < 4) break;
    await p.mouse.wheel(0, Math.max(-140, Math.min(140, left / Math.max(1, (steps - i) / 2))));
    await wait(p, 50);
  }
  await wait(p, 500);
}
const click = async (p, sel, ms = 600) => { await glideTo(p, sel, 0.5, 0.5, ms); await wait(p, 120); await p.mouse.down(); await wait(p, 90); await p.mouse.up(); };

async function home(p) {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.mouse.move(px, py);
  await wait(p, 2400);                                   // the mark assembles from light
  await glide(p, 980, 260, 900); await glide(p, 1180, 520, 800);   // the light field follows the pointer
  await glideTo(p, '.hero .btn.solid', 0.5, 0.5, 600); await wait(p, 500);
  await glideTo(p, '.hero .btn.lg:not(.solid)', 0.5, 0.5, 450); await wait(p, 400);
  await glide(p, 1060, 41, 500); await glide(p, 1150, 41, 380); await glide(p, 980, 41, 380);   // the nav lens follows
  await wheelTo(p, '#intro h2', 1100, -50); await wait(p, 1100);   // the nav turns light over paper
  await wheelTo(p, '#work', 1100); await wait(p, 300);
  await wheelTo(p, '.ix-row:nth-child(3)', 800, -300);
  for (const k of [2, 4, 7]) { await glideTo(p, `.ix-row:nth-child(${k}) .ix-title`, 0.75, 0.5, 500); await wait(p, 1000); }
  await glide(p, 1300, 200, 300);
  await click(p, '[data-f="apps"]', 500); await wait(p, 900);
  await click(p, '[data-f="all"]', 400); await wait(p, 400);
  await wheelTo(p, '#pan-fo', 1300, -40);
  await click(p, '[data-up="a"]', 500); await wait(p, 900);
  await click(p, '[data-send]', 500); await wait(p, 1500);
  await click(p, '[data-mid]', 500); await wait(p, 1900);
  await click(p, '#tab-md', 500); await p.waitForSelector('#pan-md:not([hidden])', { timeout: 5000 }).catch(() => p.click('#tab-md')); await wait(p, 400);
  await click(p, '#pan-md [data-src]', 400); await p.keyboard.press('ControlOrMeta+End');
  await p.keyboard.type('\n\n## Typed live\n\nThis is **bold** and `code`.', { delay: 26 });
  await wait(p, 600);
  await wheelTo(p, '#craft .cmp-wrap', 1300, -160);
  const r = await glideTo(p, '#craft .cmp-wrap .cmp', 0.5, 0.5, 500);
  await p.mouse.down(); await glide(p, r.x + r.width * 0.15, r.y + r.height * 0.5, 700); await glide(p, r.x + r.width * 0.85, r.y + r.height * 0.5, 900); await glide(p, r.x + r.width * 0.5, r.y + r.height * 0.5, 500); await p.mouse.up();
  await wheelTo(p, '#notes', 1500); await wait(p, 1200);
  await wheelTo(p, '#about', 1500); await wait(p, 400);
  await click(p, '[data-copy]', 600); await wait(p, 1200);
  await click(p, '[data-lang="zh"]', 700); await wait(p, 1500);
}

async function phone(p) {
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.mouse.move(px, py);
  await wait(p, 900);
  await p.evaluate(() => { const r = document.querySelectorAll('.ix-row')[6]; const y = r.getBoundingClientRect().top + scrollY - innerHeight / 2 + 40; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); });
  await wait(p, 900);
  await glideTo(p, '.ix-row:nth-child(7) .ix-title', 0.7, 0.5, 700); await wait(p, 1300);
  await click(p, '.ix-row:nth-child(7) .ix-title', 250);   // the title morphs into the project hero
  await p.waitForLoadState('networkidle'); await wait(p, 2200);
  await glide(p, 980, 620, 600);
  await wheelTo(p, '[data-steps]', 2400, 0);              // the device rotates in
  const tall = await p.evaluate(() => { const e = document.querySelector('[data-steps]'); return { top: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight }; });
  for (let i = 1; i <= 5; i++) { await wheelTo(p, Math.round(tall.top + (tall.h - H) * (i / 5)), 800, 0); await wait(p, 700); }   // pinned screens change
  await wheelTo(p, '.glass-cmp', 1500, -40);
  const r = await glideTo(p, '.gc-pane:not([hidden]) .cmp', 0.5, 0.5, 500);
  await p.mouse.down(); await glide(p, r.x + r.width * 0.12, r.y + r.height * 0.5, 800); await glide(p, r.x + r.width * 0.88, r.y + r.height * 0.5, 1000); await glide(p, r.x + r.width * 0.5, r.y + r.height * 0.5, 500); await p.mouse.up();
  await click(p, '[data-pick="1"]', 500); await wait(p, 700);
  await glideTo(p, '.gc-pane:not([hidden]) .dev', 0.3, 0.3, 500); await glideTo(p, '.gc-pane:not([hidden]) .dev', 0.7, 0.7, 600);
  await click(p, '[data-pick="2"]', 500); await wait(p, 900);
  await wheelTo(p, '.p-next', 2600, -120); await wait(p, 400);
  await glideTo(p, '.p-next', 0.4, 0.5, 700); await wait(p, 1200);
}

if (WHICH === 'home' || WHICH === 'both') await session('首页', home);
if (WHICH === 'phone' || WHICH === 'both') await session('手机项目', phone);
