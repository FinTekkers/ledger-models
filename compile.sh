#!/bin/bash
set -uo pipefail

# compile.sh — Regenerate proto bindings for all languages and run tests.
# Exits with non-zero if any language fails compilation or tests.
#
# Usage: ./compile.sh [--skip-integration]
#   --skip-integration  Skip all tests that require a running backend service.
#                       Unit tests still run. Use this in CI or when services
#                       are not available locally.

# Ensure Homebrew is on PATH for any non-proto tools that come from there
# (e.g. node, python). Proto generation pins to npm grpc-tools — see the
# JS section below — so PATH-resolved protoc is no longer used.
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

SKIP_INTEGRATION=false
for arg in "$@"; do
    case "$arg" in
        --skip-integration) SKIP_INTEGRATION=true ;;
        *) echo "Unknown argument: $arg"; exit 1 ;;
    esac
done

# Track results for summary table
RUST_COMPILE="SKIP"   ; RUST_TESTS="SKIP"
JAVA_COMPILE="SKIP"   ; JAVA_TESTS="SKIP"
JS_COMPILE="SKIP"     ; JS_TESTS="SKIP"
PY_COMPILE="SKIP"     ; PY_TESTS="SKIP"
PY_INTEG="SKIP"
FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=1; }

###########################################
######### TOOLCHAIN PIN ENFORCEMENT #######
###########################################
# Per FinTekkers/second-brain#228, all four language regen toolchains are
# pinned so output is byte-deterministic across hosts:
#   - JS:     npm grpc-tools (bundles protoc 3.19.1 + grpc_node_plugin),
#             pinned in ledger-models-javascript/package.json devDeps.
#             See compile.sh-gate ticket #218 for history.
#   - Rust:   tonic-build / prost-build pinned in Cargo.lock; gen.rs sorts
#             walkdir output for filesystem-independence; PROTOC env points
#             at the same npm grpc-tools binary used by JS so the .bin
#             descriptor bytes match CI byte-for-byte.
#   - Python: grpcio-tools + protobuf pinned in requirements.txt. Versions
#             are baked into generated *_pb2*.py headers, so unpinned drift
#             produces ~80 spurious header diffs on every regen.
#   - Java:   protocVersion / grpcVersion / protobuf-gradle-plugin all
#             pinned in ledger-models-java/build.gradle. Already
#             host-deterministic; no compile.sh-side action needed.
#
# Rosetta dependency on Mac ARM: the npm grpc-tools binaries are x86_64.
# One-time install:  softwareupdate --install-rosetta --agree-to-license
JS_DIR="$REPO_ROOT/ledger-models-javascript"
PROTO_DIR="$REPO_ROOT/ledger-models-protos"
JS_OUT="$JS_DIR/node"
TS_PLUGIN="$JS_DIR/node_modules/.bin/protoc-gen-ts"
PROTOC="$JS_DIR/node_modules/grpc-tools/bin/protoc"
GRPC_PLUGIN="$JS_DIR/node_modules/grpc-tools/bin/grpc_node_plugin"

# Pre-flight: the bundled toolchain must exist before Rust/JS regen runs.
# CI installs it via `npm ci` before invoking compile.sh; locally it's
# whatever the developer last installed.
if [ ! -x "$PROTOC" ] || [ ! -x "$GRPC_PLUGIN" ]; then
    echo "ERROR: grpc-tools binaries not found at $JS_DIR/node_modules/grpc-tools/bin/"
    echo "       Run: cd ledger-models-javascript && npm ci"
    exit 1
elif ! "$PROTOC" --version > /dev/null 2>&1; then
    echo "ERROR: $PROTOC could not execute. The bundled binary is x86_64;"
    echo "       on Mac ARM you need Rosetta 2:"
    echo "         softwareupdate --install-rosetta --agree-to-license"
    exit 1
fi

###########################################
######### CATALOG FILE DISTRIBUTION #######
###########################################
echo "=== Distributing catalog files ==="

