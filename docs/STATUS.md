# Status

Living log. Newest first. Update it with every piece of work: what changed, how you know, what is still open.

## 2026-10-12 (later): GitHub repo scan run on the owner's public repos; one release branch built; nothing merged or deployed

- **Reran:** the new whole-repo scan (branch `feat/github-repo-scan`) on the 14 of the owner's public repos that have code,
  unauthenticated, then every finding checked against the source or OSV. The planted-secret fixture matched its README answer
  key exactly (3 reported, 3 ignored files ignored). The dependency CVEs checked (6 of 15) matched real OSV advisories.
- **Found and fixed (decisions 19 and 20):** one placeholder reported as a secret, one variable name in prose reported as a
  client-exposed secret, three deliberate TLS probes shown as medium, and a Python repo (165 files, none read) that said
  "scanned" with no note. Each has a test and a clean twin.
- **Decided (decision 18):** a scan that starts on an error page gets grade `N/A`, not a letter.
- **Built:** `release/ready-2026-10-12` on the scanner repo = master `448d4c5` plus the bundle-aware checks, HSTS and
  error-page fixes and the repo scan, one import conflict resolved, then the decisions above. Full suite 3083 pass, 4 + 1
  fail (`browserGuard` x4, `tlsCheck`: no Chromium or openssl on this PC; the same fail on unmodified master). Server bundle
  builds. Not merged, not deployed.
- **Not tested on a real repository:** the Supabase-migration and CI checks (none of the 14 repos has them; unit tests only).
- **Not built:** the product side of private repos (account-to-installation table, install callback, repo picker, job
  plumbing) and the GitHub App itself, which the owner has to register.
- **Open:** live tests with the owner's accounts, starting with secscan.us.

## 2026-10-12: fix branches pushed (no PRs), validator fix, Seclayer scored

Carlos asked for commit and push, no PRs. Pushed as branches only: SecScan `fix/bundle-aware-supabase-checks` (7 commits) and `fix/hsts-and-error-pages` (2), Seclayer `fix/supabase-bundle-and-keys` (2). Nothing merged or deployed; production is still SecScan `e9b13ed`, Seclayer `f0ac6e3`. Since the entry below: the squarespace.com false positive is fixed (a secret pattern's validator now sees the text before the match); the posthog.com AI-provider finding stays unverified (script returns 403). Seclayer against the lab target (record stays in the target repo): 2 to 5 of 10, clean twin clean, after adding first-party script capture. Still open: TanStack Start and AI-feature targets; the error-start grade judgement call.

## 2026-10-11 (later): SecScan fixes for decisions 13 to 17 written on local branches; nothing pushed, merged or deployed

Carlos asked for decisions 15 to 17 fixed on a branch (with tests, in a separate copy), 13 and 14 fixed, and the final 50 re-run on the live commit (that part is in the entry below). Done in clones outside the shared checkout: `C:UsersCho-zenworksecscan-fixes` (branch `fix/bundle-aware-supabase-checks`, 5 commits on master `e9b13ed`, head `220a4de`) and the worktree `secscan-fixes-b` (branch `fix/hsts-and-error-pages`, 2 commits, head `c0f9ea0`). The lab target's record: `lovable-style-target/RESULTS-2026-10-11-secscan-fixes.md`.

- **15 to 17 (Reran, Verified).** Against the same Lovable-style target, scored with the unchanged pre-registered map: **7 of 10 in-scope faults as built (was 2 of 10)**, 7 of 10 with the config in the HTML (was 5), and **no medium-or-higher finding on the clean twin** in either variant (was a CRITICAL and a MEDIUM). F07, F08 and F10 stay missed: there is no check for them. The fixes were written after seeing this target, so it is no longer a held-out test of them.
- **13, 14 (Reran).** HSTS: the redirect fallback and the 40-name hardcoded set are gone; of those 40, 23 are not on Chromium's own list (fetched 2026-10-11). 14: a bare 406/400/451 joins 403/429/503 as a refusal (elastic.co's 20-byte "406 Not Acceptable" reproduced with curl); other error pages' first-response findings are information. Judgement call for Carlos: such a scan can show a good grade although nothing about the app was assessed.
- **A defect found on the way.** The JWT regexes took time growing with the square of the input on repeated `eyJ` (80 KB 6.7 s): on the page of every scan, in the secret scan, in the service_role search. Fixed on the branch, with hostile-input tests. It matters before any merge of a cap change, and independently of it.
- **False positives from reading whole bundles on the 50 real sites** (`scan-results/2026-10-11-final-50-fixbranch/`): one known false positive (squarespace.com "Internal IP Address Exposed", an `example:` value in Sentry metadata) and one unverified (posthog.com AI provider). Not fixed on the branch.
- **Tests.** SecScan branch: whole suite passes except `browserGuard` (4) and `tlsCheck` (1), which fail the same way on unmodified master here (no matching Chromium; openssl). Worktree branch: same two.
- **Not done:** Seclayer's fixes are committed in its own clone but not run against the lab target (no score); the TanStack Start and AI-feature targets are not built; decisions 13 to 17 in `DECISIONS.md` are not updated; the validator fix for the false positive above; nothing pushed, no PR, so nothing merged or deployed. Seclayer material stays out of this repo.

