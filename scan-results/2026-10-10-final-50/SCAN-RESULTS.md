# SecScan, held-out final 50: passive sweep, 2026-10-10

Raw output: [`raw.json`](raw.json), which is the five files in [`batches/`](batches/) concatenated with every result left untouched. Independent re-check: [`VERIFICATION.md`](VERIFICATION.md). URL list: [`../2026-10-10-final-50.txt`](../2026-10-10-final-50.txt). The scripts that produced every number here are in [`scripts/`](scripts/). Marks follow `AGENTS.md`.

## Summary

- **48 of 50 sites scanned. 621 findings, 259 of them above info: 0 critical, 44 high, 103 medium, 112 low, 362 info** (**Verified**: tallied from `raw.json` by `scripts/summarize-capture.mjs`).
- **Engine.** Scanner repo `master` at `e3d58753ecfe068de5f4cf290128092d330866ce` (`e3d5875`, which includes PRs 39 and 41). Passive: `live-scan.ts` without `--active`. Run 17:09 to 17:21 UTC (**Reran**; `run.log`). Master has since moved to `ac8fdf6` (PR 38, merged 17:02 UTC, live from 17:05): it changes how SRI and source maps are read and makes `live-scan.ts` render SPAs. The abandoned second attempt below ran exactly that tree (`92f27fe` and `ac8fdf6` have the same tree hash), and its first batch of 10 sites had finding lists identical to this run's (**Reran**; console log only). None of the 48 sites needed rendering, so these results should hold for the deployed engine, but only those 10 were compared (**Inference** for the rest).
- **Re-check.** Of the 501 findings that have an independent check, 477 were confirmed against the live site, 5 were contradicted (all on one site, elastic.co, which answered the scan with HTTP 406), 2 did not reproduce, and 17 could not be re-derived because laravel.com (10) and css-tricks.com (7) were rate-limiting the re-fetch. 120 findings have no check coded. See `VERIFICATION.md`.
- **A gap the re-check cannot see.** SecScan reported no "Missing HSTS" finding on any of the 48 sites, nor on the 50 sites of the 2026-10-05 sweep. Six sites in this run send no `Strict-Transport-Security` header and are not on the preload list. That is a false negative, found only by comparing with a second scanner's capture of the same sites. See "Missing HSTS is suppressed" below.
- **This is a record, not a clean bill.** One passive pass over 48 large public sites does not show SecScan is free of false positives or false negatives.

## Coverage

- **Not reached (2).** `gnu.org` failed in the main run and again on a retry (`batches/retry-gnu-npr.json`) with "fetch failed". A direct check afterwards found that curl and Node, with and without the scanner's User-Agent, all hit a TCP connect timeout to both of its addresses (IPv6 and IPv4, port 443) from this PC (**Reran**). So it is a network-level refusal or outage, not a scanner fault. The same site scanned without trouble about 30 minutes earlier, in the stopped first attempt (below), so a temporary block after that scan is possible (**Inference**). `npr.org` timed out at 20 seconds in the main run and in the retry.
- **Scanned from a challenge or rate-limit page (3).** `sqlite.org` (HTTP 503, a 95-byte body), `hashicorp.com` and `zendesk.com` (HTTP 429). The scanner reported "Scan was intercepted by a bot-protection challenge" and withheld the header findings, as designed. DNS and mail findings were kept (`sqlite.org` kept a medium DMARC `p=none` and a low mail-certificate-expiry finding). `sqlite.org` and `zendesk.com` had answered normally in the first attempt; `hashicorp.com` was already challenged then (**Reran**).
- **Scanned from an error page (1).** `elastic.co` answered HTTP 406. See "Findings from an error page keep full severity" below.
- **Browser rendering.** `renderedWithBrowser` is false for all 48 sites, as in every earlier sweep, so the headless-browser path was not exercised again (**Verified**: the field in `raw.json`). PR 38 makes `live-scan.ts` start the browser, so the next sweep will exercise it.
- **TLS.** `live-scan.ts` does not produce a TLS grade, so none is reported here.
- **Time.** Mean 11.5 seconds a site (**Verified**: `elapsedMs` in `raw.json`).

## The 44 high findings, and how the re-check came out

"Not re-derived" means the site refused the re-fetch (HTTP 429 at laravel.com and css-tricks.com), so the claim is neither confirmed nor contradicted.

