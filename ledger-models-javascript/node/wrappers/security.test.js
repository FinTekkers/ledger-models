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
exports.testSecurity = void 0;
var grpc = require("@grpc/grpc-js");
// Models
var security_pb_1 = require("../fintekkers/models/security/security_pb");
var coupon_frequency_pb_1 = require("../fintekkers/models/security/coupon_frequency_pb");
var decimal_value_pb_1 = require("../fintekkers/models/util/decimal_value_pb");
var coupon_type_pb_1 = require("../fintekkers/models/security/coupon_type_pb");
var security_type_pb_1 = require("../fintekkers/models/security/security_type_pb");
var local_date_pb_1 = require("../fintekkers/models/util/local_date_pb");
// Model Utils
var position_filter_pb_1 = require("../fintekkers/models/position/position_filter_pb");
var field_pb_1 = require("../fintekkers/models/position/field_pb");
// Requests & Services
var create_security_request_pb_1 = require("../fintekkers/requests/security/create_security_request_pb");
var query_security_request_pb_1 = require("../fintekkers/requests/security/query_security_request_pb");
var security_service_grpc_pb_1 = require("../fintekkers/services/security-service/security_service_grpc_pb");
var uuid = require("./proto_utils_uuid");
var dt = require("./proto_utils_datetime");
var proto_utils_util_1 = require("./proto_utils_util");
var util_1 = require("util");
var SecurityService = /** @class */ (function () {
    function SecurityService() {
        this.client = new security_service_grpc_pb_1.SecurityClient('api.fintekkers.org:8082', grpc.credentials.createSsl());
        // this.client = new SecurityClient('localhost:8082', grpc.credentials.createInsecure());
    }
    SecurityService.prototype.validateCreateSecurity = function (security) {
        return __awaiter(this, void 0, void 0, function () {
            var createRequest, validateCreateOrUpdateAsync, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRequest = new create_security_request_pb_1.CreateSecurityRequestProto();
                        createRequest.setObjectClass('SecurityRequest');
                        createRequest.setVersion('0.0.1');
                        createRequest.setSecurityInput(security);
                        validateCreateOrUpdateAsync = (0, util_1.promisify)(this.client.validateCreateOrUpdate.bind(this.client));
                        return [4 /*yield*/, validateCreateOrUpdateAsync(createRequest)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SecurityService.prototype.createSecurity = function (security) {
        return __awaiter(this, void 0, void 0, function () {
            var createRequest, createSecurityAsync, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        createRequest = new create_security_request_pb_1.CreateSecurityRequestProto();
                        createRequest.setObjectClass('SecurityRequest');
                        createRequest.setVersion('0.0.1');
                        createRequest.setSecurityInput(security);
                        createSecurityAsync = (0, util_1.promisify)(this.client.createOrUpdate.bind(this.client));
                        return [4 /*yield*/, createSecurityAsync(createRequest)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SecurityService.prototype.searchSecurity = function (asOf, fieldProto, fieldValue) {
        return __awaiter(this, void 0, void 0, function () {
            function processStreamSynchronously() {
                return __awaiter(this, void 0, void 0, function () {
                    var stream2;
                    return __generator(this, function (_a) {
                        stream2 = tmpClient.search(searchRequest);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                // Handle the stream of responses
                                stream2.on('data', function (response) {
                                    console.log('Result of the security search call');
                                    console.log('Response:', response);
                                    response.getSecurityResponseList().forEach(function (security) {
                                        listSecurities.push(security);
                                    });
                                });
                                stream2.on('end', function () {
                                    // Stream is done, handle any cleanup or finalization here
                                    console.log('Stream ended.');
                                    resolve(listSecurities); // Resolve the promise when the stream ends
                                });
                                stream2.on('error', function (err) {
                                    // Handle any errors that occur during the stream
                                    console.error('Error in the stream:', err);
                                    reject(err); // Reject the promise if there's an error
                                });
                            })];
                    });
                });
            }
            var searchRequest, positionFilter, fieldMapEntry, tmpClient, listSecurities;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchRequest = new query_security_request_pb_1.QuerySecurityRequestProto();
                        searchRequest.setObjectClass('SecurityRequest');
                        searchRequest.setVersion('0.0.1');
                        searchRequest.setAsOf(asOf);
                        positionFilter = new position_filter_pb_1.PositionFilterProto();
                        positionFilter.setObjectClass('PositionFilter');
                        positionFilter.setVersion('0.0.1');
                        fieldMapEntry = (0, proto_utils_util_1.createFieldMapEntry)(fieldProto, fieldValue);
                        positionFilter.setFiltersList([fieldMapEntry]);
                        searchRequest.setSearchSecurityInput(positionFilter);
                        tmpClient = this.client;
                        listSecurities = [];
                        return [4 /*yield*/, processStreamSynchronously()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return SecurityService;
}());
function testSecurity() {
    return __awaiter(this, void 0, void 0, function () {
        var id_proto, now, securityService, usd_security, security, faceValue, couponRate, issueDate, maturityDate, validationSummary, createSecurityResponse, searchResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id_proto = uuid.UUID.random().to_uuid_proto();
                    now = dt.ZonedDateTime.now();
                    securityService = new SecurityService();
                    return [4 /*yield*/, securityService
                            .searchSecurity(now.to_date_proto(), field_pb_1.FieldProto.ASSET_CLASS, 'Cash')
                            .then(function (securities) {
                            return securities[0];
                        })];
                case 1:
                    usd_security = _a.sent();
                    security = new security_pb_1.SecurityProto();
                    security.setObjectClass('Security');
                    security.setVersion('0.0.1');
                    security.setUuid(id_proto);
                    security.setSettlementCurrency(usd_security);
                    security.setAsOf(now.to_date_proto());
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
                    console.log(validationSummary);
                    return [4 /*yield*/, securityService.createSecurity(security)];
                case 3:
                    createSecurityResponse = _a.sent();
                    console.log(createSecurityResponse);
                    return [4 /*yield*/, securityService.searchSecurity(now.to_date_proto(), field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income')];
                case 4:
                    searchResults = _a.sent();
                    console.log('There are %d securities in this response', searchResults.length);
                    return [2 /*return*/];
            }
        });
    });
}
exports.testSecurity = testSecurity;
//# sourceMappingURL=security.test.js.map