## 2026-10-11: held-out final 50 repeated on the commit that is live (`e9b13ed`)

Carlos asked for the final 50 again on the deployed commit, because the 2026-10-10 run was one commit behind what production later ran. Record: `scan-results/2026-10-11-final-50-e9b13ed/`.

- **Engine (Verified).** `e9b13ed` is the head of `master` and the `secscan / production` deployment of 2026-10-11 06:06 UTC. Since `e3d5875` the scanner code differs only by PR 38 and a Stripe bump.
- **Two passes (Reran).** Pass 1: the headless browser did not start, because the lockfile's Playwright 1.64.0 wants Chromium revision 1248 and this PC has 1234; 638 findings. Pass 2: Playwright 1.62.1 (the version this PC has a browser for, older than the lockfile's), browser started in all five batches; 48 of 50 scanned, 612 findings (0 critical, 41 high, 103 medium, 110 low, 358 info). The browser rendered 1 of 48 sites (duolingo.com). **Pass 2 is the closest run to production this PC can do, not an exact copy.** About 11 minutes a pass.
- **Against the 2026-10-10 run** the same findings, grade and HTTP status on 41 of 50 sites (pass 1: 42). The differences are the sites: five sites changed between 200, 429, 406 and 503 within minutes.
- **Decision 14 reproduced on the live commit.** `elastic.co` answered HTTP 406 in pass 2 and SecScan again reported the five claims that are false of the real page. In pass 1 it answered 200.
- **Not done.** The independent re-check was not repeated on this output. An exact-match run needs `playwright install chromium` for 1.64.0 (about 150 MB), not done.
- **Note on the link script.** The version pins in my scratch `link-engine.ps1` were right for `ac8fdf6` and are stale for `e9b13ed` (Playwright 1.62.1 there, 1.64.0 in the lockfile). Use `-NoPin` for exports of newer commits.

## 2026-10-10 (night): Lovable-style target built; first results for SecScan (local only, nothing published)

Carlos asked for an app "based on Lovable's protocols and dependencies" to test on. That answers decision 1a (build the vibe-stack set). Decision 1b
(publish whatever the number is) is still open, so the target and its results are in a local repo, `C:\Users\Cho-zen\lovable-style-target` (3 commits, not
pushed), and none of it is in this repo.

- **What it is.** A React 19 + Vite 7 single-page app on the dependency list of a third-party Lovable boilerplate (Lovable's docs say apps from 2026-05-13
  use TanStack Start; that variant is not built), in a vulnerable and a clean-twin build, with a mock Supabase behind fake `<ref>.supabase.co` hosts. 10
  in-scope planted faults, 2 out of scope, 4 controls. The ground truth was written first, from the sources it cites (the primary one is Matt Palmer's
  CVE-2025-48757 report), and committed with its hashes before the app or any scan (`894cdd6`). **It is not independent**: the assistant that wrote it also
  edits the scanners.
- **SecScan, master `ac8fdf6` (Reran).** As built it detected 2 of 10 in-scope faults (published source maps, missing headers). It missed tables with
  RLS off, anonymous writes, the listable bucket, the service_role key and the OpenAI-shaped key. With the Supabase config also written into the HTML (a lab
  control, not a real build) it detected 5 of 10. Causes, each reproduced: the Supabase, BaaS and storage checks are given only the page HTML, not the
  bundle (**Verified**, plus the control); the secret scanner keeps only the first 512,000 bytes of a 761,001-byte bundle (**Reran**); the service_role
  pattern needs a variable name that minification removes (**Reran**).
- **False positives.** None as built. With the config visible: a CRITICAL "Tables Readable Without Authentication" on the clean twin for `announcements`, a
  table that is public by design, and a MEDIUM about the ten-year lifetime of the anon key.
- **Logged as decisions 15 to 17. Nothing was changed in the scanner repo.** Decision 1a is recorded as made; what remains for it is a review of the
  ground truth by someone other than the scanner's authors.
- **Not done.** The TanStack Start variant; pushing the ground truth before scanning (the runbook asks for it; it was only committed locally); an independent
  reviewer; a run with the scanner's browser able to load the mock's data. The same target was also run through the other scanner; that record stays in the
  target repo, not here.

## 2026-10-10 (later): SecScan run of the held-out final 50, with an independent re-check

Carlos wanted the 50-URL final test run on SecScan. The first run of this list was on a different product, so this is the SecScan run. List: `scan-results/2026-10-10-final-50.txt`. Everything else: `scan-results/2026-10-10-final-50/`.

