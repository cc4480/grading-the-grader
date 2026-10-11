#!/bin/bash
# Passive SecScan sweep from a pinned engine export, in small batches, one --json capture per batch.
# live-scan.ts (PR 38 onward) starts a headless browser and does not exit by itself afterwards, so each batch is run in the
# background, watched for its "[live-scan] Wrote <file>" line, and its process tree ended a few seconds after that.
# usage: run-batches-watchdog.sh <engine-export-dir> <list-file> <out-dir> <batch-size>
ENG="$1"; LIST="$2"; OUT="$3"; N="${4:-10}"
MIN_FREE_KB=900000
TSX="$ENG/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs"
[ -f "$TSX" ] || TSX="$(ls "$ENG"/node_modules/.pnpm/tsx@*/node_modules/tsx/dist/cli.mjs 2>/dev/null | head -1)"

free_kb() { powershell.exe -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory" 2>/dev/null | tr -d '\r\n '; }

mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
PINNED="$(cat "$ENG/.pinned-commit")"
mapfile -t URLS < <(tr -d '\r' < "$LIST" | grep -v '^\s*#' | sed '/^\s*$/d')
TOTAL=${#URLS[@]}
{
  echo "targets: $TOTAL"
  echo "engine: VibeScan-Enterprise-Build $PINNED (read-only git archive export of the commit deployed to production)"
  echo "batch size: $N; min free memory to start a batch: ${MIN_FREE_KB} KB; node $(node --version)"
  echo "mode: passive (live-scan.ts without --active), headless browser initialised by live-scan.ts"
} > "$OUT/run.log"

cd "$ENG/artifacts/api-server" || { echo "no api-server dir" >> "$OUT/run.log"; exit 2; }

b=0
for ((i=0; i<TOTAL; i+=N)); do
  b=$((b+1))
  fk=$(free_kb)
  if [ -n "$fk" ] && [ "$fk" -lt "$MIN_FREE_KB" ]; then
    echo "batch $b NOT STARTED: only ${fk} KB free (< ${MIN_FREE_KB}) at $(date -u +%FT%TZ)" >> "$OUT/run.log"; echo stopped-low-memory >> "$OUT/run.log"; exit 3
  fi
  chunk=("${URLS[@]:i:N}")
  LOG="$OUT/batch-$b.console.log"
  echo "batch $b start $(date -u +%FT%TZ) urls ${#chunk[@]} free_kb=${fk}" >> "$OUT/run.log"
  NODE_OPTIONS=--max-old-space-size=1536 DATABASE_URL=postgres://localhost/whatever \
    env -u DEEPSEEK_API_KEY -u ANTHROPIC_API_KEY -u OPENAI_API_KEY \
    node "$TSX" scripts/live-scan.ts --json "$OUT/batch-$b.json" "${chunk[@]}" > "$LOG" 2>&1 &
  PID=$!
  for _ in $(seq 1 900); do                      # up to 15 minutes per batch
    grep -q '^\[live-scan\] Wrote' "$LOG" 2>/dev/null && break
    kill -0 "$PID" 2>/dev/null || break
    sleep 1
  done
  for _ in 1 2 3 4 5 6 7 8; do kill -0 "$PID" 2>/dev/null || break; sleep 1; done
  note=""
  if kill -0 "$PID" 2>/dev/null; then
    taskkill //F //T //PID "$(cat /proc/$PID/winpid 2>/dev/null || echo $PID)" > /dev/null 2>&1; note=" (process had written its results but did not exit; ended it)"
  fi
  echo "batch $b end $(date -u +%FT%TZ) results: $([ -s "$OUT/batch-$b.json" ] && echo present || echo MISSING)$note" >> "$OUT/run.log"
done
echo "all-batches-done $(date -u +%FT%TZ)" >> "$OUT/run.log"
