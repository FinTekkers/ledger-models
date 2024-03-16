import assert = require('assert');

// Models

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import { SecurityService } from './SecurityService';
import { PositionFilter } from '../../models/position/positionfilter';
import Security from '../../models/security/security';
import { ProtoSerializationUtil } from '../../models/utils/serialization';

test('test the api.fintekkers.org security service by creating a maturity ladder for the US government', async () => {
    //Get list of all securities from the US government, with a maturity data beyond today's date
    const securityService = new SecurityService();

    const positionFilter = new PositionFilter();
    positionFilter.addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income');
    positionFilter.addEqualsFilter(FieldProto.SECURITY_ISSUER_NAME, 'US Government');

    var securities = await securityService.searchSecurityAsOfNow(positionFilter);

    assert(securities.length > 0);
    let results = [];

    //Map results into list of maps -> Date, Amount
    for (let index in securities) {
        let security: Security = securities[index];

        let issuanceList = security.proto.getIssuanceInfoList();
        let issuance = issuanceList && issuanceList.length > 0 ? issuanceList[0] : null;

        if (issuance) {
            if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() > 2009) {
                console.log("Issed with %s, issuance: %s", security.getSecurityID().getIdentifierValue(), issuance);
            } else if (!issuance.getPostAuctionOutstandingQuantity() && security.getMaturityDate().getFullYear() <= 2009) {
                //Swallow this data gap. It's old and we don't mind
            } else {
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
    }

    expect(results[0]['outstandingAmount']).toBeGreaterThan(0);
}, 90000);

