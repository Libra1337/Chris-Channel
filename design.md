---
name: christian-portfolio-design
description: Presentation rules for Christian's personal portfolio site (a long-scroll home page and long-form project case studies), read by admissions readers on laptops and phones. Goal - the site itself shows design and motion craft - editorial type, light as the brand material, glass controls, interactive objects instead of card grids.
version: 2026-10-23
---

# Christian portfolio: design.md

## 1. Scope and priority

- Applies to: the home page, the project case-study pages, and every shared component in `src/components/`. Dark and paper (light) section themes. [MUST]
- Does not apply to: the media files themselves (screen recordings, the film, brand sheets). They are shown as they are. [MUST]
- Conflict order: facts and my own requirements > accessibility and reduced motion > performance budget > reader can find and open the work > brand expression > decoration. [MUST]

## 2. Brand and readers

- Readers scan on a laptop first and a phone second. They give each section a few seconds. The first viewport of every section shows one headline and one object to look at or touch. [SHOULD]
- "Person first": the name and the voice are first person, calm and specific. No superlatives, no sales verbs ("unlock", "supercharge", "revolutionary"), no prices. [MUST]
- "Light as material" (from the mark: two trunks and a beam of light): warmth comes from light sources on near-black, not from coloured surfaces. Amber light means "this is alive / act here"; teal light means "systems / data path". [SHOULD]
- "Crafted, not decorated": every motion explains a state change or responds to the reader's hand (pointer, scroll, drag, key). Ambient motion is limited to the hero light field, Lumen's breath and the mark's glow. [SHOULD]
- "Editorial": large serif display type with tight leading against small mono labels. Long text sits in one readable column. [SHOULD]

## 3. Page structure and composition

### 3.1 Long-scroll narrative page (home)

- First viewport: full-height dark hero. Left: a one-line tag, the name (largest element, display serif), one line of positioning and two buttons. Right: a device stage with real recordings playing (laptop behind, phone in front); on phones the stage sits under the copy, still inside the first screen. Below: a strip with a thumbnail of every project, drifting slowly and stopping under the pointer or focus. The light field is only a low backlight behind the devices. No scroll-hint icon. [MUST]
- Home switches theme once: the first screen and Work are dark; About, Play, Notes, Contact and the footer are paper. Six sections, ≤ 450 visible English words, ≤ 7 screens at 1440. Live demos, the film and the full notes live on their own pages (gateway, LLM Provider Kit, Zaji, brand, /notes/). Project pages keep their alternating themes. [MUST]
- One left edge: every home section uses `--wrap-wide` (88rem). [SHOULD]
- Each section opens with a section head: mono label `NN / Name`, a display headline (max 2 lines on desktop), and optionally one lead paragraph. [SHOULD]
- Work: the main projects are a mosaic of unequal media panels, each a looping screen recording with the product name as its title, one line, my role and three tags. Panels alternate wide and narrow (7 + 5 columns) and never form a grid of equal cards. The other projects follow as "More work" in the typographic index with a cursor-following preview. Titles are product names; a repository name, when different, is set small in mono, never in the serif. [MUST]
- Notes: on home, three titles as a large list linking to /notes/; the /notes/ page is one column of text with a sticky index on desktop, one entry filling most of a viewport, no card backgrounds. [MUST]
- About carries a short timeline (month, project, one line) with my own dates, oldest first; no photo, no school or grade. [MUST]
- End position: contact block (location, email with copy, GitHub), then a thin footer. [SHOULD]

### 3.2 Long-form case study (project page)

- First viewport: label (number, group, kicker), the project title in the display serif (it morphs from the index title during page transitions), status pill, one-line summary, a role line, then the hero media below the fold line. [SHOULD]
- Body order: problem (paper) → what I built (dark) → how it works (paper: step flow + diagram) → interface (dark: pinned scroll scene or live demo) → optional extra scenes → tech used (paper) → lessons (dark) → next project. [SHOULD]
- Pinned scroll scenes hold one device in a sticky stage and change its screen per step. The step text column scrolls beside it. On viewports under 860 px the stage is hidden and each step shows its own screen inline. [SHOULD]
- The end position is a full-width "Next project" link with the next title in the display serif. [SHOULD]