| high finding | Count | Confirmed | Contradicted | Not re-derived |
|---|---:|---:|---:|---:|
| Missing Content-Security-Policy (CSP) | 23 | 20 | 1 | 2 |
| Missing DMARC Record — No Email Authentication Enforcement | 7 | 7 | 0 | 0 |
| Missing SPF Record — Email Spoofing Possible | 5 | 5 | 0 | 0 |
| JavaScript Source Map Exposed — Full Source Code Accessible | 5 | 3 | 0 | 2 |
| Content-Security-Policy Missing on N Internal Route | 2 | 2 | 0 | 0 |
| Session Cookie Missing Secure Flag on Inner Page | 1 | 1 | 0 | 0 |
| Content-Security-Policy Missing on N Internal Routes | 1 | 1 | 0 | 0 |

## Every site

| Site | HTTP | Server | Findings | Actionable | High | Medium | Low | Info |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| airtable.com | 200 | Vercel | 11 | 3 | 1 | 2 | 0 | 8 |
| angular.dev | 200 |  | 11 | 7 | 3 | 2 | 2 | 4 |
| arstechnica.com | 200 |  | 15 | 6 | 0 | 3 | 3 | 9 |
| astro.build | 200 | cloudflare | 14 | 8 | 3 | 3 | 2 | 6 |
| aws.amazon.com | 200 | Server | 18 | 8 | 1 | 3 | 4 | 10 |
| calendly.com | 200 | cloudflare | 8 | 4 | 0 | 2 | 2 | 4 |
| cloud.google.com | 200 | ESF | 9 | 3 | 0 | 1 | 2 | 6 |
| coursera.org | 200 | envoy | 14 | 4 | 1 | 0 | 3 | 10 |
| crowdstrike.com | 200 |  | 10 | 5 | 0 | 2 | 3 | 5 |
| css-tricks.com | 200 | cloudflare | 13 | 6 | 4 | 1 | 1 | 7 |
| debian.org | 200 | Apache | 9 | 2 | 1 | 1 | 0 | 7 |
| dev.to | 200 | Heroku | 14 | 3 | 0 | 1 | 2 | 11 |
| djangoproject.com | 200 | nginx | 11 | 4 | 1 | 3 | 0 | 7 |
| docker.com | 200 | nginx | 9 | 2 | 1 | 1 | 0 | 7 |
| duolingo.com | 200 | duo-api | 14 | 6 | 1 | 2 | 3 | 8 |
| elastic.co | 406 |  | 17 | 4 | 1 | 1 | 2 | 13 |
| go.dev | 200 | Google Frontend | 17 | 7 | 2 | 1 | 4 | 10 |
| grafana.com | 200 | nginx | 13 | 6 | 1 | 2 | 3 | 7 |
| hashicorp.com (challenge) | 429 | Vercel | 3 | 0 | 0 | 0 | 0 | 3 |
| intercom.com | 200 | Vercel | 10 | 4 | 0 | 2 | 2 | 6 |
| kernel.org | 200 | nginx | 13 | 4 | 0 | 2 | 2 | 9 |
| khanacademy.org | 200 |  | 18 | 8 | 0 | 4 | 4 | 10 |
| kubernetes.io | 200 | Netlify | 12 | 6 | 2 | 2 | 2 | 6 |
| laravel.com | 200 | cloudflare | 13 | 5 | 2 | 1 | 2 | 8 |
| linuxfoundation.org | 200 | cloudflare | 16 | 8 | 1 | 4 | 3 | 8 |
| mailchimp.com | 200 | istio-envoy | 12 | 5 | 1 | 2 | 2 | 7 |
| miro.com | 200 |  | 19 | 8 | 1 | 3 | 4 | 11 |
| news.ycombinator.com | 200 | nginx | 19 | 10 | 1 | 5 | 4 | 9 |
| nodejs.org | 200 | cloudflare | 11 | 4 | 1 | 1 | 2 | 7 |
| openstreetmap.org | 200 | Apache | 13 | 6 | 0 | 3 | 3 | 7 |
| owasp.org | 200 | Vercel | 8 | 2 | 0 | 1 | 1 | 6 |
| playwright.dev | 200 | GitHub.com | 14 | 6 | 1 | 3 | 2 | 8 |
| postgresql.org | 200 | nginx | 16 | 7 | 0 | 4 | 3 | 9 |
| posthog.com | 200 | Vercel | 14 | 7 | 1 | 3 | 3 | 7 |
| prometheus.io | 200 | cloudflare | 14 | 7 | 3 | 1 | 3 | 7 |
| redis.io | 200 | cloudflare | 13 | 6 | 0 | 2 | 4 | 7 |
| rubyonrails.org | 200 | GitHub.com | 13 | 6 | 1 | 3 | 2 | 7 |
| rust-lang.org | 200 | GitHub.com | 13 | 6 | 1 | 3 | 2 | 7 |
| snyk.io | 200 | Vercel | 11 | 5 | 1 | 2 | 2 | 6 |
| sqlite.org (challenge) | 503 |  | 6 | 2 | 0 | 1 | 1 | 4 |
| squarespace.com | 200 | Squarespace | 20 | 8 | 1 | 2 | 5 | 12 |
| theverge.com | 200 |  | 19 | 7 | 0 | 3 | 4 | 12 |
| typescriptlang.org | 200 | GitHub.com | 17 | 7 | 2 | 3 | 2 | 10 |
| ubuntu.com | 200 | nginx/1.14.0 (Ubuntu) | 9 | 5 | 0 | 3 | 2 | 4 |
| vite.dev | 200 | Netlify | 14 | 8 | 2 | 3 | 3 | 6 |
| webflow.com | 200 |  | 16 | 9 | 0 | 4 | 5 | 7 |
| zalando.com | 200 | AmazonS3 | 14 | 5 | 1 | 2 | 2 | 9 |
| zendesk.com (challenge) | 429 | cloudflare | 4 | 0 | 0 | 0 | 0 | 4 |

