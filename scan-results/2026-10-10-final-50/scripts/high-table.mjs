import fs from 'node:fs';

// HIGH findings by family, with how the live re-check came out.
// usage: node high-table.mjs <raw.json> <verification.json> [severity=high]
const [rawFile, verFile, sevArg] = process.argv.slice(2);
const SEV = sevArg || 'high';
const raw = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
const ver = JSON.parse(fs.readFileSync(verFile, 'utf8'));
const out = new Map();
for (const r of ver.records) out.set(`${r.site}||${r.name}`, r.outcome);
const fam = new Map();
for (const r of raw.results) {
  if (r.failed) continue;
  for (const f of r.findings) {
    if (f.severity !== SEV) continue;
    const key = f.name.replace(/\d+/g, 'N');
    const e = fam.get(key) || { n: 0, confirmed: 0, disagrees: 0, other: 0, sites: [] };
    e.n++;
    const o = out.get(`${r.url}||${f.name}`);
    if (o === 'confirmed') e.confirmed++;
    else if (o === 'disagrees') e.disagrees++;
    else e.other++;
    e.sites.push(r.url.replace(/^https?:\/\/(www\.)?/, ''));
    fam.set(key, e);
  }
}
console.log(`| ${SEV} finding | Count | Confirmed | Contradicted | Not re-derived |`);
console.log('|---|---:|---:|---:|---:|');
for (const [k, e] of [...fam.entries()].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`| ${k.replace(/\|/g, '\\|')} | ${e.n} | ${e.confirmed} | ${e.disagrees} | ${e.other} |`);
}
