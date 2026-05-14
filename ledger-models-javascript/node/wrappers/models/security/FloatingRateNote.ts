import BondSecurity, {
  BondPricerInputs,
  buildBondDetails,
  decimalToProto,
} from './BondSecurity';
import { SecurityProto, FrnExtensionProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { IndexTypeProto } from '../../../fintekkers/models/security/index/index_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { Decimal } from 'decimal.js';

/**
 * FRN-specific accessors layered on top of BondSecurity. The floating-rate
 * fields live in the parallel frn_extension sub-message; bond_details
 * still carries face value / dates / etc.
 */
class FloatingRateNote extends BondSecurity {
  constructor(proto: SecurityProto) {
    super(proto);
  }

  private getFrnExtension(): FrnExtensionProto | undefined {
    return this.proto.getFrnExtension() ?? undefined;
  }

  /** Spread added on top of the reference rate at each reset. */
  getSpread(): Decimal | null {
    const ext = this.getFrnExtension();
    const v = ext ? ext.getSpread() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Which index the coupon resets off (SOFR on a US TREASURY_FRN). */
  getReferenceRateIndex(): IndexTypeProto {
    const ext = this.getFrnExtension();
    return ext ? ext.getReferenceRateIndex() : IndexTypeProto.UNKNOWN_INDEX_TYPE;
  }

  /** Reset cadence (e.g. QUARTERLY). */
  getResetFrequency(): CouponFrequencyProto {
    const ext = this.getFrnExtension();
    return ext ? ext.getResetFrequency() : CouponFrequencyProto.UNKNOWN_COUPON_FREQUENCY;
  }

  /**
   * Build a fresh SecurityProto for a floating-rate note. product_type is
   * set to TREASURY_FRN so Security.create routes back to this wrapper.
   */
  static fromPricerInputs(args: BondPricerInputs & {
    spread: Decimal;
    referenceRateIndex: IndexTypeProto;
    resetFrequency: CouponFrequencyProto;
  }): SecurityProto {
    const bond = buildBondDetails(args);
    const frn = new FrnExtensionProto()
      .setSpread(decimalToProto(args.spread))
      .setReferenceRateIndex(args.referenceRateIndex)
      .setResetFrequency(args.resetFrequency);
    return new SecurityProto()
      .setProductType(ProductTypeProto.TREASURY_FRN)
      .setBondDetails(bond)
      .setFrnExtension(frn);
  }
}

export default FloatingRateNote;
