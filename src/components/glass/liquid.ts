// Liquid glass: real refraction of whatever sits behind an element (design.md §materials).
//
// How it works (Chromium only, where backdrop-filter accepts an SVG filter):
//   1. A displacement map is generated per element size on a canvas. The glass is modelled as a slab with a convex
//      squircle bezel, y = (1 − (1 − x)^4)^(1/4), across `bezel` px from the edge. For each distance from the edge
//      the bezel's slope gives a surface normal; Snell's law (n = 1.5) bends a vertical ray through it, and the
//      lateral shift at the backdrop plane is the displacement. Edges pull the backdrop inward (lensing), the flat
//      centre is untouched, and an optional `zoom` term magnifies the centre (used by the morphing lenses).
//      Vectors are normalised into R (x) and G (y) around 128; the filter scale restores pixels.
//   2. An SVG <filter>: optional frost blur → feDisplacementMap. Larger elements use three passes at slightly
//      different scales, one per colour channel, recombined with screen blends (a faint prism fringe at the rim).
//   3. backdrop-filter: url(#filter) saturate() on the element. A ResizeObserver regenerates the map.
// Everywhere else (Safari, Firefox, iOS, touch phones) the element keeps the CSS frosted fallback (.lg without .lg-on).
// The rim highlight, tint, inner glow and squish are CSS (src/components/glass/glass.css).

export type Kind = 'bar' | 'lens' | 'btn' | 'pill' | 'knob';
type Opt = { bezel: number; depth: number; zoom: number; frost: number; chroma: number; sat: number; strength: number };
const KINDS: Record<Kind, Opt> = {
  bar:  { bezel: 18, depth: 26, zoom: 0,    frost: 2.2, chroma: 0.05, sat: 1.7, strength: 1 },
  lens: { bezel: 10, depth: 9,  zoom: 0.1,  frost: 0,   chroma: 0,    sat: 1.4, strength: 1 },
  btn:  { bezel: 16, depth: 24, zoom: 0.04, frost: 1.2, chroma: 0.05, sat: 1.6, strength: 1 },
  pill: { bezel: 10, depth: 16, zoom: 0.03, frost: 1.5, chroma: 0,    sat: 1.6, strength: 1 },
  knob: { bezel: 14, depth: 22, zoom: 0.2,  frost: 0,   chroma: 0,    sat: 1.3, strength: 1 },
};

const NS = 'http://www.w3.org/2000/svg';
let defs: SVGDefsElement | null = null;
let uid = 0;

// Feature test by engine, because @supports reports url() filters as valid where they render as nothing.
export const refracts = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const chromium = /Chrome\/\d+/.test(ua) && !/Mobile|Android/.test(ua);
  return chromium && CSS.supports('backdrop-filter', 'url(#a)') && matchMedia('(hover: hover) and (pointer: fine)').matches;
})();

// Lateral offset (px) for a ray entering the bezel at fraction x (0 edge → 1 flat).
const sq = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 0.25);
function offsets(o: Opt, bezel: number, n = 96) {
  const out = new Float32Array(n), e = 1e-3, ior = 1.5;
  for (let i = 0; i < n; i++) {
    const x = Math.min(1 - e, Math.max(e, i / (n - 1)));
    const slope = ((sq(Math.min(1, x + e)) - sq(x - e)) / (2 * e)) * (o.depth / bezel);
    const a1 = Math.atan(slope), a2 = Math.asin(Math.sin(a1) / ior);
    out[i] = (o.depth * 0.3 + sq(x) * o.depth) * Math.tan(a1 - a2);
  }
  return out;
}

const cache = new Map<string, { url: string; scale: number }>();
// Map at CSS-pixel size (the filter stretches it to device pixels; the field is smooth so nothing is lost).
export function makeMap(w: number, h: number, radius: number, o: Opt) {
  const key = `${w}x${h}r${radius}:${o.bezel},${o.depth},${o.zoom}`;
  const hit = cache.get(key); if (hit) return hit;
  const hw = w / 2, hh = h / 2, r = Math.min(radius, hw, hh), bez = Math.max(2, Math.min(o.bezel, r));
  const lut = offsets(o, bez), n = lut.length;
  const vx = new Float32Array(w * h), vy = new Float32Array(w * h);
  let max = 1e-6;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const px = i + 0.5 - hw, py = j + 0.5 - hh;
    const ax = Math.abs(px) - (hw - r), ay = Math.abs(py) - (hh - r);
    const ox = Math.max(ax, 0), oy = Math.max(ay, 0), ol = Math.hypot(ox, oy);
    const d = -(ol + Math.min(Math.max(ax, ay), 0) - r);           // depth inside the edge, px
    if (d <= 0) continue;
    let nx: number, ny: number;                                    // outward normal
    if (ax > 0 && ay > 0) { nx = (ox / ol) * Math.sign(px); ny = (oy / ol) * Math.sign(py); }
    else if (ax > ay) { nx = Math.sign(px); ny = 0; } else { nx = 0; ny = Math.sign(py); }
    const t = Math.min(1, d / bez), off = t >= 1 ? 0 : lut[Math.min(n - 1, Math.round(t * (n - 1)))];
    const k = j * w + i;
    vx[k] = -nx * off - px * o.zoom; vy[k] = -ny * off - py * o.zoom;  // sample inward: edges lens, centre magnifies
    const m = Math.max(Math.abs(vx[k]), Math.abs(vy[k])); if (m > max) max = m;
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!, img = g.createImageData(w, h), p = img.data;
  for (let k = 0; k < w * h; k++) {
    p[k * 4] = 128 + (vx[k] / max) * 127; p[k * 4 + 1] = 128 + (vy[k] / max) * 127; p[k * 4 + 2] = 128; p[k * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const res = { url: c.toDataURL(), scale: 2 * max };              // feDisplacementMap shifts by scale × (c − 0.5)
  cache.set(key, res);
  return res;
}

function ensureDefs() {
  if (defs) return defs;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  defs = document.createElementNS(NS, 'defs'); svg.appendChild(defs); document.body.appendChild(svg);
  return defs;
}
const el = (tag: string, a: Record<string, string | number>) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, String(a[k])); return e; };

