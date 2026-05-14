import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { ProductTypeProto } from "../../../fintekkers/models/security/product_type_pb";
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
import { Tenor, Period } from './term';
import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';
import { Decimal } from 'decimal.js';
import { isDescendantOf } from './product_hierarchy';

class BondSecurity extends Security {
  constructor(proto: SecurityProto) {
    super(proto);
    // Bond-shape membership uses the registry: any product_type that is
    // a descendant of "BOND" in hierarchy.json (TBILL, TREASURY_NOTE,
    // TREASURY_BOND, TIPS, TREASURY_FRN, STRIPS, SOVEREIGN_BOND,
    // CORP_BOND, MUNI_BOND, plus future planned leaves under
    // CREDIT_BOND / STRUCTURED_BOND) is accepted.
    const ptName = (Object.keys(ProductTypeProto) as Array<keyof typeof ProductTypeProto>)
      .find(k => ProductTypeProto[k] === proto.getProductType());
    if (!ptName || !isDescendantOf(ptName as string, 'BOND')) {
      throw new Error(
        `BondSecurity requires a bond-shape product type (descendant of BOND in hierarchy.json), got ${ptName ?? 'unknown'}`
      );
    }
  }

  /** Returns the tenor (term) of the bond as a Tenor object.
   * 
   * If an 'as of date' is provided the term will be based on 
   * maturity date - as of date, instead of maturity date - issue date.
   * @param asOfDate - [Optional]The 'as of date' to use for the tenor calculation.
   * @returns The tenor (term) of the bond as a Tenor object.
   */
  getTenor(asOfDate?: Date): Tenor {
    const startDate = asOfDate ? asOfDate : this.getIssueDate().toDate();
    const maturityDate = this.getMaturityDate().toDate();

    // Calculate the period between issue date and maturity date
    const period = this.calculatePeriod(startDate, maturityDate);

    return new Tenor(TenorTypeProto.TERM, period);
  }

  /**
   * Calculates the period between two dates in years, months, and days.
   * This method handles month and year boundaries correctly.
   */
  private calculatePeriod(startDate: Date, endDate: Date): Period {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust for negative days (e.g., if end day is before start day)
    if (days < 0) {
      months--;
      // Get the number of days in the previous month
      const lastDayOfPrevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
      days += lastDayOfPrevMonth;
    }

    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }

    return {
      years,
      months,
      days
    };
  }

  // v0.4.0: bond fields live exclusively in bond_details; flat-field
  // fallback removed.

  getCouponRate(): DecimalValueProto {
    const bond = this.getBondLikeDetails();
    const rate = bond ? bond.getCouponRate() : undefined;
    if (!rate) throw new Error("Coupon rate is required for bonds");
    return rate;
  }

  getFaceValue(): DecimalValueProto {
    const bond = this.getBondLikeDetails();
    const faceValue = bond ? bond.getFaceValue() : undefined;
    if (!faceValue) throw new Error("Face value is required for bonds");
    return faceValue;
  }

  getCouponType(): CouponType {
    const bond = this.getBondLikeDetails();
    const couponType = bond ? bond.getCouponType() : undefined;
    if (couponType === undefined) throw new Error("Coupon Type is required for bonds");
    return new CouponType(couponType);
  }

  getCouponFrequency(): CouponFrequency {
    const bond = this.getBondLikeDetails();
    const couponFrequency = bond ? bond.getCouponFrequency() : undefined;
    if (couponFrequency === undefined) throw new Error("Coupon Frequency is required for bonds");
    return new CouponFrequency(couponFrequency);
  }

  getDatedDate(): LocalDate | undefined {
    const bond = this.getBondLikeDetails();
    const datedDate = bond ? bond.getDatedDate() : undefined;
    return datedDate ? new LocalDate(datedDate) : undefined;
  }

  getIssuanceInfo(): IssuanceProto[] {
    const bond = this.getBondLikeDetails();
    return bond ? bond.getIssuanceInfoList() : [];
  }

  /**
   * Returns the price scale factor for bonds.
   * Bonds are typically priced as percentages (e.g., 99.5 means 99.5%),
   * so the price scale factor converts percentage to decimal (0.01).
   * @returns The price scale factor as a Decimal (0.01)
   */
  getPriceScaleFactor(): Decimal {
    return new Decimal('0.01');
  }

  /**
   * Bond issue date is the auction date and is required for bonds.
   * Overrides Security.getIssueDate (which returns LocalDate | null on the
   * base) with a non-nullable return type — for a properly-formed bond,
   * issue date is always present, and TS callers narrowed via isBond()
   * shouldn't have to null-check.
   */
  getIssueDate(): LocalDate {
    const date = super.getIssueDate();
    if (!date) throw new Error("Issue date is required for bonds");
    return date;
  }

  getProductType(): string {
    // Only BondSecurity has getTenor implemented
    // Check if getTenor method exists (it's only in BondSecurity)
    if (typeof (this as any).getTenor !== 'function') {
      throw new Error('getProductType() is only supported for BondSecurity');
    }

    const tenor = (this as any).getTenor();
    if (!tenor) {
      throw new Error('Tenor is required to determine product type');
    }

    const period = tenor.getTenor();
    if (!period) {
      throw new Error('Period is required to determine product type');
    }

    const years = period.years;
    const months = period.months;

    if (years < 1 || (years === 1 && months === 0)) {
      return 'BILL';
    } else if (years > 19) {
      return 'BOND';
    } else {
      return 'NOTE';
    }
  }
}

export default BondSecurity;