## 4. Visual rules

### 4.1 Type

**Scale**. Every size in the CSS is written as design px / 20 in `rem`, and the root font-size carries the scale: `font-size: clamp(87.5%, 128.125% - .45vw, 106.25%)` = 17px (z .85) at ≤ 760px wide, falling to 14px (z .70) at ≥ 1440px. `--fz` (1.6px on phones → 2.5px on desktop) is added to every small text size (plain sizes and clamps whose max ≤ 40 design px), so text shrinks less than layout. `vw` terms inside clamp() are unchanged (browser zoom leaves them alone too). Hairlines (≤ 2px), 999px pill radii, the grain tile and the diagram SVG labels stay in px. [MUST]

| Role | Token / class | Font | Size (CSS) | At 1440 | At 390 | Weight | Line height | Tracking |
|---|---|---|---|---|---|---|---|---|
| Hero name | `.hero-name` / `.t-name` | `--serif` | min(12rem, 31cqi) of the copy column (container query); phones min(17vw, 31cqi) | 141px | 66px | 400 | 0.86 | -0.035em |
| Display headline | `.t-display` | `--serif` | clamp(2.2rem, 6.4vw, 5.2rem) | 73px | 37px | 400 | 0.98 | -0.025em |
| Section headline | `.t-h2` | `--serif` | clamp(1.7rem, 4.2vw, 3.2rem) | 45px | 29px | 400 | 1.04 | -0.02em |
| Item title | `.t-h3` | `--sans` | clamp(1rem + fz, 1.8vw, 1.3rem + fz) | 21px | 19px | 600 | 1.25 | -0.012em |
| Index title | `.ix-title` | `--serif` | clamp(1.9rem, 6vw, 4.8rem) | 67px | 39px | 400 | 0.95 | -0.03em |
| Lead | `.t-lead` | `--sans` | clamp(.95rem + fz, 1.6vw, 1.15rem + fz) | 18.6px | 17.8px | 400 | 1.45 | -0.005em |
| Body | `body` (`--body`) | `--sans` | clamp(15px, .85rem + fz, 16px) | 15px | 16px | 400 | 1.6 | 0 |
| Body-text roles | `.p-meta dd`, `.ps p`, `.tile p`, `.ix-one`, `.gc-list` | `--sans` | max(15px, .75rem + fz) | 15px | 15px | 400 | 1.5–1.6 | 0 |
| Small / caption | `.t-small` | `--sans` | .7rem + fz | 12.3px | 13.5px | 400 | 1.5 | 0 |
| Label | `.t-label` | `--mono` | .575rem + fz, uppercase | 10.6px | 11.4px | 500 | 1 | 0.16em |
| Numeric fact | `.t-num` | `--serif` | clamp(2.2rem, 5vw, 3.8rem) | 53px | 37px | 400 | 1 | -0.03em, tabular |

- The hero name is sized by its own column, never by the viewport, so it is never clipped or covered by the device stage. `scripts/hero-fit.mjs` checks 390–1920 in EN and ZH. A local fallback face scaled to the serif's width keeps it inside the column before the web font loads. [MUST]
- Body text never goes below 15px on desktop or 16px on phones. Reading columns: notes 30em (≈ 70 characters at 1440), `.t-body` 38em, lead 34em; measured 49–70 characters per line at 1440 and 43–51 at 390. [MUST]

- The serif is for display sizes only (name, section headlines, product titles, note titles). Small titles (item titles, card, step and lesson titles) are the sans at 600: the serif's single 400 weight reads thin at the 70% scale. Repository names are never set in the serif; they appear small in mono beside the product name. [MUST]
- `--serif` = "Instrument Serif" (self-hosted latin, OFL) then "Songti SC", "STSong", "Noto Serif SC", Georgia, serif. Chinese headlines use weight 600 with `font-synthesis: none` so CJK falls to the bold Song cut while Latin stays 400. [SHOULD] Decision: Instrument Serif has the high-contrast editorial look at display sizes and is ~20 KB.
- `--sans` = system UI stack (SF Pro / PingFang SC / Segoe UI / Noto Sans SC). `--mono` = ui-monospace, SF Mono, Menlo. [SHOULD]
- Italic serif is reserved for one accent phrase per headline (for example "the way it *feels*"). It takes the amber light colour on dark and `--amber-ink` on paper. [SHOULD]
- Weights: sans uses 400 and 600 only. Hierarchy comes from size, then opacity, then weight. [SHOULD]
- Chinese text: letter-spacing +0.02em on headlines, lead max width 26em. [SHOULD]

