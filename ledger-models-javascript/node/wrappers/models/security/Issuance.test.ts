import Issuance from './Issuance';
import { IssuanceProto } from '../../../fintekkers/models/security/bond/issuance_pb';
import { AuctionTypeProto } from '../../../fintekkers/models/security/bond/auction_type_pb';
import { DecimalValueProto } from '../../../fintekkers/models/util/decimal_value_pb';
import { LocalDateProto } from '../../../fintekkers/models/util/local_date_pb';
import Decimal from 'decimal.js';
import * as jspb from 'google-protobuf';
import { decodeDecimal, encodeDecimal, parseDecimalString, toCanonicalString } from '../utils/decimal';

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

// LM-365: high_discount_rate (28) is a DecimalValueProto with presence.
// google-protobuf JS has no runtime descriptors: the wire bytes are checked.
test('IssuanceProto.high_discount_rate is field 28, a DecimalValueProto', () => {
  const p = new IssuanceProto();
  p.setHighDiscountRate(encodeDecimal(parseDecimalString('4.215')));
  const reader = new jspb.BinaryReader(p.serializeBinary());
  expect(reader.nextField()).toBe(true);
  expect(reader.getFieldNumber()).toBe(28);
  expect(reader.getWireType()).toBe(2); // length-delimited
  const decimal = DecimalValueProto.deserializeBinary(reader.readBytes());
  expect(toCanonicalString(decodeDecimal(decimal))).toBe('4.215');
  expect(reader.nextField()).toBe(false);
});

test('IssuanceProto.high_discount_rate round-trips and is unset by default', () => {
  expect(new IssuanceProto().hasHighDiscountRate()).toBe(false);

  const p = new IssuanceProto();
  p.setHighDiscountRate(encodeDecimal(parseDecimalString('4.215')));
  const parsed = IssuanceProto.deserializeBinary(p.serializeBinary());

  expect(parsed.hasHighDiscountRate()).toBe(true);
  expect(toCanonicalString(decodeDecimal(parsed.getHighDiscountRate()!))).toBe('4.215');
});

// LM-367: MULTIPLE_PRICE added; the existing values keep their numbers.
test('AuctionTypeProto values', () => {
  expect(AuctionTypeProto.UNKNOWN_AUCTION_TYPE).toBe(0);
  expect(AuctionTypeProto.SINGLE_PRICE).toBe(1);
  expect(AuctionTypeProto.MULTIPLE_PRICE).toBe(2);
});

test('MULTIPLE_PRICE round-trips through the wrapper', () => {
  const p = new IssuanceProto();
  p.setAuctionType(AuctionTypeProto.MULTIPLE_PRICE);
  const parsed = IssuanceProto.deserializeBinary(p.serializeBinary());

  expect(new Issuance(parsed).getAuctionType()).toBe(AuctionTypeProto.MULTIPLE_PRICE);
});

// Field 24, varint 99: a value no binding knows. Stands in for an old
// binding reading MULTIPLE_PRICE (2); proto3 enums are open.
test('unknown auction type parses and keeps the raw value', () => {
  const proto = IssuanceProto.deserializeBinary(new Uint8Array([0xc0, 0x01, 0x63]));

  expect(proto.getAuctionType()).toBe(99);
  expect(new Issuance(proto).getAuctionType()).toBe(99);
});
