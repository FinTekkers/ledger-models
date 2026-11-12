#!/usr/bin/env bash
# Tests the Java publish targets (LM-469), no network and no real token:
# - with GITHUB_PACKAGES_TOKEN set, ./gradlew publish --dry-run lists the
#   staging-deploy and GitHub Packages tasks, the GitHub repository URL is
#   https://maven.pkg.github.com/FinTekkers/ledger-models, and the token is
#   never printed;
# - with no token, ./gradlew publish runs no GitHub Packages task and writes
#   the jar, pom, sources and javadoc to build/staging-deploy (Maven Central);
# - java-publish-workflow.sh passes on the real files and fails on broken
#   copies of maven-publish.yml, maven-central.yml and build.gradle.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
java="$root/ledger-models-java"
checker="$root/scripts/checks/java-publish-workflow.sh"
workflow="$root/.github/workflows/maven-publish.yml"
central="$root/.github/workflows/maven-central.yml"
gradle_file="$java/build.gradle"
version=0.0.0-lm469
staging="$java/build/staging-deploy"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp" "$staging"' EXIT

failures=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; [ -z "${2:-}" ] || echo "$2" >&2; failures=$((failures + 1)); }

gh_task=publishMavenPublicationToGitHubPackagesRepository
staging_task=publishMavenPublicationToMavenRepository
gh_url=https://maven.pkg.github.com/FinTekkers/ledger-models

# gradlew <env...> -- <args...>: runs Gradle in ledger-models-java with no
# inherited token, sets OUT and STATUS.
gradlew() {
  local envs=()
  while [ "$1" != -- ]; do envs+=("$1"); shift; done
  shift
  STATUS=0
  OUT="$(cd "$java" && env -u GITHUB_TOKEN -u GITHUB_PACKAGES_TOKEN -u PUBLISH_TOKEN \
    "${envs[@]}" ./gradlew --no-daemon --console=plain "$@" 2>&1)" || STATUS=$?
}

# Metric 1: with a token, both publish tasks and the GitHub URL.
cat >"$tmp/repos.gradle" <<'INIT'
// Prints each publishing repository's name and URL, never its credentials.
gradle.projectsEvaluated {
    gradle.rootProject.publishing.repositories.each { println "REPO ${it.name} ${it.url}" }
}
INIT
gradlew GITHUB_ACTOR=dummy GITHUB_PACKAGES_TOKEN=dummy -- publish --dry-run --init-script "$tmp/repos.gradle"
if [ "$STATUS" -ne 0 ]; then
  bad "token: dry run exits 0" "$OUT"
else
  for t in "$staging_task" "$gh_task"; do
    if grep -qE "^:$t SKIPPED$" <<<"$OUT"; then ok "token: dry run lists $t"; else bad "token: dry run lists $t" "$OUT"; fi
  done
  if grep -qxF "REPO GitHubPackages $gh_url" <<<"$OUT"; then ok "token: GitHubPackages is $gh_url"
  else bad "token: GitHubPackages is $gh_url" "$(grep '^REPO ' <<<"$OUT")"; fi
  if grep -qE "^REPO maven file:.*/build/staging-deploy/?$" <<<"$OUT"; then ok "token: staging-deploy repository unchanged"
  else bad "token: staging-deploy repository unchanged" "$(grep '^REPO ' <<<"$OUT")"; fi
fi
if grep -q dummy <<<"$OUT"; then bad "token: credentials never printed" "$(grep -n dummy <<<"$OUT")"; else ok "token: credentials never printed"; fi

# An empty token, as Actions passes for a missing secret: no GitHub target.
gradlew GITHUB_PACKAGES_TOKEN= -- publish --dry-run
if [ "$STATUS" -eq 0 ] && grep -q "^:$staging_task " <<<"$OUT" && ! grep -q GitHubPackages <<<"$OUT"; then
  ok "empty token: staging-deploy only"
else
  bad "empty token: staging-deploy only" "$OUT"
fi

# Metric 2: no token, a real publish writes staging-deploy only.
rm -rf "$staging"
gradlew run_number="$version" -- publish
if [ "$STATUS" -ne 0 ]; then
  bad "no token: publish exits 0" "$OUT"