function buildFilter(id: string, o: Opt) {
  const f = el('filter', { id, x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' });
  // Neutral grey under the map: any area the map does not cover (a lens mid-stretch) is not displaced.
  f.appendChild(el('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'zero' }));
  const img = el('feImage', { x: 0, y: 0, result: 'img', preserveAspectRatio: 'none' });
  f.appendChild(img);
  f.appendChild(el('feComposite', { in: 'img', in2: 'zero', operator: 'over', result: 'map' }));
  let src = 'SourceGraphic';
  if (o.frost > 0) { f.appendChild(el('feGaussianBlur', { in: src, stdDeviation: o.frost, result: 'frost' })); src = 'frost'; }
  const disp: SVGElement[] = [];
  if (o.chroma > 0) {
    const keep = ['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'];
    keep.forEach((m, i) => {
      const d = el('feDisplacementMap', { in: src, in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G', result: `d${i}` });
      disp.push(d); f.appendChild(d);
      f.appendChild(el('feColorMatrix', { in: `d${i}`, type: 'matrix', values: m, result: `c${i}` }));
    });
    f.appendChild(el('feBlend', { in: 'c0', in2: 'c1', mode: 'screen', result: 'c01' }));
    f.appendChild(el('feBlend', { in: 'c01', in2: 'c2', mode: 'screen' }));
  } else {
    const d = el('feDisplacementMap', { in: src, in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G' });
    disp.push(d); f.appendChild(d);
  }
  ensureDefs().appendChild(f);
  return { img, disp };
}

export type Glass = { el: HTMLElement; refresh: () => void; stretch: (w: number, h: number) => void; setStrength: (s: number) => void };
const all: Glass[] = [];

// Attach liquid glass to one element. Without refraction support it only marks the element (CSS fallback applies).
export function attach(node: HTMLElement, kind: Kind = (node.dataset.lg as Kind) || 'btn'): Glass | null {
  if (!refracts) return null;
  const base = KINDS[kind], o = { ...base };
  const id = `lg${++uid}`;
  const { img, disp } = buildFilter(id, o);
  let scale = 0, strength = o.strength;
  const apply = () => disp.forEach((d, i) => d.setAttribute('scale', (scale * strength * (1 + (o.chroma > 0 ? i * o.chroma : 0))).toFixed(2)));
  const refresh = () => {
    const w = Math.round(node.offsetWidth), h = Math.round(node.offsetHeight);
    if (!w || !h) return;
    const cs = getComputedStyle(node), raw = cs.borderTopLeftRadius;
    const r = raw.endsWith('%') ? (parseFloat(raw) / 100) * Math.min(w, h) : parseFloat(raw) || 0;
    // Bezel and depth are design px: they follow the page scale (tokens.css, 1rem = 20px × z), read on every
    // rebuild because the root size is fluid with the viewport.
    const z = parseFloat(getComputedStyle(document.documentElement).fontSize) / 20 || 1;
    o.bezel = base.bezel * z; o.depth = base.depth * z;
    const m = makeMap(w, h, r, o);
    img.setAttribute('href', m.url); img.setAttribute('width', String(w)); img.setAttribute('height', String(h));
    scale = m.scale; apply();
  };
  // While a lens is moving its box changes every frame: stretch the last map instead of rebuilding it.
  const stretch = (w: number, h: number) => { img.setAttribute('width', w.toFixed(1)); img.setAttribute('height', h.toFixed(1)); };
  const setStrength = (s: number) => { strength = s; apply(); };
  refresh();
  node.style.setProperty('--lg-filter', `url(#${id}) saturate(${o.sat})`);
  node.classList.add('lg-on');
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = window.setTimeout(refresh, 80); }).observe(node);
  const g = { el: node, refresh, stretch, setStrength };
  all.push(g);
  return g;
}

export function get(node: Element | null) { return all.find((g) => g.el === node) || null; }

export function init(root: ParentNode = document) {
  document.documentElement.classList.toggle('lg-refract', refracts);
  root.querySelectorAll<HTMLElement>('[data-lg]').forEach((n) => attach(n));
}
