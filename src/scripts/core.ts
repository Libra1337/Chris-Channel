// Core script for every page. Small and synchronous: language, video scheduler, before/after sliders, reveals,
// copy-to-clipboard, nav state. Everything heavier loads later with dynamic import() (separate chunks):
//   fx/pointer.ts  magnetic pull, specular glass   (fine pointer + motion allowed)
//   fx/field.ts    hero light field (WebGL), lazy, paused offscreen
//   fx/scroll.ts   GSAP + ScrollTrigger + Lenis scenes             (motion allowed)
//   modules        [data-module] elements import their own chunk when they come near the viewport
const d = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
(window as any).__core = true;

/* ---------- Language ---------- */
function applyLang(l: 'en' | 'zh') {
  d.lang = l === 'zh' ? 'zh-CN' : 'en';
  document.title = d.dataset[l === 'zh' ? 'titleZh' : 'titleEn'] || document.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', d.dataset[l === 'zh' ? 'descZh' : 'descEn'] || '');
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  const key = l === 'zh' ? 'Zh' : 'En';
  document.querySelectorAll<HTMLElement>('[data-alt-en]').forEach((e) => e.setAttribute('alt', e.dataset[`alt${key}`] || ''));
  document.querySelectorAll<HTMLElement>('[data-aria-en]').forEach((e) => e.setAttribute('aria-label', e.dataset[`aria${key}`] || ''));
  window.dispatchEvent(new Event('langchange'));
}
const cur = () => (d.lang === 'zh-CN' ? 'zh' : 'en');
applyLang(cur());
document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    const l = b.dataset.lang === 'zh' ? 'zh' : 'en';
    try { localStorage.setItem('lang', l); } catch {}
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); }
    applyLang(l);
  }),
);

/* ---------- Idle helper ---------- */
export const idle = (fn: () => void, timeout = 1500) =>
  ('requestIdleCallback' in window) ? (window as any).requestIdleCallback(fn, { timeout }) : setTimeout(fn, 300);

/* ---------- Videos ---------- */
// Lazy: nothing downloads until a clip is near. Plays only while at least 35% visible, pauses off screen.
// At most MAX clips play together (the most visible ones); the rest wait on their poster.
type V = { el: HTMLVideoElement; box: HTMLElement; user: 'play' | 'pause' | null; ratio: number };
const MAX = 2;
const vids: V[] = [...document.querySelectorAll<HTMLElement>('[data-vid]')].map((box) => ({ el: box.querySelector('video')!, box, user: null, ratio: 0 }));
function play(v: V) { v.el.play().catch(() => v.box.classList.remove('playing')); }
function pause(v: V) { if (!v.el.paused) v.el.pause(); }
let ready = false;
const startVideos = () => idle(() => { ready = true; schedule(); }, 2500);
if (document.readyState === 'complete') startVideos(); else addEventListener('load', startVideos, { once: true });
function schedule() {
  if (!ready) return;
  const want = vids.filter((v) => v.ratio >= 0.35 && v.user !== 'pause' && (v.user === 'play' || !reduce.matches))
    .sort((a, b) => (b.user === 'play' ? 1 : 0) - (a.user === 'play' ? 1 : 0) || b.ratio - a.ratio).slice(0, MAX);
  vids.forEach((v) => (want.includes(v) ? play(v) : pause(v)));
}
const nearV = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const v = vids.find((x) => x.el === e.target)!;
  if (v.el.dataset.poster && !v.el.poster) v.el.poster = v.el.dataset.poster;   // posters load with the clip, not with the first paint
  if (v.el.preload === 'none') v.el.preload = 'metadata';
  nearV.unobserve(e.target);
}), { rootMargin: '100% 0px' });
const vio = new IntersectionObserver((es) => { es.forEach((e) => { vids.find((x) => x.el === e.target)!.ratio = e.intersectionRatio; }); schedule(); },
  { threshold: [0, 0.35, 0.6, 0.9] });
vids.forEach((v) => {
  nearV.observe(v.el); vio.observe(v.el);
  v.box.querySelector('button')!.addEventListener('click', () => {
    v.user = v.el.paused ? 'play' : 'pause';
    ready = true;
    if (v.user === 'play') play(v); else pause(v);
    schedule();
  });
  v.el.addEventListener('pause', () => v.box.classList.remove('playing'));
  v.el.addEventListener('playing', () => v.box.classList.add('playing'));
});
document.addEventListener('visibilitychange', () => (document.hidden ? vids.forEach(pause) : schedule()));
(window as any).__vids = { schedule };

