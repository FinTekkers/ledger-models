#!/usr/bin/env bash
# Tests central-deployment.sh (LM-466) against a stub curl first on PATH: no
# network. Every failure path prints Sonatype's body and the HTTP code, a
# publish that works on retry exits 0, and no output ever holds the
# credentials, their base64 token, "Bearer" or "Authorization".
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
script="$here/central-deployment.sh"
fixture="$here/fixtures/jreleaser-1.27.0-deploy.log"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

failures=0
ok() { echo "ok   $1"; }
bad() { echo "FAIL $1" >&2; [ -z "${2:-}" ] || echo "$2" >&2; failures=$((failures + 1)); }

id=6700f128-f067-4d7d-8a0a-7b5a0b317a02
# Over 76 characters together, so an unwrapped base64 would split the header.
user="fake-user-$(printf 'u%.0s' {1..40})"
pass="fake-pass-$(printf 'p%.0s' {1..40})"
token="$(printf '%s:%s' "$user" "$pass" | base64 -w0)"

# The stub answers from $STUB: <kind>.code, <kind>.body and an optional
# curl.exit, where kind is status or publish. It records argv and stdin.
mkdir -p "$tmp/bin"
cat >"$tmp/bin/curl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$@" >>"$STUB/args"
cat >>"$STUB/stdin"
if [ -f "$STUB/curl.exit" ]; then echo "curl: (6) Could not resolve host" >&2; exit "$(cat "$STUB/curl.exit")"; fi
out="" url=""
while [ "$#" -gt 0 ]; do
  case "$1" in -o) out="$2"; shift ;; http*) url="$1" ;; esac
  shift
done
case "$url" in */status\?id=*) kind=status ;; */deployment/*) kind=publish ;; *) kind=unknown ;; esac
echo "$kind" >>"$STUB/calls"
cat "$STUB/$kind.body" >"$out" 2>/dev/null || : >"$out"
cat "$STUB/$kind.code" 2>/dev/null || printf 500
STUB
chmod +x "$tmp/bin/curl"

# scenario: a fresh stub directory.
scenario() { rm -rf "$tmp/stub"; mkdir -p "$tmp/stub"; }
answer() { printf '%s' "$2" >"$tmp/stub/$1.code"; printf '%s' "$3" >"$tmp/stub/$1.body"; }
validated='{"deploymentId":"'$id'","deploymentName":"ledger-models","deploymentState":"VALIDATED","purls":["pkg:maven/io.github.fintekkers/ledger-models@1.1.44"],"errors":{}}'

# run <args...>: sets OUT (stdout and stderr) and STATUS.
run() {
  STATUS=0
  OUT="$(env -u GITHUB_ACTIONS PATH="$tmp/bin:$PATH" STUB="$tmp/stub" \
    JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME="$user" \
    JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_PASSWORD="$pass" \
    "$script" "$@" 2>&1)" || STATUS=$?
  no_secrets "$1 ${2##*/}"
}

# no_secrets <case>: guardrail, checked after every run.
no_secrets() {
  local s
  for s in "$user" "$pass" "$token" "${token:0:20}" Bearer Authorization; do
    if grep -qF -- "$s" <<<"$OUT"; then bad "$1: output holds a secret or header (${s:0:12}...)" "$OUT"; return; fi
  done
}

expect() { # expect <case> <exit> <text...>
  local name="$1" want="$2" t; shift 2
  if [ "$STATUS" -ne "$want" ]; then bad "$name (exit $STATUS, want $want)" "$OUT"; return; fi
  for t in "$@"; do
    if ! grep -qF -- "$t" <<<"$OUT"; then bad "$name: missing '$t'" "$OUT"; return; fi
  done
  ok "$name"
}

# Publish 400 with a JSON body: the body and the code are printed.
scenario; answer status 200 "$validated"
answer publish 400 '{"error":{"message":"Deployment 6700f128 cannot be published: component already exists"}}'
run publish "$id"
expect "publish 400, JSON body" 1 "HTTP 400" "component already exists" '"deploymentState": "VALIDATED"'

# Publish 400 with a non-JSON body: printed unchanged.
scenario; answer status 200 "$validated"; answer publish 400 'Bad Request: namespace not verified <html>'
run publish "$id"
expect "publish 400, non-JSON body" 1 "HTTP 400" "Bad Request: namespace not verified <html>"

# Status itself fails: its code and body are printed, and nothing is published.
scenario; answer status 404 '{"error":{"message":"Deployment not found"}}'
run status 00000000-0000-4000-8000-000000000000
expect "status 404" 1 "HTTP 404" "Deployment not found"

