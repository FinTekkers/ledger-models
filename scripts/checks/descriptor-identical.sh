#!/usr/bin/env bash
# LM-418: the protos compile to a byte-identical descriptor set here and at a
# base commit. The set has no source info, so comments don't count and any
# change to a field, message, number or enum value does. For items that may
# change only proto comments.
#
# Usage: descriptor-identical.sh [base] [protos-dir]. base defaults to the
# merge base with origin/main (or main), as in wire-diff.py; protos-dir
# defaults to this checkout's ledger-models-protos. Needs grpcio-tools
# (PYTHON, default ledger-models-python's venv).
set -euo pipefail

repo="$(git rev-parse --show-toplevel)"
py="${PYTHON:-$repo/ledger-models-python/.venv/bin/python}"
base="${1:-}"
tree="${2:-$repo/ledger-models-protos}"

if [ -z "$base" ]; then
  for ref in origin/main main; do
    if base="$(git -C "$repo" merge-base HEAD "$ref" 2>/dev/null)"; then break; fi
    base=""
  done
  if [ -z "$base" ]; then
    echo "descriptor-identical: no origin/main or main to compare with; pass a base commit" >&2
    exit 1
  fi
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/base"
if ! git -C "$repo" archive --format=tar "$base" ledger-models-protos | tar -x -C "$tmp/base"; then
  echo "descriptor-identical: cannot read ledger-models-protos at $base" >&2
  exit 1
fi

# compile <protos-dir> <out>: every .proto, in a fixed order, no source info.
compile() {
  local files
  files="$(cd "$1" && find . -name '*.proto' | sed 's#^\./##' | LC_ALL=C sort)"
  if [ -z "$files" ]; then
    echo "descriptor-identical: no .proto files in $1" >&2
    exit 1
  fi
  # shellcheck disable=SC2086
  (cd "$1" && "$py" -m grpc_tools.protoc -I. --include_imports --descriptor_set_out="$2" $files)
}

compile "$tmp/base/ledger-models-protos" "$tmp/base.binpb"
compile "$tree" "$tmp/head.binpb"
if ! cmp -s "$tmp/base.binpb" "$tmp/head.binpb"; then
  echo "descriptor-identical: the descriptor set differs from ${base:0:12}: a proto change beyond comments" >&2
  exit 1
fi
echo "descriptor-identical: byte-identical to ${base:0:12} ($(wc -c <"$tmp/head.binpb") bytes)"
