import Issuance from './Issuance';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { AuctionTypeProto } from '../../../fintekkers/models/security/bond/auction_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import Decimal from 'decimal.js';
import { encodeDecimal, parseDecimalString } from '../utils/decimal';

function buildProto(): IssuanceProto {
  const p = new IssuanceProto();
  p.setAuctionIssueDate(new LocalDateProto().setYear(2023).setMonth(2).setDay(15));
  p.setAuctionAnnouncementDate(new LocalDateProto().setYear(2023).setMonth(2).setDay(8));
  p.setAuctionOfferingAmount(encodeDecimal(parseDecimalString('45000000000')));
  p.setTotalAccepted(encodeDecimal(parseDecimalString('44999500000')));
  p.setPostAuctionOutstandingQuantity(encodeDecimal(parseDecimalString('44999500000')));
  p.setMatureSecurityAmount(encodeDecimal(parseDecimalString('0')));
  p.setPriceForSinglePriceAuction(encodeDecimal(parseDecimalString('99.875')));
  p.setAuctionType(AuctionTypeProto.SINGLE_PRICE);
  return p;
}

test('Issuance typed accessors return wrapped values', () => {
  const iss = new Issuance(buildProto());
  const issueDate = iss.getIssueDate();
  const announcementDate = iss.getAnnouncementDate();
  expect(issueDate).toBeInstanceOf(Date);
  expect(announcementDate).toBeInstanceOf(Date);
  expect(issueDate!.getFullYear()).toBe(2023);
  expect(issueDate!.getMonth()).toBe(1); // February (0-based)
  expect(issueDate!.getDate()).toBe(15);
  expect(announcementDate!.getFullYear()).toBe(2023);
  expect(announcementDate!.getMonth()).toBe(1);
  expect(announcementDate!.getDate()).toBe(8);
  expect(iss.getOriginalFaceValue()?.toString()).toBe('45000000000');
  expect(iss.getTotalAccepted()?.toString()).toBe('44999500000');
  expect(iss.getPostAuctionOutstandingQuantity()?.toString()).toBe('44999500000');
  expect(iss.getMatureSecurityAmount()?.toString()).toBe('0');
  expect(iss.getPriceForSinglePriceAuction()?.toString()).toBe('99.875');
  expect(iss.getAuctionType()).toBe(AuctionTypeProto.SINGLE_PRICE);
});

test('Issuance returns null for unset sub-messages', () => {
  const iss = new Issuance(new IssuanceProto());
  expect(iss.getIssueDate()).toBeNull();
  expect(iss.getAnnouncementDate()).toBeNull();
  expect(iss.getOriginalFaceValue()).toBeNull();
  expect(iss.getTotalAccepted()).toBeNull();
  expect(iss.getPostAuctionOutstandingQuantity()).toBeNull();
  expect(iss.getMatureSecurityAmount()).toBeNull();
  expect(iss.getPriceForSinglePriceAuction()).toBeNull();
  // enum defaults to zero value
  expect(iss.getAuctionType()).toBe(AuctionTypeProto.UNKNOWN_AUCTION_TYPE);
});

test('Issuance Decimal returns are Decimal instances (for math)', () => {
  const iss = new Issuance(buildProto());
  const faceValue = iss.getOriginalFaceValue();
  expect(faceValue).toBeInstanceOf(Decimal);
  // smoke: doing arithmetic should work
  expect(faceValue!.plus(1).toString()).toBe('45000000001');
});
