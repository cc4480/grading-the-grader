import fs from "node:fs";
// Compare two live-scan.ts captures of the same URL list, per site: what was scanned, how it ended, and which findings differ.
// usage: node compare-captures.mjs <old.json> <new.json>
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, "utf8")).results);
const sev = ["critical", "high", "medium", "low", "info"];
const key = (f) => `${f.severity}|${f.name}`;
const summary = (r) => {
  if (r.failed) return { failed: true, err: String(r.error ?? "").slice(0, 80) };
  const counts = Object.fromEntries(sev.map((s) => [s, (r.findings ?? []).filter((f) => f.severity === s).length]));
  return { grade: r.grade ?? r.report?.grade, status: r.statusCode, rendered: r.renderedWithBrowser, pages: r.pagesScanned, counts, keys: new Set((r.findings ?? []).map(key)) };
};
let same = 0, changed = 0;
const out = [];
const tot = { oldRender: 0, newRender: 0, onlyOld: 0, onlyNew: 0 };
for (let i = 0; i < a.length; i++) {
  const x = a[i], y = b[i];
  if (x.url !== y.url) { out.push(`!! URL mismatch at ${i}: ${x.url} vs ${y.url}`); continue; }
  const sx = summary(x), sy = summary(y);
  if (sx.rendered) tot.oldRender++;
  if (sy.rendered) tot.newRender++;
  if (sx.failed || sy.failed) { out.push(`${x.url}: old ${sx.failed ? "FAILED " + sx.err : "ok"} | new ${sy.failed ? "FAILED " + sy.err : "ok"}`); continue; }
  const onlyOld = [...sx.keys].filter((k) => !sy.keys.has(k)).sort();
  const onlyNew = [...sy.keys].filter((k) => !sx.keys.has(k)).sort();
  tot.onlyOld += onlyOld.length; tot.onlyNew += onlyNew.length;
  const meta = [];
  if (sx.grade !== sy.grade) meta.push(`grade ${sx.grade}→${sy.grade}`);
  if (sx.status !== sy.status) meta.push(`status ${sx.status}→${sy.status}`);
  if (sx.rendered !== sy.rendered) meta.push(`rendered ${sx.rendered}→${sy.rendered}`);
  if (onlyOld.length || onlyNew.length || meta.length) {
    changed++;
    out.push(`${x.url}  ${meta.join(", ")}\n` + onlyOld.map((k) => `   - ${k}`).join("\n") + (onlyOld.length ? "\n" : "") + onlyNew.map((k) => `   + ${k}`).join("\n"));
  } else same++;
}
console.log(`sites: ${a.length}; identical finding sets, grade and status: ${same}; differing: ${changed}`);
console.log(`rendered with browser: old ${tot.oldRender}, new ${tot.newRender}; finding keys only in old ${tot.onlyOld}, only in new ${tot.onlyNew}`);
console.log(out.join("\n"));
