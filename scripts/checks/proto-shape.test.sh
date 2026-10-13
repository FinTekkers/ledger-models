#!/usr/bin/env bash
# Tests proto-shape.sh (LM-318): it passes on a copy of this repo's protos,
# and fails, naming the file, on a copy with one violation each.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(git -C "$here" rev-parse --show-toplevel)"
check="$here/proto-shape.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

failures=0

# A fresh tree: the repo's protos and nothing else.
fresh() {
  rm -rf "$tmp/root"
  mkdir -p "$tmp/root"
  cp -R "$repo/ledger-models-protos" "$tmp/root/"
}

PRICE=ledger-models-protos/fintekkers/models/price/price.proto

# expect_fail <name> <file the message must name>: run after a mutation.
expect_fail() {
  local out
  if out="$("$check" "$tmp/root" 2>&1)"; then
    echo "FAIL $1: proto-shape.sh passed" >&2; failures=$((failures + 1))
  elif ! grep -qF "$2" <<<"$out"; then
    echo "FAIL $1: output does not name $2:" >&2; echo "$out" >&2; failures=$((failures + 1))
  else
    echo "ok   $1"
  fi
}

fresh
if out="$("$check" "$tmp/root" 2>&1)" && grep -qE '^proto-shape: [1-9][0-9]* messages' <<<"$out"; then
  echo "ok   the repo's protos pass with a positive count"
else
  echo "FAIL the repo's protos do not pass:" >&2; echo "$out" >&2; failures=$((failures + 1))
fi

fresh
perl -pi -e 's/ObjectTypeProto object_type = 1;/ObjectTypeProto object_type = 1;\n  string object_class = 3;/' "$tmp/root/$PRICE"
expect_fail "object_class" "$PRICE"

fresh
perl -pi -e 's/fintekkers.models.util.VersionProto version = 2;/string version = 2;/' "$tmp/root/$PRICE"
expect_fail "string version = 2" "$PRICE"

fresh
perl -pi -e 's/ObjectTypeProto object_type = 1;/ObjectTypeProto object_type = 1;\n  uint32 version_minor = 1003;/' "$tmp/root/$PRICE"
expect_fail "field 1003" "$PRICE"

fresh
perl -ni -e 'print unless /VersionProto version = 2;/' "$tmp/root/$PRICE"
expect_fail "object_type without VersionProto version = 2" "$PRICE:PriceProto"

fresh
perl -pi -e 's/bytes unscaled_value = 11;/bytes unscaled_value = 11;\n  string arbitrary_precision_value = 10;/' \
  "$tmp/root/ledger-models-protos/fintekkers/models/util/decimal_value.proto"
expect_fail "arbitrary_precision_value in a .proto" "decimal_value.proto"

fresh
mkdir -p "$tmp/root/ledger-models-rust/fintekkers/wrappers"
echo 'fn f(d: &DecimalValueProto) -> &str { &d.arbitrary_precision_value }' \
  > "$tmp/root/ledger-models-rust/fintekkers/wrappers/stale.rs"
expect_fail "arbitrary_precision_value in a .rs file" "ledger-models-rust/fintekkers/wrappers/stale.rs"

fresh
mkdir -p "$tmp/root/ledger-models-python/fintekkers/models/util"
printf '%s\n' "_DECIMALVALUEPROTO.fields_by_name['arbitrary_precision_value']._options = None" \
  > "$tmp/root/ledger-models-python/fintekkers/models/util/decimal_value_pb2.py"
expect_fail "arbitrary_precision_value in a generated _pb2 file" "decimal_value_pb2.py"

fresh
mkdir -p "$tmp/root/ledger-models-javascript/node/wrappers"
echo 'new DecimalValueProto().setArbitraryPrecisionValue("1");' > "$tmp/root/ledger-models-javascript/node/wrappers/stale.js"
expect_fail "setArbitraryPrecisionValue in a .js file" "ledger-models-javascript/node/wrappers/stale.js"

# A scan that finds nothing fails.
fresh
find "$tmp/root/ledger-models-protos" -name '*.proto' ! -name object_type.proto -delete
expect_fail "no message with object_type" "matched nothing"

if [ "$failures" -ne 0 ]; then
  echo "proto-shape.test.sh: $failures failed" >&2
  exit 1
fi
