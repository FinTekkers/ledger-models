#!/usr/bin/env bash
# Object type, version and decimal shape (LM-318). Fails when:
#   - a .proto names object_class, declares `string version = 2`, or uses a
#     field number 1001-1004 (the LM-297 compact block, removed in place);
#   - a message has `ObjectTypeProto object_type = 1` without
#     `VersionProto version = 2`, or the other way round;
#   - the number of messages with object_type differs from the number of
#     ObjectTypeProto values (one value per such message), or is zero;
#   - a .proto, library code or generated code in any language names the
#     deleted decimal string, arbitrary_precision_value.
# Usage: proto-shape.sh [root]. root defaults to the repo root;
# proto-shape.test.sh points it at a copy with one violation each.
set -euo pipefail
root="${1:-$(git rev-parse --show-toplevel)}"
cd "$root"

protos=ledger-models-protos
fail=0
report() { echo "proto-shape: $*" >&2; fail=1; }

# One "file:line: text" per hit; comment lines count too, since a .proto
# comment is the spec.
hits="$(grep -rnE --include='*.proto' \
  'object_class|string[[:space:]]+version[[:space:]]*=[[:space:]]*2[[:space:]]*[;[]|=[[:space:]]*100[1-4][[:space:]]*[;[]' \
  "$protos" || true)"
if [ -n "$hits" ]; then
  report "object_class, string version = 2 or a field 1001-1004 (removed by LM-318):"
  echo "$hits" >&2
fi

# Per message: object_type = 1 and version = 2 come together. The awk
# tracks message names by brace depth; comments are stripped first.
pairs="$(find "$protos" -name '*.proto' -print0 | sort -z | xargs -0 awk '
  FNR == 1 { depth = 0; in_block = 0 }
  {
    line = $0
    if (in_block) { if (sub(/.*\*\//, "", line)) in_block = 0; else next }
    gsub(/\/\*.*\*\//, "", line)
    if (sub(/\/\*.*/, "", line)) in_block = 1
    sub(/\/\/.*/, "", line)
    if (match(line, /^[[:space:]]*message[[:space:]]+[A-Za-z0-9_]+/)) {
      name = line; sub(/^[[:space:]]*message[[:space:]]+/, "", name); sub(/[^A-Za-z0-9_].*/, "", name)
      stack[depth + 1] = name
    }
    key = FILENAME ":" stack[depth]
    if (line ~ /ObjectTypeProto[[:space:]]+object_type[[:space:]]*=[[:space:]]*1[[:space:]]*;/) type[key] = 1
    if (line ~ /VersionProto[[:space:]]+version[[:space:]]*=[[:space:]]*2[[:space:]]*;/) version[key] = 1
    depth += gsub(/{/, "{", line) - gsub(/}/, "}", line)
  }
  END {
    for (k in type) print (k in version ? "ok " : "no-version ") k
    for (k in version) if (!(k in type)) print "no-type " k
  }')"
while read -r status where; do
  case "$status" in
    no-version) report "$where has ObjectTypeProto object_type = 1 but no VersionProto version = 2" ;;
    no-type) report "$where has VersionProto version = 2 but no ObjectTypeProto object_type = 1" ;;
  esac
done <<<"$pairs"

typed="$(grep -c '^ok ' <<<"$pairs" || true)"
values="$(grep -cE '^[[:space:]]*OBJECT_TYPE_[A-Z0-9_]+[[:space:]]*=[[:space:]]*[1-9]' \
  "$protos/fintekkers/models/util/object_type.proto" || true)"
if [ "$typed" -eq 0 ]; then
  report "no message declares ObjectTypeProto object_type = 1: the scan matched nothing"
elif [ "$typed" -ne "$values" ]; then
  report "$typed messages declare object_type and version, but ObjectTypeProto has $values values: one each"
fi

# The deleted decimal string, in any spelling, anywhere in the protos,
# library code or generated code.
dirs=()
for d in "$protos" ledger-models-java/src/main ledger-models-python/fintekkers \
    ledger-models-javascript/node ledger-models-rust; do
  [ -d "$d" ] && dirs+=("$d")
done
hits="$(grep -rnIiE 'arbitrary_?precision_?value' \
  --exclude-dir=node_modules --exclude-dir=target --exclude-dir=tests --exclude='*.map' \
  "${dirs[@]}" || true)"
if [ -n "$hits" ]; then
  report "arbitrary_precision_value (deleted by LM-318):"
  echo "$hits" >&2
fi

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "proto-shape: $typed messages carry ObjectTypeProto object_type = 1 and VersionProto version = 2"
