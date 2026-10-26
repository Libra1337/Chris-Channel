// Liquid glass entry: refraction filters for every [data-lg] element (Chromium desktop), the morphing nav and
// language lenses, and the adaptive nav theme. Loaded from core.ts right after first paint.
import { init } from './liquid';
import { navLens, langLens, navTheme } from './morph';

export default function glass(o: { reduce: boolean; fine: boolean }) {
  init();
  const nav = document.querySelector<HTMLElement>('.nav');
  if (!nav) return;
  navTheme(nav);
  navLens(nav, o);
  langLens(nav, o);
}
