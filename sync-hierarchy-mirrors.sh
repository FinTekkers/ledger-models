#!/usr/bin/env bash
# sync-hierarchy-mirrors.sh
#
# Copy ledger-models-protos/hierarchy.json (the canonical source of truth
# for the FinTekkers product registry) to each language-package mirror so
# cargo / npm / pip can bundle it in their respective tarballs.
#
# Why mirrors exist: cargo publish / npm publish / pip wheel each require
# bundled assets to live inside their package root. The canonical file
# lives in ledger-models-protos/ — outside all three package roots — so
# each language ships an in-package copy.
#
# Java is the exception: Gradle's processResources task copies the
# canonical file into the jar at build time, so no physical mirror is
# needed there.
#
# This script makes drift impossible by overwriting each mirror with the
# canonical version every time it's run. compile.sh calls it at the top.
# check-hierarchy-mirrors.sh (CI guard) verifies the mirrors agree with
# the canonical and fails loudly if any contributor edited a mirror
# directly or forgot to sync after updating the canonical.
#
# Editing rule: only edit ledger-models-protos/hierarchy.json. Never
# edit the mirrors directly. See registry-versioning.md.

set -euo pipefail

# Anchor on the repo root so the script works from any CWD.
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

for mirror in "${MIRRORS[@]}"; do
    cp "$CANONICAL" "$mirror"
done

echo "synced hierarchy.json → ${#MIRRORS[@]} mirrors (rust, javascript, python)"
