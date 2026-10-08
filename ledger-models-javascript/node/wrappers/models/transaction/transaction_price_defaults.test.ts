// LM-253: a Transaction built from a TransactionProto whose price has no UUID
// (or no as_of) fills them once, at construction. Parity with Java
// TransactionPriceDefaultsTest and Python test_transaction_price_defaults.py;
// case names match across languages.
import assert = require('assert');
import Transaction from './transaction';
import { TransactionType } from './transaction_type';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { TransactionTypeProto } from '../../../fintekkers/models/transaction/transaction_type_pb';
import { PriceProto } from '../../../fintekkers/models/price/price_pb';
import { PortfolioProto } from '../../../fintekkers/models/portfolio/portfolio_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { UUIDProto } from '../../../fintekkers/models/util/uuid_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import Security from '../security/security';
import Portfolio from '../portfolio/portfolio';
import { UUID } from '../utils/uuid';
import { Decimal } from 'decimal.js';
import { ModelValidationError } from '../errors';

const AS_OF_RULE = "price.as_of defaults to the transaction's as_of (transaction.py / Price.create)";

function timestamp(seconds: number, timeZone: string): LocalTimestampProto {
    return new LocalTimestampProto()
        .setTimestamp(new Timestamp().setSeconds(seconds))
        .setTimeZone(timeZone);
}

const TXN_AS_OF = timestamp(1718461800, 'America/New_York');
const PRICE_AS_OF = timestamp(1718377200, 'Europe/London');

function price(): PriceProto {
    return new PriceProto()
        .setObjectClass('Price')
        .setVersion('0.0.1')
        .setPrice(new DecimalValueProto().setArbitraryPrecisionValue('99.5'));
}

function txnWithPrice(priceProto: PriceProto, withTxnAsOf: boolean = true): TransactionProto {
    const proto = new TransactionProto()
        .setObjectClass('Transaction')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setPrice(priceProto);
    if (withTxnAsOf) proto.setAsOf(TXN_AS_OF.clone());
    return proto;
}

function priceUuidBytes(txn: Transaction): Uint8Array {
    return txn.proto.getPrice()!.getUuid()!.getRawUuid_asU8();
}

test('missing_price_uuid_is_filled', () => {
    const callerProto = txnWithPrice(price().setAsOf(PRICE_AS_OF.clone()));
    const txn = new Transaction(callerProto);

    assert.strictEqual(priceUuidBytes(txn).length, 16);
    assert.strictEqual(txn.getPrice().getUuid()!.getRawUuid_asU8().length, 16);
    // The caller's message is not mutated.
    assert.strictEqual(callerProto.getPrice()!.hasUuid(), false);
});

test('empty_raw_uuid_is_treated_as_missing', () => {
    const p = price().setAsOf(PRICE_AS_OF.clone()).setUuid(new UUIDProto().setRawUuid(new Uint8Array(0)));
    const txn = new Transaction(txnWithPrice(p));

    assert.strictEqual(priceUuidBytes(txn).length, 16);
});

test('price_uuid_is_assigned_once', () => {
    const txn = new Transaction(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));

    assert.deepStrictEqual(priceUuidBytes(txn), priceUuidBytes(txn));
    assert.deepStrictEqual(txn.proto.serializeBinary(), txn.proto.serializeBinary());
});

test('round_trip_keeps_price_uuid', () => {
    const first = new Transaction(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));
    const second = new Transaction(TransactionProto.deserializeBinary(first.proto.serializeBinary()));

    assert.strictEqual(priceUuidBytes(second).length, 16);
    assert.deepStrictEqual(priceUuidBytes(second), priceUuidBytes(first));
});

test('existing_price_uuid_is_kept', () => {
    const existing = UUID.random().toUUIDProto();
    const callerProto = txnWithPrice(price().setAsOf(PRICE_AS_OF.clone()).setUuid(existing));
    const txn = new Transaction(callerProto);

    assert.deepStrictEqual(priceUuidBytes(txn), existing.getRawUuid_asU8());
    // Nothing missing: the wrapper keeps the caller's proto as-is.
    assert.strictEqual(txn.proto, callerProto);
});

test('missing_price_as_of_defaults_to_transaction_as_of', () => {
    const txn = new Transaction(txnWithPrice(price()));

    assert.deepStrictEqual(txn.proto.getPrice()!.getAsOf()!.toObject(), TXN_AS_OF.toObject(), AS_OF_RULE);
    assert.deepStrictEqual(txn.proto.getPrice()!.getAsOf()!.toObject(), txn.proto.getAsOf()!.toObject(), AS_OF_RULE);
    assert.deepStrictEqual(txn.proto.getPrice()!.getAsOf()!.toObject(), txn.proto.getPrice()!.getAsOf()!.toObject());
});

test('existing_price_as_of_is_kept', () => {
    const txn = new Transaction(txnWithPrice(price().setAsOf(PRICE_AS_OF.clone())));

    assert.deepStrictEqual(txn.proto.getPrice()!.getAsOf()!.toObject(), PRICE_AS_OF.toObject());
});

test('no_as_of_anywhere_is_rejected', () => {
    // LM-272: the LS-17 shape. Rejected up front, naming the transaction
    // field; the price is never given a default as_of.
    const build = () => new Transaction(txnWithPrice(price(), false));

    expect(build).toThrow(ModelValidationError);
    try {
        build();
    } catch (e) {
        assert.strictEqual((e as ModelValidationError).field, 'transaction.as_of');
    }
});

test('link_price_passes_through_unchanged', () => {
    const link = new PriceProto().setIsLink(true);
    const txn = new Transaction(txnWithPrice(link));

    assert.deepStrictEqual(txn.proto.getPrice()!.toObject(), link.toObject());
    assert.strictEqual(txn.proto.getPrice()!.hasUuid(), false);
});

test('factory_path_fills_price_uuid_and_as_of', () => {
    const security = Security.create(new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setAssetClass('Equity')
        .setIssuerName('Test Issuer'));
    const portfolio = new Portfolio(new PortfolioProto()
        .setObjectClass('Portfolio')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setPortfolioName('Test Portfolio'));
    const txn = new Transaction({
        tradeDate: new Date(2024, 5, 15),
        settlementDate: new Date(2024, 5, 17),
        asOfDate: new Date(2024, 5, 15, 10, 30, 0),
        price: new Decimal('99.5'),
        security,
        transactionType: new TransactionType(TransactionTypeProto.BUY),
        portfolio,
        quantity: new Decimal('100'),
    });

    assert.strictEqual(priceUuidBytes(txn).length, 16);
    assert.deepStrictEqual(txn.proto.getPrice()!.getAsOf()!.toObject(), txn.proto.getAsOf()!.toObject(), AS_OF_RULE);
});
