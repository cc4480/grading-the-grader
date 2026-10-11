# SecScan, held-out final 50 again, on the deployed commit: passive sweep, 2026-10-11

Raw output: [`raw.json`](raw.json) (browser pass) and [`raw-no-browser.json`](raw-no-browser.json) (first pass), each the five files in [`batches/`](batches/) concatenated with every result left untouched. Same 50 URLs as [`../2026-10-10-final-50/`](../2026-10-10-final-50/SCAN-RESULTS.md) ([list](../2026-10-10-final-50.txt)). Per-site differences: [`comparisons/`](comparisons/). Scripts: [`scripts/`](scripts/).

## Why this run exists

The 2026-10-10 sweep ran on `e3d5875`, which was one commit behind what production later ran. This repeats it on the commit that is live now.

## Summary

- **Engine: `e9b13ed`, which is what production runs** (**Verified**: GitHub Deployments API, environment `secscan / production`, deployed 2026-10-11 06:06 UTC; also the head of `master`). It is a read-only `git archive` export, run with `live-scan.ts` and no `--active`.
- **What changed in the engine since `e3d5875`** (**Verified**: `git diff --stat e3d5875 e9b13ed -- artifacts/api-server/src`): PR 38 (`probes.ts`, `scanner.ts`, `scannerProbeStage.ts`: the as-served page for the subresource-integrity and source-map checks, and `live-scan.ts` starting the headless browser) and a Stripe dependency bump. No other scanner code.
- **Two passes, because the first one did not exercise the browser.**
  - **Pass 1 (no browser), 09:01 to 09:13 UTC.** Playwright 1.64.0, the version the deployed lockfile pins (**Verified**: `pnpm-lock.yaml` at `e9b13ed`). The browser did not start: `Failed to launch headless browser — SPA rendering disabled` ([`browser-launch-lines.txt`](browser-launch-lines.txt)), because Playwright 1.64.0 wants Chromium revision 1248 and this PC has only revision 1234. That is a limit of this PC, not of the product.
  - **Pass 2 (browser), 09:15 to 09:25 UTC**, with the export's Playwright switched to 1.62.1, the version this PC has a browser for (revision 1234). `Headless browser initialised — SPA rendering enabled` in all five batches. **Scanner code is the deployed `e9b13ed`; the browser library is two minor versions older than production's.** It is the closest run to production this PC can do. An exact match needs `playwright install chromium` for 1.64.0 (a download of about 150 MB), which I have not done.
- **Pass 2 (browser on) result: 48 of 50 sites scanned, 612 findings: 0 critical, 41 high, 103 medium, 110 low, 358 info** (**Verified**: `scripts/capture-facts.mjs` on `raw.json`). Pass 1: 638 findings (0 / 44 / 109 / 119 / 366). The 2026-10-10 run: 621 (0 / 44 / 103 / 112 / 362).
- **Against the 2026-10-10 run, pass 2 gives the same findings, grade and HTTP status on 41 of 50 sites; pass 1 on 42** (**Verified**: `scripts/compare-captures.mjs`; see [`comparisons/`](comparisons/)). The differences are the sites, not the engine; see below.
- **Not re-verified.** The independent re-check of the 2026-10-10 findings ([`VERIFICATION.md`](../2026-10-10-final-50/VERIFICATION.md)) was not repeated on this output. Where a site's findings are identical to that run the earlier check still describes them; where they differ nothing has been checked.
- **This is a record, not a clean bill.** It does not show SecScan is free of false positives or false negatives; the earlier run found one of each kind (decisions 13 and 14 in `DECISIONS.md`), and pass 2 reproduced the second one on the live commit.

## What moved between runs, and why

All of it follows the site's answer on the day, not a change in the scanner (**Reran**: the HTTP status of each scanned page is in the raw files).

| Site | 2026-10-10 | Pass 1 | Pass 2 | Effect |
|---|---|---|---|---|
| `elastic.co` | HTTP 406, error-page findings | HTTP 200, normal findings | **HTTP 406 again** | Pass 2 repeats the five claims that are false of the real page (missing CSP and others, read from the 406 response): **decision 14 reproduced on the live commit** |
| `laravel.com`, `css-tricks.com` | HTTP 200, full findings | HTTP 200 | HTTP 429 | Scanner reports "intercepted by a bot-protection challenge", withholds the rest, no grade |
| `zendesk.com` | HTTP 429 | HTTP 200, full findings | HTTP 429 | Same, in the other direction |
| `sqlite.org` | HTTP 503 | HTTP 200, full findings | HTTP 200 | Same, in the other direction |
| `hashicorp.com` | HTTP 429 | HTTP 429 | HTTP 429 | Unchanged |
| `ubuntu.com`, `miro.com`, `dev.to` | | | | One to three findings come and go between runs (a source-map finding, inner-page cookie and CSP findings, which docs path of an API UI was found). Cause not checked; the site may have served different content or the crawl may have visited different inner pages (**Inference**) |
| `duolingo.com` | | not rendered | **rendered in the browser** | The only site of the 48 where the headless browser was used; its findings are the same as without it |
| `gnu.org`, `npr.org` | not reached | not reached | not reached | Unchanged |

The same site gave different answers within 13 minutes (`zendesk.com`, `laravel.com`, `css-tricks.com`, `elastic.co`, `sqlite.org`). A per-site result is a snapshot.

## Coverage

- **The headless browser was used on 1 of 48 sites** (`duolingo.com`; **Verified**: `renderedWithBrowser` in `raw.json`). Most of the 50 are server-rendered, so this sweep says little about the rendering path. The Lovable-style target is the test for that.
- **Both passes ran from the same PC and IP, 13 minutes apart.** Three sites that answered 200 in pass 1 answered 429 in pass 2 (`laravel.com`, `css-tricks.com`, `zendesk.com`). Whether that is because of the repeat scan is not known (**Inference**).
- **No process had to be ended in pass 2.** In pass 1 the first batch's process wrote its results and did not exit (`batches/no-browser/run.log`); the next four exited by themselves.
- **Time.** About 11 minutes a pass; mean 11.8 s a site with the browser, 12.4 s without (**Verified**: `elapsedMs`).
- **TLS.** `live-scan.ts` does not produce a TLS grade, so none is reported here.
