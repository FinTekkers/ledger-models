import Security from './security';
import { SecurityProto, BondDetailsProto } from '../../../fintekkers/models/security/security_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import { LocalDate } from '../utils/date';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
import { Tenor } from './term';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { Decimal } from 'decimal.js';
import Issuance from './Issuance';
/**
 * Inputs required to mint a SecurityProto for the bond pricer. Shared by
 * BondSecurity / TIPSBond / FloatingRateNote builders.
 */
export interface BondPricerInputs {
    faceValue: Decimal;
    couponRate: Decimal;
    couponType: CouponTypeProto;
    couponFrequency: CouponFrequencyProto;
    issueDate: LocalDate;
    maturityDate: LocalDate;
}
/**
 * Build a LocalDateProto from a LocalDate wrapper. Exported so subclass
 * builders (TIPSBond, FloatingRateNote) can re-use it without poking at
 * LocalDate's proto privately.
 */
export declare function localDateToProto(d: LocalDate): LocalDateProto;
/** Build a DecimalValueProto from a Decimal. */
export declare function decimalToProto(v: Decimal): DecimalValueProto;
/**
 * Build a populated BondDetailsProto from BondPricerInputs. Shared helper
 * so the three pricer-input builders stay in sync.
 */
export declare function buildBondDetails(args: BondPricerInputs): BondDetailsProto;
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
    /**
     * Returns every auction/reopening record on this bond as typed Issuance
     * wrappers. Empty list if bond_details is unset or has no issuances.
     */
    getIssuances(): Issuance[];
    /**
     * Build a fresh SecurityProto for a vanilla treasury note from pricer
     * inputs. Use TIPSBond.fromPricerInputs / FloatingRateNote.fromPricerInputs
     * for the inflation-linked / floating variants.
     */
    static fromPricerInputs(args: BondPricerInputs): SecurityProto;
    /**
     * Returns the price scale factor for bonds.
     * Bonds are typically priced as percentages (e.g., 99.5 means 99.5%),
     * so the price scale factor converts percentage to decimal (0.01).
     * @returns The price scale factor as a Decimal (0.01)
     */
    getPriceScaleFactor(): Decimal;
    /**
     * Bond issue date is the auction date and is required for bonds.
     * Overrides Security.getIssueDate (which returns LocalDate | null on the
     * base) with a non-nullable return type — for a properly-formed bond,
     * issue date is always present, and TS callers narrowed via isBond()
     * shouldn't have to null-check.
     */
    getIssueDate(): LocalDate;
    getProductType(): string;
}
export default BondSecurity;
