// Headless Chrome checks against a served dist/ (default http://127.0.0.1:4322).
// Screenshots of every home section, every project section and each signature moment go to 预览/ (检查-*.png);
// results go to 预览/检查结果.json. Heavy: run it inside the heavy-job mutex (see ~/CLAUDE.md).
// Usage: npx astro preview --port 4322 & node scripts/verify.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const BASE = (process.argv[2] || 'http://127.0.0.1:4322').replace(/\/$/, '');
const OUT = fileURLToPath(new URL('../预览/', import.meta.url));
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (/^检查-.*\.png$/.test(f)) rmSync(OUT + f);
const slugs = ['zaji', 'llm-provider-kit', 'jm2api', 'accc-libra', 'gateway', 'aogiri-desktop', 'aogiri-phone', 'brand', 'armil'];
const home = [['hero', 0], ['work', '#work'], ['more-work', '.ix'], ['about', '#about'], ['play', '#play'], ['notes', '#notes'], ['contact', '#contact']];
const res = [];
const ok = (name, pass, info = '') => { res.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + info : ''}`); };
// Real GPU (Metal) instead of headless SwiftShader: the light field refuses software GL by design.
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function open(w, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, deviceScaleFactor: w < 800 ? 2 : 1, ...(w < 800 ? { hasTouch: true, isMobile: true } : {}), ...opts });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('console', (m) => m.type() === 'error' && p.errs.push(m.text()));
  p.on('pageerror', (e) => p.errs.push(String(e)));
  // Media requests abort by design when the video scheduler unloads an offscreen clip.
  p.on('requestfailed', (r) => !/\.(mp4|webm)$/.test(r.url()) && p.errs.push('requestfailed ' + r.url()));
  return { ctx, p };
}
const go = async (p, path) => { await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2600); };
async function to(p, target, dy = -70) {
  await p.evaluate(([t, dy]) => {
    const y = typeof t === 'number' ? t : (document.querySelector(t)?.getBoundingClientRect().top ?? 0) + scrollY + dy;
    window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y);
  }, [target, dy]);
  await p.waitForTimeout(1200);
}
// Scroll to a fraction of a tall pinned scene.
async function frac(p, sel, f) {
  await p.evaluate(([s, f]) => { const e = document.querySelector(s); const y = e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * f; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, [sel, f]);
  await p.waitForTimeout(1400);
}
async function walk(p) {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) await to(p, y);
  await to(p, 0);
}
const shot = (p, name) => p.screenshot({ path: `${OUT}检查-${name}.png` });

for (const w of [1440, 390]) {
  const tag = w === 1440 ? '1440' : '390';
  const fine = w === 1440;
  const { ctx, p } = await open(w);
  await go(p, '/');
  // Home sections.
  for (const [i, [name, t]] of home.entries()) { await to(p, t); if (typeof t === 'string') await to(p, t); await shot(p, `${tag}-首页-${i + 1}-${name}`); }
  // Liquid glass: refraction on Chromium desktop, frosted fallback on touch; nav turns light over paper.
  await to(p, 0);
  const lg = await p.evaluate(() => ({ refract: document.documentElement.classList.contains('lg-refract'), on: document.querySelectorAll('.lg-on').length,
    bd: getComputedStyle(document.querySelector('.nav-bar'), '::before').backdropFilter }));
  ok(`${tag} liquid glass: ${fine ? 'refraction filters attached' : 'frosted fallback'}`, fine ? lg.refract && lg.on >= 6 && /url\(/.test(lg.bd) : !lg.refract && lg.on === 0 && /blur/.test(lg.bd), JSON.stringify(lg));
  await to(p, '#about h2', -50);
  const navLight = await p.evaluate(() => document.querySelector('.nav').classList.contains('light'));
  await to(p, '#work', 0);
  const navDark = await p.evaluate(() => !document.querySelector('.nav').classList.contains('light'));
  ok(`${tag} nav glass turns light over paper, dark over dark`, navLight && navDark);
  // Hero light field.
  await to(p, 0);
  const field = await p.evaluate(() => { const c = document.querySelector('canvas[data-field]'); return { on: c?.classList.contains('on'), w: c?.width }; });
  ok(`${tag} hero light field is running`, !!field.on && field.w > 0, JSON.stringify(field));
  // Home budget: ≤ 450 visible English words, 6–7 screens at 1440.
  // The strip's second list is the marquee's loop copy (aria-hidden), not new words; it is left out.
  const bud = await p.evaluate(() => ({ words: (() => { const m = document.querySelector('main').cloneNode(true); m.querySelectorAll('.hs-list[aria-hidden]').forEach((x) => x.remove()); document.body.append(m); m.style.cssText = 'position:absolute;left:-9999px;width:' + innerWidth + 'px'; const n = m.innerText.split(/\s+/).filter((x) => /[A-Za-z]/.test(x)).length; m.remove(); return n; })(), screens: +(document.documentElement.scrollHeight / innerHeight).toFixed(1) }));
  ok(`${tag} home budget: ≤ 450 English words${fine ? ', ≤ 7 screens' : ''}`, bud.words <= 450 && (!fine || bud.screens <= 7), JSON.stringify(bud));
  const strip = await p.evaluate(() => ({ cards: document.querySelectorAll('.hs-list:not([aria-hidden]) .hs-card').length, cue: !!document.querySelector('.hero-cue') }));
  ok(`${tag} first screen: project strip has every project, no scroll cue`, strip.cards === 9 && !strip.cue, JSON.stringify(strip));
  // Featured: four media panels titled by product name; the one in view plays.
  await to(p, '.feat', -120); await to(p, '.ft-xl .ft-media', -200); await p.waitForTimeout(2500);
  const ft = await p.evaluate(() => ({ titles: [...document.querySelectorAll('.ft-title [data-l="en"], .ft-title:not(:has([data-l]))')].map((t) => t.textContent.trim()),
    playing: [...document.querySelectorAll('.feat video')].filter((v) => !v.paused).length }));
  ok(`${tag} work: four product-named panels, a panel video plays in view`, ft.titles.length === 4 && !ft.titles.some((t) => /-|kit$|api$/i.test(t)) && ft.playing >= 1, JSON.stringify(ft));
  await shot(p, `${tag}-作品拼贴`);
  // More work: five rows; hover preview (fine).
  await to(p, '.ix-list', -200);
  const rows = await p.$$eval('.ix-row', (rs) => rs.length);
  ok(`${tag} More work lists the other five projects`, rows === 5, `${rows} rows`);
  if (fine) {
    await p.evaluate(() => { const r = document.querySelectorAll('.ix-row')[2]; const y = r.getBoundingClientRect().top + scrollY - innerHeight / 2 + 60; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); });
    await p.waitForTimeout(1200);
    const r = await (await p.$$('.ix-row a'))[2].boundingBox();
    await p.mouse.move(r.x + 300, r.y + r.height / 2, { steps: 10 }); await p.mouse.move(r.x + 420, r.y + r.height / 2 + 4, { steps: 8 });
    await p.waitForTimeout(1600);
    const hv = await p.evaluate(() => ({ show: document.querySelector('.ix-pv').classList.contains('show'), dim: document.querySelector('.ix-list').classList.contains('has-active') }));
    ok(`${tag} index hover shows a following preview`, hv.show && hv.dim, JSON.stringify(hv));
    await shot(p, `${tag}-作品悬停预览`);
  }
  // Play: before/after slider drag.
  await to(p, '#play .cmp', -160);
  const h = await p.$('#play .cmp input');
  const bb = await h.boundingBox();
  if (fine) { await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width * 0.25, bb.y + bb.height / 2, { steps: 10 }); await p.mouse.up(); }
  else { await h.focus(); for (let i = 0; i < 12; i++) await p.keyboard.press('ArrowLeft'); }
  await p.waitForTimeout(400);
  const pos = await p.evaluate(() => document.querySelector('#play .cmp').style.getPropertyValue('--pos'));
  ok(`${tag} glass before/after slider moves`, parseFloat(pos) < 45, pos);
  await shot(p, `${tag}-前后对比`);
  // Contact: copy email.
  await to(p, '#contact');
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await p.click('[data-copy]'); await p.waitForTimeout(400);
  const live = await p.evaluate(() => document.getElementById('copy-live')?.textContent || '');
  ok(`${tag} copy email button announces`, /copied|已复制/i.test(live), live);
  ok(`${tag} home: no console errors`, p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  // Language toggle + persistence.
  await to(p, 0);
  await p.click('[data-lang="zh"]'); await p.waitForTimeout(500);
  const zh = await p.evaluate(() => ({ lang: document.documentElement.lang, store: localStorage.getItem('lang') }));
  ok(`${tag} language toggle → 中文`, zh.lang === 'zh-CN' && zh.store === 'zh', JSON.stringify(zh));
  await p.waitForTimeout(900);
  const ll = await p.evaluate(() => { const l = document.querySelector('.lang-lens').getBoundingClientRect(), b = document.querySelector('[data-lang="zh"]').getBoundingClientRect(); return Math.abs((l.left + l.right) / 2 - (b.left + b.right) / 2); });
  ok(`${tag} language lens settles on 中文`, ll < 3, `offset ${ll.toFixed(1)}px`);
  await shot(p, `${tag}-中文-首屏`);
  await go(p, '/notes/'); await shot(p, `${tag}-中文-札记`);
  ok(`${tag} notes page: six notes, nav marks Notes`, (await p.evaluate(() => document.querySelectorAll('.note').length === 6 && /Notes/.test(document.querySelector('[aria-current=page]')?.textContent || ''))));
  await go(p, '/');
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  ok(`${tag} language persists after reload`, (await p.evaluate(() => document.documentElement.lang)) === 'zh-CN');
  await p.click('[data-lang="en"]'); await p.waitForTimeout(300);

  // Project pages: one shot per section, no errors.
  for (const s of slugs) {
    p.errs = [];
    await go(p, `/projects/${s}/`);
    await walk(p);
    const ids = await p.evaluate(() => ['', ...[...document.querySelectorAll('main h2[id]')].map((h) => '#' + h.id)]);
    for (const [i, id] of ids.entries()) { await to(p, id ? `${id}` : 0, -160); await shot(p, `${tag}-${s}-${i + 1}-${id.slice(1) || 'hero'}`); }
    const role = await p.evaluate(() => document.querySelector('.p-meta dd')?.textContent.trim() || '');
    ok(`${tag} ${s}: role stated, no TODO, no console errors`, role.length > 8 && p.errs.length === 0 && !(await p.evaluate(() => /TODO/.test(document.body.innerText))), p.errs.slice(0, 3).join(' | '));
    // Signature scroll stories.
    if (s === 'aogiri-phone') {
      await to(p, '[data-steps]', 0); await frac(p, '[data-steps]', 0.02);
      await shot(p, `${tag}-手机-滚动故事-1`);
      await frac(p, '[data-steps]', 0.55);
      const on = await p.evaluate(() => [...document.querySelectorAll('[data-step]')].findIndex((x) => x.classList.contains('on')));
      ok(`${tag} phone story: screens change on scroll`, on > 0, `step ${on}`);
      await shot(p, `${tag}-手机-滚动故事-2`);
      await to(p, '.glass-cmp', -120);
      await p.click('[data-pick="1"]'); await p.waitForTimeout(700);
      ok(`${tag} phone glass picker swaps screens`, await p.evaluate(() => !document.querySelector('[data-pane="1"]').hidden));
      await shot(p, `${tag}-手机-玻璃对比`);
    }
    if (s === 'aogiri-desktop' && fine) {
      await to(p, '[data-handoff]', 0);
      for (const [i, f] of [0.3, 0.68, 0.85, 0.99].entries()) { await frac(p, '[data-handoff]', f); await shot(p, `${tag}-桌面-接力-${i + 1}`); }
      const done = await p.evaluate(() => +getComputedStyle(document.querySelector('.ho-done')).opacity);
      ok(`${tag} desktop hand-off reaches the approval`, done > 0.9, `done opacity ${done}`);
    }
    // Live demos (moved from home to their projects).
    if (s === 'gateway') {
      await to(p, '.fo-stage', -160);
      await p.click('[data-up="a"]'); await p.waitForTimeout(3500);
      await p.click('[data-send]'); await p.waitForTimeout(1600);
      await shot(p, `${tag}-演示-故障切换`);
      await p.click('[data-send]'); await p.waitForTimeout(3200);
      await p.click('[data-mid]'); await p.waitForTimeout(3000);
      const log = (await p.$$eval('.fo-log li', (l) => l.map((x) => x.textContent))).join(' | ');
      ok(`${tag} failover: break A → served via B, breaker opens, mid-stream error`, /via B/.test(log) && /breaker opened/.test(log) && /first byte/.test(log), log.slice(0, 160));
    }
    if (s === 'llm-provider-kit') {
      await to(p, '.sse', -120); await p.waitForTimeout(2500);
      await p.click('[data-proto="messages"]'); await p.waitForTimeout(4500);
      const sse = await p.evaluate(() => ({ text: document.querySelector('[data-text]').textContent, n: document.querySelector('[data-count]').textContent }));
      ok(`${tag} stream decoder replays to the end`, /first byte/.test(sse.text) && /(\d+) \/ \1/.test(sse.n), JSON.stringify(sse));
      await shot(p, `${tag}-演示-流解码`);
    }
    if (s === 'zaji') {
      await to(p, '.md-win', -160);
      await p.click('[data-src]'); await p.keyboard.press('ControlOrMeta+End');
      await p.keyboard.type('\n\n## Typed live\n\nThis is **bold** and `code`.', { delay: 15 });
      await p.waitForTimeout(500);
      const md = await p.evaluate(() => [...document.querySelectorAll('.md-out h2')].map((x) => x.textContent).join('|'));
      ok(`${tag} markdown demo renders as you type`, /Typed live/.test(md), md);
      await shot(p, `${tag}-演示-Markdown`);
      const r = await p.evaluate(async () => Promise.all([['/projects/md-reader/', 'zaji'], ['/projects/pane/', 'zaji'], ['/projects/qianxing/', 'armil'], ['/projects/lodestar/', 'armil']].map(async ([u, to]) => { const x = await fetch(u); return x.ok && new RegExp(`url=[^"]*projects/${to}/`).test(await x.text()); })));
      ok(`${tag} old project URLs forward (md-reader, pane → zaji; qianxing, lodestar → armil)`, r.every(Boolean), JSON.stringify(r));
    }
    if (s === 'brand') {
      await to(p, '.film', -80);
      await p.click('[data-film-play]'); await p.waitForTimeout(1500);
      await p.click('[data-seek="24"]'); await p.waitForTimeout(1500);
      const film = await p.evaluate(() => { const v = document.querySelector('.film video'); return { t: +v.currentTime.toFixed(1), paused: v.paused }; });
      ok(`${tag} film plays and chapters seek`, film.t >= 24 && !film.paused, JSON.stringify(film));
      await shot(p, `${tag}-短片`);
      await p.evaluate(() => document.querySelector('.film video').pause());
      await to(p, 0);
      await p.click('[data-replay]'); await p.waitForTimeout(400);
      await shot(p, `${tag}-品牌-重播`);
      ok(`${tag} brand: replay works without errors`, p.errs.length === 0);
    }
  }
  await ctx.close();
}