### 4.2 Colour roles (tokens in `src/styles/tokens.css`)

| Token | Dark value | Paper value | Role |
|---|---|---|---|
| `--bg` | #0B0B0C | #F2F0EB | Section ground (dark is neutral black, no brown) |
| `--raised` | #141416 | #FBFAF7 | Media wells, demo panels |
| `--text` | #F5F5F4 | #141416 | Headlines, body |
| `--dim` | rgba(245,245,244,.64) | rgba(20,20,22,.68) | Secondary text (≥ 4.5:1) |
| `--faint` | rgba(245,245,244,.40) | rgba(20,20,22,.42) | Labels next to stronger text, never sole carrier of meaning |
| `--line` | rgba(255,255,255,.10) | rgba(0,0,0,.10) | Hairlines |
| `--amber` | #F0A465 | #A9521C | Light accent / primary action |
| `--amber-hi` | #FFE3BC | #7A3A12 | Highlight, gradient top |
| `--ember` | #D46E3E | #B5582A | Gradient bottom, Lumen |
| `--teal` | #24B3CD | #0B6F82 | Systems, data path, links in diagrams |
| `--teal-hi` | #B5ECF4 | #075766 | Focus ring core on dark |
| `--ok` | #74C196 | #2E8A5A | Healthy / done |
| `--bad` | #E8695C | #C2412F | Failed / broken |

- A section sets its theme with `.dark` or `.paper`; components read only the tokens. [MUST]
- Warmth lives only in the light: the hero beam, the pointer glow and the amber accent. Grounds, grain and haze stay neutral. [MUST]
- One solid amber fill per viewport at most (the primary action). Everything else uses amber as light: text, glow, hairline. [SHOULD]
- Text on media or glass keeps ≥ 4.5:1 through a scrim, not through text shadow. [MUST]

### 4.3 Space, grid, alignment

Spacing uses the same scale (rem, 1rem = 20px × z): values below are CSS, with the result at 1440 / 390.
- Container `.wrap`: width min(66rem, 100% - 2 × `--gutter`) = 925px at 1440; `--gutter` = clamp(1rem, 4vw, 2.4rem) = 34px / 17px. `--nav-h` 3.2rem. [SHOULD]
- Section padding: clamp(4.8rem, 13vw, 10rem) top and bottom = 140px / 82px; `.tight` sections clamp(3.2rem, 8vw, 6rem). [SHOULD]
- Section head to content: clamp(2rem, 6vw, 4.4rem). Headline to lead: 1.1rem. Paragraph to paragraph: 1em. [SHOULD]
- Index rows: columns 3.2rem · title · max 15rem meta · 1.6rem arrow, gap .4rem 1.2rem, row padding clamp(.9rem, 2.2vw, 1.5rem); the preview card min(22rem, 34vw). [SHOULD]
- Devices: phone frame min(16rem, 72vw) (225px at 1440), pinned stage phone ≤ 33rem tall; browser and laptop frames fill their column. [SHOULD]
- 12-column grid on ≥ 1000 px with 1.2rem gaps; headlines span 8–10 columns; lead spans 5–6. Under 860 px every multi-column layout becomes one column. [SHOULD]
- Media queries stay in px (600, 860, 1000). JS offsets written in design px (Lenis anchor offset, notes jump, hand-off flight, index preview) multiply by z. [MUST]
- Breakpoints: 600, 860, 1000 px. [SHOULD]

### 4.4 Surfaces and materials

#### §materials — liquid glass for floating chrome, hairlines for content

Two materials, never mixed up:

