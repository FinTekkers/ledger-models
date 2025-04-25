// Models
import { SecurityProto } from '../../../fintekkers/models/security/security_pb';
import { CouponFrequencyProto } from '../../../fintekkers/models/security/coupon_frequency_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { CouponTypeProto } from '../../../fintekkers/models/security/coupon_type_pb';
import { SecurityTypeProto } from '../../../fintekkers/models/security/security_type_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';

// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';

import * as uuid from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';

import { CreateSecurityResponseProto } from '../../../fintekkers/requests/security/create_security_response_pb';
import { SecurityService } from './SecurityService';
import { PositionFilter } from '../../models/position/positionfilter';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { ProtoSerializationUtil } from '../../models/utils/serialization';

test('test creating a security against the api.fintekkers.org security service', async () => {
  const isTrue = await testSecurity();
  expect(isTrue).toBe(true);
}, 30000);

async function testSecurity(): Promise<boolean> {
  const id_proto = uuid.UUID.random().toUUIDProto();
  const now = dt.ZonedDateTime.now();

  const securityService = new SecurityService();

  let usd_security = await securityService
    .searchSecurity(now.toProto(), new PositionFilter().addEqualsFilter(FieldProto.ASSET_CLASS, 'Cash'))
    .then((securities) => {
      return securities[0];
    });

  const security = new SecurityProto();
  security.setObjectClass('Security');
  security.setVersion('0.0.1');
  security.setUuid(id_proto);
  security.setSettlementCurrency(usd_security.proto);
  security.setAsOf(now.toProto());
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

  const issuance = new IssuanceProto();
  issuance.setPostAuctionOutstandingQuantity(ProtoSerializationUtil.serialize(1000000.00) as DecimalValueProto);
  issuance.setTotalAccepted(ProtoSerializationUtil.serialize(100000000.00) as DecimalValueProto);
  security.addIssuanceInfo(issuance);

  var validationSummary = await securityService.validateCreateSecurity(security);
  expect(validationSummary.getErrorsList().length).toBe(0);

  var createSecurityResponse: CreateSecurityResponseProto = await securityService.createSecurity(security);
  expect(createSecurityResponse.getSecurityResponse()).toBeTruthy();

  var searchResults = await securityService.searchSecurity(now.toProto(), new PositionFilter().addEqualsFilter(FieldProto.ASSET_CLASS, 'Fixed Income'));
  expect(searchResults.length).toBeGreaterThan(0);

  return true;
}
