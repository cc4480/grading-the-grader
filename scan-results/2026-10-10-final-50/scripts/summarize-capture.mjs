// Summarise a live-scan.ts --json capture as Markdown tables (stdout).
// usage: node summarize-capture.mjs <capture.json>
import fs from 'node:fs';

const [file] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const SEV = ['critical', 'high', 'medium', 'low', 'info'];
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
const host = (u) => new URL(u).hostname.replace(/^www\./, '');

const ok = data.results.filter((r) => !r.failed);
const failed = data.results.filter((r) => r.failed);
const challenged = ok.filter((r) => r.findings.some((f) => /intercepted by a bot-protection challenge/i.test(f.name)));
const sev = Object.fromEntries(SEV.map((s) => [s, 0]));
for (const r of ok) for (const f of r.findings) sev[f.severity] = (sev[f.severity] || 0) + 1;
const total = SEV.reduce((n, s) => n + sev[s], 0);
const actionable = total - sev.info;
const rendered = ok.filter((r) => r.renderedWithBrowser).length;
const elapsed = ok.reduce((n, r) => n + (r.elapsedMs || 0), 0);

console.log(`scannedAt (file written): ${data.scannedAt}`);
console.log(`sites attempted ${data.results.length}; completed ${ok.length}; failed ${failed.length}; bot-challenge notice ${challenged.length}; rendered with browser ${rendered}`);
console.log(`findings ${total}; actionable (above info) ${actionable}; ` + SEV.map((s) => `${s} ${sev[s]}`).join(', '));
console.log(`sum of per-site scan time ${(elapsed / 1000).toFixed(0)}s; mean ${(elapsed / ok.length / 1000).toFixed(1)}s per site`);
if (failed.length) { console.log('\nFAILED:'); for (const r of failed) console.log(`- ${r.url}: ${r.failed}`); }
if (challenged.length) { console.log('\nCHALLENGED (scanner withheld header findings):'); for (const r of challenged) console.log(`- ${r.url} (HTTP ${r.statusCode}, server ${r.server}, findings ${r.findings.length})`); }

console.log('\n## Every site\n');
// live-scan.ts does not produce a TLS grade; leave the column out when no site has one.
const showTls = ok.some((r) => r.tlsGrade);
console.log(`| Site | HTTP | Server |${showTls ? ' TLS |' : ''} Findings | Actionable | High | Medium | Low | Info |`);
console.log(`|---|---:|---|${showTls ? ':--:|' : ''}---:|---:|---:|---:|---:|---:|`);
for (const r of [...ok].sort((a, b) => host(a.url).localeCompare(host(b.url)))) {
  const c = Object.fromEntries(SEV.map((s) => [s, r.findings.filter((f) => f.severity === s).length]));
  const mark = challenged.includes(r) ? ' (challenge)' : '';
  console.log(`| ${host(r.url)}${mark} | ${r.statusCode ?? ''} | ${esc(r.server ?? '')} |${showTls ? ` ${r.tlsGrade ?? ''} |` : ''} ${r.findings.length} | ${r.findings.length - c.info} | ${c.high + c.critical} | ${c.medium} | ${c.low} | ${c.info} |`);
}

console.log('\n## Most common findings\n');
console.log('| Finding | Severity | Sites |');
console.log('|---|:--:|---:|');
const fam = new Map();
for (const r of ok) {
  const seen = new Set();
  for (const f of r.findings) {
    const key = f.name.replace(/\d+/g, 'N');
    if (seen.has(key)) continue;
    seen.add(key);
    const e = fam.get(key) || { sev: new Map(), n: 0 };
    e.n++;
    e.sev.set(f.severity, (e.sev.get(f.severity) || 0) + 1);
    fam.set(key, e);
  }
}
for (const [k, e] of [...fam.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))) {
  const s = [...e.sev.entries()].sort((a, b) => b[1] - a[1]).map(([x, n]) => (e.sev.size > 1 ? `${x} ${n}` : x)).join(', ');
  console.log(`| ${esc(k)} | ${s} | ${e.n} |`);
}