# Status prints only deploymentId, deploymentState and errors.
scenario
answer status 200 '{"deploymentId":"'$id'","deploymentName":"secret-name","deploymentState":"FAILED","purls":["pkg:maven/x@1"],"errors":{"pkg:maven/x@1":["Missing signature for file: x.jar"]}}'
run status "$id"
expect "status shows state and errors" 0 '"deploymentState": "FAILED"' "Missing signature for file: x.jar" "\"deploymentId\": \"$id\""
if grep -qE 'secret-name|purls' <<<"$OUT"; then bad "status prints only deploymentId, deploymentState and errors" "$OUT"; else ok "status hides other fields"; fi

# A deployment that is not VALIDATED is never published.
run publish "$id"
expect "FAILED deployment is not published" 1 "is FAILED, not VALIDATED: not publishing"
if grep -qx publish "$tmp/stub/calls"; then bad "FAILED deployment: publish was called"; else ok "FAILED deployment: no publish call"; fi

# Already published: says so, no second publish call.
scenario; answer status 200 "${validated/VALIDATED/PUBLISHED}"
run publish "$id"
expect "already PUBLISHED" 0 "is already PUBLISHED"

# Report: the failed deploy's id comes from the 1.27.0 log, and a 204 on the
# retry exits 0.
scenario; answer status 200 "$validated"; answer publish 204 ''
run report "$fixture"
expect "report, publish 204 on retry" 0 "status of deployment $id" "published on retry"
if grep -q "deployment/$id" "$tmp/stub/args"; then ok "report publishes the id from the log"; else bad "report publishes the id from the log" "$(cat "$tmp/stub/args")"; fi
if grep -q '3b7e0a52' "$tmp/stub/args"; then bad "report used a UUID from a non-deployment line"; else ok "report skips UUIDs on other lines"; fi

# Report: retry fails, still red.
scenario; answer status 200 "$validated"; answer publish 400 '{"error":"bad"}'
run report "$fixture"
expect "report, publish 400 on retry" 1 "HTTP 400" '{"error":"bad"}'

# Report: no deployment id in the log.
scenario; printf '[INFO]  Deploying Maven artifacts\n[ERROR] 400: Bad Request\n' >"$tmp/nolog"
run report "$tmp/nolog"
expect "no deployment id" 1 "no deployment id in JReleaser output"
if [ -s "$tmp/stub/calls" ]; then bad "no deployment id: curl was called"; fi

# curl fails: its exit code is printed.
scenario; echo 6 >"$tmp/stub/curl.exit"
run status "$id"
expect "curl failure" 1 "curl failed (exit 6)"

# A malformed id is refused before any call.
scenario
run publish 'not-a-uuid'
expect "malformed id" 1 "not a deployment id"
if [ -s "$tmp/stub/calls" ]; then bad "malformed id: curl was called"; fi

# Missing credentials: a clear message, no call.
scenario
STATUS=0
OUT="$(env -u GITHUB_ACTIONS -u JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME \
  -u JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_PASSWORD PATH="$tmp/bin:$PATH" STUB="$tmp/stub" \
  "$script" status "$id" 2>&1)" || STATUS=$?
expect "missing credentials" 1 "missing credentials"

# The token reaches curl as one header line on stdin, never in argv.
scenario; answer status 200 "$validated"
run status "$id"
if grep -qF "$token" "$tmp/stub/args"; then bad "token is in curl's argv"; else ok "token not in argv"; fi
if [ "$(grep -c . "$tmp/stub/stdin")" -eq 1 ] && grep -qxF "header = \"Authorization: Bearer $token\"" "$tmp/stub/stdin"; then
  ok "long credentials give a single-line header"
else
  bad "long credentials give a single-line header" "$(cat "$tmp/stub/stdin")"
fi

# On a runner, the token is masked before the first call.
scenario; answer status 200 "$validated"
STATUS=0
OUT="$(GITHUB_ACTIONS=true PATH="$tmp/bin:$PATH" STUB="$tmp/stub" \
  JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME="$user" \
  JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_PASSWORD="$pass" \
  "$script" status "$id" 2>&1)" || STATUS=$?
if [ "$(head -n1 <<<"$OUT")" = "::add-mask::$token" ] && [ "$(grep -cF "$token" <<<"$OUT")" -eq 1 ]; then
  ok "token masked first on a runner"
else
  bad "token masked first on a runner" "$OUT"
fi

[ "$failures" -eq 0 ] || { echo "$failures failure(s)" >&2; exit 1; }
