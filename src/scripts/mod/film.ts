// Film player: custom glass controls over the native video, chapter list that seeks and shows progress per
// chapter, keyboard (Space/K play, ←/→ 5 s, M mute, F full screen), and the frame dims the page around it while playing.
export default function film(root: HTMLElement) {
  root.querySelectorAll<HTMLVideoElement>('video[data-poster]').forEach((v) => { v.poster = v.dataset.poster!; });   // deferred from the HTML
  const v = root.querySelector('video')!;
  const big = root.querySelector<HTMLButtonElement>('[data-film-play]')!;
  const bar = root.querySelector<HTMLElement>('.film-bar')!;
  const track = root.querySelector<HTMLElement>('.film-track')!;
  const fill = root.querySelector<HTMLElement>('.ft-fill')!, buf = root.querySelector<HTMLElement>('.ft-buf')!;
  const times = root.querySelectorAll<HTMLElement>('.film-time');
  const chBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-seek]')];
  const starts = chBtns.map((b) => +b.dataset.seek!);
  const mute = root.querySelector<HTMLButtonElement>('[data-film-mute]')!;
  v.controls = false; v.tabIndex = -1; bar.hidden = false; root.classList.add('custom');
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const dur = () => v.duration || 60;
  const start = () => { if (v.preload === 'none') v.preload = 'auto'; return v.play().catch(() => {}); };
  const toggle = () => (v.paused ? start() : v.pause());
  big.addEventListener('click', () => { start(); });
  root.querySelector('[data-film-toggle]')!.addEventListener('click', toggle);
  v.addEventListener('click', toggle);
  v.addEventListener('play', () => { root.classList.add('playing', 'started'); });
  v.addEventListener('pause', () => root.classList.remove('playing'));
  v.addEventListener('ended', () => root.classList.remove('playing'));
  let raf = 0;
  const paint = () => {
    raf = 0;
    const p = v.currentTime / dur();
    fill.style.transform = `scaleX(${p})`; track.style.setProperty("--p", String(p));
    times[0].textContent = fmt(v.currentTime);
    track.setAttribute('aria-valuenow', String(Math.round(v.currentTime)));
    track.setAttribute('aria-valuetext', fmt(v.currentTime));
    const ci = starts.findLastIndex((t) => v.currentTime >= t);
    chBtns.forEach((b, i) => {
      b.classList.toggle('on', i === ci);
      const end = starts[i + 1] ?? dur();
      b.style.setProperty('--cp', String(Math.max(0, Math.min(1, (v.currentTime - starts[i]) / (end - starts[i])))));
    });
    if (!v.paused) raf = requestAnimationFrame(paint);
  };
  v.addEventListener('timeupdate', () => { if (!raf) raf = requestAnimationFrame(paint); });
  v.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(paint); });
  v.addEventListener('progress', () => { try { buf.style.transform = `scaleX(${v.buffered.end(v.buffered.length - 1) / dur()})`; } catch {} });
  const seek = (t: number) => { v.currentTime = Math.max(0, Math.min(dur() - 0.1, t)); paint(); };
  chBtns.forEach((b) => b.addEventListener('click', () => { if (v.preload === 'none') v.preload = 'auto'; seek(+b.dataset.seek!); start(); }));
  // Scrub the track with the pointer.
  const fromX = (x: number) => { const r = track.getBoundingClientRect(); return ((x - r.left) / r.width) * dur(); };
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId); seek(fromX(e.clientX)); track.classList.add('drag');
    const mv = (ev: PointerEvent) => seek(fromX(ev.clientX));
    track.addEventListener('pointermove', mv);
    track.addEventListener('pointerup', () => { track.removeEventListener('pointermove', mv); track.classList.remove('drag'); }, { once: true });
  });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { seek(v.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { seek(v.currentTime - 5); e.preventDefault(); }
    if (e.key === 'Home') { seek(0); e.preventDefault(); }
  });
  mute.addEventListener('click', () => { v.muted = !v.muted; mute.setAttribute('aria-pressed', String(v.muted)); root.classList.toggle('muted', v.muted); });
  root.querySelector('[data-film-fs]')!.addEventListener('click', () => {
    const stage = root.querySelector<HTMLElement>('.film-stage')! as any;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen(); else (v as any).webkitEnterFullscreen?.();
  });
  root.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('.film-track, [data-seek]')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { if ((e.target as HTMLElement).tagName === 'BUTTON' && k === ' ') return; toggle(); e.preventDefault(); }
    if (k === 'm') mute.click();
    if (k === 'f') (root.querySelector('[data-film-fs]') as HTMLButtonElement).click();
  });
  // Leaving the screen pauses it.
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.2 }).observe(root);
}
