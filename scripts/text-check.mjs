// Built-HTML check: no old or internal names in visible text or alt/aria/title, and no CJK in
// English strings (data-l="en" spans, data-alt-en, data-aria-en). Usage: node scripts/text-check.mjs [distDir]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2] || 'dist';
const banned = /Pane(?![a-z])|Qianxing|QIANXING|Lodestar|LODESTAR|MD_reader|林光|星枢|XINGSHU|Xingshu/;
const cjk = /[　-〿㐀-鿿＀-￯]/;
const files = []; const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); }); walk(dir);
let bad = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  // Visible text and attribute values people can read; scripts, styles and comments removed.
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const text = body.replace(/<[^>]+>/g, ' ');
  const attrs = [...body.matchAll(/\b(alt|title|aria-label|data-alt-en|data-alt-zh|data-aria-en|data-aria-zh|content|placeholder)="([^"]*)"/g)].map((m) => m[2]);
  for (const s of [text, ...attrs]) { const m = s.match(banned); if (m) { bad++; console.log('NAME', f, JSON.stringify(s.slice(Math.max(0, m.index - 40), m.index + 40))); } }
  const en = [...body.matchAll(/<(?:span|p|div)[^>]*data-l="en"[^>]*>([\s\S]*?)<\/(?:span|p|div)>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''))
    .concat([...body.matchAll(/data-(?:alt|aria)-en="([^"]*)"/g)].map((m) => m[1]));
  for (const s of en) if (cjk.test(s)) { bad++; console.log('CJK-IN-EN', f, JSON.stringify(s.slice(0, 90))); }
}
console.log(`${files.length} pages · ${bad ? bad + ' problems' : 'clean'}`);
process.exit(bad ? 1 : 0);
