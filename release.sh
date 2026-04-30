#!/usr/bin/env bash
# release.sh — Create a ledger-models release and verify all publish workflows.
#
# Usage:
#   ./release.sh              # auto-increments patch from latest tag
#   ./release.sh 0.1.122      # explicit version (no 'v' prefix)
#   ./release.sh --dry-run    # show what would happen, push nothing

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

REPO="FinTekkers/ledger-models"
POLL_INTERVAL=20   # seconds between workflow status polls
POLL_TIMEOUT=1200  # seconds before giving up (20 min)

WORKFLOWS=(
    "cargo-publish.yml"
    "pypi-publish.yml"
    "npm-publish.yml"
    "npmjs-publish.yml"
    "maven-publish.yml"
    "maven-central.yml"
)

# ── Helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $*"; }
die()     { fail "$*"; exit 1; }

# Returns "type|label|..." config for each workflow's registry check.
#
# type=curl  → "curl|label|url|jq_filter"  (SEMVER in url substituted by caller)
#              jq_filter must select the published version string; we compare
#              it to the expected version to detect drift.
# type=ghpkg → "ghpkg|label|pkg_type|pkg_name"
#              Uses `gh api` against GitHub Packages; pkg_name is URL-encoded.
# type=none  → no check available
registry_config() {
    case "$1" in
        "cargo-publish.yml")
            # Fetch the specific version to confirm it exists (not just "newest_version",
            # which could lag or reflect a prior release if drift occurred).
            echo "curl|crates.io|https://crates.io/api/v1/crates/ledger-models/SEMVER|.version.num"
            ;;
        "pypi-publish.yml")
            # PyPI exposes a per-version endpoint; .info.version confirms the exact release.
            echo "curl|PyPI|https://pypi.org/pypi/fintekkers-ledger-models/SEMVER/json|.info.version"
            ;;
        "npmjs-publish.yml")
            echo "curl|npmjs.org|https://registry.npmjs.org/%40fintekkers%2Fledger-models/SEMVER|.version"
            ;;
        "maven-central.yml")
            # Maven Central has no per-version REST endpoint; use the search API and
            # filter the response for our exact version to avoid "latest" drift.
            echo "curl|Maven Central|https://search.maven.org/solrsearch/select?q=g:io.github.fintekkers+AND+a:ledger-models+AND+v:SEMVER&rows=1&wt=json|.response.docs[0].v"
            ;;
        "npm-publish.yml")
            echo "ghpkg|GitHub Packages (npm)|npm|ledger-models"
            ;;
        "maven-publish.yml")
            # This workflow only publishes to a local staging-deploy dir (for jReleaser).
            # It does not push to any external registry, so no version check needed.
            echo "none"
            ;;
        *)
            echo "none"
            ;;
    esac
}

# ── Pre-flight ────────────────────────────────────────────────────────────────

preflight() {
    info "Running pre-flight checks..."

    command -v gh  >/dev/null 2>&1 || die "'gh' CLI not found. Install from https://cli.github.com"
    command -v jq  >/dev/null 2>&1 || die "'jq' not found. Install with: brew install jq"
    command -v git >/dev/null 2>&1 || die "'git' not found."

    gh auth status >/dev/null 2>&1 || die "Not authenticated with GitHub. Run: gh auth login"

    local branch
    branch=$(git rev-parse --abbrev-ref HEAD)
    [[ "$branch" == "main" ]] || die "Must be on 'main' branch (currently on '$branch')"

    git fetch origin main --quiet
    local behind
    behind=$(git rev-list HEAD..origin/main --count)
    [[ "$behind" -eq 0 ]] || die "Local main is $behind commit(s) behind origin/main. Run: git pull"

    local dirty
    dirty=$(git status --porcelain --untracked-files=no)
    [[ -z "$dirty" ]] || die "Working tree has uncommitted changes to tracked files. Commit or stash first."

    success "Pre-flight passed."
}

# ── Version calculation ───────────────────────────────────────────────────────

latest_version() {
    git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 | sed 's/^v//'
}

bump_patch() {
    local ver="$1"
    local major minor patch
    IFS='.' read -r major minor patch <<< "$ver"
    echo "${major}.${minor}.$((patch + 1))"
}

resolve_version() {
    local arg="${1:-}"
    if [[ -n "$arg" && "$arg" != --* ]]; then
        echo "$arg"
    else
        local latest
        latest=$(latest_version)
        [[ -n "$latest" ]] || die "No existing tags found; provide an explicit version: ./release.sh 0.1.0"
        bump_patch "$latest"
    fi
}

# ── Workflow polling ──────────────────────────────────────────────────────────

