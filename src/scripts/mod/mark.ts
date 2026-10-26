// Replay the mark animation on click, Enter or Space. Restarting CSS animations: drop the names, force a
// style flush, restore them.
export default function mark(el: HTMLElement) {
  const svg = el as unknown as SVGSVGElement;
  const replay = () => { svg.classList.add('replaying'); void svg.getBoundingClientRect(); svg.classList.remove('replaying'); };
  svg.addEventListener('click', replay);
  svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); } });
  document.querySelectorAll<HTMLElement>(`[data-replay~="${svg.id || '-'}"]`).forEach((b) => b.addEventListener('click', replay));
}
