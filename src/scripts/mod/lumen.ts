// Lumen follows the pointer a little: the body leans (max 6°), the eyes look (max 4 units), random blinks
// every 2.5–6 s, a double blink now and then, and a squish on tap. Paused while offscreen.
export default function lumen(el: HTMLElement, o: { reduce: boolean }) {
  if (o.reduce) return;
  const lean = el.querySelector<SVGGElement>('.lu-lean')!, look = el.querySelector<SVGGElement>('.lu-look')!;
  let on = false, timer = 0;
  const blink = () => {
    el.classList.add('blink');
    setTimeout(() => el.classList.remove('blink'), 110);
    if (Math.random() < 0.22) setTimeout(() => { el.classList.add('blink'); setTimeout(() => el.classList.remove('blink'), 100); }, 240);
  };
  const loop = () => { if (!on) return; blink(); timer = window.setTimeout(loop, 2500 + Math.random() * 3500); };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; clearTimeout(timer); if (on) timer = window.setTimeout(loop, 1200); }).observe(el);
  let raf = 0, px = 0, py = 0;
  addEventListener('pointermove', (e) => {
    if (!on) return; px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1, f = Math.min(1, dist / 500);
      lean.style.transform = `rotate(${(dx / dist) * 6 * f}deg)`;
      look.style.transform = `translate(${(dx / dist) * 4 * f}px, ${(dy / dist) * 3 * f}px)`;
    });
  }, { passive: true });
  el.addEventListener('click', () => { el.classList.add('squish'); blink(); setTimeout(() => el.classList.remove('squish'), 180); });
}