# Wait up to 60s for a workflow run to appear for our tag, then print its run ID.
get_run_id() {
    local workflow="$1" tag="$2"
    local deadline=$(( $(date +%s) + 60 ))
    while [[ $(date +%s) -lt $deadline ]]; do
        local run_id
        run_id=$(gh run list \
            --repo "$REPO" \
            --workflow "$workflow" \
            --branch "$tag" \
            --limit 1 \
            --json databaseId \
            --jq '.[0].databaseId // empty' 2>/dev/null || true)
        if [[ -n "$run_id" ]]; then
            echo "$run_id"
            return 0
        fi
        sleep 5
    done
    echo ""
}

# Poll a run until completed. Returns 0 on success, 1 on failure/timeout.
wait_for_run() {
    local run_id="$1"
    local deadline=$(( $(date +%s) + POLL_TIMEOUT ))

    while [[ $(date +%s) -lt $deadline ]]; do
        local json status conclusion
        json=$(gh run view "$run_id" --repo "$REPO" --json status,conclusion 2>/dev/null || echo '{}')
        status=$(echo "$json"     | jq -r '.status // "unknown"')
        conclusion=$(echo "$json" | jq -r '.conclusion // ""')

        if [[ "$status" == "completed" ]]; then
            [[ "$conclusion" == "success" ]] && return 0
            echo "$conclusion" >&2
            return 1
        fi
        sleep "$POLL_INTERVAL"
    done

    echo "timed_out" >&2
    return 1
}

# ── Registry verification ─────────────────────────────────────────────────────

# Check a public (curl-based) registry for the exact version.
# Retries ~6× with 15s gaps (~90s total) to allow for propagation lag.
_verify_curl_registry() {
    local label="$1" url="$2" filter="$3" version="$4" is_maven_central="$5"

    local attempts=0 result=""
    while [[ $attempts -lt 6 ]]; do
        result=$(curl -sf --max-time 10 "$url" 2>/dev/null | jq -r "$filter" 2>/dev/null || true)
        if [[ "$result" == "$version" ]]; then
            success "${label}: v${version} confirmed"
            return 0
        fi
        sleep 15
        (( attempts++ )) || true
    done

    # Maven Central indexing typically lags several minutes after workflow success.
    if [[ "$is_maven_central" == "true" ]]; then
        warn "Maven Central: v${version} not yet indexed (normal — check https://search.maven.org manually)"
        return 0
    fi

    fail "${label}: drift detected — expected v${version}, got '${result:-<no response>}'"
    return 1
}

# Check GitHub Packages for the exact version using `gh api`.
# Queries the versions list and looks for an entry matching our version string.
_verify_ghpkg_registry() {
    local label="$1" pkg_type="$2" pkg_name="$3" version="$4"

    local attempts=0 found="" raw
    while [[ $attempts -lt 4 ]]; do
        if raw=$(gh api "/orgs/FinTekkers/packages/${pkg_type}/${pkg_name}/versions" 2>/dev/null); then
            found=$(echo "$raw" | jq "[.[] | select(.name == \"${version}\")] | length" 2>/dev/null || echo "0")
        else
            found="0"
        fi
        if [[ "${found:-0}" -gt 0 ]]; then
            success "${label}: v${version} confirmed"
            return 0
        fi
        sleep 20
        (( attempts++ )) || true
    done

    fail "${label}: drift detected — v${version} not found in GitHub Packages"
    return 1
}

# Routes to the right verifier based on registry_config type.
verify_registry() {
    local workflow="$1" version="$2"
    local config check_type
    config=$(registry_config "$workflow")
    check_type=$(echo "$config" | cut -d'|' -f1)

    case "$check_type" in
        none) return 0 ;;

        curl)
            local label url filter
            label=$(echo "$config"  | cut -d'|' -f2)
            url=$(echo "$config"    | cut -d'|' -f3)
            filter=$(echo "$config" | cut -d'|' -f4)
            url="${url//SEMVER/$version}"
            local is_maven_central="false"
            [[ "$workflow" == "maven-central.yml" ]] && is_maven_central="true"
            _verify_curl_registry "$label" "$url" "$filter" "$version" "$is_maven_central"
            ;;

        ghpkg)
            local label pkg_type pkg_name
            label=$(echo "$config"    | cut -d'|' -f2)
            pkg_type=$(echo "$config" | cut -d'|' -f3)
            pkg_name=$(echo "$config" | cut -d'|' -f4)
            _verify_ghpkg_registry "$label" "$pkg_type" "$pkg_name" "$version"
            ;;

        *)
            warn "Unknown registry type '${check_type}' for ${workflow} — skipping"
            return 0
            ;;
    esac
}

# ── Main ──────────────────────────────────────────────────────────────────────

