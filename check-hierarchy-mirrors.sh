#!/usr/bin/env bash
# check-hierarchy-mirrors.sh
#
# CI guard. Verifies that each language-package mirror of hierarchy.json
# matches the canonical at ledger-models-protos/hierarchy.json byte-for-byte.
#
# Exits 0 if all mirrors agree with the canonical.
# Exits 1 with a clear remediation message if any mirror has drifted.
#
# Pair script: sync-hierarchy-mirrors.sh refreshes the mirrors from the
# canonical. compile.sh calls sync at the top so local builds never see
# drift. This guard is invoked from compile.sh + release.sh (and any CI
# workflow that wants pre-merge enforcement) to catch the case where a
# contributor edits a mirror directly or forgets to re-sync after
# editing the canonical.
#
# See registry-versioning.md for the editing rule.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CANONICAL="${REPO_ROOT}/ledger-models-protos/hierarchy.json"

MIRRORS=(
    "${REPO_ROOT}/ledger-models-rust/hierarchy.json"
    "${REPO_ROOT}/ledger-models-javascript/hierarchy.json"
    "${REPO_ROOT}/ledger-models-python/fintekkers/wrappers/models/security/hierarchy.json"
)

if [[ ! -f "$CANONICAL" ]]; then
    echo "ERROR: canonical hierarchy.json not found at $CANONICAL" >&2
    exit 1
fi

drifted=()
for mirror in "${MIRRORS[@]}"; do
    if [[ ! -f "$mirror" ]]; then
        drifted+=("$mirror (missing)")
        continue
    fi
    if ! diff -q "$CANONICAL" "$mirror" >/dev/null 2>&1; then
        drifted+=("$mirror")
    fi
done

if [[ ${#drifted[@]} -gt 0 ]]; then
    echo "ERROR: hierarchy.json mirror drift detected." >&2
    echo "" >&2
    echo "These mirrors diverge from the canonical at:" >&2
    echo "  $CANONICAL" >&2
    echo "" >&2
    for d in "${drifted[@]}"; do
        echo "  ✗ $d" >&2
    done
    echo "" >&2
    echo "Remediation:" >&2
    echo "  1. NEVER edit a mirror directly — only edit the canonical." >&2
    echo "  2. Run ./sync-hierarchy-mirrors.sh from the repo root to" >&2
    echo "     refresh all mirrors from the canonical." >&2
    echo "  3. Commit the refreshed mirrors." >&2
    echo "" >&2
    echo "See ledger-models-protos/registry-versioning.md for context." >&2
    exit 1
fi

echo "hierarchy.json mirrors verified (${#MIRRORS[@]} mirrors match canonical)"
