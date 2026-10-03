# Agent guide: Grading the Grader

Read this first. It tells an agent what this repo is, what is true right now, and the rules for changing it.

## What this repo is

SecScan (also written VibeScan, scanner repo `cc4480/vibescan-enterprise-build`) grades other people's apps from the
outside. This repo grades SecScan: the evidence that its findings are right, the research on rivals, and the plan for
improving it. It holds records and a runbook, not scanner code. Scanner code changes happen in the scanner repo.

Owner: Carlos (`cc4480`). Product docs and reports refer to Carlos by first name.

## Read in this order

1. `docs/STATUS.md` : what is done, in flight and blocked, with dates. Update it with every piece of work.
2. `docs/DECISIONS.md` : decisions made and decisions waiting on Carlos. Do not act on a pending one.
3. `docs/IMPROVEMENT-PLAN.md` : the 12 ranked improvements, each with "done looks like".
4. `docs/HEAD-TO-HEAD-RUNBOOK.md` : how to run the independent benchmark (improvement 1). This is the next real work.
5. `docs/FIELD-RESEARCH.md` : rivals, prices and claims, with sources and how far to trust each.
6. `artifacts/INDEX.md` : snapshots of the claude.ai reports (HTML). `docs/` and `scan-results/` hold the older audit record.

## Rules

- **Never edit a raw result.** A new run is a new dated file under `scan-results/` or `benchmark-runs/`. A correction is a
  new dated entry in `docs/FALSE-POSITIVE-AUDIT.md`. Names look like `YYYY-MM-DD-<what>`.
- **Mark how you know.** Use the reports' own marks: Verified (recomputed from raw output or read in a repo), Reran (you
  ran it), Reported (a document says so, not rerun), Researched (search or a vendor page), Inference (you reasoned it).
  A number with no mark is arithmetic on marked numbers.
- **Vendor claims stay vendor claims.** Write "X claims", with the source and date. A rival's price or accuracy figure
  needs a link and a date or it does not go in a report.
- **Never claim pentest, certified, compliant or false-positive-free** about SecScan. The product copy forbids it too.
- **Never publish a benchmark number without the raw output beside it** and the scoring script that produced it.
- **Seclayer is a separate product.** Its reports and research do not belong in this repo. Twelve Seclayer artifacts were
  deliberately kept out; if you find one here, move it and tell Carlos.
- **Do not run offensive traffic at anything the owner does not control.** `live-scan.ts --active` is allow-listed to
  the owner's domains and loopback on purpose. Run benchmarks against local containers only.
- **Do not open a pull request, merge or deploy** in the scanner repo unless Carlos says so in that session.
- Commit small and often, with a message that says what changed and why. This repo has no CI or branch protection as of
  2026-10-03 (direct pushes to `main` worked), so the discipline is yours.

## Where things live

| Thing | Where |
|---|---|
| Scanner code | `cc4480/vibescan-enterprise-build` |
| Work branch with unmerged changes | `claude/optimistic-gates-k81eq6` in the scanner repo (see `docs/STATUS.md` for the commit) |
| Existing cross-scanner benchmark | scanner repo `artifacts/api-server/scripts/benchmark/` (copy in `benchmark/` here) |
| Test target with known faults | scanner repo `artifacts/vuln-fixture` |
| Prices and plans in code | scanner repo `artifacts/api-server/src/lib/plans.ts`, `stripe.ts` |
| The claude.ai reports | `artifacts/*.html`, each with a live link in `artifacts/INDEX.md` |

## Environment notes (learned in a restricted cloud sandbox, which Carlos's PC is not)

- The cloud sandbox blocked most vendor sites, GitHub release downloads and the GitHub container registry. On Carlos's PC
  none of that applies, so do not copy the workarounds below unless you hit the same wall.
- In the sandbox Docker needed `dockerd` started by hand. Pulling ZAP worked from Docker Hub as `zaproxy/zap-stable`.
  Nuclei started but could not download its templates, because the sandbox could not reach `nuclei-templates` on GitHub.
- A container does not trust a corporate or sandbox proxy certificate by default. Mount the CA bundle and set
  `SSL_CERT_FILE`. Never turn TLS verification off.
- Four tests in `browserGuard.test.ts` fail in that sandbox on an untouched checkout. They are expected to pass in CI with
  Chromium installed.
