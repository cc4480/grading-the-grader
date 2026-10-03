# Free scanners: what they give away, and how SecScan's free tier compares

Research date **2026-10-03**. Mark for every rival fact: **Researched** (search-engine summaries of vendor pages and of
third-party review sites; the session could not fetch vendor sites, so no page was read in full and no scanner was run).
Prices and limits move often and several conflict between sources. Confirm on the vendor's page before quoting.
SecScan facts are from the scanner repo's code and the reports in this repo.

Related: `docs/FIELD-RESEARCH.md` (paid tiers and platforms), `docs/IMPROVEMENT-PLAN.md`, `docs/DECISIONS.md`.

## The short version

"Free" in this market means one of four things:

1. **A free teaser.** Unlimited or near-unlimited scans that show a score and finding titles, with the details and fixes
   behind a payment. SafeToShip, UNPWNED, Vibe App Scanner, and the surface scan at VibeEval.
2. **A free baseline inside the builder.** Lovable, Bolt, Base44, Replit and Supabase scan on publish at no charge.
3. **Open source or single-purpose tools.** ZAP, Nuclei, SSL Labs, header graders, and a growing number of Supabase RLS checkers.
4. **A free tier of a bigger platform.** Aikido, Pentest-Tools.

SecScan's free tier is the opposite of a teaser: 3 scans a month with **every finding and fix unlocked**. It is generous on
depth and low on volume, and its biggest limit is not the count but that **17 of its 41 tests need the owner to prove
the domain**, so a first scan of an unverified URL skips about half the checks. Rivals' free scans of an unverified URL
include Supabase RLS and Firebase rules checks.

## What the free offers contain

