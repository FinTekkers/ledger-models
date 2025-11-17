import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
declare class BondSecurity extends Security {
    constructor(proto: SecurityProto);
    getCouponRate(): DecimalValueProto;
    getFaceValue(): DecimalValueProto;
    getCouponType(): CouponTypeProto;
    getCouponFrequency(): CouponFrequencyProto;
    getDatedDate(): LocalDate | undefined;
    getIssuanceInfo(): IssuanceProto[];
}
export default BondSecurity;
