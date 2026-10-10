// Summarise verify-secscan.mjs output as Markdown tables (stdout).
// usage: node summarize-verification.mjs <verification.json>
import fs from 'node:fs';

const [file] = process.argv.slice(2);
const v = JSON.parse(fs.readFileSync(file, 'utf8'));
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
const OUT = ['confirmed', 'disagrees', 'not-reproduced', 'refused', 'no-check'];

const checked = v.records.filter((r) => r.outcome !== 'no-check');
const c = Object.fromEntries(OUT.map((o) => [o, v.records.filter((r) => r.outcome === o).length]));
console.log(`sites ${v.summary.sites}; findings ${v.summary.claims}; with an independent check ${checked.length}`);
console.log(OUT.map((o) => `${o} ${c[o]}`).join('; '));
console.log(`re-fetch at ${v.summary.verifiedAt}; User-Agent ${v.summary.userAgent}`);

const refusedSites = v.siteInfo.filter((s) => s.refused || s.error);
if (refusedSites.length) {
  console.log('\nRe-fetch refused or failed (header claims for these were not re-derived):');
  for (const s of refusedSites) console.log(`- ${s.site}: ${s.error ? 'error ' + s.error : s.refused}`);
}

console.log('\n## By finding\n');
console.log('| Finding | Checked | Confirmed | Disagrees | Not reproduced | Refused |');
console.log('|---|---:|---:|---:|---:|---:|');
const fam = new Map();
for (const r of checked) {
  const e = fam.get(r.family) || Object.fromEntries(OUT.map((o) => [o, 0]));
  e[r.outcome]++;
  fam.set(r.family, e);
}
for (const [k, e] of [...fam.entries()].sort((a, b) => (b[1].confirmed + b[1].disagrees + b[1]['not-reproduced'] + b[1].refused) - (a[1].confirmed + a[1].disagrees + a[1]['not-reproduced'] + a[1].refused) || a[0].localeCompare(b[0]))) {
  const n = e.confirmed + e.disagrees + e['not-reproduced'] + e.refused;
  console.log(`| ${esc(k)} | ${n} | ${e.confirmed} | ${e.disagrees} | ${e['not-reproduced']} | ${e.refused} |`);
}

for (const o of ['disagrees', 'not-reproduced']) {
  const rows = v.records.filter((r) => r.outcome === o);
  if (!rows.length) continue;
  console.log(`\n## ${o}\n`);
  console.log('| Site | Severity | Finding | Detail |');
  console.log('|---|:--:|---|---|');
  for (const r of rows) console.log(`| ${esc(r.site.replace(/^https?:\/\//, ''))} | ${r.severity} | ${esc(r.name)} | ${esc(r.detail)} |`);
}

const nc = new Map();
for (const r of v.records.filter((x) => x.outcome === 'no-check')) nc.set(r.family, (nc.get(r.family) || 0) + 1);
if (nc.size) {
  console.log('\n## No independent check coded\n');
  console.log('| Finding | Count |');
  console.log('|---|---:|');
  for (const [k, n] of [...nc.entries()].sort((a, b) => b[1] - a[1])) console.log(`| ${esc(k)} | ${n} |`);
}
