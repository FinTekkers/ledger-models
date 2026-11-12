"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-465: a bond carries callable and its first call_date. The call date is
// never the maturity date: maturity_date and getField(MATURITY_DATE) stay the
// legal final maturity.
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const IndexSecurity_1 = __importDefault(require("./IndexSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const identifier_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_pb");
const identifier_type_pb_1 = require("../../../fintekkers/models/security/identifier/identifier_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
// 912810CK2, 10 3/8% Bonds of 2004-2009: called 2004-11-15, legal maturity 2009-11-15.
const CALL_DATE = [2004, 11, 15];
const MATURITY = [2009, 11, 15];
function localDate([y, m, d]) {
    return new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d);
}
function ymd(d) {
    return d ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null;
}
function bondProto(callable) {
    const bd = new security_pb_1.BondDetailsProto().setMaturityDate(localDate(MATURITY));
    if (callable) {
        bd.setCallable(true);
        bd.setCallDate(localDate(CALL_DATE));
    }
    const p = new security_pb_1.SecurityProto();
    p.setProductType(product_type_pb_1.ProductTypeProto.TREASURY_BOND);
    p.setIssuerName('US Treasury');
    p.addIdentifiers(new identifier_pb_1.IdentifierProto().setIdentifierType(identifier_type_pb_1.IdentifierTypeProto.CUSIP).setIdentifierValue('912810CK2'));
    p.setBondDetails(bd);
    return p;
}
function decode(proto) {
    return security_pb_1.SecurityProto.deserializeBinary(proto.serializeBinary());
}
// Serializes the wrapper's proto, parses the bytes and wraps them again.
function rewrap(security) {
    return security_1.default.create(decode(security.proto));
}
describe('Callable bonds (LM-465)', () => {
    test('callable bond wire round-trip keeps all three values', () => {
        const decoded = decode(bondProto(true));
        expect(decoded.getBondDetails().getCallable()).toBe(true);
        expect(decoded.getBondDetails().hasCallDate()).toBe(true);
        const bond = security_1.default.create(decoded);
        expect(bond).toBeInstanceOf(BondSecurity_1.default);
        expect(bond.isCallable()).toBe(true);
        expect(ymd(bond.getCallDate())).toEqual(CALL_DATE);
        expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
    });
    test('callable bond re-saved through the wrapper keeps all three values', () => {
        const bond = rewrap(security_1.default.create(bondProto(true)));
        expect(bond).toBeInstanceOf(BondSecurity_1.default);
        expect(bond.isCallable()).toBe(true);
        expect(ymd(bond.getCallDate())).toEqual(CALL_DATE);
        expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
    });
    test('getField(MATURITY_DATE) is the legal maturity, not the call date', () => {
        const bond = rewrap(security_1.default.create(bondProto(true)));
        expect(ymd(bond.getField(field_pb_1.FieldProto.MATURITY_DATE))).toEqual(MATURITY);
        expect(ymd(bond.getField(field_pb_1.FieldProto.MATURITY_DATE))).not.toEqual(CALL_DATE);
    });
    test('non-callable bond round-trip leaves call_date unset', () => {
        const decoded = decode(bondProto(false));
        expect(decoded.getBondDetails().getCallable()).toBe(false);
        expect(decoded.getBondDetails().hasCallDate()).toBe(false);
        const bond = rewrap(security_1.default.create(decoded));
        expect(bond.isCallable()).toBe(false);
        expect(bond.getCallDate()).toBeNull();
        expect(ymd(bond.getMaturityDate())).toEqual(MATURITY);
    });
    test.each([
        ['stock', product_type_pb_1.ProductTypeProto.COMMON_STOCK, security_1.default],
        ['cash', product_type_pb_1.ProductTypeProto.CURRENCY, security_1.default],
        ['index', product_type_pb_1.ProductTypeProto.EQUITY_INDEX, IndexSecurity_1.default],
    ])('non-bond %s is not callable and has no call date', (_name, productType, cls) => {
        const p = new security_pb_1.SecurityProto();
        p.setProductType(productType);
        const security = security_1.default.create(decode(p));
        expect(security).toBeInstanceOf(cls);
        expect(security.isCallable()).toBe(false);
        expect(security.getCallDate()).toBeNull();
    });
});
//# sourceMappingURL=security.callable.test.js.map