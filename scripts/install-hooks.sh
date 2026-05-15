#!/usr/bin/env bash
# Install the repo's pre-push hook by pointing git at .githooks/.
# Run once per clone. Idempotent.
set -euo pipefail
git config core.hooksPath .githooks
echo "git core.hooksPath -> .githooks (pre-push will run on next push)"
