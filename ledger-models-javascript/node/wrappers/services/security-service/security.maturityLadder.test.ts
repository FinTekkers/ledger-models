// Models
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

import * as uuid from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';

import { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';
import { SecurityService } from './SecurityService';
import { PositionFilter } from '../../models/position/positionfilter';

test('test the api.fintekkers.org security service by creating a maturity ladder for the US government', async () => {
    //TODO: Get list of all securities from the US government, with a maturity data beyond today's date

    const securityService = new SecurityService();

    const positionFilter = new PositionFilter();
    positionFilter.addFilter(FieldProto.SECURITY_ISSUER_NAME, "US Government");
    const securities = await securityService.searchSecurityAsOfNow(positionFilter);


    console.log(securities.length);
    //TODO: Get oustanding amount of bond 


    //TODO: Map results into Map -> Date, Amount


    //TODO: Loose end. Asset Class is a string. Maybe should be an 'extendible' enum
    //TODO: Loose end. Security coupon rate, need to add validation logic so that coupon rate is a sensible number
}, 30000);

