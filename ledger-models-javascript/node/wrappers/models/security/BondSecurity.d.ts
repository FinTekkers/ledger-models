import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
import { Tenor } from './term';
declare class BondSecurity extends Security {
    constructor(proto: SecurityProto);
    /** Returns the tenor (term) of the bond as a Tenor object */
    getTenor(): Tenor;
    /**
     * Calculates the period between two dates in years, months, and days.
     * This method handles month and year boundaries correctly.
     */
    private calculatePeriod;
    getCouponRate(): DecimalValueProto;
    getFaceValue(): DecimalValueProto;
    getCouponType(): CouponType;
    getCouponFrequency(): CouponFrequency;
    getDatedDate(): LocalDate | undefined;
    getIssuanceInfo(): IssuanceProto[];
}
export default BondSecurity;
