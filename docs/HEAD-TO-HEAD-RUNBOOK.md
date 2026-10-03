# Runbook: independent head-to-head (improvement 1)

Purpose: replace "SecScan beat ZAP and Nuclei on SecScan's own test app" with a result someone else can rerun and
dispute. This is improvement 1 in `docs/IMPROVEMENT-PLAN.md`. Three jobs, in order of cost:

- **A.** Rerun the 30-site false-positive sweep on current scanner master.
- **B.** Head-to-head against ZAP and Nuclei on public vulnerable apps, run locally.
- **C.** A vibe-stack target set (Next.js plus Supabase apps) that proves the checks no real fault has yet triggered.

Pending decisions that change this runbook are in `docs/DECISIONS.md` (1a, 1b, 1c). Do not start job C or publish a
result before 1a and 1b are answered.

## What was verified in the first session (cloud sandbox, 2026-10-03)

| Fact | Mark |
|---|---|
| Docker ran after starting `dockerd` by hand | Reran |
| `bkimminich/juice-shop` pulled and answered HTTP 200 on port 3000 | Reran |
| `zaproxy/zap-stable` pulled from Docker Hub (the GitHub registry copy was blocked there) | Reran |
| `projectdiscovery/nuclei:latest` pulled and started (v3.11.1) but loaded **no templates**, because the sandbox could not reach `nuclei-templates` on GitHub | Reran |
| No scan of any kind was run. There is **no benchmark result** yet | Verified |

On a normal PC none of the sandbox limits apply. Everything below is untested end to end.

## What already exists (scanner repo, `artifacts/api-server/scripts/benchmark/`)

- `run-benchmark.ts` runs ZAP and Nuclei in Docker and SecScan through `live-scan.ts --active`, then scores them against
  `ground-truth.ts`. Flags: `--tools zap,nuclei,secscan`, `--target <url>`, `--zap-mode baseline|full`, `--out <dir>`,
  `--score-only`. Containers reach the host through `host.docker.internal`, which Docker Desktop provides.
- `build-judge-packet.ts` and `score-consensus.ts` run three blind adjudicators and report agreement before the score.
- `ground-truth.ts` is the planted faults of `artifacts/vuln-fixture`, with a regex matcher per tool.
- `live-scan.ts --active` only accepts the owner's domains and loopback (`127.0.0.1`, `localhost`) on purpose.

The harness is tied to the fixture's ground truth. Making it take another target's ground truth is the code change in step 4.

## Prerequisites on the PC

- Docker Desktop with the WSL2 backend, running.
- Node 22, pnpm 10.33 (`corepack enable`), git.
- A clone of `cc4480/vibescan-enterprise-build`, then `pnpm install --frozen-lockfile`.
- `DATABASE_URL` set to anything, for example `postgres://localhost/anything`. The scanner module imports the database
  layer at load time and a passive or loopback scan never reads it. PowerShell: `$env:DATABASE_URL="postgres://localhost/anything"`.

## Steps

### 0. Reproduce the existing result first

Run the benchmark on the fixture exactly as the scanner repo's `benchmark/README.md` says and keep the output as
`benchmark-runs/YYYY-MM-DD-fixture-repro/`. Expect roughly the recorded 68 of 74 for SecScan with ZAP and Nuclei far lower
(ZAP 18 to 19, Nuclei 7 to 8). If it does not reproduce, stop and find out why before building on it.

```
pnpm --filter @workspace/vuln-fixture run start          # terminal 1
pnpm --filter @workspace/api-server run benchmark        # terminal 2
```

### 1. Choose and pin the targets

Classic public vulnerable apps are the independent set. Candidates: OWASP Juice Shop, crAPI, DVWA. Only Juice Shop was
checked (pulled and served). For each target record the image tag and **digest**, the licence, and where the project
publishes its list of weaknesses. Run locally only.

```
docker run -d --name juice -p 3000:3000 bkimminich/juice-shop
```

### 2. Write the ground truth before any scan

One file per target, committed and pushed **before** step 5. Per fault: id, label, category, CWE if known, the route or
component, a link to the third-party source that lists it, `inScope` (can an outside-in scanner see it at all?), and
`needs` (credentials, a spec, a callback host). The point of this step is that the list cannot be fitted to the results.
Faults an outside-in scanner cannot see are marked out of scope, not dropped.

