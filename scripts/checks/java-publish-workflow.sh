#!/usr/bin/env bash
# Checks the Java GitHub Packages publish (LM-469) wiring, no Gradle run:
# - the gate variable is read from System.getenv('…') in build.gradle's
#   publishing block, never hard-coded here;
# - maven-publish.yml grants packages: write;
# - its ./gradlew publish step names the GitHub Packages task and sets the
#   gate variable from secrets.GITHUB_TOKEN or secrets.PUBLISH_TOKEN;
# - the gate variable is set on that step only (never job or workflow env,
#   where the "run: env" step would print it);
# - maven-central.yml never sets it;
# - maven.pkg.github.com is in build.gradle only inside publishing {}.
# Usage: java-publish-workflow.sh [maven-publish.yml [build.gradle [maven-central.yml]]]
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
workflow="${1:-$root/.github/workflows/maven-publish.yml}"
gradle="${2:-$root/ledger-models-java/build.gradle}"
central="${3:-$root/.github/workflows/maven-central.yml}"
task=publishMavenPublicationToGitHubPackagesRepository

errors=0
err() { echo "java-publish-workflow: $1" >&2; errors=$((errors + 1)); }

# The top-level publishing { … } block of build.gradle.
publishing="$(awk '/^publishing \{/ { on = 1 } on { print } on && /^\}/ { exit }' "$gradle")"
gate="$(sed -nE "s/.*if \(System\.getenv\('([A-Za-z_][A-Za-z0-9_]*)'\)\).*/\1/p" <<<"$publishing" | head -n1)"
if [ -z "$gate" ]; then
  err "no if (System.getenv('…')) gate in the publishing block of $gradle"
  exit 1
fi

if awk '!/^publishing \{/ && !on { print } /^publishing \{/ { on = 1 } on && /^\}/ { on = 0 }' "$gradle" \
  | grep -q 'maven\.pkg\.github\.com'; then
  err "maven.pkg.github.com is in $gradle outside publishing {}: publish target only"
fi

grep -qE '^[[:space:]]*packages:[[:space:]]*write[[:space:]]*(#.*)?$' "$workflow" \
  || err "$workflow does not grant packages: write"

# Prints the step whose run line holds ./gradlew publish, one line each.
publish_step() {
  awk '
    /^[[:space:]]*steps:[[:space:]]*$/ { in_steps = 1; indent = -1; next }
    in_steps && NF {
      match($0, /^[[:space:]]*/); lead = RLENGTH
      if (indent < 0 && substr($0, lead + 1, 2) == "- ") indent = lead
      if (lead < indent) { flush(); in_steps = 0; next }
      if (lead == indent && substr($0, lead + 1, 2) == "- ") flush()
      step = step $0 "\n"
    }
    function flush() { if (step ~ /run:[^\n]*\.\/gradlew publish/) printf "%s", step; step = "" }
    END { flush() }
  ' "$1"
}
step="$(publish_step "$workflow")"
if [ -z "$step" ]; then
  err "$workflow has no step that runs ./gradlew publish"
else
  grep -qE "run:.*\./gradlew publish.*[[:space:]]$task([[:space:]]|$)" <<<"$step" \
    || err "the ./gradlew publish step does not name $task, so a missing token goes green"
  grep -qE "^[[:space:]]*$gate:[[:space:]]*\\$\\{\\{[[:space:]]*secrets\.(GITHUB_TOKEN|PUBLISH_TOKEN)[[:space:]]*\}\}[[:space:]]*$" <<<"$step" \
    || err "the ./gradlew publish step does not set $gate from secrets.GITHUB_TOKEN or secrets.PUBLISH_TOKEN"
fi

# Every line that sets the gate must be in the publish step.
sets="$(grep -cE "^[[:space:]]*$gate:" "$workflow" || true)"
in_step="$(grep -cE "^[[:space:]]*$gate:" <<<"$step" || true)"
[ "$sets" = "$in_step" ] || err "$gate is set outside the ./gradlew publish step of $workflow"

if grep -nE "(^|[^A-Za-z0-9_])$gate([^A-Za-z0-9_]|$)" "$central" >&2; then
  err "$central sets $gate: Maven Central's publish must not reach GitHub Packages"
fi

[ "$errors" -eq 0 ] || exit 1
echo "java-publish-workflow: ok ($gate)"
