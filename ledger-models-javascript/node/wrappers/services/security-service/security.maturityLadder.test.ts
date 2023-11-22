import assert = require('assert');

// Models

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { SecurityService } from './SecurityService';
import { PositionFilter } from '../../models/position/positionfilter';
import { PositionFilterOperator } from '../../../fintekkers/models/position/position_util_pb';
import Security from '../../models/security/security';
import { ProtoSerializationUtil } from '../../models/utils/serialization';

test('test the api.fintekkers.org security service by creating a maturity ladder for the US government', async () => {
    //Get list of all securities from the US government, with a maturity data beyond today's date
    const securityService = new SecurityService();

    const positionFilter = new PositionFilter();
    positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');
    // positionFilter.addFilter(FieldProto.MATURITY_DATE, new Date(), PositionFilterOperator.MORE_THAN);

    var securities = await securityService.searchSecurityAsOfNow(positionFilter);

    assert(securities.length > 0);
    let results = [];

    //Map results into list of maps -> Date, Amount
    for (let index in securities) {
        let security: Security = securities[index];

        let issuanceList = security.proto.getIssuanceInfoList();
        let issuance = issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        if (issuance) {
            let postAuctionQuantity: number = ProtoSerializationUtil.deserialize(issuance.getPostAuctionOutstandingQuantity());
            let id: string = security.getSecurityID() ? security.getSecurityID().getIdentifierValue() : security.getID().toString();

            let result = {
                'cusip': id,
                'issueDate': security.getIssueDate(),
                'outstandingAmount': postAuctionQuantity,
                'maturityDate': security.getMaturityDate()
            };
            results.push(result);
        }
    }

    console.log(results);
    console.log("Done");
    //TODO: Get oustanding amount of bond 




    //TODO: Loose end. Asset Class is a string. Maybe should be an 'extendible' enum
    //TODO: Loose end. Security coupon rate, need to add validation logic so that coupon rate is a sensible number
}, 90000);

