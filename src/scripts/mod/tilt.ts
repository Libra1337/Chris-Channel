// Glass before/after on the phone page: a screen picker swaps the comparison, and on fine pointers the phone
// tilts a few degrees toward the pointer (perspective), so the glass reads as a physical object.
export default function tilt(root: HTMLElement, o: { reduce: boolean; fine: boolean }) {
  const panes = [...root.querySelectorAll<HTMLElement>('[data-pane]')];
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  picks.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.pick!;
    picks.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    panes.forEach((p, k) => { p.hidden = k !== i; });
    if (!o.reduce) panes[i].animate([{ opacity: 0, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
  }));
  if (o.reduce || !o.fine) return;
  const host = root.querySelector<HTMLElement>('.gc-panes')!;
  host.style.perspective = '1200px';
  let raf = 0, rx = 0, ry = 0;
  root.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    ry = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10;
    rx = -((e.clientY - (r.top + r.height / 2)) / r.height) * 8;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; panes.forEach((p) => { p.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`; }); });
  });
  root.addEventListener('pointerleave', () => panes.forEach((p) => { p.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)'; p.style.transform = ''; setTimeout(() => (p.style.transition = ''), 800); }));
}