CATALOG_SRC="ledger-models-protos/catalog"
mkdir -p ledger-models-javascript/catalog
cp "$CATALOG_SRC"/*.json ledger-models-javascript/catalog/

mkdir -p ledger-models-java/src/main/resources/catalog
cp "$CATALOG_SRC"/*.json ledger-models-java/src/main/resources/catalog/

mkdir -p ledger-models-rust/catalog
cp "$CATALOG_SRC"/*.json ledger-models-rust/catalog/

mkdir -p ledger-models-python/fintekkers/catalog
cp "$CATALOG_SRC"/*.json ledger-models-python/fintekkers/catalog/
touch ledger-models-python/fintekkers/catalog/__init__.py

pass "Catalog files copied to all languages"

###########################################
######### HIERARCHY.JSON MIRRORS ##########
###########################################
echo ""
echo "=== Syncing hierarchy.json mirrors ==="
./sync-hierarchy-mirrors.sh
pass "hierarchy.json synced to language-package mirrors"

#########################################
######### RUST PROTO GENERATION #########
#########################################
echo ""
echo "=== Rust: generating protos ==="
# tonic-build / prost-build invoke `which protoc` if PROTOC is unset.
# Pin to the same npm grpc-tools binary used by the JS section so the
# descriptor.bin bytes are stable across hosts (different protoc minor
# versions emit slightly different source_code_info / syntax encoding
# fields in the FileDescriptorSet — generated *.rs files don't differ).
if (cd ledger-models-rust && PROTOC="$PROTOC" cargo run --bin gen 2>&1); then
    RUST_COMPILE="PASS"
    pass "Rust compile"
else
    RUST_COMPILE="FAIL"
    fail "Rust compile"
fi

echo "=== Rust: running tests ==="
if (cd ledger-models-rust && cargo test 2>&1); then
    RUST_TESTS="PASS"
    pass "Rust tests"
else
    RUST_TESTS="FAIL"
    fail "Rust tests"
fi

#########################################
######### JAVA PROTO GENERATION #########
#########################################
echo ""
echo "=== Java: generating protos + building ==="
if (cd ledger-models-java && ./gradlew clean build 2>&1); then
    JAVA_COMPILE="PASS"
    JAVA_TESTS="PASS"
    pass "Java compile + tests"
else
    # build includes test — if it failed, distinguish compile vs test
    if (cd ledger-models-java && ./gradlew clean compileJava 2>&1 >/dev/null); then
        JAVA_COMPILE="PASS"
        JAVA_TESTS="FAIL"
        fail "Java tests"
    else
        JAVA_COMPILE="FAIL"
        fail "Java compile"
    fi
fi

###########################################
######### JAVASCRIPT PROTO GENERATION #####
###########################################
echo ""
echo "=== JavaScript: generating protos ==="

# JS_DIR / PROTO_DIR / JS_OUT / TS_PLUGIN / PROTOC / GRPC_PLUGIN all defined
# in the toolchain pin block at the top of this script. Pre-flight check
# (binaries exist + executable) also happens there, so by the time we get
# here those guarantees hold — JS_COMPILE_OK can start at true.
JS_COMPILE_OK=true

cd "$PROTO_DIR"

# Generate JS + gRPC service stubs for services, requests, models.
# protoc 3.19.1 has the JS generator (--js_out) built in, and
# grpc_node_plugin from grpc-tools generates the gRPC stubs.
for PATTERN in "**/services/**/*.proto" "**/requests/**/*.proto" "**/models/**/*.proto"; do
    if ! $PROTOC \
        --js_out=import_style=commonjs,binary:"$JS_OUT" \
        --grpc_out="$JS_OUT" \
        --plugin=protoc-gen-grpc="$GRPC_PLUGIN" \
        -I . \
        $(find . -ipath "$PATTERN") 2>&1; then
        JS_COMPILE_OK=false
    fi
done

