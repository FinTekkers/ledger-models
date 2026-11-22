"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// LM-479: EquityDetailsProto.shares_outstanding round-trips, stays absent
// when unset, and EquitySecurity.getSharesOutstanding never reports absent
// as 0.
const security_1 = __importDefault(require("./security"));
const EquitySecurity_1 = __importDefault(require("./EquitySecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const product_type_pb_1 = require("../../../fintekkers/models/security/product_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const decimal_1 = require("../utils/decimal");
function etf(details) {
    const proto = new security_pb_1.SecurityProto().setProductType(product_type_pb_1.ProductTypeProto.ETF);
    if (details)
        proto.setEquityDetails(details);
    return proto;
}
function roundTrip(proto) {
    return security_pb_1.SecurityProto.deserializeBinary(proto.serializeBinary());
}
function oneBillion() {
    return (0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('1000000000'));
}
describe('EquityDetailsProto.shares_outstanding (LM-479)', () => {
    test('round-trips 1,000,000,000 through bytes', () => {
        const parsed = roundTrip(etf(new security_pb_1.EquityDetailsProto().setSharesOutstanding(oneBillion())));
        const details = parsed.getEquityDetails();
        expect(details.hasSharesOutstanding()).toBe(true);
        expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(details.getSharesOutstanding()))).toBe('1000000000');
    });
    test('equity_details without shares_outstanding stays absent after round trip', () => {
        const parsed = roundTrip(etf(new security_pb_1.EquityDetailsProto()));
        expect(parsed.hasEquityDetails()).toBe(true);
        expect(parsed.getEquityDetails().hasSharesOutstanding()).toBe(false);
    });
    test('ETF: serialize, parse, Security.create, getter returns the value', () => {
        const security = security_1.default.create(roundTrip(etf(new security_pb_1.EquityDetailsProto().setSharesOutstanding(oneBillion()))));
        expect(security).toBeInstanceOf(EquitySecurity_1.default);
        expect(security.isEquity()).toBe(true);
        if (!security.isEquity())
            throw new Error('expected an EquitySecurity');
        expect(security.getSharesOutstanding().toFixed()).toBe('1000000000');
    });
    test('ETF without shares_outstanding: getter returns undefined, not 0', () => {
        const security = security_1.default.create(roundTrip(etf(new security_pb_1.EquityDetailsProto())));
        expect(security).toBeInstanceOf(EquitySecurity_1.default);
        expect(security.getSharesOutstanding()).toBeUndefined();
    });
    test('ETF without equity_details: getter returns undefined', () => {
        const security = security_1.default.create(roundTrip(etf()));
        expect(security).toBeInstanceOf(EquitySecurity_1.default);
        expect(security.getSharesOutstanding()).toBeUndefined();
    });
    test('present but empty DecimalValueProto: getter returns undefined', () => {
        const parsed = roundTrip(etf(new security_pb_1.EquityDetailsProto().setSharesOutstanding(new decimal_value_pb_1.DecimalValueProto())));
        expect(parsed.getEquityDetails().hasSharesOutstanding()).toBe(true);
        const security = new EquitySecurity_1.default(parsed);
        expect(security.getSharesOutstanding()).toBeUndefined();
    });
});
//# sourceMappingURL=EquitySecurity.test.js.map