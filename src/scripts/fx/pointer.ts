// Fine pointer + motion allowed only. One rAF loop drives every magnetic element and sleeps when nothing moves.
// Specular highlights write two CSS variables on the hovered glass element. The system cursor is never replaced.
export default function pointer() {
  let raf = 0;
  type M = { el: HTMLElement; x: number; y: number; tx: number; ty: number; k: number };
  const mags: M[] = [...document.querySelectorAll<HTMLElement>('[data-magnetic]')].map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0, k: parseFloat(el.dataset.magnetic || '') || 0.22 }));
  const active = new Set<M>();

  const tick = () => {
    raf = 0;
    let moving = false;
    active.forEach((m) => {
      m.x += (m.tx - m.x) * 0.18; m.y += (m.ty - m.y) * 0.18;
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if (Math.abs(m.tx - m.x) > 0.05 || Math.abs(m.ty - m.y) > 0.05) moving = true;
      else if (m.tx === 0 && m.ty === 0) { m.el.style.translate = ''; active.delete(m); }
    });
    if (moving) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // Magnetic: pull toward the pointer within 1.25x the element's radius.
  mags.forEach((m) => {
    const zone = m.el;
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = zone.getBoundingClientRect();
      const cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
      m.tx = (e.clientX - cx) * m.k; m.ty = (e.clientY - cy) * m.k;
      active.add(m); kick();
    });
    zone.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; active.add(m); kick(); });
  });

  // Specular highlight on glass: the light follows the pointer across the surface. .lg-pt marks the element the
  // pointer is over right now, with a known position (bars light only then; glass.css).
  let cur: HTMLElement | null = null;
  const leave = () => { cur?.classList.remove('lg-pt'); cur = null; };
  document.addEventListener('pointermove', (e) => {
    const g = e.pointerType === 'mouse' ? (e.target as Element)?.closest?.<HTMLElement>('[data-spec]') : null;
    if (g !== cur) { leave(); if (g) { cur = g; g.classList.add('lg-pt'); } }
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--mx', `${e.clientX - r.left}px`);
    g.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave);
  addEventListener('blur', leave);
}
