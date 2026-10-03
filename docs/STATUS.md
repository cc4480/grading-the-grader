# Status

Living log. Newest first. Update it with every piece of work: what changed, how you know, what is still open.

## 2026-10-03: first session

### Done

| What | Mark | Where |
|---|---|---|
| Repo `cc4480/grading-the-grader` created, private | Verified | this repo |
| Audit record imported: false-positive audit, retest, scan results, changelog, scan tests/coverage/checks, all dated raw scans, the benchmark folder | Verified | `docs/`, `scan-results/`, `benchmark/` |
| 17 claude.ai reports snapshotted as HTML with an index | Verified | `artifacts/` |
| Competitor research on 22 companies and tools named in those reports | Researched | `docs/FIELD-RESEARCH.md`, `artifacts/secscan-against-the-field.html` |
| Ranked plan of 12 improvements | Inference | `docs/IMPROVEMENT-PLAN.md`, `artifacts/secscan-improvement-plan.html` |
| Free-tier changes built, tested and pushed in the scanner repo | Reran (tests) | scanner repo, branch `claude/optimistic-gates-k81eq6`, commit `b6d1e08`, no PR |
| Docker confirmed to run in the cloud sandbox with Juice Shop, ZAP and Nuclei images pulled | Reran | see `AGENTS.md` environment notes |

### The free-tier change (scanner repo `b6d1e08`, unmerged, undeployed)

Built after Carlos approved "one free watched site, a grade badge, advertise what is free".

- **One free watched site.** When `MONITORING_REQUIRES_PLAN=true`, an account with no billing row may watch
  `FREE_MONITOR_SITES` sites (default 1; 0 turns it off). Rescans of that site are no more often than weekly. A free account
  at its limit is shown the plans. Cancelled or paused rows do not get it. Until the flag flips, nothing about monitoring
  changes: it is free and unlimited today.
- **Grade badge.** `GET /api/badge/:token.svg` shows the grade and scan date only, goes grey after 30 days, and has its own
  revocable token (a share token opens the whole report and must never be pasted into a README). Owner endpoints
  `POST` and `DELETE /api/reports/:id/badge`; a "Get badge" section in the share dialog.
- **Free perks listed** on the pricing page, `llms.txt` and the README.
- **New database table** `report_badges` (migration `0025_steady_zombie.sql`). It must run before the badge is used.
- **Go-live checklist** (`deploy/PAYMENTS-GO-LIVE.md`) gained the free-site and badge checks. The grandfather script
  `scripts/grandfather-monitor-users.ts --apply` must run before the flag flips.

How it was checked: typecheck clean, the front-end suite 160 passed, the API suite 2,656 passed and 4 failed (the
`browserGuard` tests, which fail identically on an untouched checkout in the sandbox), the API and front-end builds pass.
Not checked: the Postgres integration tests (no database in the sandbox), the share dialog in a browser, and the badge
loading from another origin on a deployed host.

Known behaviors: a CVE-triggered follow-up can still pull a free site's rescan earlier than weekly. A badge is a snapshot
of one report and does not follow the site's latest scan.

### In flight

- Nothing is running. The next real work is improvement 1, the independent head-to-head
  (`docs/HEAD-TO-HEAD-RUNBOOK.md`).

### Blocked or waiting on Carlos

See `docs/DECISIONS.md`. In short: pricing and allowance shape, code-side positioning, whether to build the vibe-stack
target set, whether to publish a result whatever it is, outbound access for the 30-site sweep.

### Not done

- Free scheduled rescans still get the AI-written analysis. Switching them to the built-in template needs real cost per
  scan, which was not measurable in the sandbox.
- Per-platform free-scan landing pages ("Is my Lovable app secure?" and so on). Content work, not started.
- The 12 Seclayer artifacts were staged only in a cloud scratchpad and are not stored anywhere in this repo. Re-list them
  from the Artifact tool (titles contain "Seclayer") if they are needed. They belong in their own repository.

### Open questions from the first session

1. May the public `nuclei-templates` repo be attached to a cloud session so Nuclei can load templates there? (Not needed on
   Carlos's PC.)
2. Is Carlos's machine Windows with PowerShell? The scanner repo already has `run-local.ps1`.
