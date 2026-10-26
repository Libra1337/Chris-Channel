// Refresh src/data/repos.json from GitHub with `gh` (run by hand; the build reads the JSON offline).
// Only metadata is stored. Descriptions on the site are written by hand in src/data/repos-copy.ts.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
// GitHub does not detect some LICENSE files; these were read from the repo's LICENSE.
const LICENSE_FALLBACK = { 'llm-provider-kit': 'Apache-2.0' };
const repos = ['Jm2api', 'accc-Libra', 'MD_reader', 'llm-provider-kit'];
const out = repos.map((r) => {
  const j = JSON.parse(execFileSync('gh', ['repo', 'view', `Libra1337/${r}`, '--json',
    'name,visibility,createdAt,pushedAt,licenseInfo,stargazerCount,repositoryTopics,url'], { encoding: 'utf8' }));
  const langs = JSON.parse(execFileSync('gh', ['api', `repos/Libra1337/${r}/languages`], { encoding: 'utf8' }));
  const pub = j.visibility === 'PUBLIC';
  return {
    name: j.name, visibility: j.visibility, created: j.createdAt.slice(0, 10), pushed: j.pushedAt.slice(0, 10),
    license: pub ? (j.licenseInfo?.spdxId ?? LICENSE_FALLBACK[j.name] ?? null) : null, stars: j.stargazerCount,
    topics: (j.repositoryTopics ?? []).map((t) => t.name), url: pub ? `https://github.com/Libra1337/${j.name}` : null, langs,
  };
});
writeFileSync(new URL('../src/data/repos.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(out.map((r) => `${r.name} ${r.visibility}`).join('\n'));
