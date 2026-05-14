import BondSecurity, { BondPricerInputs } from './BondSecurity';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { LocalDate } from '../utils/date';
import { Decimal } from 'decimal.js';
/**
 * TIPS-specific accessors layered on top of BondSecurity. The inflation
 * fields live in the parallel tips_extension sub-message; bond_details
 * (coupon, maturity, etc.) still carries the rest.
 */
declare class TIPSBond extends BondSecurity {
    constructor(proto: SecurityProto);
    private getTipsExtension;
    /** Base CPI value at issue, used to scale inflation-adjusted principal. */
    getBaseCpi(): Decimal | null;
    /** Reference date for the base CPI fixing. */
    getIndexDate(): LocalDate | null;
    /** Which inflation index drives accruals (CPI_U on US TIPS). */
    getInflationIndexType(): IndexTypeProto;
    /**
     * Build a fresh SecurityProto for a TIPS bond. product_type is set to
     * TIPS so Security.create routes back to this wrapper.
     */
    static fromPricerInputs(args: BondPricerInputs & {
        baseCpi: Decimal;
        indexDate: LocalDate;
        inflationIndexType: IndexTypeProto;
    }): SecurityProto;
}
export default TIPSBond;