/* ---------- Before / after slider ---------- */
document.querySelectorAll<HTMLElement>('[data-compare]').forEach((c) => {
  const r = c.querySelector<HTMLInputElement>('input[type=range]')!;
  const wrap = c.closest<HTMLElement>('.cmp-wrap');
  const set = () => c.style.setProperty('--pos', `${r.value}%`);
  r.addEventListener('input', () => { wrap?.classList.remove('hint'); set(); });
  r.addEventListener('pointerdown', () => wrap?.classList.add('drag'));
  addEventListener('pointerup', () => wrap?.classList.remove('drag'));
  set();
  // One gentle sweep the first time it scrolls into view, to show it can be dragged.
  if (!reduce.matches && wrap) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { wrap.classList.add('hint'); io.disconnect(); setTimeout(() => wrap.classList.remove('hint'), 2200); } }, { threshold: 0.6 });
    io.observe(wrap);
  }
});

/* ---------- Copy to clipboard ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const text = b.dataset.copy || '';
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select(); try { ok = document.execCommand('copy'); } catch {} t.remove();
  }
  b.classList.toggle('copied', ok);
  const live = document.getElementById(b.getAttribute('aria-describedby') || '');
  if (live) live.textContent = ok ? (cur() === 'zh' ? '已复制' : 'Copied') : '';
  setTimeout(() => { b.classList.remove('copied'); if (live) live.textContent = ''; }, 2000);
}));

/* ---------- Reveals ---------- */
const rio = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('rv-in'); rio.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-rv], .rise, .flow, [data-rv-group]').forEach((el) => rio.observe(el));

/* ---------- Nav: current section ---------- */
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')];
if (navLinks.length) {
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === e.target.id)));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = document.getElementById(a.dataset.nav!); if (s) sio.observe(s); });
}

/* ---------- Scroll progress (fallback where scroll-driven animations are missing) ---------- */
if (!CSS.supports('animation-timeline: scroll()')) {
  const bar = document.querySelector<HTMLElement>('.progress i');
  let raf = 0;
  const upd = () => { raf = 0; const h = d.scrollHeight - innerHeight; bar?.style.setProperty('--p', String(h > 0 ? scrollY / h : 0)); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  upd();
}

/* ---------- Feature modules, loaded when near the viewport ---------- */
// Each loader is a separate chunk. Elements opt in with data-module="name".
const loaders: Record<string, () => Promise<{ default: (el: HTMLElement, o: { reduce: boolean; fine: boolean }) => void }>> = {
  index: () => import('./mod/index'),
  md: () => import('./mod/md'),
  stream: () => import('./mod/stream'),
  failover: () => import('./mod/failover'),
  film: () => import('./mod/film'),
  lumen: () => import('./mod/lumen'),
  mark: () => import('./mod/mark'),
  tilt: () => import('./mod/tilt'),
  notes: () => import('./mod/notes'),
};
const mio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target as HTMLElement; mio.unobserve(el);
  const name = el.dataset.module!;
  loaders[name]?.().then((m) => m.default(el, { reduce: reduce.matches, fine: fine.matches })).catch((err) => console.warn('module', name, err));
}), { rootMargin: '60% 0px' });
document.querySelectorAll<HTMLElement>('[data-module]').forEach((el) => mio.observe(el));

/* ---------- Liquid glass (refraction on Chromium desktop, frosted elsewhere; not motion, so always on) ---------- */
import('../components/glass/index').then((m) => m.default({ reduce: reduce.matches, fine: fine.matches }));

/* ---------- Motion ---------- */
if (reduce.matches) {
  d.classList.remove('js-motion');
  document.querySelectorAll<HTMLElement>('[data-steps], [data-handoff]').forEach((sc) => sc.classList.add('static'));
} else {
  // Pointer effects first (cheap, they make the page feel alive immediately), then scroll scenes, then the light field.
  if (fine.matches) import('./fx/pointer').then((m) => m.default());
  idle(() => import('./fx/scroll').then((m) => m.default()), 1200);
  const field = document.querySelector<HTMLCanvasElement>('canvas[data-field]');
  // Touch devices: the light field starts on the first interaction (creating a WebGL context costs hundreds of ms on
  // low-end phones); until then the CSS beam behind the canvas is the hero. Fine pointers start it at idle.
  const startField = () => import('./fx/field').then((m) => m.default(field!));
  if (field) {
    if (fine.matches) idle(startField, 1800);
    else {
      const go = () => { ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach((t) => removeEventListener(t, go)); idle(startField, 600); };
      ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach((t) => addEventListener(t, go, { once: true, passive: true }));
    }
  }
}
reduce.addEventListener('change', () => location.reload());
