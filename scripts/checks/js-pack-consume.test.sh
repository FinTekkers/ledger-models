#!/usr/bin/env bash
# Tests js-pack-consume.sh (LM-475): it passes on the real package, and fails
# on broken copies of its tarball:
# - @types/luxon back in devDependencies, as in 1.1.48 (TS7016 for 'luxon');
# - a type name without an inline `type` in a mixed import (TS1444).
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
js="$root/ledger-models-javascript"
checker="$root/scripts/checks/js-pack-consume.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

failures=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; [ -z "${2:-}" ] || echo "$2" >&2; failures=$((failures + 1)); }

tarball="$tmp/$(cd "$js" && npm pack --silent --pack-destination "$tmp")"
if out="$("$checker" "$tarball" 2>&1)"; then ok "real package passes"; else bad "real package passes" "$out"; fi

# mutant <case> <expected error> <command run in the unpacked package/>:
# repacks the tarball after the command (which must exit 0 once the mutation
# applied) and expects the check to fail with that error.
mutant() {
  local name="$1" expect="$2" cmd="$3" dir="$tmp/mutant"
  rm -rf "$dir" && mkdir "$dir"
  tar -xzf "$tarball" -C "$dir"
  if ! (cd "$dir/package" && eval "$cmd"); then bad "$name: the mutation applies"; return; fi
  tar -czf "$dir.tgz" -C "$dir" package
  if out="$("$checker" "$dir.tgz" 2>&1)"; then
    bad "$name: check fails" "$out"
  elif ! grep -q "$expect" <<<"$out"; then
    bad "$name: check fails with $expect" "$out"
  else
    ok "$name: check fails with $expect"
  fi
}

mutant "@types/luxon a devDependency" "TS7016.*'luxon'" \
  "node -e '
    const fs = require(\"fs\"), p = JSON.parse(fs.readFileSync(\"package.json\"));
    if (!p.dependencies[\"@types/luxon\"]) process.exit(1);
    p.devDependencies = { ...p.devDependencies, \"@types/luxon\": p.dependencies[\"@types/luxon\"] };
    delete p.dependencies[\"@types/luxon\"];
    fs.writeFileSync(\"package.json\", JSON.stringify(p, null, 2));
  '"
mutant "mixed import without inline type" "TS1444" \
  "sed -i 's/import { Tenor, type Period }/import { Tenor, Period }/' node/wrappers/models/security/BondSecurity.ts &&
   grep -q 'import { Tenor, Period }' node/wrappers/models/security/BondSecurity.ts"

if [ "$failures" -ne 0 ]; then
  echo "$failures failure(s)" >&2
  exit 1
fi
echo "all js pack-and-consume tests passed"
