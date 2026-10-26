// Project index: floating preview that follows the cursor (eased, tilts with velocity), plays the hovered clip,
// keyboard focus places it beside the row, and the category filter re-flows rows with a FLIP transform.
export default function index(root: HTMLElement, o: { reduce: boolean; fine: boolean }) {
  const list = root.querySelector<HTMLElement>('.ix-list')!;
  const rows = [...root.querySelectorAll<HTMLElement>('.ix-row')];
  const pv = root.querySelector<HTMLElement>('.ix-pv')!;
  const items = [...root.querySelectorAll<HTMLElement>('[data-pv]')];
  const vids = items.map((it) => it.querySelector('video'));
  // Posters are not in the HTML (they would compete with the first paint); attach them once this module runs.
  vids.forEach((v) => { if (v?.dataset.poster) v.poster = v.dataset.poster; });
  let active = -1, x = 0, y = 0, tx = 0, ty = 0, vx = 0, raf = 0, visible = false;

  const setActive = (i: number) => {
    if (i === active) return;
    if (active >= 0) { items[active].classList.remove('on'); vids[active]?.pause(); }
    active = i;
    list.classList.toggle('has-active', i >= 0);
    rows.forEach((r, k) => r.classList.toggle('on', k === i));
    pv.classList.toggle('show', i >= 0);
    if (i < 0) return;
    items[i].classList.add('on');
    const v = vids[i];
    if (v && !o.reduce) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
  };

  const tick = () => {
    raf = 0;
    const k = o.reduce ? 1 : 0.16;
    const nx = x + (tx - x) * k, ny = y + (ty - y) * k;
    vx = vx * 0.8 + (nx - x) * 0.2;
    x = nx; y = ny;
    const rot = Math.max(-8, Math.min(8, vx * 0.5));
    pv.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot.toFixed(2)}deg)`;
    if (visible && (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(vx) > 0.05)) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  if (o.fine) {
    list.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const row = (e.target as Element).closest<HTMLElement>('.ix-row');
      tx = e.clientX; ty = e.clientY;
      if (!visible) { x = tx; y = ty; visible = true; }
      if (row && !row.hidden) setActive(+row.dataset.i!);
      kick();
    });
    list.addEventListener('pointerleave', () => { setActive(-1); visible = false; });
  }
  // Keyboard: the preview sits to the right of the focused row.
  rows.forEach((r) => {
    const a = r.querySelector('a')!;
    a.addEventListener('focus', () => {
      if (!a.matches(':focus-visible')) return;
      const rc = a.getBoundingClientRect();
      const z = parseFloat(getComputedStyle(document.documentElement).fontSize) / 20;
      tx = x = Math.min(innerWidth - 220 * z, rc.right - 260 * z); ty = y = rc.top + rc.height / 2;
      visible = true; setActive(+r.dataset.i!); kick();
    });
    a.addEventListener('blur', () => { if (!list.matches(':hover')) { setActive(-1); visible = false; } });
  });
  // Pause everything when the index leaves the screen.
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) { setActive(-1); visible = false; } }).observe(root);
  addEventListener('scroll', () => { if (active >= 0 && o.fine) { const el = document.elementFromPoint(tx, ty)?.closest<HTMLElement>('.ix-row'); setActive(el && root.contains(el) ? +el.dataset.i! : -1); } }, { passive: true });

  // Filter with FLIP.
  const btns = [...root.querySelectorAll<HTMLButtonElement>('[data-f]')];
  btns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.f!;
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const first = new Map(rows.map((r) => [r, r.hidden ? null : r.getBoundingClientRect().top]));
    rows.forEach((r) => { r.hidden = !(f === 'all' || r.dataset.cat === f); });
    if (!o.reduce) rows.forEach((r) => {
      if (r.hidden) return;
      const top = first.get(r);
      r.animate(top == null
        ? [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }]
        : [{ transform: `translateY(${top - r.getBoundingClientRect().top}px)` }, { transform: 'none' }],
        { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
    (window as any).__lenis?.resize?.();
    window.dispatchEvent(new Event('resize'));
  }));
}
