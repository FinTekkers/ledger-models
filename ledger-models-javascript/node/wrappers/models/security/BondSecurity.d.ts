import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
declare class BondSecurity extends Security {
    constructor(proto: SecurityProto);
    /** Returns the term in years as a decimal (e.g., 10.5 for 10 years and 6 months) */
    getTerm(): number;
    getCouponRate(): DecimalValueProto;
    getFaceValue(): DecimalValueProto;
    getCouponType(): CouponType;
    getCouponFrequency(): CouponFrequency;
    getDatedDate(): LocalDate | undefined;
    getIssuanceInfo(): IssuanceProto[];
}
export default BondSecurity;
