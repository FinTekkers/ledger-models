import Security from './security';
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { LocalDate } from '../utils/date';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';

class BondSecurity extends Security {
  constructor(proto: SecurityProto) {
    super(proto);
    if (proto.getSecurityType() !== SecurityTypeProto.BOND_SECURITY) {
      throw new Error(
        `BondSecurity requires BOND_SECURITY type, got ${SecurityTypeProto[proto.getSecurityType()]}`
      );
    }
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

  getCouponType(): CouponTypeProto {
    return this.proto.getCouponType();
  }

  getCouponFrequency(): CouponFrequencyProto {
    return this.proto.getCouponFrequency();
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