- **Result (Reran, Verified).** 48 of 50 sites scanned (gnu.org unreachable from the PC, npr.org timed out; both retried once). 621 findings, 259 above info: 0 critical, 44 high, 103 medium, 112 low, 362 info. Passive, scanner `master` `e3d5875`, five batches of ten, 17:09 to 17:21 UTC. Three sites were scanned from a bot-challenge or rate-limit page and had their header findings withheld; one (elastic.co) from an HTTP 406 page.
- **Independent re-check (Reran).** 501 findings have a check: 477 confirmed, 5 contradicted (all elastic.co's 406 page), 2 did not reproduce, 17 not re-derivable (laravel.com and css-tricks.com answered 429). 120 have no check. The script, its four passes and its own bugs are in `VERIFICATION.md`.
- **Two observations about the scanner, logged as decisions 13 and 14. Nothing was changed in the scanner repo.** (13) No "Missing HSTS" finding in 98 site scans (0 of 50 on 2026-10-05, 0 of 48 now), though six sites here verifiably lack the header and are not preloaded: the code suppresses it on any HTTP-to-HTTPS redirect, tested on the apex rather than the scanned host. (14) A start page that answers an error keeps full-severity findings, by design, which gave elastic.co a false high "Missing CSP".
- **How the run went.** The first attempt was stopped at 38 of 50 by Claude Code's memory-pressure reaper (no capture is written until a run ends; the console log is kept). The second was discarded: something other than the session switched the shared scanner checkout to the branch `fix-live-scan-render`, which starts a headless browser. That branch was merged as PR 38 at 17:02 UTC and went live at 17:05; the switch was most likely the session preparing the merge. Its first batch ran the tree now deployed (`ac8fdf6`) and matched this run's findings on all 10 sites. This run used a read-only export of `e3d5875`. Detail in `SCAN-RESULTS.md`.
- **Still open.** (1) The audit-log entry for this run belongs in the scanner repo's `FALSE-POSITIVE-AUDIT.md`, which this repo mirrors. Writing it there needs a branch and PR, which `AGENTS.md` leaves to Carlos. (2) The headless-browser path was again not exercised (`renderedWithBrowser` false on all 48); PR 38 makes `live-scan.ts` start the browser, so the next sweep will. (3) The final test ran on `e3d5875`, not the deployed `ac8fdf6`; 10 of 48 sites were compared and matched, the rest are inferred. (4) The shared scanner checkout was left on `fix-live-scan-render` (now merged); I did not switch it back.

## 2026-10-10: mirror brought up to date with the scanner repo; code audit held back

Carlos asked for this repo to be the home for the documentation, with new docs added as they appear. It was cloned to his
PC and synced from the scanner repo at `master` = `e3d5875`, a clean tree equal to `origin/master` (**Verified**).

- **Synced (`5a69b00`).** `docs/FALSE-POSITIVE-AUDIT.md` +149 lines (the 2026-10-05 and 2026-10-09 entries), `CHANGELOG.md`
  +24, and `SCAN_TESTS.md`, `SCAN_COVERAGE.md`, `SCAN_CHECKS.md` updated. `RETEST.md`, `SCAN-RESULTS.md` and `benchmark/` were
  already identical (**Reran** `sync.sh`, then compared with line endings ignored).
- **Added (`bcad9d8`).** Three 2026-10-05 captures (`companies-50`, `guards-20`, `tls-mail-20`) and the 50-company URL list.
  `sync.sh` now also copies the scanner's `sweep-lists/` beside the captures. A pattern scan of the new files found no keys,
  tokens or unredacted cookies (**Reran**).
- **Re-snapshotted (`bf10977`, `ffcac03`).** Grading the Grader was at update 20; the live report is at update 23, about 470
  text lines added and 166 changed (**Verified** by text diff of the old snapshot against the live page). Against the Field
  and Improvement Plan are unchanged in text; their old snapshots only lacked the page wrapper.
- **Scanner repo, for the record.** PR 39 (clickjacking, `/server-info`, library-version and short-lived-cert false
  positives) and PR 41 (analytics-cookie and unpinnable-tag SRI false positives) merged 2026-10-10. PRs 22 to 25 (the
  2026-10-04 code-audit fixes) merged 2026-10-04 and 2026-10-05 (**Verified** with `gh`).
- **Held back: the SecScan code audit (master `832fb75`, 2026-10-04).** It is a Docs artifact, so it needs exporting to
  markdown rather than saving as HTML, and it describes how each of its three High findings was reproduced. PRs 22 to 25 are
  merged, but whether they close those findings is **Reported** by their titles, not re-checked, and nothing here shows a
  deploy. This repo is public. See decision 11.
- **Seclayer stays out.** Its scan rounds, including the 2026-10-09 final 50, are in `seclayer.io2026/docs/scan-results/`.
  See decision 12.
- **Still open.** (1) `docs/SCAN-RESULTS.md` is the scanner repo's index and stops at Round 6 (2026-09-24); later runs are
  covered only by the audit log. (2) The raw capture behind "The SecScan 100" (100 sites, 1,134 findings) was not found in
  either repo (**Inference**: searched by name and content). (3) `benchmark-runs/` has no runs; the independent head-to-head
  waits on decisions 1a to 1c. (4) As of 2026-10-05 no sweep exercised the headless-browser path (`renderedWithBrowser` was
  false on every site; **Reported** in the audit log).

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
