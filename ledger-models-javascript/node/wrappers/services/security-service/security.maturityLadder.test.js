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
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// Models
// Model Utils
const field_pb_1 = require("../../../fintekkers/models/position/field_pb");
const SecurityService_1 = require("./SecurityService");
const positionfilter_1 = require("../../models/position/positionfilter");
const serialization_1 = require("../../models/utils/serialization");
test('test the api.fintekkers.org security service by creating a maturity ladder for the US government', () => __awaiter(void 0, void 0, void 0, function* () {
    //Get list of all securities from the US government, with a maturity data beyond today's date
    const securityService = new SecurityService_1.SecurityService();
    const positionFilter = new positionfilter_1.PositionFilter();
    positionFilter.addEqualsFilter(field_pb_1.FieldProto.ASSET_CLASS, 'Fixed Income');
    positionFilter.addEqualsFilter(field_pb_1.FieldProto.SECURITY_ISSUER_NAME, 'US Government');
    var securities = yield securityService.searchSecurityAsOfNow(positionFilter);
    assert(securities.length > 0);
    let results = [];
    //Map results into list of maps -> Date, Amount
    for (let index in securities) {
        let security = securities[index];
        let issuanceList = security.proto.getIssuanceInfoList();
        let issuance = issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;
        if (issuance) {
            if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().toDate().getFullYear() > 2009) {
                console.log("Issed with %s, issuance: %s", security.getSecurityID().getIdentifierValue(), issuance);
            }
            else if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().toDate().getFullYear() <= 2009) {
                //Swallow this data gap. It's old and we don't mind
            }
            else {
                let postAuctionQuantity = serialization_1.ProtoSerializationUtil.deserialize(issuance.getPostAuctionOutstandingQuantity());
                let id = security.getSecurityID() ? security.getSecurityID().getIdentifierValue() : security.getID().toString();
                let result = {
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
}), 90000);
//# sourceMappingURL=security.maturityLadder.test.js.map