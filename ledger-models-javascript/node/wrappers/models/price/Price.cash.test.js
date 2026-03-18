"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const Price_1 = __importDefault(require("./Price"));
const security_1 = __importDefault(require("../security/security"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const decimal_js_1 = require("decimal.js");
test('test Price getCashPrice', () => {
    testGetCashPrice();
});
function testGetCashPrice() {
    var _a, _b;
    const cashSecurity = createDummyCashSecurity();
    const asOf = datetime_1.ZonedDateTime.now();
    const cashPrice = Price_1.default.getCashPrice(cashSecurity, asOf);
    // Cash price should be 1.0 (Decimal normalizes to '1')
    const priceValue = (_a = cashPrice.proto.getPrice()) === null || _a === void 0 ? void 0 : _a.getArbitraryPrecisionValue();
    const priceDecimal = new decimal_js_1.Decimal(priceValue || '0');
    assert(priceDecimal.equals(new decimal_js_1.Decimal('1.0')), `Expected cash price 1.0, got ${priceValue}`);
    // Security should match
    assert(cashPrice.proto.getSecurity() === cashSecurity.proto, 'Security should match');
    // AsOf should match
    assert(((_b = cashPrice.proto.getAsOf()) === null || _b === void 0 ? void 0 : _b.getTimeZone()) === asOf.toProto().getTimeZone(), 'AsOf timezone should match');
}
function createDummyCashSecurity() {
    const securityProto = new security_pb_1.SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    securityProto.setSecurityType(security_type_pb_1.SecurityTypeProto.CASH_SECURITY);
    securityProto.setAsOf(datetime_1.ZonedDateTime.now().toProto());
    securityProto.setAssetClass('Cash');
    securityProto.setCashId('USD');
    return security_1.default.create(securityProto);
}
//# sourceMappingURL=Price.cash.test.js.map