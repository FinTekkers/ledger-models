"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-276: a Transaction built from a TransactionProto whose inline security
// (or that security's inline settlement_currency) has no UUID fills it once, at
// construction. Parity with Java TransactionSecurityDefaultsTest, Python
// test_transaction_security_defaults.py and the Rust transaction tests; case
// names match across languages.
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_1 = __importDefault(require("../security/security"));
const uuid_1 = require("../utils/uuid");
const AS_OF = new local_timestamp_pb_1.LocalTimestampProto()
    .setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(1718461800))
    .setTimeZone('America/New_York');
function currency() {
    return new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setAsOf(AS_OF.clone())
        .setProductType(product_type_pb_1.ProductTypeProto.CURRENCY)
        .setAssetClass('Cash')
        .setIssuerName('US Dollar');
}
function bond() {
    return new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setAsOf(AS_OF.clone())
        .setProductType(product_type_pb_1.ProductTypeProto.CORP_BOND)
        .setAssetClass('Fixed Income')
        .setIssuerName('ACME Corp')
        .setSettlementCurrency(currency());
}
function txnWithSecurity(security) {
    return new transaction_pb_1.TransactionProto()
        .setObjectClass('Transaction')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setSecurity(security);
}
test('missing_security_uuid_is_filled_and_stable', () => {
    const callerProto = txnWithSecurity(bond());
    const txn = new transaction_1.default(callerProto);
    const first = txn.getSecurity().getID();
    assert.ok(first);
    assert.ok(first.equals(txn.getSecurity().getID()));
    assert.ok(first.equals(txn.getSecurity().getID()));
    assert.strictEqual(txn.proto.getSecurity().getUuid().getRawUuid_asU8().length, 16);
    // The caller's message is not mutated.
    assert.strictEqual(callerProto.getSecurity().hasUuid(), false);
});
test('missing_settlement_currency_uuid_is_filled_and_stable', () => {
    const txn = new transaction_1.default(txnWithSecurity(bond()));
    const currencyId = () => security_1.default.create(txn.getSecurity().proto.getSettlementCurrency()).getID();
    const first = currencyId();
    assert.ok(first.equals(currencyId()));
    assert.ok(first.equals(currencyId()));
    assert.strictEqual(txn.proto.getSecurity().getSettlementCurrency().getUuid().getRawUuid_asU8().length, 16);
});
test('existing_security_uuid_is_kept', () => {
    const securityId = uuid_1.UUID.random();
    const currencyId = uuid_1.UUID.random();
    const callerProto = txnWithSecurity(bond()
        .setUuid(securityId.toUUIDProto())
        .setSettlementCurrency(currency().setUuid(currencyId.toUUIDProto())));
    const txn = new transaction_1.default(callerProto);
    assert.ok(securityId.equals(txn.getSecurity().getID()));
    assert.ok(currencyId.equals(uuid_1.UUID.fromU8Array(txn.proto.getSecurity().getSettlementCurrency().getUuid().getRawUuid_asU8())));
    assert.strictEqual(txn.proto, callerProto);
});
test('link_security_gets_no_uuid', () => {
    const link = new security_pb_1.SecurityProto().setIsLink(true).setAsOf(AS_OF.clone()).setSettlementCurrency(currency());
    const txn = new transaction_1.default(txnWithSecurity(link));
    const security = txn.proto.getSecurity();
    assert.strictEqual(security.getIsLink(), true);
    assert.strictEqual(security.hasUuid(), false);
    assert.strictEqual(security.getSettlementCurrency().hasUuid(), false);
});
test('link_settlement_currency_gets_no_uuid', () => {
    const txn = new transaction_1.default(txnWithSecurity(bond().setSettlementCurrency(new security_pb_1.SecurityProto().setIsLink(true))));
    const security = txn.proto.getSecurity();
    assert.strictEqual(security.getUuid().getRawUuid_asU8().length, 16);
    assert.strictEqual(security.getSettlementCurrency().getIsLink(), true);
    assert.strictEqual(security.getSettlementCurrency().hasUuid(), false);
});
//# sourceMappingURL=transaction_security_defaults.test.js.map