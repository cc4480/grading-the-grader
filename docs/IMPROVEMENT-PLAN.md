# SecScan Improvement Plan

Twelve improvements, in the order the evidence supports. Each one says why it matters, what finished looks like, how to get there and what it needs from Carlos.

Prepared 2026-10-03. Companion to `docs/FIELD-RESEARCH.md`. The HTML original is `artifacts/secscan-improvement-plan.html`.

> Order, sizes and recommendations are judgement (mark: Inference). Rival facts are vendor claims or third-party summaries (mark: Researched). SecScan facts are from the reports in this repo and were not rechecked against the code. Sizes: S is a small change, M a focused piece of work, L a project. None is a schedule.

## Order of work

**Decide two things, then build in three waves**

Two items are decisions, not work, and they steer the rest: how to price before payments go live (3) and whether SecScan competes on code or stays the outside view (5). Both are cheap to settle and expensive to settle late.

**Decide first: Two calls only Carlos can make**

- Pricing and allowance shape
- Code-side positioning

**Wave 1: Prove it and ship what is ready**

- Independent proof, jobs A and B
- Replayable evidence
- Publish the Action and package
- TLS fallback

**Wave 2: Close the depth and cadence gaps**

- Monitoring cadence control
- Independent proof, job C
- Prove the AI probes
- SPA, auth and API depth

**Later: Worth doing, not urgent**

- Known-vulnerability depth
- Ticket destinations
- Attack-surface breadth
- Challenge-page handling

## 1. Independent proof of detection

`Proof` `Size M to L` `Upgrade U1` `Needs Carlos's call`

**Why**

- The 68 of 74 and 88 of 88 results come from SecScan's own fixture, which the reports call "SecScan's own checklist made executable."
- The nine September 26 checks, SSRF and the four September 29 probes have not been seen to fire on a real fault.
- No false-positive sweep has run since PRs 12 to 14.
- Rival accuracy claims are vendor claims. One third-party benchmark measured Invicti at 23% false positives against its 99.98% claim, so a reproducible result is rare.

**Done looks like**

- A public repo holds the target apps, the ground truth, the tool configurations and versions, the raw output of every tool and the scoring script. Someone else can rerun it.
- Ground truth is committed before any scan runs.
- Results are reported per category, with out-of-scope rows marked out of scope, plus the false-positive rate on a clean twin and each tool's "found but not planted" list.
- The 30-site sweep is rerun on current master and recorded.

**Approach: three jobs**

- **A. Rerun the 30-site sweep.** Cheap. Needs outbound access to those sites, which this session lacks.
- **B. Head-to-head on public vulnerable apps** against ZAP and Nuclei, run locally. No rival accounts needed. Fix the known unfairness first: ZAP's Forced Browse, OpenAPI and authentication add-ons were not configured.
- **C. A vibe-stack set** (Next.js and Supabase apps with planted RLS and key leaks) whose faults come from published incident write-ups, not from SecScan's checklist. This is what proves the unproven checks.

**Risks**

- SecScan will likely score poorly on classic training apps, because it is an outside-in scanner for AI-built apps. Report that plainly.
- The three blind adjudicators are the same model and share blind spots. Use deterministic matching on a pre-registered fault-to-route map, plus a human spot check of a sample.
- SSRF needs a reachable callback host. A local run needs the collector set up.

**Needs from Carlos**

