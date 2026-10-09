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

echo "== python"
(
  cd ledger-models-python
  [ -x .venv/bin/python ] || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt ruff
  .venv/bin/ruff check .
  .venv/bin/python -m pytest -m 'not integration' -x -q
)

echo "== rust"
(cd ledger-models-rust && cargo test --lib --quiet)

echo "== java"
(cd ledger-models-java && ./gradlew test --quiet --no-daemon --console=plain)

echo "== javascript"
(
  cd ledger-models-javascript
  npm ci --ignore-scripts --no-audit --no-fund
  npm test --silent
)
