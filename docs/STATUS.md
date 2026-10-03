# Status

Living log. Newest first. Update it with every piece of work: what changed, how you know, what is still open.

## 2026-10-03: pricing and About pages are live (merged and redeployed by Carlos)

Carlos merged-and-redeployed, and reported "redeploy successful" for each. Not checked on the live sites from the cloud
sandbox (outbound to secscan.us is blocked there), so the live look is **Reported**, not Verified.

- **Scanner repo `master` = `fd8d9a7`.** One plan, SecScan Unlimited, $19 a month, 5 watched sites, unlimited scans (fair use);
  free tier unchanged; Starter, Pro and credit packs withdrawn (commit `47e0ff5`). App About page rewritten in the third
  person, with a "What it does today" section, a "Depth is never for sale" promise and links to the test record (`fd8d9a7`).
- **`secscan-info` `main` = `ecedb05`.** `/monitoring`, `/developers` and `/ai-editors` no longer name Starter, Pro or plan scans
  (`27020f4`); the About page got the same third-person rewrite (`ecedb05`). No pronouns for Carlos on either page: none were given.
- **Still open.** (1) The terms edits need a read. (2) Cost per scan is unmeasured. (3) Run `scripts/grandfather-monitor-users.ts
  --apply` before setting `MONITORING_REQUIRES_PLAN`. (4) The two About pages carry the same text and will drift; consider
  making one a short page that links to the other. (5) Payments are still off (no `STRIPE_SECRET_KEY`).

## 2026-10-03: pricing changed to one unlimited plan (built, tested, NOT merged or deployed)

Decision 3 in `docs/DECISIONS.md`, decided by Carlos ("go ahead with those numbers"): one paid plan, **SecScan Unlimited,
$19 a month, unlimited scans, 5 watched sites**. Free tier unchanged. Starter, Pro and the credit packs are withdrawn.
Scanner repo, branch `claude/optimistic-gates-k81eq6`, one commit after the merge (`git log` there). Master and Railway
still run the previous pricing until this is merged and redeployed.

- **What changed.** `plans.ts` has the plan, with Starter and Pro kept as known, unsold plans. A live unlimited plan pays for
  every scan and never spends the free scans. A refund on it is a no-op. The subscription endpoint refuses a plan that is
  not on sale. Packs leave sale through `PACKS_ON_SALE` (empty); `CREDITS_MAP` stays as the grant table so an old paid
  checkout is still credited. No migration. Pricing page, settings, structured data, `llms.txt`, README, terms, the
  payments-live email, MCP and API text and the go-live checklist were updated.
- **How it was checked (Reran).** Typecheck; API suite against a real Postgres, 2,798 passed and 4 failed (the
  `browserGuard` tests, which fail in the cloud sandbox on any checkout); front end 181 passed; both builds; the pricing page
  rendered in a browser against a stubbed API, payments off and on, desktop and phone. Two deliberate breaks of the new
  billing code were each caught by three database tests.
- **Needs a human.** (1) **Terms of service**: the Payment and Subscriptions sections were edited to describe the one plan
  and fair use. They need Carlos's read, and a lawyer's if one is used. The "last updated" date moved to Oct 3, 2026.
  (2) **The public docs site `secscan.info`** is a separate repo (`~/secscan-info`) and still names Starter, Pro and credit
  packs, e.g. `/monitoring`. (3) **Cost per scan** is still unmeasured; measure one real scan before turning payments on.
- **Behavior to know.** The 5-site limit and the free-site limit apply when someone adds a monitor. Existing monitors keep
  running after `MONITORING_REQUIRES_PLAN` is set (weekly floor for accounts with no plan). The go-live doc now says so.
- **Not seen.** The live app after deploy; the Stripe checkout and webhook with the new plan (payments are off).

## 2026-10-03: merged to master

At Carlos's instruction ("merge to master") the scanner repo work branch was fast-forwarded into `master` at `10bd9b7`, no
pull request. It contains the free-tier change (`b6d1e08`), the report verification banner (`e1cd56e`) and a merge of master
(PR 20). On the merged tree: typecheck clean, front-end suite 174 passed, API suite 2,669 passed and 4 failed (the
`browserGuard` tests, which fail in the cloud sandbox on any checkout).

- **CI on the merge** ([run 272](https://github.com/cc4480/VibeScan-Enterprise-Build/actions/runs/37105169681)): all three jobs passed,
  including typecheck, the full test step, the **database tests against real Postgres** (which could not be run in the cloud
  sandbox), the check index, the fixture gate, the build, and both Docker images. Verified.
- **Deploy.** Carlos redeployed from `master` on Railway and reported it successful (Reported). The cloud session had no
  Railway access and could not reach secscan.us, so nothing after the deploy has been seen by an agent: the post-deploy checks
  below are still open.
- **Migration.** `0025` (table `report_badges`) applies itself on boot of both services.
- **Dormant.** The free watched site only applies when `MONITORING_REQUIRES_PLAN=true`. Do not set it before running
  `scripts/grandfather-monitor-users.ts --apply`.
- **Live on deploy.** The badge endpoints, the pricing and `llms.txt` copy, the verify banner on owners' reports.
- **To check after deploy (open).** `GET /api/healthz`; a report for an unverified site shows the banner; a report for a verified
  site does not; Report, Share, "Get badge" gives an image that loads from another origin; the pricing page lists the free perks.

## 2026-10-03: report layout change (first of the free-scanner follow-ups)

Decision 10(a) in `docs/DECISIONS.md`, built at Carlos's request. Scanner repo, same unmerged branch
`claude/optimistic-gates-k81eq6`, second commit after `b6d1e08` (see `git log` there).

- **What changed.** A banner directly under the report cover, owner's view only: "N of M tests are waiting on domain
  verification", the first few test names it would unlock, and a "Verify <host>" button to `/domains?domain=<host>`.
  Renders nothing when no test was skipped for that reason. The public share page does not show it. The `/domains` page
  fills the domain in from `?domain=`.
- **Why.** A scan of an unverified URL skips about half the tests. The report said so only in the coverage card, in the
  sidebar, which on a phone sits below every finding, and it never said how to fix it.
- **How it was checked.** Typecheck clean, front-end suite 173 passed, build passes, and the banner rendered with the real
  stylesheet at desktop and phone width (Reran). A server test pins the ledger text the banner matches on.
- **Not checked.** The live report page and the verify flow end to end; the banner's effect on conversion.
- **Not changed.** The coverage card, the print and PDF report and the Markdown copy are untouched.

## 2026-10-03: free scanners research

Carlos asked to look at the free scanners and what they have. Done: `docs/FREE-SCANNERS.md` (Researched, search summaries only).
Main finding: SecScan's free tier unlocks every finding and fix, which is rare, but 17 of 41 tests need a verified domain, so a
first scan of an unverified URL skips about half the checks while rivals show Supabase and Firebase results at once. New
pending decision 10 in `docs/DECISIONS.md`. Nothing built from it yet.

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
