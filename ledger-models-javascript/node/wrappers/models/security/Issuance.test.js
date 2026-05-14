"use strict";
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
function buildProto() {
    const p = new issuance_pb_1.IssuanceProto();
    p.setAuctionIssueDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(2).setDay(15));
    p.setAuctionAnnouncementDate(new local_date_pb_1.LocalDateProto().setYear(2023).setMonth(2).setDay(8));
    p.setAuctionOfferingAmount(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('45000000000'));
    p.setTotalAccepted(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('44999500000'));
    p.setPostAuctionOutstandingQuantity(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('44999500000'));
    p.setMatureSecurityAmount(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('0'));
    p.setPriceForSinglePriceAuction(new decimal_value_pb_1.DecimalValueProto().setArbitraryPrecisionValue('99.875'));
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
//# sourceMappingURL=Issuance.test.js.map