Whether to build the vibe-stack set (it needs someone besides the scanner's authors to write the ground truth). Whether to publish whatever the number is. Outbound access to the 30 sites for job A. Rival accounts, much later, if commercial tools are wanted in the comparison.

## 2. Monitoring cadence the user can control

`Product` `Size S to M` `Upgrade U23`

**Why**

- A full re-scan runs every 14 days at grade A, 7 at B or C and 3 at D or F. The user cannot change it. Frequency and quiet hours are listed as not built.
- Three direct rivals advertise faster cadence: daily re-scans at VibeEval Pro, daily monitoring at CheckVibe Pro, weekly deep scans at Vibe App Scanner Pro. Vendor claims, via search.
- An app that ships daily can regress between two scans a fortnight apart.

**Done looks like**

- Each monitored site has a cadence setting: daily, weekly or the current grade-based default.
- Quiet hours are respected for alerts and for the scan itself.
- Scheduler-started rescans still do not spend the user's allowance, as they do not today.
- The monitor page shows the next scheduled scan.

**Approach**

Add a per-site cadence field that overrides the grade-based table. Keep the hourly pulse and CVE check as they are. Cap daily full scans by plan, since each is a full run against the customer's host.

**Risks**

Daily full scans multiply load on small hosts and on SecScan's own workers. Decide whether daily means a full scan or a lighter passive pass.

**Needs from Carlos**

Which plans get daily, and whether daily is a full scan or a passive pass.

## 3. Price and allowance shape

`Pricing` `Size S` `Decision`

**Why**

- Starter is $19 for 20 scans, or $0.95 a scan. Pro is $49 for 100, or $0.49. Rivals as found: Vibe App Scanner Pro about $0.26, CheckVibe Pro about $0.32, and VibeEval $19 with unlimited scans.
- Vibe App Scanner gives the first scan free. CheckVibe is free to scan, with payment for the full report on one source.
- Payments are off, so the shape can still change at no cost to a customer.

**Done looks like**

- A written decision on what a "scan" is for billing: whether manual "scan now" and monitor baselines should keep drawing on the allowance. Scheduled rescans already do not.
- Pro's allowance is compared with the rival figures above and kept or changed on purpose.
- Pricing copy matches the decision, and the pricing API, the page and the MCP tool all read one source.

**Approach**

Prices live in code (`plans.ts`, `stripe.ts`), so a change is a code change and no hand-made Stripe products. Keep the spend order of free scans, then plan scans, then credits.

**Risks**

Rival prices conflict between sources and move often. Confirm them on the vendors' pages before choosing. SecScan's plans include monitored sites, so a per-scan comparison understates what a customer gets.

**Needs from Carlos**

The decision itself, after Carlos has checked the rival prices.

## 4. Evidence a developer can replay

`Product` `Size M` `Upgrade U16`

**Why**

- A curl replay is offered only when the evidence is a plain GET, HEAD or OPTIONS.
- PR 17 improved request lines for active tests. On a fixture rescan from its branch, 2 of 24 active-test findings still list no request. That branch result has not been seen on a live scan.
- VibeEval advertises captured exploits and reproducible proofs, and Invicti sells exploit-backed proof. Both are vendor claims.

**Done looks like**

- Every active-test finding stores the request and the response that showed the fault.
- Replay covers POST and authenticated requests, with secrets redacted.
- The last 2 of 24 on the fixture list a request, and the fixture gate asserts it.

**Approach**

Extend the ledger's "How this was found" panel so the stored pair is the evidence, not a text line parsed for a method and address. Add a gate assertion so a new probe cannot ship without it.

**Risks**

Stored requests can hold the user's credentials or session. Redaction needs its own tests, and the AI opt-out must also keep these pairs from the AI provider.

**Needs from Carlos**

Nothing to start. A live scan after deploy, to see it on a real report.

## 5. Code-side coverage and positioning

`Strategy` `Size L if built` `Decision`

**Why**

- SecScan reads the live site and, optionally, one public GitHub repo with a single passive test.
- The September 24 research called source scanning the largest opening. Since then the builders shipped it free: Lovable's deep scan, Bolt's project audit, Base44's SAST, SCA and secrets scan, Replit's Semgrep and LLM layer. Aikido's free plan and Claude Code and Cursor reviews cover code too.

**Done looks like**

- A one-paragraph position in the product copy: what SecScan sees that a code scan cannot.
- If the choice is to stay outside: no code-side build, and the copy says so.
- If the choice is to add code: a named scope, such as secrets and RLS migrations in a connected repo.

**Approach**

My recommendation is to stay outside. A code scan competes with free tools inside the builders. The outside view has things a code scan cannot show: what is actually reachable after deploy, drift between deploys, DNS and mail, and proof that anonymous reads and writes work.

**Risks**

Staying outside means the free builder scans are the baseline SecScan must beat, so items 1 and 4 matter more. Adding code multiplies scope and the false-positive record has to start over.

**Needs from Carlos**

The decision: stay the outside view, or add a defined code-side scope.

## 6. Integrations that ship

`Product` `Size S to L` `Upgrades U7, U8, U6`

**Why**

- The GitHub Action and npm package are written and unpublished. They need a separate repository and tag.
- Jira, Linear and GitHub issue destinations are not built because they need stored third-party credentials. Teams, evidence packs, white-label reports and a public status page are not built either.
- StackHawk runs in 12+ CI platforms. Detectify, Burp, Pentest-Tools and Bright ship MCP servers. SecScan's MCP server is at parity, with OAuth 2.1 as a strength.

**Done looks like**

- Wave 1: the Action and the npm package are published, and the CLI's exit codes are documented.
- Later: at least one ticket destination, starting with GitHub issues, which needs the least new credential handling.
- The status page waits for the owner's uptime page.

**Approach**

Publishing is the cheapest item on this whole list and unblocks CI use. Ticketing needs a credential vault decision before any build, because a stored Jira token is a new thing to protect.

**Risks**

A published Action is public surface. Check it never prints a token, and that the "tests skipped" line stays in its output.

**Needs from Carlos**

A GitHub repository and tag for the Action, an npm account for the package, and the directory submissions that need Carlos's accounts.

## 7. Single-page app, auth and API depth

`Product` `Size M to L` `Upgrades U15, U18, U19`

**Why**

- Inner routes of single-page apps are fetched raw. The rendered page's own API calls do feed the API tests.
- Mass assignment on a create endpoint is reported only when a published spec declares the field. Command, NoSQL and XXE injection were left out. WebSocket testing is not built, on purpose.
- StackHawk tests REST, GraphQL, SOAP and gRPC. VibeEval runs authenticated access-control tests. Vendor claims, via search.

**Done looks like**

- Inner routes are rendered, and the ledger records which were rendered and which fetched raw.
- NoSQL and command injection ship each with a vulnerable case and a clean twin, as the reports require of every check.
- Mass assignment is tried on create endpoints without a spec, with a clean twin for apps that render the same record for any input.

**Approach**

Do inner-route rendering first, since it feeds every other probe. Leave WebSocket alone until a finding can be trusted: an open handshake is normal on public sites.

**Risks**

Each new probe is a new place to produce a false positive. The record is the product's claim, so no probe ships without its clean twin and a sweep.

**Needs from Carlos**

Nothing to start. Real apps built on single-page frameworks to test against, ideally yours.

## 8. Prove the AI-feature probes

`Proof` `Size S to M` `Upgrade U11`

**Why**

- The passive AI-in-client checks ran on every sweep target without a finding, which proves little.
- The four probes added on September 29 were skipped in the one real scan, each for a stated reason.
- Bright covers the OWASP LLM Top 10 including prompt injection. Aikido sells a pentest for AI agents. Vendor claims.

**Done looks like**

- The four probes run on a real app that has an AI feature, with the target's owner verified.
- Each probe has a recorded vulnerable case that fires and a clean twin that stays quiet.
- Product copy claims only what has been seen to fire.

**Approach**

Pair this with job C of item 1, using an AI-feature app in the vibe-stack set.

**Risks**

Prompt-injection probes can cost the target money or trigger its safety systems. Run them only against apps the user owns.

**Needs from Carlos**

An AI-feature app Carlos owns, or permission to build one for the set.

## 9. Known-vulnerability depth

`Product` `Size M`

**Why**

- CVE detection is a version match plus OSV.dev. PR 18 fixed the nginx floor to 0.9.6. Version 1.31.2 of nginx is still not covered because a single ceiling cannot express it.
- The technology rules tightened in PRs 14 and 18 have not been rechecked by any sweep.
- Nuclei ships 12,000+ MIT-licensed community templates, with 226 added in April 2026.

**Done looks like**

- The nginx rule expresses a version range with more than one interval.
- A sweep rechecks the technology fingerprints and the CVE and end-of-life matches that the earlier rounds skipped.

**Approach**

Fix the range model first. Treat importing Nuclei detections as an experiment: take only passive, safe templates, and give each a clean twin so the false-positive record holds.

**Risks**

Importing templates trades breadth for the hand-checked accuracy that is SecScan's claim. Check the licence terms of each template pack before using any.

**Needs from Carlos**

A call on whether to try the Nuclei import at all.

## 10. Fallback for the TLS dependency

`Product` `Size S to M`

**Why**

- The TLS grade comes from Qualys SSL Labs, started in parallel and waited on for up to 120 seconds. Certificate expiry from the same result feeds the monitoring alerts.
- SSL Labs limits concurrent and total assessments and answers 429 over its quota. The securityheaders.com API was shut down by Snyk in April 2026, which shows that free graders can disappear.

**Done looks like**

- A 429 or timeout shows "TLS not graded" with the reason, never a missing row or a stale grade.
- Certificate-expiry alerts keep working without the SSL Labs result.
- A test covers the 429 path.

**Approach**

The 429 behaviour is documented. The fallback is an inference from it, so first check how the worker handles a 429 today. Then record a skipped test with its reason in the ledger, and read certificate expiry from the hourly pulse's own handshake.

**Risks**

An in-house TLS grader would be a project of its own. The cheap version is a clear failure mode, not a replacement.

**Needs from Carlos**

Nothing.

## 11. Attack-surface breadth

`Product` `Size M`

**Why**

- Subdomains are found from 64 common names, and the 33-port scan needs a verified domain.
- Detectify's Surface Monitoring tracks up to 25 assets continuously from €302 a month. Pentest-Tools has a subdomain finder.

**Done looks like**

- Subdomain discovery uses certificate-transparency data as well as the wordlist.
- New subdomains raise a monitoring alert.

**Approach**

Low priority for people shipping one AI-built app. Revisit if agencies or teams with many domains become a target.

**Risks**

Discovery finds hosts the user does not own. Findings on them must stay unscanned without verification.

## 12. Bot-protected sites

`Product` `Size S`

**Why**

- Six to eight of the 30 sweep sites are withheld each time because a challenge answers. The amazon.co.uk error came from a vendor the scanner did not recognise.
- DataDome, AWS WAF, Cloudflare's cf-mitigated header and Akamai's markers have no public source and stay unverified.
- No rival's handling of this was found, so there is no benchmark to copy.

**Done looks like**

- Each unverified vendor has a documented signal, or an explicit "unverified" note in the report.
- A withheld scan tells the user what answered and what to try, such as allow-listing the scanner's documented user agent.

**Approach**

Keep withholding, because grading a challenge page as the app is the failure the reports spent a release fixing. Collect real challenge pages from scans and add signals as they are seen.

**Risks**

Signals written from memory were a source of earlier errors. Add each only with a captured sample and a clean twin.

## Decisions

**What is needed from Carlos, in one place**

| # | Item | Decision or input | Why it matters |
|---|---|---|---|
| 3 | Pricing | What counts against the allowance. Whether Pro's 100 stays. | Payments are off, so this is free to change now. |
| 5 | Positioning | Stay the outside view, or add a defined code-side scope. | Decides whether items 1 and 4 are the whole fight. |
| 1 | Proof | Build the vibe-stack target set. Publish whatever the result is. Outbound access for the sweep. | The main credibility gap, and the only one rivals have not filled. |
| 2 | Cadence | Which plans get daily, and full scan or passive pass. | Sets load and the price floor. |
| 6 | Integrations | A repository and tag for the Action, an npm account, directory accounts. | The cheapest unblocked win on the list. |
| 8 | AI probes | An AI-feature app Carlos owns. | Without it the four probes stay unproven. |
| 9 | Nuclei import | Try it, or not. | Breadth against the hand-checked accuracy claim. |

### Parked on purpose

Merging duplicate findings (U12) waits on Carlos's decision and conflicts with the per-finding benchmark. The brand collision (U30), third-party proof of SecScan's own security (U28), a published median scan time and the free-tier test with real traffic (U25) need an outside party or real traffic. They matter, but they are not scanner improvements.

## Limits

**How far to trust this plan**

SecScan facts come from the 17 reports in the grading-the-grader repo, as of October 3, 2026. They were not checked against the code on 2026-10-03.

Rival facts come from search summaries of vendor pages and from third-party review sites, because the session blocked the vendors' own sites. Treat rival prices and claims as leads to confirm. They are vendor claims unless a row says otherwise. The details and sources are in SecScan Against the Field.

The order, the sizes and the recommendation in item 5 are judgement. The fallback in item 10 is an inference. None of this work has been run, except the free-tier change in `docs/STATUS.md`.

Re-run the research before quoting a rival's price or claim to a customer.
