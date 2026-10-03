# Grading the Grader

SecScan (VibeScan) grades other people's apps. This repository grades SecScan:
a running record of every scan, fix, test, audit and benchmark used to check
that the grader is right, and to show when it was wrong.

Source of truth for the scanner itself: `cc4480/vibescan-enterprise-build`.
This repo holds the evidence, not the code.

## Layout

| Path | What it holds |
|---|---|
| `docs/FALSE-POSITIVE-AUDIT.md` | Hand-checked findings: what the scanner got wrong, dated |
| `docs/RETEST.md` | Re-tests after fixes |
| `docs/SCAN-RESULTS.md` | Scores and grades returned for each run |
| `docs/CHANGELOG.md` | What shipped and why it mattered |
| `docs/SCAN_TESTS.md`, `SCAN_COVERAGE.md`, `SCAN_CHECKS.md` | What the scanner tests, covers and checks |
| `scan-results/` | Raw scan output, one file or folder per run, named `YYYY-MM-DD-<name>` |
| `benchmark/` | Cross-scanner benchmark (ZAP, Nuclei, SecScan) against a known-faults target |

## Updating

Raw results are never edited after the fact. A new run gets a new dated file;
a correction gets a new dated entry in the audit. To pull the latest from the
scanner repo:

```bash
./sync.sh /path/to/VibeScan-Enterprise-Build
git add -A && git commit -m "Sync: <what changed>" && git push
```
