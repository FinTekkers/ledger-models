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

echo "== object type helpers only (LM-297)"
# Writers set object_class / version only through the ObjectTypes helpers, so
# both forms stay in step (R15); Rust is checked by the compiler below. The
# ObjectTypeProto names come from the generated enum or the generated legacy
# map, never a hand-written list (R19). Generated code, tests and comment
# lines don't count.
if git grep -nE 'setObjectClass\(|object_class[[:space:]]*=[^=]' -- \
    ledger-models-java/src/main ledger-models-python/fintekkers ledger-models-javascript/node/wrappers \
    ':(exclude)ledger-models-java/src/main/java/common/util/ObjectTypes.java' \
    ':(exclude)ledger-models-python/fintekkers/wrappers/util/object_types.py' \
    ':(exclude)ledger-models-javascript/node/wrappers/util/object-types.*' \
    ':(exclude)*_pb2*' ':(exclude)*.test.*' ':(exclude)*.map' ':(exclude)*.d.ts' \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|/?\*|#)'; then
  echo "object_class written outside the ObjectTypes helpers: call stamp instead" >&2
  exit 1
fi
if git grep -nE "[\"']OBJECT_TYPE_" -- \
    ledger-models-java/src/main ledger-models-python/fintekkers ledger-models-javascript/node/wrappers \
    ledger-models-rust/fintekkers \
    ':(exclude)*_pb2*' ':(exclude)*.test.*' ':(exclude)*.map' ':(exclude)*object*type*legacy.json'; then
  echo "hand-written ObjectTypeProto name: use the generated enum or legacy map" >&2
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
# The JS and Rust legacy-map mirrors match object_type.proto (R20).
PYTHONPATH=ledger-models-python ledger-models-python/.venv/bin/python scripts/gen-object-type-legacy-map.py --check

echo "== rust"
(
  cd ledger-models-rust
  # Library code writes object_class / version only inside object_types.rs,
  # the one place allowed to touch the deprecated fields (LM-297, R15).
  cargo rustc --lib --quiet -- -D deprecated
  cargo test --lib --quiet
  # The test-utils helpers (LM-312): their unit tests, and the consumer-side
  # tests that need the feature.
  cargo test --lib --features test-utils --quiet
  cargo test --features test-utils --test decimal_test_utils_test --quiet
  # CurvePointProto from_tenor / to_tenor (LM-313).
  cargo test --features test-utils --test curve_response_roundtrip_test --quiet
  # Default features never pull in the test-utils dependencies.
  default_deps="$(cargo tree -e normal --prefix none)"
  if grep -q '^prost-reflect ' <<<"$default_deps"; then
    echo "prost-reflect is in the default build: keep it behind the test-utils feature" >&2
    exit 1
  fi
)
# One deprecation warning per process (LM-307): its own test binary, so its
# own process. Named, not a bare `cargo test`.
(cd ledger-models-rust && cargo test --test decimal_deprecation_warning_test --quiet)

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
