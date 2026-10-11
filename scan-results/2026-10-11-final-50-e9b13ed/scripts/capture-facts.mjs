import fs from "node:fs";
const f = process.argv[2];
const j = JSON.parse(fs.readFileSync(f, "utf8"));
const r = j.results;
const grades = {};
for (const x of r) { const g = x.failed ? "failed" : (x.grade ?? x.report?.grade ?? "?"); grades[g] = (grades[g] ?? 0) + 1; }
const sev = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
for (const x of r) for (const fi of x.findings ?? []) sev[fi.severity] = (sev[fi.severity] ?? 0) + 1;
console.log(f.split("/").slice(-2).join("/"), "scannedAt", j.scannedAt);
console.log("grades", JSON.stringify(grades));
console.log("findings", JSON.stringify(sev), "total", Object.values(sev).reduce((a, b) => a + b, 0));
console.log("rendered", r.filter((x) => x.renderedWithBrowser).length, "failed", r.filter((x) => x.failed).map((x) => `${x.url}: ${String(x.error ?? x.reason ?? "").slice(0, 100)}`));
console.log("keys of a failed entry:", Object.keys(r.find((x) => x.failed) ?? {}));