## Most common findings

| Finding | Severity | Sites |
|---|:--:|---:|
| Active security testing was skipped for this scan | info | 48 |
| Missing Cross-Origin-Embedder-Policy (COEP) | info | 43 |
| Missing Cross-Origin-Resource-Policy (CORP) | info | 41 |
| DNSSEC Not Enabled | info | 40 |
| Missing Cross-Origin-Opener-Policy (COOP) | info | 37 |
| Missing Permissions-Policy Header | low | 36 |
| Missing Referrer-Policy Header | low | 30 |
| Missing security.txt (RFC N) | info | 24 |
| Missing Content-Security-Policy (CSP) | high | 23 |
| Missing X-Content-Type-Options: nosniff | medium | 22 |
| Rate Limiting Not Advertised in Response Headers | info | 20 |
| External Resources Missing Subresource Integrity (SRI) | medium | 17 |
| Missing Clickjacking Protection (X-Frame-Options) | medium | 17 |
| CSP Missing base-uri Directive | low | 14 |
| CSP Missing object-src 'none' Directive | medium | 13 |
| No Structured Data Found | info | 13 |
| Non-Session Cookie Readable by JavaScript | info | 12 |
| robots.txt Discloses Sensitive Application Paths | info | 12 |
| Incomplete Open Graph Metadata | info | 11 |
| Missing Cache-Control Headers | info | 10 |
| Non-Session Cookie Missing SameSite Attribute | info | 10 |
| Non-Session Cookie Missing Secure Flag | low | 10 |
| X-Powered-By Header Discloses Technology Stack | info | 10 |
| DMARC Policy Set to None (Monitoring Only — No Enforcement) | medium | 9 |
| Missing SPF Record — Email Spoofing Possible | high 5, medium 3 | 8 |
| Missing DMARC Record — No Email Authentication Enforcement | high | 7 |
| Weak Content-Security-Policy (unsafe-inline / unsafe-eval in script-src) | medium | 7 |
| Permissive CORS Policy (Wildcard Origin) | info | 6 |
| JavaScript Source Map Exposed — Full Source Code Accessible | high | 5 |
| Content-Security-Policy Allows Inline Styles (unsafe-inline in style-src) | low | 4 |
| DMARC Record Missing Aggregate Report Address (rua=) | info | 4 |
| HSTS max-age Too Short | low | 3 |
| JavaScript Source Map Exposed — Third-Party Library Code | low | 3 |
| Non-Session Cookie Readable by JavaScript on Inner Page | info | 3 |
| Scan was intercepted by a bot-protection challenge | info | 3 |
| Twitter Card Metadata Absent | info | 3 |
| Content-Security-Policy is report-only (not enforced) | medium | 2 |
| Content-Security-Policy Missing on N Internal Route | high | 2 |
| Exposed API Documentation — OpenAPI JSON spec at /openapi.json | info | 2 |
| Google API Key in Client Code (verify referrer restrictions) | info | 2 |
| HTTP Traffic Not Redirected to HTTPS | medium | 2 |
| No DKIM Records Found Under Common Selectors | low | 2 |
| Referrer-Policy Missing on N Internal Route | low | 2 |
| Session Cookie Missing HttpOnly Flag on Inner Page | medium | 2 |
| Strict-Transport-Security Missing on N Internal Routes | low | 2 |
| X-Content-Type-Options Missing on N Internal Routes | medium | 2 |
| X-Frame-Options / frame-ancestors Missing on N Internal Routes | medium | 2 |
| Apache Server Info Page Exposed | medium | 1 |
| Apache Server Status Page Exposed | medium | 1 |
| API Key in Client Code (verify restrictions) | info | 1 |
| Content-Security-Policy Missing on N Internal Routes | high | 1 |
| Exposed API Documentation — OpenAPI YAML spec at /openapi.yaml | info | 1 |
| Exposed API Documentation — Swagger N.N JSON spec at /swagger.json | info | 1 |
| Exposed API Documentation — Versioned API docs at /api/vN/docs | info | 1 |
| Mail Server TLS Certificate Expiring Soon | low | 1 |
| Mapbox Public Token — Restrict to Your Domain | info | 1 |
| Nginx N.N.N — Verify Distro Package Against CVE-N-N | low | 1 |
| Non-Session Cookie Missing Secure Flag on Inner Page | low | 1 |
| Referrer-Policy Missing on N Internal Routes | low | 1 |
| Scan started from an error response | info | 1 |
| Server Version Disclosure | info | 1 |
| Session Cookie Missing Secure Flag on Inner Page | high | 1 |
| Social Preview Asset Referenced Over HTTP | low | 1 |
| SPF Record Uses ?all (Neutral — No Enforcement) | medium | 1 |
| Strict-Transport-Security Missing on N Internal Route | low | 1 |
| X-Frame-Options / frame-ancestors Missing on N Internal Route | medium | 1 |

