// Copy and compress real UI screenshots into public/media/img as AVIF + WebP + PNG.
// Sources are read-only; the manifest below is the single list of images on the site.
// Usage: node scripts/images.mjs
// Sources from my iCloud Desktop are vendored into sources/ (scripts/sources.sh copies them; gitignored), so an
// evicted iCloud file can't break a rebuild. Every source is checked first: if any is missing the script stops before
// writing anything (no partial manifest, no half-rebuilt images).
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const H = homedir();
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/media/img');
const N = `${H}/lynshen-wt/aogiri-native-shots`;
const S = join(ROOT, 'sources');   // vendored copies of the iCloud Desktop files (scripts/sources.sh)
const T = `${S}/手机端方案/通透改版`;
const D = `${H}/Code/monoizeovo/docs/public/images/en`;
const U = `${H}/lynshen-wt/desk-ux-assets`;
const F = `${S}/宣传片分镜`;
mkdirSync(OUT, { recursive: true });

// name, source, widths, optional crop {left, top, width, height} in source pixels
const PHONE = [390, 780];
const list = [
  // Phone app (iOS simulator, demo data)
  ['p-today', `${T}/after-dark-today.png`, PHONE],
  ['p-today-before', `${T}/before-dark-today.png`, PHONE],
  ['p-chat', `${T}/after-dark-chat.png`, PHONE],
  ['p-chat-before', `${T}/before-dark-chat.png`, PHONE],
  ['p-computer', `${T}/after-dark-computer.png`, PHONE],
  ['p-computer-before', `${T}/before-dark-computer.png`, PHONE],
  ['p-profile', `${T}/after-dark-profile.png`, PHONE],
  ['p-ledger', `${T}/after-dark-ledger.png`, PHONE],
  ['p-session', `${T}/after-dark-session.png`, PHONE],
  ['p-sticky', `${N}/computer/m2-02-sticky-cards.png`, PHONE],
  ['p-plan', `${N}/computer/m2-04-plan-sheet.png`, PHONE],
  ['p-approval', `${N}/computer/m2-05-approval-card.png`, PHONE],
  ['p-risky', `${N}/computer/m2-07-approval-risky.png`, PHONE],
  ['p-alarm', `${N}/actions/a-03-alarm-ledger.png`, PHONE],
  ['p-calendar', `${N}/actions/a-05-calendar.png`, PHONE],
  ['p-agenda', `${N}/m2/d-04-today-agenda.png`, PHONE],
  ['p-shizuku', `${N}/shizuku/c-05-confirm-airplane.png`, PHONE],
  ['p-shizuku-ledger', `${N}/shizuku/c-07-ledger.png`, PHONE],
  // Usage card: mock data from the review build. Crop to the card only (no account row).
  ['p-usage', `${N}/usage/card-free-dark.png`, [480, 960], { left: 0, top: 540, width: 1206, height: 840 }],
  // Gateway console: docs-site screenshots (local build with demo data). Account chip cropped off.
  ['g-logs', `${D}/request-logs.webp`, [720, 1440, 2160], { left: 520, top: 0, width: 1700, height: 1560 }],
  ['g-playground', `${D}/playground-chat.webp`, [720, 1180], { left: 260, top: 0, width: 1180, height: 800 }],
  ['g-docs', `${ROOT}/.cache/docs/docs-streaming.png`, [720, 1440, 2160], { left: 0, top: 0, width: 2880, height: 1600 }],
  // Desktop app (demo data)
  ['d-queue', `${U}/queue/dark-1of3.png`, [884, 1768]],
  ['d-recap', `${U}/recap/after-dark-card.png`, [1008, 2016]],
  ['d-launch', `${H}/lynshen-wt/desk-brand-assets/brand/launch-dark.png`, [720, 1320]],
  ['d-signin', `${H}/lynshen-wt/desk-brand-assets/brand/first-run-dark.png`, [720, 1440]],
  ['d-code', `${ROOT}/.cache/frames/desk-code.png`, [720, 1440, 2160]],
  ['d-modes', `${ROOT}/.cache/frames/desk-modes.png`, [720, 1440, 2160]],
  ['d-approval', `${ROOT}/.cache/frames/desk-approval.png`, [720, 1440, 2160]],
  ['d-start', `${ROOT}/.cache/frames/desk-start.png`, [720, 1440]],
  // Zaji: the real reading page (the app's own engine and page, Chromium at 1180x820 @2x) on a scratch copy of the
  // project's samples/ folder (scripts/zaji-shots.mjs); iOS shots are the debug simulator build with its demo seed.
  ['pn-home', `${ROOT}/.cache/zaji/home-dark.png`, [720, 1440, 2360]],
  ['pn-home-light', `${ROOT}/.cache/zaji/home-light.png`, [720, 1440, 2360]],
  ['pn-md', `${ROOT}/.cache/zaji/md-dark.png`, [720, 1440, 2360]],
  ['pn-md-light', `${ROOT}/.cache/zaji/md-light.png`, [720, 1440, 2360]],
  ['pn-code', `${ROOT}/.cache/zaji/md-dark-code.png`, [720, 1440, 2360]],
  ['pn-pdf', `${ROOT}/.cache/zaji/pdf-dark.png`, [720, 1440, 2360]],
  ['pn-search', `${ROOT}/.cache/zaji/search-dark.png`, [720, 1440, 2360]],
  ['pn-aa', `${ROOT}/.cache/zaji/aa-dark.png`, [720, 1440, 2360]],
  ['pn-edit', `${ROOT}/.cache/zaji/edit-dark.png`, [720, 1440, 2360]],
  ['pn-ios-timeline', `${ROOT}/.cache/zaji/ios-timeline-dark.png`, PHONE],
  ['pn-ios-timeline-light', `${ROOT}/.cache/zaji/ios-timeline-light.png`, PHONE],
  ['pn-ios-style', `${ROOT}/.cache/zaji/ios-compose-dark.png`, PHONE],
  // 牵星 (English name Armil): phone screens of the app's own build (scripts/armil-shots.mjs; the chart engine runs in
  // the page) with a fictional sample profile (示例, 2000-03-21 09:30 北京); 390 @3x with a 50 pt band for the status bar.
  // Phone only: the app no longer has a web version.
  ['qx-today', `${ROOT}/.cache/armil/390-today.png`, PHONE],
  ['qx-reading', `${ROOT}/.cache/armil/390-bazi-reading.png`, PHONE],
  ['qx-bazi', `${ROOT}/.cache/armil/390-bazi.png`, PHONE],
  ['qx-ziwei', `${ROOT}/.cache/armil/390-ziwei.png`, PHONE],
  ['qx-chart', `${ROOT}/.cache/armil/390-astro-chart.png`, PHONE],
  ['qx-tarot', `${ROOT}/.cache/armil/390-tarot.png`, PHONE],
  // Brand
  // Brand sheet is 2400x3475; use two sections: the marks (top) and the platform icons.
  ['b-marks', `${S}/Logo方案/定稿/品牌规范.png`, [800, 1600], { left: 40, top: 220, width: 1480, height: 640 }],
  ['b-icons', `${S}/Logo方案/定稿/品牌规范.png`, [800, 1600], { left: 40, top: 2650, width: 2100, height: 500 }],
  ['b-film-01', `${F}/01 品牌开场.png`, [960, 1920]],
  ['b-film-04', `${F}/04 交给手机.png`, [960, 1920]],
  ['b-film-08', `${F}/08 收尾.png`, [960, 1920]],
];
// Ember launch burst on the phone: an image sequence scrubbed by scroll (small JPEG-quality WebP).
const burst = `${N}/welcome/ios-burst`;
for (let i = 0; i < 18; i++) {
  list.push([`seq/welcome-${String(i).padStart(2, '0')}`, `${burst}/dark-d-welcome-${String(i).padStart(2, '0')}.png`, [360], null, true]);
}

