#!/usr/bin/env bash
# Pull the latest grading artifacts from a checkout of the scanner repo.
# Usage: ./sync.sh /path/to/VibeScan-Enterprise-Build
set -euo pipefail
SRC="${1:?path to scanner checkout}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="$SRC/artifacts/api-server/scripts"
cp "$SCRIPTS"/{FALSE-POSITIVE-AUDIT,RETEST,SCAN-RESULTS}.md "$HERE/docs/"
cp "$SRC"/{CHANGELOG,SCAN_TESTS,SCAN_COVERAGE,SCAN_CHECKS}.md "$HERE/docs/"
mkdir -p "$HERE/scan-results" "$HERE/benchmark"
cp -a "$SCRIPTS/scan-results/." "$HERE/scan-results/"
# The URL list behind a sweep sits beside the capture it produced.
[ -d "$SCRIPTS/sweep-lists" ] && cp -a "$SCRIPTS/sweep-lists/." "$HERE/scan-results/"
cp -a "$SCRIPTS/benchmark/." "$HERE/benchmark/"
cd "$HERE" && git status --short
