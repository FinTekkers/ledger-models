#!/usr/bin/env bash
# The repo's test check: what Horizon runs for every change (main's copy) and
# what to run locally. Same suites as .github/workflows/test.yml: unit tests
# for each language binding plus the broad-except scan. Needs Python 3,
# cargo, JDK 17 and Node.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ -z "${JAVA_HOME:-}" ] && command -v java >/dev/null; then
  JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
  export JAVA_HOME
fi
# Horizon runs this without rustup on PATH.
export PATH="$HOME/.cargo/bin:$PATH"
# No debug info or incremental cache in test builds: keeps target/ small.
export CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0

echo "== broad-except scan"
bash .github/scripts/ban-broad-except.sh

echo "== hierarchy mirrors"
./sync-hierarchy-mirrors.sh

echo "== no api.fintekkers.org default"
# The host is switched off; clients find services via BROKER_HOST and
# friends (LM-278, LM-287). Docs, JS test files, source maps and lines that
# are only a comment don't count.
if git grep -n 'api\.fintekkers\.org' -- \
    ledger-models-java/src/main ledger-models-rust/fintekkers \
    ledger-models-javascript ledger-models-python \
    ':(exclude)*.md' ':(exclude)*.test.*' ':(exclude)*.map' ':(exclude)**/node_modules/**' \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|/?\*|#)'; then
  exit 1
fi

echo "== object type, version and decimal shape (LM-318)"
# Every stamped message declares ObjectTypeProto object_type = 1 and
# VersionProto version = 2; object_class, string version, fields 1001-1004
# and the decimal string are gone from protos, library and generated code.
scripts/checks/proto-shape.sh
scripts/checks/proto-shape.test.sh
# The ObjectTypeProto names come from the generated enum, never a
# hand-written list (R19). Generated code and tests don't count.
if git grep -nE "[\"']OBJECT_TYPE_" -- \
    ledger-models-java/src/main ledger-models-python/fintekkers ledger-models-javascript/node/wrappers \
    ledger-models-rust/fintekkers \
    ':(exclude)*_pb2*' ':(exclude)*.test.*' ':(exclude)*.map'; then
  echo "hand-written ObjectTypeProto name: use the generated enum" >&2
  exit 1
fi

echo "== python"
(
  cd ledger-models-python
  [ -x .venv/bin/python ] || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt ruff
  .venv/bin/ruff check .
  .venv/bin/python -m pytest -m 'not integration' -x -q
)
# No wire change beyond the ones an item allowed in wire-diff.py (LM-318).
ledger-models-python/.venv/bin/python scripts/checks/wire-diff.py

echo "== rust"
(
  cd ledger-models-rust
  # Library code uses no deprecated item.
  cargo rustc --lib --quiet -- -D deprecated
  cargo test --lib --quiet
  # Unit tests and every tests/*.rs file, with the test-utils helpers
  # (LM-312) some of them need (LM-318).
  cargo test --tests --features test-utils --quiet
  # Default features never pull in the test-utils dependencies.
  default_deps="$(cargo tree -e normal --prefix none)"
  if grep -q '^prost-reflect ' <<<"$default_deps"; then
    echo "prost-reflect is in the default build: keep it behind the test-utils feature" >&2
    exit 1
  fi
)

echo "== rust clippy"
# Enforces the #![deny(clippy::unwrap_used, ...)] no-panic rules in
# position_filter_parser.rs (LM-299). Warnings elsewhere don't fail it.
(cd ledger-models-rust && cargo clippy --lib --quiet && cargo clippy --lib --features test-utils --quiet)

echo "== java"
(cd ledger-models-java && ./gradlew test --quiet --no-daemon --console=plain)

echo "== javascript"
(
  # tsc imports the git-ignored hierarchy.json mirror; the publish workflows
  # create it the same way before building.
  ./sync-hierarchy-mirrors.sh
  cd ledger-models-javascript
  npm ci --ignore-scripts --no-audit --no-fund
  # npm publish ships the committed .js with no build step, and jest loads
  # the .js before the .ts: the committed output must match tsc (LM-306).
  # The mirrored hierarchy.json is a build artifact, never committed.
  npx tsc -p tsconfig.json
  stale="$(git status --porcelain --untracked-files=all -- . ':(exclude)hierarchy.json')"
  if [ -n "$stale" ]; then
    echo "Committed JS is out of date with tsc output. Run 'npx tsc -p tsconfig.json' in ledger-models-javascript and commit:"
    echo "$stale"
    exit 1
  fi
  npm test --silent
)
