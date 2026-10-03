# Field research: SecScan against the field

Research date **2026-10-03**. Every company, platform and tool named in the 17 SecScan reports in this repo, set beside SecScan. The ranked improvement list built from it is `docs/IMPROVEMENT-PLAN.md`. The HTML original is `artifacts/secscan-against-the-field.html`.

> **How far to trust this.** The session that did this research could not fetch the vendors' own sites (the network blocked them), so every rival fact comes from search-engine summaries of vendor pages and from third-party review and pricing sites. No vendor page was read in full and no rival's scanner was run. Prices are the weakest facts and several conflict between sources. Treat each as a lead to confirm on the vendor's page before quoting it. Marks: **Researched** for everything about rivals.

## SecScan is hard to beat on discipline and easy to beat on proof, price and reach

The reports describe a careful scanner: ownership-verified active tests, a ledger of what ran and what was skipped, hand-checked false positives, an MCP server with OAuth 2.1. The research found no rival that advertises all of that together. It also found three things that matter more for the next quarter than any single check.

1. **The free baseline moved into the builders.**

Lovable scans every publish, Bolt audits and fixes on publish, Base44 and Replit scan code before launch, and Aikido's free plan covers code, secrets and one domain. These look at source. SecScan looks at the live site, so its case rests on being independent and continuous, not on being the only check.

2. **Three direct rivals undercut or match SecScan's pricing while offering more cadence.**

VibeEval lists $19 a month with unlimited scans and daily re-scans. CheckVibe's Pro runs about $0.32 a scan with daily monitoring. Vibe App Scanner's Pro is about $0.26 a scan. SecScan Starter is $0.95 a scan and re-scans a grade-A site every 14 days. Payments are still off, so this can be changed before anyone pays.

3. **Nobody has independent numbers, which is an opening.**

SecScan's 68 of 74 comes from its own test app, and the reports say so. Vendors elsewhere claim far more than independent tests show: Invicti states 99.98% accuracy while one third-party benchmark measured 23% false positives. A published, rerunnable result against vulnerable apps that ZAP and Nuclei can also scan would be rare in this market. The reports list that work (U1) as not started.

## Things the reports show and no rival was seen advertising

"Not seen advertising" means absent from the pages and summaries that could be reached. It does not mean absent from the product. The reports make the same hedge about the per-scan ledger.

### Safety and honesty

- Active tests only after the owner proves the domain, and the gate fails closed.
- A ledger of every test as ran, skipped with a reason, or failed.
- Challenge and platform pages are withheld and not graded.
- Compliance mapping that never claims a pass.
- An account switch that keeps findings from the AI provider.

### Method

- A fixture with known faults, and a clean twin for every check.
- 239 stored scans of 54 real sites, with a written list of findings that look false and are correct.
- A blind benchmark against ZAP and Nuclei, with the author's own caveat.
- 2,699 API tests and 141 frontend tests, run in CI.

### Reach

- MCP server with 12 tools, OAuth 2.1 and separate token scopes.
- REST API v1, SARIF export, a CLI, hourly pulse and CVE matching.
- Works on any platform, not only the one that built the app.
- Three free scans a month on every account.

## Each row sets a rival against the SecScan row above it

Cells give what the sources said, with the source type under each row. "Via search" means a summary of the vendor's page. "Third party" means a review or comparison site. Prices are in the currency the source gave.

### Vibe-coding scanners, the direct competition

