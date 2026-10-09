// LM-276: a Transaction built from a TransactionProto whose inline security
// (or that security's inline settlement_currency) has no UUID fills it once, at
// construction. Parity with Java TransactionSecurityDefaultsTest, Python
// test_transaction_security_defaults.py and the Rust transaction tests; case
// names match across languages.
import assert = require('assert');
import Transaction from './transaction';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import Security from '../security/security';
import { UUID } from '../utils/uuid';

const AS_OF = new LocalTimestampProto()
    .setTimestamp(new Timestamp().setSeconds(1718461800))
    .setTimeZone('America/New_York');

function currency(): SecurityProto {
    return new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setAsOf(AS_OF.clone())
        .setProductType(ProductTypeProto.CURRENCY)
        .setAssetClass('Cash')
        .setIssuerName('US Dollar');
}

function bond(): SecurityProto {
    return new SecurityProto()
        .setObjectClass('Security')
        .setVersion('0.0.1')
        .setAsOf(AS_OF.clone())
        .setProductType(ProductTypeProto.CORP_BOND)
        .setAssetClass('Fixed Income')
        .setIssuerName('ACME Corp')
        .setSettlementCurrency(currency());
}

function txnWithSecurity(security: SecurityProto): TransactionProto {
    return new TransactionProto()
        .setObjectClass('Transaction')
        .setVersion('0.0.1')
        .setUuid(UUID.random().toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setSecurity(security);
}

test('missing_security_uuid_is_filled_and_stable', () => {
    const callerProto = txnWithSecurity(bond());
    const txn = new Transaction(callerProto);

    const first = txn.getSecurity().getID();
    assert.ok(first);
    assert.ok(first.equals(txn.getSecurity().getID()));
    assert.ok(first.equals(txn.getSecurity().getID()));
    assert.strictEqual(txn.proto.getSecurity()!.getUuid()!.getRawUuid_asU8().length, 16);
    // The caller's message is not mutated.
    assert.strictEqual(callerProto.getSecurity()!.hasUuid(), false);
});

test('missing_settlement_currency_uuid_is_filled_and_stable', () => {
    const txn = new Transaction(txnWithSecurity(bond()));

    const currencyId = () => Security.create(txn.getSecurity().proto.getSettlementCurrency()!).getID();
    const first = currencyId();
    assert.ok(first.equals(currencyId()));
    assert.ok(first.equals(currencyId()));
    assert.strictEqual(
        txn.proto.getSecurity()!.getSettlementCurrency()!.getUuid()!.getRawUuid_asU8().length, 16);
});

test('existing_security_uuid_is_kept', () => {
    const securityId = UUID.random();
    const currencyId = UUID.random();
    const callerProto = txnWithSecurity(bond()
        .setUuid(securityId.toUUIDProto())
        .setSettlementCurrency(currency().setUuid(currencyId.toUUIDProto())));
    const txn = new Transaction(callerProto);

    assert.ok(securityId.equals(txn.getSecurity().getID()));
    assert.ok(currencyId.equals(
        UUID.fromU8Array(txn.proto.getSecurity()!.getSettlementCurrency()!.getUuid()!.getRawUuid_asU8())));
    assert.strictEqual(txn.proto, callerProto);
});

test('link_security_gets_no_uuid', () => {
    const link = new SecurityProto().setIsLink(true).setAsOf(AS_OF.clone()).setSettlementCurrency(currency());
    const txn = new Transaction(txnWithSecurity(link));

    const security = txn.proto.getSecurity()!;
    assert.strictEqual(security.getIsLink(), true);
    assert.strictEqual(security.hasUuid(), false);
    assert.strictEqual(security.getSettlementCurrency()!.hasUuid(), false);
});

test('link_settlement_currency_gets_no_uuid', () => {
    const txn = new Transaction(txnWithSecurity(bond().setSettlementCurrency(new SecurityProto().setIsLink(true))));

    const security = txn.proto.getSecurity()!;
    assert.strictEqual(security.getUuid()!.getRawUuid_asU8().length, 16);
    assert.strictEqual(security.getSettlementCurrency()!.getIsLink(), true);
    assert.strictEqual(security.getSettlementCurrency()!.hasUuid(), false);
});
