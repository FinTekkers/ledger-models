"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Issuance_1 = __importDefault(require("./Issuance"));
const issuance_pb_1 = require("../../../fintekkers/models/security/bond/issuance_pb");
const auction_type_pb_1 = require("../../../fintekkers/models/security/bond/auction_type_pb");
const decimal_value_pb_1 = require("../../../fintekkers/models/util/decimal_value_pb");
const local_date_pb_1 = require("../../../fintekkers/models/util/local_date_pb");
const decimal_js_1 = __importDefault(require("decimal.js"));
const jspb = __importStar(require("google-protobuf"));
const decimal_1 = require("../utils/decimal");
function buildProto() {
    const p = new issuance_pb_1.IssuanceProto();
    p.setAuctionIssueDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(2).setDay(15));
    p.setAuctionAnnouncementDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(2).setDay(8));
    p.setAuctionOfferingAmount((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('45000000000')));
    p.setTotalAccepted((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('44999500000')));
    p.setPostAuctionOutstandingQuantity((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('44999500000')));
    p.setMatureSecurityAmount((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('0')));
    p.setPriceForSinglePriceAuction((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('99.875')));
    p.setAuctionType(auction_type_pb_1.AuctionTypeProto.SINGLE_PRICE);
    return p;
}
test('Issuance typed accessors return wrapped values', () => {
    var _a, _b, _c, _d, _e;
    const iss = new Issuance_1.default(buildProto());
    const issueDate = iss.getIssueDate();
    const announcementDate = iss.getAnnouncementDate();
    expect(issueDate).toBeInstanceOf(Date);
    expect(announcementDate).toBeInstanceOf(Date);
    expect(issueDate.getFullYear()).toBe(2023);
    expect(issueDate.getMonth()).toBe(1); // February (0-based)
    expect(issueDate.getDate()).toBe(15);
    expect(announcementDate.getFullYear()).toBe(2023);
    expect(announcementDate.getMonth()).toBe(1);
    expect(announcementDate.getDate()).toBe(8);
    expect((_a = iss.getOriginalFaceValue()) === null || _a === void 0 ? void 0 : _a.toString()).toBe('45000000000');
    expect((_b = iss.getTotalAccepted()) === null || _b === void 0 ? void 0 : _b.toString()).toBe('44999500000');
    expect((_c = iss.getPostAuctionOutstandingQuantity()) === null || _c === void 0 ? void 0 : _c.toString()).toBe('44999500000');
    expect((_d = iss.getMatureSecurityAmount()) === null || _d === void 0 ? void 0 : _d.toString()).toBe('0');
    expect((_e = iss.getPriceForSinglePriceAuction()) === null || _e === void 0 ? void 0 : _e.toString()).toBe('99.875');
    expect(iss.getAuctionType()).toBe(auction_type_pb_1.AuctionTypeProto.SINGLE_PRICE);
});
test('Issuance returns null for unset sub-messages', () => {
    const iss = new Issuance_1.default(new issuance_pb_1.IssuanceProto());
    expect(iss.getIssueDate()).toBeNull();
    expect(iss.getAnnouncementDate()).toBeNull();
    expect(iss.getOriginalFaceValue()).toBeNull();
    expect(iss.getTotalAccepted()).toBeNull();
    expect(iss.getPostAuctionOutstandingQuantity()).toBeNull();
    expect(iss.getMatureSecurityAmount()).toBeNull();
    expect(iss.getPriceForSinglePriceAuction()).toBeNull();
    // enum defaults to zero value
    expect(iss.getAuctionType()).toBe(auction_type_pb_1.AuctionTypeProto.UNKNOWN_AUCTION_TYPE);
});
test('Issuance Decimal returns are Decimal instances (for math)', () => {
    const iss = new Issuance_1.default(buildProto());
    const faceValue = iss.getOriginalFaceValue();
    expect(faceValue).toBeInstanceOf(decimal_js_1.default);
    // smoke: doing arithmetic should work
    expect(faceValue.plus(1).toString()).toBe('45000000001');
});
// LM-365: high_discount_rate (28) is a DecimalValueProto with presence.
// google-protobuf JS has no runtime descriptors: the wire bytes are checked.
test('IssuanceProto.high_discount_rate is field 28, a DecimalValueProto', () => {
    const p = new issuance_pb_1.IssuanceProto();
    p.setHighDiscountRate((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('4.215')));
    const reader = new jspb.BinaryReader(p.serializeBinary());
    expect(reader.nextField()).toBe(true);
    expect(reader.getFieldNumber()).toBe(28);
    expect(reader.getWireType()).toBe(2); // length-delimited
    const decimal = decimal_value_pb_1.DecimalValueProto.deserializeBinary(reader.readBytes());
    expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(decimal))).toBe('4.215');
    expect(reader.nextField()).toBe(false);
});
test('IssuanceProto.high_discount_rate round-trips and is unset by default', () => {
    expect(new issuance_pb_1.IssuanceProto().hasHighDiscountRate()).toBe(false);
    const p = new issuance_pb_1.IssuanceProto();
    p.setHighDiscountRate((0, decimal_1.encodeDecimal)((0, decimal_1.parseDecimalString)('4.215')));
    const parsed = issuance_pb_1.IssuanceProto.deserializeBinary(p.serializeBinary());
    expect(parsed.hasHighDiscountRate()).toBe(true);
    expect((0, decimal_1.toCanonicalString)((0, decimal_1.decodeDecimal)(parsed.getHighDiscountRate()))).toBe('4.215');
});
//# sourceMappingURL=Issuance.test.js.map