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
var assert = require("assert");
// Models
// Model Utils
var field_pb_1 = require("../../../fintekkers/models/position/field_pb");
var SecurityService_1 = require("./SecurityService");
var positionfilter_1 = require("../../models/position/positionfilter");
var serialization_1 = require("../../models/utils/serialization");
test('test the api.fintekkers.org security service by creating a maturity ladder for the US government', function () { return __awaiter(void 0, void 0, void 0, function () {
    var securityService, positionFilter, securities, results, index, security, issuanceList, issuance, postAuctionQuantity, id, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                securityService = new SecurityService_1.SecurityService();
                positionFilter = new positionfilter_1.PositionFilter();
                positionFilter.addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income');
                positionFilter.addEqualsFilter(field_pb_1.FieldProto.SECURITY_ISSUER_NAME, 'US Government');
                return [4 /*yield*/, securityService.searchSecurityAsOfNow(positionFilter)];
            case 1:
                securities = _a.sent();
                assert(securities.length > 0);
                results = [];
                //Map results into list of maps -> Date, Amount
                for (index in securities) {
                    security = securities[index];
                    issuanceList = security.proto.getIssuanceInfoList();
                    issuance = issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;
                    if (issuance) {
                        if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() > 2009) {
                            console.log("Issed with %s, issuance: %s", security.getSecurityID().getIdentifierValue(), issuance);
                        }
                        else if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() <= 2009) {
                            //Swallow this data gap. It's old and we don't mind
                        }
                        else {
                            postAuctionQuantity = serialization_1.ProtoSerializationUtil.deserialize(issuance.getPostAuctionOutstandingQuantity());
                            id = security.getSecurityID() ? security.getSecurityID().getIdentifierValue() : security.getID().toString();
                            result = {
                                'cusip': id,
                                'issueDate': security.getIssueDate(),
                                'outstandingAmount': postAuctionQuantity,
                                'maturityDate': security.getMaturityDate()
                            };
                            results.push(result);
                        }
                    }
                }
                expect(results[0]['outstandingAmount']).toBeGreaterThan(0);
                return [2 /*return*/];
        }
    });
}); }, 90000);
//# sourceMappingURL=security.maturityLadder.test.js.map