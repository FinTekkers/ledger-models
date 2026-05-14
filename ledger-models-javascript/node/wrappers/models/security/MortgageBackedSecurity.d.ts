import BondSecurity, { BondPricerInputs } from './BondSecurity';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { AgencyProto } from '../../../fintekkers/models/security/bond/agency_pb';
import { Decimal } from 'decimal.js';
/**
 * MBS-specific accessors layered on top of BondSecurity. Pool-level fields
 * (agency, WAC, WAM, pass-through rate, factors, balances, PSA) live in
 * the parallel mbs_extension sub-message; bond_details still carries the
 * canonical coupon/dates/face value.
 */
declare class MortgageBackedSecurity extends BondSecurity {
    constructor(proto: SecurityProto);
    private getMbsExtension;
    /** Pool identifier (e.g. "FN AS1234"). */
    getPoolNumber(): string;
    /** Issuing agency (FNMA / FHLMC / GNMA). */
    getAgency(): AgencyProto;
    /** Weighted Average Coupon across underlying loans. */
    getWac(): Decimal | null;
    /** Weighted Average Maturity, in months. */
    getWam(): number;
    /** Pass-through rate paid to investors (net of servicing/guarantee fees). */
    getPassThroughRate(): Decimal | null;
    /** Current pool factor (remaining UPB / original face). */
    getCurrentFactor(): Decimal | null;
    /** Original face value at issuance. */
    getOriginalFaceValue(): Decimal | null;
    /** Current Unpaid Principal Balance. */
    getCurrentUpb(): Decimal | null;
    /** PSA prepayment speed assumption. */
    getPsaSpeed(): Decimal | null;
    /**
     * Build a fresh SecurityProto for an agency MBS pass-through. product_type
     * is set to MORTGAGE_BACKED so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args: BondPricerInputs & {
        poolNumber: string;
        agency: AgencyProto;
        wac: Decimal;
        wam: number;
        passThroughRate: Decimal;
        currentFactor: Decimal;
        originalFaceValue: Decimal;
        currentUpb: Decimal;
        psaSpeed: Decimal;
    }): SecurityProto;
}
export default MortgageBackedSecurity;
