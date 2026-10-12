#!/usr/bin/env bash
# Builds the descriptor set of a released ledger-models tag, for the
# "old readers still work" tests (LM-297): new-form bytes must decode with the
# previous release's .proto files and give the same object_class / version.
#
# Usage: scripts/fixtures/make-legacy-descriptors.sh [tag]   (default v0.4.33)
# Writes test-fixtures/object-type/legacy-descriptors-<tag>.binpb.
# Uses the pinned grpc-tools protoc, as compile.sh does, so the bytes are stable.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

TAG="${1:-v0.4.33}"
PROTOC="ledger-models-javascript/node_modules/grpc-tools/bin/protoc"
OUT="test-fixtures/object-type/legacy-descriptors-${TAG}.binpb"

if [ ! -x "$PROTOC" ]; then
  echo "ERROR: $PROTOC not found. Run: cd ledger-models-javascript && npm ci" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git archive "$TAG" ledger-models-protos | tar -x -C "$TMP"
mkdir -p "$(dirname "$OUT")"
(
  cd "$TMP/ledger-models-protos"
  find . -name '*.proto' | sed 's#^\./##' | LC_ALL=C sort > "$TMP/files"
  "$OLDPWD/$PROTOC" -I . --include_imports --descriptor_set_out="$TMP/out.binpb" $(cat "$TMP/files")
)
cp "$TMP/out.binpb" "$OUT"
echo "Wrote $OUT"