1. **Liquid glass** (`src/components/glass/`): only on chrome that floats over content: the nav bar and its two morphing lenses, the hero CTAs, the index preview's “Open →” pill, the compare handle, the film play button and control bar, and the video pause buttons. Too much glass looks cheap. [MUST]
2. **Quiet content material** (`src/styles/materials.css`): everything in the flow of a section. Tech chips, demo tags, status, tabs and filters, and in-flow buttons get a 1px `--line` hairline and a transparent fill; the active option gets a 11% `--text` fill; the in-flow primary is plain amber. No blur and no glass. [MUST]

Liquid glass layers (one element, `.lg` + `data-lg="bar|lens|btn|pill|knob"`, or `<LiquidGlass kind>`):

| Layer | Rule |
|---|---|
| Refraction | Chromium desktop: `backdrop-filter: url(#lgN) saturate()` on `::before`. `liquid.ts` builds a displacement map per element size: a convex squircle bezel y = (1 − (1 − x)⁴)^¼ across 10–18px, a ray bent by Snell's law (n = 1.5) through each bezel normal, and the lateral shift encoded in R/G around 128 (`color-interpolation-filters="sRGB"`, a neutral flood under the map). Edges lens the backdrop inward; the centre is flat (bar) or magnified 3–20% (lens, pill, knob). Bars and buttons get three displacement passes at +5% scale steps per colour channel, screen-blended (a faint prism fringe). A ResizeObserver rebuilds the map. [MUST] |
| Fallback | Detected by engine (`@supports` accepts url() filters it cannot draw): Safari, Firefox, iOS, Android and touch devices get `blur(16px) saturate(180%)` and the same rim, tint and squish. Lenses get no blur (the label under them must stay sharp). [MUST] |
| Tint | Dark: rgba(24–28,·,·,.4 → .72 → .46) top to bottom (denser across the text band, clearer over the bezel rows where the bend shows). Light (nav over paper): white .5 → .76 → .52. Amber CTA: rgba(252,184,122,.8 → 236,138,66,.74). [MUST] |
| Rim | `::after`, 1.25px through a mask, blurred .4px: a strong radial arc on the top edge facing the light, a faint one on the opposite bottom edge, a soft vertical gradient between them. Never a uniform border. Bars (`.lg-bar`): 1px, not blurred, a narrow arc along the top edge (48% wide) over a faint even line, brightest where the scene's light crosses the bar. [MUST] |
| Light direction | Specular highlights agree with the light source. `--lgx` (0 left … 1 right) is where the scene's light enters the top of the viewport; default .6, the hero beam's entry (upper right). On the hero, `fx/field.ts` computes the beam's entry from the eased light origin each frame and writes it to `.nav` and `.hero-cta` only while the hero is in view (no write when it moves < .2%); off the hero the property is removed. The bar's arc peaks at `--lgx` of the viewport width; buttons, pills and lenses peak at `--lg-sx` (their own width, pushed toward the shoulder, ≈ 74% at .6). The shader's beam and the low streak are brightest on the same side; the static CSS beam uses the same angle. [MUST] |
| Inner glow | Inset .5px light line, a 1.5px top highlight, a 1.5px dark bottom line, and an 18px inner glow at 4.5%. [MUST] |
| Pointer | A light (fill, 16%) and a rim highlight (95%) follow `--mx/--my`, fading in with `--lg-hot`. `:hover` counts only under `(hover: hover)`. Bars light only while `fx/pointer.ts` marks them `.lg-pt` (a mouse is over them and the position is known), at 5% fill / 32% rim, so the light never rests at a default position; lenses never take the light. The system cursor is never replaced. [MUST] |
| Press | Scale .96 in 140ms, released on a damped spring (`--spring`, a CSS `linear()` curve, ζ ≈ .42, ~23% overshoot, ~.7s). [MUST] |
| Depth | 0 10px 30px −10px rgba(0,0,0,.5) plus a 2px contact shadow; amber CTA gets an amber glow. [SHOULD] |