| Offer | What is free | What is held back | Signup | Mark |
|---|---|---|---|---|
| **SafeToShip** | Unlimited quick scans, 60 seconds, 10 modules (headers, TLS, exposed files, leaked keys in JavaScript, Supabase RLS, Firebase rules, CORS, cookies). Score and finding titles. | Full report $9 a scan, or Pro $24 a month for unlimited | None | Researched |
| **UNPWNED** | 2 scans a month. Score, grade and finding titles for every check. Claims 700+ checks across 36 scanners (vendor claim). | Details and fix instructions | Not established | Researched |
| **Vibe App Scanner** | First scan: score, issue counts and **one** finding in detail. Claims 150+ checks including active Supabase and Firebase testing. | Every other finding and its fix. Go $19 a month, Pro $39 | No card | Researched |
| **VibeEval** | A surface scan described as free and unlimited by one third-party summary. 14-day Pro trial, no card. | The deep agent scan (RLS, auth bypass, API authorization). Pro $19 a month | None for the surface scan | Researched |
| **CheckVibe** | A free account is needed to see results. One source says scans are free and the full report is paid. | Unclear. Starter, Pro $49 | Free account | Researched, sources conflict |
| **VibeCheck (notelon.ai)** | Free, scans a GitHub repo **and** a live site. Checks keys, env vars, Supabase RLS, Firebase, CORS, headers, database credentials, JWT leaks, unprotected routes. Copy-paste prompt per finding. | Not established | None | Researched |
| **ZeriFlow** | Free quick scan, 80+ checks, 60 seconds, no card, no domain verification. Headers, TLS, cookies, mixed content, open ports. | AI remediation and unlimited scans. Pro from $8.25 a month | No card | Researched |
| **Aikido (free plan)** | 2 users, SCA, SAST, secrets, cloud, IaC, 10 repos, 1 domain, rescans every 3 days, 10 AI autofixes a month | More users and features. Paid from $350 a month | Account | Researched |
| **Pentest-Tools.com (free)** | Website Vulnerability Scanner, **2 light scans a day**, 5 assets a month, weekly or monthly scheduling | Deep scans and the other 20+ tools | Account | Researched |
| **ImmuniWeb free test** | Outdated software, known vulnerabilities, header and compliance checks | Limited depth and pushes toward paid services (third-party opinion) | Not established | Researched |
| **MDN HTTP Observatory** | Headers, cookies and redirect behavior with a grade | Not a vulnerability scanner | None | Researched |
| **Qualys SSL Labs** | Deep TLS grade from 60+ browser handshake simulations | TLS only. The API limits assessments and answers 429 | None | Researched |
| **SecurityHeaders.com** | About eight headers graded A+ to F | Header-only. Its API was shut down in April 2026 | None | Researched |
| **OWASP ZAP, Nuclei** | Everything. ZAP is Apache 2.0, Nuclei is MIT with 12,000+ community templates | Your time to configure them | None | Researched |
| **Supabase RLS checkers** (rlsgate, a Chrome extension, an anon-key CRUD tester, launchguard, VibeEval's free checker) | Static or anon-key checks for tables without RLS, public buckets, exposed RPCs, leaked keys. rlsgate reads migrations, policies, env files and the frontend bundle, with no database connection, as a CLI, Claude Code skill or GitHub Action. | Little. These are narrow | None | Researched |
| **Builder baselines** | Lovable's quick scan on every publish (about 10 seconds: RLS, dependencies, MCP exposure). Bolt's publish audit (free, no tokens). Base44's built-in scan. Replit's Security Agent. Supabase's Security Advisor | Lovable's deep scan and $100 pentest, Bolt's project audit on paid plans | The builder account | Researched |

## SecScan's free tier today

| What | Detail | Mark |
|---|---|---|
| Allowance | 3 scans a month per identity, renewing on the 1st (UTC). An identity is an account **or** an anonymous browser identity. | Verified (`freeTrial.ts`, `scansCreate.ts`) |
| What a free scan returns | Every check, all findings and fixes, the AI-written analysis, the test ledger | Verified (pricing page, product report) |
| No signup needed | Anonymous scanning is allowed with lower limits: a daily cap of 10 for an anonymous identity. Scans that use a login (credentialed) need a registered, verified account | Verified (`scansCreate.ts`) |
| The big limit | **17 of 41 tests (50 of 143 checks) need a verified domain**: ownership by DNS TXT or a well-known file, which is free. Without it they are skipped and listed as "not tested", with the reason. Those include the Supabase RLS and Firebase rules checks, active CORS, the API tests and cross-account access control | Verified (product report, 2026-09-30) |
| Free re-tests | 10 a day, spend no scan | Verified (`verifyFix.ts`) |
| Agents | MCP and the REST API run on the same free scans | Verified (`mcp.ts`, `oauthConsent.ts`) |
| Added, unmerged (scanner repo `b6d1e08`) | One watched site once plans are enforced; a grade badge | Reran (tests) |

## Where SecScan is ahead, level and behind

| | Position | Why |
|---|---|---|
| Findings unlocked on the free tier | **Ahead** | Vibe App Scanner unlocks one finding, SafeToShip and UNPWNED show titles only. Every finding and fix is free here |
| Safety before attack traffic | **Ahead** | The ownership gate fails closed. No rival free scanner was seen advertising one |
| Depth per scan | **Ahead, once the domain is verified** | 143 to 144 checks, with active and cross-account tests |
| Scans per month | **Behind** | 3 against unlimited (SafeToShip, VibeEval surface) or 2 a day (Pentest-Tools). UNPWNED's 2 a month is comparable |
| First-scan depth on an unverified URL | **Behind** | Rivals show Supabase RLS and Firebase results at once. SecScan skips them until the domain is verified |
| Friction | **Level** | Anonymous scanning exists. SafeToShip and VibeCheck need no signup either. CheckVibe needs a free account |
| Source-code scan in the free tier | **Behind** | VibeCheck, Aikido and the builders scan code free. SecScan reads only a public GitHub repo, one passive test |
| Free in CI and the editor | **Level or behind** | MCP is live. The GitHub Action and npm package are written and unpublished. rlsgate and ZeriFlow ship Actions |

## What this suggests (judgement, mark: Inference)

1. **Say "no signup" and "everything unlocked" on the front door.** Both are true today and rivals' headline offers are
   the opposite. The pricing page now lists the unlocked findings. The home page and the scan form should say it too.
2. **Fix the first-scan experience on an unverified URL.** This is the sharpest gap. The report already lists skipped tests
   with a reason. Make the report lead with what verification would unlock, in one click, and say how long it takes.
   Keep the ownership gate: it is the thing no rival advertises. Whether to add any passive Supabase hint that needs no
   test traffic (the scan already reports "Supabase detected, verify RLS") is a decision for Carlos.
3. **Decide whether to add a cheap, unlimited "quick check".** Rivals use unlimited score-plus-titles scans as the front
   door. SecScan has one scan type by design (the old Basic and Deep tiers were removed). A quick check limited to headers,
   DNS, mail and TLS would be cheap to run and would not need ownership proof. It is a product decision with a cost
   question (browser rendering, the SSL Labs call, AI analysis), not a copy change. Do not build it without measured costs.
4. **Publish the Action and npm package.** It is the cheapest way to be present where free developer tools live.
5. **Single-purpose free pages for passive checks** (email authentication, security headers, exposed files). They need no
   verification, rank for searches, and send people to the full scan. Content work, not scanner work.

## Not established

- Exact free limits for CheckVibe and UNPWNED's signup requirement.
- Whether the rivals' free Supabase and Firebase checks send test requests to a site the user has not proven they own.
  The gap in the table above is about what a user sees, not whether the rival's approach is safe or permitted.
- Costs per scan for SecScan's free tier (browser rendering, SSL Labs, AI analysis). Needed before decision 3 in the list above.

## Sources

- [DEV: I Tested Every Vibe Coding Security Scanner](https://dev.to/solobillions/i-tested-every-vibe-coding-security-scanner-2026-heres-what-actually-works-p9k)
- [Best Vibe Coding Security Scanners Compared (notelon.ai)](https://notelon.ai/tools/vibecheck/compare)
- [SafeToShip: best security scanners for vibe-coded apps](https://safetoship.dev/blog/best-vibe-coding-security-scanners)
- [SafeToShip](https://safetoship.dev/)
- [Vibe App Scanner](https://vibeappscanner.com/) and [pricing](https://vibeappscanner.com/pricing)
- [UNPWNED vs Vibe App Scanner](https://www.unpwned.io/compare/vibeappscanner) and [UNPWNED](https://www.unpwned.io/)
- [ZeriFlow free scan](https://zeriflow.com/free-scan) and [ZeriFlow](https://zeriflow.com/)
- [Pentest-Tools free edition](https://pentest-tools.com/usage/pricing/free)
- [ImmuniWeb: free online vulnerability scanners](https://www.immuniweb.com/resources/free-online-vulnerability-scanner/)
- [Free vs paid scanners (CheckVibe blog)](https://checkvibe.dev/blog/web-app-security-scanner-comparison)
- [rlsgate](https://github.com/GerardoRdz96/rlsgate), [supabase-rls-checker](https://github.com/hand-dot/supabase-rls-checker), [Supabase-RLS-Checker](https://github.com/sahilahluwalia/Supabase-RLS-Checker)
- [Aikido pricing](https://www.aikido.dev/pricing)
- [Lovable security overview](https://docs.lovable.dev/features/security), [Bolt publish audit](https://bolt.new/blog/security-audit-on-publish), [Base44 scan](https://docs.base44.com/Setting-up-your-app/running-a-security-scan), [Replit Security Agent](https://replit.com/blog/meet-replit-security-agent), [Supabase advisors](https://supabase.com/blog/security-performance-advisor)
- [SSL Labs API v4](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v4.md), [Security Headers joins Probely](https://scotthelme.co.uk/security-headers-is-joining-probely/), [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory/docs/faq)
