// SSE stream visualiser. Sample frames for three dialects, decoded into one event type (mirrors the crate's
// WireEvent: Delta, ReasoningDelta, ResponseItem, Usage). Frames appear one by one with a timing gap; the
// slider scrubs to any frame (state is rebuilt from frame 0, so scrubbing backwards is exact).
type Ev = { k: 'Delta' | 'ReasoningDelta' | 'ResponseItem' | 'Usage' | 'Done'; v: string };
type F = { raw: string; ev: Ev | null; gap: number };
const think = ['The user wants ', 'one sentence ', 'about failover.'];
const text = ['A gateway ', 'retries the next ', 'healthy upstream, ', 'but never after ', 'the first byte.'];
const j = (o: unknown) => JSON.stringify(o);
function build(proto: string): F[] {
  const f: F[] = [];
  if (proto === 'responses') {
    f.push({ raw: `event: response.created\ndata: ${j({ type: 'response.created', response: { id: 'resp_01' } })}`, ev: null, gap: 260 });
    think.forEach((t) => f.push({ raw: `event: response.reasoning_summary_text.delta\ndata: ${j({ delta: t })}`, ev: { k: 'ReasoningDelta', v: t }, gap: 180 }));
    text.forEach((t) => f.push({ raw: `event: response.output_text.delta\ndata: ${j({ delta: t })}`, ev: { k: 'Delta', v: t }, gap: 140 }));
    f.push({ raw: `event: response.output_item.done\ndata: ${j({ item: { type: 'message', role: 'assistant' } })}`, ev: { k: 'ResponseItem', v: 'message · assistant' }, gap: 200 });
    f.push({ raw: `event: response.completed\ndata: ${j({ response: { usage: { input_tokens: 38, output_tokens: 21 } } })}`, ev: { k: 'Usage', v: 'in 38 · out 21' }, gap: 220 });
  } else if (proto === 'messages') {
    f.push({ raw: `event: message_start\ndata: ${j({ type: 'message_start', message: { usage: { input_tokens: 38 } } })}`, ev: null, gap: 260 });
    f.push({ raw: `event: content_block_start\ndata: ${j({ index: 0, content_block: { type: 'thinking' } })}`, ev: null, gap: 120 });
    think.forEach((t) => f.push({ raw: `event: content_block_delta\ndata: ${j({ index: 0, delta: { type: 'thinking_delta', thinking: t } })}`, ev: { k: 'ReasoningDelta', v: t }, gap: 180 }));
    f.push({ raw: `event: content_block_start\ndata: ${j({ index: 1, content_block: { type: 'text' } })}`, ev: null, gap: 120 });
    text.forEach((t) => f.push({ raw: `event: content_block_delta\ndata: ${j({ index: 1, delta: { type: 'text_delta', text: t } })}`, ev: { k: 'Delta', v: t }, gap: 140 }));
    f.push({ raw: `event: content_block_stop\ndata: ${j({ index: 1 })}`, ev: { k: 'ResponseItem', v: 'message · assistant' }, gap: 160 });
    f.push({ raw: `event: message_delta\ndata: ${j({ usage: { output_tokens: 21 } })}`, ev: { k: 'Usage', v: 'in 38 · out 21' }, gap: 200 });
    f.push({ raw: `event: message_stop\ndata: {}`, ev: null, gap: 160 });
  } else {
    think.forEach((t) => f.push({ raw: `data: ${j({ choices: [{ delta: { reasoning_content: t } }] })}`, ev: { k: 'ReasoningDelta', v: t }, gap: 180 }));
    text.forEach((t) => f.push({ raw: `data: ${j({ choices: [{ delta: { content: t } }] })}`, ev: { k: 'Delta', v: t }, gap: 140 }));
    f.push({ raw: `data: ${j({ choices: [{ delta: {}, finish_reason: 'stop' }] })}`, ev: { k: 'ResponseItem', v: 'message · assistant' }, gap: 180 });
    f.push({ raw: `data: ${j({ choices: [], usage: { prompt_tokens: 38, completion_tokens: 21 } })}`, ev: { k: 'Usage', v: 'in 38 · out 21' }, gap: 200 });
    f.push({ raw: 'data: [DONE]', ev: null, gap: 140 });
  }
  return f;
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Light syntax colouring for the raw frame: event name, keys, strings.
const hl = (raw: string) => esc(raw).replace(/^(event|data):/gm, '<b>$1:</b>').replace(/(&quot;|")([a-z_]+)\1:/g, '<i>"$2"</i>:');

export default function stream(root: HTMLElement, o: { reduce: boolean }) {
  const rawL = root.querySelector<HTMLOListElement>('.sse-raw')!, evL = root.querySelector<HTMLOListElement>('.sse-ev')!;
  const thinkEl = root.querySelector<HTMLElement>('[data-think]')!, textEl = root.querySelector<HTMLElement>('[data-text]')!, usageEl = root.querySelector<HTMLElement>('[data-usage]')!;
  const scrub = root.querySelector<HTMLInputElement>('[data-scrub]')!, count = root.querySelector<HTMLElement>('[data-count]')!;
  const playBtn = root.querySelector<HTMLButtonElement>('[data-play]')!, speed = root.querySelector<HTMLSelectElement>('[data-speed]')!;
  let proto = 'responses', frames = build(proto), pos = 0, timer = 0, playing = false;

  const render = (n: number, animate: boolean) => {
    rawL.innerHTML = ''; evL.innerHTML = '';
    let th = '', tx = '', us = '';
    frames.slice(0, n).forEach((f, i) => {
      const last = animate && i === n - 1;
      const li = document.createElement('li'); li.innerHTML = `<code>${hl(f.raw)}</code>`; if (last) li.className = 'new';
      rawL.append(li);
      const ev = document.createElement('li');
      ev.className = `${f.ev ? 'k-' + f.ev.k : 'skip'}${last ? ' new' : ''}`;
      ev.innerHTML = f.ev ? `<b>${f.ev.k}</b><span>${esc(f.ev.k === 'Delta' || f.ev.k === 'ReasoningDelta' ? JSON.stringify(f.ev.v) : f.ev.v)}</span>` : `<span>— ${document.documentElement.lang === 'zh-CN' ? '生命周期帧，不产生事件' : 'lifecycle frame, no event'}</span>`;
      evL.append(ev);
      if (f.ev?.k === 'ReasoningDelta') th += f.ev.v; if (f.ev?.k === 'Delta') tx += f.ev.v; if (f.ev?.k === 'Usage') us = `Usage · ${f.ev.v}`;
    });
    thinkEl.textContent = th; textEl.innerHTML = esc(tx) + (n < frames.length && n > 0 ? '<span class="caret"></span>' : ''); usageEl.textContent = us;
    rawL.scrollTop = rawL.scrollHeight; evL.scrollTop = evL.scrollHeight;
    scrub.max = String(frames.length); scrub.value = String(n); count.textContent = `${n} / ${frames.length}`;
    pos = n;
  };
  const stop = () => { playing = false; clearTimeout(timer); root.classList.remove('playing'); };
  const step = () => {
    if (!playing) return;
    if (pos >= frames.length) { stop(); return; }
    render(pos + 1, !o.reduce);
    timer = window.setTimeout(step, frames[pos - 1].gap / +speed.value);
  };
  playBtn.addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (pos >= frames.length) render(0, false);
    playing = true; root.classList.add('playing'); step();
  });
  scrub.addEventListener('input', () => { stop(); render(+scrub.value, false); });
  root.querySelectorAll<HTMLButtonElement>('[data-proto]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-proto]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    stop(); proto = b.dataset.proto!; frames = build(proto); render(0, false);
    playing = true; root.classList.add('playing'); step();
  }));
  // Start once when it first comes into view; pause when it leaves.
  let started = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started && !o.reduce) { started = true; playing = true; root.classList.add('playing'); step(); }
    if (!e.isIntersecting) stop();
  }, { threshold: 0.4 }).observe(root);
  render(o.reduce ? frames.length : 0, false);
}
