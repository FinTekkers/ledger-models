"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Models
var security_pb_1 = require("../../../fintekkers/models/security/security_pb");
var coupon_frequency_pb_1 = require("../../../fintekkers/models/security/coupon_frequency_pb");
var decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
var coupon_type_pb_1 = require("../../../fintekkers/models/security/coupon_type_pb");
var security_type_pb_1 = require("../../../fintekkers/models/security/security_type_pb");
var local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
// Model Utils
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var uuid = require("../../models/utils/uuid");
var dt = require("../../models/utils/datetime");
var SecurityService_1 = require("./SecurityService");
var positionfilter_1 = require("../../models/position/positionfilter");
test('test creating a security against the api.fintekkers.org security service', function () { return __awaiter(void 0, void 0, void 0, function () {
    var isTrue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, testSecurity()];
            case 1:
                isTrue = _a.sent();
                expect(isTrue).toBe(true);
                return [2 /*return*/];
        }
    });
}); }, 30000);
function testSecurity() {
    return __awaiter(this, void 0, void 0, function () {
        var id_proto, now, securityService, usd_security, security, faceValue, couponRate, issueDate, maturityDate, validationSummary, createSecurityResponse, searchResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id_proto = uuid.UUID.random().toUUIDProto();
                    now = dt.ZonedDateTime.now();
                    securityService = new SecurityService_1.SecurityService();
                    return [4 /*yield*/, securityService
                            .searchSecurity(now.toProto(), new positionfilter_1.PositionFilter().addFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Cash'))
                            .then(function (securities) {
                            return securities[0];
                        })];
                case 1:
                    usd_security = _a.sent();
                    security = new security_pb_1.SecurityProto();
                    security.setObjectClass('Security');
                    security.setVersion('0.0.1');
                    security.setUuid(id_proto);
                    security.setSettlementCurrency(usd_security.proto);
                    security.setAsOf(now.toProto());
                    security.setAssetClass('FixedIncome');
                    security.setCouponFrequency(coupon_frequency_pb_1.CouponFrequencyProto.SEMIANNUALLY);
                    security.setCouponType(coupon_type_pb_1.CouponTypeProto.FIXED);
                    security.setSecurityType(security_type_pb_1.SecurityTypeProto.BOND_SECURITY);
                    faceValue = new decimal_value_pb_1.DecimalValueProto();
                    faceValue.setArbitraryPrecisionValue('1000.00');
                    security.setFaceValue(faceValue);
                    couponRate = new decimal_value_pb_1.DecimalValueProto();
                    couponRate.setArbitraryPrecisionValue('0.05');
                    security.setCouponRate(couponRate); // Fixed a typo here. It was security.setFaceValue(couponRate);
                    issueDate = new local_date_pb_1.LocalDateProto();
                    issueDate.setYear(2023);
                    issueDate.setMonth(1);
                    issueDate.setDay(1);
                    security.setIssueDate(issueDate);
                    security.setDatedDate(issueDate);
                    maturityDate = new local_date_pb_1.LocalDateProto();
                    maturityDate.setYear(2033); //10Y
                    maturityDate.setMonth(1);
                    maturityDate.setDay(1);
                    security.setMaturityDate(maturityDate);
                    security.setIssuerName('US Treasury');
                    security.setDescription('Dummy US Treasury 10Y Bond');
                    return [4 /*yield*/, securityService.validateCreateSecurity(security)];
                case 2:
                    validationSummary = _a.sent();
                    return [4 /*yield*/, securityService.createSecurity(security)];
                case 3:
                    createSecurityResponse = _a.sent();
                    return [4 /*yield*/, securityService.searchSecurity(now.toProto(), new positionfilter_1.PositionFilter().addFilter(field_pb_1.FieldProto.ASSET_CLASS, 'FixedIncome'))];
                case 4:
                    searchResults = _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
//# sourceMappingURL=security.test.js.map