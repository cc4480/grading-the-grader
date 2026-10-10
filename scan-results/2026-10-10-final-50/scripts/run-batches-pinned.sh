#!/bin/bash
# Passive SecScan sweep from a PINNED engine export, in small batches (one --json capture per batch).
# usage: run-batches-pinned.sh <engine-dir> <list-file> <out-dir> <batch-size>
ENG="$1"; LIST="$2"; OUT="$3"; N="${4:-10}"
MIN_FREE_KB=700000   # do not start a batch with less than ~700 MB of physical memory free
TSX="$ENG/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs"

free_kb() {
  powershell.exe -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory" 2>/dev/null | tr -d '\r\n '
}

mkdir -p "$OUT"
PINNED="$(cat "$ENG/.pinned-commit")"
mapfile -t URLS < <(tr -d '\r' < "$LIST" | grep -v '^\s*#' | sed '/^\s*$/d')
TOTAL=${#URLS[@]}
{
  echo "targets: $TOTAL"
  echo "engine: VibeScan-Enterprise-Build master $PINNED (read-only git archive export, not the shared checkout)"
  echo "batch size: $N; min free memory to start a batch: ${MIN_FREE_KB} KB"
  echo "mode: passive (live-scan.ts without --active)"
} > "$OUT/run.log"

cd "$ENG/artifacts/api-server" || { echo "no api-server dir" >> "$OUT/run.log"; exit 2; }

b=0
for ((i=0; i<TOTAL; i+=N)); do
  b=$((b+1))
  if [ "$(cat "$ENG/.pinned-commit")" != "$PINNED" ]; then
    echo "batch $b NOT STARTED: pinned commit marker changed" >> "$OUT/run.log"; exit 4
  fi
  fk=$(free_kb)
  if [ -n "$fk" ] && [ "$fk" -lt "$MIN_FREE_KB" ]; then
    echo "batch $b NOT STARTED: only ${fk} KB free (< ${MIN_FREE_KB}) at $(date -u +%FT%TZ)" >> "$OUT/run.log"
    echo "stopped-low-memory" >> "$OUT/run.log"
    exit 3
  fi
  chunk=("${URLS[@]:i:N}")
  echo "batch $b start $(date -u +%FT%TZ) urls ${#chunk[@]} free_kb=${fk}" >> "$OUT/run.log"
  NODE_OPTIONS=--max-old-space-size=1024 env -u DEEPSEEK_API_KEY -u ANTHROPIC_API_KEY -u OPENAI_API_KEY \
    DATABASE_URL=postgres://localhost/whatever \
    node "$TSX" scripts/live-scan.ts --json "$OUT/batch-$b.json" "${chunk[@]}" > "$OUT/batch-$b.console.log" 2>&1
  echo "batch $b exit $? end $(date -u +%FT%TZ)" >> "$OUT/run.log"
done
echo "all-batches-done $(date -u +%FT%TZ)" >> "$OUT/run.log"