// Reduced motion: no GSAP/Lenis/shader/cursor, content visible, scenes static.
{
  const { ctx, p } = await open(1440, { reducedMotion: 'reduce' });
  await go(p, '/');
  const r = await p.evaluate(() => ({
    motion: document.documentElement.classList.contains('js-motion'), lenis: !!window.__lenis,
    field: !!document.querySelector('canvas[data-field].on'),
    hidden: [...document.querySelectorAll('[data-rv], .rise')].filter((e) => +getComputedStyle(e).opacity < 1).length,
    lensOn: !!document.querySelector('.lang-lens.lens-on'),
  }));
  ok('reduced motion: no motion libs, no shader, content visible', !r.motion && !r.lenis && !r.field && r.hidden === 0, JSON.stringify(r));
  await shot(p, '减少动态-首屏');
  await to(p, '#work'); await shot(p, '减少动态-作品');
  await go(p, '/projects/aogiri-desktop/');
  await to(p, '[data-handoff]', -120);
  ok('reduced motion: hand-off renders static', await p.evaluate(() => document.querySelector('[data-handoff]').classList.contains('static')));
  await shot(p, '减少动态-接力');
  ok('reduced motion: no console errors', p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}检查结果.json`, JSON.stringify(res, null, 1));
const f = res.filter((x) => !x.pass).length;
console.log(f ? `${f} FAILED` : 'ALL PASS');
process.exit(f ? 1 : 0);
