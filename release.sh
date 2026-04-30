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

# Returns "label|url|jq_filter" for workflows that publish to a public registry.
# SEMVER in the url is substituted by the caller. Returns empty for GitHub Packages
# workflows (auth required — verified via CI conclusion only).
registry_config() {
    case "$1" in
        "cargo-publish.yml")
            echo "crates.io|https://crates.io/api/v1/crates/ledger-models|.crate.newest_version"
            ;;
        "pypi-publish.yml")
            echo "PyPI|https://pypi.org/pypi/fintekkers-ledger-models/json|.info.version"
            ;;
        "npmjs-publish.yml")
            echo "npmjs.org|https://registry.npmjs.org/%40fintekkers%2Fledger-models/SEMVER|.version"
            ;;
        "maven-central.yml")
            echo "Maven Central|https://search.maven.org/solrsearch/select?q=g:io.github.fintekkers+AND+a:ledger-models&rows=1&wt=json|.response.docs[0].latestVersion"
            ;;
        *)
            echo ""  # GitHub Packages — no public endpoint
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

# Returns 0 if the version is visible in the public registry, 1 otherwise.
# Retries for ~90s to allow for propagation lag.
verify_registry() {
    local workflow="$1" version="$2"
    local config
    config=$(registry_config "$workflow")
    [[ -n "$config" ]] || return 0  # GitHub Packages — skip

    local label url filter
    IFS='|' read -r label url filter <<< "$config"
    url="${url//SEMVER/$version}"

    local attempts=0
    while [[ $attempts -lt 6 ]]; do
        local result
        result=$(curl -sf --max-time 10 "$url" 2>/dev/null | jq -r "$filter" 2>/dev/null || true)
        if [[ "$result" == "$version" ]]; then
            success "${label}: v${version} confirmed"
            return 0
        fi
        sleep 15
        (( attempts++ )) || true
    done

    # Maven Central indexing can lag several minutes — warn but don't block
    if [[ "$workflow" == "maven-central.yml" ]]; then
        warn "Maven Central: v${version} not yet indexed (normal lag — verify manually)"
        return 0
    fi

    local label_only
    label_only=$(echo "$config" | cut -d'|' -f1)
    fail "${label_only}: expected v${version}, got '${result:-<no response>}'"
    return 1
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
