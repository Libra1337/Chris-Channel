// Notes index: highlight the note being read, fill the progress bar, smooth-jump on click (Lenis when present).
export default function notes(root: HTMLElement) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-note]')];
  const arts = [...root.querySelectorAll<HTMLElement>('.note')];
  const bar = root.querySelector<HTMLElement>('.ni-bar i');
  const set = (i: number) => {
    links.forEach((a, k) => { a.classList.toggle('on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    bar?.style.setProperty('--p', String((i + 1) / arts.length));
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(arts.indexOf(e.target as HTMLElement)); }), { rootMargin: '-40% 0px -55% 0px' });
  arts.forEach((a) => io.observe(a));
  links.forEach((a, i) => a.addEventListener('click', (e) => {
    const t = arts[i]; const lenis = (window as any).__lenis;
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo(t, { offset: -110 * parseFloat(getComputedStyle(document.documentElement).fontSize) / 20 });
    history.replaceState(null, '', `#${t.id}`);
    t.focus({ preventScroll: true });
  }));
  set(0);
}
