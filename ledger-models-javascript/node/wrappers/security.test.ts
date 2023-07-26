// Models
import { SecurityProto } from '../fintekkers/models/security/security_pb';
import { CouponFrequencyProto } from '../fintekkers/models/security/coupon_frequency_pb';
import { DecimalValueProto } from '../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../fintekkers/models/security/coupon_type_pb';
import { SecurityTypeProto } from '../fintekkers/models/security/security_type_pb';
import { LocalDateProto } from '../fintekkers/models/util/local_date_pb';

// Model Utils
import { FieldProto } from '../fintekkers/models/position/field_pb';

import * as uuid from './models/utils/uuid';
import * as dt from './models/utils/datetime';

import { CreateSecurityResponseProto } from '../fintekkers/requests/security/create_security_response_pb';
import { SecurityService } from './services/security-service/SecurityService';

async function testSecurity(): Promise<void> {
  const id_proto = uuid.UUID.random().to_uuid_proto();
  const now = dt.ZonedDateTime.now();

  const securityService = new SecurityService();

  let usd_security = await securityService
    .searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Cash')
    .then((securities) => {
      return securities[0];
    });

  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(id_proto);
  security.setSettlementCurrency(usd_security);
  security.setAsOf(now.to_date_proto());
  security.setAssetClass('FixedIncome');
  security.setCouponFrequency(CouponFrequencyProto.SEMIANNUALLY);
  security.setCouponType(CouponTypeProto.FIXED);
  security.setSecurityType(SecurityTypeProto.BOND_SECURITY);

  const faceValue = new DecimalValueProto();
  faceValue.setArbitraryPrecisionValue('1000.00');
  security.setFaceValue(faceValue);

  const couponRate = new DecimalValueProto();
  couponRate.setArbitraryPrecisionValue('0.05');
  security.setCouponRate(couponRate); // Fixed a typo here. It was security.setFaceValue(couponRate);

  const issueDate = new LocalDateProto();
  issueDate.setYear(2023);
  issueDate.setMonth(1);
  issueDate.setDay(1);
  security.setIssueDate(issueDate);
  security.setDatedDate(issueDate);

  const maturityDate = new LocalDateProto();
  maturityDate.setYear(2033); //10Y
  maturityDate.setMonth(1);
  maturityDate.setDay(1);
  security.setMaturityDate(maturityDate);

  security.setIssuerName('US Treasury');
  security.setDescription('Dummy US Treasury 10Y Bond');

  var validationSummary = await securityService.validateCreateSecurity(security);
  console.log(validationSummary);

  var createSecurityResponse:CreateSecurityResponseProto = await securityService.createSecurity(security);
  console.log(createSecurityResponse);

  var searchResults = await securityService.searchSecurity(now.to_date_proto(), FieldProto.ASSET_CLASS, 'Fixed Income');
  console.log('There are %d securities in this response', searchResults.length);
}

export { testSecurity };
