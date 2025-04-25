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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Models
const security_pb_1 = require("../../../fintekkers/models/security/security_pb");
const coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
const security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const uuid = __importStar(require("../../models/utils/uuid"));
const dt = __importStar(require("../../models/utils/datetime"));
const SecurityService_1 = require("./SecurityService");
const positionfilter_1 = require("../../models/position/positionfilter");
const issuance_pb_1 = require("../../../fintekkers/models/security/bond/issuance_pb");
const serialization_1 = require("../../models/utils/serialization");
test('test creating a security against the api.fintekkers.org security service', () => __awaiter(void 0, void 0, void 0, function* () {
    const isTrue = yield testSecurity();
    expect(isTrue).toBe(true);
}), 30000);
function testSecurity() {
    return __awaiter(this, void 0, void 0, function* () {
        const id_proto = uuid.UUID.random().toUUIDProto();
        const now = dt.ZonedDateTime.now();
        const securityService = new SecurityService_1.SecurityService();
        let usd_security = yield securityService
            .searchSecurity(now.toProto(), new positionfilter_1.PositionFilter().addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Cash'))
            .then((securities) => {
            return securities[0];
        });
        const security = new security_pb_1.SecurityProto();
        security.setObjectClass('Security');
        security.setVersion('0.0.1');
        security.setUuid(id_proto);
        security.setSettlementCurrency(usd_security.proto);
        security.setAsOf(now.toProto());
        security.setAssetClass('FixedIncome');
        security.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
        security.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
        security.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
        const faceValue = new decimal_value_pb_1.DecimalValueProto();
        faceValue.setArbitraryPrecisionValue('1000.00');
        security.setFaceValue(faceValue);
        const couponRate = new decimal_value_pb_1.DecimalValueProto();
        couponRate.setArbitraryPrecisionValue('0.05');
        security.setCouponRate(couponRate); // Fixed a typo here. It was security.setFaceValue(couponRate);
        const issueDate = new local_date_pb_1.LocalDateProto();
        issueDate.setYear(2023);
        issueDate.setMonth(1);
        issueDate.setDay(1);
        security.setIssueDate(issueDate);
        security.setDatedDate(issueDate);
        const maturityDate = new local_date_pb_1.LocalDateProto();
        maturityDate.setYear(2033); //10Y
        maturityDate.setMonth(1);
        maturityDate.setDay(1);
        security.setMaturityDate(maturityDate);
        security.setIssuerName('US Treasury');
        security.setDescription('Dummy US Treasury 10Y Bond');
        const issuance = new issuance_pb_1.IssuanceProto();
        issuance.setPostAuctionOutstandingQuantity(serialization_1.ProtoSerializationUtil.serialize(1000000.00));
        issuance.setTotalAccepted(serialization_1.ProtoSerializationUtil.serialize(100000000.00));
        security.addIssuanceInfo(issuance);
        var validationSummary = yield securityService.validateCreateSecurity(security);
        expect(validationSummary.getErrorsList().length).toBe(0);
        var createSecurityResponse = yield securityService.createSecurity(security);
        expect(createSecurityResponse.getSecurityResponse()).toBeTruthy();
        var searchResults = yield securityService.searchSecurity(now.toProto(), new positionfilter_1.PositionFilter().addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income'));
        expect(searchResults.length).toBeGreaterThan(0);
        return true;
    });
}
//# sourceMappingURL=security.test.js.map