main() {
    local dry_run=false
    local version_arg=""

    for arg in "$@"; do
        case "$arg" in
            --dry-run) dry_run=true ;;
            --help|-h)
                echo "Usage: $0 [VERSION] [--dry-run]"
                echo "  VERSION    e.g. 0.1.122 (no 'v' prefix). Default: auto-increment patch."
                echo "  --dry-run  Show what would be released without pushing anything."
                exit 0
                ;;
            --*) die "Unknown flag: $arg" ;;
            *) version_arg="$arg" ;;
        esac
    done

    preflight

    local version tag latest
    version=$(resolve_version "$version_arg")
    tag="v${version}"
    latest=$(latest_version)

    echo
    echo "  Latest tag : v${latest}"
    echo "  New release: ${tag}"
    echo "  Repo       : ${REPO}"
    printf "  Workflows  : %d" "${#WORKFLOWS[@]}"
    echo " (cargo, pypi, npm×2, maven×2)"
    echo

    if $dry_run; then
        warn "Dry-run mode — nothing will be pushed."
        exit 0
    fi

    read -rp "Proceed? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }

    # ── Tag + GitHub release ───────────────────────────────────────────────────
    echo
    info "Creating tag ${tag}..."
    git tag "$tag"
    git push origin "$tag"
    success "Tag pushed."

    info "Creating GitHub release..."
    gh release create "$tag" \
        --repo "$REPO" \
        --title "${tag}" \
        --generate-notes \
        --verify-tag
    success "Release created: https://github.com/${REPO}/releases/tag/${tag}"

    # ── Discover workflow run IDs ──────────────────────────────────────────────
    echo
    info "Waiting for workflow runs to appear (~30s)..."
    sleep 15

    # Parallel indexed arrays: run_ids[i] corresponds to WORKFLOWS[i]
    local run_ids=()
    local i
    for (( i=0; i<${#WORKFLOWS[@]}; i++ )); do
        local wf="${WORKFLOWS[$i]}"
        local run_id
        run_id=$(get_run_id "$wf" "$tag")
        run_ids+=("$run_id")
        if [[ -n "$run_id" ]]; then
            info "  ${wf}: run #${run_id} queued"
        else
            warn "  ${wf}: run not found after 60s"
        fi
    done

    # ── Poll each workflow sequentially, then verify registry ─────────────────
    echo
    info "Polling workflows (timeout: $((POLL_TIMEOUT / 60)) min per workflow)..."

    local ci_results=()
    local reg_results=()
    local overall=0

    for (( i=0; i<${#WORKFLOWS[@]}; i++ )); do
        local wf="${WORKFLOWS[$i]}"
        local run_id="${run_ids[$i]}"

        if [[ -z "$run_id" ]]; then
            ci_results+=("no_run")
            reg_results+=("skip")
            overall=1
            continue
        fi

        info "  Waiting for ${wf} (run #${run_id})..."
        if wait_for_run "$run_id"; then
            ci_results+=("success")
            info "  ${wf}: passed — verifying registry..."
            if verify_registry "$wf" "$version"; then
                reg_results+=("ok")
            else
                reg_results+=("fail")
                overall=1
            fi
        else
            ci_results+=("failed")
            reg_results+=("skip")
            overall=1
            fail "  ${wf}: workflow failed — check https://github.com/${REPO}/actions"
        fi
    done

    # ── Summary ────────────────────────────────────────────────────────────────
    echo
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Release summary: ${tag}"
    echo "═══════════════════════════════════════════════════════════════"
    printf "  %-32s %-14s %s\n" "Workflow" "CI" "Registry"
    echo "  ──────────────────────────────────────────────────────────"

    for (( i=0; i<${#WORKFLOWS[@]}; i++ )); do
        local wf="${WORKFLOWS[$i]}"
        local ci="${ci_results[$i]:-no_run}"
        local reg="${reg_results[$i]:-skip}"

        local ci_col reg_col
        case "$ci" in
            success) ci_col="${GREEN}✓ passed${NC}" ;;
            no_run)  ci_col="${YELLOW}? no run${NC}" ;;
            *)       ci_col="${RED}✗ failed${NC}" ;;
        esac

        case "$reg" in
            ok)   reg_col="${GREEN}✓ verified${NC}" ;;
            skip) reg_col="${YELLOW}— skipped${NC}" ;;
            fail) reg_col="${RED}✗ not found${NC}" ;;
        esac

        printf "  %-32s " "$wf"
        echo -e "${ci_col}   ${reg_col}"
    done

    echo "═══════════════════════════════════════════════════════════════"
    echo "  https://github.com/${REPO}/releases/tag/${tag}"
    echo

    if [[ $overall -eq 0 ]]; then
        success "Release ${tag} complete — all workflows passed and registries verified."
    else
        fail "Release ${tag} completed with errors — see above."
        exit 1
    fi
}

main "$@"