else
  if grep -q "^> Task :$staging_task" <<<"$OUT"; then ok "no token: $staging_task runs"; else bad "no token: $staging_task runs" "$OUT"; fi
  if grep -qE 'GitHubPackages|maven\.pkg\.github\.com' <<<"$OUT"; then
    bad "no token: no GitHub Packages task or request" "$(grep -nE 'GitHubPackages|maven\.pkg\.github\.com' <<<"$OUT")"
  else
    ok "no token: no GitHub Packages task or request"
  fi
  dir="$staging/io/github/fintekkers/ledger-models/$version"
  for f in "ledger-models-$version.jar" "ledger-models-$version.pom" \
    "ledger-models-$version-sources.jar" "ledger-models-$version-javadoc.jar"; do
    if [ -s "$dir/$f" ]; then ok "no token: staging-deploy has $f"; else bad "no token: staging-deploy has $f" "$(ls -la "$dir" 2>&1)"; fi
  done
fi

# Metric 3: the workflow check passes on the real files...
if out="$("$checker" 2>&1)"; then ok "workflow check passes"; else bad "workflow check passes" "$out"; fi

# ...and fails on each broken copy. mutate <case> <file> <sed script>.
mutate() {
  local name="$1" file="$2" script="$3" w="$workflow" g="$gradle_file" c="$central"
  sed -E "$script" "$file" >"$tmp/mutant"
  if cmp -s "$file" "$tmp/mutant"; then bad "$name: the mutation changed nothing"; return; fi
  case "$file" in "$workflow") w="$tmp/mutant" ;; "$gradle_file") g="$tmp/mutant" ;; "$central") c="$tmp/mutant" ;; esac
  if out="$("$checker" "$w" "$g" "$c" 2>&1)"; then bad "$name: workflow check fails" "$out"; else ok "$name: workflow check fails"; fi
}
mutate "no packages: write" "$workflow" '/^[[:space:]]*packages:[[:space:]]*write/d'
mutate "PUBLISH_TOKEN only, as before LM-469" "$workflow" \
  "s/^([[:space:]]*)GITHUB_PACKAGES_TOKEN:.*/\1PUBLISH_TOKEN: \${{ secrets.PUBLISH_TOKEN }}/"
mutate "token from a non-secret" "$workflow" 's/secrets\.GITHUB_TOKEN/github.actor/'
mutate "run line without the GitHub task" "$workflow" "s/ $gh_task//"
mutate "token at workflow level" "$workflow" \
  '/^[[:space:]]*GITHUB_PACKAGES_TOKEN:/d; s/^jobs:$/env:\n  GITHUB_PACKAGES_TOKEN: ${{ secrets.GITHUB_TOKEN }}\njobs:/'
mutate "token at job level" "$workflow" \
  '/^[[:space:]]*GITHUB_PACKAGES_TOKEN:/d; s/^(    )permissions:/\1env:\n\1  GITHUB_PACKAGES_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n\1permissions:/'
mutate "token on the run: env step too" "$workflow" \
  's/^(    )(  run: env)$/\1\2\n\1  env:\n\1    GITHUB_PACKAGES_TOKEN: ${{ secrets.GITHUB_TOKEN }}/'
mutate "gate renamed in build.gradle only" "$gradle_file" 's/GITHUB_PACKAGES_TOKEN/GH_PKG_TOKEN/g'
mutate "maven.pkg.github.com as a resolve repository" "$gradle_file" \
  "s|^(    )mavenCentral\(\)$|\1mavenCentral()\n\1maven { url = uri('$gh_url') }|"
mutate "maven-central.yml sets the gate" "$central" \
  's/^([[:space:]]*)run_number: (.*)/\1run_number: \2\n\1GITHUB_PACKAGES_TOKEN: ${{ secrets.GITHUB_TOKEN }}/'

if [ "$failures" -ne 0 ]; then
  echo "$failures failure(s)" >&2
  exit 1
fi
echo "all java publish target tests passed"
