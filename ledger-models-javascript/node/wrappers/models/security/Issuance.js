"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("../utils/date");
const decimal_js_1 = __importDefault(require("decimal.js"));
/**
 * Typed wrapper around a single IssuanceProto. Returns null for unset
 * sub-messages and Decimal/Date for populated ones — callers no longer
 * have to spell out the proto / Decimal coercions at every call site.
 *
 * Note: IssuanceProto has no `dated_date` or `auction_date` field on the
 * proto today, so those accessors are intentionally absent.
 */
class Issuance {
    constructor(proto) {
        this.proto = proto;
    }
    static _toDecimal(value) {
        if (!value)
            return null;
        return new decimal_js_1.default(value.getArbitraryPrecisionValue());
    }
    /** Auction issue (settlement) date. Null if unset. */
    getIssueDate() {
        return (0, date_1.localDateProtoToDate)(this.proto.getAuctionIssueDate());
    }
    /** Auction announcement date. Null if unset. */
    getAnnouncementDate() {
        return (0, date_1.localDateProtoToDate)(this.proto.getAuctionAnnouncementDate());
    }
    /** Auction offering amount (original face value offered). Null if unset. */
    getOriginalFaceValue() {
        return Issuance._toDecimal(this.proto.getAuctionOfferingAmount());
    }
    /** Total quantity accepted at auction. Null if unset. */
    getTotalAccepted() {
        return Issuance._toDecimal(this.proto.getTotalAccepted());
    }
    /** Outstanding quantity after auction settles. Null if unset. */
    getPostAuctionOutstandingQuantity() {
        return Issuance._toDecimal(this.proto.getPostAuctionOutstandingQuantity());
    }
    /** Quantity of the mature security used in reopenings. Null if unset. */
    getMatureSecurityAmount() {
        return Issuance._toDecimal(this.proto.getMatureSecurityAmount());
    }
    /** Single-price auction clearing price. Null if unset (e.g., multi-price). */
    getPriceForSinglePriceAuction() {
        return Issuance._toDecimal(this.proto.getPriceForSinglePriceAuction());
    }
    /** Auction type enum (defaults to UNKNOWN_AUCTION_TYPE if unset). */
    getAuctionType() {
        return this.proto.getAuctionType();
    }
}
exports.default = Issuance;
//# sourceMappingURL=Issuance.js.map