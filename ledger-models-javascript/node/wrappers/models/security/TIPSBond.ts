import BondSecurity, {
  BondPricerInputs,
  buildBondDetails,
  decimalToProto,
  localDateToProto,
} from './BondSecurity';
import { SecurityProto, TipsExtensionProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { LocalDate } from '../utils/date';
import { Decimal } from 'decimal.js';

/**
 * TIPS-specific accessors layered on top of BondSecurity. The inflation
 * fields live in the parallel tips_extension sub-message; bond_details
 * (coupon, maturity, etc.) still carries the rest.
 */
class TIPSBond extends BondSecurity {
  constructor(proto: SecurityProto) {
    super(proto);
  }

  private getTipsExtension(): TipsExtensionProto | undefined {
    return this.proto.getTipsExtension() ?? undefined;
  }

  /** Base CPI value at issue, used to scale inflation-adjusted principal. */
  getBaseCpi(): Decimal | null {
    const ext = this.getTipsExtension();
    const v = ext ? ext.getBaseCpi() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Reference date for the base CPI fixing. */
  getIndexDate(): LocalDate | null {
    const ext = this.getTipsExtension();
    const d = ext ? ext.getIndexDate() : undefined;
    if (!d) return null;
    return new LocalDate(d);
  }

  /** Which inflation index drives accruals (CPI_U on US TIPS). */
  getInflationIndexType(): IndexTypeProto {
    const ext = this.getTipsExtension();
    return ext ? ext.getInflationIndexType() : IndexTypeProto.UNKNOWN_INDEX_TYPE;
  }

  /**
   * Build a fresh SecurityProto for a TIPS bond. product_type is set to
   * TIPS so Security.create routes back to this wrapper.
   */
  static fromPricerInputs(args: BondPricerInputs & {
    baseCpi: Decimal;
    indexDate: LocalDate;
    inflationIndexType: IndexTypeProto;
  }): SecurityProto {
    const bond = buildBondDetails(args);
    const tips = new TipsExtensionProto()
      .setBaseCpi(decimalToProto(args.baseCpi))
      .setIndexDate(localDateToProto(args.indexDate))
      .setInflationIndexType(args.inflationIndexType);
    return new SecurityProto()
      .setProductType(ProductTypeProto.TIPS)
      .setBondDetails(bond)
      .setTipsExtension(tips);
  }
}

export default TIPSBond;
