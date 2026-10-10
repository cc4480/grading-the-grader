import fs from 'node:fs';

// Same engine commit, same sites, ~35 minutes apart: how much of the finding list is stable?
// run 1 is read from its console log (names only); run 3 from its capture.
// usage: node stability.mjs <run1-console.log> <run3-raw.json>
const [log, rawFile] = process.argv.slice(2);
const norm = (n) => n.replace(/\d+/g, 'N');

const run1 = new Map();
let cur = null;
for (const l of fs.readFileSync(log, 'utf8').split(/\r?\n/)) {
  let m = /^=== (\S+) === (\d+) findings/.exec(l);
  if (m) { cur = new Set(); run1.set(m[1], cur); continue; }
  if (/^=== /.test(l)) { cur = null; continue; }
  m = /^\s+\[(CRITICAL|HIGH|MEDIUM|LOW|INFO)\s*\]\s+conf=\s*[\d-]+\s+(.*)$/.exec(l);
  if (m && cur) cur.add(`${m[1].toLowerCase()} ${norm(m[2].trim())}`);
}
const raw = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
let same = 0, differ = 0;
const lost = new Map(), gained = new Map();
const rows = [];
for (const r of raw.results) {
  if (r.failed || !run1.has(r.url)) continue;
  const a = run1.get(r.url);
  const b = new Set(r.findings.map((f) => `${f.severity} ${norm(f.name)}`));
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  if (!onlyA.length && !onlyB.length) { same++; continue; }
  differ++;
  rows.push(`${r.url.replace(/^https?:\/\//, '')}: -${onlyA.length} +${onlyB.length}${onlyA.length ? ' | only run1: ' + onlyA.map((x) => x.slice(0, 60)).join('; ') : ''}${onlyB.length ? ' | only run3: ' + onlyB.map((x) => x.slice(0, 60)).join('; ') : ''}`);
  for (const x of onlyA) lost.set(x.replace(/^\w+ /, ''), (lost.get(x.replace(/^\w+ /, '')) || 0) + 1);
  for (const x of onlyB) gained.set(x.replace(/^\w+ /, ''), (gained.get(x.replace(/^\w+ /, '')) || 0) + 1);
}
console.log(`sites in both runs: ${same + differ}; identical finding sets: ${same}; differing: ${differ}`);
console.log('\nfindings seen in run 1 only (by family):'); for (const [k, n] of [...lost].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(3), k);
console.log('\nfindings seen in run 3 only (by family):'); for (const [k, n] of [...gained].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(3), k);
console.log('\nper-site differences:'); for (const x of rows) console.log(x);