- **Nav**: one floating bar (brand · links · language), 2.7rem (38px at 1440, 43px at 390), radius 999px. Over flat dark it reads as a calm dark strip with a clean top rim; bending shows only at the edges when there is varied content behind. It turns light over `.paper` sections and dark elsewhere, decided by the top-level section under the bar's centre line, so its labels keep ≥ 4.5:1 on any ground (measured 5.91:1 minimum over 1036 samples, EN and ZH, home and project pages, by sampling the backdrop with the labels hidden). [MUST]
- **Morphing lenses**: the nav lens marks the hovered, focused or current link; the language lens marks EN/中文. They sit above the labels and magnify them. Movement runs on two springs, one per edge: the leading edge is stiffer (k 620, c 34) than the trailing edge (k 300, c 25), so the capsule stretches while it travels, thins up to 14% with speed, refracts up to 70% harder while moving, and settles back into a capsule. Reduced motion: it jumps. [MUST]
- **Hero CTAs** sit over the light field's lower streak, so the bend is visible at rest. [SHOULD]
- **Performance**: at most ~10 refracting elements per page, all small except the nav. The map is generated once per size (cached by size, radius and kind); while a lens moves the map is stretched, not rebuilt. Scroll with the nav refracting measured 59.1 fps (home) and 58.8 fps (phone page) at 1440, with 0 long tasks; the frosted fallback measured 59.9 fps. [MUST]
- Lens shadows are contact-only (0 1px 2px) and the lens map is shallow (bezel 10, depth 9, zoom .1, × z), so nothing bleeds past the capsule. [MUST]
- Pill type: sans 500; 中文 gets +.02–.06em tracking. Mono labels are .525–.575rem + fz uppercase with .07–.14em tracking (EN only; 中文 switches to sans 12px). [SHOULD]

#### Pointer

- No custom cursor. The native cursor is used everywhere; draggable objects use `grab`/`grabbing` and show an on-object handle with a soft glow (compare handle, film scrubber knob). [MUST]
- The index preview card carries its own small “Open →” / 「打开 →」 liquid-glass pill (28px, mono amber label); nothing follows the pointer except that card. [MUST]
- Magnetic pull and the specular highlight stay; they add no extra pointer element. [SHOULD]

- Media wells: radius 20px (devices use their own frame radii), 1px `--line` inset, no drop shadow on paper. Cards inside cards are not allowed. [SHOULD]
- Grain: a static, colourless noise tile at 3.5% opacity on plain dark grounds (`.grain`), 3% on paper. It sits behind content, never over media, and never animates. [SHOULD]
- Device frames keep the measured iPhone 17 Pro (1 : 2.1225, bezel 2.2%) and Pixel 9 (1 : 2.1847, bezel 2.4%) proportions in `.dev.phone`. [MUST]

### 4.5 Media

- Screen recordings play muted, inline, looped, only while ≥ 35% visible, at most two at once, with a visible pause button. [MUST]
- Mobile (≤ 820 px) gets the `-sm` renditions. Posters are WebP. Images use AVIF → WebP → PNG. [MUST]
- The film plays only on user action, with sound, inside the cinematic frame. [SHOULD]

### 4.6 Controls and states

- Buttons `.btn`: height 2.4rem (34px at 1440, 41px at 390; 1.9rem `.sm`), radius 999px, padding 0 1.1rem, sans .75rem + fz /500 (600 on the amber CTA). Variants and material: see §materials. Active: scale .96 with a spring release; disabled: 40% opacity, no magnet. [SHOULD]
- Magnetic pull (`data-magnetic`): the control moves toward the pointer by up to 22% of the distance within 1.25 × its radius, eased back on leave over 500 ms. Only on fine pointers without reduced motion. [MUST]
- Motion people see, nothing else: keep the liquid-glass nav, press springs, pinned project scenes, videos that play only on screen, the project strip's slow drift (stops on hover and focus), the hero line's one-time rise and the work panels' scale-in (corners tighten 28 → 20 design px). No parallax, no magnetic pull on small in-flow buttons, no word-by-word splitting. [MUST]
- Focus ring: 2px `--teal-hi` (dark) / `--teal` (paper) outline at 3px offset plus a 6px soft halo of the same colour at 30%; radius follows the element. Never removed, never default blue. [MUST]
- Links in text: underline 1px at 0.25em offset, `--faint` colour line; on hover the line becomes `--text`. [SHOULD]
- Index rows: hover dims all other rows to 35% and shifts the hovered title right by 24px; keyboard focus does the same. [SHOULD]
- Live demos show their state in words as well as colour (for example "down", "open", "healthy"). [MUST]

