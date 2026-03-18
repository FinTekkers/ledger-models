"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const BondSecurity_1 = __importDefault(require("./BondSecurity"));
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const uuid_1 = require("../utils/uuid");
const datetime_1 = require("../utils/datetime");
const decimal_js_1 = require("decimal.js");
test('test BondSecurity getPriceScaleFactor', () => {
    testGetPriceScaleFactor();
});
function testGetPriceScaleFactor() {
    const bondSecurity = createDummyBondSecurity();
    const priceScaleFactor = bondSecurity.getPriceScaleFactor();
    // Price scale factor should be 0.01 for bonds
    assert(priceScaleFactor.equals(new decimal_js_1.Decimal('0.01')), `Expected price scale factor 0.01, got ${priceScaleFactor.toString()}`);
}
function createDummyBondSecurity() {
    const securityProto = new security_pb_1.SecurityProto();
    securityProto.setObjectClass('Security');
    securityProto.setVersion('0.0.1');
    securityProto.setUuid(uuid_1.UUID.random().toUUIDProto());
    securityProto.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
    securityProto.setAsOf(datetime_1.ZonedDateTime.now().toProto());
    securityProto.setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'));
    securityProto.setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1));
    securityProto.setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2031).setMonth(1).setDay(1));
    return new BondSecurity_1.default(securityProto);
}
//# sourceMappingURL=BondSecurity.priceScale.test.js.map