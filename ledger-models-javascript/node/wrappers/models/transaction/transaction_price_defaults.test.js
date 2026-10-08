"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-253: a Transaction built from a TransactionProto whose price has no UUID
// (or no as_of) fills them once, at construction. Parity with Java
// TransactionPriceDefaultsTest and Python test_transaction_price_defaults.py;
// case names match across languages.
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_type_1 = require("./transaction_type");
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const transaction_type_pb_1 = require("../../../fintekkers/models/transaction/transaction_type_pb");
const price_pb_1 = require("../../../fintekkers/models/price/price_pb");
const portfolio_pb_1 = require("../../../fintekkers/models/portfolio/portfolio_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const uuid_pb_1 = require("../../../fintekkers/models/util/uuid_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_1 = __importDefault(require("../security/security"));
const portfolio_1 = __importDefault(require("../portfolio/portfolio"));
const uuid_1 = require("../utils/uuid");
const decimal_js_1 = require("decimal.js");
const errors_1 = require("../errors");
const AS_OF_RULE = "price.as_of defaults to the transaction's as_of (transaction.py / Price.create)";
function timestamp(seconds, timeZone) {
    return new local_timestamp_pb_1.LocalTimestampProto()
        .setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(seconds))
        .setTimeZone(timeZone);
}
const TXN_AS_OF = timestamp(1718461800, 'America/New_York');
const PRICE_AS_OF = timestamp(1718377200, 'Europe/London');
function price() {
    return new price_pb_1.PriceProto()
        .setObjectClass('Price')
        .setVersion('0.0.1')
        .setPrice(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('99.5'));
}
function txnWithPrice(priceProto, withTxnAsOf = true) {
    const proto = new transaction_pb_1.TransactionProto()
        .setObjectClass('Transaction')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setPrice(priceProto);
    if (withTxnAsOf)
        proto.setAsOf(TXN_AS_OF.clone());
    return proto;
}
function priceUuidBytes(txn) {
    return txn.proto.getPrice().getUuid().getRawUuid_asU8();
}
test('missing_price_uuid_is_filled', () => {
    const callerProto = txnWithPrice(price().setAsOf(PRICE_AS_OF.clone()));
    const txn = new transaction_1.default(callerProto);
    assert.strictEqual(priceUuidBytes(txn).length, 16);
    assert.strictEqual(txn.getPrice().getUuid().getRawUuid_asU8().length, 16);
    // The caller's message is not mutated.
    assert.strictEqual(callerProto.getPrice().hasUuid(), false);
});
test('empty_raw_uuid_is_treated_as_missing', () => {
    const p = price().setAsOf(PRICE_AS_OF.clone()).setUuid(new uuid_pb_1.UUIDProto().setRawUuid(new Uint8Array(0)));
    const txn = new transaction_1.default(txnWithPrice(p));
    assert.strictEqual(priceUuidBytes(txn).length, 16);
});
test('price_uuid_is_assigned_once', () => {
    const txn = new transaction_1.default(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));
    assert.deepStrictEqual(priceUuidBytes(txn), priceUuidBytes(txn));
    assert.deepStrictEqual(txn.proto.serializeBinary(), txn.proto.serializeBinary());
});
test('round_trip_keeps_price_uuid', () => {
    const first = new transaction_1.default(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));
    const second = new transaction_1.default(transaction_pb_1.TransactionProto.deserializeBinary(first.proto.serializeBinary()));
    assert.strictEqual(priceUuidBytes(second).length, 16);
    assert.deepStrictEqual(priceUuidBytes(second), priceUuidBytes(first));
});
test('existing_price_uuid_is_kept', () => {
    const existing = uuid_1.UUID.random().toUUIDProto();
    const callerProto = txnWithPrice(price().setAsOf(PRICE_AS_OF.clone()).setUuid(existing));
    const txn = new transaction_1.default(callerProto);
    assert.deepStrictEqual(priceUuidBytes(txn), existing.getRawUuid_asU8());
    // Nothing missing: the wrapper keeps the caller's proto as-is.
    assert.strictEqual(txn.proto, callerProto);
});
test('missing_price_as_of_defaults_to_transaction_as_of', () => {
    const txn = new transaction_1.default(txnWithPrice(price()));
    assert.deepStrictEqual(txn.proto.getPrice().getAsOf().toObject(), TXN_AS_OF.toObject(), AS_OF_RULE);
    assert.deepStrictEqual(txn.proto.getPrice().getAsOf().toObject(), txn.proto.getAsOf().toObject(), AS_OF_RULE);
    assert.deepStrictEqual(txn.proto.getPrice().getAsOf().toObject(), txn.proto.getPrice().getAsOf().toObject());
});
test('existing_price_as_of_is_kept', () => {
    const txn = new transaction_1.default(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));
    assert.deepStrictEqual(txn.proto.getPrice().getAsOf().toObject(), PRICE_AS_OF.toObject());
});
test('no_as_of_anywhere_is_rejected', () => {
    // LM-272: the LS-17 shape. Rejected up front, naming the transaction
    // field; the price is never given a default as_of.
    const build = () => new transaction_1.default(txnWithPrice(price(), false));
    expect(build).toThrow(errors_1.ModelValidationError);
    try {
        build();
    }
    catch (e) {
        assert.strictEqual(e.field, 'transaction.as_of');
    }
});
test('link_price_passes_through_unchanged', () => {
    const link = new price_pb_1.PriceProto().setIsLink(true);
    const txn = new transaction_1.default(txnWithPrice(link));
    assert.deepStrictEqual(txn.proto.getPrice().toObject(), link.toObject());
    assert.strictEqual(txn.proto.getPrice().hasUuid(), false);
});
test('factory_path_fills_price_uuid_and_as_of', () => {
    const security = security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAssetClass('Equity')
        .setIssuerName('Test Issuer'));
    const portfolio = new portfolio_1.default(new portfolio_pb_1.PortfolioProto()
        .setObjectClass('Portfolio')
        .setVersion('0.0.1')
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setPortfolioName('Test Portfolio'));
    const txn = new transaction_1.default({
        tradeDate: new Date(2024, 5, 15),
        settlementDate: new Date(2024, 5, 17),
        asOfDate: new Date(2024, 5, 15, 10, 30, 0),
        price: new decimal_js_1.Decimal('99.5'),
        security,
        transactionType: new transaction_type_1.TransactionType(transaction_type_pb_1.TransactionTypeProto.BUY),
        portfolio,
        quantity: new decimal_js_1.Decimal('100'),
    });
    assert.strictEqual(priceUuidBytes(txn).length, 16);
    assert.deepStrictEqual(txn.proto.getPrice().getAsOf().toObject(), txn.proto.getAsOf().toObject(), AS_OF_RULE);
});
//# sourceMappingURL=transaction_price_defaults.test.js.map