## Things worth Carlos's attention

Each is an observation with its evidence, not a verdict. Nothing has been changed in the scanner repo.

### Missing HSTS is suppressed for sites that redirect HTTP to HTTPS

- **What.** No "Missing HTTP Strict-Transport-Security (HSTS)" finding appears in this run (0 of 48) or in the 2026-10-05 sweep (0 of 50) (**Verified**: counted in the two captures).
- **Six sites in this run send no `Strict-Transport-Security` header, are not on the preload list, and got no finding:** astro.build, duolingo.com, khanacademy.org, rubyonrails.org, zalando.com, sqlite.org. The header is absent on a normal HTTP 200 response, and the hstspreload.org API answers `unknown` for all but khanacademy.org, which it lists as `removed` (**Reran**: one GET each). A seventh, elastic.co, sends no header either but is preloaded, so no finding is correct there. laravel.com and hashicorp.com could not be judged (they answered 429).
- **Why (code).** `scannerHstsPreload.ts` suppresses the finding when `http://<host without www>/` ends on an `https://` URL after redirects (lines 64 to 65). Nearly every site redirects, and that redirect is the exact gap HSTS closes, because the first request is still plain HTTP. The function's own doc comment (lines 4 to 15) states the opposite rule: suppress when HTTP is served without redirecting. (**Verified** by reading `e3d5875`.) That this redirect rule is what suppressed these six is an **Inference**: the preload API, the only other suppressor, answered `unknown` or `removed`.
- **It also tests a different host from the one scanned.** The scanned host for khanacademy.org is `www.khanacademy.org`, which serves plain HTTP with no redirect (HTTP 200, **Reran**), and SecScan reported "HTTP Traffic Not Redirected to HTTPS" for it in the same scan. The HSTS check looked at the apex, `khanacademy.org`, which does redirect, and suppressed the finding. djangoproject.com shows the same pair.
- **Decision for Carlos, not made:** `docs/DECISIONS.md`, item 13.

### Findings from an error page keep full severity