### 4.7 Motion

- Easing: `--ease-out` cubic-bezier(.22,1,.36,1) for entrances and UI; `--ease-io` cubic-bezier(.65,0,.35,1) for scrubbed and looping state; pointer followers use exponential smoothing (factor .16–.22 per frame). [SHOULD]
- Durations: micro 160 ms, UI 320 ms, entrance 700–900 ms, signature sequences (hero mark, card hand-off) up to 2.4 s. [SHOULD]
- Animate only transform, opacity, clip-path and stroke-dashoffset. Do not animate layout properties, filter on large elements, or box-shadow on scroll. [MUST]
- Reveal: headline lines rise from a mask (translateY 105% → 0) with 80 ms stagger; body blocks fade up 24px. [SHOULD]
- Every continuous effect (light field, Lumen, previews, demos, video) pauses when offscreen or when the tab is hidden. The light field runs at 30 fps on low-power devices (coarse pointer, ≤ 4 cores, or ≤ 4 GB memory). [MUST]
- `prefers-reduced-motion: reduce`: no light field (static gradient image instead), no magnetic pull, no parallax, no smooth scroll, no pinned scrubbing; pinned scenes become stacked static steps; transitions are cross-fades ≤ 150 ms. All content stays visible. [MUST]
- Page transitions: cross-document View Transitions; the project title morphs between the index row and the case-study hero; everything else cross-fades 280 ms. Browsers without support navigate normally with a 240 ms fade-in. [SHOULD]
- Scroll progress: a 1px hairline at the top of the viewport, amber, scaled on X. [SHOULD]

## 5. Available primitives

Extension boundary: pages use only the names below. Page-specific styles use the `pg-*` namespace and may change layout only; they may not change the type, colour, rim or focus rules of a listed primitive.

| Role | Implementation | Source | Usage condition | Status |
|---|---|---|---|---|
| Tokens | `--bg --raised --text --dim --faint --line --amber --amber-hi --ember --teal --teal-hi --ok --bad --serif --sans --mono --ease-out --ease-io --gutter` | `src/styles/tokens.css` | Every colour, font and easing | Implemented |
| Section theme | `.dark`, `.paper`, `.grain`, `.section`, `.tight`, `.wrap` | `src/styles/global.css` | Every section | Implemented |
| Type classes | `.t-name .t-display .t-h2 .t-h3 .t-lead .t-small .t-label .t-num`, `em.lit` for the accent phrase | `src/styles/global.css` | Text roles in 4.1 | Implemented |
| Bilingual text | `<T en zh html?>` | `src/components/T.astro` | Every visible string | Implemented |
| Section head | `<Head n label en zh lead? id>` | `src/components/Head.astro` | Every section head | Implemented |
| Button | `<a class="btn glass">` / `.btn.solid` / `.btn.ghost` (in flow); `.btn.lg` (floating, liquid glass) | `src/styles/materials.css`, `src/components/glass/glass.css` | Actions and links styled as actions | Implemented |
| Liquid glass | `<LiquidGlass kind>` or `.lg` + `data-lg` (+ `data-spec` for the pointer light) | `src/components/glass/`, `src/scripts/fx/pointer.ts` | Floating chrome only (§materials) | Implemented |
| Mark | `<Mark brand animate id replay?>` | `src/components/Mark.astro` | Brand moments | Implemented |
| Lumen | `<Lumen size id interactive?>` | `src/components/Lumen.astro` | Character moments | Implemented |
| Device | `<Device kind="phone|android|laptop|browser|plain">` | `src/components/Device.astro` | Every screenshot or recording | Implemented |
| Picture / Video | `<Pic name en zh sizes>`, `<Video name w h en zh>` | `src/components/` | All media | Implemented |
| Before/after | `<Compare before after en zh>` | `src/components/Compare.astro` | Redesign comparisons | Implemented |
| Pinned steps | `<Steps frame steps rotate?>` | `src/components/Steps.astro` | Interface walkthroughs | Implemented |
| Step flow | `<Flow steps accent>` | `src/components/Flow.astro` | Short process diagrams | Implemented |
| Project index | `<Index projects>` | `src/components/Index.astro` | The project collection | Implemented |
| Live demos | `<DemoMarkdown>`, `<DemoStream>`, `<DemoFailover>` | `src/components/demos/` | Interactive explanations | Implemented |
| Hand-off scene | `<Handoff>` | `src/components/Handoff.astro` | Cross-device flows | Implemented |
| Film frame | `<Film chapters>` | `src/components/Film.astro` | Long video with sound | Implemented |
| Notes reader | `<Notes>` | `src/components/Notes.astro` | Reading sections | Implemented |
| Light field | `<canvas data-field>` + static fallback | `src/scripts/fx/field.ts` | Hero only | Implemented |

