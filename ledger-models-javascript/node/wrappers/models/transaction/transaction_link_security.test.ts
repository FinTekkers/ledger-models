// LM-440: a transaction whose security is stored as a link (strip-on-write)
// reads as the subclass its resolved product type implies once the link is in
// LinkCache — a Treasury link is a BondSecurity with the note's real maturity.
// Parity with Java TransactionLinkSecurityClassTest.
import assert = require('assert');
import Transaction from './transaction';
import { TransactionProto } from '../../../fintekkers/models/transaction/transaction_pb';
import { BondDetailsProto, SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalTimestampProto } from '../../../fintekkers/models/util/local_timestamp_pb';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import Security from '../security/security';
import BondSecurity from '../security/BondSecurity';
import { UUID } from '../utils/uuid';
import { ZonedDateTime } from '../utils/datetime';
import * as LinkCache from '../../util/link-cache';

const AS_OF = new LocalTimestampProto()
    .setTimestamp(new Timestamp().setSeconds(1793908800))
    .setTimeZone('America/New_York');

function treasuryNote(id: UUID): SecurityProto {
    return new SecurityProto()
        .setUuid(id.toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setProductType(ProductTypeProto.TREASURY_NOTE)
        .setIssuerName('US Government')
        .setBondDetails(new BondDetailsProto()
            .setIssueDate(new LocalDateProto().setYear(2024).setMonth(1).setDay(15))
            .setMaturityDate(new LocalDateProto().setYear(2026).setMonth(11).setDay(15)));
}

beforeEach(() => {
    LinkCache.SECURITY.clear();
});

test('treasury_note_link_resolves_to_bond_security_with_real_maturity', () => {
    const id = UUID.random();
    const asOf = new ZonedDateTime(AS_OF.clone());
    LinkCache.SECURITY.put(id.toString(), treasuryNote(id), asOf);
    const txn = new Transaction(new TransactionProto()
        .setUuid(UUID.random().toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setSecurity(Security.linkOf(id, asOf)));

    const security = txn.getSecurity();

    assert.ok(security instanceof BondSecurity);
    const maturity = security.getField(FieldProto.MATURITY_DATE) as Date;
    assert.deepStrictEqual(
        [maturity.getFullYear(), maturity.getMonth() + 1, maturity.getDate()], [2026, 11, 15]);
    // Resolution never writes the full security back into the transaction.
    assert.strictEqual(txn.proto.getSecurity()!.getIsLink(), true);
    assert.strictEqual(txn.proto.getSecurity()!.hasBondDetails(), false);
});
