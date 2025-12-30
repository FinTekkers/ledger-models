import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { CouponFrequency } from './coupon_frequency';
import { CouponType } from './coupon_type';
import { Tenor, Period } from './term';
import { TenorTypeProto } from '../../../fintekkers/models/security/tenor_type_pb';

class BondSecurity extends Security {
  constructor(proto: SecurityProto) {
    super(proto);
    if (proto.getSecurityType() !== SecurityTypeProto.BOND_SECURITY) {
      throw new Error(
        `BondSecurity requires BOND_SECURITY type, got ${SecurityTypeProto[proto.getSecurityType()]}`
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

  getCouponRate(): DecimalValueProto {
    const rate = this.proto.getCouponRate();
    if (!rate) throw new Error("Coupon rate is required for bonds");
    return rate;
  }

  getFaceValue(): DecimalValueProto {
    const faceValue = this.proto.getFaceValue();
    if (!faceValue) throw new Error("Face value is required for bonds");
    return faceValue;
  }

  getCouponType(): CouponType {
    const couponType = this.proto.getCouponType();
    if (!couponType) throw new Error("Coupon Type is required for bonds");
    return new CouponType(couponType);
  }

  getCouponFrequency(): CouponFrequency {
    const couponFrequency = this.proto.getCouponFrequency();
    if (!couponFrequency) throw new Error("Coupon Frequency is required for bonds");
    return new CouponFrequency(couponFrequency);
  }

  getDatedDate(): LocalDate | undefined {
    const datedDate = this.proto.getDatedDate();
    return datedDate ? new LocalDate(datedDate) : undefined;
  }

  getIssuanceInfo(): IssuanceProto[] {
    return this.proto.getIssuanceInfoList();
  }
}

export default BondSecurity;