// Guard: every source must exist before anything is written.
const missing = [...new Set(list.map(([, src]) => src).filter((src) => !existsSync(src)))];
if (missing.length) {
  console.error(`images.mjs: ${missing.length} source file(s) missing; nothing written. Run scripts/sources.sh for sources/ files.`);
  for (const m of missing) console.error('  missing', m);
  process.exit(1);
}
const meta = {};
for (const [name, src, widths, crop, seqOnly] of list) {
  mkdirSync(dirname(join(OUT, name)), { recursive: true });
  let base = sharp(src);
  if (crop) base = base.extract(crop);
  const m = await base.clone().metadata();
  const w0 = crop ? crop.width : m.width, h0 = crop ? crop.height : m.height;
  meta[name] = { w: w0, h: h0, widths };
  for (const w of widths) {
    const p = join(OUT, `${name}-${w}`);
    if (existsSync(`${p}.webp`)) continue;
    const img = base.clone().resize({ width: Math.min(w, w0) });
    await img.clone().webp({ quality: 74, effort: 5 }).toFile(`${p}.webp`);
    if (!seqOnly) {
      await img.clone().avif({ quality: 50, effort: 4 }).toFile(`${p}.avif`);
      if (w === widths[0]) await img.clone().png({ palette: true, quality: 80, compressionLevel: 9 }).toFile(`${p}.png`);
    }
  }
}
writeFileSync(join(ROOT, 'src/data/images.json'), JSON.stringify(meta, null, 1));
console.log('images:', Object.keys(meta).length);
