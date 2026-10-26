// Scroll scenes (motion allowed only). GSAP, ScrollTrigger and Lenis load here, in their own chunk.
//   - Lenis smooth wheel scrolling on fine pointers (touch keeps native scrolling)
//   - [data-hero]          hero content drifts up and dims as you leave it
//   - [data-steps]         pinned device; screens change per step; optional device rotate-in
//   - [data-scrub-video]   scroll position = playhead (all-intra encode)
//   - [data-handoff]       desktop → phone approval flow, scrubbed
//   - [data-zoom]          large media scales in
// Design px → CSS px: the root font-size carries the page scale (tokens.css, 1rem = 20px × z).
const rz = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 20;
export default async function scroll() {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]);
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lenis = fine ? new Lenis({ lerp: 0.12, smoothWheel: true, anchors: { offset: -80 * rz() } }) : null;
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  (window as any).__lenis = lenis;
  const promote = (el: HTMLElement) => (st: { isActive: boolean }) => { el.style.willChange = st.isActive ? 'transform' : ''; };
  const wide = matchMedia('(min-width: 861px)').matches;

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const inner = hero.querySelector<HTMLElement>('[data-hero-inner]');
    if (inner) gsap.to(inner, { yPercent: -14, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, onToggle: promote(inner) } });
  }

  // Large media scale in; the work panels also tighten their corners (28 → 20 design px) as they arrive.
  document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
    const panel = el.classList.contains('ft-media');
    gsap.fromTo(el, { scale: 0.92, opacity: 0.6, ...(panel ? { borderRadius: "1.4rem" } : {}) }, { scale: 1, opacity: 1, ...(panel ? { borderRadius: "1rem" } : {}), ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: 0.4, onToggle: promote(el) } });
  });

  // Pinned step scenes. The stage is CSS-sticky; ScrollTrigger only decides which step is current.
  document.querySelectorAll<HTMLElement>('[data-steps]').forEach((sc) => {
    const steps = [...sc.querySelectorAll<HTMLElement>('[data-step]')];
    const shots = [...sc.querySelectorAll<HTMLElement>('[data-shot]')];
    const dots = [...sc.querySelectorAll<HTMLElement>('[data-dot]')];
    let cur = -1;
    const show = (i: number) => {
      if (i === cur) return;
      const dir = i > cur ? 1 : -1; cur = i;
      shots.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('past', k < i); s.style.setProperty('--dir', String(dir)); });
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((s, k) => s.classList.toggle('on', k === i));
    };
    steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onToggle: (st) => st.isActive && show(i) }));
    show(0);
    const dev = sc.querySelector<HTMLElement>('[data-rotate]');
    if (dev && wide) {
      gsap.fromTo(dev, { rotateY: -28, rotateX: 10, rotateZ: -6, scale: 0.86, y: 60 }, { rotateY: 0, rotateX: 0, rotateZ: 0, scale: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: sc, start: 'top 90%', end: 'top 20%', scrub: 0.6, onToggle: promote(dev) } });
      // A slow sway while pinned keeps the device feeling physical.
      gsap.fromTo(dev, { rotateY: 0 }, { rotateY: 8, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: sc, start: 'top 20%', end: 'bottom bottom', scrub: 1 } });
    }
  });

  // Scroll-scrubbed video.
  document.querySelectorAll<HTMLElement>('[data-scrub-video]').forEach((sc) => {
    const v = sc.querySelector('video')!;
    let loaded = false, target = 0, busy = false;
    const seek = () => {
      if (!v.duration || busy) return;
      const t = target * (v.duration - 0.05);
      if (Math.abs(v.currentTime - t) < 1 / 30) return;
      busy = true; v.currentTime = t;
    };
    v.addEventListener('seeked', () => { busy = false; seek(); });
    ScrollTrigger.create({ trigger: sc, start: 'top 150%', end: 'bottom -50%', onToggle: (st) => {
      if (st.isActive && !loaded) { loaded = true; v.preload = 'auto'; v.load(); } } });
    ScrollTrigger.create({ trigger: sc, start: 'top top', end: 'bottom bottom', onUpdate: (st) => { target = st.progress; seek(); } });
  });

  // Desktop → phone hand-off: one scrubbed timeline over a sticky stage.
  document.querySelectorAll<HTMLElement>('[data-handoff]').forEach((sc) => {
    if (!wide) { sc.classList.add('static'); return; }
    const q = (s: string) => sc.querySelector<HTMLElement>(s)!;
    const labels = [...sc.querySelectorAll<HTMLElement>('[data-hstep]')];
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' },
      scrollTrigger: { trigger: sc, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (st) => { const i = Math.min(labels.length - 1, Math.floor(st.progress * labels.length * 0.999)); labels.forEach((l, k) => l.classList.toggle('on', k === i)); sc.style.setProperty('--hp', st.progress.toFixed(3)); } } });
    // The typed task is on screen from the first frame (no empty window); it is "sent", then the plan builds.
    tl.to(q('.ho-type'), { boxShadow: 'inset 0 0 0 1px rgba(240,164,101,.55)', duration: 0.5 })
      .to(q('.ho-type'), { boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)', duration: 0.4 }, '>')
      .from(q('.ho-plan'), { opacity: 0.25, y: 10, duration: 0.6 }, '<')
      .from(sc.querySelectorAll('.ho-plan li'), { opacity: 0.3, x: -8, stagger: 0.25, duration: 0.5 }, '<0.2')
      .from(q('.ho-gate'), { opacity: 0, scale: 0.9, duration: 0.7 }, '>')
      .to(q('.ho-gate'), { boxShadow: '0 0 0 1px rgba(240,164,101,.9), 0 0 40px rgba(240,164,101,.45)', duration: 0.4 }, '>')
      .fromTo(q('.ho-card'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, '>')
      .to(q('.ho-card'), { x: () => q('.ho-phone').getBoundingClientRect().left - q('.ho-card').getBoundingClientRect().left + 16 * rz(),
        y: () => q('.ho-phone').getBoundingClientRect().top - q('.ho-card').getBoundingClientRect().top + 150 * rz(), scale: 0.62, rotate: 4, duration: 1.4, ease: 'power3.inOut' }, '>')
      .from(q('.ho-phone'), { x: () => 120 * rz(), opacity: 0, rotate: 8, duration: 1 }, '<')
      .to(q('.ho-card'), { opacity: 0, duration: 0.15 }, '>')
      .from(q('.ho-pcard'), { opacity: 0, y: 12, duration: 0.3 }, '<')
      .to(q('.ho-allow'), { scale: 0.94, duration: 0.15, yoyo: true, repeat: 1 }, '>0.3')
      .to(q('.ho-pcard'), { opacity: 0, y: -10, duration: 0.3 }, '>')
      .from(q('.ho-done'), { opacity: 0, y: 12, duration: 0.4 }, '<')
      .from(q('.ho-resume'), { opacity: 0, duration: 0.5 }, '<');
  });

  window.addEventListener('langchange', () => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
