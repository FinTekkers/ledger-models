"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-440: a transaction whose security is stored as a link (strip-on-write)
// reads as the subclass its resolved product type implies once the link is in
// LinkCache — a Treasury link is a BondSecurity with the note's real maturity.
// Parity with Java TransactionLinkSecurityClassTest.
const assert = require("assert");
const transaction_1 = __importDefault(require("./transaction"));
const transaction_pb_1 = require("../../../fintekkers/models/transaction/transaction_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const local_timestamp_pb_1 = require("../../../fintekkers/models/util/local_timestamp_pb");
const timestamp_pb_1 = require("google-protobuf/google/protobuf/timestamp_pb");
const security_1 = __importDefault(require("../security/security"));
const BondSecurity_1 = __importDefault(require("../security/BondSecurity"));
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const LinkCache = __importStar(require("../../util/link-cache"));
const AS_OF = new local_timestamp_pb_1.LocalTimestampProto()
    .setTimestamp(new timestamp_pb_1.Timestamp().setSeconds(1793908800))
    .setTimeZone('America/New_York');
function treasuryNote(id) {
    return new security_pb_1.SecurityProto()
        .setUuid(id.toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setProductType(product_type_pb_1.ProductTypeProto.TREASURY_NOTE)
        .setIssuerName('US Government')
        .setBondDetails(new security_pb_1.BondDetailsProto()
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2024).setMonth(1).setDay(15))
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(11).setDay(15)));
}
beforeEach(() => {
    LinkCache.SECURITY.clear();
});
test('treasury_note_link_resolves_to_bond_security_with_real_maturity', () => {
    const id = uuid_1.UUID.random();
    const asOf = new datetime_1.ZonedDateTime(AS_OF.clone());
    LinkCache.SECURITY.put(id.toString(), treasuryNote(id), asOf);
    const txn = new transaction_1.default(new transaction_pb_1.TransactionProto()
        .setUuid(uuid_1.UUID.random().toUUIDProto())
        .setAsOf(AS_OF.clone())
        .setSecurity(security_1.default.linkOf(id, asOf)));
    const security = txn.getSecurity();
    assert.ok(security instanceof BondSecurity_1.default);
    const maturity = security.getField(field_pb_1.FieldProto.MATURITY_DATE);
    assert.deepStrictEqual([maturity.getFullYear(), maturity.getMonth() + 1, maturity.getDate()], [2026, 11, 15]);
    // Resolution never writes the full security back into the transaction.
    assert.strictEqual(txn.proto.getSecurity().getIsLink(), true);
    assert.strictEqual(txn.proto.getSecurity().hasBondDetails(), false);
});
//# sourceMappingURL=transaction_link_security.test.js.map