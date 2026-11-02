#!/usr/bin/env bash
# Tests no-arm-term.sh (LM-418) on throwaway git repos: a hit fails naming its
# file, the same hit allowlisted passes, binary files and lookalike words are
# skipped, and a git grep error fails instead of reading as "no hits".
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
check="$here/no-arm-term.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

failures=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; [ -z "${2:-}" ] || echo "$2" >&2; failures=$((failures + 1)); }

# fresh <file> <content>: a new repo holding one tracked file, and an empty allowlist.
fresh() {
  rm -rf "$tmp/repo"
  mkdir -p "$tmp/repo"
  git -C "$tmp/repo" init -q
  printf '%s\n' "$2" >"$tmp/repo/$1"
  git -C "$tmp/repo" add "$1"
  : >"$tmp/allow"
}

run() { ALLOW="$tmp/allow" "$check" "$tmp/repo" 2>&1; }

# expect_hit <name> <content>: the scan fails and names the file.
expect_hit() {
  fresh src.txt "$2"
  local out status=0
  out="$(run)" || status=$?
  if [ "$status" -eq 1 ] && grep -qF "src.txt:1:" <<<"$out"; then ok "hit: $1"; else bad "hit: $1 (exit $status)" "$out"; fi
}

# expect_clean <name> <content>: the scan passes.
expect_clean() {
  fresh src.txt "$2"
  local out
  if out="$(run)"; then ok "no hit: $1"; else bad "no hit: $1" "$out"; fi
}

for s in 'arm' 'the arms' 'Arm' 'ARM' 'armFor(s)' 'arm_for(s)' 'valuation_arms' 'getArm()' \
         'measures_for_arm' '"arm": "bond"' 'class _Arm:' 'measuresForArmIn' 'ValuationArms'; do
  expect_hit "$s" "$s"
done
for s in 'warm' 'Farm' 'alarm' 'swarm' 'charm' 'harmonic' 'forearm' 'armor' 'army' 'ARMOR' \
         'input_type_for' 'pre-warmed'; do
  expect_clean "$s" "$s"
done

# The same hit passes once allowlisted, by line text or for the whole file.
fresh src.txt 'export function armFor(s) {}'
printf 'src.txt\texport function armFor(\n' >"$tmp/allow"
if out="$(run)"; then ok "allowlisted by text"; else bad "allowlisted by text" "$out"; fi
printf 'src.txt\t*\n' >"$tmp/allow"
if out="$(run)"; then ok "allowlisted by file"; else bad "allowlisted by file" "$out"; fi
printf 'other.txt\t*\n' >"$tmp/allow"
if out="$(run)"; then bad "an entry for another file does not allow the hit" "$out"; else ok "an entry for another file does not allow the hit"; fi

# A tracked binary file is skipped (git grep -I).
fresh blob.bin 'x'
printf 'arm\000valuation_arms\000' >"$tmp/repo/blob.bin"
git -C "$tmp/repo" add blob.bin
if out="$(run)"; then ok "binary file skipped"; else bad "binary file skipped" "$out"; fi

# A new, not yet committed file is scanned; an ignored one is not.
fresh .gitignore 'ignored/'
mkdir -p "$tmp/repo/ignored"
echo 'armFor' >"$tmp/repo/ignored/x.ts"
if out="$(run)"; then ok "ignored file skipped"; else bad "ignored file skipped" "$out"; fi
echo 'armFor' >"$tmp/repo/new.ts"
if out="$(run)"; then bad "untracked file scanned" "$out"; else ok "untracked file scanned"; fi

# Lockfiles, source maps and committed tsc output are skipped.
fresh package-lock.json '"arm": 1'
mkdir -p "$tmp/repo/ledger-models-javascript/node/w"
echo 'armFor' >"$tmp/repo/a.js.map"
echo 'export function armFor() {}' >"$tmp/repo/ledger-models-javascript/node/w/p.js"
echo 'export declare function armFor(): void;' >"$tmp/repo/ledger-models-javascript/node/w/p.d.ts"
git -C "$tmp/repo" add -A
if out="$(run)"; then ok "lockfiles, maps and tsc output skipped"; else bad "lockfiles, maps and tsc output skipped" "$out"; fi
echo 'export function armFor() {}' >"$tmp/repo/ledger-models-javascript/node/w/p.ts"
if out="$(run)"; then bad "the .ts source is scanned" "$out"; else ok "the .ts source is scanned"; fi

# A git grep error fails; it never reads as "no hits".
mkdir -p "$tmp/not-a-repo"
: >"$tmp/allow"
status=0
out="$(ALLOW="$tmp/allow" "$check" "$tmp/not-a-repo" 2>&1)" || status=$?
if [ "$status" -ne 0 ] && grep -q 'git grep failed' <<<"$out"; then ok "git grep error fails"; else bad "git grep error fails (exit $status)" "$out"; fi

# A missing allowlist fails.
fresh src.txt 'clean'
status=0
out="$(ALLOW="$tmp/missing" "$check" "$tmp/repo" 2>&1)" || status=$?
if [ "$status" -ne 0 ]; then ok "missing allowlist fails"; else bad "missing allowlist fails" "$out"; fi

if [ "$failures" -gt 0 ]; then
  echo "no-arm-term.test.sh: $failures failed" >&2
  exit 1
fi
echo "no-arm-term.test.sh: all passed"
