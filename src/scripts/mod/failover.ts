// Failover toy. State machine per upstream: healthy → (failures) → open breaker → probe → healthy.
// A request walks the waterfall: skip open breakers, try each healthy-looking upstream once (bounded retries);
// broken upstreams fail and count toward their breaker. A packet animates along the SVG wires.
// "Break it mid-stream": the serving upstream dies after the first byte; the gateway does NOT switch,
// it ends the stream with an error event (that is the contract).
type U = { id: string; btn: HTMLButtonElement; down: boolean; fails: number; open: boolean; probeAt: number };
const L = () => (document.documentElement.lang === 'zh-CN' ? 'zh' : 'en');
const tr = (en: string, zh: string) => (L() === 'zh' ? zh : en);
export default function failover(root: HTMLElement, o: { reduce: boolean }) {
  const ups: U[] = [...root.querySelectorAll<HTMLButtonElement>('[data-up]')].map((btn) => ({ id: btn.dataset.up!, btn, down: false, fails: 0, open: false, probeAt: 0 }));
  const log = root.querySelector<HTMLOListElement>('.fo-log')!;
  const pkt = root.querySelector<HTMLElement>('.fo-pkt')!;
  const stage = root.querySelector<HTMLElement>('.fo-stage')!;
  const svg = root.querySelector<SVGSVGElement>('.fo-wires')!;
  const wires: Record<string, SVGPathElement> = {};
  svg.querySelectorAll<SVGPathElement>('path').forEach((p) => (wires[p.classList[1].slice(2)] = p));
  const attempt = root.querySelector<HTMLElement>('.fo-attempt')!;
  // Lay the wires out from the real node boxes (stage pixels), so they meet the cards at any width.
  const layout = () => {
    const sb = stage.getBoundingClientRect(); if (!sb.width) return;
    svg.setAttribute('viewBox', `0 0 ${sb.width} ${sb.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const box = (el: Element) => { const r = el.getBoundingClientRect(); return { l: r.left - sb.left, r: r.right - sb.left, y: r.top - sb.top + r.height / 2 }; };
    const c = box(root.querySelector('.fo-client')!), g = box(root.querySelector('.fo-gw')!);
    wires.in.setAttribute('d', `M${c.r} ${c.y} H${g.l}`);
    wires.out.setAttribute('d', `M${g.l} ${g.y} H${c.r}`);
    ups.forEach((u) => { const t = box(u.btn); const mx = (g.r + t.l) / 2; wires[u.id]?.setAttribute('d', `M${g.r} ${g.y} C${mx} ${g.y} ${mx} ${t.y} ${t.l} ${t.y}`); });
  };
  new ResizeObserver(layout).observe(stage);
  layout();
  const stats = { ok: 0, fo: 0, err: 0 };
  let busy = false, auto = 0, seq = 0, visible = true;
  const BREAK_AFTER = 3, COOLDOWN = 6000;

  const paint = () => ups.forEach((u) => {
    const state = u.open ? 'open' : u.down ? 'down' : 'healthy';
    u.btn.dataset.s = state;
    u.btn.setAttribute('aria-pressed', String(u.down));
    const lab = { healthy: tr('healthy', '健康'), down: tr('down', '故障'), open: tr('breaker open', '已熔断') }[state];
    u.btn.querySelector('[data-state]')!.textContent = lab;
    u.btn.setAttribute('aria-label', `${u.btn.querySelector('.fo-name')!.textContent?.trim()}: ${lab}. ${u.down ? tr('Click to repair.', '点击修复。') : tr('Click to break.', '点击弄坏。')}`);
    u.btn.title = u.down ? (document.documentElement.lang === 'zh-CN' ? '点击修复' : 'Click to repair') : (document.documentElement.lang === 'zh-CN' ? '点击弄坏' : 'Click to break');
    u.btn.querySelectorAll<HTMLElement>('.fo-fails i').forEach((f, k) => f.classList.toggle('on', k < u.fails));
  });
  const statPaint = () => (Object.keys(stats) as (keyof typeof stats)[]).forEach((k) => (root.querySelector(`[data-s="${k}"]`)!.textContent = String(stats[k])));
  const line = (cls: string, en: string, zh: string) => {
    const li = document.createElement('li'); li.className = cls;
    const t = new Date(); const ts = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}.${String(t.getMilliseconds()).padStart(3, '0').slice(0, 2)}`;
    li.innerHTML = `<time>${ts}</time><span data-l="en"></span><span data-l="zh" lang="zh-CN"></span>`;
    (li.children[1] as HTMLElement).textContent = en; (li.children[2] as HTMLElement).textContent = zh;
    log.prepend(li);
    while (log.children.length > 7) log.lastElementChild!.remove();
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, o.reduce ? Math.min(ms, 60) : ms));
  // Move the packet along a wire (in SVG user space mapped to the stage box).
  const travel = (name: string, ms: number, reverse = false, cls = '') => new Promise<void>((res) => {
    const p = wires[name]; if (!p) return res();
    Object.values(wires).forEach((w) => w.classList.remove('live', 'bad'));
    p.classList.add('live'); if (cls) p.classList.add(cls);
    pkt.className = `fo-pkt on ${cls}`;
    if (o.reduce) { res(); return; }
    const len = p.getTotalLength();
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const pt = p.getPointAtLength((reverse ? 1 - e : e) * len);
      pkt.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });

  const tryUp = async (u: U, n: number) => {
    attempt.textContent = tr(`attempt ${n}`, `第 ${n} 次`);
    await travel(u.id, 520);
    if (u.down) {
      u.fails = Math.min(BREAK_AFTER, u.fails + 1);
      u.btn.classList.add('hit'); setTimeout(() => u.btn.classList.remove('hit'), 400);
      if (u.fails >= BREAK_AFTER && !u.open) { u.open = true; u.probeAt = Date.now() + COOLDOWN; line('warn', `${u.id.toUpperCase()}: 3 failures, circuit breaker opened`, `${u.id.toUpperCase()}：连续失败 3 次，熔断器打开`); }
      paint();
      await travel(u.id, 300, true, 'bad');
      return false;
    }
    u.fails = 0; paint();
    return true;
  };

  const send = async (mid = false) => {
    if (busy) return; busy = true; root.classList.add('busy');
    const id = ++seq;
    await travel('in', 420);
    // Half-open probe: a breaker whose cooldown has passed gets one probe.
    for (const u of ups) if (u.open && Date.now() >= u.probeAt) {
      if (!u.down) { u.open = false; u.fails = 0; line('ok', `${u.id.toUpperCase()}: probe succeeded, breaker closed`, `${u.id.toUpperCase()}：探测成功，熔断器关闭`); }
      else { u.probeAt = Date.now() + COOLDOWN; line('warn', `${u.id.toUpperCase()}: probe failed, still open`, `${u.id.toUpperCase()}：探测失败，继续熔断`); }
    }
    paint();
    let served: U | null = null, n = 0, skipped = 0;
    for (const u of ups) {
      if (u.open) { skipped++; continue; }
      n++;
      if (await tryUp(u, n)) { served = u; break; }
      if (n >= 3) break;
    }
    if (served) {
      if (n > 1 || skipped) stats.fo++;
      if (mid) {
        // Stream starts, then the serving upstream dies after the first byte.
        await travel('out', 200);
        served.down = true; paint();
        line('err', `#${id} first byte sent by ${served.id.toUpperCase()}, then it failed. No switch after the first byte: the stream ends with an error event.`,
          `#${id} ${served.id.toUpperCase()} 已发出第一个字节后出错。第一个字节之后不再切换上游：流以一个错误事件结束。`);
        stats.err++;
        await travel('out', 380, false, 'bad');
      } else {
        await travel('out', 480);
        stats.ok++;
        line('ok', `#${id} 200 via ${served.id.toUpperCase()}${n > 1 || skipped ? ` after ${n - 1 + skipped} ${n - 1 + skipped === 1 ? 'skip' : 'skips'}` : ''}`,
          `#${id} 200，经由 ${served.id.toUpperCase()}${n > 1 || skipped ? `，跳过了 ${n - 1 + skipped} 个` : ''}`);
      }
    } else {
      stats.err++;
      line('err', `#${id} 503: every upstream is down or open`, `#${id} 503：所有上游都故障或已熔断`);
      await travel('out', 380, false, 'bad');
    }
    statPaint();
    attempt.textContent = '';
    Object.values(wires).forEach((w) => w.classList.remove('live', 'bad'));
    pkt.className = 'fo-pkt';
    busy = false; root.classList.remove('busy');
  };

  ups.forEach((u) => u.btn.addEventListener('click', () => {
    u.down = !u.down;
    if (!u.down) { u.fails = 0; u.open = false; line('ok', `${u.id.toUpperCase()} repaired`, `${u.id.toUpperCase()} 已修复`); }
    else line('warn', `${u.id.toUpperCase()} is now failing`, `${u.id.toUpperCase()} 开始出错`);
    paint();
    if (!auto && !busy) send();
  }));
  root.querySelector('[data-send]')!.addEventListener('click', () => send());
  root.querySelector('[data-mid]')!.addEventListener('click', () => send(true));
  const autoBtn = root.querySelector<HTMLButtonElement>('[data-auto]')!;
  const loop = async () => { while (auto && visible) { await send(); await wait(700); } };
  autoBtn.addEventListener('click', () => {
    auto = auto ? 0 : 1; autoBtn.setAttribute('aria-pressed', String(!!auto));
    if (auto) loop();
  });
  root.querySelector('[data-reset]')!.addEventListener('click', () => {
    ups.forEach((u) => { u.down = false; u.fails = 0; u.open = false; });
    stats.ok = stats.fo = stats.err = 0; log.innerHTML = ''; paint(); statPaint();
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) { auto = 0; autoBtn.setAttribute('aria-pressed', 'false'); } }).observe(root);
  window.addEventListener('langchange', paint);
  paint();
}
