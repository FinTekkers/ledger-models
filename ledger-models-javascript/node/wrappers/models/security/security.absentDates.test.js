"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-441: getField(MATURITY_DATE) / getField(ISSUE_DATE) report an unset date
// as null, never a placeholder such as 2999-12-31 or 1900-01-01. Bonds keep
// their real dates.
const security_1 = __importDefault(require("./security"));
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const TIPSBond_1 = __importDefault(require("./TIPSBond"));
const FloatingRateNote_1 = __importDefault(require("./FloatingRateNote"));
const MortgageBackedSecurity_1 = __importDefault(require("./MortgageBackedSecurity"));
const IndexSecurity_1 = __importDefault(require("./IndexSecurity"));
const position_1 = require("../position/position");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const position_pb_1 = require("../../../fintekkers/models/position/position_pb");
const position_util_pb_1 = require("../../../fintekkers/models/position/position_util_pb");
const ISSUE = [2024, 5, 15];
const MATURITY = [2034, 5, 15];
function localDate([y, m, d]) {
    return new local_date_pb_1.LocalDateProto().setYear(y).setMonth(m).setDay(d);
}
function makeProto(productType, opts = {}) {
    const p = new security_pb_1.SecurityProto();
    p.setProductType(productType);
    if (opts.bondDetails || opts.dates) {
        const bd = new security_pb_1.BondDetailsProto();
        if (opts.dates) {
            bd.setIssueDate(localDate(ISSUE));
            bd.setMaturityDate(localDate(MATURITY));
        }
        p.setBondDetails(bd);
    }
    return p;
}
function ymd(d) {
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
}
function isPlaceholder(value) {
    if (!(value instanceof Date))
        return false;
    const [y, m, d] = ymd(value);
    return (y === 2999 && m === 12 && d === 31) || (y === 1900 && m === 1 && d === 1);
}
// JS has no EquitySecurity / CashSecurity: Security.create returns a plain
// Security for stock, cash, FX spot and crypto.
const NON_BONDS = [
    ['stock', product_type_pb_1.ProductTypeProto.COMMON_STOCK, security_1.default],
    ['index', product_type_pb_1.ProductTypeProto.EQUITY_INDEX, IndexSecurity_1.default],
    ['cash', product_type_pb_1.ProductTypeProto.CURRENCY, security_1.default],
    ['fx spot', product_type_pb_1.ProductTypeProto.FX_SPOT, security_1.default],
    ['crypto', product_type_pb_1.ProductTypeProto.CRYPTOCURRENCY, security_1.default],
];
describe('Security absent dates (LM-441)', () => {
    for (const [name, productType, cls] of NON_BONDS) {
        for (const bondDetails of [false, true]) {
            test(`${name} (bond_details ${bondDetails ? 'present, dates unset' : 'absent'}) returns null`, () => {
                const security = security_1.default.create(makeProto(productType, { bondDetails }));
                expect(security.constructor).toBe(cls);
                for (const field of [field_pb_1.FieldProto.MATURITY_DATE, field_pb_1.FieldProto.ISSUE_DATE]) {
                    const value = security.getField(field);
                    expect(value).toBeNull();
                    expect(isPlaceholder(value)).toBe(false);
                }
            });
        }
    }
    test.each([
        ['fx spot', product_type_pb_1.ProductTypeProto.FX_SPOT],
        ['crypto', product_type_pb_1.ProductTypeProto.CRYPTOCURRENCY],
    ])('a non-bond %s with bond_details dates set returns them', (_name, productType) => {
        const security = security_1.default.create(makeProto(productType, { dates: true }));
        expect(security.isBond()).toBe(false);
        expect(ymd(security.getField(field_pb_1.FieldProto.MATURITY_DATE))).toEqual(MATURITY);
        expect(ymd(security.getField(field_pb_1.FieldProto.ISSUE_DATE))).toEqual(ISSUE);
    });
    test.each([
        ['BondSecurity', product_type_pb_1.ProductTypeProto.TREASURY_NOTE, BondSecurity_1.default],
        ['TIPSBond', product_type_pb_1.ProductTypeProto.TIPS, TIPSBond_1.default],
        ['FloatingRateNote', product_type_pb_1.ProductTypeProto.TREASURY_FRN, FloatingRateNote_1.default],
        ['MortgageBackedSecurity', product_type_pb_1.ProductTypeProto.MORTGAGE_BACKED, MortgageBackedSecurity_1.default],
    ])('%s dates are unchanged', (_name, productType, cls) => {
        const security = security_1.default.create(makeProto(productType, { dates: true }));
        expect(security).toBeInstanceOf(cls);
        expect(ymd(security.getField(field_pb_1.FieldProto.MATURITY_DATE))).toEqual(MATURITY);
        expect(ymd(security.getField(field_pb_1.FieldProto.ISSUE_DATE))).toEqual(ISSUE);
    });
    test('a position with an unset MATURITY_DATE entry does not throw', () => {
        const entry = new position_util_pb_1.FieldMapEntry().setField(field_pb_1.FieldProto.MATURITY_DATE);
        const proto = new position_pb_1.PositionProto();
        proto.addFields(entry);
        const position = new position_1.Position(proto);
        expect(position.getFieldValue(field_pb_1.FieldProto.MATURITY_DATE)).toBeNull();
        expect(position.getFieldDisplay(entry)).toBe('');
        expect(() => position.toString()).not.toThrow();
        expect(position.toString().endsWith(',;')).toBe(true);
    });
});
//# sourceMappingURL=security.absentDates.test.js.map