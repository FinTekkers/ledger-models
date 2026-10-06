#!/usr/bin/env bash
# LM-113 live check (metric 5): create a bond whose settlement_currency is an
# is_link=true USD reference against a LOCAL ledger-service, then read it back.
#
# Not a CI check — it needs Postgres, valuation, price and ledger-service
# running locally (see project startup order). Kept out of scripts/checks/ so
# the pre-merge harness does not pick it up.
#
# Required env:
#   LEDGER_SERVICE_DIR               local ledger-service checkout
#   EXPECTED_LEDGER_MODELS_VERSION   the ledger-models release with the LM-113 fix
#   LEDGER_SERVICE_LOG               ledger-service log file
# Optional:
#   TARGET                           must be localhost:8082 (default)
set -euo pipefail

TARGET="${TARGET:-localhost:8082}"
if [ "$TARGET" != "localhost:8082" ]; then
  echo "FAIL: refusing target '$TARGET' — LM-113 live check runs against localhost:8082 only" >&2
  exit 2
fi
: "${LEDGER_SERVICE_DIR:?set LEDGER_SERVICE_DIR to the local ledger-service checkout}"
: "${EXPECTED_LEDGER_MODELS_VERSION:?set EXPECTED_LEDGER_MODELS_VERSION to the fixed ledger-models release}"
: "${LEDGER_SERVICE_LOG:?set LEDGER_SERVICE_LOG to the ledger-service log file}"
for tool in grpcurl jq; do
  command -v "$tool" >/dev/null || { echo "FAIL: $tool not on PATH" >&2; exit 2; }
done
[ -f "$LEDGER_SERVICE_LOG" ] || { echo "FAIL: log '$LEDGER_SERVICE_LOG' not found" >&2; exit 2; }

SETTLEMENT_UUID="AAAAAAAAAAEAAAAAAAAAAQ=="   # new UUID(1, 1) — USD

echo "== ledger-models version pinned by ledger-service"
pinned="$(grep -rhoE "ledger-models[^'\"]*:[0-9][0-9A-Za-z.+-]*" \
  "$LEDGER_SERVICE_DIR"/build.gradle* "$LEDGER_SERVICE_DIR"/gradle 2>/dev/null \
  | grep -oE '[0-9][0-9A-Za-z.+-]*$' | head -1 || true)"
echo "pinned=${pinned:-<not found>} expected=$EXPECTED_LEDGER_MODELS_VERSION"
if [ "$pinned" != "$EXPECTED_LEDGER_MODELS_VERSION" ]; then
  echo "FAIL: ledger-service does not pin the fixed ledger-models release" >&2
  exit 1
fi

log_start="$(wc -l < "$LEDGER_SERVICE_LOG")"

echo "== Security/CreateOrUpdate (bond, linked settlement currency)"
create_req="$(cat <<JSON
{
  "object_class":"CreateSecurityRequest",
  "version":"0.0.1",
  "security_input":{
    "product_type":"TREASURY_NOTE",
    "issuer_name":"Test Corp",
    "asset_class":"Fixed Income",
    "settlement_currency":{
      "uuid":{"raw_uuid":"$SETTLEMENT_UUID"},
      "is_link":true
    },
    "bond_details":{
      "coupon_rate":{"arbitrary_precision_value":"0.05"},
      "coupon_type":"FIXED",
      "coupon_frequency":"SEMIANNUALLY",
      "face_value":{"arbitrary_precision_value":"1000"},
      "issue_date":{"year":2020,"month":1,"day":1},
      "maturity_date":{"year":2030,"month":12,"day":31}
    }
  }
}
JSON
)"
create_resp="$(grpcurl -plaintext -d "$create_req" "$TARGET" \
  fintekkers.services.security_service.Security/CreateOrUpdate)" || {
  echo "FAIL: CreateOrUpdate did not return OK (TREASURY_NOTE may be rejected; pick another BOND descendant)" >&2
  exit 1
}
echo "$create_resp"
bond_uuid="$(echo "$create_resp" | jq -r \
  '(.security_response // .securityResponse) | .uuid | (.raw_uuid // .rawUuid) // empty')"
if [ -z "$bond_uuid" ]; then
  echo "FAIL: CreateOrUpdate response has no security UUID" >&2
  exit 1
fi
echo "created bond uuid=$bond_uuid"

cce="$(tail -n +"$((log_start + 1))" "$LEDGER_SERVICE_LOG" | grep -c ClassCastException || true)"
echo "ClassCastException lines since call: $cce"
if [ "$cce" != "0" ]; then
  echo "FAIL: ledger-service logged ClassCastException" >&2
  exit 1
fi

echo "== Security/GetByIds"
get_resp="$(grpcurl -plaintext -d "{\"object_class\":\"QuerySecurityRequest\",\"version\":\"0.0.1\",\"uuIds\":[{\"raw_uuid\":\"$bond_uuid\"}]}" \
  "$TARGET" fintekkers.services.security_service.Security/GetByIds)"
echo "$get_resp"
got_sc="$(echo "$get_resp" | jq -r \
  '(.security_response // .securityResponse)[0] | (.settlement_currency // .settlementCurrency) | .uuid | (.raw_uuid // .rawUuid) // empty')"
if [ "$got_sc" != "$SETTLEMENT_UUID" ]; then
  echo "FAIL: GetByIds settlement_currency uuid='$got_sc', expected '$SETTLEMENT_UUID'" >&2
  exit 1
fi

echo "PASS: LM-113 live check"
