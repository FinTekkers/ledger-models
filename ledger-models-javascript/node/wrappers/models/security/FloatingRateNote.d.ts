import BondSecurity, { BondPricerInputs } from './BondSecurity';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { Decimal } from 'decimal.js';
/**
 * FRN-specific accessors layered on top of BondSecurity. The floating-rate
 * fields live in the parallel frn_extension sub-message; bond_details
 * still carries face value / dates / etc.
 */
declare class FloatingRateNote extends BondSecurity {
    constructor(proto: SecurityProto);
    private getFrnExtension;
    /** Spread added on top of the reference rate at each reset. */
    getSpread(): Decimal | null;
    /** Which index the coupon resets off (SOFR on a US TREASURY_FRN). */
    getReferenceRateIndex(): IndexTypeProto;
    /** Reset cadence (e.g. QUARTERLY). */
    getResetFrequency(): CouponFrequencyProto;
    /**
     * Build a fresh SecurityProto for a floating-rate note. product_type is
     * set to TREASURY_FRN so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args: BondPricerInputs & {
        spread: Decimal;
        referenceRateIndex: IndexTypeProto;
        resetFrequency: CouponFrequencyProto;
    }): SecurityProto;
}
export default FloatingRateNote;