| Company | What it does | Price | Testing and cadence | Agents and CI | Against SecScan |
|---|---|---|---|---|---|
| SecScan (secscan.us) | Black-box scan of a live URL, graded A to F, 143 to 144 checks in 41 tests, fixes written for the stack. | Free 3 scans a month. Starter $19, 3 sites, 20 scans. Pro $49, 5 sites, 100 scans. Packs $12 and $49. Payments off. | 17 of 41 tests need a verified domain. Rescan every 14, 7 or 3 days by grade. Hourly pulse. | MCP (12 tools, OAuth 2.1), REST v1, SARIF, CLI. Action unpublished. | Reference row. |
| Vibe App Scanner (vibeappscanner.com) | Scans the live site for secrets in JS bundles, Supabase RLS, Firebase rules and headers. Also SEO and AI-search readiness, performance, accessibility, compliance and email checks. | First scan free. Go $19, 20 scans, 3 projects. Pro $39, 150 scans, 10 projects. _(Via search. AppSumo listing also exists.)_ | Pro adds weekly deep scans, weekly monitoring, breach monitoring and a basic attempt to reach other users' data. | MCP and API on all tiers. No repo access and no CI/CD integration, per its own page. | **[Behind]** on price per scan and on breadth of non-security checks. **[Ahead]** on SARIF, a CLI and ownership gating. |
| CheckVibe (checkvibe.dev) | Scans the live site for exposed keys, SQL injection, XSS, SSL/TLS, CORS and CSP issues. Also SEO and AI visibility. 100+ checks. | Free, Starter (1 project, 30 scans; shown as $24 and as £13), Pro $49 (5 projects, 155 scans), Team Basic and Advanced. One source says scans are free and you pay for the full report. _(Via search. Prices conflict.)_ | Pro adds daily monitoring and live threat detection. About 30 seconds a scan. | MCP server, API access, AI fix prompts, PDF export. | **[Behind]** on cadence and per-scan price. **[Parity]** on MCP. Check count favours SecScan. |
| VibeEval (vibe-eval.com) | Autonomous agents probe the deployed app for missing RLS, exposed keys, auth bypass, CORS, open buckets and IDOR. Black-box, evidence-first. | Pro $19, unlimited projects and scans, daily re-scans. Team $79 for 5 seats with GDPR, SOC2 and HIPAA gap analysis. Lifetime $199. 14-day trial. _(Via search. Check count given as 310+ and as 243+ across 13 scenarios.)_ | Anonymous tests first, then authenticated access-control tests. Captured exploits and reproducible proofs. Publishes monthly data studies. | MCP and webhook API on Team. Fix prompts for Claude Code, Cursor and Lovable. | **[Behind]** on price, cadence and evidence format. Its accuracy claims are unverified. It runs no ownership gate that I found. |

### Builder platforms that bundle security

| Company | What it checks | When and what it costs | Against SecScan |
|---|---|---|---|
| Lovable (with Aikido) | Quick scan: database access rules and RLS mistakes, npm dependencies, unauthenticated MCP exposure. Deep scan: app code for access-control and permission flaws. | Quick scan on every publish, about 10 seconds. Deep scan on demand, about 3 minutes. AI pentest powered by Aikido: $100 per test since Apr 1, 2026, refunded if nothing is found. Pro plan $25 a month. _(Via search and Lovable docs.)_ | **[Parity]** on RLS checks, but pre-publish and code-aware. SecScan is outside, continuous and cross-platform. The $100 pentest has no SecScan equivalent. |
| Bolt (bolt.new) | Agent audits six categories (access control, secrets, business logic and more), applies fixes, checks the build. | Runs on publish since July 2026. Free and uses no tokens. Database checks on all plans. Project audit on paid plans. _(Via search.)_ | **[Parity]** on the baseline. Fix-and-verify happens inside the builder, which SecScan cannot match. |
| Base44 (base44.com) | SCA, SAST, exposed secrets, missing login checks and weak data-access rules. One-click fixes. Security Center across a workspace. Optional Wiz integration. | Built in on every plan. _(Via search and Base44 docs.)_ | **[Parity]** on the baseline. Wiz is a third company worth adding to the watch list. |
| Replit (replit.com) | Security Agent: SAST and SCA with about 200 Semgrep rules, HoundDog for sensitive data, and an LLM layer that threat-models the app. Scans before publish. | Large projects can take up to 15 minutes. Replit claims the LLM layer cut false positives by 90%, which is a vendor claim. _(Via search.)_ | **[Parity]** on the baseline. Deeper on code, blind to the live site. |
| Supabase (supabase.com) | Security Advisor, built on the open-source Splinter linter: RLS disabled in public, policies without RLS, auth.users exposed, security-definer views, mutable function search paths. | Free, inside the dashboard. _(Via search and Supabase docs.)_ | **[Parity]** on the config lints. SecScan adds proof from outside that anonymous reads and writes really work. |

### Developer and enterprise scanners