Minimal examples:

```astro
<section class="section dark grain" aria-labelledby="x"><div class="wrap">
  <Head n="03" label={{ en: 'Play', zh: '试一试' }} id="x" en="Touch the real behaviour." zh="摸一摸真实的行为。" />
</div></section>
<a class="btn glass" data-spec href="#work"><T en="See the work" zh="看作品" /></a>
```

## 6. Copy and number formats

- Headlines are short declarative sentences ending with a full stop. One accent phrase at most. [SHOULD]
- Labels are mono uppercase: `01 / The problem`. Project numbers are two digits. [SHOULD]
- Roles are stated plainly and precisely; never "built from scratch" unless it is true. [MUST]
- Numbers: thousands separator in English ("1,267"), none in Chinese ("1267"); versions as `v0.10.4`; durations in seconds with two decimals at most. [SHOULD]
- Product, tech and character names stay in Latin script in both languages (Christian, Aogiri, Lumen, LynShen, Rust, …); the page sets `translate="no"`. Chinese copy is hand-written, not machine translated. [MUST]
- Demo data is labelled "sample" / "示例" inside each live demo. [MUST]

## 7. Anti-patterns

- A centred hero with a card grid as the default page structure. [MUST]
- Grids of equal cards for projects or notes. The work mosaic is unequal panels by design (§3.1). [MUST]
- Cards inside cards. [SHOULD]
- Decorative icon tiles or coloured icon backgrounds. [SHOULD]
- Font sizes, weights or colour literals outside the tokens and type classes. [SHOULD]
- Small low-contrast text (`--faint`) for primary information. [SHOULD]
- Pill labels for ordinary metadata; pills are only for status and filters. [SHOULD]
- Full-width backdrop blur, animated blur, or blur behind playing video. [MUST]
- Hover-only content: every hover reveal has a tap, focus or inline equivalent. [MUST]
- Motion that loops without meaning (bouncing arrows, spinning badges, marquee text). [SHOULD]
- Sales copy, prices, plans or business figures. [MUST]
- `[TODO]` placeholders in shipped pages. [SHOULD]

## 8. Implementation and integration

- Style entry points: `src/styles/tokens.css` (tokens, imported first), `src/styles/global.css` (base, type, focus, devices, media), `src/styles/materials.css` (content buttons, chips, tags, status, tabs), `src/components/glass/` (liquid glass: `liquid.ts` maps and filters, `morph.ts` lenses and nav theme, `glass.css` layers and nav, `LiquidGlass.astro`), `src/styles/home.css`, `src/styles/project.css`. Astro inlines them per page. [SHOULD]
- Fonts: `public/fonts/instrument-serif-latin-400{,-italic}.woff2`, declared in `tokens.css` with `font-display: optional` and preloaded in `src/layouts/Base.astro`. [SHOULD]
- Theme: per section via `.dark` / `.paper`; the document background is dark. There is no global theme switch. [SHOULD]
- Motion libraries (GSAP, ScrollTrigger, Lenis) and every effect module load with dynamic `import()` after first paint, only when motion is allowed. [MUST]
- Language switching swaps `<html lang>` between `en` and `zh-CN`; CSS hides the inactive language. [MUST]
