# SecScan, held-out final 50: independent re-check, 2026-10-10

Input: [`raw.json`](raw.json). Output: [`verification.json`](verification.json), one record per finding. Script: [`scripts/verify-secscan.mjs`](scripts/verify-secscan.mjs). Results of the scan itself: [`SCAN-RESULTS.md`](SCAN-RESULTS.md). Marks follow `AGENTS.md`.

## Method

The script shares no code with the scanner. For each finding it fetches the live page, or the file the finding names, and recomputes the claim from what comes back:

- **Headers.** Present or absent, with values parsed where the claim depends on one (HSTS `max-age`, CORS, `Server`, `X-Powered-By`, X-Frame-Options value).
- **Content-Security-Policy.** Parsed into directives: missing policy, report-only only, missing `object-src 'none'`, missing `base-uri`, `'unsafe-inline'` and `'unsafe-eval'` (an inline allowance cancelled by a nonce, hash or `'strict-dynamic'` does not count), a bare `*` in `script-src`, inline styles.
- **DNS.** TXT lookups at the host and each parent for DMARC (record, `p=`, `rua=`) and SPF (record, `?all`).
- **Cookies.** The cookie's `Set-Cookie` line on a re-fetch of the home page, or of the inner page the finding names, checked for `HttpOnly`, `Secure` and `SameSite`.
- **Files.** Source maps (valid JSON with `sources` and `mappings`, and `sourcesContent` when the finding says source is included), OpenAPI and Swagger specs, `robots.txt` Disallow lines, `security.txt`, `.gitignore`, and the Apache `server-status` and `server-info` pages (by their page signatures).
- **Page content.** Subresource-integrity tags, mixed content, Open Graph, Twitter card, structured data, canonical link.
- **Internal routes.** Up to four of the routes a finding names, re-fetched.

It sends the scanner's own User-Agent and makes the same kind of single GET (or DNS lookup) the scan did. It never tries to get past a refusal: HTTP 401, 403, 406, 429, 451 or 503, or challenge-page markers, are recorded as "refused". **Confirmed** means the claim is true of the live response when the re-check ran, 17:23 to 17:29 UTC, between 3 and 20 minutes after the scan of the same site. Sites change in that time (see "Run-to-run stability" in `SCAN-RESULTS.md`).

## Result

- **621 findings on 48 sites. 501 have an independent check; 120 do not.**
- **Confirmed: 477.**
- **Contradicted by the live site: 5.** All on elastic.co, which answered the scan with HTTP 406 (below).
- **Did not reproduce: 2.** `sqlite.org`'s "intercepted by a bot-protection challenge" (the site answered 200 on the re-fetch), and one `crowdstrike.com` cookie (`AKA_A2`) that was not set on the re-fetch.
- **Refused, not re-derived: 17.** `laravel.com` (10) and `css-tricks.com` (7) answered HTTP 429. `hashicorp.com` and `zendesk.com` refused as well, but had no header findings to check.
- "477 of 501" is not an accuracy rate for the scanner. The 501 are not a random sample, the checks differ in how hard they are to pass (an absent header is easy to confirm, a judgement like a weak CSP is not), and the 17 not re-derived are the sites most actively defending themselves.

## By finding

