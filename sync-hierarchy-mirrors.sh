#!/usr/bin/env bash
# sync-hierarchy-mirrors.sh
#
# Materializes the three language-package mirrors of hierarchy.json from
# the canonical source of truth at ledger-models-protos/hierarchy.json.
#
# The mirrors are BUILD ARTIFACTS, not committed files. Only the canonical
# lives in source control (see .gitignore entries pointing here). This
# script generates the mirrors when needed:
#   - compile.sh calls it at the start of every local build.
#   - Each language's publish workflow (cargo / pypi / npmjs / npm) calls
#     it right after checkout, before the language-specific publish step
#     reads its package manifest's bundled-assets list.
#
# Why mirrors are needed at all: cargo publish / npm publish / pip wheel
# each require bundled assets to live inside their package root. The
# canonical at ledger-models-protos/hierarchy.json is OUTSIDE all three
# package roots, so each language must ship an in-package copy in its
# registry tarball.
#
# Java is the exception: Gradle's processResources task reads the
# canonical directly via ../ledger-models-protos/ and copies it into the
# jar at build time. No script-generated mirror needed.
#
# Editing rule: only edit ledger-models-protos/hierarchy.json. The mirror
# locations under ledger-models-{rust,javascript,python}/ are gitignored
# and rewritten on every sync. See registry-versioning.md.

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