- `elastic.co` answered this scan with HTTP 406 (some web application firewalls refuse a client that way; **Inference**). The scanner added the info note "Scan started from an error response", then reported header findings read from the 406 page, including a **high** "Missing Content-Security-Policy" and a **medium** "Missing Clickjacking Protection". The live page has a CSP header and a `frame-ancestors` directive: five of the scan's claims about it are contradicted (`VERIFICATION.md`). The same engine had seen the real page about 30 minutes earlier, and a re-fetch at 17:23 UTC got HTTP 200.
- This is the designed behaviour. `rootErrorFinding` in `scannerCoverage.ts` says the findings "describe that response", and the test in `scanner.gate.test.ts` is titled "says when the start page was an error response, and keeps the findings" (**Verified**: read at `e3d5875`). Bot-challenge pages and platform gates are withheld; other 4xx and 5xx pages are not. A reader who skips the info note would take a high finding about elastic.co from a page its visitors never got.
- **Decision for Carlos, not made:** `docs/DECISIONS.md`, item 14.

### Smaller items, not verified

- **"Session cookie" is decided by name.** The re-check confirms the flags in the four session-cookie findings (aws.amazon.com: `JSESSIONID` high for no `Secure`, `aws-session-id` and `aws-session-id-time` medium for no `HttpOnly`; khanacademy.org: `browsing_session_id` medium for no `HttpOnly`). It does not confirm that these cookies carry authentication. `aws-session-id-time` looks like a timestamp that sits beside the session id (**Inference**, from its name).
- **A vendor's source map counts as the site's own.** linuxfoundation.org's high "Source Map Exposed: Full Source Code Accessible" is `/hs/hsstatic/content-cwv-embed/static-1.1293/embed.js.map`. That is the same file, at the same path, that produced the same high finding at hubspot.com on 2026-10-05 (**Verified**: both captures), so it looks like HubSpot's own code served on every HubSpot-hosted site (**Inference**). The map is real, public and includes its source (confirmed); whose code it is, is a judgement. PR 38 fixed the same class for Segment's code on dashboard.render.com by reading the served HTML, not by changing the rule that counts anything outside `node_modules` as the site's own, so a vendor map linked from the served HTML would still be rated the site's (**Inference**).

### Run-to-run stability

The first attempt (below) used the same engine commit about 30 minutes earlier. Of the 37 sites in both runs, 31 had identical finding lists. Six differed. Three because a defence changed state: `sqlite.org` (503), `zendesk.com` (429) and `elastic.co` (406) had all answered with the real page the first time. Three from the crawl: `nodejs.org` lost an internal-route HSTS finding, `ubuntu.com` lost a high source-map finding and a robots.txt finding, `snyk.io` gained three internal-route findings (**Reran**: `scripts/stability.mjs`; the first attempt survives only as a console log, kept in `stopped-first-attempt/`, so its comparison uses finding names, not evidence).

## How this run was made

Three attempts. Only the third is the result.

1. **First attempt, 16:40 UTC**, shared working tree at `master` `e3d5875`. Stopped at 38 of 50 when Claude Code's memory-pressure reaper ended the job: the PC had 1.2 GB of 15.7 GB free, WSL's VM held about 6 GB, and the scan itself used about 220 MB and started no browser. The reaper ended the tool wrapper but not the processes, which were then ended by hand. `live-scan.ts` writes its JSON only when a run finishes, so no capture exists; the console log is in `stopped-first-attempt/`.
2. **Second attempt, 17:04 UTC**, abandoned after one batch. Between the attempts something other than this session switched the shared scanner checkout from `master` to the branch `fix-live-scan-render`, which makes `live-scan.ts` start a headless browser and changes four engine files. That branch was merged as PR 38 at 17:02 UTC, and the switch (with a merge of `master` into the branch at 11:52 local, ten minutes before) was most likely the session preparing that merge (**Inference**). The batch ran that code, which was not yet the engine under test, so it was stopped and its output was not used. That checkout was left as found.
3. **This run, 17:09 UTC.** A read-only `git archive` export of `e3d5875`, with its own `@workspace` packages and the shared package store linked in, so nothing in the shared checkout could change under it. Five batches of ten sites, each with its own capture; a 700 MB free-memory floor before each batch (never reached); heap capped at 1 GB. A one-site smoke test on nodejs.org (11 findings) differed from the first attempt (12) only by an internal-route HSTS finding that varies between visits.

## Limits

- Passive checks only, no authentication, one pass, 48 large public sites chosen for being large. It says nothing about small or vibe-coded apps (decision 1a).
- The re-check confirms what the scanner reported. It cannot find what the scanner missed. The HSTS gap above was found only by comparing with another scanner's capture of the same sites.
- 120 findings have no independent check (DNSSEC, "active testing skipped", rate-limit headers, API keys in client code and a few others; the table is in `VERIFICATION.md`).
- SecScan is not claimed to be free of false positives or false negatives.
