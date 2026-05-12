#!/usr/bin/env bash
# check-python-wheel-hierarchy.sh
#
# Pre-release guard. Builds the Python wheel and inspects it to confirm
# hierarchy.json is bundled at the expected path inside the package.
#
# Why: v0.2.1 shipped without hierarchy.json in the wheel because
# MANIFEST.in didn't include *.json. Consumers (market-data-inputs) had
# to vendor the file into their own repos as a workaround. v0.2.2 adds
# `recursive-include fintekkers *.json` to MANIFEST.in to fix this;
# this script makes the breakage harder to ship again by failing the
# release if the wheel ever loses the file.
#
# Exits 0 if hierarchy.json is present at the expected path inside the
# built wheel. Exits 1 with a remediation message otherwise.
#
# Pair script: sync-hierarchy-mirrors.sh materializes the mirror from
# the canonical. setup.py invokes it pre-build for local dev; CI's
# pypi-publish workflow invokes it explicitly. This guard runs after
# the wheel is built and unpacks it to verify the result.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_DIR="${REPO_ROOT}/ledger-models-python"
EXPECTED_PATH="fintekkers/wrappers/models/security/hierarchy.json"

if [[ ! -f "${PY_DIR}/setup.py" ]]; then
    echo "ERROR: ${PY_DIR}/setup.py not found" >&2
    exit 1
fi

# Build into a temp dist so we don't disturb whatever's in dist/ already.
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

(
    cd "$PY_DIR"
    BUILD_VERSION="0.0.0-check" python3 setup.py bdist_wheel \
        --dist-dir "$BUILD_DIR" >/dev/null 2>&1
)

WHL="$(ls "$BUILD_DIR"/*.whl 2>/dev/null | head -1)"
if [[ -z "$WHL" ]]; then
    echo "ERROR: no wheel produced under $BUILD_DIR" >&2
    exit 1
fi

# Inspect the wheel — zip archives expose their file listing via unzip -l.
if unzip -l "$WHL" 2>/dev/null | grep -q " $EXPECTED_PATH$"; then
    echo "OK: $EXPECTED_PATH present in $(basename "$WHL")"
    exit 0
fi

echo "ERROR: $EXPECTED_PATH MISSING from the built wheel." >&2
echo "" >&2
echo "Built: $(basename "$WHL")" >&2
echo "" >&2
echo "Remediation:" >&2
echo "  1. Verify MANIFEST.in includes 'recursive-include fintekkers *.json'." >&2
echo "  2. Verify ledger-models-python/fintekkers/wrappers/models/security/hierarchy.json" >&2
echo "     exists (run ./sync-hierarchy-mirrors.sh from the repo root)." >&2
echo "  3. Re-build: rm -rf dist build; BUILD_VERSION=test python3 setup.py bdist_wheel" >&2
echo "  4. Re-inspect: unzip -l dist/*.whl | grep hierarchy.json" >&2
echo "" >&2
echo "Background: v0.2.1 shipped without hierarchy.json, forcing consumers to" >&2
echo "vendor it. v0.2.2 fixed MANIFEST.in. This guard prevents regressing." >&2
exit 1
