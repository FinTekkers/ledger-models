#!/usr/bin/env bash
# Tests descriptor-identical.sh (LM-418): the protos at HEAD match themselves,
# a comment-only change still matches, a renamed field fails, and a repo with
# no origin/main or main fails loudly.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
check="$here/descriptor-identical.sh"
export PYTHON="${PYTHON:-$repo/ledger-models-python/.venv/bin/python}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

failures=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; [ -z "${2:-}" ] || echo "$2" >&2; failures=$((failures + 1)); }

INPUTS=fintekkers/requests/valuation/product_inputs.proto

# A copy of the protos as committed at HEAD.
fresh() {
  rm -rf "$tmp/head"
  mkdir -p "$tmp/head"
  git -C "$repo" archive --format=tar HEAD ledger-models-protos | tar -x -C "$tmp/head"
}

fresh
if out="$(cd "$repo" && "$check" HEAD "$tmp/head/ledger-models-protos" 2>&1)"; then
  ok "HEAD matches itself"
else
  bad "HEAD matches itself" "$out"
fi

fresh
perl -pi -e 's#^(message ProductInput \{)#// A new comment line.\n$1#' "$tmp/head/ledger-models-protos/$INPUTS"
if out="$(cd "$repo" && "$check" HEAD "$tmp/head/ledger-models-protos" 2>&1)"; then
  ok "a comment-only change matches"
else
  bad "a comment-only change matches" "$out"
fi

fresh
perl -pi -e 's/MbsInput mbs = 13;/MbsInput mortgage = 13;/' "$tmp/head/ledger-models-protos/$INPUTS"
if grep -q 'MbsInput mortgage = 13;' "$tmp/head/ledger-models-protos/$INPUTS" \
  && ! out="$(cd "$repo" && "$check" HEAD "$tmp/head/ledger-models-protos" 2>&1)" \
  && grep -q 'differs' <<<"$out"; then
  ok "a renamed field fails"
else
  bad "a renamed field fails" "${out:-the mutation did not apply}"
fi

# No origin/main or main to compare with: fail and say so.
mkdir -p "$tmp/lonely"
git -C "$tmp/lonely" init -q -b other
git -C "$tmp/lonely" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init
status=0
out="$(cd "$tmp/lonely" && "$check" 2>&1)" || status=$?
if [ "$status" -ne 0 ] && grep -q 'no origin/main or main' <<<"$out"; then
  ok "no base fails loudly"
else
  bad "no base fails loudly (exit $status)" "$out"
fi

if [ "$failures" -gt 0 ]; then
  echo "descriptor-identical.test.sh: $failures failed" >&2
  exit 1
fi
echo "descriptor-identical.test.sh: all passed"
