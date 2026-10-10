# Decisions

Do not act on a pending decision. Record a new one here with the date and the reason, in the same commit as the work.

## Made

| Date | Decision | Why | Where |
|---|---|---|---|
| 2026-09-24 | Two plans: Starter $19 (3 sites, 20 scans), Pro $49 (5 sites, 100 scans). Free is 3 scans a month. | Priced against the rivals' $19 to $49 for 20 to 250 scans | scanner repo `plans.ts` |
| 2026-09-24 | Free scans renew monthly, not once | A one-time total gave nobody a reason to return | scanner repo `freeTrial.ts` |
| 2026-10-03 | Keep Seclayer artifacts out of this repo | Separate product | `AGENTS.md` |
| 2026-10-03 | Free tier gets perks, not more scans: one watched site, a grade badge, free perks advertised | Cost and abuse; the aim is a reason to return and to share | `docs/STATUS.md` |
| 2026-10-03 | The badge has its own token and shows grade and date only | A share token opens the full report | scanner repo `reportBadge.ts` |
| 2026-10-03 | **One paid plan: SecScan Unlimited, $19/month, unlimited scans (fair use), 5 sites; drop Starter, Pro and the credit packs.** Free tier stays at 3 scans a month. | Rivals sell unlimited at $8 to $24; with unlimited scans two tiers differed by two sites | scanner repo `plans.ts`, `docs/STATUS.md` |
| 2026-10-03 | A cancelled or paused account does not get the free site | It is for accounts that never had a plan | scanner repo `entitlements.ts` |
| 2026-10-03 | Order of work and the sizes in the improvement plan | My judgement, not Carlos's | `docs/IMPROVEMENT-PLAN.md` |
| 2026-10-10 | This repo is the home for SecScan's documentation; new reports, scans and audits are added here as they appear | One place to find every record so far; stated by Carlos | `README.md`, `docs/STATUS.md` |

## Pending, waiting on Carlos

| # | Decision | Options and my recommendation | Blocks |
|---|---|---|---|
| 3 | ~~Pricing and allowance shape~~ **Decided 2026-10-03**: see Made, above. Remaining: terms review, secscan.info update, one measured cost per scan. | | Payments go-live |
| 5 | **Code-side positioning.** Stay the outside view, or add a defined code-side scope. | Recommend staying outside: builders now ship free code scans (Lovable, Bolt, Base44, Replit). | Product copy, items 1 and 4 |
| 1a | **Build the vibe-stack target set** (Next.js plus Supabase apps with planted faults, ground truth from published incidents and written before scanning) or use only classic public apps. | Recommend both, vibe-stack second. It needs someone besides the scanner's authors to write the ground truth. | Runbook step 5 |
| 1b | **Publish whatever the number is**, including a weak one on classic apps. | Recommend yes. | Runbook step 7 |
| 1c | **Outbound access to the 30 sites** for the false-positive sweep. | A session or PC with normal internet access runs it. | Sweep rerun |
| 2 | Monitoring cadence: which plans get daily rescans, and full scan or passive pass. | Not yet discussed in depth. | Improvement 2 |
| 6 | A GitHub repo and tag for the Action, an npm account, directory accounts (Smithery, cursor.directory). | Cheapest unblocked win. | Improvement 6 |
| 8 | An AI-feature app Carlos owns, to prove the four September 29 probes. | | Improvement 8 |
| 9 | Try importing Nuclei detections, or not. | Experiment only, each with a clean twin. | Improvement 9 |
| 10 | **Free-tier shape against the free scanners** (`docs/FREE-SCANNERS.md`): (a) lead the report with what domain verification unlocks; (b) whether to show any passive Supabase hint that needs no test traffic; (c) whether to add a cheap unlimited "quick check" (headers, DNS, mail, TLS) as a front door; (d) single-purpose free pages for passive checks. | Recommend (a) and (d) now, (b) and (c) only after per-scan costs are measured. Keep the ownership gate. | Free-tier copy, report layout, any new scan mode |
| 11 | **Publish the SecScan code audit (2026-10-04, master `832fb75`) in this public repo?** It describes how each of three High findings was reproduced. The scanner repo's PRs 22 to 25 are merged, but a deploy is not confirmed here. | Recommend holding it until Carlos confirms the fixes are deployed, then exporting it to `docs/` as markdown. Or leave it in the claude.ai Docs artifact and the private scanner repo only. | Snapshot of the code-audit artifact |
| 12 | **Should Seclayer's test record live here too?** `AGENTS.md` keeps Seclayer out (decided 2026-10-03), so its scan rounds, including the 2026-10-09 final 50, stay in `seclayer.io2026/docs/scan-results/`. | Recommend keeping it out and, if a pointer helps, linking to that repo from the README. | Where Seclayer's record is kept |
