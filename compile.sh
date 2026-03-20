#!/bin/bash
set -uo pipefail

# compile.sh — Regenerate proto bindings for all languages and run tests.
# Exits with non-zero if any language fails compilation or tests.

# Ensure Homebrew tools (protoc, grpc_node_plugin) are on PATH
eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

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

#########################################
######### RUST PROTO GENERATION #########
#########################################
echo ""
echo "=== Rust: generating protos ==="
if (cd ledger-models-rust && cargo run --bin gen 2>&1); then
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

JS_DIR="$REPO_ROOT/ledger-models-javascript"
PROTO_DIR="$REPO_ROOT/ledger-models-protos"
JS_OUT="$JS_DIR/node"
TS_PLUGIN="$JS_DIR/node_modules/.bin/protoc-gen-ts"

# Use system protoc (ARM64 via Homebrew) + brew grpc_node_plugin
# instead of the x86-only grpc-tools bundled protoc
PROTOC="$(which protoc)"
GRPC_PLUGIN="$(which grpc_node_plugin)"

if [ -z "$PROTOC" ] || [ -z "$GRPC_PLUGIN" ]; then
    echo "ERROR: protoc or grpc_node_plugin not found. Install via: brew install protobuf grpc"
    JS_COMPILE="FAIL"
    fail "JavaScript compile — missing tools"
else
    JS_COMPILE_OK=true

    cd "$PROTO_DIR"

    # Generate JS + gRPC service stubs for services, requests, models
    # Note: Homebrew grpc_node_plugin doesn't support the grpc_js parameter,
    # so we generate with the default mode and post-process the imports.
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

    # Fix gRPC imports: Homebrew grpc_node_plugin generates require('grpc')
    # but the project uses @grpc/grpc-js. Patch the generated files.
    find "$JS_OUT" -name "*_grpc_pb.js" -exec sed -i '' "s/require('grpc')/require('@grpc\/grpc-js')/g" {} +

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

    echo "=== JavaScript: running tests ==="
    if (cd "$JS_DIR" && npm test 2>&1); then
        JS_TESTS="PASS"
        pass "JavaScript tests"
    else
        JS_TESTS="FAIL"
        fail "JavaScript tests"
    fi
fi

###########################################
######### PYTHON PROTO GENERATION #########
###########################################
echo ""
echo "=== Python: generating protos ==="

# Create and setup virtual environment if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install grpcio-tools 2>&1
else
    source venv/bin/activate
fi

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