# Fix gRPC imports: grpc_node_plugin generates require('grpc') but the
# project uses @grpc/grpc-js. Patch the generated files in place.
# `sed -i.bak ... && rm` is portable across BSD (macOS) and GNU (Linux) sed
# — `sed -i ''` is BSD-only and silently no-ops on Linux.
find "$JS_OUT" -name "*_grpc_pb.js" -exec sed -i.bak "s/require('grpc')/require('@grpc\/grpc-js')/g" {} +
find "$JS_OUT" -name "*_grpc_pb.js.bak" -delete

# Patch decode paths for packed-enum fields to be google-protobuf v4-compatible.
# The bundled protoc 3.19.1 emits `reader.readPackedEnum()` which was removed
# in google-protobuf v4 in favour of `readPackableEnumInto(arr)`. No upstream
# protoc-gen-js release emits the v4 form (the protobuf-javascript project
# froze before v4 shipped), so we substitute the call at codegen time. The
# wider migration to @bufbuild/protobuf is tracked separately for v0.5.0.
#
# The exact emitted pattern is:
#   reader.isDelimited() ? reader.readPackedEnum() : [reader.readEnum()]
# replaced with:
#   reader.isDelimited() ? (function(){var arr=[];reader.readPackableEnumInto(arr);return arr;})() : [reader.readEnum()]
find "$JS_OUT" -name "*_pb.js" -exec sed -i.bak \
    -e 's|reader\.readPackedEnum()|(function(){var arr=[];reader.readPackableEnumInto(arr);return arr;})()|g' \
    {} +
find "$JS_OUT" -name "*_pb.js.bak" -delete

# Generate TypeScript definitions
if ! $PROTOC \
    --plugin=protoc-gen-ts="$TS_PLUGIN" \
    --ts_out=grpc_js:"$JS_OUT" \
    -I . \
    $(find . -iname "*.proto") 2>&1; then
    JS_COMPILE_OK=false
fi

cd "$REPO_ROOT"

# Compile TypeScript wrappers
if ! "$JS_DIR/node_modules/.bin/tsc" -p "$JS_DIR/tsconfig.json" 2>&1; then
    JS_COMPILE_OK=false
fi

if $JS_COMPILE_OK; then
    JS_COMPILE="PASS"
    pass "JavaScript compile"
else
    JS_COMPILE="FAIL"
    fail "JavaScript compile"
fi

echo "=== JavaScript: running unit tests ==="
# Exclude all tests in wrappers/services/<*-service>/ — they require a running backend.
# wrappers/services/apikey.test.ts (no subdir) is a unit test and is NOT excluded.
if (cd "$JS_DIR" && npm test -- --testPathIgnorePatterns="wrappers/services/[a-z]+-service" 2>&1); then
    JS_TESTS="PASS"
    pass "JavaScript unit tests"
else
    JS_TESTS="FAIL"
    fail "JavaScript unit tests"
fi

if $SKIP_INTEGRATION; then
    echo "  - JavaScript integration tests: skipped (--skip-integration)"
else
    echo "=== JavaScript: running service integration tests ==="
    JS_INTEG_OUTPUT=$(cd "$JS_DIR" && npm test -- --testPathPattern="wrappers/services/[a-z]+-service" 2>&1)
    echo "$JS_INTEG_OUTPUT" | tail -5
    JS_INTEG_PASSED=$(echo "$JS_INTEG_OUTPUT" | grep -oE '[0-9]+ passed' | head -1)
    JS_INTEG_FAILED=$(echo "$JS_INTEG_OUTPUT" | grep -oE '[0-9]+ failed' | head -1)
    if [ -n "$JS_INTEG_FAILED" ] && [ "$JS_INTEG_FAILED" != "0 failed" ]; then
        JS_INTEG="${JS_INTEG_PASSED:-0 passed}, ${JS_INTEG_FAILED}"
        echo "  - JavaScript integration: $JS_INTEG (service-dependent — does not block build)"
    else
        pass "JavaScript service integration tests"
    fi
fi

###########################################
######### PYTHON PROTO GENERATION #########
###########################################
echo ""
echo "=== Python: generating protos ==="

