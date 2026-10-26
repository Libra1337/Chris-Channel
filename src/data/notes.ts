// Notes, parsed from content/notes.md at build time. Used by the /notes/ page and by the
// three titles on the home page.
import fs from 'node:fs';
import path from 'node:path';
const src = fs.readFileSync(path.resolve('content/notes.md'), 'utf-8');
export type N = { n: string; title: string; en: string; zh: string; optional: boolean };
export const notes: N[] = [];
for (const block of src.split(/^## /m).slice(1)) {
  const head = block.split('\n')[0].trim();
  const m = head.match(/^(\d+)\.\s*(.+)$/);
  if (!m) continue;
  const optional = /\(optional\)/i.test(m[2]);
  const title = m[2].replace(/\s*\(optional\)\s*/i, '').trim();
  const en = (block.match(/\*\*EN\.\*\*\s*([\s\S]*?)(?=\n\s*\*\*中文|\n##|$)/) || [])[1]?.trim() || '';
  const zh = (block.match(/\*\*中文\.\*\*\s*([\s\S]*?)(?=\n##|\n---|$)/) || [])[1]?.trim() || '';
  const curly = (t: string) => t.replace(/"([^"]*)"/g, '“$1”').replace(/(\w)'(\w)/g, '$1’$2');
  notes.push({ n: m[1].padStart(2, '0'), title: curly(title), en: curly(en), zh, optional });
}
// Chinese title: the first sentence of the Chinese text is not a title, so titles are hand-written here.
export const zhTitles: Record<string, string> = {
  '01': '「能用」和「好」，隔得很远。', '02': '诚实，本身就是一种功能。', '03': '多听一会儿，比你觉得需要的更久。',
  '04': '限制，是好点子的来处。', '05': '勇气，来自能退回去。', '06': '工具变了，责任没有变。',
};
