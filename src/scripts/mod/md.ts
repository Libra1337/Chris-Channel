// A small, safe Markdown renderer (headings, paragraphs, emphasis, inline code, links, quotes, lists with task
// boxes, tables with alignment, fenced code with a language label and light highlighting). Everything is
// escaped first; only the renderer's own tags reach innerHTML. Renders on input, coalesced to one per frame.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(s: string) {
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener nofollow" target="_blank">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}
const KW = new Set('fn let mut if else return match pub struct enum impl use const async await function export import from true false null None Some Ok Err for while in def class'.split(' '));
// Single pass: comments, strings, words, numbers; everything else is escaped as is.
function code(src: string, lang: string) {
  const re = /(\/\/[^\n]*|#[^\n]*)|("[^"\n]*"|'[^'\n]*')|([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)/g;
  let h = '', last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    h += esc(src.slice(last, m.index)); last = re.lastIndex;
    const [t, c, str, w, n] = m;
    h += c ? `<i class="c">${esc(t)}</i>` : str ? `<i class="s">${esc(t)}</i>` : n ? `<i class="n">${t}</i>`
      : KW.has(w) ? `<i class="k">${w}</i>` : /^[A-Z]/.test(w) ? `<i class="t">${w}</i>` : esc(w);
  }
  h += esc(src.slice(last));
  return `<figure class="mdc"><figcaption><span>${esc(lang || 'text')}</span><button type="button" class="mdc-copy" tabindex="-1" aria-hidden="true">copy</button></figcaption><pre><code>${h}</code></pre></figure>`;
}
export function render(md: string) {
  const lines = md.replace(/\r/g, '').split('\n');
  let out = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    let m: RegExpMatchArray | null;
    if (!l.trim()) { i++; continue; }
    if ((m = l.match(/^```\s*(\w*)/))) {
      const buf: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; out += code(buf.join('\n'), m[1]); continue;
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const n = m[1].length; out += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out += '<hr>'; i++; continue; }
    if (/^>\s?/.test(l)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out += `<blockquote>${render(buf.join('\n'))}</blockquote>`; continue;
    }
    if (/^\|.*\|\s*$/.test(l) && /^\|?\s*:?-{2,}/.test(lines[i + 1] || '')) {
      const row = (s: string) => s.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = row(l), al = row(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : 'left'));
      i += 2;
      let t = `<div class="mdt"><table><thead><tr>${head.map((h, k) => `<th style="text-align:${al[k]}">${inline(h)}</th>`).join('')}</tr></thead><tbody>`;
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) t += `<tr>${row(lines[i++]).map((c, k) => `<td style="text-align:${al[k] || 'left'}">${inline(c)}</td>`).join('')}</tr>`;
      out += t + '</tbody></table></div>'; continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      let t = ordered ? '<ol>' : '<ul>';
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, '');
        const task = item.match(/^\[([ xX])\]\s+/);
        if (task) { item = item.slice(task[0].length); t += `<li class="task${task[1] !== ' ' ? ' done' : ''}"><span class="box" aria-hidden="true"></span>${inline(item)}</li>`; }
        else t += `<li>${inline(item)}</li>`;
      }
      out += t + (ordered ? '</ol>' : '</ul>'); continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*([-*+]|\d+\.)\s|\|)/.test(lines[i])) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    out += `<p>${inline(buf.join(' '))}</p>`;
  }
  return out;
}
export default function md(root: HTMLElement) {
  const src = root.querySelector<HTMLTextAreaElement>('[data-src]')!, out = root.querySelector<HTMLElement>('[data-out]')!;
  const stat = root.querySelector<HTMLElement>('[data-stat]')!;
  const initial = src.value;
  let raf = 0;
  const go = () => {
    raf = 0;
    const t0 = performance.now();
    out.innerHTML = render(src.value);
    const words = (src.value.match(/[\p{L}\p{N}_]+/gu) || []).length;
    stat.textContent = `${words} words · rendered in ${(performance.now() - t0).toFixed(1)} ms`;
  };
  src.addEventListener('input', () => { if (!raf) raf = requestAnimationFrame(go); });
  root.querySelector('[data-theme-btn]')!.addEventListener('click', () => { out.dataset.theme = out.dataset.theme === 'dark' ? 'light' : 'dark'; });
  root.querySelector('[data-reset]')!.addEventListener('click', () => { src.value = initial; go(); });
  out.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('.mdc-copy'); if (!b) return;
    navigator.clipboard?.writeText(b.closest('figure')!.querySelector('code')!.textContent || '').catch(() => {});
    b.textContent = 'copied'; setTimeout(() => (b.textContent = 'copy'), 1200);
  });
  go();
}