# Create the venv if missing, then ALWAYS sync from requirements.txt.
# requirements.txt pins grpcio-tools and protobuf (their versions are
# baked into generated *_pb2*.py headers); an unsynced existing venv
# could still hold older/newer versions and produce drift on regen.
# pip install is idempotent and fast when nothing changes.
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install --quiet -r ledger-models-python/requirements.txt 2>&1

cd "$PROTO_DIR"
if python -m grpc_tools.protoc -I=. \
    --python_out=../ledger-models-python \
    --pyi_out=../ledger-models-python \
    --grpc_python_out=../ledger-models-python \
    $(find . -iname "*.proto") 2>&1; then
    PY_COMPILE="PASS"
    pass "Python compile"
else
    PY_COMPILE="FAIL"
    fail "Python compile"
fi

cd "$REPO_ROOT"

# Backfill __init__.py in any new directory produced by protoc. Without
# this, setuptools.find_packages() skips dirs that contain only generated
# *_pb2.py files, the wheel ships .pyi stubs without their runtime modules,
# and Python consumers fail to import e.g. fintekkers.models.security.index
# .index_type_pb2 — see FinTekkers/second-brain#217.
# Idempotent; safe to run every regen.
(cd ledger-models-python && python build_generate_init_files.py)

# Run unit tests (exclude integration tests that require running services)
echo "=== Python: running unit tests ==="
if (cd ledger-models-python && python -m pytest -m "not integration" 2>&1); then
    PY_TESTS="PASS"
    pass "Python unit tests"
else
    PY_TESTS="FAIL"
    fail "Python unit tests"
fi

# Run integration tests separately (may fail if services aren't running)
if $SKIP_INTEGRATION; then
    PY_INTEG="SKIP (--skip-integration)"
    echo "  - Python integration tests: skipped (--skip-integration)"
else
    echo "=== Python: running integration tests ==="
    INTEG_OUTPUT=$(cd ledger-models-python && python -m pytest -m "integration" --tb=line 2>&1)
    echo "$INTEG_OUTPUT"
    if echo "$INTEG_OUTPUT" | grep -q "passed"; then
        INTEG_PASSED=$(echo "$INTEG_OUTPUT" | grep -oE '[0-9]+ passed' | head -1)
        INTEG_FAILED=$(echo "$INTEG_OUTPUT" | grep -oE '[0-9]+ failed' | head -1)
        if echo "$INTEG_OUTPUT" | grep -q "failed"; then
            PY_INTEG="${INTEG_PASSED}, ${INTEG_FAILED}"
            echo "  - Python integration: $PY_INTEG (service-dependent — does not block build)"
        else
            PY_INTEG="PASS (${INTEG_PASSED})"
            pass "Python integration tests"
        fi
    else
        PY_INTEG="SKIP (no services)"
        echo "  - Python integration: skipped (services not running)"
    fi
fi

deactivate 2>/dev/null || true

###########################################
######### SUMMARY TABLE ###################
###########################################
echo ""
echo "======================================================="
echo "  COMPILATION & TEST SUMMARY"
echo "======================================================="
printf "  %-12s | %-8s | %-10s | %-s\n" "Language" "Compile" "Unit Tests" "Integration"
printf "  %-12s-+-%-8s-+-%-10s-+-%-s\n" "------------" "--------" "----------" "------------"
printf "  %-12s | %-8s | %-10s | %-s\n" "Rust"       "$RUST_COMPILE" "$RUST_TESTS" "—"
printf "  %-12s | %-8s | %-10s | %-s\n" "Java"       "$JAVA_COMPILE" "$JAVA_TESTS" "—"
printf "  %-12s | %-8s | %-10s | %-s\n" "JavaScript" "$JS_COMPILE"   "$JS_TESTS"   "—"
printf "  %-12s | %-8s | %-10s | %-s\n" "Python"     "$PY_COMPILE"   "$PY_TESTS"   "$PY_INTEG"
echo "======================================================="

if [ "$FAILED" -ne 0 ]; then
    echo "  RESULT: FAILED (see errors above)"
    exit 1
else
    echo "  RESULT: ALL PASSED"
    exit 0
fi
