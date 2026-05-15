#!/usr/bin/env bash
# Ban silent broad-catch patterns across all languages in this repo.
# Counterpart to ruff BLE001 for Python; cross-language coverage for the
# rest. See second-brain/processes/test-discipline.md (silent-failure
# guardrails) and #297.
#
# A broad catch is fine ONLY when it logs *and* either re-raises or marks
# the operation failed. A bare `pass` (or empty block) is never OK in
# production code paths.
#
# Excludes: vendored deps, build artifacts, tests/ (test discards are
# usually deliberate), and generated proto code.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fail=0

# ---------- Python: bare/broad except followed by `pass` ----------
# This script catches only the egregious silent-pass shape. Nuanced cases
# (catch + log without raise; catch + set_exception + raise) are handled
# by `ruff` rule BLE001 in CI for ledger-models-python.
py_hits=$(
  grep -rEnA1 --include='*.py' \
    -e '^[[:space:]]*except[[:space:]]*:[[:space:]]*$' \
    -e '^[[:space:]]*except[[:space:]]+(Exception|BaseException)[[:space:]]*:[[:space:]]*$' \
    "$ROOT" \
    --exclude-dir=venv --exclude-dir=.venv --exclude-dir=build --exclude-dir=node_modules \
    --exclude-dir=test --exclude-dir=tests --exclude-dir=target --exclude-dir=.github 2>/dev/null \
  | grep -B1 -E '^[^:]+-[[:space:]]*pass[[:space:]]*$' || true
)
if [ -n "$py_hits" ]; then
  echo "ban-broad-except: Python broad/bare excepts (use a narrow exception or log_and_raise):"
  echo "$py_hits" | sed 's/^/  /'
  fail=1
fi

# ---------- Java: catch (Exception|Throwable ...) { } empty ----------
java_hits=$(
  grep -rEn --include='*.java' \
    -e 'catch[[:space:]]*\([[:space:]]*(Exception|Throwable|RuntimeException)[[:space:]]+[A-Za-z_]+[[:space:]]*\)[[:space:]]*\{[[:space:]]*\}' \
    "$ROOT" \
    --exclude-dir=node_modules --exclude-dir=build --exclude-dir=target \
    --exclude-dir=src/test --exclude-dir=test --exclude-dir=.github 2>/dev/null || true
)
if [ -n "$java_hits" ]; then
  echo "ban-broad-except: Java empty catch (Exception/Throwable):"
  echo "$java_hits" | sed 's/^/  /'
  fail=1
fi

# ---------- JS/TS: empty catch (e) { } ----------
js_hits=$(
  grep -rEn --include='*.js' --include='*.ts' --include='*.svelte' \
    -e 'catch[[:space:]]*\([^)]*\)[[:space:]]*\{[[:space:]]*\}' \
    "$ROOT" \
    --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist \
    --exclude-dir=tests --exclude-dir=test --exclude-dir=.svelte-kit \
    --exclude-dir=.github 2>/dev/null || true
)
if [ -n "$js_hits" ]; then
  echo "ban-broad-except: JS/TS empty catch:"
  echo "$js_hits" | sed 's/^/  /'
  fail=1
fi

# ---------- Rust: .ok() / .unwrap_or_default() on a Result that swallows Err? ----------
# Heuristic: flag `let _ = <expr>?` (impossible) and `.ok();` on its own line
# (clearly discarding). Rust's strict types make this a much smaller surface.
rust_hits=$(
  grep -rEn --include='*.rs' \
    -e '^\s*[A-Za-z_].*\.ok\(\)\s*;[[:space:]]*$' \
    "$ROOT" \
    --exclude-dir=target --exclude-dir=tests --exclude-dir=.github 2>/dev/null || true
)
if [ -n "$rust_hits" ]; then
  echo "ban-broad-except: Rust Result silently discarded with .ok();"
  echo "$rust_hits" | sed 's/^/  /'
  fail=1
fi

if [ $fail -ne 0 ]; then
  echo
  echo "Per processes/test-discipline.md (silent-failure guardrails) and #297:"
  echo "  - Use a narrow exception type, or"
  echo "  - log AND raise / mark the operation failed, or"
  echo "  - if the catch is genuinely intended (cleanup-best-effort, etc.),"
  echo "    annotate with the narrowest possible type and a comment."
  exit 1
fi
