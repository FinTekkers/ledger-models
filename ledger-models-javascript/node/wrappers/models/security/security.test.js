"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const uuid_1 = require("../utils/uuid");
const assert = require("assert");
const security_1 = __importDefault(require("./security"));
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const security_quantity_type_pb_1 = require("../../../fintekkers/models/security/security_quantity_type_pb");
test('test the security wrapper', () => {
    testSerialization();
});
function testSerialization() {
    const security = dummySecurity();
    assert(security.getMaturityDate().toDate().getFullYear() == 2026);
}
function dummySecurity() {
    return security_1.default.create(new security_pb_1.SecurityProto()
        .setObjectClass('Transaction').setVersion('0.0.1').setUuid(uuid_1.UUID.random().toUUIDProto())
        .setFaceValue(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('1000.00'))
        .setQuantityType(security_quantity_type_pb_1.SecurityQuantityTypeProto.ORIGINAL_FACE_VALUE)
        .setAssetClass("Bond")
        .setIssuerName("Dummy issuer")
        .setCouponRate(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0.05'))
        .setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY)
        .setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED)
        .setMaturityDate(new local_date_pb_1.LocalDateProto().setYear(2026).setMonth(1).setDay(1))
        .setIssueDate(new local_date_pb_1.LocalDateProto().setYear(2021).setMonth(1).setDay(1))
        .setDescription("Dummy security"));
}
//# sourceMappingURL=security.test.js.map