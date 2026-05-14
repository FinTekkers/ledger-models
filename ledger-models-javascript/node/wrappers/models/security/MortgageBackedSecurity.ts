import BondSecurity, {
  BondPricerInputs,
  buildBondDetails,
  decimalToProto,
} from './BondSecurity';
import { SecurityProto, MbsExtensionProto } from '../../../fintekkers/models/security/security_pb';
import { AgencyProto } from '../../../fintekkers/models/security/bond/agency_pb';
import { ProductTypeProto } from '../../../fintekkers/models/security/product_type_pb';
import { Decimal } from 'decimal.js';

/**
 * MBS-specific accessors layered on top of BondSecurity. Pool-level fields
 * (agency, WAC, WAM, pass-through rate, factors, balances, PSA) live in
 * the parallel mbs_extension sub-message; bond_details still carries the
 * canonical coupon/dates/face value.
 */
class MortgageBackedSecurity extends BondSecurity {
  constructor(proto: SecurityProto) {
    super(proto);
  }

  private getMbsExtension(): MbsExtensionProto | undefined {
    return this.proto.getMbsExtension() ?? undefined;
  }

  /** Pool identifier (e.g. "FN AS1234"). */
  getPoolNumber(): string {
    const ext = this.getMbsExtension();
    return ext ? ext.getPoolNumber() : '';
  }

  /** Issuing agency (FNMA / FHLMC / GNMA). */
  getAgency(): AgencyProto {
    const ext = this.getMbsExtension();
    return ext ? ext.getAgency() : AgencyProto.AGENCY_UNKNOWN;
  }

  /** Weighted Average Coupon across underlying loans. */
  getWac(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getWac() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Weighted Average Maturity, in months. */
  getWam(): number {
    const ext = this.getMbsExtension();
    return ext ? ext.getWam() : 0;
  }

  /** Pass-through rate paid to investors (net of servicing/guarantee fees). */
  getPassThroughRate(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getPassThroughRate() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Current pool factor (remaining UPB / original face). */
  getCurrentFactor(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getCurrentFactor() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Original face value at issuance. */
  getOriginalFaceValue(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getOriginalFaceValue() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** Current Unpaid Principal Balance. */
  getCurrentUpb(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getCurrentUpb() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

  /** PSA prepayment speed assumption. */
  getPsaSpeed(): Decimal | null {
    const ext = this.getMbsExtension();
    const v = ext ? ext.getPsaSpeed() : undefined;
    if (!v) return null;
    return new Decimal(v.getArbitraryPrecisionValue());
  }

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
  }): SecurityProto {
    const bond = buildBondDetails(args);
    const mbs = new MbsExtensionProto()
      .setPoolNumber(args.poolNumber)
      .setAgency(args.agency)
      .setWac(decimalToProto(args.wac))
      .setWam(args.wam)
      .setPassThroughRate(decimalToProto(args.passThroughRate))
      .setCurrentFactor(decimalToProto(args.currentFactor))
      .setOriginalFaceValue(decimalToProto(args.originalFaceValue))
      .setCurrentUpb(decimalToProto(args.currentUpb))
      .setPsaSpeed(decimalToProto(args.psaSpeed));
    return new SecurityProto()
      .setProductType(ProductTypeProto.MORTGAGE_BACKED)
      .setBondDetails(bond)
      .setMbsExtension(mbs);
  }
}

export default MortgageBackedSecurity;