| Finding | Checked | Confirmed | Disagrees | Not reproduced | Refused |
|---|---:|---:|---:|---:|---:|
| Missing Cross-Origin-Embedder-Policy (COEP) | 43 | 41 | 0 | 0 | 2 |
| Missing Cross-Origin-Resource-Policy (CORP) | 41 | 39 | 0 | 0 | 2 |
| Missing Cross-Origin-Opener-Policy (COOP) | 37 | 35 | 0 | 0 | 2 |
| Missing Permissions-Policy Header | 36 | 34 | 0 | 0 | 2 |
| Missing Referrer-Policy Header | 30 | 30 | 0 | 0 | 0 |
| Missing security.txt (RFC N) | 24 | 23 | 0 | 0 | 1 |
| Missing Content-Security-Policy (CSP) | 23 | 20 | 1 | 0 | 2 |
| Missing X-Content-Type-Options: nosniff | 22 | 22 | 0 | 0 | 0 |
| External Resources Missing Subresource Integrity (SRI) | 17 | 15 | 0 | 0 | 2 |
| Missing Clickjacking Protection (X-Frame-Options) | 17 | 16 | 1 | 0 | 0 |
| CSP Missing base-uri Directive | 14 | 14 | 0 | 0 | 0 |
| CSP Missing object-src 'none' Directive | 13 | 13 | 0 | 0 | 0 |
| No Structured Data Found | 13 | 12 | 1 | 0 | 0 |
| Non-Session Cookie Readable by JavaScript | 12 | 12 | 0 | 0 | 0 |
| robots.txt Discloses Sensitive Application Paths | 12 | 12 | 0 | 0 | 0 |
| Incomplete Open Graph Metadata | 11 | 10 | 1 | 0 | 0 |
| Missing Cache-Control Headers | 10 | 9 | 1 | 0 | 0 |
| Non-Session Cookie Missing SameSite Attribute | 10 | 9 | 0 | 1 | 0 |
| Non-Session Cookie Missing Secure Flag | 10 | 10 | 0 | 0 | 0 |
| X-Powered-By Header Discloses Technology Stack | 10 | 9 | 0 | 0 | 1 |
| DMARC Policy Set to None (Monitoring Only — No Enforcement) | 9 | 9 | 0 | 0 | 0 |
| Missing SPF Record — Email Spoofing Possible | 8 | 8 | 0 | 0 | 0 |
| Missing DMARC Record — No Email Authentication Enforcement | 7 | 7 | 0 | 0 | 0 |
| Weak Content-Security-Policy (unsafe-inline / unsafe-eval in script-src) | 7 | 7 | 0 | 0 | 0 |
| Permissive CORS Policy (Wildcard Origin) | 6 | 6 | 0 | 0 | 0 |
| JavaScript Source Map Exposed — Full Source Code Accessible | 5 | 3 | 0 | 0 | 2 |
| Content-Security-Policy Allows Inline Styles (unsafe-inline in style-src) | 4 | 4 | 0 | 0 | 0 |
| DMARC Record Missing Aggregate Report Address (rua=) | 4 | 4 | 0 | 0 | 0 |
| Non-Session Cookie Readable by JavaScript on Inner Page | 4 | 4 | 0 | 0 | 0 |
| HSTS max-age Too Short | 3 | 3 | 0 | 0 | 0 |
| JavaScript Source Map Exposed — Third-Party Library Code | 3 | 2 | 0 | 0 | 1 |
| Scan was intercepted by a bot-protection challenge | 3 | 2 | 0 | 1 | 0 |
| Session Cookie Missing HttpOnly Flag on Inner Page | 3 | 3 | 0 | 0 | 0 |
| Twitter Card Metadata Absent | 3 | 3 | 0 | 0 | 0 |
| Content-Security-Policy is report-only (not enforced) | 2 | 2 | 0 | 0 | 0 |
| Content-Security-Policy Missing on N Internal Route | 2 | 2 | 0 | 0 | 0 |
| Exposed API Documentation — OpenAPI JSON spec at /openapi.json | 2 | 2 | 0 | 0 | 0 |
| Referrer-Policy Missing on N Internal Route | 2 | 2 | 0 | 0 | 0 |
| Strict-Transport-Security Missing on N Internal Routes | 2 | 2 | 0 | 0 | 0 |
| X-Content-Type-Options Missing on N Internal Routes | 2 | 2 | 0 | 0 | 0 |
| X-Frame-Options / frame-ancestors Missing on N Internal Routes | 2 | 2 | 0 | 0 | 0 |
| Apache Server Info Page Exposed | 1 | 1 | 0 | 0 | 0 |
| Apache Server Status Page Exposed | 1 | 1 | 0 | 0 | 0 |
| Content-Security-Policy Missing on N Internal Routes | 1 | 1 | 0 | 0 | 0 |
| Exposed API Documentation — OpenAPI YAML spec at /openapi.yaml | 1 | 1 | 0 | 0 | 0 |
| Exposed API Documentation — Swagger N.N JSON spec at /swagger.json | 1 | 1 | 0 | 0 | 0 |
| Exposed API Documentation — Versioned API docs at /api/vN/docs | 1 | 1 | 0 | 0 | 0 |
| Non-Session Cookie Missing Secure Flag on Inner Page | 1 | 1 | 0 | 0 | 0 |
| Referrer-Policy Missing on N Internal Routes | 1 | 1 | 0 | 0 | 0 |
| Server Version Disclosure | 1 | 1 | 0 | 0 | 0 |
| Session Cookie Missing Secure Flag on Inner Page | 1 | 1 | 0 | 0 | 0 |
| SPF Record Uses ?all (Neutral — No Enforcement) | 1 | 1 | 0 | 0 | 0 |
| Strict-Transport-Security Missing on N Internal Route | 1 | 1 | 0 | 0 | 0 |
| X-Frame-Options / frame-ancestors Missing on N Internal Route | 1 | 1 | 0 | 0 | 0 |


## Contradicted by the live site

