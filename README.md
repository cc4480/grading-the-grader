# Grading the Grader

SecScan (VibeScan) grades other people's apps. This repository grades SecScan:
a running record of every scan, fix, test, audit and benchmark used to check
that the grader is right, and to show when it was wrong.

Source of truth for the scanner itself: `cc4480/vibescan-enterprise-build`.
This repo holds the evidence, not the code.

## Start here

Agents and people: read [`AGENTS.md`](AGENTS.md), then [`docs/STATUS.md`](docs/STATUS.md).

## Layout

| Path | What it holds |
|---|---|
| `AGENTS.md` | Orientation and rules for any agent working in this repo |
| `docs/STATUS.md` | Living log: done, in flight, blocked, not done |
| `docs/DECISIONS.md` | Decisions made, and decisions waiting on Carlos |
| `docs/IMPROVEMENT-PLAN.md` | The 12 ranked improvements for SecScan |
| `docs/HEAD-TO-HEAD-RUNBOOK.md` | How to run the independent benchmark (improvement 1) |
| `docs/FIELD-RESEARCH.md` | Rivals, prices and claims, with sources and caveats |
| `docs/FALSE-POSITIVE-AUDIT.md`, `RETEST.md`, `SCAN-RESULTS.md` | Hand-checked findings, retests and scores |
| `docs/CHANGELOG.md`, `SCAN_TESTS.md`, `SCAN_COVERAGE.md`, `SCAN_CHECKS.md` | What shipped, and what the scanner tests, covers and checks |
| `artifacts/` | Snapshots of the claude.ai reports (HTML); see `artifacts/INDEX.md` |
| `scan-results/` | Raw scan output, one file or folder per run, named `YYYY-MM-DD-<name>`; a sweep's URL list sits beside it as `.txt` |
| `benchmark/` | The existing cross-scanner benchmark (copy from the scanner repo) |
| `benchmark-runs/` | Raw output of new benchmark runs, one dated folder each |

## Updating

Raw results are never edited after the fact. A new run gets a new dated file;
a correction gets a new dated entry in the audit. To pull the latest from the
scanner repo:

```bash
./sync.sh /path/to/VibeScan-Enterprise-Build
git add -A && git commit -m "Sync: <what changed>" && git push
```
