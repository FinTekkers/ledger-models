#!/usr/bin/env bash
# LM-367 release check (metric 3): the published 0.4.x release carries
# AuctionTypeProto.MULTIPLE_PRICE = 2 on PyPI, npm, crates.io and Maven
# Central. Each check installs the exact version in a scratch directory and
# fails (non-zero exit) on any mismatch.
#
# Not a CI check — it needs the release to be published and network access.
# Kept out of scripts/checks/ so the pre-merge harness does not pick it up.
#
# Usage: scripts/lm367-release-check.sh 0.4.65
# Needs python3, node/npm, cargo and a JDK (java, javac, jar).
set -euo pipefail

VERSION="${1:?usage: $0 <released version, e.g. 0.4.65>}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export PATH="$HOME/.cargo/bin:$PATH"

echo "== PyPI fintekkers_ledger_models==$VERSION"
python3 -m venv "$WORK/venv"
"$WORK/venv/bin/pip" install -q "fintekkers_ledger_models==$VERSION"
"$WORK/venv/bin/python" - <<'EOF'
from fintekkers.models.security.bond.auction_type_pb2 import AuctionTypeProto
assert AuctionTypeProto.MULTIPLE_PRICE == 2, AuctionTypeProto.MULTIPLE_PRICE
print("PyPI: MULTIPLE_PRICE == 2")
EOF

echo "== npm @fintekkers/ledger-models@$VERSION"
[ "$(npm view "@fintekkers/ledger-models@$VERSION" version)" = "$VERSION" ] \
  || { echo "FAIL: npm has no @fintekkers/ledger-models@$VERSION" >&2; exit 1; }
mkdir "$WORK/npm"
(
  cd "$WORK/npm"
  npm init -y >/dev/null
  npm install -q --ignore-scripts --no-audit --no-fund "@fintekkers/ledger-models@$VERSION" >/dev/null
  node -e '
    const { AuctionTypeProto } = require("@fintekkers/ledger-models/node/fintekkers/models/security/bond/auction_type_pb");
    if (AuctionTypeProto.MULTIPLE_PRICE !== 2) { console.error("FAIL: npm MULTIPLE_PRICE =", AuctionTypeProto.MULTIPLE_PRICE); process.exit(1); }
    console.log("npm: MULTIPLE_PRICE === 2");
  '
)

echo "== crates.io ledger-models =$VERSION"
cargo new -q --lib "$WORK/crate"
cat >> "$WORK/crate/Cargo.toml" <<EOF
ledger-models = "=$VERSION"
EOF
cat > "$WORK/crate/src/lib.rs" <<'EOF'
#[test]
fn multiple_price_is_2() {
    use ledger_models::fintekkers::models::security::bond::AuctionTypeProto;
    assert_eq!(AuctionTypeProto::MultiplePrice as i32, 2);
}
EOF
(cd "$WORK/crate" && cargo test -q)
echo "crates.io: MultiplePrice as i32 == 2"

echo "== Maven Central io.github.fintekkers:ledger-models:$VERSION"
JAR_URL="https://repo1.maven.org/maven2/io/github/fintekkers/ledger-models/$VERSION/ledger-models-$VERSION.jar"
PROTOBUF_URL="https://repo1.maven.org/maven2/com/google/protobuf/protobuf-java/3.21.12/protobuf-java-3.21.12.jar"
mkdir "$WORK/maven"
curl -fsSL -o "$WORK/maven/ledger-models.jar" "$JAR_URL" \
  || { echo "FAIL: Maven Central has no $JAR_URL" >&2; exit 1; }
curl -fsSL -o "$WORK/maven/protobuf.jar" "$PROTOBUF_URL"
cat > "$WORK/maven/Check.java" <<'EOF'
import fintekkers.models.security.bond.AuctionTypeProto;

public class Check {
    public static void main(String[] args) {
        if (AuctionTypeProto.MULTIPLE_PRICE.getNumber() != 2) {
            System.err.println("FAIL: Maven MULTIPLE_PRICE = " + AuctionTypeProto.MULTIPLE_PRICE.getNumber());
            System.exit(1);
        }
        System.out.println("Maven Central: MULTIPLE_PRICE.getNumber() == 2");
    }
}
EOF
CP="$WORK/maven/ledger-models.jar:$WORK/maven/protobuf.jar"
javac -d "$WORK/maven" -cp "$CP" "$WORK/maven/Check.java"
java -cp "$WORK/maven:$CP" Check

echo "PASS: MULTIPLE_PRICE = 2 in all four $VERSION packages"