| Site | Severity | Finding | Detail |
|---|:--:|---|---|
| www.elastic.co | high | Missing Content-Security-Policy (CSP) | CSP present on re-fetch (header=true, meta=true) |
| www.elastic.co | medium | Missing Clickjacking Protection (X-Frame-Options) | XFO="", frame-ancestors=true |
| www.elastic.co | info | Missing Cache-Control Headers | Cache-Control="public, max-age=3600" Pragma="" |
| www.elastic.co | info | No Structured Data Found | ld+json present in HTML |
| www.elastic.co | info | Incomplete Open Graph Metadata | now present with content: og:title og:description og:image |


## Did not reproduce

| Site | Severity | Finding | Detail |
|---|:--:|---|---|
| www.sqlite.org | info | Scan was intercepted by a bot-protection challenge | re-fetch served HTTP 200 with no challenge markers |
| www.crowdstrike.com | info | Non-Session Cookie Missing SameSite Attribute | none of AKA_A2 in this re-fetch's Set-Cookie (varies per visit) |


## Why the five elastic.co claims are contradicted

The scan's request to `https://www.elastic.co/` was answered HTTP 406. The scanner added the info note "Scan started from an error response" and, as designed, kept reading headers and page content from that response. Five claims follow from the 406 page and are false of the real page: "Missing Content-Security-Policy" (high; the real page sends a CSP header and a meta CSP), "Missing Clickjacking Protection" (medium; the CSP has `frame-ancestors`), "Missing Cache-Control Headers", "No Structured Data Found" and "Incomplete Open Graph Metadata". Their wording is accurate about what the scanner received. See "Findings from an error page keep full severity" in `SCAN-RESULTS.md` and decision 14.

## Passes, and what was wrong with the script

The script was fixed twice while this was being done, so the history is part of the record.

1. **First full pass, 17:23 UTC.** Kept in `superseded/verification-pass1-parser-gaps.json`. It reported 22 claims as "did not reproduce". Almost all were the script's fault, not the scanner's: it did not read the plural `Affected cookies:` evidence, the inner-page evidence that carries the scanner's own `Set-Cookie` line, a YAML OpenAPI spec, or an Open Graph tag with an empty value.
2. **Second full pass, 17:26 UTC**, with those fixed. This is the base of `verification.json`.
3. **Targeted pass on 7 sites, 17:28 UTC** (laravel.com, hashicorp.com, zendesk.com, intercom.com, posthog.com, css-tricks.com, openstreetmap.org), merged over the second pass. Two fixes: a claim that fetches its own file (a source map, a spec, `robots.txt`) is no longer skipped just because the home page refused, and the Apache `server-status` and `server-info` pages got a check. intercom.com and posthog.com, which had refused before, answered this time.
4. **One more pass on `posthog.com`, 17:28 UTC.** Its `openapi.json` is 7.5 MB, over the script's 2 MB read cap, so it failed to parse and showed as contradicted. Read in full it is a valid OpenAPI 3.1.0 document with 1,751 paths. The script now judges a body cut at the cap by its head.

`verification.json` records the passes in `summary.passes`.

## Checked by hand, outside the script

- **Apache `server-status` and `server-info` on `www.openstreetmap.org`**: both HTTP 200 with the Apache page signatures (314,355 and 189,524 bytes). The script now has this check and confirms both (**Reran**).
- **"HTTP Traffic Not Redirected to HTTPS"** on `www.khanacademy.org` and `www.djangoproject.com`: `http://www.<host>/` answers HTTP 200 over plain HTTP with no redirect, so the claim is true (**Reran**, one request each). The script has no check for this finding.
- **The missing-HSTS gap** in `SCAN-RESULTS.md`: seven sites' headers, the hstspreload.org status of each, and where `http://<host>/` redirects (**Reran**, one request each).
- **gnu.org**: a connect timeout from this PC for every client tried (**Reran**).

## What this does not show

- It checks only findings the scanner made. It cannot find a false negative; the HSTS gap came from comparing with another scanner.
- 120 findings have no independent check, listed below.
- The re-check cannot say whether a true claim deserves its severity or label. Examples are in "Smaller items, not verified" in `SCAN-RESULTS.md`.

## No independent check coded

| Finding | Count |
|---|---:|
| Active security testing was skipped for this scan | 48 |
| DNSSEC Not Enabled | 40 |
| Rate Limiting Not Advertised in Response Headers | 20 |
| Google API Key in Client Code (verify referrer restrictions) | 2 |
| HTTP Traffic Not Redirected to HTTPS | 2 |
| No DKIM Records Found Under Common Selectors | 2 |
| API Key in Client Code (verify restrictions) | 1 |
| Mail Server TLS Certificate Expiring Soon | 1 |
| Scan started from an error response | 1 |
| Nginx N.N.N — Verify Distro Package Against CVE-N-N | 1 |
| Social Preview Asset Referenced Over HTTP | 1 |
| Mapbox Public Token — Restrict to Your Domain | 1 |
