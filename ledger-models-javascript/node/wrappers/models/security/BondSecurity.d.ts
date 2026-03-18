import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
import { Tenor } from './term';
import { Decimal } from 'decimal.js';
declare class BondSecurity extends Security {
    constructor(proto: SecurityProto);
    /** Returns the tenor (term) of the bond as a Tenor object.
     *
     * If an 'as of date' is provided the term will be based on
     * maturity date - as of date, instead of maturity date - issue date.
     * @param asOfDate - [Optional]The 'as of date' to use for the tenor calculation.
     * @returns The tenor (term) of the bond as a Tenor object.
     */
    getTenor(asOfDate?: Date): Tenor;
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
    /**
     * Returns the price scale factor for bonds.
     * Bonds are typically priced as percentages (e.g., 99.5 means 99.5%),
     * so the price scale factor converts percentage to decimal (0.01).
     * @returns The price scale factor as a Decimal (0.01)
     */
    getPriceScaleFactor(): Decimal;
    getProductType(): string;
}
export default BondSecurity;
