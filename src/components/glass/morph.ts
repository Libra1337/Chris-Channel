// Morphing liquid lenses and the adaptive nav (design.md §materials).
//   lens(): an indicator that slides between targets on two springs, one per edge. The leading edge is stiffer, so
//           the lens stretches while it travels and settles back into a capsule; it thins slightly with speed, and
//           its refraction strengthens while moving. It sits above the labels, so the label under it is magnified.
//   navTheme(): the nav glass turns light over .paper sections and dark elsewhere, like system glass adapting to
//           what is behind it, so its text keeps ≥ 4.5:1 contrast on either ground.
import { get } from './liquid';

type Opts = { reduce: boolean };
export function lens(node: HTMLElement, host: HTMLElement, pick: () => HTMLElement | null, o: Opts) {
  let L = 0, R = 0, vL = 0, vR = 0, tL = 0, tR = 0, raf = 0, last = 0, shown = false;
  const H = () => node.offsetHeight;
  node.classList.add('lens-js');
  const paint = (sy = 1) => {
    node.style.width = `${Math.max(8, R - L).toFixed(2)}px`;
    node.style.transform = `translate3d(${L.toFixed(2)}px,0,0) scaleY(${sy.toFixed(3)})`;
  };
  const frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - (last || now)) / 1000 || 1 / 60); last = now;
    const dir = Math.sign((tL + tR) - (L + R));
    // Leading edge: stiff and quick. Trailing edge: softer, so the capsule stretches and then catches up.
    const lead = { k: 620, c: 34 }, trail = { k: 300, c: 25 };
    const sL = dir < 0 ? lead : trail, sR = dir > 0 ? lead : trail;
    vL += (sL.k * (tL - L) - sL.c * vL) * dt; L += vL * dt;
    vR += (sR.k * (tR - R) - sR.c * vR) * dt; R += vR * dt;
    const speed = Math.abs(vL + vR) / 2;
    paint(1 - Math.min(0.14, speed / 9000));
    const g = get(node);
    if (g) { g.stretch(R - L, H()); g.setStrength(1 + Math.min(0.7, speed / 1600)); }
    if (Math.abs(tL - L) + Math.abs(tR - R) + Math.abs(vL) + Math.abs(vR) > 0.4) raf = requestAnimationFrame(frame);
    else { raf = 0; last = 0; L = tL; R = tR; vL = vR = 0; paint(); if (g) { g.setStrength(1); g.refresh(); } }
  };
  const update = (jump = false) => {
    const t = pick();
    node.classList.toggle('lens-on', !!t);
    if (!t) { shown = false; return; }
    const hr = host.getBoundingClientRect(), r = t.getBoundingClientRect();
    tL = r.left - hr.left; tR = r.right - hr.left;
    if (jump || !shown || o.reduce) { L = tL; R = tR; vL = vR = 0; paint(); get(node)?.refresh(); shown = true; return; }
    if (!raf) raf = requestAnimationFrame(frame);
  };
  update(true);
  addEventListener('resize', () => update(true));
  document.fonts?.ready.then(() => update(true));
  return update;
}

export function navLens(nav: HTMLElement, o: Opts & { fine: boolean }) {
  const node = nav.querySelector<HTMLElement>('.nav-lens'), list = nav.querySelector<HTMLElement>('.nav-links'), bar = nav.querySelector<HTMLElement>('.nav-bar');
  if (!node || !list || !bar) return;
  const links = [...list.querySelectorAll<HTMLAnchorElement>('a')];
  let over: HTMLElement | null = null;
  const pick = () => over || links.find((a) => a.getAttribute('aria-current') === 'true') || null;
  const update = lens(node, bar, pick, o);
  links.forEach((a) => {
    if (o.fine) a.addEventListener('pointerenter', () => { over = a; update(); });
    a.addEventListener('focus', () => { over = a; update(); });
    a.addEventListener('blur', () => { over = null; update(); });
  });
  if (o.fine) list.addEventListener('pointerleave', () => { over = null; update(); });
  new MutationObserver(() => update()).observe(list, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
  addEventListener('langchange', () => requestAnimationFrame(() => update()));
}

export function langLens(nav: HTMLElement, o: Opts) {
  const node = nav.querySelector<HTMLElement>('.lang-lens'), host = nav.querySelector<HTMLElement>('.lang');
  if (!node || !host) return;
  const update = lens(node, host, () => host.querySelector<HTMLElement>('button[aria-pressed="true"]'), o);
  addEventListener('langchange', () => update());
}

export function navTheme(nav: HTMLElement) {
  // Top-level themed blocks only (a dark demo window inside a paper section must not flip the bar).
  const els = [...document.querySelectorAll<HTMLElement>('main > .paper, main > .dark, main > * > .paper, main > * > .dark, .foot')]
    .filter((e, _, a) => !a.some((o) => o !== e && o.contains(e)));
  if (!els.length) return;
  let spans: { top: number; bottom: number; light: boolean }[] = [];
  let line = 41, raf = 0;
  const measure = () => {
    const b = nav.querySelector<HTMLElement>('.nav-bar')!.getBoundingClientRect();
    line = b.top + b.height / 2;
    spans = els.map((e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY, light: e.classList.contains('paper') }; });
    pick();
  };
  const pick = () => {
    raf = 0;
    const y = scrollY + line;
    const s = spans.find((x) => y >= x.top && y < x.bottom);
    nav.classList.toggle('light', !!s?.light);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(pick); }, { passive: true });
  let t = 0;
  const later = () => { clearTimeout(t); t = window.setTimeout(measure, 120); };
  new ResizeObserver(later).observe(document.body);
  addEventListener('langchange', later);
  measure();
}