### 3. Pin the tools

Record the exact versions and keep the commands. ZAP: image digest and `zap.sh -version`. Nuclei: image digest **and the
commit of `nuclei-templates` it loaded**. SecScan: the scanner repo commit. Write them to `versions.json` in the run folder.

On a PC with normal internet Nuclei downloads its templates itself. If it cannot, mount a clone of `nuclei-templates` at
`/root/nuclei-templates`.

### 4. Make the harness take any ground truth (code change in the scanner repo)

- Add `--ground-truth <path>` to `run-benchmark-config.ts` and load it instead of the fixture's module.
- Third-party targets cannot use hand-written regexes against each tool's output (the README documents how that moved
  ZAP from 59.5% to 31.1% with the scan data unchanged). Match on a pre-registered map instead: per fault, the CWE or
  route and the list of rule ids or template ids that count as a detection for each tool. Commit the map with the ground truth.
- Acceptance: with the fixture's ground truth the new loader reproduces the step 0 numbers.
- Same fairness fixes the README already admits: configure ZAP's Forced Browse with a wordlist comparable to SecScan's,
  and its OpenAPI and authentication add-ons, or label those rows "not configured to find it".

### 5. Run each tool and keep the raw output untouched

```
benchmark-runs/YYYY-MM-DD-<target>/
  zap.json  nuclei.jsonl  secscan.json  versions.json  commands.txt  ground-truth.json  README.md
```

Run ZAP in `full` mode and Nuclei at every severity, as the existing harness does. Never edit a raw file. If a run is
repeated, it is a new folder.

### 6. Score

- Deterministic matching on the pre-registered map is the scorer of record.
- Add a human spot check of a sample (at least every disagreement between the matcher and a reviewer, and a random 20 per
  tool). The three blind adjudicators in the harness are the same model and share its blind spots, so they are a second
  opinion, not the scorer.
- Report **per category**, with out-of-scope rows shown as out of scope, each tool's "found but not planted" list, and the
  matcher's matched text for every credit. A tool that scores low has shown it overlaps less with the list, not that it is worse.

### 7. Publish

Headline is the per-category table, not one number. Commit the raw output, the map, the scripts and the versions. Add a
dated entry to `docs/STATUS.md`. Publish whatever the result is (decision 1b), including a weak result on classic apps:
SecScan is an outside-in scanner for AI-built apps and many of its checks do not apply to a PHP training app. Say so in
the README of the run.

## Job A: rerun the 30-site sweep

Needs outbound access to the sites and the scanner's documented user agent. Follow the method in
`docs/FALSE-POSITIVE-AUDIT.md`: scan passively, then check every actionable finding against the live response with the
scanner's own user agent, repeat through the scanner's fetch layer, and re-derive header and DNS findings independently.

```
DATABASE_URL=postgres://localhost/anything npx tsx artifacts/api-server/scripts/live-scan.ts --json out.json
```

Store the raw file as `scan-results/YYYY-MM-DD-sweep-30.json` and add a dated section to the audit. Do **not** use
`--active` on third-party sites. Six to eight sites answer with a bot challenge and are withheld, not graded; report that count.

## Job C: the vibe-stack set

Specification, pending decision 1a:

- Next.js plus Supabase apps with planted faults: tables with row level security off, a service-role key in the client
  bundle, an IDOR on a CRUD route, a permissive storage bucket, and one app with an AI feature for the four September 29
  probes. Include Firebase and PocketBase variants if the sweep checks are to be proven.
- The faults come from **published incident write-ups**, and the ground truth is **written by someone other than the
  scanner's authors** and committed before scanning.
- Every app has a **clean twin**, the same app done safely, so false positives are measured next to detections.
- It also covers the nine September 26 checks and the SSRF probe, which need a reachable callback host. A local run needs
  the scanner's out-of-band collector reachable from the target.

## Done when

- [ ] Step 0 reproduces the recorded fixture result, or the difference is explained in writing.
- [ ] Ground truth and the match map are committed before the first scan.
- [ ] Raw output, versions (with image digests and the templates commit) and commands are committed for every run.
- [ ] Results are per category with out-of-scope and not-configured rows shown.
- [ ] `docs/STATUS.md` records what was run, what was not, and how it is known.
