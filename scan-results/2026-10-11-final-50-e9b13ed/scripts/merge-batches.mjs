import fs from 'node:fs';

// Concatenate live-scan.ts batch captures into one capture of the same shape ({scannedAt, results}),
// leaving every result object untouched, and check it against the URL list.
// usage: node merge-batches.mjs <batch-dir> <out.json> <url-list>
const [dir, out, listFile] = process.argv.slice(2);
const files = fs.readdirSync(dir)
  .filter((f) => /^batch-\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
const results = [];
let scannedAt = null;
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  if (!scannedAt) scannedAt = j.scannedAt;
  results.push(...j.results);
  console.log(`${f}: ${j.results.length} results, file written ${j.scannedAt}`);
}
fs.writeFileSync(out, JSON.stringify({ scannedAt, results }, null, 1));

const want = fs.readFileSync(listFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const got = results.map((r) => r.url);
console.log(`merged ${results.length} results; list has ${want.length} URLs`);
console.log(`same URLs in the same order as the list: ${JSON.stringify(got) === JSON.stringify(want)}`);
console.log(`duplicates: ${got.length - new Set(got).size}; failed entries: ${results.filter((r) => r.failed).length}`);
