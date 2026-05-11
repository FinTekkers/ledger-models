#!/usr/bin/env bash
# check-hierarchy-mirrors.sh
#
# Defensive guard for the release path. Verifies that each language-
# package mirror of hierarchy.json has been materialized AND matches
# the canonical at ledger-models-protos/hierarchy.json byte-for-byte.
#
# Exits 0 if all mirrors exist and agree with the canonical.
# Exits 1 with a clear remediation message if any mirror is missing or
# has drifted.
#
# The mirrors are build artifacts (gitignored). They normally arrive on
# disk via sync-hierarchy-mirrors.sh — called from compile.sh during
# local builds, and from each language's publish workflow right after
# checkout. release.sh's preflight calls THIS guard to fail fast if a
# release is about to ship without the mirrors materialized correctly.
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
