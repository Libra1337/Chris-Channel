// Hero light field: one full-screen fragment shader at reduced resolution. A soft beam of amber light (the mark's
// beam angle) drifts through slow noise; the pointer adds a warm glow and bends the beam toward it.
// The beam enters the top edge right of centre (~60% of the width on every aspect: narrow screens get a steeper
// beam), and that entry point is the scene's light: it is written to --lgx on the nav and the hero buttons so their
// glass highlights sit on the same side as the beam and drift with it (glass.css).
// Lazy (called from core.ts at idle), paused offscreen and in hidden tabs, 30 fps on low-power devices.
// If WebGL is missing or fails, the CSS gradient fallback behind the canvas stays.
const FRAG = `precision mediump float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform float g;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  vec2 mp=(m-.5)*vec2(r.x/r.y,1.);
  float asp=r.x/r.y;
  vec2 c=vec2(asp*.22,.0)+(mp-vec2(asp*.22,0.))*.10;
  vec2 dir=normalize(vec2(.36*min(1.,asp/1.6),-.93));
  vec2 q=p-c;
  float along=dot(q,dir);
  float across=q.x*dir.y-q.y*dir.x;
  float flow=fbm(vec2(along*1.6-t*.06,across*3.2+t*.02));
  float w=.10+.07*flow;
  float beam=exp(-across*across/(w*w))*(.55+.6*flow)*smoothstep(1.2,-.2,abs(along));
  // fine filaments inside the beam, and a thin reflected streak low on the left that crosses behind the hero buttons
  float fil=pow(abs(sin(across*70.+flow*5.)),24.)*beam;
  vec2 d2=normalize(vec2(.97,.24)); vec2 q2=p-vec2(-asp*.22,-.2);
  float a2=dot(q2,d2), x2=q2.x*d2.y-q2.y*d2.x;
  float f2=fbm(vec2(a2*2.2+t*.05,x2*6.));
  // brightest toward its right end (the beam's side), fading to the left
  float side=.55+.45*smoothstep(-.7,.5,a2);
  float streak=(exp(-x2*x2/.0016)*(.45+.6*f2)*smoothstep(.75,.0,abs(a2-.08))
              +exp(-(x2-.045)*(x2-.045)/.00012)*.5*smoothstep(.6,.0,abs(a2-.1))
              +exp(-(x2+.04)*(x2+.04)/.00008)*.35*smoothstep(.5,.0,abs(a2)))*side;
  float haze=fbm(p*1.3+vec2(t*.015,-t*.01));
  float glow=exp(-dot(p-mp,p-mp)*5.)*g;
  vec3 amber=vec3(.94,.64,.40), hi=vec3(1.,.89,.74);
  // Neutral black base (#0B0B0C); the only warmth is the beam, its streak and the pointer glow.
  vec3 col=vec3(.043,.043,.047);
  col+=amber*beam*.26+hi*pow(beam,3.)*.13+hi*fil*.06;
  col+=mix(amber,hi,.4)*streak*.16;
  col+=vec3(.5)*smoothstep(.6,1.,haze)*.012*(1.-beam);
  col+=mix(amber,hi,.35)*glow*.18;
  float v=smoothstep(1.35,.25,length(p*vec2(.8,1.)));
  col*=.55+.45*v;
  col+=(h(gl_FragCoord.xy+fract(t))-.5)/96.;
  gl_FragColor=vec4(col,1.);
}`;
const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

export default function field(canvas: HTMLCanvasElement) {
  // failIfMajorPerformanceCaveat: no context on software rasterisers (SwiftShader, llvmpipe), where one frame of this
  // shader costs hundreds of ms of CPU. Those devices keep the CSS fallback.
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true });
  if (!gl) return;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const sw = /SwiftShader|llvmpipe|softpipe|Software/i.test(String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)));
  if (sw) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return; }
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  const pr = gl.createProgram()!; gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  // Compile off the main thread where the driver allows it: poll completion instead of blocking on LINK_STATUS.
  const par = gl.getExtension('KHR_parallel_shader_compile');
  if (par) { const poll = () => (gl.getProgramParameter(pr, par.COMPLETION_STATUS_KHR) ? run() : setTimeout(poll, 50)); poll(); }
  else run();
  function run() {
  if (!gl || !gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'm'), uG = gl.getUniformLocation(pr, 'g');

  const nav = navigator as any;
  const lowPower = matchMedia('(pointer: coarse)').matches || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;
  const minDt = lowPower ? 1000 / 30 : 0;
  const scale = lowPower ? 0.35 : 0.5;
  let w = 0, h = 0;
  const resize = () => {
    const rc = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rc.width * scale)); h = Math.max(1, Math.round(rc.height * scale));
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(uR, w, h);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // Pointer: target and eased values; glow fades in while the pointer is over the hero.
  let tx = 0.7, ty = 0.55, mx = 0.7, my = 0.55, gT = 0, gv = 0;
  const host = canvas.parentElement!;
  host.addEventListener('pointermove', (e) => {
    const rc = canvas.getBoundingClientRect();
    tx = (e.clientX - rc.left) / rc.width; ty = 1 - (e.clientY - rc.top) / rc.height; gT = 1;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { gT = 0; });

  // Where the beam axis crosses the top edge, as a fraction of the width (same maths as the shader).
  const lit = [document.querySelector<HTMLElement>('.nav'), host.closest('[data-hero]')?.querySelector<HTMLElement>('.hero-cta')].filter(Boolean) as HTMLElement[];
  let lx0 = -1;
  const light = () => {
    const asp = w / h, mpx = (mx - 0.5) * asp, cy = (my - 0.5) * 0.1;
    const cx = asp * 0.22 + (mpx - asp * 0.22) * 0.1, dx = 0.36 * Math.min(1, asp / 1.6);
    const lx = 0.5 + (cx - (0.5 - cy) * dx / 0.93) / asp;
    if (Math.abs(lx - lx0) < 0.002) return;
    lx0 = lx; const v = lx.toFixed(3);
    for (const el of lit) el.style.setProperty('--lgx', v);
  };

  let visible = true, raf = 0, last = 0, t0 = performance.now(), shown = false;
  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    if (minDt && now - last < minDt) return;
    const dt = Math.min(64, now - (last || now)); last = now;
    const k = 1 - Math.pow(0.0025, dt / 1000);
    mx += (tx - mx) * k; my += (ty - my) * k; gv += (gT - gv) * k * 0.6;
    gl.uniform1f(uT, (now - t0) / 1000); gl.uniform2f(uM, mx, my); gl.uniform1f(uG, gv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    light();
    if (!shown) { shown = true; canvas.classList.add('on'); }
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  // Off the hero the glass falls back to the default light (--lgx .6 in glass.css).
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else { lx0 = -1; for (const el of lit) el.style.removeProperty('--lgx'); } }, { threshold: 0 }).observe(canvas);
  document.addEventListener('visibilitychange', start);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visible = false; canvas.classList.remove('on'); });
  start();
  }
}