| Company | What it is | Price | Agents and CI | Against SecScan |
|---|---|---|---|---|
| StackHawk (stackhawk.com) | DAST built on ZAP and configured in YAML in the repo. REST, GraphQL, SOAP and gRPC. HawkAI reads source to find undocumented endpoints. | Pro $42 per contributor per month, minimum 5. Enterprise $59, minimum 20. New Wingman tier $10 per user with 50 agentic scans. 14-day trial, no free tier. _(Via search and third party. The reports quote $39.)_ | 12+ CI platforms. Open-source MCP server and Claude Code agent skills that scan, fix and rescan. | **[Behind]** on CI and API protocols. A different buyer: StackHawk needs the code and a pipeline, SecScan needs a URL. |
| Detectify (detectify.com) | External attack surface management plus DAST. Crowdsourced detections. | Surface Monitoring €302 a month for 25 assets. Application Scanning €90. API Scanning €90. Enterprise by quote. _(Via search and third party.)_ | MCP server launched May 26, 2026, with a find, fix and validation-scan loop. | **[Behind]** on depth and surface discovery. **[Parity]** on MCP and verify-the-fix. |
| Invicti and Acunetix (invicti.com) | Enterprise DAST with proof-based scanning. Formed from Netsparker, Acunetix and Kondukto. Adds IAST, SAST, SCA, secrets and ASPM. | Invicti by quote, entry about $7,000 a year. Acunetix per target, 5-target minimum, about $1,400 per target a year at 5. _(Third party. Not on the vendor's site.)_ | Not established. | **[Behind]** on depth and proof. A different buyer and price range. Claims 99.98% accuracy, which one independent benchmark did not reproduce. |
| Burp Suite (PortSwigger) | Professional (manual and automated) and Burp Suite DAST, formerly Enterprise Edition. | Pro $499 per user a year, up from $449 on Jan 6, 2026. DAST by quote, estimated from $6,000 a year. _(Third party.)_ | Official MCP server extension on GitHub. Burp AI in Pro. | **[Behind]** on depth. Different buyer, a tester rather than an app owner. |
| Pentest-Tools.com | Website scanner, subdomain finder and network scanner with 20+ other tools, workspaces and reports. | Free, Basic $72, Advanced $162, Teams $336 a month. _(Third party.)_ | Official MCP server, local and remote. Needs a paid plan's API key. | **[Behind]** on tooling and reporting. **[Parity]** on MCP. |
| Bright Security (brightsec.com) | DAST and the Bright STAR platform with auto-fix. Covers web, APIs and LLM apps. | Pro from $99 and Business $999 a month on one source. AWS Marketplace shows $48,000 a year for one engine and $650 per developer for STAR. _(Third party. Sources disagree on tiers.)_ | Official Bright MCP server that uploads OpenAPI definitions. | **[Behind]** on LLM testing and API discovery. |
| Tenable Nessus (tenable.com) | Network and infrastructure vulnerability scanner. | Professional $4,790 a year, no web-app scanning. Expert $6,790 adds 5 web-app targets. Web App Scanning from about $3,500. _(Third party.)_ | Not established. | A different category. The reports name it only as an unbenchmarked tool. |
| Aikido (aikido.dev) | All-in-one: SAST, SCA, secrets, cloud, IaC, containers, DAST, AI autotriage and autofix, plus AI pentests. | Free for 2 users with 10 repos and 1 domain. Basic $350, Pro $700, Advanced $1,050 a month for 10 users. Pentests from $4,000. _(Third party for tiers.)_ | Powers Lovable's pentest. Pentest for AI agents. | **[Behind]** on scope. Its free domain scan is a direct substitute for SecScan's free tier. |

### Open source, single-purpose graders and AI code reviewers

| Tool | What it is | Cost and licence | Against SecScan |
|---|---|---|---|
| OWASP ZAP (now ZAP by Checkmarx) | Open-source DAST. YAML automation framework. Monthly releases. The three project leads joined Checkmarx in Sept 2024. | Free, Apache 2.0, no gated features. _(Via search.)_ | **[Parity]** on headers and TLS, per the reports. Third parties report higher false positives on single-page apps without tuning. SecScan beat it 68 to 19 on its own fixture. |
| Nuclei (ProjectDiscovery) | Template-driven scanner across HTTP, DNS, TCP, SSL and code. 12,000+ community templates. | Free, MIT. ProjectDiscovery Cloud from $250 pay-as-you-go. Neo, an AI offensive platform, went generally available Aug 4, 2026. _(Via search and GitHub.)_ | Broader on known CVEs. SecScan beat it 68 to 8 on its own fixture. No official ProjectDiscovery MCP server was confirmed, only community ones. |
| Qualys SSL Labs | Free TLS grader using 60+ browser handshake simulations. Grades A+ to F and T. No TLS 1.3 caps the grade at A-. | Free. API limits concurrent and total assessments and answers 429. _(Via search.)_ | A dependency, not a rival. SecScan's TLS grade comes from it. |
| SecurityHeaders.com | Free grader for about eight core headers. Created by Scott Helme, sold to Probely, which Snyk then acquired. | Free scanner continues. The API was shut down in April 2026. _(Via search.)_ | **[Ahead]** . SecScan covers far more than headers. |
| Claude Code security review | The /security-review command and a GitHub Action that review a diff for injection, access-control and secret issues. | Open source Action. Not hardened against prompt injection, so for trusted PRs only. _(Via search.)_ | Code-side and free. Different vantage from SecScan. |
| Cursor Bugbot | AI pull-request reviewer for bugs and security flaws. | Usage-based since June 2026, about $1.00 to $1.50 a review. A third party reports 80.45% F1 on the OpenSSF CVE benchmark. _(Via search.)_ | Code-side. The same position as the builder scans. |

## SecScan's cheapest scans cost the same as a rival's, and its Pro costs more

Plan price divided by scans included. This is arithmetic on the prices above, and the rival prices conflict in places. VibeEval's $19 plan lists unlimited scans, so it has no bar.

| Plan | Price | Scans | Per scan |
|---|---|---|---|
| Vibe App Scanner Pro | $39 | 150 | $0.26 |
| CheckVibe Pro | $49 | 155 | $0.32 |
| **SecScan Pro** | $49 | 100 | **$0.49** |
| CheckVibe Starter | $24 (or £13 on another source) | 30 | $0.80 |
| **SecScan Starter** | $19 | 20 | **$0.95** |
| Vibe App Scanner Go | $19 | 20 | $0.95 |
| **SecScan 50-scan pack** | $49 | 50 | **$0.98** |
| **SecScan 10-scan pack** | $12 | 10 | **$1.20** |
| VibeEval Pro | $19 | unlimited | n/a |

### What the table leaves out

SecScan's plans include monitored sites with hourly pulse and CVE checks, and scheduler rescans do not spend the allowance. A rival's per-scan price may not include that. Read the table as the cost of a manual scan, not the cost of coverage.

## Where the research disagrees with what the reports say about the field

| Claim in the reports | What the research found | Status |
|---|---|---|
| StackHawk costs $39 per contributor per month. | Pro $42 per contributor (minimum 5) and Enterprise $59 (minimum 20). A $10 per user Wingman tier is new. | **[Out of date]** |
| Rivals charge $19 to $49 a month for 20 to 250 scans. | VibeEval's $19 plan lists unlimited scans. CheckVibe Pro is 155 scans. No 250-scan plan appeared in the sources. | **[Partly right]** |
| Detectify, StackHawk, Pentest-Tools, PortSwigger, Bright, ProjectDiscovery, CheckVibe and Vibe App Scanner all have an MCP server. | Confirmed for seven. Detectify launched its on May 26, 2026. ProjectDiscovery's own server was not confirmed, though community Nuclei servers exist. | **[Mostly right]** |
| Lovable sells a $100 live-app pentest, refunded if nothing is found. | Confirmed. Launched April 1, 2026, powered by Aikido, with a zero-findings refund. | **[Confirmed]** |
| Lovable runs a free scan on every publish. | Confirmed. The quick scan runs in about 10 seconds and covers RLS, dependencies and MCP exposure. | **[Confirmed]** |
| Replit, Bolt, Base44 and Supabase bundle checks. | Confirmed, and Bolt's July 2026 publish audit now also fixes issues and verifies the build. | **[Confirmed]** |
| Aikido powers Lovable's pentest. | Confirmed. | **[Confirmed]** |
| securityheaders.com is a long-standing grader. | True, and its API was shut down by Snyk in April 2026. | **[Add a note]** |
| Invicti, Burp and Detectify have years more depth. | Consistent with the research. Invicti's accuracy claim is contested by one independent benchmark. | **[Consistent]** |

## How far to trust this

The 17 grading and test reports were read in the grading-the-grader repo and every company, platform and tool they name as a competitor, a bundled check or a comparison was pulled out and searched for on October 3, 2026.

**The network blocked the vendors' own sites.** Fetching zaproxy.org, portswigger.net, stackhawk.com, vibeappscanner.com, checkvibe.dev and vibe-eval.com was refused by the session's egress policy, and it was not worked around. Only github.com could be fetched. Every fact here therefore comes from search-engine summaries of vendor pages and from third-party review and pricing sites. No vendor page was read in full, and no competitor's scanner was run.

**Prices are the weakest facts.** Several conflict between sources (CheckVibe, Bright, Detectify's starter tier). Enterprise prices come from aggregators and quote requests, not price lists. Treat any number as a starting point to confirm on the vendor's page.

**Left out on purpose.** Scan-target sites in the sweeps (Stripe, GitHub, Google and the rest), hosting vendors named as environments (Vercel, Cloudflare, Render, Railway, Netlify), and the detection-rule sources (webappanalyzer, wafw00f, TruffleHog, OSV.dev, can-i-take-over-xyz). The Seclayer reports were also left out, at Carlos's request. Seclayer is a sibling product, so its own comparison belongs in its own repository.

**Rankings are judgement.** The ranked list weighs how many rivals offer a thing and how much the reports already admit the gap. Reasonable people could reorder it.

## Sources

Search summaries and pages these facts came from (accessed 2026-10-03):

- [Vibe App Scanner pricing](https://vibeappscanner.com/pricing)
- [Vibe App Scanner: best AI security scanner](https://vibeappscanner.com/best-ai-security-scanner)
- [Vibe App Scanner on AppSumo](https://appsumo.com/products/vibe-app-scanner/)
- [CheckVibe pricing](https://checkvibe.dev/pricing)
- [About CheckVibe](https://checkvibe.dev/about)
- [VibeEval](https://vibe-eval.com/)
- [VibeEval methodology](https://vibe-eval.com/methodology/)
- [VibeEval: Vibe App Scanner alternatives](https://vibe-eval.com/alternatives/vibeappscanner)
- [DEV: I Tested Every Vibe Coding Security Scanner](https://dev.to/solobillions/i-tested-every-vibe-coding-security-scanner-2026-heres-what-actually-works-p9k)
- [AppSec Santa: StackHawk vs ZAP](https://appsecsanta.com/dast-tools/stackhawk-vs-zap)
- [Beagle Security: StackHawk pricing](https://beaglesecurity.com/blog/article/stackhawk-pricing.html)
- [StackHawk MCP server](https://www.stackhawk.com/blog/mcp-server-for-security-scanning/)
- [StackHawk agent skills for Claude Code](https://docs.stackhawk.com/ai-security/agent-skills/claude-code/)
- [Detectify pricing](https://detectify.com/pricing)
- [Detectify MCP server launch](https://newsroom.detectify.com/detectify-launches-mcp-server-to-secure-the-autonomous-coding-loop)
- [AppSec Santa: Invicti review](https://appsecsanta.com/invicti)
- [Beagle Security: Invicti pricing](https://beaglesecurity.com/blog/article/invicti-pricing.html)
- [Acunetix pricing 2026](https://pentest.ae/blog/acunetix-pricing-2026/)
- [AIMultiple: DAST benchmarking results](https://aimultiple.com/dast-tools)
- [Burp Suite pricing 2026](https://codeant.ai/blogs/burp-suite-pricing)
- [PortSwigger Burp MCP server](https://github.com/PortSwigger/mcp-server)
- [Pentest-Tools MCP overview](https://pentest-tools.com/docs/ai/mcp/overview)
- [Pentest-Tools pricing](https://www.capterra.com/p/211194/Pentest-Tools-com/alternatives/)
- [Bright Security DAST pricing](https://brightsec.com/research/dast-pricing-and-cost-drivers-2026/)
- [AppSec Santa: Bright Security](https://appsecsanta.com/bright-security)
- [Nessus pricing 2026](https://www.penetrify.cloud/en/pricing/nessus/)
- [Aikido pricing](https://www.aikido.dev/pricing)
- [Lovable and Aikido pentesting](https://lovable.dev/blog/announcing-pentesting)
- [Lovable security overview](https://docs.lovable.dev/features/security)
- [Bolt: security audit on publish](https://bolt.new/blog/security-audit-on-publish)
- [Base44: running a security scan](https://docs.base44.com/Setting-up-your-app/running-a-security-scan)
- [Replit Security Agent](https://replit.com/blog/meet-replit-security-agent)
- [Supabase Security Advisor](https://supabase.com/blog/security-performance-advisor)
- [AppSec Santa: ZAP review](https://appsecsanta.com/zap)
- [Nuclei on GitHub](https://github.com/projectdiscovery/nuclei)
- [AppSec Santa: Nuclei review](https://appsecsanta.com/nuclei)
- [Qualys SSL grading](https://docs.qualys.com/en/certview/latest/scans/ssl_grading.htm)
- [SSL Labs API v4](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v4.md)
- [Security Headers joins Probely](https://scotthelme.co.uk/security-headers-is-joining-probely/)
- [Claude Code security review Action](https://github.com/anthropics/claude-code-security-review)
- [Cursor Bugbot](https://cursor.com/docs/bugbot)
