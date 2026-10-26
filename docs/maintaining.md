# Maintaining the site

A static, bilingual (English / 中文) personal site: a long-scroll home page and nine equal project
case studies. Person first, no sales copy. Live at https://persona.imlibra.org.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://127.0.0.1:4321 (preview entry `portfolio` in `.claude/launch.json`) |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serves `dist/` (entry `portfolio-dist`, port 4322) |
| `scripts/sources.sh` | Copies the source files that live on my iCloud Desktop into `sources/` (gitignored). Run once on a new clone, or after I change one |
| `npm run assets` | Rebuilds images (AVIF + WebP + PNG) from the original screenshots. Stops before writing if any source is missing |
| `scripts/media.sh` | Rebuilds video (H.264 + VP9 WebM + WebP posters). Runs inside the heavy-job lock; stops before encoding if any source is missing |
| `node scripts/repos.mjs` | Refreshes GitHub repo metadata with `gh` |
| `npm run verify` | Headless Chrome checks and screenshots into `预览/` (serve `dist/` first) |

`dist/` deploys to any static host. For a sub-path (GitHub Pages project site), build with
`SITE_BASE=/repo-name/ npm run build`.

## Stack and why

- **Astro 7** (static output). Every page is plain HTML and CSS at build time, with no framework runtime
  on the client. This keeps the mobile Lighthouse score high, which matters for heavy media pages.
- **GSAP ScrollTrigger** for pinned scenes, parallax, scroll-scrubbed video and image sequences,
  and the scroll-scrubbed text reveal. It is the most reliable tool for scrubbed timelines.
- **Lenis** for smooth scrolling, driven by the GSAP ticker so the two stay in sync.
- GSAP and Lenis load only when motion is allowed. With `prefers-reduced-motion: reduce` no motion
  library is loaded, nothing autoplays, and every scene becomes a static layout.
- I did not use Framer Motion: it needs React on the client, and the site needs no client components.

## Sections

Home (`src/pages/index.astro`):
1. Hero: the serif name, the logo mark assembling from light, and a WebGL light field that follows the pointer.
   The hero buttons are liquid glass over the field's lower streak.
2. Intro: who I am, in a few lines, and four areas of work.
3. Work: an interactive index of the nine projects. On a fine pointer a preview card follows the pointer and
   carries a glass “Open →” pill; titles morph into the project hero with View Transitions. Filters: All, Apps,
   Systems, Design.
4. Lab: three live demos: gateway failover (break an upstream, watch the breaker), a stream decoder replaying
   real SSE, and a Markdown reader that renders as you type.
5. Craft: the glass redesign before/after slider, Lumen (follows the pointer), the logo replay, and the film
   with chapters.
6. Notes: six short reflections, set as a calm reading column.
7. About: Chengdu, China; email (mailto and copy); GitHub.

Projects (`/projects/<slug>/`): `zaji` (old slugs `md-reader` and `pane` forward to it; see `moved` in `src/data/projects.ts`), `llm-provider-kit`, `jm2api`, `accc-libra`, `gateway`,
`aogiri-desktop`, `aogiri-phone`, `brand`, `armil` (牵星; old slugs `qianxing` and `lodestar` forward to it). Each states my role; Zaji and Armil add a "Website" / 「官网」 row (Armil's appears only when `ARMIL_SITE_LIVE` in `src/data/projects.ts` is `true`). Signature scenes: the phone page's
rotate-in scroll story and the glass before/after picker; the desktop page's desk-to-phone hand-off.

Materials: liquid glass (real refraction in Chromium, frosted elsewhere) on floating chrome only; content
chips, tags and tabs are hairlines. See design.md §materials.

## Accessibility and i18n

- Both languages are in the HTML. The toggle sets `<html lang>`, and CSS hides the other language.
  The choice is saved in `localStorage`; `?lang=zh` or `?lang=en` in the URL overrides it.
- Alt text and ARIA labels switch with the language.
- Skip link, visible focus rings, keyboard-operable sliders (arrow keys) and video pause buttons.
- Videos are muted, play inline, and load lazily. They play only while on screen.

## Content rules followed

- Only real UI with demo data. These parts are cropped out or left out:
  - the console account chip and balance cards;
  - model price lists. In the promo film the price column is blurred from 8.9 s to 12.4 s;
  - the wallet screens;
  - the usage card's account row (the usage card uses the review build's mock data).
- No revenue, users, customers, suppliers, hosts, keys, emails or usernames.
- Private repos (Jm2api, accc-Libra, Zaji, Armil) are described at a high level only, with no code or links. Old or internal
  project names never appear in visible text.
- Each project states my role. Shared work says so (lead developer, co-author, built on an
  open-source MIT core); the wording never claims sole authorship where others contributed.

## Checks and previews

- `npm run verify` (serve `dist/` on :4322 first; it is a heavy job, run it inside the mutex): 67 checks at
  1440 and 390 plus reduced motion, and screenshots `预览/检查-*.png`.
- `scripts/measure.sh <label>`: Lighthouse mobile, scroll fps, long tasks and JS weight. Results: `预览/性能.md`.
- `node scripts/record.mjs`: the demo films `预览/演示-首页.mp4` and `预览/演示-手机项目.mp4`.

## Asset sources (copied and compressed; originals untouched)

- Video: the promo film, phone recordings (tabs, welcome, translucent redesign; the first screen's phone clip is the
  dark capture), the desktop recordings used for the promo film, a dark re-take of the desktop scene for the first
  screen (same fixture and script, theme dark), the desktop launch recording, and the subagent and recap GIFs.
- Images: the translucent redesign before/after shots, native-app shots (computer remote, actions,
  Shizuku, agenda, usage card), docs-site screenshots, the brand sheet and promo key frames.
- Logos: the final logo geometry (redrawn inline as SVG), the lockup SVGs in `public/media/brand/`,
  and the Lumen ember geometry from the phone app.
