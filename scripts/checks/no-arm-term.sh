#!/usr/bin/env bash
# LM-418: the ProductInput helpers, data and docs say "input type", never
# "arm" (ARM also means an adjustable-rate mortgage). Scans every tracked or new text
# file for "arm" as a word or identifier part: arm, arms, Arm, ARM, armFor,
# arm_for, valuation_arms, getArm, measuresForArmIn. Words that only contain
# the letters (warm, alarm, Farm, armor, army, harmonic) don't count.
#
# Skipped: binary files (git grep -I), lockfiles, source maps, and the
# committed tsc output under ledger-models-javascript (the stale-output check
# in test.sh keeps it equal to the .ts it is built from, which is scanned).
# Ignored node_modules, target and build output are never scanned; new,
# not yet committed files are.
#
# Every hit must match a line of the allowlist: <path><TAB><text>, where the
# hit's line contains <text>, or <text> is * for the whole file. The
# allowlist holds only the deprecated aliases, their notes and tests, the
# legacy-key loader fallback, and the LM-418 release note and versioning row.
#
# Usage: no-arm-term.sh [repo-dir] (default: this repo). ALLOW=<file>
# overrides the allowlist (default: <repo-dir>/scripts/checks/no-arm-term.allow).
set -euo pipefail

repo="${1:-$(git -C "$(dirname "$0")" rev-parse --show-toplevel)}"
allow="${ALLOW:-$repo/scripts/checks/no-arm-term.allow}"
pattern='(?<![A-Za-z])[aA]rms?(?![a-z])|(?<=[a-z])Arms?(?![a-z])|(?<![A-Za-z])ARMS?(?![A-Za-z])'

# git grep: 0 = hits, 1 = no hits, anything else is an error (never "clean").
status=0
hits="$(git -C "$repo" grep --untracked -I -n -P "$pattern" -- . \
  ':(exclude,glob)**/*lock*' ':(exclude,glob)**/*.map' \
  ':(exclude,glob)ledger-models-javascript/node/**/*.js' \
  ':(exclude,glob)ledger-models-javascript/node/**/*.d.ts')" || status=$?
if [ "$status" -gt 1 ]; then
  echo "no-arm-term: git grep failed (exit $status)" >&2
  exit 2
fi
if [ ! -f "$allow" ]; then
  echo "no-arm-term: allowlist $allow not found" >&2
  exit 2
fi

bad="$(HITS="$hits" python3 - "$allow" <<'PY'
import os
import sys

allow = {}
with open(sys.argv[1], encoding="utf-8") as f:
    for raw in f:
        line = raw.rstrip("\n")
        if not line.strip() or line.startswith("#"):
            continue
        path, sep, text = line.partition("\t")
        if not sep or not text:
            sys.exit(f"no-arm-term: bad allowlist line (want <path><TAB><text>): {line!r}")
        allow.setdefault(path, []).append(text)

for hit in os.environ["HITS"].splitlines():
    path, _, rest = hit.partition(":")
    _, _, content = rest.partition(":")
    if not any(text == "*" or text in content for text in allow.get(path, [])):
        print(hit)
PY
)"

count="$(grep -c . <<<"$hits" || true)"
if [ -n "$bad" ]; then
  echo "no-arm-term: say \"input type\", not \"arm\" (LM-418). Not in $allow:" >&2
  echo "$bad" >&2
  exit 1
fi
echo "no-arm-term: $count allowlisted hits, 0 others"
