#!/usr/bin/env bash
# Shows Sonatype's own answer for a Maven Central Portal deployment (LM-466).
# JReleaser only logs "400: Bad Request" when a Central call fails; this prints
# the response body, which holds the reason.
#
#   central-deployment.sh status  <deployment-id>   print the deployment's state and errors
#   central-deployment.sh publish <deployment-id>   status, then publish it if VALIDATED
#   central-deployment.sh report  <jreleaser-log>   publish, for the first deployment id
#                                                   in a failed jreleaserDeploy log
#
# Credentials come from the same variables JReleaser reads:
# JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME and _PASSWORD.
# Only response bodies and HTTP codes are printed: never the credentials, the
# token or a request header. The token reaches curl on stdin, not in argv.
set -euo pipefail

api="${CENTRAL_API:-https://central.sonatype.com/api/v1/publisher}"
uuid_re='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

die() { echo "$*" >&2; exit 1; }

token() {
  local user="${JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME:-}"
  local pass="${JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_PASSWORD:-}"
  if [ -z "$user" ] || [ -z "$pass" ]; then
    die "missing credentials: JRELEASER_DEPLOY_MAVEN_MAVENCENTRAL_SONATYPE_USERNAME and _PASSWORD must be set"
  fi
  # -w0: GNU base64 wraps at 76 characters, which would split the header.
  TOKEN="$(printf '%s:%s' "$user" "$pass" | base64 -w0)"
  # The runner hides this line and every later occurrence of the token.
  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then echo "::add-mask::$TOKEN"; fi
}

# call <path>: POST to the Central API. Sets CODE and leaves the body in $tmp/body.
call() {
  local status=0
  : >"$tmp/body"
  CODE="$(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" |
    curl -sS -X POST -K - -o "$tmp/body" -w '%{http_code}' "$api/$1")" || status=$?
  if [ "$status" -ne 0 ]; then die "curl failed (exit $status) calling $api/$1"; fi
}

# print_body: the body as-is, so a non-JSON reason is never lost.
print_body() {
  if [ -s "$tmp/body" ]; then cat "$tmp/body"; echo; fi
}

# status <id>: prints the state and errors; sets STATE ("" when unknown).
status() {
  STATE=""
  echo "== status of deployment $1"
  call "status?id=$1"
  if [ "${CODE:0:1}" != "2" ]; then
    echo "HTTP $CODE"
    print_body
    return 1
  fi
  if jq -e . "$tmp/body" >/dev/null 2>&1; then
    jq '{deploymentId, deploymentState, errors}' "$tmp/body"
    STATE="$(jq -r '.deploymentState // ""' "$tmp/body")"
  else
    echo "HTTP $CODE"
    print_body
  fi
}

# publish <id> <how>: publishes a VALIDATED deployment, else says why not.
publish() {
  status "$1" || return 1
  case "$STATE" in
    PUBLISHED) echo "deployment $1 is already PUBLISHED"; return 0 ;;
    VALIDATED) ;;
    *) echo "deployment $1 is ${STATE:-in an unknown state}, not VALIDATED: not publishing"; return 1 ;;
  esac
  echo "== publish deployment $1"
  call "deployment/$1"
  if [ "${CODE:0:1}" = "2" ]; then
    echo "HTTP $CODE: published$2"
    return 0
  fi
  echo "HTTP $CODE"
  print_body
  return 1
}

# deployment_id <log>: the first UUID on a line that mentions a deployment.
deployment_id() {
  { grep -iE 'deployment' "$1" 2>/dev/null || true; } | grep -oE "$uuid_re" | head -n1 || true
}

check_id() {
  [[ "$1" =~ ^${uuid_re}$ ]] || die "not a deployment id: '$1'"
}

[ "$#" -eq 2 ] || die "usage: $0 status|publish <deployment-id> | report <jreleaser-log>"
case "$1" in
  status) check_id "$2"; token; status "$2" ;;
  publish) check_id "$2"; token; publish "$2" "" ;;
  report)
    id="$(deployment_id "$2")"
    [ -n "$id" ] || die "no deployment id in JReleaser output"
    token
    publish "$id" " on retry"
    ;;
  *) die "usage: $0 status|publish <deployment-id> | report <jreleaser-log>" ;;
esac
